/**
 * ELECTRA PLAN — Software de diseño de instalaciones eléctricas
 * Definiciones de tipos y modelos de datos
 */

export type ConductorType = 'fase' | 'neutro' | 'tierra' | 'retorno' | 'puente';

export interface Terminal {
  id: string; // e.g. 'L', 'N', 'PE', 'R', 'P1', 'P2', 'COM'
  name: string; // e.g. "L (Fase)", "N (Neutro)", "PE (Tierra)", "Retorno"
  type: ConductorType;
  relX: number; // Coordenada relativa en px respecto al centro del símbolo (-15 a 15)
  relY: number;
}

export type SymbolCategory = 
  | 'tablero'
  | 'comando'
  | 'utilizacion'
  | 'canalizacion'
  | 'proteccion';

export interface ElectricalSymbol {
  id: string;
  floorId: string;
  category: SymbolCategory;
  type: string; // 'luminaria', 'interruptor_simple', 'interruptor_doble', 'conmutado', 'tomacorriente', 'toma_especial', 'tablero', 'caja_paso', 'puesta_tierra', 'timbre', 'ventilador'
  subtype?: string;
  name: string; // Nombre visible, ej: "Lámpara Living 1"
  label: string; // Etiqueta técnica corta, ej: "L1", "S1", "TUG-1"
  x: number; // Posición X en px
  y: number; // Posición Y en px
  rotation: number; // 0, 90, 180, 270 grados
  flipH?: boolean; // Inversión horizontal
  flipV?: boolean; // Inversión vertical
  circuitId?: string; // Id del circuito asociado (ej: "C1")
  powerWatts: number; // Potencia en Vatios (W)
  voltage: number; // Tensión nominal (ej: 220 V o 380 V)
  powerFactor: number; // cos phi (ej: 0.9 o 1.0)
  terminals: Terminal[];
  // Campos para cargas especiales, bombas y taller
  equipmentType?: 'domestico' | 'comercial' | 'taller' | 'industrial_ligero';
  phasesCount?: 1 | 3;
  assignedPhase?: 'R' | 'S' | 'T' | 'R-S-T';
  ratedCurrentAmps?: number;
  efficiency?: number; // Rendimiento η (0.8 - 0.95)
  startingMethod?: 'directo' | 'estrella_triangulo' | 'arrancador_suave' | 'variador';
  dutyCyclePercent?: number; // Factor de marcha / servicio en soldadoras (ej 60%)
  inputCurrentAmps?: number; // Corriente I1max en soldadoras (A)
  pumpType?: 'sumergible' | 'presurizadora' | 'pozo_profundo' | 'achique' | 'recirculacion' | 'piscina';
  // Estados dinámicos para simulación
  state?: {
    isOpen?: boolean; // Para interruptores y teclas (true = abierto / apagado, false = cerrado / encendido)
    switchPosition?: number; // Para conmutadores: 1 o 2
    isTripped?: boolean; // Para protecciones: disparado
    isEnergized?: boolean; // Si llega potencial
    isOn?: boolean; // Si está activa/encendida (ej: lámpara brilla)
    hasFault?: boolean; // Si detecta falla
    connectedLoadId?: string; // Para tomacorrientes: carga conectada
  };
}

export interface WirePoint {
  x: number;
  y: number;
}

export interface Wire {
  id: string;
  floorId: string;
  circuitId?: string;
  type: ConductorType;
  fromComponentId: string;
  fromTerminalId: string;
  toComponentId: string;
  toTerminalId: string;
  points?: WirePoint[]; // Puntos intermedios de enrutamiento (ortogonal o bezier)
  color: string; // Color hexadecimal visual
  crossSectionMm2: number; // Sección en mm2 (1.5, 2.5, 4, etc.)
  lengthMeters: number; // Longitud estimada en metros
  isEnergized?: boolean; // Para visualización en el simulador
  hasCurrent?: boolean; // Si circula corriente
  // Opciones avanzadas de especificación y canalización
  conductorMaterial?: 'Cu' | 'Al';
  routingMode?: 'bezier' | 'orthogonal';
  conduitType?: 'corrugado_ignifugo' | 'pvc_rigido' | 'canaleta' | 'acero_semipesado';
  conduitDiameterMm?: number; // 19 (3/4"), 22 (7/8"), 25 (1")
  slackPercent?: number; // Holgura para cajas y borneras (+10%, +15%)
  installationMethod?: 'B1' | 'B2' | 'C'; // AEA 90364-771
  insulationType?: 'PVC_70' | 'LS0H_90';
  isManualOverride?: boolean;
  calculatedCurrentAmps?: number;
  voltageDropPercent?: number;
  verificationStatus?: 'optimo' | 'advertencia' | 'critico';
  verificationNote?: string;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

export interface ArchElement {
  id: string;
  floorId: string;
  type: 'wall' | 'door' | 'window';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness?: number;
  rotation?: number; // Rotación en grados (0-360)
  flipH?: boolean; // Inversión horizontal
  flipV?: boolean; // Inversión vertical
  swingDirection?: 'interior' | 'exterior'; // Apertura hacia adentro o afuera
  hingeSide?: 'izquierda' | 'derecha'; // Ubicación de la bisagra
  width?: number; // Ancho nominal en px
  name?: string;
  wallId?: string; // Muro contenedor opcional
}

export type CircuitType = 'IUG' | 'TUG' | 'IUE' | 'TUE' | 'AC' | 'OTRO';

export interface Circuit {
  id: string; // "C1", "C2", etc.
  name: string; // "Iluminación de Uso General"
  type: CircuitType;
  voltage: number; // 220 o 380 V
  phases: 1 | 3;
  assignedPhase?: 'R' | 'S' | 'T' | 'R-S-T'; // Fase asignada en trifásica
  powerFactor: number; // cos φ
  conductorMaterial: 'Cu' | 'Al';
  crossSectionMm2: number; // 1.5, 2.5, 4, 6, 10
  breakerAmps: number; // 10, 16, 20, 25, 32 A
  breakerCurve: 'B' | 'C' | 'D';
  breakerPoles: '1P+N' | '2P' | '3P' | '3P+N' | '4P';
  color: string;
  installationMethod: 'cañeria_embutida' | 'a_la_vista' | 'subterranea';
  lengthMetersEstimate: number;
  description?: string;
}

export interface SwitchboardComponent {
  id: string;
  type: 'iga' | 'diferencial' | 'pia' | 'dps' | 'barra_pe' | 'barra_n';
  name: string;
  ratingAmps: number;
  poles: string;
  sensitivityMa?: number; // Para diferencial: 30 mA
  circuitId?: string; // Para PIAs
  state: 'closed' | 'open' | 'tripped';
}

export interface Switchboard {
  id: string;
  name: string;
  location: string;
  mainBreakerAmps: number; // IGA
  differentialAmps: number; // ID 40A 30mA
  components: SwitchboardComponent[];
}

export interface Floor {
  id: string;
  name: string;
  level: number;
  scalePixelsPerMeter: number; // e.g. 40px = 1m
}

export interface ProjectMetadata {
  id: string;
  name: string;
  client: string;
  address: string;
  description: string;
  author: string;
  date: string;
  country: string; // "Argentina"
  normative: string; // "AEA 90364"
  gridSize: number; // px
  snapToGrid: boolean;
  showDimensions: boolean;
  scale: number; // px per meter
  supplyType?: 'monofasica_220v' | 'trifasica_380v' | 'trifasica_sin_neutro';
  interfaceMode?: 'aprendizaje' | 'profesional';
}

export interface Project {
  version: string;
  metadata: ProjectMetadata;
  floors: Floor[];
  activeFloorId: string;
  rooms: Room[];
  architecturalElements: ArchElement[];
  symbols: ElectricalSymbol[];
  wires: Wire[];
  circuits: Circuit[];
  switchboard: Switchboard;
  bomPriceOverrides?: Record<string, number>;
  currency: 'ARS' | 'USD' | 'EUR';
}

// Tipos detallados de detección y localización de fallas
export type FaultCategory =
  | 'cortocircuito_franco' // L-N o L-L directo sin carga
  | 'falla_tierra' // L-PE contacto directo o indirecto
  | 'sobrecarga' // Ib > In calentamiento de conductores
  | 'circuito_abierto' // Retorno o fase interrumpido
  | 'conexion_peligrosa' // Interruptor en neutro, sin PE, neutro a tierra en receptor
  | 'caida_tension_excesiva'; // Delta V > 3% o 5%

export interface TrippedProtectionDetail {
  deviceType: 'PIA_TERMOMAGNETICA' | 'INTERRUPTOR_DIFERENCIAL' | 'DPS_SOBRETENSION';
  nominalRating: string; // e.g. "C16 (16A Curva C)" o "ID 40A / 30mA"
  tripMechanism: 'DISPARO_MAGNETICO_INSTANTANEO' | 'DISPARO_TERMICO_RETARDADO' | 'DISPARO_DIFERENCIAL_RESIDUAL_30mA';
  responseTimeMs: number; // < 20ms o < 30ms
  statusText: string;
}

export interface FaultDetail {
  id: string;
  category: FaultCategory;
  severity: 'peligro_inmediato' | 'advertencia_normativa' | 'circuito_inoperativo';
  title: string;
  faultLoopDescription: string;
  detectionReason: string;
  fromComponentId?: string;
  toComponentId?: string;
  involvedWireIds: string[];
  involvedComponentIds: string[];
  involvedTerminalKeys: string[];
  trippedProtection?: TrippedProtectionDetail;
  remedySteps: string[];
  coordinates: { x: number; y: number };
}

// Simulador y diagnósticos
export type DiagnosticLevel = 'success' | 'warning' | 'error' | 'info';

export interface DiagnosticItem {
  id: string;
  level: DiagnosticLevel;
  title: string;
  message: string;
  componentId?: string;
  wireId?: string;
  circuitId?: string;
  recommendation?: string;
  faultDetail?: FaultDetail;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  diagnostics: DiagnosticItem[];
  totalSimulatedCurrentAmps: number;
  hasShortCircuit: boolean;
  energizedComponents: Set<string>;
  energizedWires: Set<string>;
  activeLamps: Set<string>;
  activeFaults?: FaultDetail[];
  highlightedFaultId?: string | null;
}

// Aula de prácticas
export interface PracticeLevel {
  id: number;
  title: string;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  objective: string;
  description: string;
  componentsNeeded: string[];
  instructions: string[];
  hints: string[];
  initialProject: Partial<Project>;
  solutionCheck: (project: Project, sim: SimulationState) => { passed: boolean; feedback: string; missingConnections?: string[] };
}

// Materiales y Cómputo
export interface BOMItem {
  id: string;
  category: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  autoGenerated: boolean;
}
