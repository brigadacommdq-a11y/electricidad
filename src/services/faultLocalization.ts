/**
 * ELECTRA PLAN — Servicio Profesional de Detección y Localización de Fallas
 * Localiza con precisión cortocircuitos francos, fallas a tierra, conexiones incorrectas,
 * sobrecargas reales y circuitos abiertos, determinando el bucle afectado, bornes y disparo de protecciones.
 * Cumple estrictamente con la reglamentación AEA 90364 e IRAM 2183.
 */

import { Project, FaultDetail, ElectricalSymbol, Wire, TrippedProtectionDetail } from '../types/electra';

export function locateAllFaults(project: Project): FaultDetail[] {
  const faults: FaultDetail[] = [];
  const symbolMap = new Map<string, ElectricalSymbol>(project.symbols.map((s) => [s.id, s]));
  const wireMap = new Map<string, Wire>(project.wires.map((w) => [w.id, w]));

  const termKey = (compId: string, termId: string) => `${compId}:${termId}`;

  // Adyacencia para rastreo topológico
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

  // 1. Agregar cables físicos instalados
  for (const wire of project.wires) {
    const k1 = termKey(wire.fromComponentId, wire.fromTerminalId);
    const k2 = termKey(wire.toComponentId, wire.toTerminalId);
    addEdge(k1, k2, wire.fromComponentId, wire.fromTerminalId, wire.toComponentId, wire.toTerminalId, wire.id);
  }

  // 2. Agregar puentes internos de componentes según estado operativo
  for (const sym of project.symbols) {
    const sState = sym.state || {};
    if (sym.type === 'tablero') {
      if (!sState.isOpen && !sState.isTripped) {
        addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), sym.id, 'L_IN', sym.id, 'L_OUT', undefined, true);
        addEdge(termKey(sym.id, 'N_IN'), termKey(sym.id, 'N_OUT'), sym.id, 'N_IN', sym.id, 'N_OUT', undefined, true);
      }
      addEdge(termKey(sym.id, 'PE_IN'), termKey(sym.id, 'PE_OUT'), sym.id, 'PE_IN', sym.id, 'PE_OUT', undefined, true);
    } else if (sym.type === 'termica' || sym.type === 'diferencial' || sym.type === 'interruptor_general') {
      // Dispositivos de corte: Solo conducen si NO están abiertos ni disparados
      if (!sState.isOpen && !sState.isTripped) {
        addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), sym.id, 'L_IN', sym.id, 'L_OUT', undefined, true);
        addEdge(termKey(sym.id, 'N_IN'), termKey(sym.id, 'N_OUT'), sym.id, 'N_IN', sym.id, 'N_OUT', undefined, true);
      }
    } else if (sym.type === 'interruptor_simple') {
      if (sState.isOpen === false) {
        // Cerrado / ON
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R'), sym.id, 'L', sym.id, 'R', undefined, true);
      }
    } else if (sym.type === 'interruptor_doble') {
      if (sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R1'), sym.id, 'L', sym.id, 'R1', undefined, true);
      }
      if (sState.switchPosition === 2 || sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R2'), sym.id, 'L', sym.id, 'R2', undefined, true);
      }
    } else if (sym.type === 'conmutado') {
      const pos = sState.switchPosition || 1;
      const targetTerm = pos === 1 ? 'P1' : 'P2';
      addEdge(termKey(sym.id, 'COM'), termKey(sym.id, targetTerm), sym.id, 'COM', sym.id, targetTerm, undefined, true);
    } else if (sym.type === 'pulsador') {
      if (sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R'), sym.id, 'L', sym.id, 'R', undefined, true);
      }
    } else if (sym.type === 'caja_paso') {
      // Continuidad en cajas de derivación
      addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), sym.id, 'L_IN', sym.id, 'L_OUT', undefined, true);
      addEdge(termKey(sym.id, 'N_IN'), termKey(sym.id, 'N_OUT'), sym.id, 'N_IN', sym.id, 'N_OUT', undefined, true);
      addEdge(termKey(sym.id, 'PE_IN'), termKey(sym.id, 'PE_OUT'), sym.id, 'PE_IN', sym.id, 'PE_OUT', undefined, true);
    }
  }

  // Identificar fuentes de alimentación
  const sources = project.symbols.filter((s) => s.type === 'fuente_ac' || s.type === 'tablero');
  if (sources.length === 0) return [];

  // Helper esencial: Toda carga de utilización, iluminación o artefacto resistivo/inductivo
  // posee impedancia interna entre L y N, por lo que NO constituye un cortocircuito.
  const isLoadImpedance = (compId: string, termId: string) => {
    const sym = symbolMap.get(compId);
    if (!sym) return false;
    if (sym.category === 'utilizacion' || sym.type === 'luminaria') return true;
    if ((sym.powerWatts || 0) > 0) return true;
    return sym.type === 'luminaria' || sym.type === 'timbre' || sym.type === 'ventilador' || sym.type === 'termotanque';
  };

  // Helper: Comprobar si un componente tiene cables físicos conectados
  const hasPhysicalWiresConnected = (compId: string, terminalIds?: string[]) => {
    return project.wires.some((w) => {
      const matchFrom = w.fromComponentId === compId && (!terminalIds || terminalIds.includes(w.fromTerminalId));
      const matchTo = w.toComponentId === compId && (!terminalIds || terminalIds.includes(w.toTerminalId));
      return matchFrom || matchTo;
    });
  };

  // Rastrear desde cada fuente
  for (const src of sources) {
    const lStart = src.type === 'tablero' ? termKey(src.id, 'L_OUT') : termKey(src.id, 'L');
    const nStart = src.type === 'tablero' ? termKey(src.id, 'N_OUT') : termKey(src.id, 'N');
    const peStart = src.type === 'tablero' ? termKey(src.id, 'PE_OUT') : termKey(src.id, 'PE');

    // =========================================================================
    // A. DETECCIÓN DE CORTOCIRCUITO FRANCO (L -> N directo sin carga)
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
          // Si es una carga de utilización/iluminación y se cruza internamente entre sus bornes, NO es cortocircuito
          const [currComp] = curr.split(':');
          if (isLoadImpedance(currComp, edge.targetTermId) && edge.isInternal) {
            continue; // La impedancia real absorbe la tensión
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

        // Identificar qué protección termomagnética específica está en la rama del corto
        let specificBreaker: ElectricalSymbol | undefined;
        for (const compId of involvedComps) {
          const sym = symbolMap.get(compId);
          if (sym && (sym.type === 'termica' || sym.type === 'interruptor_general')) {
            specificBreaker = sym;
            break;
          }
        }

        const coords = calculateCentroid(Array.from(involvedComps), symbolMap);
        const compNames = Array.from(involvedComps)
          .map((id) => symbolMap.get(id)?.name || id)
          .slice(0, 3)
          .join(', ');

        const breakerLabel = specificBreaker?.label || 'PIA General';
        const trippedProtection: TrippedProtectionDetail = {
          deviceType: 'PIA_TERMOMAGNETICA',
          nominalRating: specificBreaker ? `${specificBreaker.label} (Curva C)` : 'Curva C (5 a 10 x In)',
          tripMechanism: 'DISPARO_MAGNETICO_INSTANTANEO',
          responseTimeMs: 15,
          statusText: `Disparo magnético instantáneo en < 20 ms de ${breakerLabel} por corriente de cortocircuito franca (Icc > 1500 A).`,
        };

        faults.push({
          id: `fault_cc_${src.id}`,
          category: 'cortocircuito_franco',
          severity: 'peligro_inmediato',
          title: `Cortocircuito Franco Fase-Neutro (L-N) — Disparo de ${breakerLabel}`,
          faultLoopDescription: `Bucle cerrado de resistencia nula entre Fase y Neutro afectando: ${compNames}.`,
          detectionReason: `Se detectó continuidad galvánica directa entre Fase y Neutro sin intercalar una carga con resistencia o impedancia admisible. La termomagnética ${breakerLabel} actuó para evitar el incendio de conductores.`,
          fromComponentId: specificBreaker?.id || src.id,
          involvedWireIds: involvedWires,
          involvedComponentIds: Array.from(involvedComps),
          involvedTerminalKeys: involvedTerms,
          trippedProtection,
          remedySteps: [
            '1. La térmica se ha disparado automáticamente para proteger la instalación.',
            '2. Desconecta o corrige el cable que une directamente Fase con Neutro en el tramo resaltado en rojo.',
            '3. Verifica que la Fase llegue al interruptor o bornera y el Neutro a la carga.',
            '4. Una vez eliminado el puente indebido, podrás rearmar la térmica con un clic.',
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
          statusText: 'Disparo del disyuntor diferencial en 25 ms por fuga a tierra superior a 30 mA (IΔn).',
        };

        faults.push({
          id: `fault_earth_${src.id}`,
          category: 'falla_tierra',
          severity: 'peligro_inmediato',
          title: 'Falla a Tierra (L-PE) — Disparo Inmediato del Diferencial (30 mA)',
          faultLoopDescription: `Contacto involuntario de Fase hacia la red de protección PE o masa metálica.`,
          detectionReason: `Existe conducción galvánica entre Fase viva y el conductor de protección PE. El disyuntor diferencial disparó inmediatamente protegiendo a las personas contra electrocución.`,
          fromComponentId: src.id,
          involvedWireIds: involvedWires,
          involvedComponentIds: Array.from(involvedComps),
          involvedTerminalKeys: involvedTerms,
          trippedProtection,
          remedySteps: [
            '1. El interruptor diferencial ha actuado por corriente residual de fuga.',
            '2. Revisa el tramo resaltado para desvincular el conductor de Fase del borne de tierra PE.',
            '3. Asegura que los bornes PE sólo se conecten a la jabalina mediante cable verde-amarillo.',
            '4. Tras corregir la fuga, rearma la palanca del diferencial para reanudar el servicio.',
          ],
          coordinates: coords,
        });
      }
    }
  }

  // =========================================================================
  // C. DETECCIÓN DE CONEXIÓN INCORRECTA PELIGROSA:
  //    1. Interruptor que corta el NEUTRO en lugar de la FASE
  // =========================================================================
  for (const sym of project.symbols) {
    if (sym.category === 'comando' && (sym.type === 'interruptor_simple' || sym.type === 'conmutado')) {
      const lTermKey = termKey(sym.id, 'L');
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
                '3. Desde la tecla, lleva el cable de Retorno (violeta/gris) hacia el borne L de la luminaria.',
              ],
              coordinates: { x: sym.x, y: sym.y },
            });
          }
        }
      }
    }

    // 2. Tomacorrientes sin borne de tierra PE conectado
    // REGLA CRÍTICA: Solo advertir si el tomacorriente está EFECTIVAMENTE conectado a la red viva (L y N cableados).
    // Si es un artefacto o tomacorriente suelto sin cables, NO debe generar errores.
    if (sym.type === 'tomacorriente' || sym.type === 'toma_especial') {
      const hasLWire = hasPhysicalWiresConnected(sym.id, ['L']);
      const hasNWire = hasPhysicalWiresConnected(sym.id, ['N']);
      const hasPEWire = hasPhysicalWiresConnected(sym.id, ['PE']);

      // Solo si está conectado a la red eléctrica sin tierra
      if ((hasLWire || hasNWire) && !hasPEWire) {
        const peKey = termKey(sym.id, 'PE');
        faults.push({
          id: `fault_no_pe_${sym.id}`,
          category: 'conexion_peligrosa',
          severity: 'advertencia_normativa',
          title: `Tomacorriente ${sym.label} sin Puesta a Tierra (PE)`,
          faultLoopDescription: `El tomacorriente "${sym.name}" está cableado a la línea pero carece de conexión de protección equipotencial.`,
          detectionReason: `La norma AEA 90364 exige que todo tomacorriente tipo IRAM 2071 de 3 espigas planas cuente obligatoriamente con conductor de protección PE verde-amarillo de sección mínima 2,5 mm² conectado a la jabalina de puesta a tierra.`,
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
  // D. VALIDACIONES EDUCATIVAS DE CÓDIGO DE COLORES (IRAM 2183 / AEA 90364)
  // =========================================================================
  for (const wire of project.wires) {
    const fromSym = symbolMap.get(wire.fromComponentId);
    const toSym = symbolMap.get(wire.toComponentId);
    if (!fromSym || !toSym) continue;

    // Regla 1: El conductor Celeste está prohibido para Fases o Retornos
    const isCeleste = wire.type === 'neutro' || wire.color === '#0284c7';
    const isConnectedToPhase =
      wire.fromTerminalId === 'L' ||
      wire.toTerminalId === 'L' ||
      wire.fromTerminalId === 'R' ||
      wire.toTerminalId === 'R' ||
      wire.fromTerminalId === 'COM' ||
      wire.toTerminalId === 'COM';

    if (isCeleste && isConnectedToPhase && fromSym.category === 'comando') {
      faults.push({
        id: `fault_color_celeste_fase_${wire.id}`,
        category: 'conexion_peligrosa',
        severity: 'advertencia_normativa',
        title: `Uso Indebido de Conductor Celeste como Activo (IRAM 2183)`,
        faultLoopDescription: `Se ha utilizado un conductor celeste para alimentar o conmutar una fase en ${fromSym.name}.`,
        detectionReason: `Por norma IRAM 2183 y AEA 90364-771, el color CELESTE está reservado exclusivamente para el conductor NEUTRO. Queda terminantemente prohibido utilizarlo como fase viva, retorno o puente, ya que genera confusión letal durante el mantenimiento.`,
        involvedWireIds: [wire.id],
        involvedComponentIds: [fromSym.id, toSym.id],
        involvedTerminalKeys: [`${fromSym.id}:${wire.fromTerminalId}`],
        remedySteps: [
          '1. Selecciona el cable en el plano.',
          '2. Cambia su tipo a FASE (marrón o negro) o RETORNO (violeta/gris) según corresponda.',
        ],
        coordinates: { x: (fromSym.x + toSym.x) / 2, y: (fromSym.y + toSym.y) / 2 },
      });
    }

    // Regla 2: El conductor Verde-Amarillo es EXCLUSIVO para Puesta a Tierra (PE)
    const isGreenYellow = wire.type === 'tierra' || wire.color === '#16a34a' || wire.color === '#15803d';
    const isConnectedToActiveTerminal =
      wire.fromTerminalId === 'L' ||
      wire.toTerminalId === 'L' ||
      wire.fromTerminalId === 'N' ||
      wire.toTerminalId === 'N' ||
      wire.fromTerminalId === 'R' ||
      wire.toTerminalId === 'R';

    if (isGreenYellow && isConnectedToActiveTerminal) {
      faults.push({
        id: `fault_color_pe_activo_${wire.id}`,
        category: 'conexion_peligrosa',
        severity: 'peligro_inmediato',
        title: `¡RIESGO GRAVE! Conductor Verde-Amarillo (PE) usado como Conductor Activo`,
        faultLoopDescription: `El conductor de puesta a tierra está conectado a un terminal de Fase o Neutro en ${fromSym.name}.`,
        detectionReason: `La combinación de colores VERDE-AMARILLO no debe utilizarse en ningún caso para otra función que no sea la de conductor de protección (PE). Conectarlo como conductor activo genera riesgo extremo de electrificar carcasas metálicas y provocar choques eléctricos fatales.`,
        involvedWireIds: [wire.id],
        involvedComponentIds: [fromSym.id, toSym.id],
        involvedTerminalKeys: [`${fromSym.id}:${wire.fromTerminalId}`],
        remedySteps: [
          '1. Desconecta de inmediato este cable de los terminales activos L o N.',
          '2. Conéctalo únicamente a los bornes de tierra (PE) y a la jabalina.',
          '3. Utiliza conductores marrón/negro/rojo para fases y celeste para neutro.',
        ],
        coordinates: { x: (fromSym.x + toSym.x) / 2, y: (fromSym.y + toSym.y) / 2 },
      });
    }
  }

  // =========================================================================
  // E. DETECCIÓN DE SOBRECARGA REAL EN CIRCUITOS (Ib > In)
  // =========================================================================
  // REGLAS FUNDAMENTALES:
  // 1. Un elemento colocado sin cables físicos está DESCONECTADO (P = 0 W, I = 0 A).
  // 2. Si la térmica del circuito está abierta o disparada, la corriente es 0 A.
  // 3. Solo se suman los artefactos que tienen cables conectados a terminales L y N.
  for (const circ of project.circuits) {
    const breakerAmps = circ.breakerAmps || 16;

    // Buscar si existe una térmica específica en el plano para este circuito
    const circuitBreakerSym = project.symbols.find(
      (s) => (s.type === 'termica' || s.category === 'proteccion') && s.circuitId === circ.id
    );

    // Buscar el componente correspondiente en el tablero de distribución
    const switchboardBreaker = project.switchboard?.components?.find(
      (c) => c.circuitId === circ.id || c.name.includes(circ.id)
    );

    // Si la protección del circuito está abierta manualmente o ya disparada, la corriente activa es 0
    const isCircuitOpenOrTripped =
      circuitBreakerSym?.state?.isOpen === true ||
      circuitBreakerSym?.state?.isTripped === true ||
      switchboardBreaker?.state === 'open' ||
      switchboardBreaker?.state === 'tripped';

    if (isCircuitOpenOrTripped) {
      continue; // Circuito desenergizado = 0 A, no genera sobrecarga activa
    }

    // Filtrar símbolos del circuito que estén EFECTIVAMENTE CONECTADOS con cables físicos
    const connectedCircuitSymbols = project.symbols.filter((s) => {
      if (s.circuitId !== circ.id) return false;
      if (s.category !== 'utilizacion' && s.type !== 'luminaria') return false;
      // Debe tener cables físicos conectados a sus terminales de consumo
      const hasL = hasPhysicalWiresConnected(s.id, ['L', 'L_IN']);
      const hasN = hasPhysicalWiresConnected(s.id, ['N', 'N_IN']);
      return hasL && hasN;
    });

    const totalActiveWatts = connectedCircuitSymbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
    const designAmps = totalActiveWatts / (circ.voltage || 220);

    if (designAmps > breakerAmps && totalActiveWatts > 0) {
      const trippedProtection: TrippedProtectionDetail = {
        deviceType: 'PIA_TERMOMAGNETICA',
        nominalRating: `${circ.breakerCurve || 'C'}${breakerAmps} (${breakerAmps} A)`,
        tripMechanism: 'DISPARO_TERMICO_RETARDADO',
        responseTimeMs: 45000,
        statusText: `Disparo bimetálico térmico en ${circ.id} por sobrecarga sostenida (Ib=${designAmps.toFixed(1)} A > In=${breakerAmps} A).`,
      };

      const coords = calculateCentroid(
        connectedCircuitSymbols.map((s) => s.id),
        symbolMap
      );

      faults.push({
        id: `fault_overload_${circ.id}`,
        category: 'sobrecarga',
        severity: 'advertencia_normativa',
        title: `Sobrecarga Activa en Circuito ${circ.name} (${circ.id})`,
        faultLoopDescription: `La corriente real demandada por los artefactos conectados (${designAmps.toFixed(1)} A) supera la capacidad asignada del interruptor termomagnético (${breakerAmps} A).`,
        detectionReason: `Los artefactos efectivamente cableados al circuito suman ${totalActiveWatts} W, excediendo la corriente admisible de la térmica de ${breakerAmps} A. Esto sobrecalentará los conductores de ${circ.crossSectionMm2 || 2.5} mm² y provocará el disparo térmico por bimetal.`,
        fromComponentId: circuitBreakerSym?.id,
        involvedWireIds: project.wires.filter((w) => w.circuitId === circ.id).map((w) => w.id),
        involvedComponentIds: connectedCircuitSymbols.map((s) => s.id),
        involvedTerminalKeys: [],
        trippedProtection,
        remedySteps: [
          '1. Divide los artefactos de alto consumo en circuitos independientes según AEA 771.',
          '2. Para artefactos de uso especial (soldadoras, bombas, termotanques), asígnales un circuito TUE o circuito exclusivo.',
          '3. Recuerda coordinar siempre según la regla de oro: Ib <= In <= Iz.',
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
