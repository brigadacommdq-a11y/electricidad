/**
 * ELECTRA PLAN — Ficha Educativa y Modal de Aprendizaje de Componentes
 * Proporciona desglose anatómico, función de bornes, comparación física vs esquemática,
 * alturas reglamentarias AEA 90364 y advertencias de seguridad para estudiantes.
 */
import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ShieldAlert,
  Zap,
  Layers,
  Ruler,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ElectricalSymbol, ConductorType } from '../types/electra';
import { SYMBOL_TEMPLATES, WIRE_COLOR_MAP } from '../services/symbolCatalog';
import { RealisticCADSymbolSVG } from './cad/RealisticCADSymbolSVG';

interface ComponentLearningModalProps {
  symbolType: string | null;
  onClose: () => void;
  onSelectType?: (type: string) => void;
}

interface ComponentEducationalData {
  type: string;
  name: string;
  normativeName: string;
  category: string;
  description: string;
  mountHeight: string;
  wireGauge: string;
  protectionRating: string;
  maxPerCircuit: string;
  parts: { name: string; description: string }[];
  terminals: { id: string; name: string; wireType: ConductorType; colorCode: string; role: string }[];
  safetyWarnings: string[];
  bestPractices: string[];
}

const EDUCATIONAL_CATALOG: Record<string, ComponentEducationalData> = {
  luminaria: {
    type: 'luminaria',
    name: 'Boca de Iluminación (Plafón / Lámpara de Techo)',
    normativeName: 'Boca de Salida para Iluminación de Uso General (IUG)',
    category: 'Puntos de Utilización',
    description:
      'Artefacto o receptáculo destinado a transformar energía eléctrica en flujo luminoso. Se conecta entre el Retorno (proveniente de la tecla o interruptor) y el Neutro de la red, disponiendo de borne PE para aterrizar partes metálicas.',
    mountHeight: 'Techo (2.40 m - 2.80 m) o Aplique de pared (1.80 m - 2.10 m)',
    wireGauge: 'Mínimo 1.5 mm² Cu (AEA 90364 Tabla 771.13.I)',
    protectionRating: 'Termomagnética Curva C de 10 A o 16 A',
    maxPerCircuit: 'Hasta 15 bocas por circuito de IUG',
    parts: [
      { name: 'Difusor Acrílico Microprismático', description: 'Distribuye homogéneamente el flujo luminoso de los chips LED sin deslumbrar.' },
      { name: 'Cuerpo Disipador de Aluminio', description: 'Evacua el calor generado por los módulos electrónicos alargando la vida útil.' },
      { name: 'Driver / Fuente de Corriente Constante', description: 'Convierte los 220V AC de la red a corriente continua filtrada y regulada.' },
      { name: 'Bornera de Conexión Rápida', description: 'Terminales con muelle elástico o tornillos imperdibles para Retorno, Neutro y PE.' },
    ],
    terminals: [
      { id: 'L', name: 'Retorno (Fase Interrumpida)', wireType: 'retorno', colorCode: 'Gris / Blanco / Negro', role: 'Conduce 220V hacia la lámpara sólo cuando la llave o interruptor se encuentra en posición cerrada.' },
      { id: 'N', name: 'Neutro (N)', wireType: 'neutro', colorCode: 'Celeste', role: 'Retorno de la corriente de trabajo al centro de estrella del transformador de distribución.' },
      { id: 'PE', name: 'Protección (Tierra)', wireType: 'tierra', colorCode: 'Verde con línea Amarilla', role: 'Deriva corrientes de fuga a tierra si ocurre una falla de aislación en la carcasa metálica.' },
    ],
    safetyWarnings: [
      '¡PELIGRO CRÍTICO! Nunca llevar la Fase directa al casquillo roscado exterior del portalámparas; la rosca debe conectarse invariablemente al Neutro para evitar electrocución al cambiar la bombilla.',
      'Si la luminaria posee chasis metálico, la conexión de la puesta a tierra (PE) es de carácter obligatorio según AEA 90364.',
    ],
    bestPractices: [
      'Utilizar conductores de retorno de color diferente a la fase (preferentemente castaño grisáceo o blanco) para identificarlos al desarmar cajas.',
      'El centro de caja octogonal debe estar firme y admitir un peso suspendido mínimo de 25 kg para artefactos pesados o ventiladores.',
    ],
  },

  interruptor_simple: {
    type: 'interruptor_simple',
    name: 'Interruptor Unipolar (Llave de 1 Punto / Tecla)',
    normativeName: 'Aparato de Maniobra para Mando Unipolar (IRAM 2006)',
    category: 'Dispositivos de Comando',
    description:
      'Dispositivo electromecánico manual intercalado en serie sobre el conductor de Fase. Al accionarse, une mecánicamente sus contactos de plata cerrando el circuito hacia la luminaria.',
    mountHeight: '1.10 m desde nivel de piso terminado (NPT) al eje del bastidor',
    wireGauge: 'Mínimo 1.5 mm² Cu (Fase y Retorno)',
    protectionRating: 'Capacidad nominal 10 AX a 250V AC (Apto cargas fluorescentes/LED)',
    maxPerCircuit: 'Controla bocas pertenecientes al circuito IUG asignado',
    parts: [
      { name: 'Balancín Basculante de Policarbonato', description: 'Mecanismo ergonómico que transmite el movimiento del dedo hacia los contactos internos.' },
      { name: 'Contactos con Pastillas de Plata-Óxido de Cadmio', description: 'Resisten el arco eléctrico en la apertura y evitan la soldadura de contactos.' },
      { name: 'Resorte de Acción Rápida (Biestable)', description: 'Asegura una conmutación instantánea independientemente de la velocidad con que el usuario pulse la tecla.' },
      { name: 'Carcasa Ignífuga Autoextinguible V0', description: 'Aislante térmico y dieléctrico que soporta hasta 850°C al hilo incandescente.' },
    ],
    terminals: [
      { id: 'L', name: 'Fase de Entrada (L)', wireType: 'fase', colorCode: 'Marrón / Negro / Rojo', role: 'Alimenta con tensión permanente el polo común móvil del interruptor.' },
      { id: 'R', name: 'Retorno de Salida (R)', wireType: 'retorno', colorCode: 'Gris / Blanco / Negro', role: 'Lleva el potencial positivo hacia la lámpara únicamente al cerrar el contacto.' },
    ],
    safetyWarnings: [
      '¡REGLA DE ORO DE LA ELECTRICIDAD! El interruptor DEBE CORTAR SIEMPRE LA FASE y JAMÁS EL NEUTRO. Si se corta el neutro, la luminaria apagada quedará con 220V vivos permanentes, exponiendo a quien la limpie o cambie.',
      'Nunca introducir el Neutro dentro de la bornera de la tecla; un error de conexionado creará un cortocircuito franco violento al accionar la tecla.',
    ],
    bestPractices: [
      'Ubicar las llaves al lado del picaporte de la puerta de ingreso a la habitación, a 15-20 cm del marco.',
      'Asegurar un pelado de conductor limpio de 9 mm sin filamentos de cobre deshilachados fuera del borne.',
    ],
  },

  conmutado: {
    type: 'conmutado',
    name: 'Interruptor Conmutado (Llave de Combinación / 2 Vías)',
    normativeName: 'Conmutador de 1 Polo con Inversión de Contacto (IRAM 2006)',
    category: 'Dispositivos de Comando',
    description:
      'Llave especial dotada de un contacto común móvil y dos posiciones de contacto fijas (puentes). Permite encender o apagar una o varias lámparas indistintamente desde 2 puestos distantes (ej: cabecera de cama y puerta, extremos de pasillo, descanso de escalera).',
    mountHeight: '1.10 m sobre NPT en ambos accesos',
    wireGauge: '1.5 mm² Cu (Fase, Retorno y ambos Puentes)',
    protectionRating: '10 AX / 250V AC',
    maxPerCircuit: 'Circuito IUG de 10A / 16A',
    parts: [
      { name: 'Balancín Conmutador Doble Vía', description: 'Alterna mecánicamente la conexión del común entre el borne Puente 1 y el borne Puente 2.' },
      { name: 'Borne Común (L o Retorno)', description: 'En el conmutador A recibe la Fase directa; en el conmutador B sale el Retorno hacia la lámpara.' },
      { name: 'Bornes de Puente de Combinación (P1 y P2)', description: 'Se interconectan directamente entre ambos interruptores mediante dos conductores viajeros.' },
    ],
    terminals: [
      { id: 'COM', name: 'Común (Fase o Retorno)', wireType: 'fase', colorCode: 'Marrón (Llave 1) / Gris (Llave 2)', role: 'Polo central basculante que conecta alternativamente a P1 o P2.' },
      { id: 'P1', name: 'Puente Viajero 1', wireType: 'puente', colorCode: 'Violeta o Naranja', role: 'Conductor que une el borne 1 de la llave A con el borne 1 de la llave B.' },
      { id: 'P2', name: 'Puente Viajero 2', wireType: 'puente', colorCode: 'Violeta o Naranja', role: 'Conductor que une el borne 2 de la llave A con el borne 2 de la llave B.' },
    ],
    safetyWarnings: [
      'Existe un método antiguo no reglamentario llamado "cortocircuito" donde se llevaba fase y neutro a cada llave: ¡ESTÁ ESTRICTAMENTE PROHIBIDO POR AEA! El único método seguro es el de Puentes Viajeros aquí implementado.',
    ],
    bestPractices: [
      'Usar cable violeta para los dos puentes para distinguirlos instantáneamente en cajas de paso intermedias.',
    ],
  },

  tomacorriente: {
    type: 'tomacorriente',
    name: 'Tomacorriente 10A con Puesta a Tierra (TUG)',
    normativeName: 'Tomacorriente 2P+T IRAM 2071 de 10A para Uso General',
    category: 'Puntos de Utilización',
    description:
      'Receptáculo estándar argentino con 3 alveolos (2 espigas planas inclinadas en V a 120° y 1 espiga vertical para puesta a tierra). Alimenta electrodomésticos portátiles de consumo habitual hasta 2200 VA.',
    mountHeight: 'Bajo: 0.30 m sobre NPT / Sobre mesada de cocina: 1.10 m / Lavadero: 1.30 m',
    wireGauge: 'Mínimo 2.5 mm² Cu para Fase, Neutro y PE (AEA 771.13)',
    protectionRating: 'Termomagnética Curva C de 16 A',
    maxPerCircuit: 'Hasta 15 bocas de tomacorrientes por circuito TUG',
    parts: [
      { name: 'Zócalo de Policarbonato IRAM 2071', description: 'Módulo con distancia y ángulo normalizados para evitar enchufes defectuosos.' },
      { name: 'Alveolos de Protección Infantil (Shutter)', description: 'Cortinillas plásticas interiores que impiden introducir objetos extraños salvo que entren las dos espigas a la vez.' },
      { name: 'Láminas de Contacto de Bronce Fosforoso', description: 'Alta elasticidad mecánica que retiene firmemente las espigas sin aflojarse con los años.' },
      { name: 'Borne de Puesta a Tierra Directo', description: 'Conecta la espiga vertical más larga, asegurando que el aparato se aterrice antes de recibir tensión.' },
    ],
    terminals: [
      { id: 'L', name: 'Fase (L) - Alveolo Derecho (visto de frente)', wireType: 'fase', colorCode: 'Marrón / Negro / Rojo', role: 'Aporta los 220V de tensión.' },
      { id: 'N', name: 'Neutro (N) - Alveolo Izquierdo', wireType: 'neutro', colorCode: 'Celeste', role: 'Cierre del circuito de corriente.' },
      { id: 'PE', name: 'Protección / Tierra (Espiga Vertical Abajo)', wireType: 'tierra', colorCode: 'Verde y Amarillo', role: 'Protección prioritaria de la vida humana contra descargas.' },
    ],
    safetyWarnings: [
      'NORMA IRAM 2071: Mirando el tomacorriente de frente con la tierra abajo, LA FASE VA A LA DERECHA y EL NEUTRO A LA IZQUIERDA. Invertirlos puede energizar partes de equipos con polaridad.',
      '¡JAMÁS eliminar la espiga de tierra de un enchufe ni usar adaptadores sin tierra!',
    ],
    bestPractices: [
      'Respetar distancias de seguridad: En baños los tomacorrientes deben estar fuera de la Zona 0, 1 y 2 (a más de 60 cm del borde de la bañera o ducha).',
      'En cocinas, mantener los tomas a un mínimo de 50 cm de la bacha de agua y hornallas de gas.',
    ],
  },

  toma_especial: {
    type: 'toma_especial',
    name: 'Tomacorriente 20A Especial (TUE)',
    normativeName: 'Tomacorriente 2P+T IRAM 2071 de 20A para Uso Especial',
    category: 'Puntos de Utilización',
    description:
      'Receptáculo reforzado con espigas más gruesas que no admite clavijas convencionales de 10A de forma invertida. Diseñado para cargas pesadas como acondicionadores de aire de más de 3000 frigorías, anafes eléctricos, termotanques y hornos.',
    mountHeight: 'Según artefacto: Aire acondicionado a 2.10 m / Termotanque a 1.40 m',
    wireGauge: 'Mínimo 2.5 mm² a 4.0 mm² Cu según cálculo de caída de tensión',
    protectionRating: 'Termomagnética de 20 A',
    maxPerCircuit: 'Hasta 12 bocas por circuito TUE',
    parts: [
      { name: 'Alveolos Reforzados para Clavija de 20A', description: 'Aberturas más anchas diseñadas para disipar corrientes continuas de hasta 4400 Watts.' },
      { name: 'Bornes de Ajuste para Conductor de 4 mm²', description: 'Tornillos de apriete con arandela de presión para conductores gruesos.' },
    ],
    terminals: [
      { id: 'L', name: 'Fase (L)', wireType: 'fase', colorCode: 'Marrón / Negro', role: 'Alimentación de potencia para la carga pesada.' },
      { id: 'N', name: 'Neutro (N)', wireType: 'neutro', colorCode: 'Celeste', role: 'Retorno de corriente.' },
      { id: 'PE', name: 'Tierra (PE)', wireType: 'tierra', colorCode: 'Verde/Amarillo', role: 'Puesta a tierra de seguridad de la carcasa del artefacto.' },
    ],
    safetyWarnings: [
      'No cambiar una ficha macho de 20A por una de 10A recortando las patas: provocará calentamiento excesivo e incendio.',
    ],
    bestPractices: [
      'Prever un circuito exclusivo independiente para equipos de climatización de alta potencia.',
    ],
  },

  caja_paso: {
    type: 'caja_paso',
    name: 'Caja de Paso y Derivación (Octogonal / 10x10)',
    normativeName: 'Caja de Derivación y Empalmes (IRAM 2346)',
    category: 'Canalizaciones',
    description:
      'Gabinete embutido de chapa cincada o termoplástico para la confluencia de cañerías, cambio de dirección de conductores y derivaciones con borneras.',
    mountHeight: 'Techo (Octogonal) o Pared a 2.20 m (10x10 embutida)',
    wireGauge: 'Acomoda haces de cables de 1.5 a 4.0 mm²',
    protectionRating: 'Cierre con tapa ciega atornillada',
    maxPerCircuit: 'Máximo 3 curvas de 90° entre cajas consecutivas',
    parts: [
      { name: 'Troqueles Estampados (Knockouts)', description: 'Orificios prepunzados de 3/4" y 7/8" que se desprenden para acoplar los conectores de caño.' },
      { name: 'Tornillo de Masa / Conexión Equipotencial', description: 'Tornillo con arandela dentada para conectar la caja metálica al conductor PE.' },
    ],
    terminals: [
      { id: 'L_NODE', name: 'Nodo de Fase', wireType: 'fase', colorCode: 'Marrón', role: 'Bornera repartidora para derivar Fase hacia teclas y tomas.' },
      { id: 'N_NODE', name: 'Nodo de Neutro', wireType: 'neutro', colorCode: 'Celeste', role: 'Bornera de derivación de Neutro hacia cargas.' },
      { id: 'PE_NODE', name: 'Borne de Protección (PE)', wireType: 'tierra', colorCode: 'Verde/Amarillo', role: 'Aterrizamiento del chasis de la caja y continuidad del conductor PE.' },
    ],
    safetyWarnings: [
      'No se permiten empalmes con cinta aisladora suelta: la reglamentación exige el uso de borneras de conexión aisladas (WAGO o regletas).',
      'No llenar más del 35% de la sección útil de la cañería para permitir la correcta disipación térmica de los cables.',
    ],
    bestPractices: [
      'Dejar colas de cable de al menos 15 cm dentro de cada caja para facilitar reparaciones futuras.',
    ],
  },

  puesta_tierra: {
    type: 'puesta_tierra',
    name: 'Electrodo de Puesta a Tierra (Jabalina con Cámara)',
    normativeName: 'Electrodo de Dispersión Hincado IRAM 2309',
    category: 'Sistemas de Protección',
    description:
      'Elemento conductor vertical de acero cobreado hincado en el terreno natural, cuya misión es drenar corrientes de falla a tierra y estabilizar el potencial neutro del sistema.',
    mountHeight: 'A ras de suelo en jardín o vereda técnica con cámara de inspección',
    wireGauge: 'Conductor de Protección Principal: mínimo 4.0 mm² a 10 mm² Cu',
    protectionRating: 'Resistencia de Puesta a Tierra R ≤ 10 Ω (AEA 90364)',
    maxPerCircuit: 'Un sistema equipotencial para toda la instalación',
    parts: [
      { name: 'Barra de Acero con Recubrimiento de Cobre Electrolítico', description: 'Longitud típica 1.50 m o 2.00 m, diámetro nominal 1/2" o 5/8" con recubrimiento ≥ 254 micrones.' },
      { name: 'Tomacables de Bronce con Tornillo de Presión', description: 'Grapa de apriete que asegura contacto de muy baja resistencia entre el conductor PE y la jabalina.' },
      { name: 'Cámara de Inspección con Tapa', description: 'Recinto cilíndrico o cuadrado de 15x15 cm para poder medir periódicamente la resistencia con telurímetro.' },
    ],
    terminals: [
      { id: 'PE', name: 'Borne Principal de Tierra (BPT)', wireType: 'tierra', colorCode: 'Verde-Amarillo', role: 'Parte hacia la barra de tierra del Tablero Seccional General (TSG).' },
    ],
    safetyWarnings: [
      'Sin puesta a tierra adecuada, el disyuntor diferencial NO podrá desconectar automáticamente ante una falla de aislamiento hasta que una persona toque el artefacto defectuoso.',
      'Nunca utilizar cañerías de agua de plomo o caños de gas natural como electrodo de tierra: está prohibido y genera riesgo de explosión.',
    ],
    bestPractices: [
      'Medir la resistencia con telurímetro anualmente para certificar un valor inferior a 10 Ohms en épocas secas.',
    ],
  },

  termica: {
    type: 'termica',
    name: 'Interruptor Termomagnético (Térmica / PIA)',
    normativeName: 'Pequeño Interruptor Automático (IRAM 2169 / IEC 60898)',
    category: 'Dispositivos de Protección',
    description:
      'Aparato de maniobra y protección contra sobrecargas continuadas y cortocircuitos francos. Su disparo térmico (bimetal) protege la aislación de los conductores de la instalación contra calentamientos excesivos, y su disparo magnético (bobina) abre instantáneamente ante corrientes de cortocircuito.',
    mountHeight: 'Riel DIN 35 mm en gabinete a 1.40 m sobre NPT',
    wireGauge: 'Sección coordinada con corriente nominal: 1.5 mm² (10A), 2.5 mm² (16A), 4 mm² (20A), 6 mm² (25A)',
    protectionRating: 'Poder de corte mínimo 3000 A (IRAM) / Curva C (disparo magnético entre 5 y 10 In)',
    maxPerCircuit: 'Un PIA por cada circuito terminal independiente',
    parts: [
      { name: 'Disparador Térmico (Bimetal)', description: 'Lámina de dos metales con distinto coeficiente de dilatación que se dobla por calor generado por sobrecorriente prolongada.' },
      { name: 'Disparador Electromagnético', description: 'Electroimán de disparo instantáneo en menos de 10 milisegundos ante corrientes extremas de cortocircuito.' },
      { name: 'Cámara de Extinción de Arco (Deion)', description: 'Placas ferromagnéticas paralelas que dividen, enfrían y apagan el arco eléctrico generado en la apertura.' },
      { name: 'Palanca de Accionamiento Manual', description: 'Permite maniobra manual ON/OFF con indicación de estado visual e imposibilidad de bloqueo forzado (mecanismo de disparo libre).' },
    ],
    terminals: [
      { id: 'L_IN', name: 'Entrada Fase (L)', wireType: 'fase', colorCode: 'Marrón / Negro / Rojo', role: 'Alimentación de cabecera.' },
      { id: 'N_IN', name: 'Entrada Neutro (N)', wireType: 'neutro', colorCode: 'Celeste', role: 'Alimentación de neutro.' },
      { id: 'L_OUT', name: 'Salida Fase Circuito', wireType: 'fase', colorCode: 'Marrón / Negro / Rojo', role: 'Salida hacia las bocas del circuito.' },
      { id: 'N_OUT', name: 'Salida Neutro Circuito', wireType: 'neutro', colorCode: 'Celeste', role: 'Retorno del circuito protegido.' },
    ],
    safetyWarnings: [
      '¡PELIGRO MORTAL! La térmica NO protege a los seres humanos contra contactos accidentales o descargas eléctricas; esa protección es competencia exclusiva del Disyuntor Diferencial.',
      'Nunca cambiar una térmica por una de mayor amperaje sin reemplazar todos los cables del circuito por otros de mayor sección transversal.',
    ],
    bestPractices: [
      'Apretar los bornes con el torque especificado por el fabricante (típicamente 2.0 a 2.5 N·m) para evitar falso contacto y calentamiento.',
    ],
  },

  diferencial: {
    type: 'diferencial',
    name: 'Interruptor Diferencial (Disyuntor / Salvavidas)',
    normativeName: 'Interruptor Automático por Corriente Diferencial Residual (IRAM-NM-IEC 61008)',
    category: 'Dispositivos de Protección',
    description:
      'Dispositivo de protección de alta sensibilidad cuya función primordial es salvar la vida humana ante contactos directos e indirectos con conductores bajo tensión, además de prevenir incendios por corrientes de fuga a tierra.',
    mountHeight: 'Riel DIN 35 mm en cabecera del Tablero Seccional General',
    wireGauge: 'Mínimo 4.0 mm² a 10 mm² según corriente nominal del interruptor (25A o 40A)',
    protectionRating: 'Sensibilidad IΔn = 30 mA (0.03 A) / Tiempo de disparo ≤ 30 milisegundos',
    maxPerCircuit: 'Un diferencial por cada grupo máximo de 3 circuitos terminales',
    parts: [
      { name: 'Transformador Toroidal de Núcleo Magnético', description: 'Suma vectorial de las corrientes de fase y neutro; si hay fuga a tierra, la suma no da cero y se induce tensión.' },
      { name: 'Relé de Desconexión Polarizado de Alta Sensibilidad', description: 'Gatilla el desenganche mecánico con apenas 30 milésimas de Ampere de corriente de fuga.' },
      { name: 'BOTÓN DE PRUEBA TEST "T"', description: 'Circuito con resistencia calibrada que genera una fuga artificial controlada para comprobar mensualmente el mecanismo.' },
      { name: 'Mecanismo de Desconexión Bipolar Simultánea', description: 'Abre Fase y Neutro simultáneamente con separación dieléctrica certificada.' },
    ],
    terminals: [
      { id: 'L_IN', name: 'Llegada de Red Fase', wireType: 'fase', colorCode: 'Marrón / Negro', role: 'Entrada desde el interruptor general IGA.' },
      { id: 'N_IN', name: 'Llegada de Red Neutro', wireType: 'neutro', colorCode: 'Celeste', role: 'Entrada de neutro de la red.' },
      { id: 'L_OUT', name: 'Salida Fase a Peine', wireType: 'fase', colorCode: 'Marrón', role: 'Alimenta las térmicas derivadas.' },
      { id: 'N_OUT', name: 'Salida Neutro a Barra', wireType: 'neutro', colorCode: 'Celeste', role: 'Alimenta la barra repartidora de neutros.' },
    ],
    safetyWarnings: [
      '¡PRUEBA MENSUAL OBLIGATORIA! Presionar el botón "T" todos los meses. Si al apretar el botón el disyuntor no salta inmediatamente, debe ser reemplazado de urgencia: ¡NO ESTÁ PROTEGIENDO!',
      'Para que el disyuntor funcione preventivamente, la vivienda DEBE tener instalado un sistema de Puesta a Tierra reglamentario con jabalina.',
    ],
    bestPractices: [
      'No utilizar diferenciales de 300 mA para viviendas familiares; la norma exige estrictamente sensibilidad humana de 30 mA.',
    ],
  },

  interruptor_general: {
    type: 'interruptor_general',
    name: 'Interruptor General Automático (IGA)',
    normativeName: 'Interruptor de Cabecera y Seccionamiento Omnipolar (IRAM 2169 / AEA 771.17)',
    category: 'Dispositivos de Protección',
    description:
      'Interruptor termomagnético general de corte omnipolar colocado a la entrada de la instalación para proteger el cable de acometida y permitir desenergizar completamente el inmueble.',
    mountHeight: 'Cabecera en Tablero Principal (junto al medidor) y Seccional',
    wireGauge: 'Cables principales de 4 mm², 6 mm² o 10 mm²',
    protectionRating: 'Poder de corte mínimo 3000 A o 4500 A / Calibre 25A, 32A o 40A',
    maxPerCircuit: 'Un IGA por acometida de suministro',
    parts: [
      { name: 'Palanca Robusta Unificada', description: 'Garantiza el corte solidario de ambos conductores simultáneamente.' },
      { name: 'Contactos Principales Reforzados', description: 'Diseñados para soportar toda la potencia simultánea de la casa.' },
    ],
    terminals: [
      { id: 'L_IN', name: 'Acometida Fase', wireType: 'fase', colorCode: 'Marrón', role: 'Viene del medidor.' },
      { id: 'N_IN', name: 'Acometida Neutro', wireType: 'neutro', colorCode: 'Celeste', role: 'Viene del medidor.' },
      { id: 'L_OUT', name: 'Salida a Diferencial', wireType: 'fase', colorCode: 'Marrón', role: 'Alimenta el disyuntor.' },
      { id: 'N_OUT', name: 'Salida Neutro Diferencial', wireType: 'neutro', colorCode: 'Celeste', role: 'Alimenta el disyuntor.' },
    ],
    safetyWarnings: [
      'Siempre cortar el IGA antes de realizar cualquier intervención en el tablero o cableado.',
    ],
    bestPractices: [
      'Coordinar el calibre del IGA con la corriente admisible del cable de alimentación principal.',
    ],
  },

  dps: {
    type: 'dps',
    name: 'Protector de Sobretensiones Transitorias (DPS)',
    normativeName: 'Descargador de Sobretensiones Clase II (IRAM 2184 / IEC 61643-11)',
    category: 'Dispositivos de Protección',
    description:
      'Dispositivo con varistores de óxido metálico que conmuta en nanosegundos ante picos de alta tensión producidos por descargas atmosféricas (rayos) o maniobras de la distribuidora, drenando la sobretensión a tierra.',
    mountHeight: 'Riel DIN en derivación a la entrada del tablero',
    wireGauge: 'Conductor PE de descarga: mínimo 6 mm² a 10 mm²',
    protectionRating: 'Corriente máxima de descarga Imax 20 kA a 40 kA / Up ≤ 1.5 kV',
    maxPerCircuit: 'Un juego bipolar por tablero',
    parts: [
      { name: 'Cartucho de Varistor de ZnO Enchufable', description: 'Resistencia no lineal que cae a cero ohmios al superar el voltaje umbral.' },
      { name: 'Indicador Óptico de Desconexión', description: 'Bandera visual que cambia de Verde a Rojo cuando el cartucho absorbió su capacidad máxima y se agotó.' },
    ],
    terminals: [
      { id: 'L', name: 'Fase de Red', wireType: 'fase', colorCode: 'Marrón', role: 'Monitoreo de sobretensión.' },
      { id: 'N', name: 'Neutro de Red', wireType: 'neutro', colorCode: 'Celeste', role: 'Monitoreo de neutro.' },
      { id: 'PE', name: 'Tierra de Descarga', wireType: 'tierra', colorCode: 'Verde/Amarillo', role: 'Drenaje del rayo a la jabalina.' },
    ],
    safetyWarnings: [
      'Si el visor óptico se encuentra ROJO, los equipos conectados han quedado desprotegidos contra descargas.',
    ],
    bestPractices: [
      'La longitud total de los cables de conexión del DPS a la barra PE debe ser inferior a 50 cm para minimizar la inductancia.',
    ],
  },

  barra_pe: {
    type: 'barra_pe',
    name: 'Barra Colectora de Tierra (PE)',
    normativeName: 'Barra Principal de Puesta a Tierra Equipotencial (AEA 771.18.2)',
    category: 'Canalizaciones',
    description:
      'Barra de bronce o latón macizo fijada en el tablero eléctrico donde convergen todos los conductores de protección verde-amarillo de la vivienda y se unen al cable que baja a la jabalina.',
    mountHeight: 'Fijada en la parte inferior del gabinete del tablero',
    wireGauge: 'Acomoda conductores de 2.5 mm² a 16 mm²',
    protectionRating: 'Capacidad de corriente de cortocircuito homologada',
    maxPerCircuit: 'Una barra por gabinete de distribución',
    parts: [
      { name: 'Pletina Perforada de Latón', description: 'Múltiples orificios roscados para apriete independiente de cada cable.' },
      { name: 'Soportes de Aislación Ignífugos Verdes', description: 'Fijan mecánicamente la barra a la placa de montaje.' },
    ],
    terminals: [
      { id: 'PE_IN', name: 'Entrada Jabalina', wireType: 'tierra', colorCode: 'Verde/Amarillo', role: 'Conexión con el electrodo exterior.' },
      { id: 'PE_1', name: 'Derivación C1', wireType: 'tierra', colorCode: 'Verde/Amarillo', role: 'PE para circuito de luces.' },
      { id: 'PE_2', name: 'Derivación C2', wireType: 'tierra', colorCode: 'Verde/Amarillo', role: 'PE para circuito de tomas.' },
    ],
    safetyWarnings: [
      'Cada conductor de protección debe tener su propio tornillo de apriete; no apretar más de un cable por borne.',
    ],
    bestPractices: [
      'Utilizar terminales puntera hueca prensados en cables flexibles antes de atornillar.',
    ],
  },

  barra_n: {
    type: 'barra_n',
    name: 'Barra Repartidora de Neutro (N)',
    normativeName: 'Barra de Distribución de Conductor Neutro Aislada (AEA 771.18.2)',
    category: 'Canalizaciones',
    description:
      'Barra aislada de distribución que recibe el neutro de salida del disyuntor y lo bifurca ordenadamente hacia cada cañería de circuito.',
    mountHeight: 'Fijada en la parte superior o lateral del tablero con soporte aislante celeste',
    wireGauge: 'Acomoda cables de 1.5 mm² a 10 mm²',
    protectionRating: 'Aislación garantizada 1000V respecto al chasis metálico',
    maxPerCircuit: 'Una por cada diferencial asignado',
    parts: [
      { name: 'Pletina de Cobre/Latón', description: 'Distribución equipotencial del neutro.' },
      { name: 'Soporte Aislador Celeste', description: 'Asegura que el neutro nunca toque la chapa del tablero.' },
    ],
    terminals: [
      { id: 'N_IN', name: 'Entrada Neutro Disyuntor', wireType: 'neutro', colorCode: 'Celeste', role: 'Llegada desde el disyuntor.' },
      { id: 'N_1', name: 'Neutro C1', wireType: 'neutro', colorCode: 'Celeste', role: 'Neutro del circuito de luces.' },
      { id: 'N_2', name: 'Neutro C2', wireType: 'neutro', colorCode: 'Celeste', role: 'Neutro del circuito de tomas.' },
    ],
    safetyWarnings: [
      '¡PROHIBIDO UNIR LA BARRA DE NEUTRO CON LA BARRA DE TIERRA EN EL TABLERO! En esquema TT esto causa disparo continuo del disyuntor y pérdida de seguridad.',
    ],
    bestPractices: [
      'Identificar cada borne de neutro con el número del circuito correspondiente.',
    ],
  },
};

export const ComponentLearningModal: React.FC<ComponentLearningModalProps> = ({
  symbolType,
  onClose,
  onSelectType,
}) => {
  const [selectedType, setSelectedType] = useState<string>(symbolType || 'luminaria');

  const compData = EDUCATIONAL_CATALOG[selectedType] || EDUCATIONAL_CATALOG['luminaria'];

  // Símbolo simulado para la previsualización realista
  const dummySymbol: ElectricalSymbol = {
    id: `edu_preview_${compData.type}`,
    floorId: 'floor_1',
    category: 'utilizacion',
    type: compData.type,
    name: compData.name,
    label: compData.type.toUpperCase().slice(0, 4),
    x: 0,
    y: 0,
    rotation: 0,
    powerWatts: 60,
    voltage: 220,
    powerFactor: 0.9,
    terminals: compData.terminals.map((t, idx) => ({
      id: t.id,
      name: t.name,
      type: t.wireType,
      relX: idx === 0 ? -15 : idx === 1 ? 15 : 0,
      relY: idx === 2 ? 15 : -10,
    })),
    state: { isOpen: false, isOn: true, isEnergized: true },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-850 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>Enciclopedia Técnica y Ficha de Componente</span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-slate-800 text-amber-400 rounded-full font-mono border border-slate-700">
                  Normas AEA & IRAM
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Guía anatómica de conexionado, detalles físicos y seguridad para aprendices e instaladores.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector Rápido de Componentes */}
        <div className="px-4 sm:px-6 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {Object.keys(EDUCATIONAL_CATALOG).map((key) => {
            const item = EDUCATIONAL_CATALOG[key];
            const isSelected = selectedType === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedType(key);
                  if (onSelectType) onSelectType(key);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
                }`}
              >
                {item.name.split('(')[0].trim()}
              </button>
            );
          })}
        </div>

        {/* Contenido con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Fila Superior: Comparativa Visual 3 Modos (Realista vs Conexiones vs Esquemático) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Comparación Visual: Aspecto Físico Real vs Conexiones vs Símbolo IRAM</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Vista Fotorrealista */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center text-center">
                <span className="text-[11px] font-semibold text-amber-400 mb-2">1. Aspecto Físico Real</span>
                <div className="w-28 h-28 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <svg viewBox="-30 -30 60 60" className="w-24 h-24">
                    <RealisticCADSymbolSVG symbol={dummySymbol} viewMode="realista" isSelected={false} isOn={true} />
                  </svg>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">Acabados reales, bisel y tornillos</span>
              </div>

              {/* 2. Vista de Conexiones */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center text-center">
                <span className="text-[11px] font-semibold text-cyan-400 mb-2">2. Vista de Conexiones</span>
                <div className="w-28 h-28 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <svg viewBox="-30 -30 60 60" className="w-24 h-24">
                    <RealisticCADSymbolSVG symbol={dummySymbol} viewMode="conexiones" isSelected={false} isOn={true} />
                  </svg>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">Identificación de bornes y puente interno</span>
              </div>

              {/* 3. Vista Esquemática Normalizada */}
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col items-center text-center">
                <span className="text-[11px] font-semibold text-emerald-400 mb-2">3. Símbolo Técnico IRAM</span>
                <div className="w-28 h-28 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-center relative overflow-hidden shadow-inner">
                  <svg viewBox="-30 -30 60 60" className="w-24 h-24">
                    <RealisticCADSymbolSVG symbol={dummySymbol} viewMode="esquematica" isSelected={false} isOn={true} />
                  </svg>
                </div>
                <span className="text-[10px] text-slate-400 mt-2">Dibujo técnico para planos municipales</span>
              </div>
            </div>
          </div>

          {/* Fila de Datos Normativos y Características */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1">
                <Ruler className="w-3 h-3 text-amber-400" /> Altura de Montaje
              </span>
              <span className="text-xs font-bold text-white mt-1 block">{compData.mountHeight}</span>
            </div>
            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-400" /> Sección de Conductor
              </span>
              <span className="text-xs font-bold text-emerald-400 mt-1 block">{compData.wireGauge}</span>
            </div>
            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-cyan-400" /> Protección Máxima
              </span>
              <span className="text-xs font-bold text-cyan-400 mt-1 block">{compData.protectionRating}</span>
            </div>
            <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-amber-400" /> Límite por Circuito
              </span>
              <span className="text-xs font-bold text-amber-300 mt-1 block">{compData.maxPerCircuit}</span>
            </div>
          </div>

          {/* Tabla Anatómica de Bornes y Terminales */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Mapa de Bornes y Códigos de Color de Cables (Norma AEA 90364)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-700/80 text-[11px] text-slate-400">
                    <th className="py-2 px-3 font-semibold">Borne / Terminal</th>
                    <th className="py-2 px-3 font-semibold">Color Obligatorio</th>
                    <th className="py-2 px-3 font-semibold">Función Técnica y Destino</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {compData.terminals.map((term) => (
                    <tr key={term.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: WIRE_COLOR_MAP[term.wireType]?.stroke || '#94a3b8' }} />
                        <span>{term.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 font-medium">
                        {term.colorCode}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 leading-relaxed">
                        {term.role}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desglose de Partes Físicas */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Anatomía y Materiales del Dispositivo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {compData.parts.map((p, idx) => (
                <div key={idx} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                  <div className="font-semibold text-xs text-amber-300 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{p.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Advertencias de Seguridad para Principiantes */}
          <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>Errores Frecuentes y Advertencias Críticas de Seguridad</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-red-200/90 leading-relaxed list-disc list-inside">
              {compData.safetyWarnings.map((w, idx) => (
                <li key={idx} className="marker:text-red-400">{w}</li>
              ))}
            </ul>
          </div>

          {/* Buenas Prácticas de Instalación */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recomendaciones Prácticas de Mano de Obra Calificada</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-emerald-200/90 leading-relaxed list-disc list-inside">
              {compData.bestPractices.map((bp, idx) => (
                <li key={idx} className="marker:text-emerald-400">{bp}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            Normativa aplicable: AEA 90364-7-771 / IRAM 2071 / IRAM 2006
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-lg transition-all"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
