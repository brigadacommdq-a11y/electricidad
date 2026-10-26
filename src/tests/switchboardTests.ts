/**
 * ELECTRA PLAN — Suite de Pruebas Automatizadas para el Taller de Tableros Eléctricos
 */
import { SWITCHBOARD_WORKSHOP_LEVELS } from '../services/switchboardWorkshops';
import { simulateSwitchboard } from '../services/switchboardSimulation';
import { createRealisticDINDevice } from '../services/switchboardCatalog';
import { RealisticSwitchboardState } from '../types/switchboardWorkshop';

export function runSwitchboardTests() {
  const results: { name: string; pass: boolean; detail?: string }[] = [];

  const assert = (name: string, condition: boolean, detail?: string) => {
    results.push({ name, pass: condition, detail });
    if (!condition) {
      console.error(`❌ TEST FAILED: ${name}`, detail);
    } else {
      console.log(`✅ TEST PASSED: ${name}`);
    }
  };

  // Test 1: Verificar que los 15 talleres estén declarados e implementados
  assert(
    '1. Verificación de los 15 talleres prácticos guiados',
    SWITCHBOARD_WORKSHOP_LEVELS.length === 15,
    `Total talleres: ${SWITCHBOARD_WORKSHOP_LEVELS.length}`
  );

  // Test 2: Validación del Taller 1 (Reconocimiento de componentes)
  const level1 = SWITCHBOARD_WORKSHOP_LEVELS[0];
  const dummyStateLevel1: RealisticSwitchboardState = {
    cabinetModel: 'Gabinete 24M',
    rowsCount: 2,
    modulesPerRow: 14,
    doorOpen: true,
    doorType: 'fume',
    hasCableDucts: true,
    mainsEnergized: true,
    supplyVoltage: 220,
    supplyFrequency: 50,
    simulatedFault: 'none',
    rails: [{ id: 1, name: 'Riel 1', capacityModules: 14 }],
    devices: [
      createRealisticDINDevice('iga', 1, 0, undefined, 32),
      createRealisticDINDevice('diferencial', 1, 1, undefined, 40),
      createRealisticDINDevice('termomagnetico', 1, 2, 'C1', 16),
      createRealisticDINDevice('barra_tierra', 1, 3),
    ],
    wires: [],
  };
  const val1 = level1.validateSolution(dummyStateLevel1);
  assert('2. Validación automática del Taller 1 con componentes correctos', val1.passed === true);

  // Test 3: Simulación de cortocircuito Fase -> Neutro directo
  const shortCircuitState: RealisticSwitchboardState = {
    ...dummyStateLevel1,
    wires: [
      {
        id: 'w_short_test',
        fromDeviceId: dummyStateLevel1.devices[0].id,
        fromTerminalId: '1_in', // Fase
        toDeviceId: dummyStateLevel1.devices[0].id,
        toTerminalId: 'N_in', // Neutro
        conductorType: 'fase',
        crossSectionMm2: 4,
        color: '#854d0e',
        routing: 'directo',
      },
    ],
  };
  const simShort = simulateSwitchboard(shortCircuitState);
  assert(
    '3. Detección de cortocircuito directo Fase-Neutro en el tablero',
    simShort.hasShortCircuit === true,
    `hasShortCircuit: ${simShort.hasShortCircuit}`
  );

  // Test 4: Simulación de energización y cálculo de corriente con protecciones activas
  const normalState: RealisticSwitchboardState = {
    ...dummyStateLevel1,
    wires: [
      {
        id: 'w_iga_diff_L',
        fromDeviceId: dummyStateLevel1.devices[0].id,
        fromTerminalId: '2_out',
        toDeviceId: dummyStateLevel1.devices[1].id,
        toTerminalId: '1_in',
        conductorType: 'fase',
        crossSectionMm2: 6,
        color: '#854d0e',
        routing: 'canaleta',
      },
      {
        id: 'w_iga_diff_N',
        fromDeviceId: dummyStateLevel1.devices[0].id,
        fromTerminalId: 'N_out',
        toDeviceId: dummyStateLevel1.devices[1].id,
        toTerminalId: 'N_in',
        conductorType: 'neutro',
        crossSectionMm2: 6,
        color: '#0284c7',
        routing: 'canaleta',
      },
      {
        id: 'w_diff_pia_L',
        fromDeviceId: dummyStateLevel1.devices[1].id,
        fromTerminalId: '2_out',
        toDeviceId: dummyStateLevel1.devices[2].id,
        toTerminalId: '1_in',
        conductorType: 'fase',
        crossSectionMm2: 4,
        color: '#854d0e',
        routing: 'canaleta',
      },
      {
        id: 'w_diff_pia_N',
        fromDeviceId: dummyStateLevel1.devices[1].id,
        fromTerminalId: 'N_out',
        toDeviceId: dummyStateLevel1.devices[2].id,
        toTerminalId: 'N_in',
        conductorType: 'neutro',
        crossSectionMm2: 4,
        color: '#0284c7',
        routing: 'canaleta',
      },
    ],
  };
  const simNormal = simulateSwitchboard(normalState);
  assert(
    '4. Propagación de potencial y activación de circuito derivado C1',
    simNormal.activeCircuits.includes('C1') && simNormal.totalCurrentAmps > 0,
    `Circuitos activos: ${simNormal.activeCircuits.join(', ')}, Corriente: ${simNormal.totalCurrentAmps} A`
  );

  // Test 5: Simulación de disparo del diferencial por botón TEST
  const trippedDiffState: RealisticSwitchboardState = {
    ...normalState,
    devices: normalState.devices.map((d) =>
      d.type === 'diferencial' ? { ...d, state: 'tripped' } : d
    ),
  };
  const simTripped = simulateSwitchboard(trippedDiffState);
  assert(
    '5. Corte instantáneo de suministro aguas abajo al disparar el Diferencial',
    simTripped.activeCircuits.length === 0,
    `Circuitos activos con ID disparado: ${simTripped.activeCircuits.length}`
  );

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\nResultados Taller de Tableros: ${passed}/${results.length} pruebas superadas.`);

  return { total: results.length, passed, failed, results };
}
