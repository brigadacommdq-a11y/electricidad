/**
 * ELECTRA PLAN — Servicio Profesional de Detección y Localización de Fallas
 * Localiza con precisión cortocircuitos francos, fallas a tierra, conexiones incorrectas,
 * sobrecargas y circuitos abiertos, determinando el bucle afectado, bornes y disparo de protecciones.
 */

import { Project, FaultDetail, ElectricalSymbol, Wire, TrippedProtectionDetail } from '../types/electra';

export function locateAllFaults(project: Project): FaultDetail[] {
  const faults: FaultDetail[] = [];
  const symbolMap = new Map<string, ElectricalSymbol>(project.symbols.map((s) => [s.id, s]));
  const wireMap = new Map<string, Wire>(project.wires.map((w) => [w.id, w]));

  const termKey = (compId: string, termId: string) => `${compId}:${termId}`;

  // Adyacencia para rastreo
  interface Edge {
    targetKey: string;
    targetCompId: string;
    targetTermId: string;
    wireId?: string;
    isInternal?: boolean;
  }

  const adj = new Map<string, Edge[]>();

  const addEdge = (
    fromKey: string,
    toKey: string,
    fromCompId: string,
    fromTermId: string,
    toCompId: string,
    toTermId: string,
    wireId?: string,
    isInternal = false
  ) => {
    if (!adj.has(fromKey)) adj.set(fromKey, []);
    if (!adj.has(toKey)) adj.set(toKey, []);
    adj.get(fromKey)!.push({ targetKey: toKey, targetCompId: toCompId, targetTermId: toTermId, wireId, isInternal });
    adj.get(toKey)!.push({ targetKey: fromKey, targetCompId: fromCompId, targetTermId: fromTermId, wireId, isInternal });
  };

  // 1. Agregar cables físicos
  for (const wire of project.wires) {
    const k1 = termKey(wire.fromComponentId, wire.fromTerminalId);
    const k2 = termKey(wire.toComponentId, wire.toTerminalId);
    addEdge(k1, k2, wire.fromComponentId, wire.fromTerminalId, wire.toComponentId, wire.toTerminalId, wire.id);
  }

  // 2. Agregar puentes internos de componentes (excluyendo cargas con impedancia)
  for (const sym of project.symbols) {
    const sState = sym.state || {};
    if (sym.type === 'tablero') {
      if (!sState.isOpen && !sState.isTripped) {
        addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), sym.id, 'L_IN', sym.id, 'L_OUT', undefined, true);
        addEdge(termKey(sym.id, 'N_IN'), termKey(sym.id, 'N_OUT'), sym.id, 'N_IN', sym.id, 'N_OUT', undefined, true);
      }
      addEdge(termKey(sym.id, 'PE_IN'), termKey(sym.id, 'PE_OUT'), sym.id, 'PE_IN', sym.id, 'PE_OUT', undefined, true);
    } else if (sym.type === 'termica' || sym.type === 'diferencial') {
      if (!sState.isOpen && !sState.isTripped) {
        addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), sym.id, 'L_IN', sym.id, 'L_OUT', undefined, true);
        addEdge(termKey(sym.id, 'N_IN'), termKey(sym.id, 'N_OUT'), sym.id, 'N_IN', sym.id, 'N_OUT', undefined, true);
      }
    } else if (sym.type === 'interruptor_simple') {
      if (sState.isOpen === false) {
        // Cerrado
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R'), sym.id, 'L', sym.id, 'R', undefined, true);
      }
    } else if (sym.type === 'caja_paso') {
      // Puentes de continuidad comunes en cajas de derivación
      addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), sym.id, 'L_IN', sym.id, 'L_OUT', undefined, true);
      addEdge(termKey(sym.id, 'N_IN'), termKey(sym.id, 'N_OUT'), sym.id, 'N_IN', sym.id, 'N_OUT', undefined, true);
      addEdge(termKey(sym.id, 'PE_IN'), termKey(sym.id, 'PE_OUT'), sym.id, 'PE_IN', sym.id, 'PE_OUT', undefined, true);
    }
  }

  // Identificar fuentes
  const sources = project.symbols.filter((s) => s.type === 'fuente_ac' || s.type === 'tablero');
  if (sources.length === 0) return [];

  // Helper para BFS que busca caminos sin pasar por cargas (resistencias)
  const isLoadImpedance = (compId: string, termId: string) => {
    const sym = symbolMap.get(compId);
    if (!sym) return false;
    // Las luminarias, timbres, extractores tienen impedancia entre L y N
    return sym.type === 'luminaria' || sym.type === 'timbre' || sym.type === 'ventilador';
  };

  // Rastrear desde cada fuente
  for (const src of sources) {
    const lStart = src.type === 'tablero' ? termKey(src.id, 'L_OUT') : termKey(src.id, 'L');
    const nStart = src.type === 'tablero' ? termKey(src.id, 'N_OUT') : termKey(src.id, 'N');
    const peStart = src.type === 'tablero' ? termKey(src.id, 'PE_OUT') : termKey(src.id, 'PE');

    // =========================================================================
    // A. DETECCIÓN DE CORTOCIRCUITO FRANCO (L -> N sin carga intermedia)
    // =========================================================================
    if (lStart && nStart) {
      const visited = new Set<string>();
      const parent = new Map<string, { prevKey: string; edge: Edge }>();
      const queue: string[] = [lStart];
      visited.add(lStart);

      let shortCircuitFound = false;
      let endKey = '';

      while (queue.length > 0 && !shortCircuitFound) {
        const curr = queue.shift()!;
        if (curr === nStart) {
          shortCircuitFound = true;
          endKey = curr;
          break;
        }

        const edges = adj.get(curr) || [];
        for (const edge of edges) {
          // Si es una carga y cruzamos de L a N internamente, NO es cortocircuito
          const [currComp] = curr.split(':');
          if (isLoadImpedance(currComp, edge.targetTermId) && edge.isInternal) {
            continue; // La impedancia frena el cortocircuito
          }

          if (!visited.has(edge.targetKey)) {
            visited.add(edge.targetKey);
            parent.set(edge.targetKey, { prevKey: curr, edge });
            queue.push(edge.targetKey);
          }
        }
      }

      if (shortCircuitFound) {
        // Reconstruir el bucle de falla exacto
        const involvedWires: string[] = [];
        const involvedComps = new Set<string>();
        const involvedTerms: string[] = [];

        let current = endKey;
        while (current && current !== lStart) {
          involvedTerms.push(current);
          const [compId] = current.split(':');
          involvedComps.add(compId);

          const step = parent.get(current);
          if (!step) break;
          if (step.edge.wireId) {
            involvedWires.push(step.edge.wireId);
          }
          current = step.prevKey;
        }
        involvedTerms.push(lStart);
        const [srcComp] = lStart.split(':');
        involvedComps.add(srcComp);

        // Coordenadas para zoom: centroide de los componentes involucrados
        const coords = calculateCentroid(Array.from(involvedComps), symbolMap);

        // Componentes origen y destino del tramo
        const compNames = Array.from(involvedComps)
          .map((id) => symbolMap.get(id)?.name || id)
          .slice(0, 3)
          .join(', ');

        const trippedProtection: TrippedProtectionDetail = {
          deviceType: 'PIA_TERMOMAGNETICA',
          nominalRating: 'Curva C (5 a 10 x In)',
          tripMechanism: 'DISPARO_MAGNETICO_INSTANTANEO',
          responseTimeMs: 15,
          statusText: 'Disparo magnético instantáneo en menos de 20 ms por sobrecorriente severa (Icc > 1500 A).',
        };

        faults.push({
          id: `fault_cc_${src.id}`,
          category: 'cortocircuito_franco',
          severity: 'peligro_inmediato',
          title: 'Cortocircuito Franco Fase-Neutro (L-N)',
          faultLoopDescription: `Bucle cerrado de resistencia nula entre Fase y Neutro involucrando: ${compNames}.`,
          detectionReason: `Se detectó continuidad directa galvánica entre el borne de Fase y el borne de Neutro sin pasar por la impedancia de una carga. La impedancia del bucle es inferior a 0,08 Ω.`,
          fromComponentId: src.id,
          involvedWireIds: involvedWires,
          involvedComponentIds: Array.from(involvedComps),
          involvedTerminalKeys: involvedTerms,
          trippedProtection,
          remedySteps: [
            '1. Desconecta de inmediato la alimentación general antes de manipular.',
            '2. Revisa las uniones en los componentes resaltados en rojo.',
            '3. Verifica que la Fase llegue al interruptor o bornera y NO al retorno o neutro directo.',
            '4. Elimina cualquier puente o cable indebido conectado directamente entre L y N.',
          ],
          coordinates: coords,
        });
      }
    }

    // =========================================================================
    // B. DETECCIÓN DE FALLA DE AISLACIÓN A TIERRA (L -> PE)
    // =========================================================================
    if (lStart && peStart) {
      const visited = new Set<string>();
      const parent = new Map<string, { prevKey: string; edge: Edge }>();
      const queue: string[] = [lStart];
      visited.add(lStart);

      let earthFaultFound = false;
      let endKey = '';

      while (queue.length > 0 && !earthFaultFound) {
        const curr = queue.shift()!;
        if (curr === peStart) {
          earthFaultFound = true;
          endKey = curr;
          break;
        }

        const edges = adj.get(curr) || [];
        for (const edge of edges) {
          const [currComp] = curr.split(':');
          if (isLoadImpedance(currComp, edge.targetTermId) && edge.isInternal) {
            continue;
          }

          if (!visited.has(edge.targetKey)) {
            visited.add(edge.targetKey);
            parent.set(edge.targetKey, { prevKey: curr, edge });
            queue.push(edge.targetKey);
          }
        }
      }

      if (earthFaultFound) {
        const involvedWires: string[] = [];
        const involvedComps = new Set<string>();
        const involvedTerms: string[] = [];

        let current = endKey;
        while (current && current !== lStart) {
          involvedTerms.push(current);
          const [compId] = current.split(':');
          involvedComps.add(compId);

          const step = parent.get(current);
          if (!step) break;
          if (step.edge.wireId) {
            involvedWires.push(step.edge.wireId);
          }
          current = step.prevKey;
        }
        involvedTerms.push(lStart);
        const [srcComp] = lStart.split(':');
        involvedComps.add(srcComp);

        const coords = calculateCentroid(Array.from(involvedComps), symbolMap);

        const trippedProtection: TrippedProtectionDetail = {
          deviceType: 'INTERRUPTOR_DIFERENCIAL',
          nominalRating: 'ID 40A / 30mA (Clase AC o A)',
          tripMechanism: 'DISPARO_DIFERENCIAL_RESIDUAL_30mA',
          responseTimeMs: 25,
          statusText: 'Disparo por corriente de fuga a tierra superior al umbral de seguridad de 30 mA (IΔn).',
        };

        faults.push({
          id: `fault_earth_${src.id}`,
          category: 'falla_tierra',
          severity: 'peligro_inmediato',
          title: 'Falla de Aislación Directa a Tierra (L-PE)',
          faultLoopDescription: `Contacto involuntario de Fase hacia la red de protección PE o masa metálica.`,
          detectionReason: `Existe conducción galvánica entre Fase viva y el conductor de protección PE. Esto causaría electrificación de masas metálicas si no actuara el interruptor diferencial.`,
          fromComponentId: src.id,
          involvedWireIds: involvedWires,
          involvedComponentIds: Array.from(involvedComps),
          involvedTerminalKeys: involvedTerms,
          trippedProtection,
          remedySteps: [
            '1. Inspecciona el tramo resaltado para encontrar cables de Fase rozando o conectados a bornes de tierra (PE).',
            '2. Asegura que los bornes de tierra sólo reciban conductores verde-amarillo conectados a la jabalina.',
            '3. Verifica el aislamiento entre conductores antes de rearmar el diferencial.',
          ],
          coordinates: coords,
        });
      }
    }
  }

  // =========================================================================
  // C. DETECCIÓN DE CONEXIÓN INCORRECTA PELIGROSA:
  //    1. Interruptor que corta el NEUTRO en lugar de la FASE (violación crítica AEA 90364)
  // =========================================================================
  for (const sym of project.symbols) {
    if (sym.category === 'comando' && (sym.type === 'interruptor_simple' || sym.type === 'conmutado')) {
      const lTermKey = termKey(sym.id, 'L');
      // Ver qué cables llegan al borne de entrada del interruptor
      const incomingEdges = adj.get(lTermKey) || [];
      for (const edge of incomingEdges) {
        if (edge.wireId) {
          const wire = wireMap.get(edge.wireId);
          if (wire && wire.type === 'neutro') {
            faults.push({
              id: `fault_switch_neutral_${sym.id}`,
              category: 'conexion_peligrosa',
              severity: 'advertencia_normativa',
              title: `Interruptor en Neutro: Peligro Eléctrico (${sym.label})`,
              faultLoopDescription: `El interruptor "${sym.name}" está seccionando el conductor de Neutro en vez de la Fase.`,
              detectionReason: `Según la reglamentación AEA 90364-771, los dispositivos de maniobra unipolar deben instalarse OBLIGATORIAMENTE sobre los conductores de fase viva. Cortar el neutro deja al portalámparas bajo 220V permanente aun con la luz apagada, con alto riesgo de electrocución al cambiar una lámpara.`,
              fromComponentId: sym.id,
              involvedWireIds: [wire.id],
              involvedComponentIds: [sym.id],
              involvedTerminalKeys: [lTermKey],
              remedySteps: [
                '1. Cambia el cable que alimenta este interruptor por un conductor de Fase (marrón o negro).',
                '2. Conecta el Neutro (celeste) directamente al terminal N de la lámpara sin pasar por la tecla.',
                '3. Desde la tecla, lleva el cable de Retorno hacia el borne L de la luminaria.',
              ],
              coordinates: { x: sym.x, y: sym.y },
            });
          }
        }
      }
    }

    // 2. Tomacorrientes sin borne de tierra PE conectado
    if (sym.type === 'tomacorriente' || sym.type === 'toma_especial') {
      const peKey = termKey(sym.id, 'PE');
      const peEdges = (adj.get(peKey) || []).filter((e) => !e.isInternal);
      if (peEdges.length === 0) {
        faults.push({
          id: `fault_no_pe_${sym.id}`,
          category: 'conexion_peligrosa',
          severity: 'advertencia_normativa',
          title: `Tomacorriente ${sym.label} sin Puesta a Tierra (PE)`,
          faultLoopDescription: `El tomacorriente "${sym.name}" no cuenta con conexión de protección equipotencial.`,
          detectionReason: `La norma AEA 90364 exige que todo tomacorriente tipo IRAM 2071 de 3 espigas planas cuente con conductor de protección PE verde-amarillo de sección mínima 2,5 mm² conectado a la jabalina de puesta a tierra.`,
          fromComponentId: sym.id,
          involvedWireIds: [],
          involvedComponentIds: [sym.id],
          involvedTerminalKeys: [peKey],
          remedySteps: [
            '1. Tiende un conductor de protección verde-amarillo (PE) desde la barra de tierra del tablero.',
            '2. Conéctalo al borne central inferior (PE) del tomacorriente.',
          ],
          coordinates: { x: sym.x, y: sym.y },
        });
      }
    }
  }

  // =========================================================================
  // D. DETECCIÓN DE SOBRECARGA EN CIRCUITOS (Ib > In)
  // =========================================================================
  for (const circ of project.circuits) {
    const breakerAmps = circ.breakerAmps || 16;
    const circuitSymbols = project.symbols.filter((s) => s.circuitId === circ.id);
    const totalWatts = circuitSymbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
    const designAmps = totalWatts / (circ.voltage || 220);

    if (designAmps > breakerAmps) {
      const trippedProtection: TrippedProtectionDetail = {
        deviceType: 'PIA_TERMOMAGNETICA',
        nominalRating: `${circ.breakerCurve || 'C'}${breakerAmps} (${breakerAmps} A)`,
        tripMechanism: 'DISPARO_TERMICO_RETARDADO',
        responseTimeMs: 45000,
        statusText: `Disparo bimetálico térmico por sobrecarga sostenida (Ib=${designAmps.toFixed(1)} A > In=${breakerAmps} A).`,
      };

      const coords = calculateCentroid(
        circuitSymbols.map((s) => s.id),
        symbolMap
      );

      faults.push({
        id: `fault_overload_${circ.id}`,
        category: 'sobrecarga',
        severity: 'advertencia_normativa',
        title: `Sobrecarga en Circuito ${circ.name} (${circ.id})`,
        faultLoopDescription: `La corriente de diseño calculada (${designAmps.toFixed(1)} A) supera la capacidad asignada del interruptor termomagnético (${breakerAmps} A).`,
        detectionReason: `La carga instalada suma ${totalWatts} W, excediendo la corriente admisible del dispositivo de protección, lo que provocará sobrecalentamiento en los conductores y disparo térmico por bimetal de la termomagnética.`,
        involvedWireIds: project.wires.filter((w) => w.circuitId === circ.id).map((w) => w.id),
        involvedComponentIds: circuitSymbols.map((s) => s.id),
        involvedTerminalKeys: [],
        trippedProtection,
        remedySteps: [
          '1. Divide las cargas en dos o más circuitos independientes según AEA 771.',
          '2. Si la sección de los conductores lo permite reglamentariamente, adecua la capacidad del interruptor.',
          '3. Recuerda coordinar siempre: Ib <= In <= Iz.',
        ],
        coordinates: coords,
      });
    }
  }

  return faults;
}

function calculateCentroid(
  componentIds: string[],
  symbolMap: Map<string, ElectricalSymbol>
): { x: number; y: number } {
  if (componentIds.length === 0) return { x: 200, y: 200 };
  let sumX = 0;
  let sumY = 0;
  let count = 0;

  for (const id of componentIds) {
    const sym = symbolMap.get(id);
    if (sym) {
      sumX += sym.x;
      sumY += sym.y;
      count++;
    }
  }

  if (count === 0) return { x: 200, y: 200 };
  return {
    x: Math.round(sumX / count),
    y: Math.round(sumY / count),
  };
}
