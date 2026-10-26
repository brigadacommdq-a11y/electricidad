/**
 * ELECTRA PLAN — Servicio de Trazado Ortogonal de Canalizaciones y Cables
 * Ruteo Manhattan según zonas de instalación reglamentarias (AEA 90364-771)
 * y cálculo de factor de ocupación de cañerías (máx. 35%).
 */

import { WirePoint, Wire, Project, ElectricalSymbol } from '../types/electra';

export interface OrthogonalPathResult {
  points: WirePoint[];
  totalLengthMeters: number;
  totalLengthWithSlackMeters: number;
  slackPercent: number;
  conduitOccupancyPercent: number;
  recommendedConduitDiameterMm: number;
  isOccupancyCompliant: boolean;
}

// Diámetros externos aproximados según norma IRAM NM 247-3 para cables unipolares de cobre PVC 70°C (mm)
const CABLE_OUTER_DIAMETER_MM: Record<number, number> = {
  1.5: 3.0,
  2.5: 3.6,
  4.0: 4.4,
  6.0: 5.0,
  10.0: 6.4,
  16.0: 7.8,
  25.0: 9.8,
};

// Diámetros internos útiles según IRAM 62386 para caños corrugados ignífugos
const CONDUIT_INTERNAL_DIAMETER_MM: Record<number, number> = {
  16: 10.7, // 5/8"
  19: 14.1, // 3/4" (RS19)
  22: 17.5, // 7/8" (RS22)
  25: 20.0, // 1" (RS25)
  32: 26.5, // 1 1/4"
};

/**
 * Calcula el camino ortogonal Manhattan (L-shape o Z-shape) entre dos puntos
 */
export function calculateOrthogonalPath(
  p1: WirePoint,
  p2: WirePoint,
  intermediateWaypoints?: WirePoint[],
  preferHorizontalFirst = true
): WirePoint[] {
  // Si hay waypoints explícitos del usuario, unirlos ortogonalmente
  if (intermediateWaypoints && intermediateWaypoints.length > 0) {
    const fullPoints: WirePoint[] = [{ ...p1 }];
    let current = p1;

    for (const wp of intermediateWaypoints) {
      if (Math.abs(current.x - wp.x) > 2 && Math.abs(current.y - wp.y) > 2) {
        if (preferHorizontalFirst) {
          fullPoints.push({ x: wp.x, y: current.y });
        } else {
          fullPoints.push({ x: current.x, y: wp.y });
        }
      }
      fullPoints.push({ ...wp });
      current = wp;
    }

    if (Math.abs(current.x - p2.x) > 2 && Math.abs(current.y - p2.y) > 2) {
      if (preferHorizontalFirst) {
        fullPoints.push({ x: p2.x, y: current.y });
      } else {
        fullPoints.push({ x: current.x, y: p2.y });
      }
    }
    fullPoints.push({ ...p2 });
    return fullPoints;
  }

  // Si están en la misma línea vertical u horizontal
  if (Math.abs(p1.x - p2.x) < 4 || Math.abs(p1.y - p2.y) < 4) {
    return [p1, p2];
  }

  // Trazado Manhattan simple (codo a 90 grados)
  if (preferHorizontalFirst) {
    return [p1, { x: p2.x, y: p1.y }, p2];
  } else {
    return [p1, { x: p1.x, y: p2.y }, p2];
  }
}

/**
 * Convierte un arreglo de puntos ortogonales a un string de path SVG ('M x y L x y ...')
 */
export function pointsToSVGPath(points: WirePoint[], cornerRadius = 8): string {
  if (points.length < 2) return '';
  if (points.length === 2 || cornerRadius <= 0) {
    return points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
  }

  // Trazado ortogonal con esquinas redondeadas para aspecto técnico realista
  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dPrev = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dNext = Math.hypot(next.x - curr.x, next.y - curr.y);
    const r = Math.min(cornerRadius, dPrev / 2, dNext / 2);

    const dirPrevX = (curr.x - prev.x) / dPrev;
    const dirPrevY = (curr.y - prev.y) / dPrev;
    const dirNextX = (next.x - curr.x) / dNext;
    const dirNextY = (next.y - curr.y) / dNext;

    const startX = curr.x - dirPrevX * r;
    const startY = curr.y - dirPrevY * r;
    const endX = curr.x + dirNextX * r;
    const endY = curr.y + dirNextY * r;

    d += ` L ${startX} ${startY} Q ${curr.x} ${curr.y} ${endX} ${endY}`;
  }

  d += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
  return d;
}

/**
 * Calcula la longitud total del camino y el factor de ocupación de la cañería
 */
export function analyzeConduitSection(
  wire: Wire,
  fromSym: ElectricalSymbol,
  toSym: ElectricalSymbol,
  scalePixelsPerMeter = 40,
  otherWiresInSameConduit: Wire[] = []
): OrthogonalPathResult {
  const fromTerm = fromSym.terminals.find((t) => t.id === wire.fromTerminalId);
  const toTerm = toSym.terminals.find((t) => t.id === wire.toTerminalId);

  const p1: WirePoint = {
    x: fromSym.x + (fromTerm?.relX || 0),
    y: fromSym.y + (fromTerm?.relY || 0),
  };
  const p2: WirePoint = {
    x: toSym.x + (toTerm?.relX || 0),
    y: toSym.y + (toTerm?.relY || 0),
  };

  const points = calculateOrthogonalPath(p1, p2, wire.points);

  // Calcular longitud acumulada en píxeles
  let totalPx = 0;
  for (let i = 0; i < points.length - 1; i++) {
    totalPx += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
  }

  const baseMeters = Number((totalPx / scalePixelsPerMeter).toFixed(2));
  const slack = wire.slackPercent !== undefined ? wire.slackPercent : 15;
  const withSlackMeters = Number((baseMeters * (1 + slack / 100)).toFixed(2));

  // Factor de ocupación de cañería
  const allWires = [wire, ...otherWiresInSameConduit];
  let totalCableAreaMm2 = 0;

  for (const w of allWires) {
    const dExt = CABLE_OUTER_DIAMETER_MM[w.crossSectionMm2 || 2.5] || 3.6;
    const cableArea = (Math.PI * Math.pow(dExt, 2)) / 4;
    totalCableAreaMm2 += cableArea;
  }

  // Determinar diámetro de cañería mínimo para que la ocupación sea <= 35% (AEA 771.12.3.6)
  const candidateDiameters = [19, 22, 25, 32];
  let chosenDiameter = wire.conduitDiameterMm || 19;
  let chosenInternalDiameter = CONDUIT_INTERNAL_DIAMETER_MM[chosenDiameter] || 14.1;
  let occupancy = (totalCableAreaMm2 / ((Math.PI * Math.pow(chosenInternalDiameter, 2)) / 4)) * 100;

  if (occupancy > 35) {
    for (const d of candidateDiameters) {
      const dInt = CONDUIT_INTERNAL_DIAMETER_MM[d] || 14.1;
      const occ = (totalCableAreaMm2 / ((Math.PI * Math.pow(dInt, 2)) / 4)) * 100;
      if (occ <= 35) {
        chosenDiameter = d;
        occupancy = occ;
        break;
      }
    }
  }

  return {
    points,
    totalLengthMeters: baseMeters,
    totalLengthWithSlackMeters: withSlackMeters,
    slackPercent: slack,
    conduitOccupancyPercent: Number(occupancy.toFixed(1)),
    recommendedConduitDiameterMm: chosenDiameter,
    isOccupancyCompliant: occupancy <= 35,
  };
}
