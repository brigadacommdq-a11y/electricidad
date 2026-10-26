/**
 * ELECTRA PLAN — Definiciones de Tipos para el Taller de Tableros Eléctricos Realistas
 * Modos de visualización, componentes DIN modulares, cableado ortogonal y 15 talleres guiados.
 */

export type SwitchboardViewMode = 'realista' | 'esquema' | 'conexiones';

export type DINDeviceType =
  | 'iga'
  | 'diferencial'
  | 'termomagnetico'
  | 'dps'
  | 'medidor_digital'
  | 'contactor'
  | 'rele_temporizador'
  | 'repartidor_bloque'
  | 'peine_conexion'
  | 'barra_neutro'
  | 'barra_tierra';

export interface DeviceTerminal {
  id: string; // e.g. '1_in', '2_out', 'N_in', 'N_out', 'A1', 'A2', 'PE'
  name: string; // e.g. "L1 Entrada", "Neutro Salida", "Borne de Tierra"
  type: 'fase' | 'neutro' | 'tierra' | 'retorno' | 'control';
  position: 'top' | 'bottom' | 'side';
  relX: number; // Coordenada relativa en píxeles respecto al borde izquierdo del dispositivo
  relY: number; // Coordenada relativa en píxeles respecto al borde superior del dispositivo
}

export interface RealisticDINDevice {
  id: string;
  railId: number; // 1 = Riel Superior, 2 = Riel Medio, 3 = Riel Inferior
  slotIndex: number; // Posición horizontal en el riel
  type: DINDeviceType;
  name: string;
  label: string;
  poles: '1P' | '1P+N' | '2P' | '3P' | '4P';
  modulesWidth: number; // Ancho en módulos DIN de 18 mm (1 módulo = 36px aprox en escala)
  ratingAmps: number;
  curve?: 'B' | 'C' | 'D';
  breakingCapacityKa?: number; // 3, 4.5, 6, 10 kA
  sensitivityMa?: number; // 30 mA para residencial, 300 mA para industrial
  state: 'closed' | 'open' | 'tripped';
  circuitId?: string; // Vinculación con los circuitos de ELECTRA PLAN (C1, C2, etc.)
  customTag?: string; // Ej: "ALUMBRADO LIVING", "TOMAS COCINA"
  terminals: DeviceTerminal[];
}

export interface SwitchboardWirePoint {
  x: number;
  y: number;
}

export interface RealisticSwitchboardWire {
  id: string;
  fromDeviceId: string;
  fromTerminalId: string;
  toDeviceId: string;
  toTerminalId: string;
  conductorType: 'fase' | 'neutro' | 'tierra' | 'control' | 'retorno';
  crossSectionMm2: number; // 1.5, 2.5, 4.0, 6.0, 10.0
  color: string;
  routing: 'canaleta' | 'directo' | 'peine';
  pathPoints?: SwitchboardWirePoint[];
  isEnergized?: boolean;
  hasCurrent?: boolean;
}

export interface DINRailConfig {
  id: number;
  name: string;
  capacityModules: number; // ej. 12, 18, 24
}

export interface RealisticSwitchboardState {
  cabinetModel: string;
  rowsCount: number;
  modulesPerRow: number;
  doorOpen: boolean;
  doorType: 'fume' | 'opaca' | 'transparente';
  hasCableDucts: boolean;
  mainsEnergized: boolean; // Si la acometida de red está activa
  supplyVoltage: number; // 220 V monofásica / 380 V trifásica
  supplyFrequency: number; // 50 Hz
  simulatedFault: 'none' | 'leakage_trip' | 'short_circuit' | 'overload';
  rails: DINRailConfig[];
  devices: RealisticDINDevice[];
  wires: RealisticSwitchboardWire[];
}

export interface SwitchboardWorkshopLevel {
  id: number;
  title: string;
  subtitle: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  estimatedMinutes: number;
  normativeRef: string; // ej. "AEA 90364-7-771"
  description: string;
  objectives: string[];
  requiredComponents: {
    type: DINDeviceType;
    label: string;
    specs: string;
    quantity: number;
  }[];
  stepByStepInstructions: string[];
  hints: string[];
  initialState: {
    devices: RealisticDINDevice[];
    wires: RealisticSwitchboardWire[];
    mainsEnergized?: boolean;
  };
  validateSolution: (state: RealisticSwitchboardState) => {
    passed: boolean;
    feedback: string;
    technicalNotes: string;
    missingConnections?: string[];
  };
}
