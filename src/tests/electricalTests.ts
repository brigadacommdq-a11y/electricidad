/**
 * ELECTRA PLAN — Suite de Pruebas Automatizadas
 * Verificación exhaustiva de cálculos, simulación de continuidad, cortocircuitos y topología.
 */

import { createDemoProject } from '../services/demoProject';
import { simulateElectricalNetwork } from '../services/electricalSimulation';
import { calculateCurrent, calculateVoltageDrop, calculateProjectInstallation } from '../services/electricalCalculations';
import { generateBOM } from '../services/bomService';
import { createSymbolFromTemplate } from '../services/symbolCatalog';
import { Wire, ElectricalSymbol } from '../types/electra';

export function runAutomatedTests(): { total: number; passed: number; failed: number; results: { name: string; pass: boolean; detail?: string }[] } {
  const results: { name: string; pass: boolean; detail?: string }[] = [];

  const assert = (name: string, condition: boolean, detail?: string) => {
    results.push({ name, pass: condition, detail });
    if (!condition) {
      console.error(`❌ TEST FAILED: ${name}`, detail);
    } else {
      console.log(`✅ TEST PASSED: ${name}`);
    }
  };

  // Test 1: Crear proyecto demo
  const project = createDemoProject();
  assert('1. Creación de proyecto base estructurado', !!project && project.rooms.length > 0 && project.symbols.length > 0);

  // Test 2: Validación de cálculo de corriente monofásica conocida (P=2200W, V=220V, cos phi=1 => I=10A)
  const iTest = calculateCurrent(2200, 220, 1.0, 1);
  assert('2. Cálculo de corriente monofásica (2200W/220V/cos 1.0 = 10A)', Math.abs(iTest - 10) < 0.01, `Obtenido: ${iTest} A`);

  // Test 3: Validación de caída de tensión para hipótesis estándar
  // L=15m (ida), I=10A, cos phi=0.9, Cu (kappa=56), S=2.5mm²
  // deltaV = (2 * 15 * 10 * 0.9) / (56 * 2.5) = 270 / 140 = 1.928 V (0.88% de 220V)
  const vDropTest = calculateVoltageDrop(15, 10, 0.9, 2.5, 'Cu', 1, 220);
  assert(
    '3. Cálculo de caída de tensión ΔV según electrotécnica',
    vDropTest.deltaV > 1.8 && vDropTest.deltaV < 2.1 && vDropTest.percentage < 1.5,
    `Obtenido: ${vDropTest.deltaV} V (${vDropTest.percentage}%)`
  );

  // Test 4: Simulación de circuito con lámpara e interruptor cerrado
  // Crear circuito mínimo: Fuente -> Llave cerrada -> Lámpara -> Neutro
  const sFuente = createSymbolFromTemplate('fuente_ac', 0, 0, 'f1', 'C1', 1);
  const sKey = createSymbolFromTemplate('interruptor_simple', 100, 0, 'f1', 'C1', 1);
  sKey.state = { isOpen: false, isEnergized: false }; // Tecla cerrada
  const sLamp = createSymbolFromTemplate('luminaria', 200, 0, 'f1', 'C1', 1);

  const w1: Wire = {
    id: 'w1',
    floorId: 'f1',
    type: 'fase',
    fromComponentId: sFuente.id,
    fromTerminalId: 'L',
    toComponentId: sKey.id,
    toTerminalId: 'L',
    color: '#854d0e',
    crossSectionMm2: 1.5,
    lengthMeters: 2,
  };
  const w2: Wire = {
    id: 'w2',
    floorId: 'f1',
    type: 'retorno',
    fromComponentId: sKey.id,
    fromTerminalId: 'R',
    toComponentId: sLamp.id,
    toTerminalId: 'L',
    color: '#f59e0b',
    crossSectionMm2: 1.5,
    lengthMeters: 2,
  };
  const w3: Wire = {
    id: 'w3',
    floorId: 'f1',
    type: 'neutro',
    fromComponentId: sLamp.id,
    fromTerminalId: 'N',
    toComponentId: sFuente.id,
    toTerminalId: 'N',
    color: '#0284c7',
    crossSectionMm2: 1.5,
    lengthMeters: 2,
  };

  const testProject1: any = {
    ...project,
    symbols: [sFuente, sKey, sLamp],
    wires: [w1, w2, w3],
  };

  const simResult1 = simulateElectricalNetwork(testProject1);
  assert(
    '4. Simulación: Lámpara se enciende con interruptor cerrado',
    simResult1.simState.activeLamps.has(sLamp.id) && !simResult1.simState.hasShortCircuit,
    `Lámparas encendidas: ${Array.from(simResult1.simState.activeLamps).join(', ')}`
  );

  // Test 5: Simulación: Al abrir el interruptor, la lámpara debe apagarse
  sKey.state = { isOpen: true }; // Tecla abierta
  const testProject2: any = {
    ...project,
    symbols: [sFuente, sKey, sLamp],
    wires: [w1, w2, w3],
  };
  const simResult2 = simulateElectricalNetwork(testProject2);
  assert(
    '5. Simulación: Lámpara se apaga al abrir el interruptor',
    !simResult2.simState.activeLamps.has(sLamp.id),
    `Lámparas encendidas con llave abierta: ${simResult2.simState.activeLamps.size}`
  );

  // Test 6: Detección fiable de cortocircuito directo Fase -> Neutro
  const wShort: Wire = {
    id: 'w_short',
    floorId: 'f1',
    type: 'fase',
    fromComponentId: sFuente.id,
    fromTerminalId: 'L',
    toComponentId: sFuente.id,
    toTerminalId: 'N',
    color: '#ef4444',
    crossSectionMm2: 2.5,
    lengthMeters: 1,
  };
  const testProjectShort: any = {
    ...project,
    symbols: [sFuente],
    wires: [wShort],
  };
  const simShortResult = simulateElectricalNetwork(testProjectShort);
  assert(
    '6. Detección de cortocircuito directo entre Fase y Neutro',
    simShortResult.simState.hasShortCircuit === true,
    `hasShortCircuit: ${simShortResult.simState.hasShortCircuit}`
  );

  // Test 7: Conductor de protección en Tomacorriente (TUG)
  const sToma = createSymbolFromTemplate('tomacorriente', 150, 0, 'f1', 'C2', 1);
  const testProjectToma: any = {
    ...project,
    symbols: [sFuente, sToma],
    wires: [
      {
        id: 'wt1',
        floorId: 'f1',
        type: 'fase',
        fromComponentId: sFuente.id,
        fromTerminalId: 'L',
        toComponentId: sToma.id,
        toTerminalId: 'L',
        color: '#854d0e',
        crossSectionMm2: 2.5,
        lengthMeters: 2,
      },
      {
        id: 'wt2',
        floorId: 'f1',
        type: 'neutro',
        fromComponentId: sFuente.id,
        fromTerminalId: 'N',
        toComponentId: sToma.id,
        toTerminalId: 'N',
        color: '#0284c7',
        crossSectionMm2: 2.5,
        lengthMeters: 2,
      },
    ],
  };
  const simTomaResult = simulateElectricalNetwork(testProjectToma);
  const tomaWarning = simTomaResult.simState.diagnostics.some((d) => d.id.includes('diag_toma_no_pe'));
  assert(
    '7. Advertencia de seguridad cuando tomacorriente carece de conductor PE',
    tomaWarning,
    `Alerta PE emitida correctamente`
  );

  // Test 8: Generación de Cómputo Métrico de Materiales (BOM)
  const bom = generateBOM(project, 15);
  assert(
    '8. Generación íntegra de cómputo de materiales (BOM)',
    bom.length > 5 && bom.some((i) => i.name.includes('Cable')) && bom.some((i) => i.name.includes('Caño')),
    `Ítems calculados: ${bom.length}`
  );

  // Test 9: Comprobación de persistencia y serialización JSON
  const jsonStr = JSON.stringify(project);
  const restored = JSON.parse(jsonStr);
  assert(
    '9. Serialización e importación JSON consistente',
    restored.metadata.id === project.metadata.id && restored.symbols.length === project.symbols.length,
    `Versión exportada: ${restored.version}`
  );

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  return { total: results.length, passed, failed, results };
}
