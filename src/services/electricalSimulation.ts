/**
 * ELECTRA PLAN — Motor de Simulación Eléctrica y Verificación de Red
 * Modelo gráfico de nodos, continuidad, cálculo de cargas y diagnósticos lógicos.
 */

import {
  Project,
  SimulationState,
  DiagnosticItem,
  ElectricalSymbol,
  Wire,
} from '../types/electra';
import { locateAllFaults } from './faultLocalization';

export interface TraceResult {
  energizedComponents: Set<string>;
  energizedWires: Set<string>;
  activeLamps: Set<string>;
  shortCircuits: { fromComp: string; toComp: string; path: string[] }[];
  disconnectedTerminals: { componentId: string; compName: string; terminalId: string; termName: string }[];
  openSwitches: { compId: string; name: string }[];
  missingGroundComps: { compId: string; name: string }[];
  totalSimulatedWatts: number;
  totalSimulatedAmps: number;
}

/**
 * Resuelve la topología de la instalación eléctrica conectada
 */
export function simulateElectricalNetwork(project: Project): {
  simState: SimulationState;
  updatedSymbols: ElectricalSymbol[];
  updatedWires: Wire[];
} {
  const diagnostics: DiagnosticItem[] = [];
  const energizedComponents = new Set<string>();
  const energizedWires = new Set<string>();
  const activeLamps = new Set<string>();

  const symbolMap = new Map<string, ElectricalSymbol>(
    project.symbols.map((s) => [s.id, JSON.parse(JSON.stringify(s))])
  );

  const wires = project.wires.map((w) => ({ ...w }));

  // 1. Encontrar fuentes de alimentación activas
  // Una fuente puede ser un componente tipo 'fuente_ac' o 'tablero'
  const powerSources = Array.from(symbolMap.values()).filter(
    (s) => s.type === 'fuente_ac' || s.type === 'tablero'
  );

  if (powerSources.length === 0) {
    diagnostics.push({
      id: 'diag_no_source',
      level: 'warning',
      title: 'Sin fuente de alimentación',
      message: 'No hay ninguna Alimentación de Red (220V AC) ni Tablero en el plano.',
      recommendation: 'Agrega un componente "Alimentación de Red" o "Tablero" desde la barra de herramientas para energizar el circuito.',
    });

    return {
      simState: {
        isRunning: true,
        isPaused: false,
        diagnostics,
        totalSimulatedCurrentAmps: 0,
        hasShortCircuit: false,
        energizedComponents,
        energizedWires,
        activeLamps,
      },
      updatedSymbols: Array.from(symbolMap.values()),
      updatedWires: wires,
    };
  }

  // 2. Construir grafo de adyacencia de terminales
  // Clave de terminal: `${componentId}:${terminalId}`
  const termKey = (compId: string, termId: string) => `${compId}:${termId}`;
  const graph = new Map<string, Array<{ target: string; wire: Wire }>>();

  const addEdge = (t1: string, t2: string, wire: Wire) => {
    if (!graph.has(t1)) graph.set(t1, []);
    if (!graph.has(t2)) graph.set(t2, []);
    graph.get(t1)!.push({ target: t2, wire });
    graph.get(t2)!.push({ target: t1, wire });
  };

  // Agregar aristas de los cables físicos
  for (const wire of wires) {
    const k1 = termKey(wire.fromComponentId, wire.fromTerminalId);
    const k2 = termKey(wire.toComponentId, wire.toTerminalId);
    addEdge(k1, k2, wire);
  }

  // Agregar puentes internos según el estado de cada componente
  for (const sym of symbolMap.values()) {
    const sState = sym.state || {};

    if (sym.type === 'fuente_ac') {
      // Es el generador, no puentea L con N internamente
    } else if (sym.type === 'tablero') {
      // Tablero: Si no está desconectado, puentea L_IN -> L_OUT, N_IN -> N_OUT, PE_IN -> PE_OUT
      if (!sState.isOpen && !sState.isTripped) {
        addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), {
          id: `internal_${sym.id}_L`,
          floorId: sym.floorId,
          type: 'fase',
          fromComponentId: sym.id,
          fromTerminalId: 'L_IN',
          toComponentId: sym.id,
          toTerminalId: 'L_OUT',
          color: '#854d0e',
          crossSectionMm2: 4,
          lengthMeters: 0.1,
        });
        addEdge(termKey(sym.id, 'N_IN'), termKey(sym.id, 'N_OUT'), {
          id: `internal_${sym.id}_N`,
          floorId: sym.floorId,
          type: 'neutro',
          fromComponentId: sym.id,
          fromTerminalId: 'N_IN',
          toComponentId: sym.id,
          toTerminalId: 'N_OUT',
          color: '#0284c7',
          crossSectionMm2: 4,
          lengthMeters: 0.1,
        });
      }
      // PE pasa directo a la barra de puesta a tierra
      addEdge(termKey(sym.id, 'PE_IN'), termKey(sym.id, 'PE_OUT'), {
        id: `internal_${sym.id}_PE`,
        floorId: sym.floorId,
        type: 'tierra',
        fromComponentId: sym.id,
        fromTerminalId: 'PE_IN',
        toComponentId: sym.id,
        toTerminalId: 'PE_OUT',
        color: '#16a34a',
        crossSectionMm2: 4,
        lengthMeters: 0.1,
      });
    } else if (sym.type === 'termica' || sym.type === 'diferencial') {
      // Si la protección está cerrada y no disparada
      if (!sState.isOpen && !sState.isTripped) {
        addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), {
          id: `internal_${sym.id}_L`,
          floorId: sym.floorId,
          type: 'fase',
          fromComponentId: sym.id,
          fromTerminalId: 'L_IN',
          toComponentId: sym.id,
          toTerminalId: 'L_OUT',
          color: '#854d0e',
          crossSectionMm2: 2.5,
          lengthMeters: 0.05,
        });
        addEdge(termKey(sym.id, 'N_IN'), termKey(sym.id, 'N_OUT'), {
          id: `internal_${sym.id}_N`,
          floorId: sym.floorId,
          type: 'neutro',
          fromComponentId: sym.id,
          fromTerminalId: 'N_IN',
          toComponentId: sym.id,
          toTerminalId: 'N_OUT',
          color: '#0284c7',
          crossSectionMm2: 2.5,
          lengthMeters: 0.05,
        });
      }
    } else if (sym.type === 'interruptor_simple') {
      // Si la tecla está cerrada (state.isOpen === false)
      if (sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R'), {
          id: `internal_${sym.id}_contact`,
          floorId: sym.floorId,
          type: 'retorno',
          fromComponentId: sym.id,
          fromTerminalId: 'L',
          toComponentId: sym.id,
          toTerminalId: 'R',
          color: '#f59e0b',
          crossSectionMm2: 1.5,
          lengthMeters: 0.02,
        });
      }
    } else if (sym.type === 'interruptor_doble') {
      // Tecla doble con 2 circuitos
      if (sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R1'), {
          id: `internal_${sym.id}_c1`,
          floorId: sym.floorId,
          type: 'retorno',
          fromComponentId: sym.id,
          fromTerminalId: 'L',
          toComponentId: sym.id,
          toTerminalId: 'R1',
          color: '#f59e0b',
          crossSectionMm2: 1.5,
          lengthMeters: 0.02,
        });
      }
      if (sState.switchPosition === 2 || sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R2'), {
          id: `internal_${sym.id}_c2`,
          floorId: sym.floorId,
          type: 'retorno',
          fromComponentId: sym.id,
          fromTerminalId: 'L',
          toComponentId: sym.id,
          toTerminalId: 'R2',
          color: '#f59e0b',
          crossSectionMm2: 1.5,
          lengthMeters: 0.02,
        });
      }
    } else if (sym.type === 'conmutado') {
      // Conmutador de 2 posiciones: posición 1 conecta COM con P1, posición 2 conecta COM con P2
      const pos = sState.switchPosition || 1;
      const targetTerm = pos === 1 ? 'P1' : 'P2';
      addEdge(termKey(sym.id, 'COM'), termKey(sym.id, targetTerm), {
        id: `internal_${sym.id}_sw_${pos}`,
        floorId: sym.floorId,
        type: 'puente',
        fromComponentId: sym.id,
        fromTerminalId: 'COM',
        toComponentId: sym.id,
        toTerminalId: targetTerm,
        color: '#a855f7',
        crossSectionMm2: 1.5,
        lengthMeters: 0.02,
      });
    } else if (sym.type === 'pulsador') {
      if (sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R'), {
          id: `internal_${sym.id}_pulse`,
          floorId: sym.floorId,
          type: 'retorno',
          fromComponentId: sym.id,
          fromTerminalId: 'L',
          toComponentId: sym.id,
          toTerminalId: 'R',
          color: '#f59e0b',
          crossSectionMm2: 1.5,
          lengthMeters: 0.02,
        });
      }
    } else if (sym.type === 'caja_paso') {
      // Caja de derivación: todos los cables que lleguen a un borne se unen entre sí
      // En este modelo, los terminales L_NODE, N_NODE y PE_NODE actúan como nodos únicos
    }
  }

  // 3. Propagación de Potencial Fase (Live BFS)
  const reachableFromPhase = new Set<string>();
  const visitedWires = new Set<string>();

  // Identificar terminales raíz de Fase
  const phaseRoots: string[] = [];
  const neutralRoots: string[] = [];
  const groundRoots: string[] = [];

  for (const src of powerSources) {
    if (src.type === 'fuente_ac') {
      phaseRoots.push(termKey(src.id, 'L'));
      neutralRoots.push(termKey(src.id, 'N'));
      groundRoots.push(termKey(src.id, 'PE'));
    } else if (src.type === 'tablero') {
      phaseRoots.push(termKey(src.id, 'L_OUT'));
      neutralRoots.push(termKey(src.id, 'N_OUT'));
      groundRoots.push(termKey(src.id, 'PE_OUT'));
    }
  }

  // Traza desde Fase
  const queue = [...phaseRoots];
  phaseRoots.forEach((k) => reachableFromPhase.add(k));

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = graph.get(current) || [];

    for (const { target, wire } of neighbors) {
      visitedWires.add(wire.id);
      energizedWires.add(wire.id);

      // Extraer id de componente
      const targetCompId = target.split(':')[0];
      energizedComponents.add(targetCompId);

      if (!reachableFromPhase.has(target)) {
        reachableFromPhase.add(target);
        // NO propagamos automáticamente a través de la carga (ej: lámpara L -> N) para no considerar el Neutro como Fase
        const isLoadThrough = isLoadBoundary(target);
        if (!isLoadThrough) {
          queue.push(target);
        }
      }
    }
  }

  // 4. Propagación de Neutro (Neutral BFS)
  const reachableFromNeutral = new Set<string>();
  const neutralQueue = [...neutralRoots];
  neutralRoots.forEach((k) => reachableFromNeutral.add(k));

  while (neutralQueue.length > 0) {
    const current = neutralQueue.shift()!;
    const neighbors = graph.get(current) || [];

    for (const { target, wire } of neighbors) {
      if (!reachableFromNeutral.has(target)) {
        reachableFromNeutral.add(target);
        const isLoadThrough = isLoadBoundary(target);
        if (!isLoadThrough) {
          neutralQueue.push(target);
        }
      }
    }
  }

  // 5. Propagación de Tierra (Ground BFS)
  const reachableFromGround = new Set<string>();
  // También agregar jabalinas existentes como raíces de tierra
  const patElectrodes = Array.from(symbolMap.values()).filter((s) => s.type === 'puesta_tierra');
  for (const pat of patElectrodes) {
    groundRoots.push(termKey(pat.id, 'PE'));
  }

  const groundQueue = [...groundRoots];
  groundRoots.forEach((k) => reachableFromGround.add(k));

  while (groundQueue.length > 0) {
    const current = groundQueue.shift()!;
    const neighbors = graph.get(current) || [];

    for (const { target } of neighbors) {
      if (!reachableFromGround.has(target)) {
        reachableFromGround.add(target);
        groundQueue.push(target);
      }
    }
  }

  // 6. Detección y Localización Avanzada de Fallas y Cortocircuitos
  const detailedFaults = locateAllFaults(project);
  let hasShortCircuit = detailedFaults.some((f) => f.category === 'cortocircuito_franco');

  for (const fault of detailedFaults) {
    diagnostics.unshift({
      id: fault.id,
      level: fault.severity === 'peligro_inmediato' ? 'error' : 'warning',
      title: fault.title,
      message: `${fault.detectionReason} ${fault.faultLoopDescription}`,
      componentId: fault.fromComponentId || fault.involvedComponentIds[0],
      wireId: fault.involvedWireIds[0],
      recommendation: fault.remedySteps.join(' '),
      faultDetail: fault,
    });
  }

  // Fallback si por BFS estándar también se detecta cortocircuito no capturado
  if (!hasShortCircuit) {
    for (const nRoot of neutralRoots) {
      if (reachableFromPhase.has(nRoot)) {
        hasShortCircuit = true;
        diagnostics.unshift({
          id: 'diag_short_circuit_generic',
          level: 'error',
          title: '¡CORTOCIRCUITO DIRECTO DETECTADO!',
          message: 'Existe un camino de impedancia nula entre Fase y Neutro sin pasar por una carga resistiva o inductiva.',
          recommendation: 'Verifica las conexiones: la Fase nunca debe conectarse directamente al Neutro sin una luminaria o carga intermedia.',
        });
        break;
      }
    }
  }

  // 7. Evaluar estado de luminarias y receptores
  let totalWatts = 0;
  for (const sym of symbolMap.values()) {
    if (sym.type === 'luminaria') {
      const lTerm = termKey(sym.id, 'L');
      const nTerm = termKey(sym.id, 'N');
      const peTerm = termKey(sym.id, 'PE');

      const hasPhase = reachableFromPhase.has(lTerm);
      const hasNeutral = reachableFromNeutral.has(nTerm);
      const hasGround = reachableFromGround.has(peTerm);

      if (hasPhase && hasNeutral && !hasShortCircuit) {
        activeLamps.add(sym.id);
        sym.state = {
          ...sym.state,
          isOn: true,
          isEnergized: true,
        };
        totalWatts += sym.powerWatts || 60;
      } else {
        sym.state = {
          ...sym.state,
          isOn: false,
          isEnergized: hasPhase,
        };
      }

      // Advertencia de puesta a tierra
      if (!hasGround && (graph.get(peTerm)?.length || 0) === 0) {
        // Not strictly an error for simple lamp practice, but note in AEA
      }
    } else if (sym.type === 'tomacorriente' || sym.type === 'toma_especial') {
      const lTerm = termKey(sym.id, 'L');
      const nTerm = termKey(sym.id, 'N');
      const peTerm = termKey(sym.id, 'PE');

      const hasPhase = reachableFromPhase.has(lTerm);
      const hasNeutral = reachableFromNeutral.has(nTerm);
      const hasGround = reachableFromGround.has(peTerm);

      sym.state = {
        ...sym.state,
        isEnergized: hasPhase && hasNeutral,
      };

      if (!hasGround) {
        diagnostics.push({
          id: `diag_toma_no_pe_${sym.id}`,
          level: 'warning',
          title: `Tomacorriente ${sym.label} sin Puesta a Tierra`,
          message: `El contacto de protección a tierra (PE) de ${sym.name} no está conectado a la jabalina de PAT.`,
          componentId: sym.id,
          recommendation: 'Según AEA 90364-771, todo tomacorriente debe contar obligatoriamente con conductor de protección (PE) verde-amarillo de sección mínima 2,5 mm².',
        });
      }
    } else if (sym.type === 'interruptor_simple') {
      const lTerm = termKey(sym.id, 'L');
      const rTerm = termKey(sym.id, 'R');
      const isEnergized = reachableFromPhase.has(lTerm) || reachableFromPhase.has(rTerm);
      sym.state = {
        ...sym.state,
        isEnergized,
      };
    }
  }

  // 8. Detección de terminales libres / sin conectar
  for (const sym of symbolMap.values()) {
    for (const term of sym.terminals) {
      const key = termKey(sym.id, term.id);
      const conns = graph.get(key) || [];
      if (conns.length === 0) {
        // En timbres, ventiladores o tomas, avisar si faltan conexiones clave
        if (term.id === 'L' || term.id === 'N' || term.id === 'COM') {
          diagnostics.push({
            id: `diag_unconnected_${sym.id}_${term.id}`,
            level: 'info',
            title: `Borne libre: ${sym.label} [${term.name}]`,
            message: `El terminal "${term.name}" del componente "${sym.name}" se encuentra sin cable conectado.`,
            componentId: sym.id,
            recommendation: `Toca este terminal y arrastra un cable hacia el punto correspondiente para completar el circuito.`,
          });
        }
      }
    }
  }

  // 9. Comprobar circuitos abiertos en interruptores
  const openSwitches = Array.from(symbolMap.values()).filter(
    (s) => s.category === 'comando' && s.state?.isOpen === true && s.state?.isEnergized
  );
  if (openSwitches.length > 0 && activeLamps.size === 0 && !hasShortCircuit) {
    diagnostics.push({
      id: 'diag_switches_open',
      level: 'info',
      title: 'Circuito abierto en interruptor (Apagado normal)',
      message: `El interruptor ${openSwitches.map((s) => s.label).join(', ')} está en posición abierta (apagado).`,
      recommendation: 'Haz clic sobre el interruptor en el plano o simulador para cerrar el contacto y encender la carga.',
    });
  }

  // 10. Si todo está correcto y hay lámparas encendidas
  if (activeLamps.size > 0 && !hasShortCircuit) {
    diagnostics.unshift({
      id: 'diag_sim_success',
      level: 'success',
      title: 'Continuidad correcta en el modelo',
      message: `Se ha verificado continuidad lógica completa desde la alimentación hasta ${activeLamps.size} punto(s) de iluminación. Potencia activa simulada: ${totalWatts} W.`,
      recommendation: 'La simulación demuestra continuidad lógica funcional. Recuerda que no reemplaza los ensayos físicos de aislamiento, medición de PAT ni verificación de protecciones.',
    });
  }

  // Actualizar estado en cables
  for (const wire of wires) {
    wire.isEnergized = energizedWires.has(wire.id);
    wire.hasCurrent = activeLamps.size > 0 && wire.isEnergized;
  }

  const simCurrent = totalWatts / 220;

  return {
    simState: {
      isRunning: true,
      isPaused: false,
      diagnostics,
      totalSimulatedCurrentAmps: Number(simCurrent.toFixed(2)),
      hasShortCircuit,
      energizedComponents,
      energizedWires,
      activeLamps,
      activeFaults: detailedFaults,
    },
    updatedSymbols: Array.from(symbolMap.values()),
    updatedWires: wires,
  };
}

/**
 * Determina si un terminal actúa como frontera de carga con impedancia (no puente directo)
 */
function isLoadBoundary(termKey: string): boolean {
  // Lámpara terminal L y N son frontera de carga resistiva
  if (termKey.includes('luminaria:L') || termKey.includes('luminaria:N')) {
    return true;
  }
  if (termKey.includes('timbre:R') || termKey.includes('timbre:N')) {
    return true;
  }
  return false;
}
