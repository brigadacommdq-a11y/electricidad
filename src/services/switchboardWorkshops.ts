/**
 * ELECTRA PLAN — 15 Talleres Prácticos Guiados de Tableros Eléctricos Realistas
 * Ejercicios progresivos conforme a la Reglamentación AEA 90364 y normas IRAM / IEC.
 */
import {
  SwitchboardWorkshopLevel,
  RealisticSwitchboardState,
} from '../types/switchboardWorkshop';
import { createRealisticDINDevice } from './switchboardCatalog';

export const SWITCHBOARD_WORKSHOP_LEVELS: SwitchboardWorkshopLevel[] = [
  // 1. Reconocimiento de componentes
  {
    id: 1,
    title: '1. Reconocimiento de Componentes del Tablero',
    subtitle: 'Identificación de IGA, ID, PIAs, Riel DIN y Barras de Distribución',
    difficulty: 'Principiante',
    estimatedMinutes: 5,
    normativeRef: 'AEA 90364-771.17 - Dispositivos de Maniobra y Protección',
    description:
      'En este primer taller aprenderás a identificar los componentes esenciales de un gabinete de distribución en riel DIN de 35 mm y su función en la seguridad eléctrica.',
    objectives: [
      'Identificar el Interruptor General Automático (IGA) de cabecera.',
      'Reconocer el Interruptor Diferencial (ID) con su botón de prueba TEST.',
      'Identificar los Pequeños Interruptores Automáticos (PIAs) termomagnéticos.',
      'Localizar las barras colectoras de Neutro y Puesta a Tierra (PE).',
    ],
    requiredComponents: [
      { type: 'iga', label: 'IGA 32A', specs: '2P Curva C 6kA', quantity: 1 },
      { type: 'diferencial', label: 'ID 40A', specs: '2P 30mA Clase AC', quantity: 1 },
      { type: 'termomagnetico', label: 'PIA 16A', specs: '2P Curva C', quantity: 1 },
      { type: 'barra_tierra', label: 'Barra PE', specs: 'Latón verde-amarillo', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Observa el riel DIN superior donde se montan los dispositivos modulares.',
      'Coloca en el riel un IGA de 32A como interruptor de corte general.',
      'Agrega a su derecha un Interruptor Diferencial de 40A 30mA.',
      'Agrega un PIA de 16A para proteger el circuito derivado.',
      'Incorpora en el tablero la barra de puesta a tierra (PE).',
    ],
    hints: [
      'El IGA siempre debe estar posicionado al inicio del riel como dispositivo de cabecera.',
      'El Interruptor Diferencial se distingue por su botón amarillo/azul TEST [T].',
      'La barra de PE no se conecta a las fases; se destina exclusivamente al cable verde-amarillo.',
    ],
    initialState: {
      devices: [],
      wires: [],
      mainsEnergized: false,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const hasIga = state.devices.some((d) => d.type === 'iga');
      const hasId = state.devices.some((d) => d.type === 'diferencial');
      const hasPia = state.devices.some((d) => d.type === 'termomagnetico');
      const hasPe = state.devices.some((d) => d.type === 'barra_tierra');

      if (hasIga && hasId && hasPia && hasPe) {
        return {
          passed: true,
          feedback: '¡Excelente! Has colocado los 4 elementos fundamentales de un tablero seccional.',
          technicalNotes:
            'Cada componente cumple un rol: IGA (protección de la línea seccional), ID (salvaguarda de vidas contra electrocución), PIA (protección contra sobrecargas y cortocircuitos) y Barra PE (equipotencialidad).',
        };
      }
      return {
        passed: false,
        feedback: 'Aún faltan componentes requeridos en el tablero.',
        technicalNotes: 'Verifica tener montados: 1 IGA, 1 Diferencial, 1 PIA y 1 Barra PE.',
      };
    },
  },

  // 2. Montaje del Interruptor General (IGA)
  {
    id: 2,
    title: '2. Montaje y Conexión de Acometida al IGA',
    subtitle: 'Conexión de la alimentación de red (Fase y Neutro)',
    difficulty: 'Principiante',
    estimatedMinutes: 6,
    normativeRef: 'AEA 90364-771.18.2 - Interruptor de Cabecera',
    description:
      'Aprende a conectar la entrada de red desde la línea principal a los bornes superiores del Interruptor General Automático (IGA).',
    objectives: [
      'Montar el IGA 32A en el extremo izquierdo del riel DIN.',
      'Reconocer los bornes de entrada: 1 (Fase) y N (Neutro).',
      'Verificar que el interruptor corte ambos polos simultáneamente.',
    ],
    requiredComponents: [
      { type: 'iga', label: 'IGA 32A', specs: '2P Curva C', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Asegúrate de tener colocado el IGA 2P 32A en el Riel 1.',
      'Observa los bornes superiores: borne 1 (L Entrada) y borne N (N Entrada).',
      'Presiona el botón "Energizar Red" para simular la llegada de potencial desde la acometida.',
      'Comprueba que al subir la palanca a ON los bornes inferiores 2 y N_out reciban tensión.',
    ],
    hints: [
      'Los bornes superiores (impares/N) son tradicionalmente los bornes de entrada de alimentación.',
      'En Argentina el neutro es de color celeste exclusivo y la fase marrón, negro o rojo.',
    ],
    initialState: {
      devices: [createRealisticDINDevice('iga', 1, 0, undefined, 32)],
      wires: [],
      mainsEnergized: false,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const iga = state.devices.find((d) => d.type === 'iga');
      if (iga && state.mainsEnergized && iga.state === 'closed') {
        return {
          passed: true,
          feedback: '¡Perfecto! El IGA está energizado y conduciendo potencial a sus bornes de salida.',
          technicalNotes:
            'Según la norma AEA 90364, el corte general debe interrumpir todos los conductores activos (Fase y Neutro) de forma omnipolar.',
        };
      }
      return {
        passed: false,
        feedback: 'Debes energizar la red y cerrar la palanca del IGA (posición ON / CONECTADO).',
        technicalNotes: 'Presiona "Energizar Red" y activa la palanca del interruptor IGA.',
      };
    },
  },

  // 3. Instalación de una Térmica (PIA)
  {
    id: 3,
    title: '3. Instalación Didáctica de un PIA Bipolar',
    subtitle: 'Calibración de corriente nominal y curva de disparo C',
    difficulty: 'Principiante',
    estimatedMinutes: 6,
    normativeRef: 'IRAM-NM-IEC 60898 - Interruptores para instalaciones domésticas',
    description:
      'Comprende el funcionamiento del disparador bimetálico (sobrecarga) y electromagnético (cortocircuito) en un PIA bipolar de 16A.',
    objectives: [
      'Instalar un PIA bipolar en el riel DIN.',
      'Comprender la relación entre la corriente de diseño (Ib), la nominal (In) y la admisible (Iz).',
      'Operar la palanca manual y verificar su estado ON/OFF.',
    ],
    requiredComponents: [
      { type: 'termomagnetico', label: 'PIA 16A', specs: '2P Curva C', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Coloca un interruptor termomagnético de 16A en el riel.',
      'Identifica sus bornes de entrada superiores (1_in y N_in) y de salida (2_out y N_out).',
      'Verifica que el rótulo indique Curva C y poder de corte de al menos 3kA o 4.5kA.',
    ],
    hints: [
      'La Curva C dispara magnéticamente entre 5 y 10 veces la corriente nominal In (ideal para cargas residenciales).',
    ],
    initialState: {
      devices: [createRealisticDINDevice('termomagnetico', 1, 0, 'C1', 16)],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const pia = state.devices.find((d) => d.type === 'termomagnetico');
      if (pia) {
        return {
          passed: true,
          feedback: '¡Correcto! El PIA está montado y listo para recibir conductores.',
          technicalNotes:
            'El calibre de 16A es el máximo admisible para tomacorrientes de uso general (TUG) con conductor de 2.5 mm² según AEA 771.',
        };
      }
      return {
        passed: false,
        feedback: 'Coloca un PIA bipolar en el riel DIN.',
        technicalNotes: 'Selecciona "PIA Bipolar 16A" en la biblioteca y añádelo al riel.',
      };
    },
  },

  // 4. Incorporación del Interruptor Diferencial (ID)
  {
    id: 4,
    title: '4. Incorporación del Interruptor Diferencial (ID)',
    subtitle: 'Protección diferencial contra corrientes de fuga de 30 mA y botón TEST',
    difficulty: 'Intermedio',
    estimatedMinutes: 8,
    normativeRef: 'IRAM-NM-IEC 61008 / AEA 90364-771.19',
    description:
      'El disyuntor diferencial mide la suma vectorial de corrientes en Fase y Neutro. Si la fuga a tierra supera los 30 mA, desconecta el circuito en menos de 30 milisegundos para evitar la fibrilación ventricular.',
    objectives: [
      'Colocar el ID 2P 40A 30mA aguas abajo del IGA.',
      'Conectar la salida del IGA (bornes 2 y N_out) a la entrada del ID (bornes 1 y N_in).',
      'Probar el botón reglamentario TEST para verificar el disparo mecánico.',
    ],
    requiredComponents: [
      { type: 'iga', label: 'IGA 32A', specs: '2P', quantity: 1 },
      { type: 'diferencial', label: 'ID 40A 30mA', specs: '2P', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Conecta un cable de Fase (marrón) desde el borne 2_out del IGA al borne 1_in del ID.',
      'Conecta un cable de Neutro (celeste) desde el borne N_out del IGA al borne N_in del ID.',
      'Energiza la red y pulsa el botón TEST del diferencial para comprobar su disparo.',
    ],
    hints: [
      'Toca primero el borne de salida del IGA y luego el borne de entrada del ID para tender el cable.',
      'El botón TEST simula internamente una fuga con resistencia de prueba.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('diferencial', 1, 1, undefined, 40),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const iga = state.devices.find((d) => d.type === 'iga');
      const id = state.devices.find((d) => d.type === 'diferencial');
      if (!iga || !id) return { passed: false, feedback: 'Faltan dispositivos en el tablero.', technicalNotes: '' };

      const hasPhaseWire = state.wires.some(
        (w) =>
          ((w.fromDeviceId === iga.id && w.fromTerminalId === '2_out' && w.toDeviceId === id.id && w.toTerminalId === '1_in') ||
            (w.fromDeviceId === id.id && w.fromTerminalId === '1_in' && w.toDeviceId === iga.id && w.toTerminalId === '2_out')) &&
          w.conductorType === 'fase'
      );

      const hasNeutralWire = state.wires.some(
        (w) =>
          ((w.fromDeviceId === iga.id && w.fromTerminalId === 'N_out' && w.toDeviceId === id.id && w.toTerminalId === 'N_in') ||
            (w.fromDeviceId === id.id && w.fromTerminalId === 'N_in' && w.toDeviceId === iga.id && w.toTerminalId === 'N_out')) &&
          w.conductorType === 'neutro'
      );

      if (hasPhaseWire && hasNeutralWire) {
        return {
          passed: true,
          feedback: '¡Excelente conexión! La alimentación fluye desde el IGA hacia el ID correctamente.',
          technicalNotes:
            'El disyuntor diferencial de 40A queda protegido contra sobrecargas por el IGA de 32A aguas arriba (In_ID >= In_IGA).',
        };
      }

      return {
        passed: false,
        feedback: 'Verifica los cables entre el IGA (bornes inferiores) y el ID (bornes superiores).',
        technicalNotes: 'Conecta Fase (marrón) entre IGA:2_out e ID:1_in, y Neutro (celeste) entre IGA:N_out e ID:N_in.',
      };
    },
  },

  // 5. Distribución de Fase y Neutro
  {
    id: 5,
    title: '5. Distribución de Fase y Neutro a los PIAs',
    subtitle: 'Uso de peines de conexión o puentes de repartición',
    difficulty: 'Intermedio',
    estimatedMinutes: 8,
    normativeRef: 'AEA 90364-771.18.3 - Conexión de Circuitos Derivados',
    description:
      'Desde la salida inferior del interruptor diferencial se debe distribuir la Fase y el Neutro a las entradas superiores de los interruptores termomagnéticos (PIAs).',
    objectives: [
      'Alimentar las entradas superiores de dos PIAs desde la salida del Diferencial.',
      'Mantener la polaridad estricta (Fase a la izquierda, Neutro a la derecha).',
      'Asegurar sección mínima de puente de 4.0 mm² o 6.0 mm².',
    ],
    requiredComponents: [
      { type: 'iga', label: 'IGA 32A', specs: '2P', quantity: 1 },
      { type: 'diferencial', label: 'ID 40A', specs: '2P', quantity: 1 },
      { type: 'termomagnetico', label: 'PIA C1 (10A)', specs: '2P', quantity: 1 },
      { type: 'termomagnetico', label: 'PIA C2 (16A)', specs: '2P', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Conecta la salida de Fase del ID (borne 2_out) a la entrada de Fase del PIA C1 (borne 1_in).',
      'Pasa un puente de Fase entre el PIA C1 (1_in) y el PIA C2 (1_in).',
      'Conecta la salida de Neutro del ID (borne N_out) a la entrada de Neutro del PIA C1 (borne N_in).',
      'Pasa un puente de Neutro entre el PIA C1 (N_in) y el PIA C2 (N_in).',
    ],
    hints: [
      'En instalaciones profesionales se utilizan peines bipolares aislados para evitar sobrecalentamiento por doble cable en un mismo borne.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('diferencial', 1, 1, undefined, 40),
        createRealisticDINDevice('termomagnetico', 1, 2, 'C1', 10),
        createRealisticDINDevice('termomagnetico', 1, 3, 'C2', 16),
      ],
      wires: [
        {
          id: 'w_init_1',
          fromDeviceId: 'dev_iga_0',
          fromTerminalId: '2_out',
          toDeviceId: 'dev_diff_0',
          toTerminalId: '1_in',
          conductorType: 'fase',
          crossSectionMm2: 6,
          color: '#854d0e',
          routing: 'canaleta',
        },
        {
          id: 'w_init_2',
          fromDeviceId: 'dev_iga_0',
          fromTerminalId: 'N_out',
          toDeviceId: 'dev_diff_0',
          toTerminalId: 'N_in',
          conductorType: 'neutro',
          crossSectionMm2: 6,
          color: '#0284c7',
          routing: 'canaleta',
        },
      ],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const pias = state.devices.filter((d) => d.type === 'termomagnetico');
      if (pias.length < 2) return { passed: false, feedback: 'Debes tener montados ambos PIAs.', technicalNotes: '' };

      const diff = state.devices.find((d) => d.type === 'diferencial');
      if (!diff) return { passed: false, feedback: 'Falta el diferencial.', technicalNotes: '' };

      // Comprobar que ambos PIAs reciben Fase y Neutro
      const pia1 = pias[0];
      const pia2 = pias[1];

      const p1HasFase = state.wires.some(
        (w) => (w.fromTerminalId === '1_in' && (w.fromDeviceId === pia1.id || w.toDeviceId === pia1.id))
      );
      const p2HasFase = state.wires.some(
        (w) => (w.fromTerminalId === '1_in' && (w.fromDeviceId === pia2.id || w.toDeviceId === pia2.id))
      );

      if (p1HasFase && p2HasFase) {
        return {
          passed: true,
          feedback: '¡Distribución completa! Ambos PIAs están alimentados desde el diferencial.',
          technicalNotes:
            'Cada interruptor derivado ahora puede cortar de manera independiente su circuito sin dejar sin energía a los demás.',
        };
      }

      return {
        passed: false,
        feedback: 'Uno o ambos PIAs no están recibiendo la distribución de Fase y Neutro.',
        technicalNotes: 'Revisa las conexiones a los bornes superiores 1_in y N_in de los PIAs.',
      };
    },
  },

  // 6. Conductor de Protección (PE)
  {
    id: 6,
    title: '6. Incorporación del Conductor de Protección (PE)',
    subtitle: 'Conexión a la Barra Principal de Tierra y equipotencialidad',
    difficulty: 'Principiante',
    estimatedMinutes: 5,
    normativeRef: 'AEA 90364-771.18.5 - Puesta a Tierra en Tableros',
    description:
      'El conductor de protección PE (verde-amarillo) jamás debe ser interrumpido por ningún fusible ni interruptor termomagnético. Debe llegar directo a la barra de tierra del tablero.',
    objectives: [
      'Montar la Barra de Tierra (PE) en el tablero.',
      'Conectar el borne de descarga del protector de sobretensiones (DPS) a la barra de tierra.',
      'Verificar que ningún cable de tierra pase por el interruptor diferencial.',
    ],
    requiredComponents: [
      { type: 'dps', label: 'DPS 20kA', specs: 'Protector transitorio', quantity: 1 },
      { type: 'barra_tierra', label: 'Barra PE', specs: 'Bornera verde-amarilla', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Coloca en el tablero la Barra Colectora de Tierra PE.',
      'Conecta un cable verde-amarillo desde el borne PE_out del protector de sobretensiones (DPS) a un borne de la barra PE.',
    ],
    hints: [
      'La barra de PE garantiza que cualquier corriente de falla se derive hacia la jabalina sin electrificar las carcasas.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('dps', 1, 0),
        createRealisticDINDevice('barra_tierra', 2, 0),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const dps = state.devices.find((d) => d.type === 'dps');
      const pe = state.devices.find((d) => d.type === 'barra_tierra');
      if (!dps || !pe) return { passed: false, feedback: 'Falta el DPS o la Barra de Tierra.', technicalNotes: '' };

      const hasGroundWire = state.wires.some(
        (w) =>
          ((w.fromDeviceId === dps.id && w.fromTerminalId === 'PE_out' && w.toDeviceId === pe.id) ||
            (w.toDeviceId === dps.id && w.toTerminalId === 'PE_out' && w.fromDeviceId === pe.id)) &&
          w.conductorType === 'tierra'
      );

      if (hasGroundWire) {
        return {
          passed: true,
          feedback: '¡Protección de tierra conectada correctamente!',
          technicalNotes:
            'El DPS puede derivar picos de tensión transitorios producidos por rayos directo a tierra protegiendo los artefactos electrónicos.',
        };
      }

      return {
        passed: false,
        feedback: 'Conecta el borne PE_out del DPS hacia la Barra de Tierra con cable verde-amarillo.',
        technicalNotes: 'Usa conductor de tipo "tierra" para esta vinculación de seguridad.',
      };
    },
  },

  // 7. Circuito de Iluminación (IUG)
  {
    id: 7,
    title: '7. Alimentación de un Circuito de Iluminación (IUG)',
    subtitle: 'Salida de PIA 10A, calibre 1.5 mm² y retorno de neutro',
    difficulty: 'Intermedio',
    estimatedMinutes: 7,
    normativeRef: 'AEA 90364-771.11 - Circuito de Iluminación de Uso General',
    description:
      'Aprende a cablear la salida del PIA de iluminación hacia los bornes de salida del tablero destinados al circuito IUG.',
    objectives: [
      'Asignar PIA de 10A para el circuito C1 (IUG).',
      'Conectar conductores de salida de 1.5 mm².',
      'Verificar encendido y corriente simulada en luminarias.',
    ],
    requiredComponents: [
      { type: 'termomagnetico', label: 'PIA 10A (C1)', specs: '2P Curva C', quantity: 1 },
      { type: 'barra_neutro', label: 'Barra N', specs: 'Aislada', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Alimenta el PIA C1 desde el diferencial.',
      'Verifica que la salida inferior (2_out) quede energizada al conectar la palanca.',
      'Asocia el PIA al circuito C1 de iluminación.',
    ],
    hints: [
      'El calibre máximo de PIA para IUG con cable de 1.5 mm² es de 10A (o 16A si el cableado es de 2.5 mm²).',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('termomagnetico', 1, 0, 'C1', 10),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const pia = state.devices.find((d) => d.type === 'termomagnetico' && d.circuitId === 'C1');
      if (pia && pia.state === 'closed') {
        return {
          passed: true,
          feedback: '¡Circuito C1 (IUG) habilitado y en servicio!',
          technicalNotes: 'Permite hasta 15 bocas de iluminación según la reglamentación argentina.',
        };
      }
      return {
        passed: false,
        feedback: 'Asegúrate de que el PIA esté configurado para el circuito C1 y con su palanca en ON.',
        technicalNotes: 'Revisa el circuito asignado y el estado del interruptor.',
      };
    },
  },

  // 8. Circuito de Tomacorrientes (TUG)
  {
    id: 8,
    title: '8. Alimentación de Circuito de Tomacorrientes (TUG)',
    subtitle: 'PIA 16A, cable 2.5 mm² y conductor de protección PE obligatorio',
    difficulty: 'Intermedio',
    estimatedMinutes: 7,
    normativeRef: 'AEA 90364-771.12 - Circuito de Tomacorrientes de Uso General',
    description:
      'El circuito TUG alimenta tomas de 10A IRAM 2071. Requiere protección termomagnética de 16A y conductor de protección PE ininterrumpido en todas las cajas.',
    objectives: [
      'Instalar PIA de 16A para C2 (TUG).',
      'Garantizar sección mínima de 2.5 mm² en conductores activos y de protección.',
    ],
    requiredComponents: [
      { type: 'termomagnetico', label: 'PIA 16A (C2)', specs: '2P Curva C', quantity: 1 },
      { type: 'barra_tierra', label: 'Barra PE', specs: 'Tierra', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Monta el PIA de 16A para el circuito C2.',
      'Verifica que la barra de PE esté presente para alimentar la tierra de los tomacorrientes.',
    ],
    hints: [
      'En tomacorrientes, la falta del conductor de protección PE anula la efectividad del disyuntor ante fallas en electrodomésticos con chasis metálico.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('termomagnetico', 1, 0, 'C2', 16),
        createRealisticDINDevice('barra_tierra', 2, 0),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const pia = state.devices.find((d) => d.type === 'termomagnetico' && d.circuitId === 'C2');
      const pe = state.devices.find((d) => d.type === 'barra_tierra');
      if (pia && pe) {
        return {
          passed: true,
          feedback: '¡Circuito TUG configurado con barra de protección conectada!',
          technicalNotes: 'Sección mínima reglamentaria: 2.5 mm² en Fase, Neutro y Conductor PE.',
        };
      }
      return {
        passed: false,
        feedback: 'Verifica la presencia del PIA C2 de 16A y la barra de tierra PE.',
        technicalNotes: 'Monta el PIA 16A y la barra colectora de tierra.',
      };
    },
  },

  // 9. Distribución de Varios Circuitos Independientes
  {
    id: 9,
    title: '9. Distribución de Varios Circuitos Independientes',
    subtitle: 'Separación de IUG, TUG y Cargas Especiales (TUE / Climatización)',
    difficulty: 'Intermedio',
    estimatedMinutes: 10,
    normativeRef: 'AEA 90364-771.8 - Número Mínimo de Circuitos',
    description:
      'Una vivienda debe poseer circuitos separados para evitar que una falla en una lámpara o electrodoméstico deje a oscuras toda la propiedad.',
    objectives: [
      'Armar un tablero con al menos 3 circuitos derivados: C1 (IUG 10A), C2 (TUG 16A) y C3 (TUE 20A).',
      'Distribuir alimentación común desde el diferencial a los 3 PIAs.',
    ],
    requiredComponents: [
      { type: 'iga', label: 'IGA 32A', specs: 'Cabecera', quantity: 1 },
      { type: 'diferencial', label: 'ID 40A', specs: '30mA', quantity: 1 },
      { type: 'termomagnetico', label: 'PIA 10A (C1)', specs: 'IUG', quantity: 1 },
      { type: 'termomagnetico', label: 'PIA 16A (C2)', specs: 'TUG', quantity: 1 },
      { type: 'termomagnetico', label: 'PIA 20A (C3)', specs: 'TUE', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Monta en fila: IGA 32A -> ID 40A -> PIA 10A -> PIA 16A -> PIA 20A.',
      'Alimenta las entradas de los 3 PIAs desde la salida del ID.',
      'Activa la red y comprueba que los 3 circuitos derivados tengan tensión independiente.',
    ],
    hints: [
      'El circuito TUE de 20A se utiliza para hornos eléctricos, anafes o aires acondicionados de más de 2500 frigorías.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('diferencial', 1, 1, undefined, 40),
        createRealisticDINDevice('termomagnetico', 1, 2, 'C1', 10),
        createRealisticDINDevice('termomagnetico', 1, 3, 'C2', 16),
        createRealisticDINDevice('termomagnetico', 1, 4, 'C3', 20),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const pias = state.devices.filter((d) => d.type === 'termomagnetico');
      if (pias.length >= 3) {
        return {
          passed: true,
          feedback: '¡Excelente distribución multilínea! Los 3 circuitos están independizados.',
          technicalNotes:
            'Cumple con el grado de electrificación media (mínimo 3 circuitos para viviendas de hasta 130 m²).',
        };
      }
      return {
        passed: false,
        feedback: 'Se requieren al menos 3 interruptores termomagnéticos derivados (IUG, TUG, TUE).',
        technicalNotes: 'Agrega un tercer PIA de 20A al riel.',
      };
    },
  },

  // 10. Tablero Completo de Vivienda
  {
    id: 10,
    title: '10. Armado de Tablero Completo para Vivienda Típica',
    subtitle: 'Gabinete con riel, IGA, ID, 3 PIAs, DPS y Barras de Neutro y Tierra',
    difficulty: 'Avanzado',
    estimatedMinutes: 12,
    normativeRef: 'AEA 90364-771 - Esquema Integral de Tablero Seccional General',
    description:
      'Integra la totalidad de los dispositivos de un tablero moderno completo, seguro y reglamentario.',
    objectives: [
      'Armar la configuración completa: IGA + DPS + ID + 3 PIAs + Barras PE y N.',
      'Conectar el cableado respetando las canaletas ranuradas.',
      'Garantizar que todo el tablero quede operativo y sin errores de polaridad.',
    ],
    requiredComponents: [
      { type: 'iga', label: 'IGA 32A', specs: '2P', quantity: 1 },
      { type: 'dps', label: 'DPS 20kA', specs: '2P', quantity: 1 },
      { type: 'diferencial', label: 'ID 40A', specs: '2P 30mA', quantity: 1 },
      { type: 'termomagnetico', label: 'PIAs C1, C2, C3', specs: '2P', quantity: 3 },
      { type: 'barra_tierra', label: 'Barra PE', specs: 'PE', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Monta los dispositivos en el riel superior e intermedio.',
      'Realiza las conexiones de acometida, derivación al DPS, paso por el ID y distribución a PIAs.',
      'Energiza la red y ejecuta la prueba del disyuntor.',
    ],
    hints: [
      'El protector contra sobretensiones (DPS) debe conectarse aguas arriba del diferencial para que las descargas a tierra no disparen el ID por error.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('dps', 1, 1),
        createRealisticDINDevice('diferencial', 1, 2, undefined, 40),
        createRealisticDINDevice('termomagnetico', 1, 3, 'C1', 10),
        createRealisticDINDevice('termomagnetico', 1, 4, 'C2', 16),
        createRealisticDINDevice('termomagnetico', 1, 5, 'C3', 20),
        createRealisticDINDevice('barra_tierra', 2, 0),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const hasIga = state.devices.some((d) => d.type === 'iga');
      const hasDps = state.devices.some((d) => d.type === 'dps');
      const hasId = state.devices.some((d) => d.type === 'diferencial');
      const piasCount = state.devices.filter((d) => d.type === 'termomagnetico').length;
      const hasPe = state.devices.some((d) => d.type === 'barra_tierra');

      if (hasIga && hasDps && hasId && piasCount >= 3 && hasPe) {
        return {
          passed: true,
          feedback: '¡Felicitaciones! Has armado un tablero seccional completo con protección integral.',
          technicalNotes:
            'Dispone de protección contra sobrecargas (termomagnético), cortocircuitos (magnético), contactos a personas (diferencial) y descargas atmosféricas (DPS).',
        };
      }
      return {
        passed: false,
        feedback: 'El tablero aún no cuenta con todos los dispositivos reglamentarios.',
        technicalNotes: 'Verifica la presencia de: IGA, DPS, ID, al menos 3 PIAs y la barra PE.',
      };
    },
  },

  // 11. Medición Eléctrica en Riel DIN
  {
    id: 11,
    title: '11. Incorporación de Medición Eléctrica Digital',
    subtitle: 'Instalación de voltímetro, amperímetro y watímetro multifunción en riel',
    difficulty: 'Intermedio',
    estimatedMinutes: 8,
    normativeRef: 'Medición y Gestión Energética Eficiente',
    description:
      'Instala un medidor digital modular para monitorear en tiempo real la tensión de red, corriente total consumida y factor de potencia de la vivienda.',
    objectives: [
      'Montar el medidor digital entre el IGA y el ID.',
      'Observar la variación de corriente según los circuitos conectados.',
    ],
    requiredComponents: [
      { type: 'medidor_digital', label: 'Medidor LCD', specs: 'Multifunción 63A', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Coloca el medidor digital modular en el riel.',
      'Alimenta sus bornes de entrada con Fase y Neutro.',
      'Verifica que el display LCD muestre la lectura de tensión (220 V) y corriente activa.',
    ],
    hints: [
      'Los medidores modernos de riel DIN permiten detectar baja tensión (caídas por debajo de 200V) que dañan motores de heladeras y lavarropas.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('medidor_digital', 1, 1),
        createRealisticDINDevice('diferencial', 1, 2, undefined, 40),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const hasMeter = state.devices.some((d) => d.type === 'medidor_digital');
      if (hasMeter && state.mainsEnergized) {
        return {
          passed: true,
          feedback: '¡Medidor digital instalado y registrando parámetros en vivo!',
          technicalNotes:
            'Proporciona lecturas en tiempo real de V, A, kW y cos φ para optimizar el consumo energético y prevenir desbalances.',
        };
      }
      return {
        passed: false,
        feedback: 'Monta el medidor digital en el riel y energiza la red.',
        technicalNotes: 'Selecciona "Medidor Digital Multifunción" en el catálogo.',
      };
    },
  },

  // 12. Diagnóstico de Fallas Configuradas
  {
    id: 12,
    title: '12. Diagnóstico de Fallas Preconfiguradas',
    subtitle: 'Localización de térmicas mal calibradas y puentes cruzados',
    difficulty: 'Avanzado',
    estimatedMinutes: 10,
    normativeRef: 'AEA 90364-771 - Coordinación de Protecciones',
    description:
      'En este tablero existe un error grave de calibración: un circuito de iluminación (cable 1.5 mm²) está protegido con una térmica de 32A. Localiza el error y reemplázala por la protección adecuada.',
    objectives: [
      'Inspeccionar el tablero e identificar la térmica sobrecalibrada.',
      'Sustituirla por un PIA de 10A para evitar riesgo de incendio en conductores.',
    ],
    requiredComponents: [
      { type: 'termomagnetico', label: 'PIA 10A', specs: 'Para IUG', quantity: 1 },
    ],
    stepByStepInstructions: [
      'Revisa la corriente nominal de las térmicas montadas.',
      'Observa que el PIA del circuito C1 (Iluminación) tiene 32A, superando por mucho los 15A admisibles del cable de 1.5 mm².',
      'Elimina el PIA de 32A y coloca un PIA de 10A Curva C.',
    ],
    hints: [
      'La regla fundamental de protección de conductores es: Ib <= In <= Iz (la corriente de la térmica no puede superar la corriente admisible del cable).',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('diferencial', 1, 1, undefined, 40),
        createRealisticDINDevice('termomagnetico', 1, 2, 'C1', 32), // Error intencional: 32A en IUG
        createRealisticDINDevice('termomagnetico', 1, 3, 'C2', 16),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const piaC1 = state.devices.find((d) => d.type === 'termomagnetico' && d.circuitId === 'C1');
      if (piaC1 && piaC1.ratingAmps <= 16) {
        return {
          passed: true,
          feedback: '¡Excelente diagnóstico! Has corregido la protección para adaptarla a la sección del conductor.',
          technicalNotes:
            'Un cable de 1.5 mm² soporta 15A (en cañería a 40°C). Protegerlo con 32A provocaría que el cable se incendie antes de que la térmica dispare.',
        };
      }
      return {
        passed: false,
        feedback: 'El PIA de C1 sigue teniendo un calibre excesivo (32A). Debe ser de 10A o 16A.',
        technicalNotes: 'Reemplaza la térmica de C1 por una de menor calibre.',
      };
    },
  },

  // 13. Identificación de Conexiones Faltantes
  {
    id: 13,
    title: '13. Identificación de Conexiones Faltantes',
    subtitle: 'Comprobación de continuidad de Neutro y equipotencialidad de Tierra',
    difficulty: 'Intermedio',
    estimatedMinutes: 8,
    normativeRef: 'AEA 90364-771.18 - Continuidad Eléctrica de Circuitos',
    description:
      'En este ejercicio las cargas no encienden porque el neutro del diferencial no fue conectado hacia los PIAs. Detecta la conexión ausente y complétala.',
    objectives: [
      'Identificar qué borne carece de conductor.',
      'Tender el puente de neutro faltante para cerrar el circuito.',
    ],
    requiredComponents: [],
    stepByStepInstructions: [
      'Observa el cableado entre el diferencial y los PIAs.',
      'Nota que la Fase (marrón) está conectada, pero falta el Neutro (celeste).',
      'Tiende el cable de Neutro desde ID:N_out hacia el PIA:N_in.',
    ],
    hints: [
      'Para que circule corriente se requiere un circuito cerrado: camino de ida (Fase) y camino de retorno (Neutro).',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('diferencial', 1, 1, undefined, 40),
        createRealisticDINDevice('termomagnetico', 1, 2, 'C1', 10),
      ],
      wires: [
        {
          id: 'w_missing_phase',
          fromDeviceId: 'dev_iga_0',
          fromTerminalId: '2_out',
          toDeviceId: 'dev_diff_0',
          toTerminalId: '1_in',
          conductorType: 'fase',
          crossSectionMm2: 4,
          color: '#854d0e',
          routing: 'canaleta',
        },
      ],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const hasNeutralConnected = state.wires.some((w) => w.conductorType === 'neutro');
      if (hasNeutralConnected) {
        return {
          passed: true,
          feedback: '¡Circuito cerrado! El neutro ha sido restituido con éxito.',
          technicalNotes: 'Sin retorno de neutro no existe diferencia de potencial de 220V aplicable a las cargas.',
        };
      }
      return {
        passed: false,
        feedback: 'Aún falta conectar el conductor de Neutro (celeste) en el circuito.',
        technicalNotes: 'Conecta el borne de Neutro entre el IGA y el ID o los PIAs.',
      };
    },
  },

  // 14. Organización y Etiquetado Profesional
  {
    id: 14,
    title: '14. Organización y Etiquetado Profesional',
    subtitle: 'Rótulos identificatorios por circuito y enrutamiento por canaleta',
    difficulty: 'Principiante',
    estimatedMinutes: 6,
    normativeRef: 'AEA 90364-771.18.7 - Identificación y Marcado',
    description:
      'Todo tablero reglamentario debe contar con etiquetas claras que indiquen a qué sector de la vivienda corresponde cada interruptor para facilitar maniobras de emergencia.',
    objectives: [
      'Asignar etiquetas legibles a cada dispositivo (ej. "C1 ALUMBRADO", "C2 TOMAS", "C3 AIRE").',
      'Activar el trazado por canaletas ranuradas para un aspecto profesional ordenado.',
    ],
    requiredComponents: [],
    stepByStepInstructions: [
      'Selecciona cada PIA en el tablero.',
      'Verifica que tengan asignada su etiqueta correspondiente.',
      'Asegúrate de que la puerta del gabinete esté configurada para protección mecánica.',
    ],
    hints: [
      'El etiquetado claro evita que el usuario desconecte el circuito equivocado durante un mantenimiento.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('diferencial', 1, 1, undefined, 40),
        createRealisticDINDevice('termomagnetico', 1, 2, 'C1', 10),
        createRealisticDINDevice('termomagnetico', 1, 3, 'C2', 16),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const labeledDevices = state.devices.filter((d) => d.customTag || d.circuitId);
      if (labeledDevices.length >= 2) {
        return {
          passed: true,
          feedback: '¡Tablero correctamente identificado y rotulado!',
          technicalNotes: 'Cumple con el requisito de señalización clara exigido en las inspecciones técnicas de obra.',
        };
      }
      return {
        passed: false,
        feedback: 'Asigna etiquetas de circuito a los dispositivos.',
        technicalNotes: 'Edita los interruptores y asígnales nombre de circuito.',
      };
    },
  },

  // 15. Revisión Final Mediante Checklist Reglamentario
  {
    id: 15,
    title: '15. Revisión Final del Tablero (Checklist AEA 90364)',
    subtitle: 'Auditoría integral previa a la habilitación eléctrica',
    difficulty: 'Avanzado',
    estimatedMinutes: 12,
    normativeRef: 'AEA 90364-771 - Lista de Comprobación y Ensayos',
    description:
      'Realiza la verificación completa del tablero: presencia de IGA, diferencial 30mA, reserva de espacio en riel DIN (mínimo 20% libre), equipotencialidad de tierra y rotulación.',
    objectives: [
      'Verificar el espacio de reserva reglamentario en riel DIN (>= 20% módulos libres).',
      'Comprobar la presencia de protección contra sobrecarga, cortocircuito y choque eléctrico.',
      'Ejecutar la simulación con energía activa y verificar que no existan diagnósticos de error.',
    ],
    requiredComponents: [],
    stepByStepInstructions: [
      'Revisa que el tablero cuente con IGA, ID, PIAs y Barra PE.',
      'Verifica que el riel DIN disponga de módulos libres de reserva para ampliaciones futuras.',
      'Presiona "Energizar Red" y confirma que el informe de diagnósticos esté libre de errores.',
    ],
    hints: [
      'La reserva de espacio evita tener que romper paredes o reemplazar gabinetes cuando el usuario añade un aire acondicionado en el futuro.',
    ],
    initialState: {
      devices: [
        createRealisticDINDevice('iga', 1, 0, undefined, 32),
        createRealisticDINDevice('diferencial', 1, 1, undefined, 40),
        createRealisticDINDevice('termomagnetico', 1, 2, 'C1', 10),
        createRealisticDINDevice('termomagnetico', 1, 3, 'C2', 16),
        createRealisticDINDevice('barra_tierra', 2, 0),
      ],
      wires: [],
      mainsEnergized: true,
    },
    validateSolution: (state: RealisticSwitchboardState) => {
      const hasIga = state.devices.some((d) => d.type === 'iga');
      const hasId = state.devices.some((d) => d.type === 'diferencial');
      const hasPia = state.devices.some((d) => d.type === 'termomagnetico');
      const hasPe = state.devices.some((d) => d.type === 'barra_tierra');

      if (hasIga && hasId && hasPia && hasPe && state.mainsEnergized) {
        return {
          passed: true,
          feedback: '¡AUDITORÍA APROBADA! El tablero cumple con todos los puntos del checklist reglamentario.',
          technicalNotes:
            'Aprobado según AEA 90364-771: Corte general omnipolar presente, ID 30mA operativo, protección de conductores adecuada y equipotencialidad garantizada.',
        };
      }
      return {
        passed: false,
        feedback: 'Faltan puntos por validar en el checklist de entrega.',
        technicalNotes: 'Verifica IGA, Diferencial, PIAs, Barra PE y energización activa.',
      };
    },
  },
];
