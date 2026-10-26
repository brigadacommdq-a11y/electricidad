/**
 * ELECTRA PLAN — Módulo de Cálculos Eléctricos Transparentes
 * Fórmulas visibles, verificación de caída de tensión y coordinación de protecciones
 * Basado en principios de electrotécnica y lineamientos AEA 90364 (Argentina)
 */

import { Circuit, Project, ElectricalSymbol } from '../types/electra';

export interface CircuitCalculation {
  circuitId: string;
  circuitName: string;
  circuitType: string;
  loadCount: number;
  activePowerWatts: number; // P en W
  apparentPowerVA: number; // S en VA
  powerFactor: number; // cos φ
  voltage: number; // V
  phases: 1 | 3;
  designCurrentAmps: number; // Ib en A
  conductorMaterial: 'Cu' | 'Al';
  crossSectionMm2: number; // S en mm²
  lengthMeters: number; // Longitud de ida
  voltageDropVolts: number; // ΔV en V
  voltageDropPercent: number; // % ΔV
  maxAllowedVoltageDropPercent: number; // 3% o 5%
  isVoltageDropCompliant: boolean;
  admissibleCurrentAmps: number; // Iz en A (capacidad de corriente en cañería embutida)
  breakerRatingAmps: number; // In en A
  isProtectionCoordinated: boolean; // Ib <= In <= Iz
  verificationNotes: string[];
}

export interface GlobalProjectCalculation {
  totalInstalledWatts: number;
  totalInstalledVA: number;
  simultaneityFactor: number; // Factor de simultaneidad estimado (0.7 a 1.0)
  maxDemandWatts: number; // Demanda Máxima de Potencia Simultánea (DMPS)
  generalMainCurrentAmps: number; // Corriente de acometida general
  circuits: CircuitCalculation[];
  generalStatus: 'optimo' | 'advertencia' | 'critico';
  generalNotes: string[];
}

// Conductividades típicas a 70°C de trabajo de conductores aislados en PVC (m / (Ω·mm²))
const CONDUCTIVITY_CU = 56; // Cobre
const CONDUCTIVITY_AL = 35; // Aluminio

// Capacidades de corriente admisibles (Iz) según AEA 90364-7-771 Tabla 771.16.I (2 conductores con carga en cañería embutida a 40°C)
const ADMISSIBLE_CURRENT_CU: Record<number, number> = {
  1.5: 15,
  2.5: 21,
  4.0: 28,
  6.0: 36,
  10.0: 50,
  16.0: 66,
  25.0: 88,
};

const ADMISSIBLE_CURRENT_AL: Record<number, number> = {
  2.5: 16,
  4.0: 22,
  6.0: 28,
  10.0: 39,
  16.0: 51,
  25.0: 68,
};

/**
 * Calcula la corriente de diseño de un circuito
 * Monofásica: Ib = P / (V * cos φ)
 * Trifásica: Ib = P / (√3 * V * cos φ)
 */
export function calculateCurrent(
  powerWatts: number,
  voltage: number,
  cosPhi: number,
  phases: 1 | 3 = 1,
  efficiency: number = 1.0
): number {
  if (voltage <= 0 || cosPhi <= 0) return 0;

  if (phases === 3) {
    return powerWatts / (Math.sqrt(3) * voltage * cosPhi * efficiency);
  } else {
    return powerWatts / (voltage * cosPhi * efficiency);
  }
}

/**
 * Calcula la caída de tensión en voltios y porcentaje
 * Para monofásico: ΔV = (2 * L * Ib * cos φ) / (κ * S)
 * Para trifásico equilibrado: ΔV = (√3 * L * Ib * cos φ) / (κ * S)
 * Donde L es la longitud de ida (metros), κ es la conductividad y S la sección (mm²)
 */
export function calculateVoltageDrop(
  lengthMeters: number,
  currentAmps: number,
  cosPhi: number,
  crossSectionMm2: number,
  material: 'Cu' | 'Al' = 'Cu',
  phases: 1 | 3 = 1,
  nominalVoltage: number = 220
): { deltaV: number; percentage: number } {
  if (crossSectionMm2 <= 0 || lengthMeters <= 0 || currentAmps <= 0) {
    return { deltaV: 0, percentage: 0 };
  }

  const kappa = material === 'Cu' ? CONDUCTIVITY_CU : CONDUCTIVITY_AL;
  const factor = phases === 3 ? Math.sqrt(3) : 2.0;

  const deltaV = (factor * lengthMeters * currentAmps * cosPhi) / (kappa * crossSectionMm2);
  const percentage = (deltaV / nominalVoltage) * 100;

  return {
    deltaV: Number(deltaV.toFixed(2)),
    percentage: Number(percentage.toFixed(2)),
  };
}

/**
 * Realiza el cálculo global y por circuito para el proyecto
 */
export function calculateProjectInstallation(
  project: Project,
  simultaneityFactor: number = 0.8
): GlobalProjectCalculation {
  const circuitCalcs: CircuitCalculation[] = [];
  let totalInstalledWatts = 0;
  let totalInstalledVA = 0;
  let generalStatus: 'optimo' | 'advertencia' | 'critico' = 'optimo';
  const generalNotes: string[] = [];

  for (const c of project.circuits) {
    // Buscar cargas asociadas a este circuito en los símbolos del plano
    const associatedSymbols = project.symbols.filter((s) => s.circuitId === c.id);
    const loadSumWatts = associatedSymbols.reduce((acc, s) => acc + (s.powerWatts || 0), 0);

    // Si no hay cargas directas en el plano, tomar un mínimo normativo estimado
    const effectiveWatts = loadSumWatts > 0 ? loadSumWatts : (c.type === 'IUG' ? 660 : c.type === 'TUG' ? 2200 : 1500);
    const cosPhi = c.powerFactor || 0.9;
    const apparentVA = effectiveWatts / cosPhi;

    totalInstalledWatts += effectiveWatts;
    totalInstalledVA += apparentVA;

    // Corriente de diseño Ib
    const Ib = calculateCurrent(effectiveWatts, c.voltage, cosPhi, c.phases);

    // Caída de tensión
    const length = c.lengthMetersEstimate || 15;
    const vDrop = calculateVoltageDrop(
      length,
      Ib,
      cosPhi,
      c.crossSectionMm2,
      c.conductorMaterial,
      c.phases,
      c.voltage
    );

    // Límite normativo de caída de tensión: 3% para iluminación, 5% para tomas/fuerza motriz (AEA 771.19.6)
    const maxDropAllowed = c.type === 'IUG' || c.type === 'IUE' ? 3.0 : 5.0;
    const isVoltageDropCompliant = vDrop.percentage <= maxDropAllowed;

    // Capacidad admisible de corriente Iz
    const table = c.conductorMaterial === 'Cu' ? ADMISSIBLE_CURRENT_CU : ADMISSIBLE_CURRENT_AL;
    const Iz = table[c.crossSectionMm2] || 20;

    // Coordinación de protecciones: Ib <= In <= Iz
    const In = c.breakerAmps;
    const isProtectionCoordinated = Ib <= In && In <= Iz;

    const notes: string[] = [];
    if (!isVoltageDropCompliant) {
      notes.push(`Caída de tensión excesiva (${vDrop.percentage}% > ${maxDropAllowed}%). Se sugiere aumentar sección a ${getNextGauge(c.crossSectionMm2)} mm².`);
      generalStatus = 'critico';
    }
    if (In < Ib) {
      notes.push(`La corriente asignada al interruptor (In = ${In}A) es menor que la corriente de proyecto (Ib = ${Ib.toFixed(1)}A). Posible disparo por sobrecarga.`);
      generalStatus = 'critico';
    }
    if (In > Iz) {
      notes.push(`El interruptor (In = ${In}A) excede la corriente admisible del cable (Iz = ${Iz}A para ${c.crossSectionMm2} mm²). Riesgo de sobrecalentamiento del conductor.`);
      generalStatus = 'critico';
    }
    if (notes.length === 0) {
      notes.push('Coordinación térmica y caída de tensión conformes según modelo.');
    }

    circuitCalcs.push({
      circuitId: c.id,
      circuitName: c.name,
      circuitType: c.type,
      loadCount: associatedSymbols.length,
      activePowerWatts: Math.round(effectiveWatts),
      apparentPowerVA: Math.round(apparentVA),
      powerFactor: cosPhi,
      voltage: c.voltage,
      phases: c.phases,
      designCurrentAmps: Number(Ib.toFixed(2)),
      conductorMaterial: c.conductorMaterial,
      crossSectionMm2: c.crossSectionMm2,
      lengthMeters: length,
      voltageDropVolts: vDrop.deltaV,
      voltageDropPercent: vDrop.percentage,
      maxAllowedVoltageDropPercent: maxDropAllowed,
      isVoltageDropCompliant,
      admissibleCurrentAmps: Iz,
      breakerRatingAmps: In,
      isProtectionCoordinated,
      verificationNotes: notes,
    });
  }

  // Demanda Máxima de Potencia Simultánea (DMPS)
  const maxDemandWatts = totalInstalledWatts * simultaneityFactor;
  const generalCurrent = calculateCurrent(maxDemandWatts, 220, 0.9, 1);

  generalNotes.push(
    'Cálculos transparentes basados en fórmulas de la electrotécnica. Todo dimensionamiento definitivo debe considerar temperatura ambiente, agrupamiento en cañerías y ser visado por un profesional electricista habilitado según normas AEA vigentes.'
  );

  return {
    totalInstalledWatts,
    totalInstalledVA: Math.round(totalInstalledVA),
    simultaneityFactor,
    maxDemandWatts: Math.round(maxDemandWatts),
    generalMainCurrentAmps: Number(generalCurrent.toFixed(1)),
    circuits: circuitCalcs,
    generalStatus,
    generalNotes,
  };
}

function getNextGauge(current: number): number {
  const gauges = [1.5, 2.5, 4.0, 6.0, 10.0, 16.0];
  const idx = gauges.indexOf(current);
  if (idx !== -1 && idx < gauges.length - 1) {
    return gauges[idx + 1];
  }
  return current * 1.5;
}
