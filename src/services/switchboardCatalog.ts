/**
 * ELECTRA PLAN — Catálogo Normalizado de Componentes de Tablero DIN y Fábrica de Dispositivos
 * Modelos con anchos modulares estándar de 18 mm (36 px en escala), bornes con pinouts y calibres reales.
 */
import {
  DINDeviceType,
  RealisticDINDevice,
  DeviceTerminal,
} from '../types/switchboardWorkshop';

export interface ComponentTemplate {
  type: DINDeviceType;
  name: string;
  label: string;
  poles: '1P' | '1P+N' | '2P' | '3P' | '4P';
  modulesWidth: number; // En módulos DIN (1 módulo = 36px)
  ratingAmps: number;
  curve?: 'B' | 'C' | 'D';
  breakingCapacityKa?: number;
  sensitivityMa?: number;
  description: string;
  category: 'cabecera' | 'proteccion_circuitos' | 'medicion_control' | 'distribucion';
}

export const SWITCHBOARD_COMPONENT_CATALOG: ComponentTemplate[] = [
  // 1. Cabecera y Protecciones Principales
  {
    type: 'iga',
    name: 'Interruptor General Automático (IGA) 2P 32A',
    label: 'IGA 32A',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 32,
    curve: 'C',
    breakingCapacityKa: 6,
    description: 'Corte general de la instalación residencial. Calibrado para la potencia contratada.',
    category: 'cabecera',
  },
  {
    type: 'iga',
    name: 'Interruptor General Automático (IGA) 2P 25A',
    label: 'IGA 25A',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 25,
    curve: 'C',
    breakingCapacityKa: 6,
    description: 'Corte general para viviendas con acometida de menor demanda máxima (hasta 5.5 kW).',
    category: 'cabecera',
  },
  {
    type: 'diferencial',
    name: 'Interruptor Diferencial (ID) 2P 40A 30mA',
    label: 'ID 40A/30mA',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 40,
    sensitivityMa: 30,
    description: 'Protección reglamentaria de personas contra contactos directos e indirectos (botón TEST).',
    category: 'cabecera',
  },
  {
    type: 'dps',
    name: 'Protector contra Sobretensiones (DPS) 1P+N 275V',
    label: 'DPS 20kA',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 20,
    description: 'Descargador de sobretensiones transitorias clase II para descargas atmosféricas y maniobras.',
    category: 'cabecera',
  },

  // 2. Interruptores Termomagnéticos Derivados (PIAs)
  {
    type: 'termomagnetico',
    name: 'PIA Bipolar 10A Curva C (IUG Iluminación)',
    label: 'PIA 10A',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 10,
    curve: 'C',
    breakingCapacityKa: 4.5,
    description: 'Protección para circuito IUG con conductores de sección mínima 1.5 mm².',
    category: 'proteccion_circuitos',
  },
  {
    type: 'termomagnetico',
    name: 'PIA Bipolar 16A Curva C (TUG Tomacorrientes)',
    label: 'PIA 16A',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 16,
    curve: 'C',
    breakingCapacityKa: 4.5,
    description: 'Protección para circuito TUG con conductores de sección mínima 2.5 mm².',
    category: 'proteccion_circuitos',
  },
  {
    type: 'termomagnetico',
    name: 'PIA Bipolar 20A Curva C (TUE Cargas Pesadas)',
    label: 'PIA 20A',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 20,
    curve: 'C',
    breakingCapacityKa: 4.5,
    description: 'Protección para circuito de tomas de uso especial (aires acondicionados, bombas) con cable 2.5/4 mm².',
    category: 'proteccion_circuitos',
  },
  {
    type: 'termomagnetico',
    name: 'PIA Bipolar 25A Curva C (Subdistribución)',
    label: 'PIA 25A',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 25,
    curve: 'C',
    breakingCapacityKa: 4.5,
    description: 'Línea seccional o alimentación a sub-tableros secundarios.',
    category: 'proteccion_circuitos',
  },
  {
    type: 'termomagnetico',
    name: 'PIA Unipolar 1P 10A Curva C (Control/Mando)',
    label: 'PIA 1P 10A',
    poles: '1P',
    modulesWidth: 1,
    ratingAmps: 10,
    curve: 'C',
    breakingCapacityKa: 3,
    description: 'Interruptor modular de 1 módulo (18 mm) para circuitos de mando o señalización.',
    category: 'proteccion_circuitos',
  },

  // 3. Medición, Automatización y Control
  {
    type: 'medidor_digital',
    name: 'Medidor Digital Multifunción Riel DIN (V, A, W, kWh)',
    label: 'MEDIDOR LCD',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 63,
    description: 'Visualizador digital en tiempo real de Tensión de red, Corriente eficaz, Potencia activa y Consumo.',
    category: 'medicion_control',
  },
  {
    type: 'contactor',
    name: 'Contactor Modular 25A 2NO (Bobina 230V)',
    label: 'KM1 25A',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 25,
    description: 'Conmutación de potencia para iluminación exterior, climatización o bombas mediante señal remota.',
    category: 'medicion_control',
  },
  {
    type: 'rele_temporizador',
    name: 'Relé Temporizador / Automático de Pasillo',
    label: 'TEMP 16A',
    poles: '1P',
    modulesWidth: 1,
    ratingAmps: 16,
    description: 'Temporización de apagado retardado para iluminación de palieres, escaleras o ventilación.',
    category: 'medicion_control',
  },

  // 4. Distribución, Borneras y Barras
  {
    type: 'repartidor_bloque',
    name: 'Bloque Repartidor Distribuidor Bipolar Escalonado',
    label: 'REPARTIDOR 100A',
    poles: '2P',
    modulesWidth: 4,
    ratingAmps: 100,
    description: 'Barras de latón macizo con tapa transparente para repartir Fase y Neutro limpiamente.',
    category: 'distribucion',
  },
  {
    type: 'barra_neutro',
    name: 'Barra Colectora de Neutro (Aislada)',
    label: 'BARRA N',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 63,
    description: 'Bornera con zócalo azul aislante para concentrar y derivar los retornos de neutro.',
    category: 'distribucion',
  },
  {
    type: 'barra_tierra',
    name: 'Barra Colectora de Puesta a Tierra (PE / BPT)',
    label: 'BARRA PE',
    poles: '2P',
    modulesWidth: 2,
    ratingAmps: 80,
    description: 'Bornera verde-amarilla vinculada al conductor de protección y a la jabalina.',
    category: 'distribucion',
  },
];

/**
 * Genera los terminales con sus coordenadas relativas y tipo de conexión física
 */
function createTerminalsForDevice(
  type: DINDeviceType,
  poles: '1P' | '1P+N' | '2P' | '3P' | '4P',
  widthPx: number
): DeviceTerminal[] {
  const terminals: DeviceTerminal[] = [];
  const topY = 10;
  const bottomY = 102;

  if (type === 'iga' || type === 'termomagnetico') {
    if (poles === '1P') {
      const x = widthPx / 2;
      terminals.push(
        { id: '1_in', name: 'L Entrada', type: 'fase', position: 'top', relX: x, relY: topY },
        { id: '2_out', name: 'L Salida', type: 'fase', position: 'bottom', relX: x, relY: bottomY }
      );
    } else if (poles === '2P') {
      const x1 = widthPx * 0.28;
      const x2 = widthPx * 0.72;
      terminals.push(
        { id: '1_in', name: 'L Entrada', type: 'fase', position: 'top', relX: x1, relY: topY },
        { id: 'N_in', name: 'N Entrada', type: 'neutro', position: 'top', relX: x2, relY: topY },
        { id: '2_out', name: 'L Salida', type: 'fase', position: 'bottom', relX: x1, relY: bottomY },
        { id: 'N_out', name: 'N Salida', type: 'neutro', position: 'bottom', relX: x2, relY: bottomY }
      );
    }
  } else if (type === 'diferencial') {
    const x1 = widthPx * 0.28;
    const x2 = widthPx * 0.72;
    terminals.push(
      { id: '1_in', name: 'L Entrada (1)', type: 'fase', position: 'top', relX: x1, relY: topY },
      { id: 'N_in', name: 'N Entrada (N)', type: 'neutro', position: 'top', relX: x2, relY: topY },
      { id: '2_out', name: 'L Salida (2)', type: 'fase', position: 'bottom', relX: x1, relY: bottomY },
      { id: 'N_out', name: 'N Salida (N)', type: 'neutro', position: 'bottom', relX: x2, relY: bottomY }
    );
  } else if (type === 'dps') {
    const x1 = widthPx * 0.28;
    const x2 = widthPx * 0.72;
    terminals.push(
      { id: 'L_in', name: 'L Fase', type: 'fase', position: 'top', relX: x1, relY: topY },
      { id: 'N_in', name: 'N Neutro', type: 'neutro', position: 'top', relX: x2, relY: topY },
      { id: 'PE_out', name: 'PE Descarga a Tierra', type: 'tierra', position: 'bottom', relX: widthPx / 2, relY: bottomY }
    );
  } else if (type === 'medidor_digital') {
    const x1 = widthPx * 0.28;
    const x2 = widthPx * 0.72;
    terminals.push(
      { id: '1_in', name: 'L Entrada Red', type: 'fase', position: 'top', relX: x1, relY: topY },
      { id: 'N_in', name: 'N Entrada Red', type: 'neutro', position: 'top', relX: x2, relY: topY },
      { id: '2_out', name: 'L Salida Carga', type: 'fase', position: 'bottom', relX: x1, relY: bottomY },
      { id: 'N_out', name: 'N Salida Carga', type: 'neutro', position: 'bottom', relX: x2, relY: bottomY }
    );
  } else if (type === 'contactor') {
    const x1 = widthPx * 0.25;
    const x2 = widthPx * 0.50;
    const x3 = widthPx * 0.75;
    terminals.push(
      { id: 'A1', name: 'A1 Bobina (+)', type: 'control', position: 'top', relX: x1, relY: topY },
      { id: '1_in', name: '1 Contacto Principal', type: 'fase', position: 'top', relX: x2, relY: topY },
      { id: '3_in', name: '3 Contacto Principal', type: 'neutro', position: 'top', relX: x3, relY: topY },
      { id: 'A2', name: 'A2 Bobina (-)', type: 'control', position: 'bottom', relX: x1, relY: bottomY },
      { id: '2_out', name: '2 Salida', type: 'fase', position: 'bottom', relX: x2, relY: bottomY },
      { id: '4_out', name: '4 Salida', type: 'neutro', position: 'bottom', relX: x3, relY: bottomY }
    );
  } else if (type === 'rele_temporizador') {
    const x = widthPx / 2;
    terminals.push(
      { id: 'L_in', name: 'L Alimentación', type: 'fase', position: 'top', relX: x - 6, relY: topY },
      { id: 'N_in', name: 'N Neutro', type: 'neutro', position: 'top', relX: x + 6, relY: topY },
      { id: 'Out', name: 'Contacto Temporizado', type: 'retorno', position: 'bottom', relX: x, relY: bottomY }
    );
  } else if (type === 'repartidor_bloque') {
    // 4 bornes superiores (entrada) y 8 bornes inferiores (derivaciones)
    for (let i = 1; i <= 4; i++) {
      const rx = (widthPx / 5) * i;
      terminals.push({
        id: `in_${i}`,
        name: `Entrada Distribuidor ${i % 2 === 1 ? 'Fase' : 'Neutro'}`,
        type: i % 2 === 1 ? 'fase' : 'neutro',
        position: 'top',
        relX: rx,
        relY: topY,
      });
    }
    for (let i = 1; i <= 6; i++) {
      const rx = (widthPx / 7) * i;
      terminals.push({
        id: `out_${i}`,
        name: `Salida Derivación ${i % 2 === 1 ? 'Fase' : 'Neutro'}`,
        type: i % 2 === 1 ? 'fase' : 'neutro',
        position: 'bottom',
        relX: rx,
        relY: bottomY,
      });
    }
  } else if (type === 'barra_neutro') {
    for (let i = 1; i <= 4; i++) {
      const rx = (widthPx / 5) * i;
      terminals.push({
        id: `n_${i}`,
        name: `Borne Neutro ${i}`,
        type: 'neutro',
        position: i <= 2 ? 'top' : 'bottom',
        relX: rx,
        relY: i <= 2 ? topY : bottomY,
      });
    }
  } else if (type === 'barra_tierra') {
    for (let i = 1; i <= 4; i++) {
      const rx = (widthPx / 5) * i;
      terminals.push({
        id: `pe_${i}`,
        name: `Borne Tierra PE ${i}`,
        type: 'tierra',
        position: i <= 2 ? 'top' : 'bottom',
        relX: rx,
        relY: i <= 2 ? topY : bottomY,
      });
    }
  }

  return terminals;
}

/**
 * Instancia un dispositivo realista para agregar al riel DIN
 */
export function createRealisticDINDevice(
  templateType: DINDeviceType,
  railId: number,
  slotIndex: number,
  circuitId?: string,
  customRatingAmps?: number
): RealisticDINDevice {
  const template =
    SWITCHBOARD_COMPONENT_CATALOG.find((t) => t.type === templateType) ||
    SWITCHBOARD_COMPONENT_CATALOG[0];

  const rating = customRatingAmps || template.ratingAmps;
  const widthPx = template.modulesWidth * 36; // 36 px por módulo DIN
  const terminals = createTerminalsForDevice(template.type, template.poles, widthPx);

  return {
    id: `dev_${template.type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    railId,
    slotIndex,
    type: template.type,
    name: template.name,
    label: template.label,
    poles: template.poles,
    modulesWidth: template.modulesWidth,
    ratingAmps: rating,
    curve: template.curve,
    breakingCapacityKa: template.breakingCapacityKa,
    sensitivityMa: template.sensitivityMa,
    state: 'closed',
    circuitId,
    customTag: circuitId ? `Circuito ${circuitId}` : undefined,
    terminals,
  };
}

/**
 * Paleta normalizada de conductores reglamentarios
 */
export const SWITCHBOARD_WIRE_COLORS = {
  fase: { stroke: '#854d0e', bg: '#713f12', label: 'Fase L (Marrón)' },
  neutro: { stroke: '#0284c7', bg: '#0369a1', label: 'Neutro N (Celeste)' },
  tierra: { stroke: '#16a34a', bg: '#15803d', label: 'Protección PE (Verde-Amarillo)' },
  retorno: { stroke: '#f59e0b', bg: '#d97706', label: 'Retorno (Naranja/Gris)' },
  control: { stroke: '#a855f7', bg: '#9333ea', label: 'Mando/Control (Púrpura)' },
  peine: { stroke: '#e2e8f0', bg: '#94a3b8', label: 'Peine de Cobre' },
};
