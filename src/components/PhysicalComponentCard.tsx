/**
 * ELECTRA PLAN — Ficha de Reconocimiento Físico de Componentes Reales
 * Diseñada para principiantes: muestra fotografía/modelo físico, nombre habitual en Argentina,
 * nombre técnico normalizado, función simplificada, partes a reconocer, bornes de conexión,
 * símbolo normalizado verificado, ubicación típica en la instalación, diferencias con parecidos
 * y advertencias de seguridad críticas.
 */
import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ShieldAlert,
  Zap,
  Info,
  Layers,
  MapPin,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Maximize2,
} from 'lucide-react';
import { ElectricalSymbol, ConductorType } from '../types/electra';
import { RealisticCADSymbolSVG } from './cad/RealisticCADSymbolSVG';
import { getComponentLabelInfo } from '../services/symbolCatalog';

export interface PhysicalCardData {
  type: string;
  argentineName: string;         // Ej: "Térmica / Llave Térmica"
  technicalName: string;         // Ej: "Pequeño Interruptor Automático (PIA) IEC 60898"
  beginnerExplanation: string;   // Explicación coloquial sin suponer conocimientos previos
  keyPartsToRecognize: string[]; // Qué partes físicas mirar
  terminalsExplanation: { name: string; wireColor: string; functionDesc: string }[];
  verifiedSymbolDesc: string;    // Descripción del símbolo eléctrico
  realWorldLocation: string;     // Dónde se encuentra en una casa
  differencesWithSimilar: string;// Diferencias vs otros parecidos (ej: Térmica vs Disyuntor)
  safetyWarnings: string[];      // Advertencias vitales
}

export const PHYSICAL_COMPONENTS_DATA: Record<string, PhysicalCardData> = {
  termica: {
    type: 'termica',
    argentineName: 'Térmica / Llave Térmica / Termomagnética',
    technicalName: 'Pequeño Interruptor Automático (PIA) — Norma IRAM 2169 / IEC 60898',
    beginnerExplanation:
      'Protege los cables de la instalación para que no se sobrecalienten ni causen un incendio. Corta automáticamente en dos casos: si enchufás demasiadas cosas a la vez (sobrecarga) o si dos cables pelados se tocan entre sí (cortocircuito). ¡ATENCIÓN! No protege a las personas si tocan un cable vivo; esa tarea es exclusiva del Disyuntor.',
    keyPartsToRecognize: [
      'Palanca basculante de encendido/apagado (hacia arriba = ON energizado, hacia abajo = OFF desconectado).',
      'Ventana de estado visual (Rojo = contactos cerrados, Verde = contactos abiertos y seguros).',
      'Calibre impreso de corriente nominal (ejemplo: C10, C16, C20 o C25 que indican los Amperes máximos).',
      'Bornes superior e inferior con tornillo prisionero para apretar el cable de cobre.',
      'Traba metálica o plástica posterior para montaje a presión sobre Riel DIN de 35 mm.',
    ],
    terminalsExplanation: [
      { name: 'Bornes Superiores (1 y N)', wireColor: 'Marrón y Celeste', functionDesc: 'Entrada de alimentación proveniente del interruptor general o peine de distribución.' },
      { name: 'Bornes Inferiores (2 y N)', wireColor: 'Marrón y Celeste', functionDesc: 'Salida hacia las cañerías del circuito de iluminación (IUG) o tomas (TUG).' },
    ],
    verifiedSymbolDesc: 'Símbolo IRAM de corte unipolar/bipolar con gatillo térmico (bimetal) y bobina magnética instantánea.',
    realWorldLocation: 'Adentro del tablero eléctrico de la vivienda, montada sobre el riel DIN al lado del disyuntor.',
    differencesWithSimilar:
      'DIFERENCIA CLAVE CON EL DISYUNTOR: La térmica NO TIENE BOTÓN DE TEST "T". Si mirás el aparato y NO tiene el botón "T", es una térmica. La térmica cuida los cables; el disyuntor cuida tu vida humana.',
    safetyWarnings: [
      'Nunca pongas una térmica más grande (ej. 25A) en cables finos (1.5 mm²): los cables se derretirán antes de que la térmica salte.',
      'Asegurarse de apretar firmemente los tornillos; un borne flojo genera chispas y calor peligroso (falso contacto).',
    ],
  },

  diferencial: {
    type: 'diferencial',
    argentineName: 'Disyuntor / Disyuntor Diferencial / Salva-Vidas',
    technicalName: 'Interruptor por Corriente Diferencial Residual (ID) — IRAM-NM-IEC 61008',
    beginnerExplanation:
      'Es el ángel guardián de las personas. Mide constantemente que la misma corriente que entra por la Fase regrese por el Neutro. Si una persona toca un cable pelado o un lavarropas tiene pérdida, la corriente se escapa a tierra y el disyuntor corta la luz en menos de 0.03 segundos (30 milisegundos), evitando que la persona muera electrocutada.',
    keyPartsToRecognize: [
      'BOTÓN "T" DE PRUEBA (TEST): Botón identificatorio fundamental (suele ser amarillo, naranja o gris).',
      'Sensibilidad grabada "30 mA" (0.03 Amperes): El umbral seguro para el corazón humano.',
      'Palanca de rearme ergonómica.',
      'Carcasa de doble módulo (más ancha que una térmica unipolar).',
      'Diagrama toroidal esquemático impreso en el frente.',
    ],
    terminalsExplanation: [
      { name: 'Bornes Superiores', wireColor: 'Fase (Marrón) y Neutro (Celeste)', functionDesc: 'Llegada de la corriente general desde el medidor o llave general.' },
      { name: 'Bornes Inferiores', wireColor: 'Fase y Neutro de salida', functionDesc: 'Alimentan el peine o puentes hacia las térmicas individuales de cada circuito.' },
    ],
    verifiedSymbolDesc: 'Transformador toroidal con núcleo magnético y disparador de corriente residual de defecto.',
    realWorldLocation: 'En el Tablero Seccional General (TSG), ubicado siempre como interruptor de cabecera que protege a todos los demás circuitos.',
    differencesWithSimilar:
      'CÓMO DISTINGUIRLO DE LA TÉRMICA: El disyuntor TIENE SIEMPRE EL BOTÓN DE TEST "T" y el valor "30 mA". Las térmicas no lo tienen. El disyuntor no salta por sobrecarga de estufas ni por cortocircuitos francos.',
    safetyWarnings: [
      '¡OBLIGATORIO PROBARLO CADA MES! Presionar el botón "T". Debe saltar al instante. Si no salta al apretar el botón, el disyuntor está roto y debés cambiarlo de inmediato.',
      'El disyuntor necesita que la casa tenga Puesta a Tierra (jabalina) para poder cortar antes de que alguien toque una chapa electrizada.',
    ],
  },

  interruptor_general: {
    type: 'interruptor_general',
    argentineName: 'Interruptor General / Llave Principal de Cabecera (IGA)',
    technicalName: 'Interruptor General Automático Bipolar de Corte Omnipolar — AEA 771.17',
    beginnerExplanation:
      'Es la llave maestra de la vivienda. Si bajás esta palanca, cortás por completo toda la energía eléctrica de la casa (tanto Fase como Neutro a la vez) para poder hacer arreglos de manera 100% segura.',
    keyPartsToRecognize: [
      'Palanca unificada sólida que corta ambos polos a la vez.',
      'Mayor calibre de corriente que las térmicas de los circuitos (ej: 25A, 32A o 40A).',
      'Posición en el extremo izquierdo o superior del tablero.',
    ],
    terminalsExplanation: [
      { name: 'Entrada Superior', wireColor: 'Cables gruesos de acometida (4 a 10 mm²)', functionDesc: 'Vienen directamente desde el medidor de la calle.' },
      { name: 'Salida Inferior', wireColor: 'Puente directo al disyuntor', functionDesc: 'Entrega la energía al disyuntor diferencial de cabecera.' },
    ],
    verifiedSymbolDesc: 'Interruptor bipolar automático de maniobra y seccionamiento omnipolar.',
    realWorldLocation: 'En el Tablero Principal (junto al medidor en la entrada) y como cabecera en el Tablero Seccional adentro de la casa.',
    differencesWithSimilar:
      'Maneja toda la potencia total del inmueble. Las térmicas comunes solo controlan un sector (ej: solo luces o solo tomas).',
    safetyWarnings: [
      'Antes de cambiar un foco o reparar un enchufe, es una excelente costumbre bajar el Interruptor General completo.',
    ],
  },

  dps: {
    type: 'dps',
    argentineName: 'Protector de Sobretensiones / Descargador Atmosférico (DPS)',
    technicalName: 'Dispositivo de Protección contra Sobretensiones Transitorias Clase II — IEC 61643',
    beginnerExplanation:
      'Protege los electrodomésticos inteligentes (televisores, heladeras inverter, computadoras) contra rayos o picos bruscos de voltaje que vienen por los cables de la calle. Cuando llega un golpe de tensión, el DPS lo absorbe y lo manda al suelo por la jabalina.',
    keyPartsToRecognize: [
      'Cartucho desmontable enchufable en el riel DIN.',
      'Visor o bandera óptica de estado: Verde = funcionando correctamente / Rojo = cartucho quemado tras recibir una descarga, requiere reemplazo.',
      'Símbolo de rayo estampado en el frente.',
    ],
    terminalsExplanation: [
      { name: 'Borne Superior L / N', wireColor: 'Fase y Neutro de la red', functionDesc: 'Conectados en paralelo a la entrada de la instalación.' },
      { name: 'Borne Inferior PE', wireColor: 'Verde-Amarillo directo', functionDesc: 'Conexión ultracorta a la barra de puesta a tierra colectora.' },
    ],
    verifiedSymbolDesc: 'Símbolo de varistor de óxido metálico (MOV) con desconector térmico de seguridad.',
    realWorldLocation: 'En el tablero principal o seccional, conectado en paralelo a la entrada de la red.',
    differencesWithSimilar:
      'No se conecta en serie (la corriente de los artefactos no pasa a través de él). Está en derivación esperando como un centinela.',
    safetyWarnings: [
      'Si el visor óptico se pone ROJO, el aparato ya cumplió su vida útil salvando tus equipos y debe reemplazarse el cartucho.',
    ],
  },

  puesta_tierra: {
    type: 'puesta_tierra',
    argentineName: 'Jabalina / Puesta a Tierra / Electrodo PAT',
    technicalName: 'Electrodo Hincado de Dispersión a Tierra — Norma IRAM 2309 / AEA 771.3',
    beginnerExplanation:
      'Es una barra maciza de acero revestida de cobre puro que se clava verticalmente en la tierra del patio o vereda técnica. Ofrece un camino de escape fácil y seguro para que cualquier corriente peligrosa se vaya al suelo en vez de pasar por el cuerpo de una persona.',
    keyPartsToRecognize: [
      'Varilla cilíndrica de cobre brillante de 1.50 metros o 2.00 metros de largo y 5/8" de grosor.',
      'Tomacables o abrazadera de bronce macizo con tornillo de apriete fuerte.',
      'Cámara de inspección plástica o de cemento con tapa al nivel del suelo.',
      'Cable verde con línea amarilla de mínimo 4 mm² o 10 mm².',
    ],
    terminalsExplanation: [
      { name: 'Tomacables de Bronce', wireColor: 'Verde y Amarillo (PE)', functionDesc: 'Punto de conexión eléctrica firme y desarmable para medir con telurímetro.' },
    ],
    verifiedSymbolDesc: 'Tres líneas horizontales paralelas decrecientes simbolizando la dispersión en el terreno natural.',
    realWorldLocation: 'En el terreno natural exterior (jardín, cantero o vereda del frente), protegida por una cámara con tapa.',
    differencesWithSimilar:
      'No lleva corriente en condiciones normales. Solo actúa cuando hay una falla de aislación.',
    safetyWarnings: [
      '¡PROHIBIDO INTERRUMPIR EL CABLE DE TIERRA! Nunca se debe poner una llave, fusible ni interruptor en el cable verde y amarillo.',
      'Nunca uses caños de agua de plomo ni cañerías de gas como tierra: es ilegal y altamente peligroso.',
    ],
  },

  barra_pe: {
    type: 'barra_pe',
    argentineName: 'Barra de Tierra / Peine Colector PE',
    technicalName: 'Barra Colectora Principal de Protección Equipotencial — AEA 771.18.2',
    beginnerExplanation:
      'Es una tira de latón o cobre con muchos tornillos ubicada adentro del tablero. A ella se atornillan todos los cables verdes-amarillos que vienen de los enchufes y de las lámparas de la casa, uniéndolos con el cable que baja a la jabalina.',
    keyPartsToRecognize: [
      'Barra de bronce o latón macizo perforada con múltiples agujeros roscados.',
      'Soportes aisladores laterales plásticos de color verde.',
      'Tornillos de apriete para cada terminal.',
    ],
    terminalsExplanation: [
      { name: 'Borne Principal Grande', wireColor: 'Verde-Amarillo (10 mm²)', functionDesc: 'Conductor de protección principal que viene desde la jabalina.' },
      { name: 'Bornes de Derivación', wireColor: 'Verde-Amarillo (2.5 mm²)', functionDesc: 'Salida del conductor PE hacia cada cañería de la vivienda.' },
    ],
    verifiedSymbolDesc: 'Barra de distribución de protección de potencial cero.',
    realWorldLocation: 'En la parte inferior o superior del gabinete del tablero eléctrico.',
    differencesWithSimilar:
      'Se diferencia de la barra de neutro por su color de soporte (verde) y porque NO transporta corriente de retorno.',
    safetyWarnings: [
      'Cada cable debe tener su propio tornillo independiente; no amontonar varios cables bajo un mismo borne.',
    ],
  },

  barra_n: {
    type: 'barra_n',
    argentineName: 'Barra de Neutros / Repartidor de Neutro',
    technicalName: 'Barra de Distribución de Conductor Neutro Aislada — AEA 771.18.2',
    beginnerExplanation:
      'Barra de cobre que recibe el cable celeste (Neutro) que sale del disyuntor y lo reparte prolijamente hacia cada uno de los circuitos de la vivienda.',
    keyPartsToRecognize: [
      'Barra metálica sobre base plástica aislada de color CELESTE o AZUL.',
      'Aislación reforzada para no tocar la chapa del tablero.',
    ],
    terminalsExplanation: [
      { name: 'Entrada N', wireColor: 'Celeste', functionDesc: 'Viene de la salida de neutro del disyuntor diferencial.' },
      { name: 'Salidas N', wireColor: 'Celeste', functionDesc: 'Van a las cargas de iluminación y tomacorrientes.' },
    ],
    verifiedSymbolDesc: 'Barra de distribución de neutro de trabajo (N).',
    realWorldLocation: 'Adentro del tablero eléctrico, aislada del chasis metálico.',
    differencesWithSimilar:
      '¡OJO! La barra de neutro JAMÁS debe puentearse con la barra de tierra adentro del tablero en esquemas TT (norma argentina). Si las unís, el disyuntor saltará constantemente.',
    safetyWarnings: [
      'Verificar siempre que el soporte plástico aísle perfectamente la barra del gabinete metálico.',
    ],
  },

  luminaria: {
    type: 'luminaria',
    argentineName: 'Lámpara / Plafón / Boca de Luz / Centro',
    technicalName: 'Boca de Salida para Iluminación de Uso General (IUG) — AEA 771.8',
    beginnerExplanation:
      'Es el artefacto que ilumina la habitación. Se conecta entre el Retorno (que viene de la tecla de la pared) y el Neutro de la red. Si el artefacto tiene partes de metal, también lleva cable verde-amarillo de tierra.',
    keyPartsToRecognize: [
      'Plafón difusor o portalámparas E27.',
      'Bornera de conexión con 3 bornes (Retorno, Neutro y Tierra).',
      'Carcasa metálica o plástica de fijación a la caja del techo.',
    ],
    terminalsExplanation: [
      { name: 'Borne de Retorno (Fase Interrumpida)', wireColor: 'Gris / Blanco / Negro', functionDesc: 'Trae los 220V únicamente cuando prendés la tecla de la pared.' },
      { name: 'Borne de Neutro', wireColor: 'Celeste', functionDesc: 'Cierra el circuito para que circule la corriente.' },
      { name: 'Borne de Tierra (PE)', wireColor: 'Verde y Amarillo', functionDesc: 'Protege contra descargas si el plafón es metálico.' },
    ],
    verifiedSymbolDesc: 'Círculo con aspa cruzada interior (Cruz de San Andrés) según norma IRAM.',
    realWorldLocation: 'En el centro del techo de los ambientes o en apliques de pared a 1.80m de altura.',
    differencesWithSimilar:
      'A diferencia de un tomacorriente que tiene corriente constante las 24 horas, la lámpara solo recibe energía cuando el interruptor está cerrado.',
    safetyWarnings: [
      '¡REGLA FUNDAMENTAL! En portalámparas de rosca, la rosca exterior debe ser SIEMPRE el Neutro y el borne del fondo la Fase. Así, si rozás la rosca al cambiar el foco, no te dará una patada.',
    ],
  },

  interruptor_simple: {
    type: 'interruptor_simple',
    argentineName: 'Tecla / Llave de 1 Punto / Interruptor Simple',
    technicalName: 'Aparato de Maniobra para Mando Unipolar — IRAM 2006',
    beginnerExplanation:
      'Es la tecla de la pared que apretás para encender o apagar la luz. Funciona como un puente levadizo sobre el cable de Fase: cuando la pulsás, baja el puente y deja pasar la electricidad hacia la lámpara.',
    keyPartsToRecognize: [
      'Balancín basculante frontal (tecla).',
      'Bastidor de montaje que se atornilla a la caja 10x5 de la pared.',
      'Tapa de policarbonato embellecedora blanca o de color.',
      'SOLO 2 BORNES traseros con tornillos.',
    ],
    terminalsExplanation: [
      { name: 'Borne L (Fase Directa)', wireColor: 'Marrón / Rojo / Negro', functionDesc: 'Recibe los 220V permanentes desde el tablero.' },
      { name: 'Borne R (Retorno)', wireColor: 'Gris / Blanco / Negro', functionDesc: 'Sale con 220V hacia la lámpara cuando la tecla está encendida.' },
    ],
    verifiedSymbolDesc: 'Línea de contacto con bandera unipolar según norma IRAM.',
    realWorldLocation: 'En la pared al lado del picaporte de entrada a la habitación, a 1.10 metros del suelo.',
    differencesWithSimilar:
      'Tiene SOLO 2 BORNES traseros. Si tiene 3 bornes traseros, es un conmutador de combinación para prender desde dos lugares.',
    safetyWarnings: [
      '¡REGLA DE ORO DE LA ELECTRICIDAD! La tecla DEBE CORTAR SIEMPRE LA FASE y NUNCA EL NEUTRO. Si cortás el neutro, la lámpara apagada quedará con 220V vivos en el techo.',
      'JAMÁS metas el cable celeste (Neutro) en los bornes de la tecla, porque al apretarla generarás una explosión y cortocircuito instantáneo.',
    ],
  },

  interruptor_doble: {
    type: 'interruptor_doble',
    argentineName: 'Llave de 2 Puntos / Interruptor Doble',
    technicalName: 'Doble Interruptor Unipolar en Placa Modular — IRAM 2006',
    beginnerExplanation:
      'Dos teclas independientes en la misma placa de la pared. Permite prender la luz del living con una tecla y la luz del comedor con la otra tecla.',
    keyPartsToRecognize: [
      'Dos balancines angostos en la misma placa.',
      'Borne de Fase común (o puente de cable) y dos bornes de retorno separados.',
    ],
    terminalsExplanation: [
      { name: 'Fase Común (L)', wireColor: 'Marrón', functionDesc: 'Alimenta a ambas teclas.' },
      { name: 'Retorno 1', wireColor: 'Gris', functionDesc: 'Va a la lámpara 1.' },
      { name: 'Retorno 2', wireColor: 'Blanco', functionDesc: 'Va a la lámpara 2.' },
    ],
    verifiedSymbolDesc: 'Doble interruptor unipolar en un mismo símbolo.',
    realWorldLocation: 'En accesos principales donde se comandan dos circuitos de luces contiguos.',
    differencesWithSimilar:
      'Controla dos luces diferentes desde el mismo punto físico.',
    safetyWarnings: [
      'Asegurarse de que ambos retornos pertenezcan al mismo circuito asignado.',
    ],
  },

  conmutado: {
    type: 'conmutado',
    argentineName: 'Llave de Combinación / Llave Conmutada / Tecla 2 Vías',
    technicalName: 'Conmutador de 1 Polo con Inversión de Contacto — IRAM 2006',
    beginnerExplanation:
      'Permite encender y apagar la misma lámpara desde dos lugares diferentes. Por ejemplo: prendés la luz al pie de la escalera y la apagás cuando llegás arriba, o prendés en la puerta del dormitorio y la apagás desde la cama.',
    keyPartsToRecognize: [
      'Tiene TRES BORNES traseros (uno común marcado con "L" o flecha, y dos bornes laterales para los puentes viajeros).',
      'Exteriormente la tecla se ve igual a una simple, pero por detrás tiene 3 tornillos.',
    ],
    terminalsExplanation: [
      { name: 'Borne Común (L o Retorno)', wireColor: 'Marrón (Llave 1) / Gris (Llave 2)', functionDesc: 'En la primera llave recibe la Fase directa; en la segunda llave sale hacia la lámpara.' },
      { name: 'Bornes de Puente 1 y 2', wireColor: 'Violeta / Naranja', functionDesc: 'Dos cables que viajan por el caño uniendo directamente ambas llaves entre sí.' },
    ],
    verifiedSymbolDesc: 'Contacto de palanca basculante con dos posiciones fijas de selección.',
    realWorldLocation: 'Extremos de pasillos largos, descansos de escaleras y cabeceras de camas.',
    differencesWithSimilar:
      'DIFERENCIA FUNDAMENTAL: La tecla común tiene 2 tornillos. La conmutada tiene 3 tornillos traseros.',
    safetyWarnings: [
      'Nunca uses el sistema antiguo prohibido de "cortocircuito". Siempre usá el sistema reglamentario de puentes viajeros aquí detallado.',
    ],
  },

  tomacorriente: {
    type: 'tomacorriente',
    argentineName: 'Tomacorriente / Enchufe de Pared / Toma 10A (TUG)',
    technicalName: 'Tomacorriente Bipolar con Toma de Tierra (2P+T) — Norma IRAM 2071 de 10A',
    beginnerExplanation:
      'Es el enchufe estándar de las casas argentinas con tres ranuras. Sirve para conectar la tele, la heladera, el cargador del celular o una lámpara (aparatos de hasta 2200 Watts de potencia).',
    keyPartsToRecognize: [
      'Tres ranuras normalizadas: dos inclinadas en "V" a 120 grados y una vertical recta abajo.',
      'Cortinillas plásticas interiores de seguridad infantil (obturadores) que impiden que los chicos metan clavos o cables.',
      'Láminas internas de bronce elástico que agarran firmemente las patas del enchufe.',
      'Borne de tierra conectado directamente a la patita vertical más larga.',
    ],
    terminalsExplanation: [
      { name: 'Fase (L) - Ranura Derecha', wireColor: 'Marrón / Negro / Rojo', functionDesc: 'Trae la tensión de 220V.' },
      { name: 'Neutro (N) - Ranura Izquierda', wireColor: 'Celeste', functionDesc: 'Retorno de la corriente eléctrica.' },
      { name: 'Tierra (PE) - Ranura Vertical Abajo', wireColor: 'Verde y Amarillo', functionDesc: 'Conexión vital de protección a la jabalina.' },
    ],
    verifiedSymbolDesc: 'Semicírculo con dos o tres terminales según representación unifilar IRAM.',
    realWorldLocation: 'En las paredes de todos los ambientes a 30 cm del piso o a 1.10 m sobre las mesadas de cocina.',
    differencesWithSimilar:
      'El toma de 10A tiene ranuras estándar. El toma de 20A tiene ranuras más anchas para artefactos pesados.',
    safetyWarnings: [
      'REGLA MNEMOTÉCNICA IRAM: Mirando el enchufe de frente con la patita de tierra hacia abajo: LA FASE VA A LA DERECHA y EL NEUTRO A LA IZQUIERDA.',
      '¡JAMÁS arranques la patita redonda/vertical de tierra de un enchufe con una pinza! Te estás quitando tu propia protección salvavidas.',
    ],
  },

  toma_especial: {
    type: 'toma_especial',
    argentineName: 'Tomacorriente 20A / Toma Especial / Toma Aire Acondicionado (TUE)',
    technicalName: 'Tomacorriente 2P+T de 20A — Norma IRAM 2071 de 20A',
    beginnerExplanation:
      'Enchufe reforzado de mayor tamaño para aparatos pesados que consumen mucha energía: aires acondicionados grandes, termotanques eléctricos, hornos y anafes vitrocerámicos (soporta hasta 4400 Watts).',
    keyPartsToRecognize: [
      'Ranuras notablemente más anchas y gruesas que las de un enchufe común.',
      'Grabado en el frente "20A 250V~".',
      'Bornes traseros más grandes que aceptan cables gruesos de 4 mm².',
    ],
    terminalsExplanation: [
      { name: 'Fase 20A (L)', wireColor: 'Marrón / Negro (mínimo 2.5 a 4 mm²)', functionDesc: 'Alimentación de alta potencia.' },
      { name: 'Neutro 20A (N)', wireColor: 'Celeste (4 mm²)', functionDesc: 'Retorno de alta corriente.' },
      { name: 'Tierra 20A (PE)', wireColor: 'Verde/Amarillo', functionDesc: 'Puesta a tierra obligatoria del chasis metálico del equipo.' },
    ],
    verifiedSymbolDesc: 'Semicírculo relleno con terminales reforzados según IRAM.',
    realWorldLocation: 'Cerca del aire acondicionado (a 2.10 m de altura) o detrás del termotanque eléctrico.',
    differencesWithSimilar:
      'Una ficha común de 10A queda floja o no es apta; una ficha de 20A no entra en un toma de 10A para evitar recalentamientos.',
    safetyWarnings: [
      'Nunca cortes ni limes las patas gruesas de una ficha de 20A para meterla a la fuerza en un toma común de 10A: prenderás fuego la instalación.',
    ],
  },

  caja_paso: {
    type: 'caja_paso',
    argentineName: 'Caja de Derivación / Caja de Paso / Caja Octogonal',
    technicalName: 'Caja de Embutir para Conexiones y Empalmes — Norma IRAM 2346',
    beginnerExplanation:
      'Caja metálica o de PVC empotrada en el techo o en la pared donde se juntan los caños. Adentro se hacen los empalmes y bifurcaciones con borneras para repartir los cables hacia las teclas y enchufes.',
    keyPartsToRecognize: [
      'Chapa estampada cincada o plástico ignífugo.',
      'Discos troquelados prepunzados (knockouts) que se desprenden para meter los conectores de caño.',
      'Tornillo de puesta a tierra de la caja metálica.',
      'Tapa ciega atornillada.',
    ],
    terminalsExplanation: [
      { name: 'Bornera de Fase', wireColor: 'Marrón', functionDesc: 'Nodo repartidor de Fase.' },
      { name: 'Bornera de Neutro', wireColor: 'Celeste', functionDesc: 'Nodo repartidor de Neutro.' },
      { name: 'Bornera de Tierra', wireColor: 'Verde y Amarillo', functionDesc: 'Nodo de tierra y aterrizamiento de la caja.' },
    ],
    verifiedSymbolDesc: 'Cuadrado o círculo punteado representativo de caja de paso y registro.',
    realWorldLocation: 'En el techo (donde cuelga la lámpara) y en las paredes en pasillos a 2.20 m de altura.',
    differencesWithSimilar:
      'No tiene mecanismos móviles; es el centro neurálgico de distribución.',
    safetyWarnings: [
      'La reglamentación prohibe empalmes con cinta aisladora pelada; deben usarse borneras de derivación aisladas o conectores tipo WAGO.',
      'No llenar más del 35% del caño con cables para evitar que concentren calor y se quemen.',
    ],
  },

  peine_distribucion: {
    type: 'peine_distribucion',
    argentineName: 'Peine Bipolar / Barra Peine DIN',
    technicalName: 'Peine de Conexión y Distribución Modular — IEC 60947-7-1',
    beginnerExplanation:
      'Es una barra plana con dientes de cobre protegida por un plástico aislante. Se enchufa en la parte superior de las térmicas del tablero, reemplazando a la maraña peligrosa de cables puenteados.',
    keyPartsToRecognize: [
      'Dientes de cobre espaciados a 18 mm (ancho estándar de un módulo DIN).',
      'Cubierta plástica rígida aislante contra contactos accidentales.',
      'Tapas plásticas ciegas en los extremos para que no queden puntas de cobre vivas al aire.',
    ],
    terminalsExplanation: [
      { name: 'Dientes de Fase (L)', wireColor: 'Cobre macizo', functionDesc: 'Alimentan el polo de fase de cada térmica.' },
      { name: 'Dientes de Neutro (N)', wireColor: 'Cobre macizo', functionDesc: 'Alimentan el polo de neutro de cada térmica.' },
    ],
    verifiedSymbolDesc: 'Barra conductora con derivaciones paralelas múltiples.',
    realWorldLocation: 'Adentro del tablero eléctrico uniendo las entradas superiores de todas las térmicas.',
    differencesWithSimilar:
      'Reemplaza los antiguos "puentes guirnalda" de cable flexible, evitando falsos contactos y fuego en los bornes.',
    safetyWarnings: [
      'Colocar siempre las tapas aislantes terminales en los extremos del peine.',
    ],
  },

  contactor_modular: {
    type: 'contactor_modular',
    argentineName: 'Contactor / Relé de Potencia DIN',
    technicalName: 'Contactor Electromagnético Modular — Norma IEC 61095',
    beginnerExplanation:
      'Un interruptor electromagnético silencioso que permite encender artefactos de mucha potencia (motores de piletas, reflectores gigantes, sistemas de calefacción) usando una señal muy suave de un timer o fotocélula sin quemarla.',
    keyPartsToRecognize: [
      'Bornes de bobina A1 y A2.',
      'Contactos principales de potencia 1-2 y 3-4.',
      'Visor o testigo de accionamiento mecánico.',
    ],
    terminalsExplanation: [
      { name: 'Bobina A1 y A2', wireColor: 'Fase y Neutro de mando', functionDesc: 'Reciben la orden desde el timer para energizar el electroimán.' },
      { name: 'Contactos 1 y 2', wireColor: 'Fase de potencia', functionDesc: 'Soportan la corriente pesada del motor o reflectores.' },
    ],
    verifiedSymbolDesc: 'Bobina electromagnética con contactos normalmente abiertos accionados.',
    realWorldLocation: 'En tableros de bombas, iluminación de parques o climatización.',
    differencesWithSimilar:
      'No tiene protección contra sobrecargas por sí mismo; debe ir siempre acompañado de una térmica previa.',
    safetyWarnings: [
      'Desconectar la alimentación de potencia y la de mando antes de intervenir en sus bornes.',
    ],
  },

  temporizador: {
    type: 'temporizador',
    argentineName: 'Timer Horario / Reloj Programador DIN',
    technicalName: 'Interruptor Horario Programable — Norma IEC 60730',
    beginnerExplanation:
      'Aparato inteligente que prende y apaga las luces o la bomba de la piscina a la hora exacta que vos le programes, todos los días automáticamente.',
    keyPartsToRecognize: [
      'Disco horario con pestañas mecánicas de 15 minutos o pantalla digital LCD.',
      'Interruptor manual de anulación (I - AUTO - 0).',
      'Bornes de alimentación propia y bornes de contacto libre de potencial.',
    ],
    terminalsExplanation: [
      { name: 'Alimentación L y N', wireColor: 'Fase y Neutro', functionDesc: 'Mantienen el reloj en funcionamiento continuo.' },
      { name: 'Común y NA', wireColor: 'Circuito comandado', functionDesc: 'Se cierran a la hora programada.' },
    ],
    verifiedSymbolDesc: 'Reloj horario con contacto conmutador con retardo o mando programado.',
    realWorldLocation: 'En el tablero de control de luces de jardín, bombas o vidrieras.',
    differencesWithSimilar:
      'Mide tiempo, no corriente.',
    safetyWarnings: [
      'Para cargas mayores a 1000W o motores, comandar a través de un contactor intermedio.',
    ],
  },
};

interface PhysicalComponentCardProps {
  symbol: ElectricalSymbol;
  onClose: () => void;
  onOpenDetailedNormativeModal?: (type: string) => void;
}

export const PhysicalComponentCard: React.FC<PhysicalComponentCardProps> = ({
  symbol,
  onClose,
  onOpenDetailedNormativeModal,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'partes' | 'bornes' | 'seguridad'>('info');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const cardData = PHYSICAL_COMPONENTS_DATA[symbol.type] || {
    type: symbol.type,
    argentineName: symbol.name,
    technicalName: `${symbol.name} — Norma AEA 90364`,
    beginnerExplanation:
      'Componente eléctrico de la instalación con bornes de conexión estandarizados para distribución y utilización segura de energía.',
    keyPartsToRecognize: ['Bornes con tornillos de fijación', 'Carcasa exterior aislada', 'Terminales rotulados'],
    terminalsExplanation: symbol.terminals.map((t) => ({
      name: t.name,
      wireColor: t.type === 'fase' ? 'Marrón' : t.type === 'neutro' ? 'Celeste' : 'Verde/Amarillo',
      functionDesc: `Borne de tipo ${t.type.toUpperCase()} para conexión de red.`,
    })),
    verifiedSymbolDesc: 'Símbolo normalizado según catálogo IRAM / AEA.',
    realWorldLocation: 'Instalación eléctrica residencial.',
    differencesWithSimilar: 'Consulte la ficha técnica para más detalles.',
    safetyWarnings: ['Trabajar siempre con la tensión cortada en el tablero principal.'],
  };

  const labelInfo = getComponentLabelInfo(symbol);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-slate-900 border border-amber-500/50 rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-fade-in text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-bold text-amber-300 uppercase">{labelInfo.bannerTitle}</span>
          <span className="text-slate-400">({cardData.argentineName.split('/')[0].trim()})</span>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition-colors"
          title="Expandir Ficha"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm bg-slate-900/98 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-slate-100 animate-in slide-in-from-bottom-3 duration-200">
      {/* Barra de Título Superior con Identificador Técnico y Nombre Habitual Argentino */}
      <div className="px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-slate-950 rounded">
                {labelInfo.bannerTitle}
              </span>
              <span className="text-[10px] text-cyan-400 font-mono truncate">
                {labelInfo.circuitInfo}
              </span>
            </div>
            <h3 className="text-xs font-bold text-white truncate leading-tight">
              {cardData.argentineName}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Minimizar ficha"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
            title="Cerrar ficha"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Previsualización Visual Fotorrealista y Símbolo Normalizado lado a lado */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
        {/* Renderizado físico del componente */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Aspecto Físico Real
          </span>
          <svg className="w-20 h-20" viewBox="-30 -30 60 60">
            <RealisticCADSymbolSVG symbol={symbol} viewMode="realista" isSelected={false} isOn={true} />
          </svg>
        </div>

        {/* Renderizado del símbolo esquemático normalizado */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
            Símbolo IRAM
          </span>
          <svg className="w-20 h-20" viewBox="-30 -30 60 60">
            <RealisticCADSymbolSVG symbol={symbol} viewMode="esquematica" isSelected={false} isOn={true} />
          </svg>
        </div>
      </div>

      {/* Selector de Pestañas de la Ficha */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950 text-[11px] font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
            activeTab === 'info'
              ? 'border-amber-400 text-amber-300 font-bold bg-slate-900/60'
              : 'border-transparent hover:text-white'
          }`}
        >
          Función
        </button>
        <button
          onClick={() => setActiveTab('partes')}
          className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
            activeTab === 'partes'
              ? 'border-amber-400 text-amber-300 font-bold bg-slate-900/60'
              : 'border-transparent hover:text-white'
          }`}
        >
          Partes
        </button>
        <button
          onClick={() => setActiveTab('bornes')}
          className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
            activeTab === 'bornes'
              ? 'border-amber-400 text-amber-300 font-bold bg-slate-900/60'
              : 'border-transparent hover:text-white'
          }`}
        >
          Bornes
        </button>
        <button
          onClick={() => setActiveTab('seguridad')}
          className={`flex-1 py-1.5 text-center transition-colors border-b-2 ${
            activeTab === 'seguridad'
              ? 'border-amber-400 text-amber-300 font-bold bg-slate-900/60'
              : 'border-transparent hover:text-white'
          }`}
        >
          Seguridad
        </button>
      </div>

      {/* Contenido Desplazable de la Pestaña Activa */}
      <div className="p-3 max-h-56 overflow-y-auto text-xs space-y-2.5 scrollbar-thin scrollbar-thumb-slate-700">
        {activeTab === 'info' && (
          <div className="space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Nombre Técnico Normalizado:
              </span>
              <p className="text-slate-200 font-mono text-[11px] leading-tight mt-0.5">
                {cardData.technicalName}
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-200">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide block mb-1">
                ¿Para qué sirve? (Para Principiantes)
              </span>
              <p className="text-[11px] leading-relaxed text-slate-200">
                {cardData.beginnerExplanation}
              </p>
            </div>

            <div className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-300 block text-[10px] uppercase">
                  ¿Dónde se ubica en la casa real?
                </span>
                <span className="text-slate-300">{cardData.realWorldLocation}</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-800/40 text-[11px]">
              <span className="font-semibold text-purple-300 block text-[10px] uppercase mb-0.5">
                ¿Cómo no confundirlo con otros?
              </span>
              <span className="text-slate-300">{cardData.differencesWithSimilar}</span>
            </div>
          </div>
        )}

        {activeTab === 'partes' && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Partes físicas que debés reconocer a simple vista:
            </span>
            {cardData.keyPartsToRecognize.map((part, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-200 leading-snug">{part}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'bornes' && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Bornes y sentido de cableado:
            </span>
            {cardData.terminalsExplanation.map((term, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] font-bold text-white mb-0.5">
                  <span className="text-amber-300">{term.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                    {term.wireColor}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">{term.functionDesc}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'seguridad' && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-red-400 font-bold text-[11px] uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Reglas de Seguridad Vitales</span>
            </div>
            {cardData.safetyWarnings.map((warn, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-red-950/30 border border-red-800/40 text-[11px] text-red-200 leading-snug flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pie de Ficha con Botón a Enciclopedia Completa */}
      {onOpenDetailedNormativeModal && (
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            Normativa: <strong className="text-slate-300">{labelInfo.normativeCode}</strong>
          </span>
          <button
            onClick={() => onOpenDetailedNormativeModal(symbol.type)}
            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
          >
            <BookOpen className="w-3 h-3 text-amber-400" />
            <span>Ver Ficha Completa</span>
          </button>
        </div>
      )}
    </div>
  );
};
