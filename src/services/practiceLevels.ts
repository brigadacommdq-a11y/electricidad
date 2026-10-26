/**
 * ELECTRA PLAN — Aula de Prácticas
 * 10 niveles progresivos con verificación automática de topología y pistas didácticas
 */

import { PracticeLevel } from '../types/electra';
import { createSymbolFromTemplate } from './symbolCatalog';

export const PRACTICE_LEVELS: PracticeLevel[] = [
  {
    id: 1,
    title: '1. Encendido Básico de una Lámpara',
    difficulty: 'Principiante',
    objective: 'Conectar una fuente de alimentación, una térmica, un interruptor simple y una lámpara para encenderla.',
    description: 'Aprende el circuito más elemental de una instalación eléctrica: la corriente sale de la Fase, pasa por la protección (térmica), va a la tecla de comando, de allí a la lámpara por el retorno, y regresa a la fuente por el Neutro.',
    componentsNeeded: [
      'Alimentación de Red (220V AC)',
      'Interruptor Termomagnético (PIA)',
      'Interruptor Simple (Tecla)',
      'Boca de Iluminación (Lámpara)',
    ],
    instructions: [
      '1. Une el terminal "L (Fase)" de la Fuente con "L Entrada" de la Térmica.',
      '2. Une "L Salida" de la Térmica con el terminal "L" del Interruptor.',
      '3. Une el terminal "R (Retorno)" del Interruptor con el terminal "Retorno/Fase" de la Lámpara.',
      '4. Cierra el circuito conectando el terminal "N" de la Lámpara con el "N" de la Fuente (o pasando por la térmica).',
      '5. Pulsa el botón "Verificar" y luego acciona la tecla para comprobar que la lámpara enciende.',
    ],
    hints: [
      'Pista 1: Recuerda que la tecla sólo debe interrumpir el conductor de Fase (marrón), nunca el Neutro.',
      'Pista 2: La lámpara necesita un camino de ida (Fase/Retorno) y uno de vuelta (Neutro) para poder encenderse.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 100, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('termica', 240, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('interruptor_simple', 400, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 560, 200, 'floor_1', 'C1', 1),
      ],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      if (!lamp) return { passed: false, feedback: 'Falta la luminaria en el circuito.' };

      if (sim.hasShortCircuit) {
        return {
          passed: false,
          feedback: '¡Atención! Hay un cortocircuito directo entre Fase y Neutro. No conectes la Fase directamente al Neutro.',
        };
      }

      if (sim.activeLamps.has(lamp.id)) {
        return {
          passed: true,
          feedback: '¡Excelente trabajo! El circuito de iluminación básica está perfectamente conectado y la lámpara encendida.',
        };
      }

      // Check if switch is open
      const sw = project.symbols.find((s) => s.type === 'interruptor_simple');
      if (sw && sw.state?.isOpen && sim.energizedComponents.has(sw.id)) {
        return {
          passed: true,
          feedback: '¡Conexión correcta! El circuito está bien cableado. Ahora haz clic sobre la tecla para cerrarla y encender la lámpara.',
        };
      }

      return {
        passed: false,
        feedback: 'El circuito aún no está completo. Asegúrate de conectar la Fase a la Térmica, de la Térmica a la Tecla, de la Tecla a la Lámpara, y el Neutro de la Lámpara a la Fuente.',
      };
    },
  },
  {
    id: 2,
    title: '2. Incorporación de Neutro y Conductor de Protección (PAT)',
    difficulty: 'Principiante',
    objective: 'Agregar la puesta a tierra (PE) verde-amarilla y verificar la seguridad de la carcasa de la luminaria.',
    description: 'En una instalación reglamentaria (AEA 90364), toda masa metálica de luminarias y tomas debe estar conectada a tierra mediante un conductor PE verde-amarillo, el cual conduce corrientes de fuga a tierra sin peligro para las personas.',
    componentsNeeded: [
      'Alimentación de Red',
      'Jabalina de Puesta a Tierra (PAT)',
      'Interruptor Simple',
      'Luminaria con borne PE',
    ],
    instructions: [
      '1. Conecta la Fase pasando por la tecla hacia la lámpara.',
      '2. Conecta el Neutro celeste desde la fuente hacia la lámpara.',
      '3. Conecta un cable verde-amarillo desde la Jabalina PAT hacia el borne "PE" de la luminaria.',
      '4. Presiona "Verificar Circuito".',
    ],
    hints: [
      'Pista 1: El conductor de protección a tierra nunca debe pasar por interruptores ni fusibles.',
      'Pista 2: El terminal PE de la lámpara está ubicado en su parte inferior.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 100, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('interruptor_simple', 300, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 500, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('puesta_tierra', 500, 320, 'floor_1', 'C1', 1),
      ],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      const pat = project.symbols.find((s) => s.type === 'puesta_tierra');
      if (!lamp || !pat) return { passed: false, feedback: 'Faltan componentes requeridos.' };

      // Check wire to PE
      const peWire = project.wires.find(
        (w) =>
          (w.fromComponentId === pat.id && w.toComponentId === lamp.id && (w.fromTerminalId === 'PE' || w.toTerminalId === 'PE')) ||
          (w.fromComponentId === lamp.id && w.toComponentId === pat.id && (w.fromTerminalId === 'PE' || w.toTerminalId === 'PE'))
      );

      if (!peWire) {
        return {
          passed: false,
          feedback: 'La lámpara no tiene conectado el conductor de puesta a tierra (PE) proveniente de la jabalina.',
        };
      }

      if (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id)) {
        return {
          passed: true,
          feedback: '¡Correcto! La luminaria cuenta con retorno, neutro y protección a tierra activa.',
        };
      }

      return {
        passed: false,
        feedback: 'Recuerda completar también el circuito de alimentación (Fase y Neutro) hacia la lámpara.',
      };
    },
  },
  {
    id: 3,
    title: '3. Derivaciones con Caja de Paso (Octogonal)',
    difficulty: 'Intermedio',
    objective: 'Utilizar una caja de paso para recibir la línea principal y derivar a dos ramales.',
    description: 'Las cajas de paso y derivación alojan los empalmes reglamentarios con borneras. Permiten ordenar los cables y derivar la alimentación hacia diferentes puntos sin cortar conductores innecesariamente.',
    componentsNeeded: ['Alimentación', 'Caja de Paso', 'Interruptor Simple', 'Luminaria'],
    instructions: [
      '1. Conecta la alimentación de entrada a la Caja de Paso.',
      '2. Desde la Caja de Paso, baja con Fase hacia el interruptor.',
      '3. Sube con el retorno del interruptor hacia la lámpara.',
      '4. Conecta el Neutro desde la Caja de Paso hacia la lámpara.',
    ],
    hints: [
      'Pista: La caja de paso funciona como punto central de derivación.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 100, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('caja_paso', 320, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('interruptor_simple', 320, 360, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 540, 200, 'floor_1', 'C1', 1),
      ],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      const cp = project.symbols.find((s) => s.type === 'caja_paso');
      if (!lamp || !cp) return { passed: false, feedback: 'Faltan componentes.' };

      const hasCpWire = project.wires.some((w) => w.fromComponentId === cp.id || w.toComponentId === cp.id);
      if (!hasCpWire) {
        return { passed: false, feedback: 'Debes utilizar la Caja de Paso para realizar las derivaciones.' };
      }

      if (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id)) {
        return {
          passed: true,
          feedback: '¡Excelente! Has derivado correctamente a través de la caja de paso central.',
        };
      }

      return { passed: false, feedback: 'Verifica que la Fase pase por la tecla y regrese a la lámpara con su Neutro.' };
    },
  },
  {
    id: 4,
    title: '4. Conexión de Varios Puntos de Luz en Paralelo',
    difficulty: 'Intermedio',
    objective: 'Conectar 2 lámparas comandadas simultáneamente por una sola tecla.',
    description: 'En instalaciones residenciales, las lámparas de una misma habitación o sala se conectan en PARALELO para que ambas reciban los 220V plenos y si una se quema, la otra continúe funcionando.',
    componentsNeeded: ['Fuente AC', 'Interruptor Simple', 'Luminaria 1', 'Luminaria 2'],
    instructions: [
      '1. Conecta la Fase a la Tecla S1.',
      '2. Conecta el Retorno de la Tecla S1 tanto a la Lámpara 1 como a la Lámpara 2.',
      '3. Conecta el Neutro en paralelo a ambas lámparas.',
      '4. Verifica que al encender la tecla, ambas lámparas brillen al unísono.',
    ],
    hints: [
      'Pista: En paralelo, los terminales L de ambas lámparas reciben el mismo retorno, y los terminales N comparten el neutro.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 100, 220, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('interruptor_simple', 260, 220, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 440, 140, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 440, 300, 'floor_1', 'C1', 2),
      ],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const lamps = project.symbols.filter((s) => s.type === 'luminaria');
      if (lamps.length < 2) return { passed: false, feedback: 'Se requieren al menos 2 luminarias.' };

      const activeCount = lamps.filter((l) => sim.activeLamps.has(l.id) || sim.energizedComponents.has(l.id)).length;
      if (activeCount === 2) {
        return {
          passed: true,
          feedback: '¡Perfecto! Las dos lámparas están correctamente conectadas en paralelo y responden a la misma tecla.',
        };
      }
      return {
        passed: false,
        feedback: `Se encendieron ${activeCount} de 2 lámparas. Asegúrate de que el retorno y el neutro lleguen a ambas lámparas en paralelo.`,
      };
    },
  },
  {
    id: 5,
    title: '5. Control desde Dos Puntos con Interruptores Conmutados (Combinación)',
    difficulty: 'Intermedio',
    objective: 'Encender y apagar una lámpara indistintamente desde dos llaves de combinación (escalera o pasillo).',
    description: 'El circuito de conmutación de 2 vías utiliza dos llaves combinadas unidas por dos cables viajeros o puentes (P1 y P2). La Fase entra al borne común (COM) de la primera llave, y del común de la segunda sale el Retorno hacia la lámpara.',
    componentsNeeded: ['Fuente AC', 'Conmutador 1 (SC1)', 'Conmutador 2 (SC2)', 'Luminaria'],
    instructions: [
      '1. Conecta la Fase al borne común "COM" del primer Conmutador (SC1).',
      '2. Une con cables de puente el terminal "P1" de SC1 con "P1" de SC2.',
      '3. Une el terminal "P2" de SC1 con "P2" de SC2.',
      '4. Del borne común "COM" de SC2, sal con el Retorno hacia el terminal "L" de la Lámpara.',
      '5. Conecta el Neutro de la Fuente al terminal "N" de la Lámpara.',
    ],
    hints: [
      'Pista: Los puentes P1-P1 y P2-P2 conectan directamente ambos conmutadores. Nunca conectes el neutro a los conmutadores.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 100, 220, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('conmutado', 260, 220, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('conmutado', 440, 220, 'floor_1', 'C1', 2),
        createSymbolFromTemplate('luminaria', 600, 220, 'floor_1', 'C1', 1),
      ],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const sc1 = project.symbols.find((s) => s.label === 'SC1');
      const sc2 = project.symbols.find((s) => s.label === 'SC2');
      const lamp = project.symbols.find((s) => s.type === 'luminaria');

      if (!sc1 || !sc2 || !lamp) return { passed: false, feedback: 'Faltan componentes del circuito conmutado.' };

      // Check bridges P1 and P2
      const hasBridge = project.wires.some(
        (w) =>
          (w.fromComponentId === sc1.id && w.toComponentId === sc2.id) ||
          (w.fromComponentId === sc2.id && w.toComponentId === sc1.id)
      );

      if (!hasBridge) {
        return {
          passed: false,
          feedback: 'Faltan los puentes entre los terminales P1 y P2 de ambos conmutadores.',
        };
      }

      if (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id)) {
        return {
          passed: true,
          feedback: '¡Excelente! Circuito de combinación completado con éxito. Puedes alternar cualquiera de las dos llaves para conmutar la luz.',
        };
      }

      return {
        passed: false,
        feedback: 'Revisa las conexiones: Fase a COM de SC1, P1 a P1, P2 a P2, COM de SC2 a Lámpara, y Neutro a Lámpara.',
      };
    },
  },
  {
    id: 6,
    title: '6. Circuito de Tomacorrientes (TUG) con Conductor de Protección',
    difficulty: 'Intermedio',
    objective: 'Cablear una línea de tomacorrientes de uso general con Fase, Neutro y Puesta a Tierra obligatoria.',
    description: 'Los tomacorrientes tipo IRAM 2071 deben ser cableados con conductores de sección mínima 2,5 mm² y protegidos con interruptor termomagnético de hasta 16A o 20A según corresponda.',
    componentsNeeded: ['Fuente AC', 'PIA 16A', 'Tomacorriente 1 (TUG-1)', 'Tomacorriente 2 (TUG-2)', 'Jabalina PAT'],
    instructions: [
      '1. Alimenta la térmica con Fase y Neutro desde la Fuente.',
      '2. Conduce Fase y Neutro desde la térmica hacia los tomacorrientes en paralelo.',
      '3. Conecta el borne PE de la jabalina a los bornes de tierra de ambos tomacorrientes.',
    ],
    hints: [
      'Pista: En los tomas residenciales estándar, mirando de frente con la tierra abajo, la Fase va a la derecha y el Neutro a la izquierda.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 100, 200, 'floor_1', 'C2', 1),
        createSymbolFromTemplate('termica', 240, 200, 'floor_1', 'C2', 1),
        createSymbolFromTemplate('tomacorriente', 420, 160, 'floor_1', 'C2', 1),
        createSymbolFromTemplate('tomacorriente', 580, 160, 'floor_1', 'C2', 2),
        createSymbolFromTemplate('puesta_tierra', 420, 300, 'floor_1', 'C2', 1),
      ],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const tomas = project.symbols.filter((s) => s.type === 'tomacorriente');
      const energizedCount = tomas.filter((t) => t.state?.isEnergized).length;

      if (energizedCount === 2) {
        return {
          passed: true,
          feedback: '¡Muy bien! Ambos tomacorrientes están energizados correctamente y vinculados a la red.',
        };
      }

      return {
        passed: false,
        feedback: `Solo ${energizedCount} de 2 tomacorrientes están energizados con Fase y Neutro. Verifica las conexiones.`,
      };
    },
  },
  {
    id: 7,
    title: '7. Tablero Principal: Térmica General + Disyuntor Diferencial',
    difficulty: 'Avanzado',
    objective: 'Armar la cabecera del tablero con Térmica General (IGA) y Disyuntor Diferencial (ID 30mA).',
    description: 'La reglamentación AEA 90364 exige protección contra sobrecorrientes y protección diferencial de 30 mA para salvar vidas ante corrientes de fuga o contactos accidentales.',
    componentsNeeded: ['Fuente AC', 'Interruptor General (IGA)', 'Interruptor Diferencial (ID)', 'PIA Seccional', 'Lámpara'],
    instructions: [
      '1. De la Fuente conecta Fase y Neutro a la entrada del Interruptor General.',
      '2. De la salida del Interruptor General conecta a la entrada del Disyuntor Diferencial.',
      '3. De la salida del Diferencial alimenta la Térmica seccional.',
      '4. De la Térmica seccional alimenta el circuito de iluminación.',
    ],
    hints: [
      'Pista: El orden de cabecera en el tablero es Fuente -> IGA -> Disyuntor Diferencial -> PIAs de circuitos.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 80, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('termica', 220, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('diferencial', 380, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 580, 200, 'floor_1', 'C1', 1),
      ],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const dif = project.symbols.find((s) => s.type === 'diferencial');
      const lamp = project.symbols.find((s) => s.type === 'luminaria');

      if (!dif || !lamp) return { passed: false, feedback: 'Faltan componentes requeridos.' };

      if (sim.activeLamps.has(lamp.id)) {
        return {
          passed: true,
          feedback: '¡Excelente! Tablero de protección conectado en cascada reglamentaria con térmica y diferencial.',
        };
      }

      return {
        passed: false,
        feedback: 'Asegúrate de que la corriente atraviese en serie tanto la térmica general como el disyuntor diferencial.',
      };
    },
  },
  {
    id: 8,
    title: '8. Separación de Circuitos: Iluminación (IUG) y Tomacorrientes (TUG)',
    difficulty: 'Avanzado',
    objective: 'Implementar dos circuitos independientes con sus respectivas térmicas protegidas por un diferencial común.',
    description: 'AEA 90364 prohíbe alimentar luces y tomas desde una misma protección en viviendas. Se deben separar en al menos un circuito de IUG (cable 1,5 mm² / PIA 10A) y uno de TUG (cable 2,5 mm² / PIA 16A).',
    componentsNeeded: ['Fuente AC', 'Diferencial', 'PIA 10A (IUG)', 'PIA 16A (TUG)', 'Lámpara', 'Tomacorriente'],
    instructions: [
      '1. Conecta la salida del diferencial en paralelo a las entradas de ambas térmicas.',
      '2. Conecta la Térmica 1 exclusivamente a la Lámpara con su tecla.',
      '3. Conecta la Térmica 2 exclusivamente al Tomacorriente.',
    ],
    hints: [
      'Pista: Ambas térmicas reciben Fase y Neutro desde el mismo diferencial, pero sus salidas van a circuitos distintos.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 80, 220, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('diferencial', 220, 220, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('termica', 360, 140, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('termica', 360, 300, 'floor_1', 'C2', 2),
        createSymbolFromTemplate('luminaria', 520, 140, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('tomacorriente', 520, 300, 'floor_1', 'C2', 1),
      ],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      const toma = project.symbols.find((s) => s.type === 'tomacorriente');

      const lampActive = lamp && (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id));
      const tomaActive = toma && toma.state?.isEnergized;

      if (lampActive && tomaActive) {
        return {
          passed: true,
          feedback: '¡Impecable! Los circuitos IUG y TUG están perfectamente independizados y alimentados.',
        };
      }

      return {
        passed: false,
        feedback: 'Debes lograr energizar simultáneamente la lámpara (C1) y el tomacorriente (C2) a través de sus respectivas térmicas.',
      };
    },
  },
  {
    id: 9,
    title: '9. Identificación y Corrección de Cortocircuito',
    difficulty: 'Avanzado',
    objective: 'Localizar un error grave de conexión que une Fase y Neutro directamente, y solucionarlo.',
    description: 'En este ejercicio se ha preparado un circuito con una falla peligrosa: un puente indebido provoca un cortocircuito. Tu labor como instalador es inspeccionar, eliminar el conductor erróneo y dejar el circuito operativo.',
    componentsNeeded: ['Fuente AC', 'Térmica', 'Interruptor', 'Lámpara'],
    instructions: [
      '1. Presiona "Verificar Circuito" para observar el diagnóstico de cortocircuito.',
      '2. Identifica cuál es el cable que une directamente la Fase con el Neutro.',
      '3. Elimina ese cable incorrecto seleccionándolo y pulsando Suprimir.',
      '4. Conecta el retorno correctamente y vuelve a simular.',
    ],
    hints: [
      'Pista: Busca el cable que va desde el terminal Fase hacia el terminal Neutro saltándose la lámpara.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 100, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('termica', 240, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('interruptor_simple', 400, 200, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 560, 200, 'floor_1', 'C1', 1),
      ],
      wires: [
        // Conexiones normales
        {
          id: 'w_fault_1',
          floorId: 'floor_1',
          type: 'fase',
          fromComponentId: 'sym_fuente_ac_1',
          fromTerminalId: 'L',
          toComponentId: 'sym_termica_1',
          toTerminalId: 'L_IN',
          color: '#854d0e',
          crossSectionMm2: 2.5,
          lengthMeters: 1,
        },
        // Cable fallido: cortocircuito directo entre Fase y Neutro
        {
          id: 'w_fault_bad',
          floorId: 'floor_1',
          type: 'fase',
          fromComponentId: 'sym_termica_1',
          fromTerminalId: 'L_OUT',
          toComponentId: 'sym_fuente_ac_1',
          toTerminalId: 'N',
          color: '#ef4444',
          crossSectionMm2: 2.5,
          lengthMeters: 1,
        },
      ],
    },
    solutionCheck: (_project, sim) => {
      if (sim.hasShortCircuit) {
        return {
          passed: false,
          feedback: 'Todavía persiste el cortocircuito. Revisa los cables conectados a la salida de la térmica y elimina el puente directo a Neutro.',
        };
      }
      return {
        passed: true,
        feedback: '¡Felicitaciones! Has eliminado exitosamente el cortocircuito y restaurado la seguridad de la instalación.',
      };
    },
  },
  {
    id: 10,
    title: '10. Proyecto Residencial Guiado',
    difficulty: 'Avanzado',
    objective: 'Completar la distribución eléctrica de un ambiente residencial completo con iluminación, tomas y protecciones.',
    description: 'Integra todos los conocimientos aprendidos: monta un tablero con térmica e ID, cablea los centros de luz con sus llaves, y los tomacorrientes con su respectivo conductor de protección conectado a la jabalina.',
    componentsNeeded: ['Tablero', 'Térmica', 'Luminarias', 'Tomacorrientes', 'Jabalina PAT'],
    instructions: [
      '1. Conecta la acometida al Tablero Seccional.',
      '2. Conecta las bocas de iluminación a través del interruptor.',
      '3. Conecta los tomacorrientes a su propia térmica.',
      '4. Conecta el borne PE de los tomas y del tablero a la jabalina de puesta a tierra.',
      '5. Comprueba el informe de simulación y cálculos.',
    ],
    hints: [
      'Pista: Sigue el esquema unifilar: Alimentación -> Tablero -> Circuitos C1 y C2 -> PAT.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 80, 160, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('tablero', 200, 160, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('interruptor_simple', 360, 120, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 500, 120, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('tomacorriente', 360, 260, 'floor_1', 'C2', 1),
        createSymbolFromTemplate('tomacorriente', 500, 260, 'floor_1', 'C2', 2),
        createSymbolFromTemplate('puesta_tierra', 200, 320, 'floor_1', 'C1', 1),
      ],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      if (sim.activeLamps.size > 0 && !sim.hasShortCircuit) {
        return {
          passed: true,
          feedback: '¡Excelente trabajo! Has completado con éxito la instalación residencial de práctica.',
        };
      }
      return {
        passed: false,
        feedback: 'Aún faltan conexiones para que las luminarias y tomas queden operativas bajo el tablero.',
      };
    },
  },
  {
    id: 11,
    title: '11. Diagnóstico de Cortocircuito Franco en Caja de Paso',
    difficulty: 'Intermedio',
    objective: 'Localizar el puente indebido entre Fase y Neutro que provoca el disparo magnético instantáneo de la térmica.',
    description: 'En esta instalación se ha reportado que al accionar la térmica salta instantáneamente por cortocircuito. Utiliza el Localizador de Fallas de ELECTRA PLAN para identificar el tramo problemático, eliminar el cable en corto y reestablecer el encendido seguro de la lámpara.',
    componentsNeeded: ['Alimentación de Red', 'Térmica Curva C', 'Caja de Paso', 'Interruptor', 'Luminaria'],
    instructions: [
      '1. Observa el mensaje de diagnóstico en rojo: indica un cortocircuito franco de impedancia casi nula.',
      '2. Pulsa "Centrar en Falla" en el panel de alerta para visualizar el puente erróneo.',
      '3. Selecciona el cable incorrecto conectado directamente entre Fase y Neutro en la caja y elimínalo con la tecla Supr o el icono de basura.',
      '4. Conecta el cable de retorno de la lámpara al interruptor para cerrar el circuito correctamente.',
      '5. Pulsa "Verificar" y comprueba que la térmica no dispara y la lámpara enciende.',
    ],
    hints: [
      'Pista: En la caja de derivación hay un cable marrón conectado directamente a la bornera de Neutro celeste. ¡Esa es la falla!',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 80, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('termica', 220, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('caja_paso', 360, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('interruptor_simple', 360, 300, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 520, 180, 'floor_1', 'C1', 1),
      ],
      wires: [
        { id: 'w_init_1', floorId: 'floor_1', circuitId: 'C1', type: 'fase', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'L', toComponentId: 'sym_termica_1', toTerminalId: 'L_IN', color: '#854d0e', crossSectionMm2: 2.5, lengthMeters: 2 },
        { id: 'w_init_2', floorId: 'floor_1', circuitId: 'C1', type: 'neutro', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'N', toComponentId: 'sym_termica_1', toTerminalId: 'N_IN', color: '#0284c7', crossSectionMm2: 2.5, lengthMeters: 2 },
        { id: 'w_init_3', floorId: 'floor_1', circuitId: 'C1', type: 'fase', fromComponentId: 'sym_termica_1', fromTerminalId: 'L_OUT', toComponentId: 'sym_caja_paso_1', toTerminalId: 'L_IN', color: '#854d0e', crossSectionMm2: 2.5, lengthMeters: 2 },
        { id: 'w_init_4', floorId: 'floor_1', circuitId: 'C1', type: 'neutro', fromComponentId: 'sym_termica_1', toComponentId: 'sym_caja_paso_1', fromTerminalId: 'N_OUT', toTerminalId: 'N_IN', color: '#0284c7', crossSectionMm2: 2.5, lengthMeters: 2 },
        // CABLE EN CORTO INDEBIDO ENTRE FASE Y NEUTRO
        { id: 'w_fault_short', floorId: 'floor_1', circuitId: 'C1', type: 'fase', fromComponentId: 'sym_caja_paso_1', fromTerminalId: 'L_OUT', toComponentId: 'sym_caja_paso_1', toTerminalId: 'N_OUT', color: '#854d0e', crossSectionMm2: 2.5, lengthMeters: 0.5 },
      ],
    },
    solutionCheck: (project, sim) => {
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      if (sim.hasShortCircuit) {
        return {
          passed: false,
          feedback: 'Todavía persiste el cortocircuito franco. Revisa la caja de paso y retira el puente indebido entre L y N.',
        };
      }
      if (lamp && sim.activeLamps.has(lamp.id)) {
        return {
          passed: true,
          feedback: '¡Excelente diagnóstico! Localizaste y eliminaste el cortocircuito franco con éxito. La instalación funciona segura.',
        };
      }
      return {
        passed: false,
        feedback: 'El cortocircuito fue eliminado, pero aún falta conectar la tecla y la lámpara para completar el circuito.',
      };
    },
  },
  {
    id: 12,
    title: '12. Falla de Aislación a Tierra y Disparo Diferencial',
    difficulty: 'Intermedio',
    objective: 'Identificar una fuga a tierra provocada por un conductor de Fase conectado al borne PE.',
    description: 'El disyuntor diferencial de 30mA dispara continuamente debido a una corriente de fuga residual. Aprende a distinguir una falla a tierra de un cortocircuito entre polos y repara la conexión a masa.',
    componentsNeeded: ['Tablero con Diferencial', 'Luminaria', 'Jabalina PAT'],
    instructions: [
      '1. Analiza el diagnóstico: el simulador reporta disparo del Interruptor Diferencial por IΔn > 30mA hacia PE.',
      '2. Localiza el cable que conecta la Fase con el borne de protección PE.',
      '3. Reconéctalo al terminal correcto (L) de la carga.',
      '4. Comprueba que el conductor PE verde-amarillo quede conectado únicamente a la jabalina.',
    ],
    hints: [
      'Pista: El diferencial vigila el equilibrio entre la corriente que entra por la Fase y sale por el Neutro. Si la corriente escapa por Tierra PE, dispara en menos de 30 ms.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 80, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('tablero', 220, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('puesta_tierra', 220, 320, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 440, 180, 'floor_1', 'C1', 1),
      ],
      wires: [
        { id: 'w12_1', floorId: 'floor_1', circuitId: 'C1', type: 'fase', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'L', toComponentId: 'sym_tablero_1', toTerminalId: 'L_IN', color: '#854d0e', crossSectionMm2: 2.5, lengthMeters: 2 },
        { id: 'w12_2', floorId: 'floor_1', circuitId: 'C1', type: 'neutro', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'N', toComponentId: 'sym_tablero_1', toTerminalId: 'N_IN', color: '#0284c7', crossSectionMm2: 2.5, lengthMeters: 2 },
        { id: 'w12_3', floorId: 'floor_1', circuitId: 'C1', type: 'tierra', fromComponentId: 'sym_puesta_tierra_1', fromTerminalId: 'PE', toComponentId: 'sym_tablero_1', toTerminalId: 'PE_IN', color: '#16a34a', crossSectionMm2: 2.5, lengthMeters: 2 },
        // CABLE ERRÓNEO: FASE CONECTADA AL BORNE PE DEL TABLERO
        { id: 'w12_fault', floorId: 'floor_1', circuitId: 'C1', type: 'fase', fromComponentId: 'sym_tablero_1', fromTerminalId: 'L_OUT', toComponentId: 'sym_tablero_1', toTerminalId: 'PE_OUT', color: '#854d0e', crossSectionMm2: 2.5, lengthMeters: 0.5 },
      ],
    },
    solutionCheck: (project, sim) => {
      const hasEarthFault = sim.diagnostics.some((d) => d.faultDetail?.category === 'falla_tierra');
      if (hasEarthFault) {
        return {
          passed: false,
          feedback: 'Persiste la fuga a tierra: el conductor de Fase sigue vinculado galvánicamente al conductor de protección PE.',
        };
      }
      return {
        passed: true,
        feedback: '¡Felicitaciones! Eliminaste la fuga a tierra. El diferencial permanece armado y la instalación segura.',
      };
    },
  },
  {
    id: 13,
    title: '13. Corrección de Interruptor Invertido en el Neutro',
    difficulty: 'Avanzado',
    objective: 'Reconfigurar la conexión para que el interruptor corte la Fase viva y no el Neutro (Riesgo Crítico AEA 771).',
    description: 'En esta instalación la lámpara enciende y apaga aparentemente bien, pero la tecla seccionaba el Neutro. El portalámparas queda bajo 220V constante con riesgo mortal al cambiar la lámpara. Corrige el conexionado respetando la norma AEA 90364.',
    componentsNeeded: ['Alimentación', 'Interruptor Simple', 'Luminaria'],
    instructions: [
      '1. Revisa los conductores: observa que al interruptor llega el cable celeste (Neutro) en lugar del marrón (Fase).',
      '2. Desconecta el Neutro del interruptor y llévalo directo al terminal N de la lámpara.',
      '3. Conecta la Fase (marrón) a la entrada L del interruptor.',
      '4. Conecta el Retorno desde la salida del interruptor hacia el borne L de la lámpara.',
    ],
    hints: [
      'Pista: Según la reglamentación argentina, los interruptores unipolares NUNCA deben cortar el Neutro.',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 80, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('interruptor_simple', 260, 180, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('luminaria', 440, 180, 'floor_1', 'C1', 1),
      ],
      wires: [
        // Neutro llevado al interruptor (PELIGRO)
        { id: 'w13_1', floorId: 'floor_1', circuitId: 'C1', type: 'neutro', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'N', toComponentId: 'sym_interruptor_simple_1', toTerminalId: 'L', color: '#0284c7', crossSectionMm2: 1.5, lengthMeters: 2 },
        // Fase directa a la lámpara (PELIGRO)
        { id: 'w13_2', floorId: 'floor_1', circuitId: 'C1', type: 'fase', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'L', toComponentId: 'sym_luminaria_1', toTerminalId: 'L', color: '#854d0e', crossSectionMm2: 1.5, lengthMeters: 2 },
        // Retorno conectado a Neutro de la lámpara
        { id: 'w13_3', floorId: 'floor_1', circuitId: 'C1', type: 'retorno', fromComponentId: 'sym_interruptor_simple_1', fromTerminalId: 'R', toComponentId: 'sym_luminaria_1', toTerminalId: 'N', color: '#eab308', crossSectionMm2: 1.5, lengthMeters: 2 },
      ],
    },
    solutionCheck: (project, sim) => {
      const hasDanger = sim.diagnostics.some((d) => d.faultDetail?.category === 'conexion_peligrosa');
      if (hasDanger) {
        return {
          passed: false,
          feedback: 'El interruptor sigue conectado sobre el conductor de Neutro. Debe cortar la Fase (conductor marrón).',
        };
      }
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      if (lamp && sim.activeLamps.has(lamp.id)) {
        return {
          passed: true,
          feedback: '¡Perfecto! Has normalizado el circuito según AEA 90364-771: la tecla corta la Fase y el portalámparas queda seguro.',
        };
      }
      return {
        passed: false,
        feedback: 'Conexión corregida, acciona el interruptor para encender la luminaria.',
      };
    },
  },
  {
    id: 14,
    title: '14. Continuidad de Protección (PE) en Tomacorrientes',
    difficulty: 'Avanzado',
    objective: 'Garantizar que todos los tomacorrientes queden vinculados a la jabalina de puesta a tierra reglamentaria.',
    description: 'Una inspección técnica detectó que los tomacorrientes de la sala carecen de conductor de tierra PE conectado. Tiende el cable verde-amarillo de sección mínima 2,5 mm² desde la jabalina a los bornes de protección.',
    componentsNeeded: ['Alimentación', 'Tomacorrientes', 'Jabalina PAT'],
    instructions: [
      '1. Selecciona la herramienta "Cablear" y activa el tipo de conductor "PE (Tierra)".',
      '2. Conecta desde el borne PE de la Jabalina hacia el borne PE del primer tomacorriente.',
      '3. Continúa el conductor de protección hacia el segundo tomacorriente.',
      '4. Comprueba que las alertas de seguridad por falta de PE desaparezcan del panel de diagnósticos.',
    ],
    hints: [
      'Pista: La sección mínima de puesta a tierra reglamentaria en tomacorrientes generales es de 2,5 mm² (AEA 771.13.I).',
    ],
    initialProject: {
      symbols: [
        createSymbolFromTemplate('fuente_ac', 80, 160, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('puesta_tierra', 80, 280, 'floor_1', 'C1', 1),
        createSymbolFromTemplate('tomacorriente', 260, 160, 'floor_1', 'C2', 1),
        createSymbolFromTemplate('tomacorriente', 420, 160, 'floor_1', 'C2', 2),
      ],
      wires: [
        { id: 'w14_1', floorId: 'floor_1', circuitId: 'C2', type: 'fase', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'L', toComponentId: 'sym_tomacorriente_1', toTerminalId: 'L', color: '#854d0e', crossSectionMm2: 2.5, lengthMeters: 2 },
        { id: 'w14_2', floorId: 'floor_1', circuitId: 'C2', type: 'neutro', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'N', toComponentId: 'sym_tomacorriente_1', toTerminalId: 'N', color: '#0284c7', crossSectionMm2: 2.5, lengthMeters: 2 },
        { id: 'w14_3', floorId: 'floor_1', circuitId: 'C2', type: 'fase', fromComponentId: 'sym_tomacorriente_1', fromTerminalId: 'L', toComponentId: 'sym_tomacorriente_2', toTerminalId: 'L', color: '#854d0e', crossSectionMm2: 2.5, lengthMeters: 2 },
        { id: 'w14_4', floorId: 'floor_1', circuitId: 'C2', type: 'neutro', fromComponentId: 'sym_tomacorriente_1', fromTerminalId: 'N', toComponentId: 'sym_tomacorriente_2', toTerminalId: 'N', color: '#0284c7', crossSectionMm2: 2.5, lengthMeters: 2 },
      ],
    },
    solutionCheck: (_project, sim) => {
      const missingPe = sim.diagnostics.some((d) => d.id.includes('diag_toma_no_pe') || d.id.includes('fault_no_pe'));
      if (!missingPe) {
        return {
          passed: true,
          feedback: '¡Excelente! Todos los tomacorrientes cuentan con protección a tierra reglamentaria.',
        };
      }
      return {
        passed: false,
        feedback: 'Aún quedan tomacorrientes sin conductor de protección (PE) conectado a la jabalina.',
      };
    },
  },
];
