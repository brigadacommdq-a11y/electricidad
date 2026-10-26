/**
 * ELECTRA PLAN — Servicio de Selección, Dimensionamiento y Especificación de Conductores
 * Reglamentación AEA 90364-7-771 e IRAM NM 247-3 / IRAM NM 280 / IRAM 62267
 */

import { Wire, Circuit, Project } from '../types/electra';

export interface ConductorSpecSheet {
  wireId: string;
  circuitId?: string;
  circuitName?: string;
  functionType: 'fase' | 'neutro' | 'tierra' | 'retorno' | 'puente';
  standardColorHex: string;
  standardColorName: string;
  material: string;
  standardNormative: string;
  insulationType: 'PVC_70' | 'LS0H_90';
  insulationDescription: string;
  crossSectionMm2: number;
  minimumRequiredSectionMm2: number;
  isSectionReglamentary: boolean;
  lengthMetersNominal: number;
  slackPercent: number;
  lengthMetersTotal: number;
  installationMethod: 'B1' | 'B2' | 'C';
  installationMethodName: string;
  ambientTempC: number;
  kt: number; // Factor temperatura
  groupingCircuitsCount: number;
  kn: number; // Factor agrupamiento
  admissibleCurrentIz0: number; // Corriente base en A
  admissibleCurrentIz: number; // Corriente corregida Iz = Iz0 * kt * kn
  designCurrentIb: number; // Corriente de diseño del circuito
  breakerRatingIn: number; // In de la termomagnética
  i2OverloadCurrent: number; // I2 = 1.45 * In
  isIbLessOrEqualIn: boolean; // Ib <= In
  isInLessOrEqualIz: boolean; // In <= Iz
  isI2Protected: boolean; // I2 <= 1.45 * Iz
  isProtectionCoordinated: boolean;
  voltageDropVolts: number;
  voltageDropPercent: number;
  maxAllowedVoltageDropPercent: number;
  isVoltageDropCompliant: boolean;
  recommendedConduitDiameterMm: number;
  normativeReferences: string[];
  notes: string[];
}

// Capacidades de corriente base (Iz0) a 40°C ambiente para conductores aislados en PVC (70°C) según AEA 771 Tabla 771.16.I
// Método B1: 2 conductores cargados en cañería embutida
const IZ0_B1_PVC_CU: Record<number, number> = {
  1.5: 15,
  2.5: 21,
  4.0: 28,
  6.0: 36,
  10.0: 50,
  16.0: 66,
  25.0: 88,
  35.0: 109,
};

// Factor de corrección por temperatura ambiente (Tabla 771.16.II para PVC 70°C con ref 40°C)
export function getTemperatureCorrectionFactor(tempC: number): number {
  if (tempC <= 25) return 1.22;
  if (tempC <= 30) return 1.15;
  if (tempC <= 35) return 1.08;
  if (tempC <= 40) return 1.00;
  if (tempC <= 45) return 0.91;
  if (tempC <= 50) return 0.82;
  return 0.71;
}

// Factor de corrección por agrupamiento de circuitos en una misma cañería (Tabla 771.16.III)
export function getGroupingCorrectionFactor(circuitCount: number): number {
  if (circuitCount <= 1) return 1.0;
  if (circuitCount === 2) return 0.8;
  if (circuitCount === 3) return 0.7;
  if (circuitCount <= 5) return 0.65;
  return 0.6;
}

// Secciones mínimas obligatorias según AEA 90364-771 Tabla 771.13.I
export function getMinimumAllowedSection(
  wireType: 'fase' | 'neutro' | 'tierra' | 'retorno' | 'puente',
  circuitType?: string
): number {
  if (wireType === 'tierra') return 2.5; // PE reglamentario mínimo 2.5 mm² con aislación Verde/Amarillo
  if (wireType === 'retorno') return 1.5; // Retorno de iluminación
  if (circuitType === 'IUG' || circuitType === 'IUE') return 1.5;
  if (circuitType === 'TUG') return 2.5;
  if (circuitType === 'TUE' || circuitType === 'AC') return 2.5;
  return 2.5; // Predeterminado
}

/**
 * Genera la especificación técnica completa y transparente para un conductor dado
 */
export function generateConductorSpec(
  wire: Wire,
  project: Project,
  ambientTempC = 40,
  groupingCount = 1
): ConductorSpecSheet {
  const circuit = project.circuits.find((c) => c.id === wire.circuitId);
  const circuitType = circuit?.type || (wire.crossSectionMm2 <= 1.5 ? 'IUG' : 'TUG');
  const circuitName = circuit?.name || (wire.circuitId ? `Circuito ${wire.circuitId}` : 'Circuito General');

  // Mínimo admisible según AEA 771
  const minRequired = getMinimumAllowedSection(wire.type, circuitType);
  const crossSection = wire.crossSectionMm2 || minRequired;
  const isSectionReglamentary = crossSection >= minRequired;

  // Holgura para curvas y borneras
  const slack = wire.slackPercent !== undefined ? wire.slackPercent : 15;
  const baseLength = wire.lengthMeters || 3.0;
  const totalLength = Number((baseLength * (1 + slack / 100)).toFixed(2));

  // Capacidad Iz0
  const iz0 = IZ0_B1_PVC_CU[crossSection] || 15;
  const kt = getTemperatureCorrectionFactor(ambientTempC);
  const kn = getGroupingCorrectionFactor(groupingCount);
  const iz = Number((iz0 * kt * kn).toFixed(1));

  // Corriente de diseño Ib
  const circuitSymbols = project.symbols.filter((s) => s.circuitId === wire.circuitId);
  const totalWatts = circuitSymbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0) || (circuitType === 'IUG' ? 600 : 1800);
  const voltage = circuit?.voltage || 220;
  const cosPhi = circuit?.powerFactor || 0.9;
  const ib = Number((totalWatts / (voltage * cosPhi)).toFixed(1));

  // Dispositivo de protección In
  const inBreaker = circuit?.breakerAmps || (crossSection <= 1.5 ? 10 : crossSection <= 2.5 ? 16 : 20);
  const i2 = Number((1.45 * inBreaker).toFixed(1));

  // Verificación de coordinación según AEA 771
  // Regla 1: Ib <= In <= Iz
  const isIbLessOrEqualIn = ib <= inBreaker;
  const isInLessOrEqualIz = inBreaker <= iz;
  // Regla 2: I2 <= 1.45 * Iz
  const isI2Protected = i2 <= Number((1.45 * iz).toFixed(1));
  const isProtectionCoordinated = isIbLessOrEqualIn && isInLessOrEqualIz && isI2Protected;

  // Caída de tensión con conductividad de cobre a 70°C de trabajo (kappa = 48 m/(Ohm*mm2))
  // ΔV = (2 * L * Ib * cosPhi) / (kappa * S)
  const kappa = 48; // Conductividad en régimen a 70°C
  const deltaV = Number(((2 * totalLength * ib * cosPhi) / (kappa * crossSection)).toFixed(2));
  const deltaVPercent = Number(((deltaV / voltage) * 100).toFixed(2));
  const maxAllowedPercent = circuitType.startsWith('I') ? 3.0 : 5.0; // 3% iluminación, 5% tomas/fuerza motriz
  const isVoltageDropCompliant = deltaVPercent <= maxAllowedPercent;

  // Diámetro de cañería recomendado para ocupación <= 35%
  let conduitDiameter = 19; // 3/4"
  if (crossSection >= 4.0 || groupingCount >= 2) conduitDiameter = 22; // 7/8"
  if (crossSection >= 6.0 || groupingCount >= 3) conduitDiameter = 25; // 1"

  const standardColors: Record<string, { hex: string; name: string }> = {
    fase: { hex: '#854d0e', name: 'Marrón / Negro / Rojo (IRAM 2183)' },
    neutro: { hex: '#0284c7', name: 'Celeste Claro (IRAM 2183)' },
    tierra: { hex: '#16a34a', name: 'Verde con Franja Amarilla (IRAM 2183)' },
    retorno: { hex: '#eab308', name: 'Blanco / Gris (AEA 771)' },
    puente: { hex: '#ea580c', name: 'Naranja / Violeta (Auxiliar)' },
  };

  const notes: string[] = [];
  if (!isSectionReglamentary) {
    notes.push(
      `ADVERTENCIA: La sección instalada (${crossSection} mm²) es menor que el mínimo reglamentario (${minRequired} mm²) para circuitos ${circuitType}.`
    );
  }
  if (!isInLessOrEqualIz) {
    notes.push(
      `RIESGO TÉRMICO: La termomagnética (In=${inBreaker} A) supera la capacidad del cable (Iz=${iz} A con factores kt=${kt}, kn=${kn}). El cable puede sobrecalentarse antes de que actúe la protección.`
    );
  }
  if (!isVoltageDropCompliant) {
    notes.push(
      `CAÍDA DE TENSIÓN EXCESIVA: ΔV% = ${deltaVPercent}% supera el límite normativo de ${maxAllowedPercent}%. Incrementar sección a ${
        crossSection === 1.5 ? 2.5 : crossSection === 2.5 ? 4.0 : 6.0
      } mm².`
    );
  }

  return {
    wireId: wire.id,
    circuitId: wire.circuitId,
    circuitName,
    functionType: wire.type,
    standardColorHex: standardColors[wire.type]?.hex || '#94a3b8',
    standardColorName: standardColors[wire.type]?.name || 'Normalizado',
    material: 'Cobre electrolítico recocido clase 4 o 5 (IRAM NM 280) — 99,9% pureza',
    standardNormative: 'IRAM NM 247-3 / IRAM 2183 / AEA 90364-7-771',
    insulationType: wire.insulationType || 'PVC_70',
    insulationDescription:
      wire.insulationType === 'LS0H_90'
        ? 'Aislación libre de halógenos y baja emisión de humos tóxicos (IRAM 62267, 90°C)'
        : 'Policloruro de vinilo (PVC) antillama tipo VN 2000 (IRAM NM 247-3, 70°C)',
    crossSectionMm2: crossSection,
    minimumRequiredSectionMm2: minRequired,
    isSectionReglamentary,
    lengthMetersNominal: baseLength,
    slackPercent: slack,
    lengthMetersTotal: totalLength,
    installationMethod: wire.installationMethod || 'B1',
    installationMethodName: 'B1 — Conductores aislados en cañería embutida en mampostería',
    ambientTempC,
    kt,
    groupingCircuitsCount: groupingCount,
    kn,
    admissibleCurrentIz0: iz0,
    admissibleCurrentIz: iz,
    designCurrentIb: ib,
    breakerRatingIn: inBreaker,
    i2OverloadCurrent: i2,
    isIbLessOrEqualIn,
    isInLessOrEqualIz,
    isI2Protected,
    isProtectionCoordinated,
    voltageDropVolts: deltaV,
    voltageDropPercent: deltaVPercent,
    maxAllowedVoltageDropPercent: maxAllowedPercent,
    isVoltageDropCompliant,
    recommendedConduitDiameterMm: conduitDiameter,
    normativeReferences: [
      'AEA 90364-7-771 (Edición 2006): Instalaciones Eléctricas en Inmuebles',
      'IRAM NM 247-3: Cables aislados con PVC para tensiones nominales hasta 450/750 V',
      'IRAM NM 280: Conductores de cables aislados (clases de flexibilidad)',
      'IRAM 2183: Código de colores para identificación de conductores en instalaciones fijas',
    ],
    notes,
  };
}
