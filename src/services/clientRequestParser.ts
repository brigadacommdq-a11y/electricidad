/**
 * ELECTRA PLAN — Servicio de Solicitud de Instalación para Clientes
 * Procesa transcripciones de voz o texto, calcula grado de electrificación según AEA 90364-771,
 * genera la lista de consultas técnicas al cliente y sintetiza un anteproyecto CAD editable.
 */

import { Project, Room, ElectricalSymbol, Wire, Circuit, ArchElement } from '../types/electra';
import { createSymbolFromTemplate } from './symbolCatalog';

export interface ClientRoomRequest {
  id: string;
  name: string;
  widthM: number;
  lengthM: number;
  areaM2: number;
  lightsCount: number;
  switchesCount: number;
  outletsGeneralCount: number;
  outletsSpecialCount: number;
  appliances: string[];
}

export interface ClientInstallationRequest {
  id: string;
  createdAt: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  address: string;
  propertyType: 'vivienda_unifamiliar' | 'departamento' | 'local_comercial' | 'oficina';
  rooms: ClientRoomRequest[];
  highPowerAppliances: {
    name: string;
    powerWatts: number;
    dedicatedCircuitRequired: boolean;
    roomName: string;
  }[];
  notes: string;
  audioTranscript?: string;
  installationType: 'embutido' | 'a_la_vista' | 'subterraneo';
}

export interface ProposalClarification {
  id: string;
  question: string;
  context: string;
  importance: 'alta' | 'media';
}

export interface GeneratedProposal {
  project: Project;
  electrificationGrade: 'Mínimo' | 'Medio' | 'Elevado' | 'Superior';
  totalAreaM2: number;
  minCircuitsCount: number;
  recommendedCircuitsCount: number;
  clarifications: ProposalClarification[];
  summaryPoints: {
    totalLights: number;
    totalOutletsTUG: number;
    totalOutletsTUE: number;
    totalSpecialLoadsWatts: number;
  };
}

/**
 * Determina el grado de electrificación reglamentario según AEA 90364-771
 */
export function determineElectrificationGrade(surfaceM2: number): {
  grade: 'Mínimo' | 'Medio' | 'Elevado' | 'Superior';
  minCircuits: number;
  description: string;
} {
  if (surfaceM2 <= 60) {
    return {
      grade: 'Mínimo',
      minCircuits: 2, // 1 IUG + 1 TUG
      description: 'Superficie hasta 60 m². Requiere mínimo 2 circuitos independientes (1 IUG y 1 TUG).',
    };
  } else if (surfaceM2 <= 130) {
    return {
      grade: 'Medio',
      minCircuits: 3, // 1 IUG + 1 TUG + 1 TUE/Libre elección
      description: 'Superficie de 60 a 130 m². Requiere mínimo 3 circuitos independientes.',
    };
  } else if (surfaceM2 <= 200) {
    return {
      grade: 'Elevado',
      minCircuits: 5, // 2 IUG + 2 TUG + 1 TUE
      description: 'Superficie de 130 a 200 m². Requiere mínimo 5 circuitos independientes.',
    };
  } else {
    return {
      grade: 'Superior',
      minCircuits: 6,
      description: 'Superficie mayor a 200 m². Requiere mínimo 6 circuitos independientes.',
    };
  }
}

/**
 * Analiza el texto libre o transcripción de audio del cliente y extrae parámetros estructurados
 */
export function parseClientRequirementsText(rawText: string): Partial<ClientInstallationRequest> {
  const lower = rawText.toLowerCase();

  // Detección de ambientes mencionados
  const detectedRooms: ClientRoomRequest[] = [];

  const checkRoom = (name: string, defaultW: number, defaultL: number, lights: number, tug: number, tue: number) => {
    detectedRooms.push({
      id: `room_${Date.now()}_${detectedRooms.length}`,
      name,
      widthM: defaultW,
      lengthM: defaultL,
      areaM2: Number((defaultW * defaultL).toFixed(1)),
      lightsCount: lights,
      switchesCount: 1,
      outletsGeneralCount: tug,
      outletsSpecialCount: tue,
      appliances: [],
    });
  };

  if (lower.includes('living') || lower.includes('comedor') || lower.includes('estar')) {
    checkRoom('Living Comedor', 5.0, 4.0, 2, 4, 1);
  }
  if (lower.includes('dormitorio') || lower.includes('habitacion') || lower.includes('cuarto')) {
    checkRoom('Dormitorio Principal', 3.8, 3.5, 1, 3, 1);
  }
  if (lower.includes('segundo dormitorio') || lower.includes('dos dormitorios')) {
    checkRoom('Dormitorio 2', 3.2, 3.0, 1, 3, 0);
  }
  if (lower.includes('cocina')) {
    checkRoom('Cocina', 3.5, 2.5, 2, 4, 2);
  }
  if (lower.includes('baño') || lower.includes('bano')) {
    checkRoom('Baño', 2.2, 1.8, 1, 1, 0);
  }
  if (lower.includes('lavadero') || lower.includes('patio')) {
    checkRoom('Lavadero', 2.0, 1.8, 1, 2, 1);
  }

  // Si no se detectó ningún ambiente específico, armar una vivienda estándar 2 ambientes
  if (detectedRooms.length === 0) {
    checkRoom('Living Comedor', 4.5, 4.0, 2, 4, 1);
    checkRoom('Cocina', 3.0, 2.5, 2, 3, 1);
    checkRoom('Dormitorio', 3.6, 3.2, 1, 3, 1);
    checkRoom('Baño', 2.0, 1.8, 1, 1, 0);
  }

  // Detección de electrodomésticos especiales de alta potencia
  const appliances: { name: string; powerWatts: number; dedicatedCircuitRequired: boolean; roomName: string }[] = [];

  if (lower.includes('aire') || lower.includes('split') || lower.includes('ac')) {
    appliances.push({
      name: 'Aire Acondicionado Split 3000 Frigorías',
      powerWatts: 1450,
      dedicatedCircuitRequired: true,
      roomName: 'Living Comedor',
    });
  }
  if (lower.includes('horno') || lower.includes('anafe') || lower.includes('vitroceramica')) {
    appliances.push({
      name: 'Horno Eléctrico Empotrable',
      powerWatts: 2400,
      dedicatedCircuitRequired: true,
      roomName: 'Cocina',
    });
  }
  if (lower.includes('termotanque') || lower.includes('calefon electrico')) {
    appliances.push({
      name: 'Termotanque Eléctrico 80 Litros',
      powerWatts: 2000,
      dedicatedCircuitRequired: true,
      roomName: 'Lavadero / Cocina',
    });
  }
  if (lower.includes('bomba') || lower.includes('presurizadora')) {
    appliances.push({
      name: 'Bomba Elevadora de Agua 0.5 HP',
      powerWatts: 550,
      dedicatedCircuitRequired: true,
      roomName: 'Servicios',
    });
  }

  let propertyType: 'vivienda_unifamiliar' | 'departamento' | 'local_comercial' | 'oficina' = 'departamento';
  if (lower.includes('casa') || lower.includes('chalet') || lower.includes('unifamiliar')) {
    propertyType = 'vivienda_unifamiliar';
  } else if (lower.includes('local') || lower.includes('comercio') || lower.includes('negocio')) {
    propertyType = 'local_comercial';
  } else if (lower.includes('oficina')) {
    propertyType = 'oficina';
  }

  return {
    propertyType,
    rooms: detectedRooms,
    highPowerAppliances: appliances,
    notes: rawText,
    installationType: lower.includes('a la vista') || lower.includes('canaleta') ? 'a_la_vista' : 'embutido',
  };
}

/**
 * Convierte la solicitud del cliente en un proyecto CAD reglamentario completo
 */
export function generateProjectProposal(request: ClientInstallationRequest): GeneratedProposal {
  const totalAreaM2 = request.rooms.reduce((sum, r) => sum + r.areaM2, 0);
  const gradeInfo = determineElectrificationGrade(totalAreaM2);

  // Crear circuitos reglamentarios base
  const circuits: Circuit[] = [
    {
      id: 'C1',
      name: 'C1 — Iluminación Uso General (IUG)',
      type: 'IUG',
      voltage: 220,
      phases: 1,
      powerFactor: 0.9,
      conductorMaterial: 'Cu',
      crossSectionMm2: 1.5,
      breakerAmps: 10,
      breakerCurve: 'C',
      breakerPoles: '2P',
      color: '#38bdf8',
      installationMethod: 'cañeria_embutida',
      lengthMetersEstimate: 25,
      description: 'Alimentación de centros de techo y apliques con cable unipolar 1,5 mm²',
    },
    {
      id: 'C2',
      name: 'C2 — Tomacorrientes Uso General (TUG)',
      type: 'TUG',
      voltage: 220,
      phases: 1,
      powerFactor: 0.95,
      conductorMaterial: 'Cu',
      crossSectionMm2: 2.5,
      breakerAmps: 16,
      breakerCurve: 'C',
      breakerPoles: '2P',
      color: '#f59e0b',
      installationMethod: 'cañeria_embutida',
      lengthMetersEstimate: 30,
      description: 'Tomas de 10A IRAM 2071 para electrodomésticos portátiles con cable 2,5 mm²',
    },
  ];

  // Si hay cargas especiales o grado Medio/Elevado, agregar circuito TUE
  if (request.highPowerAppliances.length > 0 || gradeInfo.minCircuits >= 3) {
    circuits.push({
      id: 'C3',
      name: 'C3 — Tomas Uso Especial / AC (TUE)',
      type: 'TUE',
      voltage: 220,
      phases: 1,
      powerFactor: 0.9,
      conductorMaterial: 'Cu',
      crossSectionMm2: 4.0,
      breakerAmps: 20,
      breakerCurve: 'C',
      breakerPoles: '2P',
      color: '#ec4899',
      installationMethod: 'cañeria_embutida',
      lengthMetersEstimate: 20,
      description: 'Alimentación dedicada para aire acondicionado y electrodomésticos de alta demanda',
    });
  }

  // Generar distribución espacial en el plano
  const rooms: Room[] = [];
  const walls: ArchElement[] = [];
  const symbols: ElectricalSymbol[] = [];
  const wires: Wire[] = [];

  const scale = 40; // 40 px = 1 m
  let curX = 60;
  let curY = 60;
  const maxRowWidth = 720;
  let rowHeight = 0;

  // Ubicar Tablero Principal cerca del acceso en el primer ambiente
  const boardId = `sym_tablero_${Date.now()}`;
  const mainBoard = createSymbolFromTemplate('tablero', curX + 20, curY + 20, 'floor_1', 'C1', 1);
  mainBoard.id = boardId;
  symbols.push(mainBoard);

  // Jabalina de tierra conectada al tablero
  const earthId = `sym_pat_${Date.now()}`;
  const earthSymbol = createSymbolFromTemplate('puesta_tierra', curX + 20, curY + 100, 'floor_1', 'C1', 1);
  earthSymbol.id = earthId;
  symbols.push(earthSymbol);

  // Cable de tierra PE entre jabalina y tablero
  wires.push({
    id: `wire_pat_${Date.now()}`,
    floorId: 'floor_1',
    circuitId: 'C1',
    type: 'tierra',
    fromComponentId: earthId,
    fromTerminalId: 'PE',
    toComponentId: boardId,
    toTerminalId: 'PE_IN',
    color: '#16a34a',
    crossSectionMm2: 4.0,
    lengthMeters: 2.0,
  });

  let totalLights = 0;
  let totalTUG = 0;
  let totalTUE = 0;

  for (let i = 0; i < request.rooms.length; i++) {
    const r = request.rooms[i];
    const wPx = Math.round(r.widthM * scale);
    const hPx = Math.round(r.lengthM * scale);

    if (curX + wPx > maxRowWidth && i > 0) {
      curX = 60;
      curY += rowHeight + 20;
      rowHeight = 0;
    }

    const roomId = `room_${i + 1}`;
    rooms.push({
      id: roomId,
      floorId: 'floor_1',
      name: r.name,
      x: curX,
      y: curY,
      width: wPx,
      height: hPx,
      color: 'rgba(59, 130, 246, 0.05)',
    });

    // Muros perimetrales del ambiente
    walls.push(
      { id: `wall_${roomId}_top`, floorId: 'floor_1', type: 'wall', x1: curX, y1: curY, x2: curX + wPx, y2: curY, thickness: 8 },
      { id: `wall_${roomId}_right`, floorId: 'floor_1', type: 'wall', x1: curX + wPx, y1: curY, x2: curX + wPx, y2: curY + hPx, thickness: 8 },
      { id: `wall_${roomId}_bottom`, floorId: 'floor_1', type: 'wall', x1: curX + wPx, y1: curY + hPx, x2: curX, y2: curY + hPx, thickness: 8 },
      { id: `wall_${roomId}_left`, floorId: 'floor_1', type: 'wall', x1: curX, y1: curY + hPx, x2: curX, y2: curY, thickness: 8 }
    );

    // Puerta de acceso
    walls.push({
      id: `door_${roomId}`,
      floorId: 'floor_1',
      type: 'door',
      x1: curX + 15,
      y1: curY + hPx,
      x2: curX + 45,
      y2: curY + hPx,
    });

    // Bocas de iluminación en el centro geométrico del ambiente
    const centerX = curX + wPx / 2;
    const centerY = curY + hPx / 2;

    const lampSym = createSymbolFromTemplate('luminaria', centerX, centerY, 'floor_1', 'C1', totalLights + 1);
    lampSym.name = `Boca Luz ${r.name}`;
    symbols.push(lampSym);
    totalLights++;

    // Interruptor simple ubicado junto a la puerta de ingreso
    const switchSym = createSymbolFromTemplate('interruptor_simple', curX + 55, curY + hPx - 15, 'floor_1', 'C1', totalLights);
    switchSym.name = `Tecla ${r.name}`;
    symbols.push(switchSym);

    // Conectar tecla con lámpara mediante retorno
    wires.push({
      id: `wire_ret_${Date.now()}_${i}`,
      floorId: 'floor_1',
      circuitId: 'C1',
      type: 'retorno',
      fromComponentId: switchSym.id,
      fromTerminalId: 'R',
      toComponentId: lampSym.id,
      toTerminalId: 'L',
      color: '#eab308',
      crossSectionMm2: 1.5,
      lengthMeters: Number((Math.hypot(lampSym.x - switchSym.x, lampSym.y - switchSym.y) / scale).toFixed(1)),
    });

    // Tomacorrientes distribuidos en paredes
    const tugCount = Math.max(r.outletsGeneralCount, 2);
    for (let t = 0; t < tugCount; t++) {
      totalTUG++;
      const posX = curX + 30 + (t * (wPx - 60)) / Math.max(tugCount - 1, 1);
      const posY = curY + 15;
      const tomaSym = createSymbolFromTemplate('tomacorriente', posX, posY, 'floor_1', 'C2', totalTUG);
      tomaSym.name = `TUG ${r.name} #${t + 1}`;
      symbols.push(tomaSym);
    }

    // Tomacorriente especial si corresponde
    if (r.outletsSpecialCount > 0) {
      totalTUE++;
      const tomaTue = createSymbolFromTemplate('toma_especial', curX + wPx - 25, curY + hPx / 2, 'floor_1', 'C3', totalTUE);
      tomaTue.name = `TUE Especial ${r.name}`;
      symbols.push(tomaTue);
    }

    curX += wPx + 30;
    if (hPx > rowHeight) rowHeight = hPx;
  }

  const project: Project = {
    version: '1.2.0',
    metadata: {
      id: `proj_${Date.now()}`,
      name: `Instalación ${request.clientName || 'Cliente'} — ${request.propertyType.replace('_', ' ').toUpperCase()}`,
      client: request.clientName || 'Cliente Particular',
      address: request.address || 'Buenos Aires, Argentina',
      description: `Propuesta generada automáticamente a partir de requerimientos de cliente. Grado de Electrificación: ${gradeInfo.grade}.`,
      author: 'ELECTRA PLAN — Asistente de Proyectos',
      date: new Date().toISOString().split('T')[0],
      country: 'Argentina',
      normative: 'AEA 90364-7-771',
      gridSize: 20,
      snapToGrid: true,
      showDimensions: true,
      scale: 40,
    },
    floors: [{ id: 'floor_1', name: 'Planta Principal', level: 0, scalePixelsPerMeter: 40 }],
    activeFloorId: 'floor_1',
    rooms,
    architecturalElements: walls,
    symbols,
    wires,
    circuits,
    switchboard: {
      id: 'sw_main',
      name: 'Tablero Seccional General (TSG)',
      location: 'Acceso principal',
      mainBreakerAmps: 32,
      differentialAmps: 40,
      components: [
        { id: 'iga_1', type: 'iga', name: 'Interruptor General Bipolar 32A', ratingAmps: 32, poles: '2P', state: 'closed' },
        { id: 'id_1', type: 'diferencial', name: 'Disyuntor Diferencial 40A / 30mA', ratingAmps: 40, poles: '2P', sensitivityMa: 30, state: 'closed' },
        { id: 'pia_1', type: 'pia', name: 'Térmica C1 (IUG 10A)', ratingAmps: 10, poles: '2P', circuitId: 'C1', state: 'closed' },
        { id: 'pia_2', type: 'pia', name: 'Térmica C2 (TUG 16A)', ratingAmps: 16, poles: '2P', circuitId: 'C2', state: 'closed' },
        { id: 'pia_3', type: 'pia', name: 'Térmica C3 (TUE 20A)', ratingAmps: 20, poles: '2P', circuitId: 'C3', state: 'closed' },
      ],
    },
    currency: 'ARS',
  };

  // Preguntas de aclaración técnica profesional
  const clarifications: ProposalClarification[] = [];

  if (request.highPowerAppliances.some((a) => a.name.toLowerCase().includes('aire'))) {
    clarifications.push({
      id: 'q_ac_rating',
      question: '¿Cuántas frigorías tiene el equipo de aire acondicionado a instalar?',
      context: 'Si supera las 3000 frigorías o 1500W, la norma AEA 771 exige circuito exclusivo con térmica de 20A y conductor de 4 mm².',
      importance: 'alta',
    });
  }

  clarifications.push({
    id: 'q_ground_rod',
    question: '¿Existe jabalina de puesta a tierra reglamentaria certificada con medición < 10 Ω?',
    context: 'La reglamentación exige jabalina de acero-cobre con caja de inspección y protocolo de medición vigente para habilitar la instalación.',
    importance: 'alta',
  });

  if (request.propertyType === 'departamento') {
    clarifications.push({
      id: 'q_building_meter',
      question: '¿Dónde se encuentra el medidor de la empresa distribuidora y qué sección tiene la línea principal de alimentación?',
      context: 'La línea principal que alimenta el tablero seccional debe tener una sección mínima de 4,0 mm² según AEA 771.13.',
      importance: 'media',
    });
  }

  const specialWatts = request.highPowerAppliances.reduce((sum, a) => sum + a.powerWatts, 0);

  return {
    project,
    electrificationGrade: gradeInfo.grade,
    totalAreaM2: Number(totalAreaM2.toFixed(1)),
    minCircuitsCount: gradeInfo.minCircuits,
    recommendedCircuitsCount: circuits.length,
    clarifications,
    summaryPoints: {
      totalLights,
      totalOutletsTUG: totalTUG,
      totalOutletsTUE: totalTUE,
      totalSpecialLoadsWatts: specialWatts,
    },
  };
}
