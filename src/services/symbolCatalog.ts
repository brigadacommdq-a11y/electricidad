/**
 * ELECTRA PLAN — Catálogo Oficial de Símbolos Eléctricos y Plantillas
 */
import { ElectricalSymbol, SymbolCategory, ConductorType } from '../types/electra';

export interface SymbolTemplate {
  type: string;
  category: SymbolCategory;
  name: string;
  labelPrefix: string;
  defaultPowerWatts: number;
  defaultCircuitType: 'IUG' | 'TUG' | 'IUE' | 'TUE' | 'AC' | 'OTRO';
  description: string;
  normativeRef: string;
  terminals: {
    id: string;
    name: string;
    type: ConductorType;
    relX: number;
    relY: number;
  }[];
}

export const SYMBOL_TEMPLATES: SymbolTemplate[] = [
  // --- FUENTE Y TABLERO ---
  {
    type: 'fuente_ac',
    category: 'tablero',
    name: 'Alimentación de Red (220V AC)',
    labelPrefix: 'RED',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Acometida monofásica de 220V 50Hz con Fase (L), Neutro (N) y Borne de Protección (PE).',
    normativeRef: 'AEA 90364 Sección 771.13',
    terminals: [
      { id: 'L', name: 'L (Fase)', type: 'fase', relX: -16, relY: -10 },
      { id: 'N', name: 'N (Neutro)', type: 'neutro', relX: -16, relY: 10 },
      { id: 'PE', name: 'PE (Tierra)', type: 'tierra', relX: 16, relY: 0 },
    ],
  },
  {
    type: 'tablero',
    category: 'tablero',
    name: 'Tablero Seccional General (TSG)',
    labelPrefix: 'TSG',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Gabinete con Riel DIN, barras repartidoras y capacidad para protecciones generales.',
    normativeRef: 'AEA 90364 Sección 771.18',
    terminals: [
      { id: 'L_IN', name: 'L Entrada', type: 'fase', relX: -20, relY: -12 },
      { id: 'N_IN', name: 'N Entrada', type: 'neutro', relX: -20, relY: 12 },
      { id: 'PE_IN', name: 'PE Entrada', type: 'tierra', relX: 0, relY: -20 },
      { id: 'L_OUT', name: 'L Salida', type: 'fase', relX: 20, relY: -12 },
      { id: 'N_OUT', name: 'N Salida', type: 'neutro', relX: 20, relY: 12 },
      { id: 'PE_OUT', name: 'PE Barra', type: 'tierra', relX: 0, relY: 20 },
    ],
  },
  {
    type: 'termica',
    category: 'proteccion',
    name: 'Interruptor Termomagnético (PIA)',
    labelPrefix: 'PIA',
    defaultPowerWatts: 0,
    defaultCircuitType: 'IUG',
    description: 'Protección contra sobrecargas y cortocircuitos (Curva C, 10A/16A/20A).',
    normativeRef: 'IRAM 2169 / IEC 60898',
    terminals: [
      { id: 'L_IN', name: 'L Entrada', type: 'fase', relX: -16, relY: -10 },
      { id: 'N_IN', name: 'N Entrada', type: 'neutro', relX: -16, relY: 10 },
      { id: 'L_OUT', name: 'L Salida', type: 'fase', relX: 16, relY: -10 },
      { id: 'N_OUT', name: 'N Salida', type: 'neutro', relX: 16, relY: 10 },
    ],
  },
  {
    type: 'diferencial',
    category: 'proteccion',
    name: 'Interruptor Diferencial (Disyuntor)',
    labelPrefix: 'ID',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Protección para personas contra contactos directos e indirectos (30 mA).',
    normativeRef: 'IRAM-NM-IEC 61008',
    terminals: [
      { id: 'L_IN', name: 'L Entrada', type: 'fase', relX: -16, relY: -10 },
      { id: 'N_IN', name: 'N Entrada', type: 'neutro', relX: -16, relY: 10 },
      { id: 'L_OUT', name: 'L Salida', type: 'fase', relX: 16, relY: -10 },
      { id: 'N_OUT', name: 'N Salida', type: 'neutro', relX: 16, relY: 10 },
    ],
  },

  // --- COMANDOS ---
  {
    type: 'interruptor_simple',
    category: 'comando',
    name: 'Interruptor Simple (1 Punto / Tecla)',
    labelPrefix: 'S1',
    defaultPowerWatts: 0,
    defaultCircuitType: 'IUG',
    description: 'Mando unipolar para encendido y apagado de luminarias. Interrumpe la Fase hacia el Retorno.',
    normativeRef: 'IRAM 2006 / 60669-1',
    terminals: [
      { id: 'L', name: 'L (Fase)', type: 'fase', relX: -15, relY: 0 },
      { id: 'R', name: 'R (Retorno)', type: 'retorno', relX: 15, relY: 0 },
    ],
  },
  {
    type: 'interruptor_doble',
    category: 'comando',
    name: 'Interruptor Doble (2 Puntos)',
    labelPrefix: 'S2',
    defaultPowerWatts: 0,
    defaultCircuitType: 'IUG',
    description: 'Doble comando unipolar independiente para encender dos circuitos de luces distintos.',
    normativeRef: 'IRAM 2006',
    terminals: [
      { id: 'L', name: 'L (Fase común)', type: 'fase', relX: -15, relY: 0 },
      { id: 'R1', name: 'Retorno 1', type: 'retorno', relX: 15, relY: -10 },
      { id: 'R2', name: 'Retorno 2', type: 'retorno', relX: 15, relY: 10 },
    ],
  },
  {
    type: 'conmutado',
    category: 'comando',
    name: 'Interruptor Conmutado (Combinación / 2 Vías)',
    labelPrefix: 'SC',
    defaultPowerWatts: 0,
    defaultCircuitType: 'IUG',
    description: 'Llave de combinación para controlar una o más lámparas desde dos lugares diferentes.',
    normativeRef: 'IRAM 2006',
    terminals: [
      { id: 'COM', name: 'Común (Fase/Retorno)', type: 'fase', relX: -16, relY: 0 },
      { id: 'P1', name: 'Puente 1', type: 'puente', relX: 16, relY: -10 },
      { id: 'P2', name: 'Puente 2', type: 'puente', relX: 16, relY: 10 },
    ],
  },
  {
    type: 'pulsador',
    category: 'comando',
    name: 'Pulsador Normal Abierto (NA)',
    labelPrefix: 'PUL',
    defaultPowerWatts: 0,
    defaultCircuitType: 'IUG',
    description: 'Pulsador para timbre, minutero de escalera o telerruptor.',
    normativeRef: 'IRAM 2006',
    terminals: [
      { id: 'L', name: 'L (Fase)', type: 'fase', relX: -15, relY: 0 },
      { id: 'R', name: 'Retorno pulsador', type: 'retorno', relX: 15, relY: 0 },
    ],
  },

  // --- PUNTOS DE UTILIZACIÓN / CARGAS ---
  {
    type: 'luminaria',
    category: 'utilizacion',
    name: 'Boca de Iluminación (Centro / Lámpara)',
    labelPrefix: 'L',
    defaultPowerWatts: 60,
    defaultCircuitType: 'IUG',
    description: 'Luminaria fija o portalámparas conectada a neutro, retorno y borne de puesta a tierra.',
    normativeRef: 'AEA 90364-7-771.8',
    terminals: [
      { id: 'L', name: 'Retorno / Fase', type: 'retorno', relX: -15, relY: -8 },
      { id: 'N', name: 'Neutro', type: 'neutro', relX: 15, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 16 },
    ],
  },
  {
    type: 'tomacorriente',
    category: 'utilizacion',
    name: 'Tomacorriente 10A con Tierra (TUG)',
    labelPrefix: 'TUG',
    defaultPowerWatts: 150,
    defaultCircuitType: 'TUG',
    description: 'Tomacorriente 2P+T norma IRAM 2071 de 10A para artefactos de uso general.',
    normativeRef: 'IRAM 2071 / AEA 771.8.2',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'toma_especial',
    category: 'utilizacion',
    name: 'Tomacorriente 20A Especial (TUE)',
    labelPrefix: 'TUE',
    defaultPowerWatts: 2200,
    defaultCircuitType: 'TUE',
    description: 'Tomacorriente 20A 2P+T para cargas especiales (Aire acondicionado, termotanque eléctrico, anafe).',
    normativeRef: 'IRAM 2071 / AEA 771.8.3',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'timbre',
    category: 'utilizacion',
    name: 'Campanilla / Timbre 220V',
    labelPrefix: 'TIM',
    defaultPowerWatts: 15,
    defaultCircuitType: 'IUG',
    description: 'Señal acústica para acceso o portería conectada al retorno del pulsador.',
    normativeRef: 'AEA 90364',
    terminals: [
      { id: 'R', name: 'Retorno Pulsador', type: 'retorno', relX: -15, relY: 0 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 15, relY: 0 },
    ],
  },
  {
    type: 'ventilador',
    category: 'utilizacion',
    name: 'Ventilador de Techo con Luz',
    labelPrefix: 'VENT',
    defaultPowerWatts: 120,
    defaultCircuitType: 'IUG',
    description: 'Motor de ventilación y luminaria incorporada con bornera separada.',
    normativeRef: 'AEA 90364',
    terminals: [
      { id: 'L', name: 'Retorno Luz', type: 'retorno', relX: -15, relY: -10 },
      { id: 'L_VENT', name: 'Retorno Motor', type: 'retorno', relX: -15, relY: 10 },
      { id: 'N', name: 'Neutro', type: 'neutro', relX: 15, relY: 0 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 16 },
    ],
  },

  // --- CANALIZACIONES Y EMPALMES ---
  {
    type: 'caja_paso',
    category: 'canalizacion',
    name: 'Caja de Paso y Derivación (Octogonal / 10x10)',
    labelPrefix: 'CP',
    defaultPowerWatts: 0,
    defaultCircuitType: 'IUG',
    description: 'Caja para empalmes, borneras de derivación y cambios de dirección de cañerías.',
    normativeRef: 'IRAM 2346 / AEA 771.12',
    terminals: [
      { id: 'L_NODE', name: 'Borne Fase', type: 'fase', relX: -12, relY: -12 },
      { id: 'N_NODE', name: 'Borne Neutro', type: 'neutro', relX: 12, relY: -12 },
      { id: 'PE_NODE', name: 'Borne Tierra', type: 'tierra', relX: 0, relY: 14 },
    ],
  },
  {
    type: 'puesta_tierra',
    category: 'canalizacion',
    name: 'Electrodo de Puesta a Tierra (Jabalina)',
    labelPrefix: 'PAT',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Jabalina de acero-cobre hincada en suelo con cámara de inspección y tomacable.',
    normativeRef: 'IRAM 2309 / AEA 771.3',
    terminals: [
      { id: 'PE', name: 'Borne Principal Tierra (BPT)', type: 'tierra', relX: 0, relY: -14 },
    ],
  },
];

export function createSymbolFromTemplate(
  templateType: string,
  x: number,
  y: number,
  floorId: string,
  circuitId?: string,
  indexNumber: number = 1
): ElectricalSymbol {
  const template = SYMBOL_TEMPLATES.find((t) => t.type === templateType) || SYMBOL_TEMPLATES[4]; // Default to simple switch
  const id = `sym_${templateType}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const isSwitch = templateType.includes('interruptor') || templateType === 'conmutado' || templateType === 'pulsador';
  const isBreaker = templateType === 'termica' || templateType === 'diferencial';

  return {
    id,
    floorId,
    category: template.category,
    type: template.type,
    name: `${template.name} ${indexNumber}`,
    label: `${template.labelPrefix}${indexNumber}`,
    x: Math.round(x),
    y: Math.round(y),
    rotation: 0,
    circuitId: circuitId || (template.defaultCircuitType === 'TUG' ? 'C2' : 'C1'),
    powerWatts: template.defaultPowerWatts,
    voltage: 220,
    powerFactor: 0.9,
    terminals: template.terminals.map((t) => ({ ...t })),
    state: {
      isOpen: isSwitch ? true : false, // Interruptores empiezan apagados
      switchPosition: 1,
      isTripped: false,
      isEnergized: false,
      isOn: false,
      hasFault: false,
    },
  };
}

export const WIRE_COLOR_MAP: Record<ConductorType, { stroke: string; label: string; code: string }> = {
  fase: { stroke: '#854d0e', label: 'Fase (Marrón / Negro / Rojo)', code: 'L' },
  neutro: { stroke: '#0284c7', label: 'Neutro (Celeste)', code: 'N' },
  tierra: { stroke: '#16a34a', label: 'Protección / Tierra (Verde-Amarillo)', code: 'PE' },
  retorno: { stroke: '#f59e0b', label: 'Retorno (Gris / Blanco / Negro)', code: 'R' },
  puente: { stroke: '#a855f7', label: 'Puente Combinación (Violeta / Naranja)', code: 'P' },
};
