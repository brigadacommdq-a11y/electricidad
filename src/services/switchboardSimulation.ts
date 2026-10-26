/**
 * ELECTRA PLAN — Motor de Simulación Eléctrica para Tableros DIN
 * Propagación de potencial, cálculo de corrientes, actuación de protecciones y diagnósticos normativos.
 */
import {
  RealisticSwitchboardState,
  RealisticDINDevice,
  RealisticSwitchboardWire,
} from '../types/switchboardWorkshop';
import { Project } from '../types/electra';

export interface SwitchboardSimulationResult {
  isMainsActive: boolean;
  energizedTerminals: Set<string>; // "devId:termId"
  energizedWires: Set<string>; // wireId
  activeCircuits: string[]; // circuitIds con tensión
  totalCurrentAmps: number;
  totalActivePowerWatts: number;
  totalApparentPowerVA: number;
  voltageL_N: number;
  frequencyHz: number;
  powerFactor: number;
  hasShortCircuit: boolean;
  hasEarthFault: boolean;
  diagnostics: Array<{
    id: string;
    level: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    deviceIds?: string[];
  }>;
}

export function simulateSwitchboard(
  state: RealisticSwitchboardState,
  project?: Project
): SwitchboardSimulationResult {
  const energizedTerminals = new Set<string>();
  const energizedWires = new Set<string>();
  const activeCircuits: string[] = [];
  const diagnostics: SwitchboardSimulationResult['diagnostics'] = [];

  const isMainsActive = state.mainsEnergized;
  const voltageL_N = isMainsActive ? state.supplyVoltage || 220 : 0;
  const frequencyHz = isMainsActive ? 50 : 0;
  let powerFactor = 0.92;

  // Localizar dispositivo IGA de cabecera
  const igaDevice = state.devices.find((d) => d.type === 'iga');
  const idDevice = state.devices.find((d) => d.type === 'diferencial');
  const dpsDevice = state.devices.find((d) => d.type === 'dps');
  const peBar = state.devices.find((d) => d.type === 'barra_tierra');

  // 1. Diagnósticos preliminares de presencia de protecciones básicas (AEA 90364)
  if (!igaDevice) {
    diagnostics.push({
      id: 'diag_no_iga',
      level: 'error',
      title: 'Falta Interruptor General Automático (IGA)',
      message: 'Todo tablero debe poseer un dispositivo de corte general omnipolar en cabecera.',
    });
  }

  if (!idDevice) {
    diagnostics.push({
      id: 'diag_no_id',
      level: 'error',
      title: 'Falta Interruptor Diferencial (ID 30mA)',
      message: 'Reglamentación AEA 90364-771: Es obligatoria la protección diferencial de alta sensibilidad para personas.',
    });
  } else if (igaDevice && idDevice.ratingAmps < igaDevice.ratingAmps) {
    diagnostics.push({
      id: 'diag_id_under_iga',
      level: 'warning',
      title: 'Capacidad nominal del Diferencial insuficiente',
      message: `El ID (${idDevice.ratingAmps}A) es menor que el IGA (${igaDevice.ratingAmps}A). Corre riesgo de sobrecalentamiento ante sobrecargas sostenidas.`,
      deviceIds: [idDevice.id, igaDevice.id],
    });
  }

  if (!peBar) {
    diagnostics.push({
      id: 'diag_no_pe_bar',
      level: 'warning',
      title: 'Falta Barra Colectora de Puesta a Tierra (PE)',
      message: 'El gabinete debe disponer de barra de equipotencialidad para vincular las masas y la jabalina.',
    });
  }

  // 2. Comprobación de cortocircuitos entre cables
  let hasShortCircuit = false;
  let hasEarthFault = false;

  for (const wire of state.wires) {
    // Si un cable une directamente terminal de Fase con terminal de Neutro
    const dev1 = state.devices.find((d) => d.id === wire.fromDeviceId);
    const dev2 = state.devices.find((d) => d.id === wire.toDeviceId);
    const term1 = dev1?.terminals.find((t) => t.id === wire.fromTerminalId);
    const term2 = dev2?.terminals.find((t) => t.id === wire.toTerminalId);

    if (term1 && term2) {
      if (
        (term1.type === 'fase' && term2.type === 'neutro') ||
        (term1.type === 'neutro' && term2.type === 'fase')
      ) {
        hasShortCircuit = true;
        diagnostics.push({
          id: `diag_short_${wire.id}`,
          level: 'error',
          title: 'Cortocircuito Directo Fase-Neutro en Tablero',
          message: `Existe un puente indebido entre el borne ${term1.name} y el borne ${term2.name}.`,
          deviceIds: [wire.fromDeviceId, wire.toDeviceId],
        });
      }

      if (
        (term1.type === 'fase' && term2.type === 'tierra') ||
        (term1.type === 'tierra' && term2.type === 'fase')
      ) {
        hasEarthFault = true;
        diagnostics.push({
          id: `diag_earth_fault_${wire.id}`,
          level: 'error',
          title: 'Falla a Tierra Detectada (Fase conectada a PE)',
          message: `El borne de Fase está puenteado con Tierra. El disyuntor diferencial disparará al energizar.`,
          deviceIds: [wire.fromDeviceId, wire.toDeviceId],
        });
      }
    }
  }

  // Si no hay red eléctrica o hay cortocircuito grave, no propaga tensión
  if (!isMainsActive) {
    return {
      isMainsActive: false,
      energizedTerminals,
      energizedWires,
      activeCircuits: [],
      totalCurrentAmps: 0,
      totalActivePowerWatts: 0,
      totalApparentPowerVA: 0,
      voltageL_N: 0,
      frequencyHz: 0,
      powerFactor: 0,
      hasShortCircuit,
      hasEarthFault,
      diagnostics: [
        {
          id: 'diag_mains_off',
          level: 'info',
          title: 'Acometida sin tensión',
          message: 'Presiona "Energizar Red" para activar el suministro eléctrico del tablero.',
        },
        ...diagnostics,
      ],
    };
  }

  // 3. Propagación de potencial desde la Acometida (Bornes de entrada del IGA o primer dispositivo)
  const entryDevice = igaDevice || state.devices[0];
  if (entryDevice) {
    energizedTerminals.add(`${entryDevice.id}:1_in`);
    energizedTerminals.add(`${entryDevice.id}:N_in`);

    // Propagación recursiva / grafo
    const queue: string[] = [`${entryDevice.id}:1_in`, `${entryDevice.id}:N_in`];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const [devId, termId] = current.split(':');
      const dev = state.devices.find((d) => d.id === devId);
      if (!dev) continue;

      // Paso interno por los contactos del dispositivo si está CERRADO
      if (dev.state === 'closed') {
        let internalDest: string | null = null;
        if (termId === '1_in') internalDest = `${dev.id}:2_out`;
        else if (termId === 'N_in') internalDest = `${dev.id}:N_out`;
        else if (termId === '2_out') internalDest = `${dev.id}:1_in`;
        else if (termId === 'N_out') internalDest = `${dev.id}:N_in`;
        else if (termId === 'L_in') internalDest = `${dev.id}:PE_out`; // DPS

        if (internalDest && !energizedTerminals.has(internalDest)) {
          energizedTerminals.add(internalDest);
          queue.push(internalDest);
        }
      }

      // Propagación a través de los cables conectados a este terminal
      for (const wire of state.wires) {
        let neighborTerm: string | null = null;
        if (wire.fromDeviceId === devId && wire.fromTerminalId === termId) {
          neighborTerm = `${wire.toDeviceId}:${wire.toTerminalId}`;
          energizedWires.add(wire.id);
        } else if (wire.toDeviceId === devId && wire.toTerminalId === termId) {
          neighborTerm = `${wire.fromDeviceId}:${wire.fromTerminalId}`;
          energizedWires.add(wire.id);
        }

        if (neighborTerm && !energizedTerminals.has(neighborTerm)) {
          energizedTerminals.add(neighborTerm);
          queue.push(neighborTerm);
        }
      }
    }
  }

  // 4. Determinar qué circuitos derivados reciben energía efectiva
  let totalActivePowerWatts = 0;
  for (const dev of state.devices) {
    if (dev.type === 'termomagnetico' && dev.circuitId) {
      const isLActive = energizedTerminals.has(`${dev.id}:2_out`);
      const isNActive = energizedTerminals.has(`${dev.id}:N_out`) || dev.poles === '1P';

      if (isLActive && isNActive && dev.state === 'closed') {
        activeCircuits.push(dev.circuitId);

        // Si tenemos proyecto ELECTRA PLAN asociado, sumar las cargas de ese circuito
        if (project) {
          const circuitLoads = project.symbols.filter((s) => s.circuitId === dev.circuitId);
          const watts = circuitLoads.reduce((acc, s) => acc + (s.powerWatts || 60), 0);
          totalActivePowerWatts += watts > 0 ? watts : 350; // valor base estimado
        } else {
          totalActivePowerWatts += 450; // Potencia típica por circuito
        }
      }
    }
  }

  // Cálculo de Corriente y Potencia Aparente
  const totalApparentPowerVA = Math.round(totalActivePowerWatts / powerFactor);
  const totalCurrentAmps = Number((totalActivePowerWatts / (voltageL_N * powerFactor)).toFixed(2));

  // Diagnóstico de circuitos activos
  if (activeCircuits.length > 0) {
    diagnostics.push({
      id: 'diag_circuits_ok',
      level: 'success',
      title: `${activeCircuits.length} Circuito(s) Energizados`,
      message: `Circuitos con suministro normal: ${activeCircuits.join(', ')}. Potencia total: ${totalActivePowerWatts} W (${totalCurrentAmps} A).`,
    });
  } else if (state.devices.some((d) => d.type === 'termomagnetico')) {
    diagnostics.push({
      id: 'diag_circuits_unpowered',
      level: 'warning',
      title: 'Circuitos derivados sin alimentación',
      message: 'Comprueba el cableado desde el diferencial hacia las térmicas derivadas y que las palancas estén en posición ON.',
    });
  }

  return {
    isMainsActive,
    energizedTerminals,
    energizedWires,
    activeCircuits,
    totalCurrentAmps,
    totalActivePowerWatts,
    totalApparentPowerVA,
    voltageL_N,
    frequencyHz,
    powerFactor,
    hasShortCircuit,
    hasEarthFault,
    diagnostics,
  };
}
