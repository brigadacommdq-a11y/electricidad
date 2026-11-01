/**
 * ELECTRA PLAN — Motor de Simulación Eléctrica y Verificación de Red
 * Modelo de grafos de nodos, continuidad, cálculo de cargas activas, maniobra individual
 * de protecciones y diagnóstico pedagógico en tiempo real.
 * Cumple con especificaciones AEA 90364 e IRAM 2183.
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
  const termKey = (compId: string, termId: string) => `${compId}:${termId}`;
  const graph = new Map<string, Array<{ target: string; wire: Wire }>>();

  const addEdge = (t1: string, t2: string, wire: Wire) => {
    if (!graph.has(t1)) graph.set(t1, []);
    if (!graph.has(t2)) graph.set(t2, []);
    graph.get(t1)!.push({ target: t2, wire });
    graph.get(t2)!.push({ target: t1, wire });
  };

  // Agregar aristas de cables físicos existentes
  for (const wire of wires) {
    const k1 = termKey(wire.fromComponentId, wire.fromTerminalId);
    const k2 = termKey(wire.toComponentId, wire.toTerminalId);
    addEdge(k1, k2, wire);
  }

  // Helper para verificar si un circuito en el tablero está habilitado
  const isSwitchboardCircuitClosed = (circId?: string) => {
    if (!circId || !project.switchboard?.components) return true;
    const comp = project.switchboard.components.find(
      (c) => c.circuitId === circId || c.name.includes(circId)
    );
    if (!comp) return true;
    return comp.state === 'closed';
  };

  // Agregar puentes internos según el estado individual de cada componente
  for (const sym of symbolMap.values()) {
    const sState = sym.state || {};

    if (sym.type === 'fuente_ac') {
      // Generador de red, no puentea L con N internamente
    } else if (sym.type === 'tablero') {
      // El tablero principal conmuta si sus protecciones generales están cerradas
      if (!sState.isOpen && !sState.isTripped) {
        addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), {
          id: `internal_${sym.id}_L`,
          floorId: sym.floorId,
          type: 'fase',
          fromComponentId: sym.id,
          fromTerminalId: 'L_IN',
          toComponentId: sym.id,
          toTerminalId: 'L_OUT',
          color: '#92400e',
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
      // Barra de puesta a tierra equipotencial pasa siempre
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
    } else if (
      sym.type === 'termica' ||
      sym.type === 'diferencial' ||
      sym.type === 'interruptor_general'
    ) {
      // MANIOBRA INDIVIDUAL: Conduce SOLO si está cerrada y no disparada
      const isBoardClosed = isSwitchboardCircuitClosed(sym.circuitId);
      if (!sState.isOpen && !sState.isTripped && isBoardClosed) {
        addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), {
          id: `internal_${sym.id}_L`,
          floorId: sym.floorId,
          type: 'fase',
          fromComponentId: sym.id,
          fromTerminalId: 'L_IN',
          toComponentId: sym.id,
          toTerminalId: 'L_OUT',
          color: '#92400e',
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
      if (sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R'), {
          id: `internal_${sym.id}_contact`,
          floorId: sym.floorId,
          type: 'retorno',
          fromComponentId: sym.id,
          fromTerminalId: 'L',
          toComponentId: sym.id,
          toTerminalId: 'R',
          color: '#a855f7',
          crossSectionMm2: 1.5,
          lengthMeters: 0.02,
        });
      }
    } else if (sym.type === 'interruptor_doble') {
      if (sState.isOpen === false) {
        addEdge(termKey(sym.id, 'L'), termKey(sym.id, 'R1'), {
          id: `internal_${sym.id}_c1`,
          floorId: sym.floorId,
          type: 'retorno',
          fromComponentId: sym.id,
          fromTerminalId: 'L',
          toComponentId: sym.id,
          toTerminalId: 'R1',
          color: '#a855f7',
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
          color: '#a855f7',
          crossSectionMm2: 1.5,
          lengthMeters: 0.02,
        });
      }
    } else if (sym.type === 'conmutado') {
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
        color: '#f97316',
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
          color: '#a855f7',
          crossSectionMm2: 1.5,
          lengthMeters: 0.02,
        });
      }
    } else if (sym.type === 'caja_paso') {
      // Puentes de derivación
      addEdge(termKey(sym.id, 'L_IN'), termKey(sym.id, 'L_OUT'), {
        id: `internal_${sym.id}_L`,
        floorId: sym.floorId,
        type: 'fase',
        fromComponentId: sym.id,
        fromTerminalId: 'L_IN',
        toComponentId: sym.id,
        toTerminalId: 'L_OUT',
        color: '#92400e',
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
      addEdge(termKey(sym.id, 'PE_IN'), termKey(sym.id, 'PE_OUT'), {
        id: `internal_${sym.id}_PE`,
        floorId: sym.floorId,
        type: 'tierra',
        fromComponentId: sym.id,
        fromTerminalId: 'PE_IN',
        toComponentId: sym.id,
        toTerminalId: 'PE_OUT',
        color: '#16a34a',
        crossSectionMm2: 2.5,
        lengthMeters: 0.05,
      });
    }
  }

  // 3. Propagación de Potencial Fase (Live BFS)
  const reachableFromPhase = new Set<string>();
  const visitedWires = new Set<string>();

  const phaseRoots: string[] = [];
  const neutralRoots: string[] = [];
  const groundRoots: string[] = [];

  for (const src of powerSources) {
    if (src.type === 'fuente_ac') {
      phaseRoots.push(termKey(src.id, 'L'));
      neutralRoots.push(termKey(src.id, 'N'));
      groundRoots.push(termKey(src.id, 'PE'));
    } else if (src.type === 'tablero') {
      const srcState = src.state || {};
      if (!srcState.isOpen && !srcState.isTripped) {
        phaseRoots.push(termKey(src.id, 'L_OUT'));
        neutralRoots.push(termKey(src.id, 'N_OUT'));
      }
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

      const targetCompId = target.split(':')[0];
      energizedComponents.add(targetCompId);

      if (!reachableFromPhase.has(target)) {
        reachableFromPhase.add(target);
        // Las cargas reales (lámparas, soldadoras, bombas, termotanques) absorben la diferencia de potencial
        const isLoadThrough = isLoadBoundary(target, symbolMap);
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

    for (const { target } of neighbors) {
      if (!reachableFromNeutral.has(target)) {
        reachableFromNeutral.add(target);
        const isLoadThrough = isLoadBoundary(target, symbolMap);
        if (!isLoadThrough) {
          neutralQueue.push(target);
        }
      }
    }
  }

  // 5. Propagación de Tierra (Ground BFS)
  const reachableFromGround = new Set<string>();
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

  // 6. Detección y Localización Avanzada de Fallas
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

    // Disparar las protecciones afectadas de manera aislada
    if (fault.trippedProtection) {
      if (fault.category === 'cortocircuito_franco' || fault.category === 'sobrecarga') {
        if (fault.fromComponentId) {
          const breaker = symbolMap.get(fault.fromComponentId);
          if (breaker) {
            breaker.state = {
              ...breaker.state,
              isTripped: true,
              isOpen: true,
            };
          }
        }
      } else if (fault.category === 'falla_tierra') {
        // Disparo del diferencial
        const diffSym = Array.from(symbolMap.values()).find((s) => s.type === 'diferencial');
        if (diffSym) {
          diffSym.state = {
            ...diffSym.state,
            isTripped: true,
            isOpen: true,
          };
        }
      }
    }
  }

  // 7. Evaluar estado de todos los artefactos y receptores
  // REGLAS ESENCIALES:
  // - Un artefacto sin cables está desconectado (0 W, 0 A).
  // - Solo consume potencia activa si tiene cables físicos y le llegan Fase y Neutro simultáneamente.
  let totalWatts = 0;

  for (const sym of symbolMap.values()) {
    const isUtilization = sym.category === 'utilizacion' || sym.type === 'luminaria';
    const isOutlet = sym.type === 'tomacorriente' || sym.type === 'toma_especial';

    if (sym.type === 'luminaria') {
      const lTerm = termKey(sym.id, 'L');
      const nTerm = termKey(sym.id, 'N');

      const hasPhase = reachableFromPhase.has(lTerm);
      const hasNeutral = reachableFromNeutral.has(nTerm);

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
    } else if (isUtilization && sym.type !== 'luminaria') {
      // Artefactos de potencia: soldadoras, termotanques, bombas, lavarropas, hornos, etc.
      const lTerm = termKey(sym.id, 'L');
      const nTerm = termKey(sym.id, 'N');

      // Comprobar si tiene cables conectados
      const hasWires = graph.get(lTerm)?.length && graph.get(nTerm)?.length;
      const hasPhase = reachableFromPhase.has(lTerm);
      const hasNeutral = reachableFromNeutral.has(nTerm);

      if (hasWires && hasPhase && hasNeutral && !hasShortCircuit) {
        sym.state = {
          ...sym.state,
          isOn: true,
          isEnergized: true,
        };
        totalWatts += sym.powerWatts || 0;
      } else {
        sym.state = {
          ...sym.state,
          isOn: false,
          isEnergized: Boolean(hasWires && hasPhase),
        };
      }
    } else if (isOutlet) {
      const lTerm = termKey(sym.id, 'L');
      const nTerm = termKey(sym.id, 'N');
      const peTerm = termKey(sym.id, 'PE');

      const hasWires = graph.get(lTerm)?.length || graph.get(nTerm)?.length;
      const hasPhase = reachableFromPhase.has(lTerm);
      const hasNeutral = reachableFromNeutral.has(nTerm);
      const hasGround = reachableFromGround.has(peTerm);

      sym.state = {
        ...sym.state,
        isEnergized: Boolean(hasWires && hasPhase && hasNeutral),
      };

      // Solo advertir si el toma está conectado a la red viva y no tiene PE
      if (hasWires && (hasPhase || hasNeutral) && !hasGround) {
        diagnostics.push({
          id: `diag_toma_no_pe_${sym.id}`,
          level: 'warning',
          title: `Tomacorriente ${sym.label} sin Puesta a Tierra`,
          message: `El contacto de protección a tierra (PE) de ${sym.name} no está conectado a la jabalina de PAT.`,
          componentId: sym.id,
          recommendation:
            'Según AEA 90364-771, todo tomacorriente debe contar obligatoriamente con conductor de protección (PE) verde-amarillo de sección mínima 2,5 mm².',
        });
      }
    } else if (sym.category === 'comando') {
      const lTerm = termKey(sym.id, 'L');
      const rTerm = termKey(sym.id, 'R');
      const isEnergized = reachableFromPhase.has(lTerm) || reachableFromPhase.has(rTerm);
      sym.state = {
        ...sym.state,
        isEnergized,
      };
    }
  }

  // 8. Mensaje de éxito si hay cargas funcionando normalmente
  if ((activeLamps.size > 0 || totalWatts > 0) && !hasShortCircuit && detailedFaults.length === 0) {
    diagnostics.unshift({
      id: 'diag_sim_success',
      level: 'success',
      title: 'Continuidad correcta en el modelo',
      message: `Se ha verificado continuidad lógica completa desde la alimentación. Potencia activa simulada: ${totalWatts} W (${(totalWatts / 220).toFixed(2)} A).`,
      recommendation:
        'La simulación demuestra continuidad lógica funcional según el estado de las protecciones e interruptores accionados.',
    });
  }

  // Actualizar estado en cables
  for (const wire of wires) {
    wire.isEnergized = energizedWires.has(wire.id);
    wire.hasCurrent = (activeLamps.size > 0 || totalWatts > 0) && wire.isEnergized;
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
 * Determina si un terminal actúa como frontera de carga con impedancia (resistencia/reactancia)
 * para evitar que la fase se propague erróneamente hacia el neutro.
 */
function isLoadBoundary(termKey: string, symbolMap: Map<string, ElectricalSymbol>): boolean {
  const [compId, termId] = termKey.split(':');
  const sym = symbolMap.get(compId);
  if (!sym) return false;

  // Toda luminaria o artefacto de utilización es frontera de carga
  if (sym.category === 'utilizacion' || sym.type === 'luminaria') {
    return termId === 'L' || termId === 'N' || termId === 'R';
  }

  return false;
}
