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
    type: 'interruptor_general',
    category: 'tablero',
    name: 'Interruptor General Automático (IGA)',
    labelPrefix: 'IGA',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Interruptor de cabecera bipolar de corte omnipolar para protección general de la instalación.',
    normativeRef: 'IRAM 2169 / IEC 60898-1 / AEA 771.17',
    terminals: [
      { id: 'L_IN', name: 'L Entrada', type: 'fase', relX: -16, relY: -10 },
      { id: 'N_IN', name: 'N Entrada', type: 'neutro', relX: -16, relY: 10 },
      { id: 'L_OUT', name: 'L Salida', type: 'fase', relX: 16, relY: -10 },
      { id: 'N_OUT', name: 'N Salida', type: 'neutro', relX: 16, relY: 10 },
    ],
  },
  {
    type: 'dps',
    category: 'tablero',
    name: 'Protector de Sobretensiones Transitorias (DPS)',
    labelPrefix: 'DPS',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Descargador de sobretensiones de Clase II con varistores para derivar descargas atmosféricas a tierra.',
    normativeRef: 'IRAM 2184 / IEC 61643-11',
    terminals: [
      { id: 'L', name: 'Borne Fase (L)', type: 'fase', relX: -14, relY: -12 },
      { id: 'N', name: 'Borne Neutro (N)', type: 'neutro', relX: 14, relY: -12 },
      { id: 'PE', name: 'Descarga a Tierra (PE)', type: 'tierra', relX: 0, relY: 14 },
    ],
  },
  {
    type: 'termica',
    category: 'proteccion',
    name: 'Interruptor Termomagnético (Térmica / PIA)',
    labelPrefix: 'Q',
    defaultPowerWatts: 0,
    defaultCircuitType: 'IUG',
    description: 'Protección contra sobrecargas y cortocircuitos (Curva C, 10A/16A/20A/25A).',
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
    description: 'Protección para personas contra contactos directos e indirectos (30 mA). Botón de test mensual.',
    normativeRef: 'IRAM-NM-IEC 61008 / AEA 771.18',
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

  // --- ELECTRODOMÉSTICOS Y ARTEFACTOS REALISTAS (CONSUMO Y POTENCIA) ---
  {
    type: 'termotanque',
    category: 'utilizacion',
    name: 'Termotanque Eléctrico (80L / 1500W)',
    labelPrefix: 'TT',
    defaultPowerWatts: 1500,
    defaultCircuitType: 'TUE',
    description: 'Termotanque de acumulación con resistencia blindada de 1.5 kW. Requiere circuito exclusivo TUE con toma de 20A.',
    normativeRef: 'IRAM 2071 / AEA 771.8.3',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -10 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -10 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 16 },
    ],
  },
  {
    type: 'aire_acondicionado',
    category: 'utilizacion',
    name: 'Aire Acondicionado Split (3000 Fg / 2200W)',
    labelPrefix: 'AA',
    defaultPowerWatts: 2200,
    defaultCircuitType: 'TUE',
    description: 'Equipo de climatización frío/calor. Circuito individual TUE con térmica bipolar independiente y toma de 20A.',
    normativeRef: 'AEA 771.8.3 / IRAM 2071',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -10 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -10 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 16 },
    ],
  },
  {
    type: 'horno_electrico',
    category: 'utilizacion',
    name: 'Horno Eléctrico de Empotrar (2000W)',
    labelPrefix: 'HE',
    defaultPowerWatts: 2000,
    defaultCircuitType: 'TUE',
    description: 'Horno eléctrico con doble resistencia y convección. Circuito para cargas elevadas en cocina.',
    normativeRef: 'AEA 90364-771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -10 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -10 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 16 },
    ],
  },
  {
    type: 'heladera',
    category: 'utilizacion',
    name: 'Heladera con Freezer No Frost (250W)',
    labelPrefix: 'HEL',
    defaultPowerWatts: 250,
    defaultCircuitType: 'TUG',
    description: 'Refrigerador doméstico motor inverter/compresor de bajo consumo y alta confiabilidad.',
    normativeRef: 'IRAM 2071',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'lavarropas',
    category: 'utilizacion',
    name: 'Lavarropas Automático (1200W)',
    labelPrefix: 'LAV',
    defaultPowerWatts: 1200,
    defaultCircuitType: 'TUG',
    description: 'Lavarropas con centrifugado y calentamiento de agua. Ubicado habitualmente en lavadero o baño.',
    normativeRef: 'IRAM 2071 / AEA 771.8',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'microondas',
    category: 'utilizacion',
    name: 'Horno Microondas (1200W)',
    labelPrefix: 'MO',
    defaultPowerWatts: 1200,
    defaultCircuitType: 'TUG',
    description: 'Artefacto de cocción rápida por magnetrón de 1.2 kW con conexión de puesta a tierra reglamentaria.',
    normativeRef: 'IRAM 2071',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'pava_electrica',
    category: 'utilizacion',
    name: 'Pava Eléctrica / Jarra Térmica (1800W)',
    labelPrefix: 'PAV',
    defaultPowerWatts: 1800,
    defaultCircuitType: 'TUG',
    description: 'Artefacto resistivo de calentamiento de agua instantáneo con alta demanda puntual.',
    normativeRef: 'IRAM 2071',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'bomba_agua',
    category: 'utilizacion',
    name: 'Bomba de Agua Centrífuga (1 HP / 750W)',
    labelPrefix: 'BOM',
    defaultPowerWatts: 750,
    defaultCircuitType: 'TUE',
    description: 'Electrobomba monofásica para elevación a tanque de reserva o presurización.',
    normativeRef: 'AEA 90364-771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'bomba_sumergible',
    category: 'utilizacion',
    name: 'Bomba Sumergible de Pozo (1.5 HP / 1100W)',
    labelPrefix: 'BSUM',
    defaultPowerWatts: 1100,
    defaultCircuitType: 'TUE',
    description: 'Bomba sumergible encapsulada en acero inoxidable con capacitor de arranque y protección térmica.',
    normativeRef: 'IRAM 2071 / AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'bomba_presurizadora',
    category: 'utilizacion',
    name: 'Bomba Presurizadora de Caudal (250W)',
    labelPrefix: 'BPRE',
    defaultPowerWatts: 250,
    defaultCircuitType: 'TUG',
    description: 'Bomba con sensor de flujo de encendido automático para aumentar presión de ducha y canillas.',
    normativeRef: 'AEA 90364-771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'bomba_pozo_profundo',
    category: 'utilizacion',
    name: 'Bomba Pozo Profundo Multietapa (2 HP / 1500W)',
    labelPrefix: 'BPOZ',
    defaultPowerWatts: 1500,
    defaultCircuitType: 'TUE',
    description: 'Electrobomba para napas profundas con tablero de control de nivel y protección por sobrecarga.',
    normativeRef: 'AEA 90364-771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'bomba_achique',
    category: 'utilizacion',
    name: 'Bomba de Achique / Pluvial (750W)',
    labelPrefix: 'BACH',
    defaultPowerWatts: 750,
    defaultCircuitType: 'TUE',
    description: 'Bomba sumergible para aguas sucias o pluviales con interruptor flotante de nivel incorporado.',
    normativeRef: 'AEA 90364-771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'bomba_recirculacion',
    category: 'utilizacion',
    name: 'Bomba de Recirculación Sanitaria (100W)',
    labelPrefix: 'BREC',
    defaultPowerWatts: 100,
    defaultCircuitType: 'TUG',
    description: 'Bomba circuladora silenciosa de rotor húmedo para agua caliente o losa radiante.',
    normativeRef: 'AEA 90364-771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'bomba_piscina',
    category: 'utilizacion',
    name: 'Bomba Autocebante para Piscina (1 HP / 750W)',
    labelPrefix: 'BPIS',
    defaultPowerWatts: 750,
    defaultCircuitType: 'TUE',
    description: 'Electrobomba con canasto trampa de hojas para filtrado y recirculación de piscina.',
    normativeRef: 'AEA 90364-702 (Piscinas)',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  // --- MÁQUINAS DE TALLER Y CARGAS PESADAS ---
  {
    type: 'soldadora_transformador',
    category: 'utilizacion',
    name: 'Soldadora por Transformador (4500VA)',
    labelPrefix: 'SOLD-TR',
    defaultPowerWatts: 3600,
    defaultCircuitType: 'TUE',
    description: 'Soldadora de arco por transformador tradicional. Factor de marcha 40%, corriente absorbida I1max 25A.',
    normativeRef: 'IRAM-IAS U 500-136 / AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -18, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 18, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 16 },
    ],
  },
  {
    type: 'soldadora_inverter',
    category: 'utilizacion',
    name: 'Soldadora Inverter MMA/TIG (3500W)',
    labelPrefix: 'SOLD-INV',
    defaultPowerWatts: 3000,
    defaultCircuitType: 'TUE',
    description: 'Soldadora electrónica Inverter de alta eficiencia. Factor de marcha 60%, corriente I1max 16A.',
    normativeRef: 'IEC 60974-1 / AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'compresor_aire',
    category: 'utilizacion',
    name: 'Compresor de Aire 50L (2.5 HP / 1850W)',
    labelPrefix: 'COMP',
    defaultPowerWatts: 1850,
    defaultCircuitType: 'TUE',
    description: 'Compresor a pistón con presóstato y válvula de alivio para herramientas neumáticas y pintura.',
    normativeRef: 'IRAM 2071 / AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'taladro_banco',
    category: 'utilizacion',
    name: 'Taladro de Banco de Columna (550W)',
    labelPrefix: 'TBAN',
    defaultPowerWatts: 550,
    defaultCircuitType: 'TUG',
    description: 'Taladro vertical de banco con poleas escalonadas y mandril de 16mm con guarda de seguridad.',
    normativeRef: 'AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'amoladora_banco',
    category: 'utilizacion',
    name: 'Amoladora de Banco Doble Piedra (375W)',
    labelPrefix: 'AMOL',
    defaultPowerWatts: 375,
    defaultCircuitType: 'TUG',
    description: 'Amoladora fija para desbaste y afilado de herramientas con protectores oculares.',
    normativeRef: 'AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'torno_metales',
    category: 'utilizacion',
    name: 'Torno Paralelo de Taller (1500W)',
    labelPrefix: 'TORN',
    defaultPowerWatts: 1500,
    defaultCircuitType: 'TUE',
    description: 'Torno para mecanizado de metales con plato de 3 mordazas y avance automático.',
    normativeRef: 'AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'fresadora',
    category: 'utilizacion',
    name: 'Fresadora Vertical (2200W)',
    labelPrefix: 'FRES',
    defaultPowerWatts: 2200,
    defaultCircuitType: 'TUE',
    description: 'Fresadora para ranurado y mecanizado con mesa en cruz y parada de emergencia por hongo.',
    normativeRef: 'AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'sierra_electrica',
    category: 'utilizacion',
    name: 'Sierra Circular / Sinfín de Mesa (1800W)',
    labelPrefix: 'SIER',
    defaultPowerWatts: 1800,
    defaultCircuitType: 'TUE',
    description: 'Sierra estacionaria de corte con guía paralela y freno electromagnético de disco.',
    normativeRef: 'AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'extractor_industrial',
    category: 'utilizacion',
    name: 'Extractor Axial / Centrífugo de Taller (400W)',
    labelPrefix: 'EXTR',
    defaultPowerWatts: 400,
    defaultCircuitType: 'TUG',
    description: 'Ventilación forzada y evacuación de humos y vapores para área de soldadura.',
    normativeRef: 'AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -14, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 14, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'colector_polvo',
    category: 'utilizacion',
    name: 'Colector de Polvo y Viruta (1500W)',
    labelPrefix: 'COLP',
    defaultPowerWatts: 1500,
    defaultCircuitType: 'TUE',
    description: 'Sistema de aspiración ciclónica para máquinas de carpintería con bolsa filtrante.',
    normativeRef: 'AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
    ],
  },
  {
    type: 'polipasto_electrico',
    category: 'utilizacion',
    name: 'Aparejo / Polipasto Eléctrico (1000W)',
    labelPrefix: 'POLI',
    defaultPowerWatts: 1000,
    defaultCircuitType: 'TUE',
    description: 'Polipasto de izaje con cable de acero, final de carrera superior e inferior y botonera colgante.',
    normativeRef: 'AEA 771',
    terminals: [
      { id: 'L', name: 'Fase (L)', type: 'fase', relX: -16, relY: -8 },
      { id: 'N', name: 'Neutro (N)', type: 'neutro', relX: 16, relY: -8 },
      { id: 'PE', name: 'Tierra (PE)', type: 'tierra', relX: 0, relY: 15 },
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
    labelPrefix: 'J',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Jabalina de acero-cobre hincada en suelo con cámara de inspección y tomacable.',
    normativeRef: 'IRAM 2309 / AEA 771.3',
    terminals: [
      { id: 'PE', name: 'Borne Principal Tierra (BPT)', type: 'tierra', relX: 0, relY: -14 },
    ],
  },
  {
    type: 'barra_pe',
    category: 'canalizacion',
    name: 'Barra Colectora de Tierra (PE)',
    labelPrefix: 'BPE',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Barra de latón de puesta a tierra con tornillos para colectar todos los conductores verdes-amarillos.',
    normativeRef: 'AEA 90364-7-771.18.2',
    terminals: [
      { id: 'PE_IN', name: 'Jabalina Entrada', type: 'tierra', relX: -16, relY: 0 },
      { id: 'PE_1', name: 'Derivación PE 1', type: 'tierra', relX: -5, relY: 0 },
      { id: 'PE_2', name: 'Derivación PE 2', type: 'tierra', relX: 5, relY: 0 },
      { id: 'PE_OUT', name: 'Derivación PE 3', type: 'tierra', relX: 16, relY: 0 },
    ],
  },
  {
    type: 'barra_n',
    category: 'canalizacion',
    name: 'Barra Repartidora de Neutro (N)',
    labelPrefix: 'BN',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Barra aislada para distribución de neutro del circuito hacia las distintas cargas.',
    normativeRef: 'AEA 90364-7-771.18.2',
    terminals: [
      { id: 'N_IN', name: 'Neutro Entrada', type: 'neutro', relX: -16, relY: 0 },
      { id: 'N_1', name: 'Neutro C1', type: 'neutro', relX: -5, relY: 0 },
      { id: 'N_2', name: 'Neutro C2', type: 'neutro', relX: 5, relY: 0 },
      { id: 'N_OUT', name: 'Neutro C3', type: 'neutro', relX: 16, relY: 0 },
    ],
  },
  {
    type: 'peine_distribucion',
    category: 'tablero',
    name: 'Peine de Conexión Bipolar DIN',
    labelPrefix: 'PDB',
    defaultPowerWatts: 0,
    defaultCircuitType: 'OTRO',
    description: 'Barra puente bipolar aislada para alimentación en paralelo de interruptores en riel DIN.',
    normativeRef: 'IEC 60947-7-1',
    terminals: [
      { id: 'L_IN', name: 'Fase Entrada', type: 'fase', relX: -16, relY: -8 },
      { id: 'N_IN', name: 'Neutro Entrada', type: 'neutro', relX: -16, relY: 8 },
      { id: 'L_OUT', name: 'Fase Salida', type: 'fase', relX: 16, relY: -8 },
      { id: 'N_OUT', name: 'Neutro Salida', type: 'neutro', relX: 16, relY: 8 },
    ],
  },
  {
    type: 'contactor_modular',
    category: 'tablero',
    name: 'Contactor Modular DIN (25A)',
    labelPrefix: 'KM',
    defaultPowerWatts: 5,
    defaultCircuitType: 'OTRO',
    description: 'Contactor electromagnético para automatización de cargas de potencia (iluminación, bombas, calefacción).',
    normativeRef: 'IEC 61095 / IRAM 2169',
    terminals: [
      { id: 'A1', name: 'Bobina A1 (Fase)', type: 'fase', relX: -16, relY: -12 },
      { id: 'A2', name: 'Bobina A2 (Neutro)', type: 'neutro', relX: -16, relY: 12 },
      { id: 'L_IN', name: 'Contacto 1 Entrada', type: 'fase', relX: 0, relY: -12 },
      { id: 'L_OUT', name: 'Contacto 2 Salida', type: 'fase', relX: 0, relY: 12 },
    ],
  },
  {
    type: 'temporizador',
    category: 'tablero',
    name: 'Temporizador Horario / Timer DIN',
    labelPrefix: 'KT',
    defaultPowerWatts: 2,
    defaultCircuitType: 'OTRO',
    description: 'Interruptor horario programable mecánico/digital para iluminación exterior o bombas de filtrado.',
    normativeRef: 'IEC 60730-2-7',
    terminals: [
      { id: 'L', name: 'Alimentación L', type: 'fase', relX: -16, relY: -10 },
      { id: 'N', name: 'Alimentación N', type: 'neutro', relX: -16, relY: 10 },
      { id: 'COM', name: 'Común Relé', type: 'fase', relX: 16, relY: -10 },
      { id: 'NO', name: 'Salida NA Relé', type: 'retorno', relX: 16, relY: 10 },
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

export interface ComponentLabelInfo {
  commonName: string;      // ej: "TÉRMICA", "DIFERENCIAL", "LÁMPARA", "INTERRUPTOR", "TOMACORRIENTE", "JABALINA"
  technicalTag: string;    // ej: "Q1", "ID1", "L1", "S1", "T1", "J1"
  bannerTitle: string;     // ej: "TÉRMICA Q1", "DIFERENCIAL ID1", "LÁMPARA L1"
  circuitInfo: string;     // ej: "C1 (IUG)"
  normativeCode: string;   // ej: "IRAM 2169"
}

export function getComponentLabelInfo(symbol: ElectricalSymbol, circuits?: { id: string; name: string; type: string }[]): ComponentLabelInfo {
  const type = symbol.type;
  let common = 'DISPOSITIVO';
  let defaultPrefix = 'X';

  switch (type) {
    case 'termica':
      common = 'TÉRMICA';
      defaultPrefix = 'Q';
      break;
    case 'diferencial':
      common = 'DIFERENCIAL';
      defaultPrefix = 'ID';
      break;
    case 'interruptor_general':
      common = 'INT. GENERAL';
      defaultPrefix = 'IGA';
      break;
    case 'dps':
      common = 'DPS';
      defaultPrefix = 'DPS';
      break;
    case 'luminaria':
      common = 'LÁMPARA';
      defaultPrefix = 'L';
      break;
    case 'interruptor_simple':
      common = 'INTERRUPTOR';
      defaultPrefix = 'S';
      break;
    case 'interruptor_doble':
      common = 'INT. DOBLE';
      defaultPrefix = 'S';
      break;
    case 'conmutado':
      common = 'CONMUTADOR';
      defaultPrefix = 'SC';
      break;
    case 'pulsador':
      common = 'PULSADOR';
      defaultPrefix = 'PUL';
      break;
    case 'tomacorriente':
      common = 'TOMACORRIENTE';
      defaultPrefix = 'T';
      break;
    case 'toma_especial':
      common = 'TOMA 20A';
      defaultPrefix = 'TUE';
      break;
    case 'puesta_tierra':
      common = 'JABALINA';
      defaultPrefix = 'J';
      break;
    case 'barra_pe':
      common = 'BARRA TIERRA';
      defaultPrefix = 'BPE';
      break;
    case 'barra_n':
      common = 'BARRA NEUTRO';
      defaultPrefix = 'BN';
      break;
    case 'peine_distribucion':
      common = 'PEINE DIN';
      defaultPrefix = 'PDB';
      break;
    case 'caja_paso':
      common = 'CAJA PASO';
      defaultPrefix = 'CP';
      break;
    case 'contactor_modular':
      common = 'CONTACTOR';
      defaultPrefix = 'KM';
      break;
    case 'temporizador':
      common = 'TIMER';
      defaultPrefix = 'KT';
      break;
    case 'tablero':
      common = 'TABLERO';
      defaultPrefix = 'TSG';
      break;
    case 'fuente_ac':
      common = 'RED 220V';
      defaultPrefix = 'RED';
      break;
    case 'timbre':
      common = 'TIMBRE';
      defaultPrefix = 'TIM';
      break;
    case 'ventilador':
      common = 'VENTILADOR';
      defaultPrefix = 'VENT';
      break;
    case 'termotanque':
      common = 'TERMOTANQUE';
      defaultPrefix = 'TT';
      break;
    case 'aire_acondicionado':
      common = 'AIRE ACOND.';
      defaultPrefix = 'AA';
      break;
    case 'horno_electrico':
      common = 'HORNO';
      defaultPrefix = 'HE';
      break;
    case 'heladera':
      common = 'HELADERA';
      defaultPrefix = 'HEL';
      break;
    case 'lavarropas':
      common = 'LAVARROPAS';
      defaultPrefix = 'LAV';
      break;
    case 'microondas':
      common = 'MICROONDAS';
      defaultPrefix = 'MO';
      break;
    case 'pava_electrica':
      common = 'PAVA ELÉC.';
      defaultPrefix = 'PAV';
      break;
    case 'bomba_agua':
      common = 'BOMBA';
      defaultPrefix = 'BOM';
      break;
    case 'bomba_sumergible':
      common = 'B. SUMERGIBLE';
      defaultPrefix = 'BSUM';
      break;
    case 'bomba_presurizadora':
      common = 'B. PRESURIZADORA';
      defaultPrefix = 'BPRE';
      break;
    case 'bomba_pozo_profundo':
      common = 'B. POZO PROF.';
      defaultPrefix = 'BPOZ';
      break;
    case 'bomba_achique':
      common = 'B. ACHIQUE';
      defaultPrefix = 'BACH';
      break;
    case 'bomba_recirculacion':
      common = 'B. RECIRCULACIÓN';
      defaultPrefix = 'BREC';
      break;
    case 'bomba_piscina':
      common = 'B. PISCINA';
      defaultPrefix = 'BPIS';
      break;
    case 'soldadora_transformador':
      common = 'SOLDADORA TRAFO';
      defaultPrefix = 'SOLD-TR';
      break;
    case 'soldadora_inverter':
      common = 'SOLDADORA INVERTER';
      defaultPrefix = 'SOLD-INV';
      break;
    case 'compresor_aire':
      common = 'COMPRESOR';
      defaultPrefix = 'COMP';
      break;
    case 'taladro_banco':
      common = 'TALADRO BANCO';
      defaultPrefix = 'TBAN';
      break;
    case 'amoladora_banco':
      common = 'AMOLADORA';
      defaultPrefix = 'AMOL';
      break;
    case 'torno_metales':
      common = 'TORNO';
      defaultPrefix = 'TORN';
      break;
    case 'fresadora':
      common = 'FRESADORA';
      defaultPrefix = 'FRES';
      break;
    case 'sierra_electrica':
      common = 'SIERRA DE MESA';
      defaultPrefix = 'SIER';
      break;
    case 'extractor_industrial':
      common = 'EXTRACTOR';
      defaultPrefix = 'EXTR';
      break;
    case 'colector_polvo':
      common = 'COLECTOR POLVO';
      defaultPrefix = 'COLP';
      break;
    case 'polipasto_electrico':
      common = 'POLIPASTO';
      defaultPrefix = 'POLI';
      break;
  }

  // Si symbol.label existe usarlo, si no componer defaultPrefix + id
  const technicalTag = symbol.label || defaultPrefix;
  const bannerTitle = `${common} ${technicalTag}`;

  let circuitInfo = 'Sin circuito';
  if (symbol.circuitId) {
    const c = circuits?.find(ci => ci.id === symbol.circuitId);
    circuitInfo = c ? `${c.id} (${c.type})` : symbol.circuitId;
  } else if (symbol.category === 'tablero' || symbol.type === 'puesta_tierra') {
    circuitInfo = 'Acometida / PAT';
  }

  const template = SYMBOL_TEMPLATES.find(t => t.type === symbol.type);
  const normativeCode = template?.normativeRef || 'AEA 90364';

  return {
    commonName: common,
    technicalTag,
    bannerTitle,
    circuitInfo,
    normativeCode,
  };
}
