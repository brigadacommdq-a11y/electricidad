/**
 * ELECTRA PLAN — Aula de Prácticas Reglamentarias
 * Catálogo pedagógico completo de 45 prácticas estructuradas en 6 categorías (A-F):
 * A. Fundamentos y reconocimiento (1-6)
 * B. Instalaciones domésticas (7-15)
 * C. Tableros y protecciones (16-22)
 * D. Cálculos y dimensionamiento (23-30)
 * E. Diagnóstico de fallas (31-38)
 * F. Talleres y proyectos integrales (39-45)
 * Con verificación automática del modelo, pistas graduales y supuestos técnicos reglamentarios (AEA 90364).
 */

import { PracticeLevel, Project, SimulationState } from '../types/electra';
import { createSymbolFromTemplate } from './symbolCatalog';

// Helper de instanciación rápida de componentes en la mesa de ensayos
const sym = (type: string, x: number, y: number, circuit = 'C1', idx = 1) =>
  createSymbolFromTemplate(type, x, y, 'floor_1', circuit, idx);

export const PRACTICE_LEVELS: PracticeLevel[] = [
  // =========================================================================
  // CATEGORÍA A: FUNDAMENTOS Y RECONOCIMIENTO (1 a 6)
  // =========================================================================
  {
    id: 1,
    category: 'fundamentos',
    categoryName: 'A. Fundamentos y Reconocimiento',
    title: '1. Identificar Fase, Neutro y Protección de Tierra',
    difficulty: 'Principiante',
    objective: 'Reconocer los 3 conductores esenciales de una instalación monofásica (220V) según el código de colores IRAM 2183 / AEA 90364.',
    description: 'En corriente alterna monofásica argentina, la Fase (L) conduce el potencial activo (marrón/negro/rojo), el Neutro (N) cierra el retorno al transformador (celeste obligatorio) y el conductor de Protección Equipotencial (PE) drena corrientes de fuga a la jabalina (verde-amarillo exclusivo).',
    prerequisites: ['Conceptos básicos de tensión (Voltios) y circuito cerrado.'],
    inputsAndAssumptions: ['Tensión nominal: 220 V AC, 50 Hz. Jabalina hincada en suelo húmedo.'],
    componentsNeeded: ['Alimentación de Red (220V)', 'Boca de Iluminación con Borne PE', 'Jabalina de Puesta a Tierra'],
    instructions: [
      '1. Conecta el borne "L (Fase)" de la Red al terminal "L" de la Luminaria con conductor de Fase (marrón).',
      '2. Conecta el borne "N (Neutro)" de la Red al terminal "N" de la Luminaria con conductor celeste.',
      '3. Conecta el borne "PE" de la Jabalina al terminal "PE" de la Luminaria con conductor verde-amarillo.',
      '4. Presiona "Verificar Resultado".',
    ],
    studentActions: ['Trazar cables diferenciados por color normativo hacia la luminaria y jabalina.'],
    hints: [
      'Pista 1: El neutro SIEMPRE debe ser color celeste y la tierra verde con franja amarilla.',
      'Pista 2: La jabalina PAT se conecta exclusivamente al borne inferior de protección PE.',
    ],
    expectedOutcome: 'Luminaria alimentada correctamente a 220V con carcasa protegida por descarga a tierra.',
    keyLearnings: ['Colores IRAM normalizados: Marrón = Fase, Celeste = Neutro, Verde/Amarillo = Tierra.', 'El cable de tierra jamás debe llevar corriente en condiciones normales.'],
    errorTroubleshooting: ['Si se conecta Fase a Neutro se producirá un cortocircuito franco instantáneo.'],
    initialProject: {
      symbols: [sym('fuente_ac', 120, 200), sym('luminaria', 420, 200), sym('puesta_tierra', 420, 340)],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      const pat = project.symbols.find((s) => s.type === 'puesta_tierra');
      if (!lamp || !pat) return { passed: false, feedback: 'Faltan componentes en la mesa.' };
      if (sim.hasShortCircuit) return { passed: false, feedback: 'Cortocircuito directo detectado entre Fase y Neutro.' };

      const peWire = project.wires.find(
        (w) =>
          (w.fromComponentId === pat.id && w.toComponentId === lamp.id) ||
          (w.fromComponentId === lamp.id && w.toComponentId === pat.id)
      );
      if (!peWire) return { passed: false, feedback: 'Falta conectar el conductor de protección PE desde la jabalina hasta la lámpara.' };
      if (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id)) {
        return { passed: true, feedback: '¡Excelente! Los tres conductores (L, N, PE) están correctamente reconocidos y conectados.' };
      }
      return { passed: false, feedback: 'Verifica la alimentación de Fase y Neutro hacia la lámpara.' };
    },
  },

  {
    id: 2,
    category: 'fundamentos',
    categoryName: 'A. Fundamentos y Reconocimiento',
    title: '2. Reconocer los Símbolos Eléctricos del Plano CAD',
    difficulty: 'Principiante',
    objective: 'Familiarizarse con la simbología normalizada IRAM 2014 para bocas de techo, tomas, cajas y tableros.',
    description: 'En planos de arquitectura eléctrica, cada componente tiene una representación geométrica inequívoca para que electricistas e inspectores municipales interpreten la instalación sin ambigüedades.',
    prerequisites: ['Lectura básica de planos arquitectónicos.'],
    inputsAndAssumptions: ['Simbología según norma IRAM 2014 / AEA 90364-771.'],
    componentsNeeded: ['Tablero Seccional (rectángulo dividido)', 'Luminaria (círculo con cruz)', 'Tomacorriente (semicírculo con espigas)', 'Interruptor (círculo con patilla)'],
    instructions: [
      '1. Agrega al plano al menos un Tablero (TSG), un Interruptor Simple, una Luminaria y un Tomacorriente.',
      '2. Observa cómo sus bornes de conexión coinciden con la representación técnica.',
      '3. Conecta el interruptor a la luminaria mediante un retorno.',
      '4. Presiona "Verificar Resultado".',
    ],
    studentActions: ['Colocar e identificar los 4 símbolos fundamentales del plano.'],
    hints: ['Pista: Usa la barra de herramientas CAD para colocar los símbolos faltantes si la mesa no los contiene.'],
    expectedOutcome: 'Plano con los 4 símbolos normativos correctamente ubicados e interconectados.',
    keyLearnings: ['Círculo cruzado = Boca de techo.', 'Semicírculo = Tomacorriente.', 'Rectángulo bitono = Tablero.'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('interruptor_simple', 300, 200), sym('luminaria', 480, 200), sym('tomacorriente', 300, 340)],
      wires: [],
    },
    solutionCheck: (project) => {
      const hasBoard = project.symbols.some((s) => s.type === 'tablero');
      const hasSwitch = project.symbols.some((s) => s.type === 'interruptor_simple');
      const hasLamp = project.symbols.some((s) => s.type === 'luminaria');
      const hasOutlet = project.symbols.some((s) => s.type === 'tomacorriente');
      if (hasBoard && hasSwitch && hasLamp && hasOutlet) {
        return { passed: true, feedback: '¡Reconocimiento completado! Identificas con precisión los símbolos reglamentarios de arquitectura.' };
      }
      return { passed: false, feedback: 'Asegúrate de que la mesa cuente con Tablero, Interruptor, Luminaria y Tomacorriente.' };
    },
  },

  {
    id: 3,
    category: 'fundamentos',
    categoryName: 'A. Fundamentos y Reconocimiento',
    title: '3. Identificar Interruptores, Conmutadores y Pulsadores',
    difficulty: 'Principiante',
    objective: 'Diferenciar el funcionamiento de un interruptor simple (unipolar), una llave de combinación (conmutador) y un pulsador.',
    description: 'El interruptor simple abre o cierra un único contacto permanente. La llave de combinación (conmutador de 3 vías) conmuta la entrada entre dos terminales auxiliares (puentes). El pulsador solo cierra contacto mientras se mantenga presionado mecánicamente.',
    prerequisites: ['Circuito serie simple.'],
    inputsAndAssumptions: ['Mando sobre conductor de Fase exclusivamente.'],
    componentsNeeded: ['Fuente AC', 'Interruptor Simple', 'Luminaria de Prueba'],
    instructions: [
      '1. Alimenta el borne "L" del interruptor simple desde la fuente.',
      '2. Conecta el borne "R" (Retorno) del interruptor a la lámpara.',
      '3. Conecta el Neutro directo a la lámpara.',
      '4. Comprueba que el interruptor gobierne la lámpara.',
    ],
    hints: ['El interruptor simple cuenta con solo 2 bornes: L (Fase de entrada) y R (Retorno a la carga).'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('interruptor_simple', 280, 200), sym('luminaria', 460, 200)],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const sw = project.symbols.find((s) => s.type === 'interruptor_simple');
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      if (!sw || !lamp) return { passed: false, feedback: 'Faltan componentes en la mesa.' };
      if (sim.activeLamps.has(lamp.id) || (sw.state?.isOpen && sim.energizedComponents.has(sw.id))) {
        return { passed: true, feedback: '¡Correcto! El interruptor simple se encuentra comandando la lámpara en serie sobre la fase.' };
      }
      return { passed: false, feedback: 'Revisa las conexiones: Fase a la llave, retorno a la lámpara, neutro a la lámpara.' };
    },
  },

  {
    id: 4,
    category: 'fundamentos',
    categoryName: 'A. Fundamentos y Reconocimiento',
    title: '4. Reconocer Tomacorrientes, Luminarias y Cajas de Derivación',
    difficulty: 'Principiante',
    objective: 'Comprender el rol de las cajas octogonales y rectangulares para alojar borneras de derivación.',
    description: 'Las cajas de paso octogonales se ubican en losas y techos para derivar cañerías hacia las paredes y alojar centros luminosos. Los tomacorrientes se montan en cajas rectangulares a 0.30m del piso.',
    componentsNeeded: ['Fuente AC', 'Caja de Paso Octogonal', 'Tomacorriente 10A'],
    instructions: [
      '1. Conecta la Fase y el Neutro de la Fuente a los terminales de entrada de la Caja de Paso.',
      '2. Deriva desde la Caja de Paso hacia el Tomacorriente.',
      '3. Verifica que el tomacorriente reciba potencial.',
    ],
    hints: ['La caja octogonal actúa de nodo distribuidor para no tener empalmes sueltos dentro del caño.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('caja_paso', 280, 200), sym('tomacorriente', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const socket = _project.symbols.find((s) => s.type === 'tomacorriente');
      if (socket && sim.energizedComponents.has(socket.id)) {
        return { passed: true, feedback: '¡Excelente! Derivación a través de caja de paso ejecutada con éxito.' };
      }
      return { passed: false, feedback: 'El tomacorriente aún no recibe tensión a través de la caja de paso.' };
    },
  },

  {
    id: 5,
    category: 'fundamentos',
    categoryName: 'A. Fundamentos y Reconocimiento',
    title: '5. Diferenciar Térmica, Diferencial y Protector contra Sobretensiones (DPS)',
    difficulty: 'Principiante',
    objective: 'Reconocer los 3 dispositivos de protección esenciales de un tablero principal o seccional.',
    description: 'La Térmica protege a los CABLES contra sobrecargas y cortocircuitos. El Disyuntor Diferencial (30mA) protege a las PERSONAS contra electrocución. El DPS descarga a tierra sobretensiones transitorias de origen atmosférico.',
    componentsNeeded: ['Fuente AC', 'Interruptor Termomagnético (PIA)', 'Interruptor Diferencial (ID)', 'Protector DPS'],
    instructions: [
      '1. Coloca en cascada: Entrada -> Térmica -> Diferencial.',
      '2. Conecta el DPS en paralelo entre Fase/Neutro y la barra de Tierra.',
      '3. Verifica que la línea pase por ambas protecciones de cabecera.',
    ],
    hints: ['El diferencial va en serie en la línea; el DPS se conecta en paralelo con derivación directa a tierra.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 240, 200), sym('diferencial', 380, 200), sym('dps', 520, 200)],
      wires: [],
    },
    solutionCheck: (project) => {
      const pia = project.symbols.find((s) => s.type === 'termica');
      const id = project.symbols.find((s) => s.type === 'diferencial');
      const dps = project.symbols.find((s) => s.type === 'dps');
      if (pia && id && dps) {
        return { passed: true, feedback: '¡Protecciones identificadas! Comprendes el rol coordinado de Térmica, Disyuntor y DPS según AEA 90364.' };
      }
      return { passed: false, feedback: 'Asegúrate de colocar los 3 dispositivos en la mesa de ensayos.' };
    },
  },

  {
    id: 6,
    category: 'fundamentos',
    categoryName: 'A. Fundamentos y Reconocimiento',
    title: '6. Comprender la Función de la Jabalina y el Sistema de Puesta a Tierra',
    difficulty: 'Principiante',
    objective: 'Conectar la jabalina de acero-cobre y verificar que la resistencia de puesta a tierra proteja al usuario.',
    description: 'La jabalina de puesta a tierra (IRAM 2309, mín. 1.50m x 14mm) garantiza que ante una falla de aislación en un artefacto, la corriente de fuga se derive a masa y dispare instantáneamente el disyuntor diferencial (en < 30ms).',
    componentsNeeded: ['Jabalina PAT', 'Tablero Seccional con Barra PE', 'Tomacorriente'],
    instructions: [
      '1. Une la jabalina al borne PE del tablero con cable verde-amarillo de al menos 2.5 mm² o 4 mm².',
      '2. Desde la barra PE del tablero, distribuye el conductor de protección al borne central del tomacorriente.',
      '3. Presiona "Verificar Resultado".',
    ],
    hints: ['El cable verde-amarillo nunca se interrumpe con fusibles ni llaves.'],
    initialProject: {
      symbols: [sym('puesta_tierra', 120, 300), sym('tablero', 300, 200), sym('tomacorriente', 480, 200)],
      wires: [],
    },
    solutionCheck: (project) => {
      const pat = project.symbols.find((s) => s.type === 'puesta_tierra');
      const board = project.symbols.find((s) => s.type === 'tablero');
      const socket = project.symbols.find((s) => s.type === 'tomacorriente');
      const wirePat = project.wires.find(
        (w) =>
          w.type === 'tierra' &&
          ((w.fromComponentId === pat?.id && w.toComponentId === board?.id) ||
            (w.fromComponentId === board?.id && w.toComponentId === pat?.id))
      );
      if (wirePat && socket) {
        return { passed: true, feedback: '¡Puesta a tierra reglamentaria! El camino equipotencial protege a las personas ante fallas.' };
      }
      return { passed: false, feedback: 'Conecta la jabalina al tablero usando un conductor verde-amarillo.' };
    },
  },

  // =========================================================================
  // CATEGORÍA B: INSTALACIONES DOMÉSTICAS (7 a 15)
  // =========================================================================
  {
    id: 7,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '7. Diseñar la Iluminación de una Habitación',
    difficulty: 'Principiante',
    objective: 'Calcular e instalar las bocas de iluminación requeridas para un dormitorio de 12 m².',
    description: 'Según AEA 90364-771 Tabla 771.8.II, para un dormitorio de hasta 36 m² se exige como mínimo 1 boca de iluminación general (IUG) ubicada en el centro geométrico del techo.',
    componentsNeeded: ['Fuente AC', 'Interruptor Simple', 'Luminaria de Techo'],
    instructions: [
      '1. Conecta la Fase a la llave de pared (a 1.10m de altura).',
      '2. Conecta el retorno de la llave a la boca de techo.',
      '3. Conecta el Neutro celeste a la boca de techo.',
      '4. Verifica que la lámpara encienda.',
    ],
    hints: ['El centro de iluminación debe ser comandado al entrar por la puerta principal de la habitación.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('interruptor_simple', 280, 200), sym('luminaria', 480, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const lamp = _project.symbols.find((s) => s.type === 'luminaria');
      if (lamp && (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id))) {
        return { passed: true, feedback: '¡Diseño de iluminación aprobado! La habitación cuenta con boca central y comando accesible.' };
      }
      return { passed: false, feedback: 'Completa el cableado de la lámpara para verificar el encendido.' };
    },
  },

  {
    id: 8,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '8. Conectar Conceptualmente un Interruptor y una Lámpara en el Simulador',
    difficulty: 'Principiante',
    objective: 'Comprobar el circuito elemental: Fase -> Térmica -> Tecla -> Retorno -> Lámpara -> Neutro.',
    description: 'Es el circuito básico de toda instalación eléctrica. La tecla corta únicamente la Fase para que al cambiar una lámpara apagada no exista riesgo de descarga eléctrica.',
    componentsNeeded: ['Alimentación', 'Térmica 10A', 'Interruptor Simple', 'Luminaria'],
    instructions: [
      '1. Une Fase de la red a la entrada de la Térmica.',
      '2. Une salida de la Térmica al borne L del interruptor.',
      '3. Une el borne R (Retorno) del interruptor al borne L/Retorno de la lámpara.',
      '4. Cierra el circuito llevando el Neutro de la lámpara al Neutro de la red.',
    ],
    hints: ['Nunca conectes el Neutro al interruptor.'],
    initialProject: {
      symbols: [sym('fuente_ac', 80, 200), sym('termica', 220, 200), sym('interruptor_simple', 360, 200), sym('luminaria', 500, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const lamp = _project.symbols.find((s) => s.type === 'luminaria');
      if (lamp && (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id))) {
        return { passed: true, feedback: '¡Excelente! Circuito elemental de iluminación conectado con protección termomagnética.' };
      }
      return { passed: false, feedback: 'Verifica la continuidad de la Fase a través de la térmica y la tecla.' };
    },
  },

  {
    id: 9,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '9. Diseñar el Control de Iluminación desde Dos Ubicaciones (Combinación)',
    difficulty: 'Intermedio',
    objective: 'Implementar el circuito de escalera con dos llaves conmutadas (3 terminales: COM, P1, P2) para encender/apagar desde dos puntos.',
    description: 'En dormitorios (puerta y cabecera de cama) y escaleras (inicio y final), se emplean llaves de combinación. La Fase entra al común de la llave 1, dos cables puentes unen ambas llaves, y el común de la llave 2 sale como retorno a la lámpara.',
    componentsNeeded: ['Fuente AC', 'Llave Combinada 1', 'Llave Combinada 2', 'Luminaria'],
    instructions: [
      '1. Conecta la Fase al terminal "COM" de la Conmutada 1.',
      '2. Conecta "P1" de la Conmutada 1 con "P1" de la Conmutada 2.',
      '3. Conecta "P2" de la Conmutada 1 con "P2" de la Conmutada 2.',
      '4. Conecta el "COM" de la Conmutada 2 al terminal de entrada de la Lámpara.',
      '5. Conecta el Neutro celeste desde la Fuente a la Lámpara.',
    ],
    hints: ['Pista: Los terminales P1 y P2 son los puentes auxiliares entre ambas llaves conmutadas.'],
    initialProject: {
      symbols: [sym('fuente_ac', 80, 200), sym('conmutado', 220, 180), sym('conmutado', 380, 180), sym('luminaria', 540, 200)],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      const lamp = project.symbols.find((s) => s.type === 'luminaria');
      const sws = project.symbols.filter((s) => s.type === 'conmutado');
      if (!lamp || sws.length < 2) return { passed: false, feedback: 'Faltan llaves de combinación o la luminaria.' };
      const bridges = project.wires.filter(
        (w) =>
          (w.fromComponentId === sws[0].id && w.toComponentId === sws[1].id) ||
          (w.fromComponentId === sws[1].id && w.toComponentId === sws[0].id)
      );
      if (bridges.length >= 2) {
        return { passed: true, feedback: '¡Circuito de combinación perfecto! Permite gobernar la luz independientemente desde ambos extremos.' };
      }
      return { passed: false, feedback: 'Recuerda unir los dos puentes (P1 con P1, y P2 con P2) entre ambas conmutadas.' };
    },
  },

  {
    id: 10,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '10. Distribuir Tomacorrientes en una Vivienda',
    difficulty: 'Intermedio',
    objective: 'Ubicar y cablear tomas de uso general (TUG) cumpliendo la distancia máxima y cantidad mínima reglamentaria.',
    description: 'En salas de estar y dormitorios se exige 1 boca de tomacorriente cada 6 m² o fracción mayor a 3 m², con un mínimo de 2 bocas por ambiente.',
    componentsNeeded: ['Fuente AC', 'Térmica 16A', '2 Tomacorrientes 10A'],
    instructions: [
      '1. Alimenta la Térmica de 16A con Fase y Neutro.',
      '2. Conduce la línea de 2.5 mm² hacia el primer tomacorriente.',
      '3. Realiza la derivación en paralelo hacia el segundo tomacorriente.',
      '4. Verifica que ambos tomas queden energizados a 220V.',
    ],
    hints: ['Los tomacorrientes se conectan SIEMPRE en paralelo, nunca en serie.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 240, 200), sym('tomacorriente', 380, 200), sym('tomacorriente', 520, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const sockets = _project.symbols.filter((s) => s.type === 'tomacorriente');
      const energized = sockets.filter((s) => sim.energizedComponents.has(s.id));
      if (energized.length >= 2) {
        return { passed: true, feedback: '¡Excelente! Circuito TUG con bocas en paralelo funcionando a 220V.' };
      }
      return { passed: false, feedback: 'Asegúrate de conectar ambos tomacorrientes en paralelo a la línea.' };
    },
  },

  {
    id: 11,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '11. Separar Iluminación y Tomacorrientes en Circuitos Independientes',
    difficulty: 'Intermedio',
    objective: 'Implementar la separación obligatoria de circuitos IUG y TUG en el tablero de distribución.',
    description: 'La reglamentación AEA 90364-771 prohíbe alimentar luces y tomas de uso general desde la misma térmica. Se deben separar en circuito IUG (mín. cable 1.5 mm², térmica máx 16A) y TUG (mín. cable 2.5 mm², térmica máx 20A).',
    componentsNeeded: ['Tablero', 'Térmica IUG 10A', 'Térmica TUG 16A', 'Luminaria', 'Tomacorriente'],
    instructions: [
      '1. Desde la Térmica 1 (C1 - IUG), alimenta la luminaria.',
      '2. Desde la Térmica 2 (C2 - TUG), alimenta el tomacorriente.',
      '3. Verifica que ambos circuitos queden operables e independientes.',
    ],
    hints: ['Cada circuito debe contar con su propio par de conductores Fase y Neutro separados.'],
    initialProject: {
      symbols: [sym('fuente_ac', 80, 200), sym('termica', 220, 160, 'C1'), sym('termica', 220, 280, 'C2'), sym('luminaria', 420, 160, 'C1'), sym('tomacorriente', 420, 280, 'C2')],
      wires: [],
    },
    solutionCheck: (project) => {
      const hasC1 = project.wires.some((w) => w.circuitId === 'C1' || w.fromComponentId.includes('luminaria') || w.toComponentId.includes('luminaria'));
      const hasC2 = project.wires.some((w) => w.circuitId === 'C2' || w.fromComponentId.includes('tomacorriente') || w.toComponentId.includes('tomacorriente'));
      if (hasC1 && hasC2) {
        return { passed: true, feedback: '¡Reglamentación cumplida! Separación estricta de circuitos IUG y TUG garantizada.' };
      }
      return { passed: false, feedback: 'Conecta la luminaria a la térmica C1 y el toma a la térmica C2.' };
    },
  },

  {
    id: 12,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '12. Diseñar la Instalación de una Cocina',
    difficulty: 'Intermedio',
    objective: 'Prever tomas sobre mesada y circuito especial para electrodomésticos de gran consumo (anafe, microondas).',
    description: 'En cocinas se exige un mínimo de 3 tomas de uso general sobre mesada (distanciados de la bacha) y circuitos de tomas especiales (TUE) con cable de 4 mm² para hornos o anafes eléctricos.',
    componentsNeeded: ['Fuente AC', 'Térmica 20A (TUE)', 'Tomacorriente Especial 20A', 'Tomacorriente 10A'],
    instructions: [
      '1. Alimenta el toma especial de 20A con cable de 4 mm² (TUE).',
      '2. Conecta la puesta a tierra a ambos tomas.',
      '3. Presiona "Verificar Resultado".',
    ],
    hints: ['Los tomas especiales admiten clavijas de espigas más gruesas (20A IRAM 2071).'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 260, 200), sym('toma_especial', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const sp = _project.symbols.find((s) => s.type === 'toma_especial');
      if (sp && sim.energizedComponents.has(sp.id)) {
        return { passed: true, feedback: '¡Cocina electrificada! Toma especial de alto consumo energizado según AEA 771.' };
      }
      return { passed: false, feedback: 'Alimenta el tomacorriente especial desde la térmica.' };
    },
  },

  {
    id: 13,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '13. Diseñar la Instalación de un Baño (Zonas de Seguridad)',
    difficulty: 'Avanzado',
    objective: 'Aplicar la zonificación de seguridad (Zona 0, 1, 2 y 3) para baños según AEA 771.8.3.',
    description: 'En cuartos de baño está estrictamente prohibido instalar interruptores o tomas en Zona 0 (interior de ducha/bañera) y Zona 1 (hasta 2.25m sobre ducha). Los tomas solo se permiten en Zona 3 protegidos por diferencial de 30mA.',
    componentsNeeded: ['Fuente AC', 'Interruptor Diferencial 30mA', 'Tomacorriente con PE'],
    instructions: [
      '1. Pasa la línea obligatoriamente por el disyuntor diferencial.',
      '2. Conecta el tomacorriente al circuito protegido.',
      '3. Conecta el conductor PE de protección a la jabalina.',
    ],
    hints: ['En baños el disyuntor de 30mA es la barrera salvavidas indelegable ante humedad.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('diferencial', 280, 200), sym('tomacorriente', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const rcd = _project.symbols.find((s) => s.type === 'diferencial');
      const soc = _project.symbols.find((s) => s.type === 'tomacorriente');
      if (rcd && soc && sim.energizedComponents.has(soc.id)) {
        return { passed: true, feedback: '¡Seguridad en baños verificada! Zona húmeda protegida por diferencial de alta sensibilidad.' };
      }
      return { passed: false, feedback: 'Asegúrate de pasar la línea a través del disyuntor diferencial.' };
    },
  },

  {
    id: 14,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '14. Planificar la Iluminación de Pasillos y Escaleras',
    difficulty: 'Intermedio',
    objective: 'Iluminar tramos de circulación con bocas cada 5 metros y comando en ambos accesos.',
    description: 'En pasillos de más de 5 metros de longitud se deben instalar bocas en ambos extremos con comando conmutado o por sensor de movimiento para evitar transitar en penumbra.',
    componentsNeeded: ['Fuente AC', '2 Llaves Conmutadas', '2 Luminarias en paralelo'],
    instructions: [
      '1. Conecta ambas luminarias en paralelo para que enciendan simultáneamente.',
      '2. Conéctalas al retorno de las llaves conmutadas.',
      '3. Verifica que ambas luces se accionen al conmutar.',
    ],
    hints: ['Al conectar lámparas en paralelo, ambas reciben los 220V nominales completos.'],
    initialProject: {
      symbols: [sym('fuente_ac', 80, 200), sym('conmutado', 220, 200), sym('luminaria', 400, 160), sym('luminaria', 400, 260)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const lamps = _project.symbols.filter((s) => s.type === 'luminaria');
      const active = lamps.filter((l) => sim.activeLamps.has(l.id) || sim.energizedComponents.has(l.id));
      if (active.length >= 2) {
        return { passed: true, feedback: '¡Pasillo iluminado! Bocas en paralelo sincronizadas en el circuito de circulación.' };
      }
      return { passed: false, feedback: 'Conecta ambas luminarias en paralelo.' };
    },
  },

  {
    id: 15,
    category: 'domesticas',
    categoryName: 'B. Instalaciones Domésticas',
    title: '15. Incorporar Luminarias Lineales, Paneles LED, Spots y Luces de Emergencia',
    difficulty: 'Intermedio',
    objective: 'Integrar artefactos modernos LED de bajo consumo y luces de emergencia autónomas.',
    description: 'La tecnología LED reduce la corriente pero introduce corrientes de inrush al encendido. Las luces de emergencia autónomas (IRAM 2444) deben contar con toma permanente para cargar su batería interna.',
    componentsNeeded: ['Fuente AC', 'Térmica IUG', 'Luminaria LED', 'Tomacorriente Permanente'],
    instructions: [
      '1. Alimenta la luminaria LED a través de la tecla de comando.',
      '2. Instala una boca fija para el equipo autónomo de emergencia.',
      '3. Verifica el encendido de la luminaria.',
    ],
    hints: ['El equipo de emergencia requiere alimentación permanente sin interruptor.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('interruptor_simple', 280, 200), sym('luminaria', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const lamp = _project.symbols.find((s) => s.type === 'luminaria');
      if (lamp && (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id))) {
        return { passed: true, feedback: '¡Bocas LED integradas con éxito en el proyecto!' };
      }
      return { passed: false, feedback: 'Conecta la luminaria para comprobar el circuito.' };
    },
  },

  // =========================================================================
  // CATEGORÍA C: TABLEROS Y PROTECCIONES (16 a 22)
  // =========================================================================
  {
    id: 16,
    category: 'tableros',
    categoryName: 'C. Tableros y Protecciones',
    title: '16. Ordenar los Componentes de un Tablero Eléctrico',
    difficulty: 'Principiante',
    objective: 'Disponer sobre Riel DIN el orden jerárquico normativo: IGA -> Diferencial -> PIAs de circuito.',
    description: 'En el tablero seccional de entrada, la corriente debe entrar primero al Interruptor General Automático (IGA), luego pasar por el Interruptor Diferencial (ID) y finalmente distribuirse a los pequeños interruptores automáticos (PIA) de cada circuito.',
    componentsNeeded: ['Tablero', 'Interruptor General (IGA)', 'Diferencial', 'PIA C1', 'PIA C2'],
    instructions: [
      '1. Conecta la acometida al IGA.',
      '2. Del IGA sal hacia los bornes de entrada del Diferencial.',
      '3. Del Diferencial reparte hacia las térmicas de circuito con peines o puentes de sección adecuada.',
    ],
    hints: ['El diferencial debe quedar aguas abajo del interruptor general para estar protegido contra cortocircuitos.'],
    initialProject: {
      symbols: [sym('fuente_ac', 80, 200), sym('termica', 220, 200), sym('diferencial', 360, 200), sym('termica', 500, 200)],
      wires: [],
    },
    solutionCheck: (project) => {
      if (project.symbols.length >= 4) {
        return { passed: true, feedback: '¡Jerarquía de tablero correcta! IGA -> Diferencial -> Circuitos derivados respetado.' };
      }
      return { passed: false, feedback: 'Asegúrate de colocar los componentes del tablero en la mesa.' };
    },
  },

  {
    id: 17,
    category: 'tableros',
    categoryName: 'C. Tableros y Protecciones',
    title: '17. Interpretar un Esquema Unifilar de Tablero',
    difficulty: 'Intermedio',
    objective: 'Reconocer el diagrama unifilar, indicando curva de disparo (C), calibre nominal (In) y poder de corte (Icn 3kA o 4.5kA).',
    description: 'El esquema unifilar resume en una sola línea la cantidad de polos (2x16A), el tipo de conductor (2x2.5 + PE 2.5 mm² en caño Ø19mm) y el destino del circuito.',
    componentsNeeded: ['Tablero Seccional', 'Térmica 16A Curva C', 'Tomacorriente'],
    instructions: [
      '1. Conecta la protección termomagnética hacia la carga.',
      '2. Verifica que el calibre coincida con los 16A del circuito.',
    ],
    hints: ['Curva C dispara entre 5 y 10 veces la corriente nominal In (ideal para uso residencial).'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 280, 200), sym('tomacorriente', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const soc = _project.symbols.find((s) => s.type === 'tomacorriente');
      if (soc && sim.energizedComponents.has(soc.id)) {
        return { passed: true, feedback: '¡Esquema unifilar interpretado y verificado en simulación!' };
      }
      return { passed: false, feedback: 'Conecta el circuito para comprobar el flujo de carga.' };
    },
  },

  {
    id: 18,
    category: 'tableros',
    categoryName: 'C. Tableros y Protecciones',
    title: '18. Seleccionar Protecciones para un Circuito a Partir de los Datos Requeridos',
    difficulty: 'Intermedio',
    objective: 'Coordinar la corriente de proyecto (Ib), el calibre de la protección (In) y la corriente admisible del cable (Iz).',
    description: 'Regla de oro AEA 771.19: Ib <= In <= Iz. Para cable de 2.5 mm² en caño (Iz = 18A a 21A), la protección máxima permitida es de 16A.',
    componentsNeeded: ['Fuente AC', 'Térmica C16', 'Tomacorriente'],
    instructions: [
      '1. Asigna un cable de 2.5 mm² al circuito.',
      '2. Conéctalo a la térmica de 16A.',
      '3. Verifica que la relación Ib <= In <= Iz se cumpla.',
    ],
    hints: ['Nunca coloques una térmica de 25A o 32A sobre cables finos de 1.5 o 2.5 mm².'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 280, 200), sym('tomacorriente', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const soc = _project.symbols.find((s) => s.type === 'tomacorriente');
      if (soc && sim.energizedComponents.has(soc.id)) {
        return { passed: true, feedback: '¡Coordinación perfecta! In=16A protege adecuadamente el conductor de 2.5 mm².' };
      }
      return { passed: false, feedback: 'Conecta la carga al circuito protegido.' };
    },
  },

  {
    id: 19,
    category: 'tableros',
    categoryName: 'C. Tableros y Protecciones',
    title: '19. Identificar Errores Conceptuales en la Coordinación entre Conductores y Protecciones',
    difficulty: 'Avanzado',
    objective: 'Detectar y corregir un escenario donde la térmica es mayor que la capacidad del cable (riesgo de incendio).',
    description: 'Si se coloca una térmica de 25A sobre un cable de 1.5 mm² (capacidad admisible 13A - 15A), el cable se derretirá e incendiará antes de que la térmica llegue a disparar.',
    componentsNeeded: ['Fuente AC', 'Térmica Inadecuada', 'Carga'],
    instructions: [
      '1. Inspecciona el calibre del cable y la protección instalada.',
      '2. Reemplaza la térmica sobredimensionada por una adecuada de 10A o 16A.',
      '3. Verifica que el diagnóstico de sobrecalentamiento desaparezca.',
    ],
    hints: ['Cable 1.5 mm² -> Térmica máx 10A o 13A. Cable 2.5 mm² -> Térmica máx 16A.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 280, 200), sym('luminaria', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      if (!sim.hasShortCircuit) {
        return { passed: true, feedback: '¡Excelente auditoría! El conductor ha quedado protegido contra sobrecargas térmicas.' };
      }
      return { passed: false, feedback: 'Corrige la discrepancia de calibres.' };
    },
  },

  {
    id: 20,
    category: 'tableros',
    categoryName: 'C. Tableros y Protecciones',
    title: '20. Analizar el Papel de la Protección Diferencial (30 mA)',
    difficulty: 'Intermedio',
    objective: 'Comprobar el balance vectorial de corriente (Ifase = Ineutro) y el disparo ante fugas a tierra.',
    description: 'El transformador toroidal del disyuntor suma vectorialmente la corriente de Fase y Neutro. Si la diferencia supera los 30 mA (umbral de fibrilación ventricular), un solenoide desengancha el mecanismo en menos de 30 milisegundos.',
    componentsNeeded: ['Fuente AC', 'Interruptor Diferencial', 'Luminaria'],
    instructions: [
      '1. Conecta la luminaria a través del disyuntor diferencial.',
      '2. Verifica que en funcionamiento normal no dispare.',
    ],
    hints: ['El disyuntor no reemplaza a la térmica: necesita que la térmica lo proteja contra cortocircuitos.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('diferencial', 280, 200), sym('luminaria', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const lamp = _project.symbols.find((s) => s.type === 'luminaria');
      if (lamp && (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id))) {
        return { passed: true, feedback: '¡Disyuntor calibrado! Corrientes de ida y vuelta equilibradas a través del toroidal.' };
      }
      return { passed: false, feedback: 'Conecta la lámpara pasando por el disyuntor diferencial.' };
    },
  },

  {
    id: 21,
    category: 'tableros',
    categoryName: 'C. Tableros y Protecciones',
    title: '21. Comprender la Protección contra Sobretensiones (DPS)',
    difficulty: 'Intermedio',
    objective: 'Conectar un descargador de sobretensiones transitorias Clase II con varistor de óxido metálico (MOV).',
    description: 'Ante una descarga indirecta de rayo o maniobra de la red, la tensión trepa a miles de voltios. El varistor reduce su resistencia a casi cero y deriva el pico a tierra antes de que alcance los electrodomésticos.',
    componentsNeeded: ['Fuente AC', 'DPS', 'Jabalina PAT'],
    instructions: [
      '1. Conecta el borne L del DPS a la Fase de entrada.',
      '2. Conecta el borne N del DPS al Neutro.',
      '3. Conecta el borne inferior PE del DPS a la jabalina.',
    ],
    hints: ['Los conductores hacia el DPS deben ser lo más cortos posibles (< 0.50m) para minimizar la inductancia.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('dps', 280, 200), sym('puesta_tierra', 280, 340)],
      wires: [],
    },
    solutionCheck: (project) => {
      const dps = project.symbols.find((s) => s.type === 'dps');
      const pat = project.symbols.find((s) => s.type === 'puesta_tierra');
      const wirePe = project.wires.find(
        (w) => (w.fromComponentId === dps?.id && w.toComponentId === pat?.id) || (w.fromComponentId === pat?.id && w.toComponentId === dps?.id)
      );
      if (wirePe) {
        return { passed: true, feedback: '¡DPS conectado a tierra! Los picos de sobretensión serán drenados al terreno.' };
      }
      return { passed: false, feedback: 'Conecta el borne de descarga del DPS a la jabalina de puesta a tierra.' };
    },
  },

  {
    id: 22,
    category: 'tableros',
    categoryName: 'C. Tableros y Protecciones',
    title: '22. Interpretar una Instalación desde la Acometida y Pilar hasta los Circuitos Interiores',
    difficulty: 'Avanzado',
    objective: 'Reconocer el camino completo de la energía: Red distribuidora -> Fusibles aéreos -> Medidor -> Tablero Principal (pilar) -> Línea Seccional -> Tablero Seccional General (interior).',
    description: 'El pilar de medición aloja el medidor de kWh y el Tablero Principal a no más de 2 metros del medidor con térmica de corte general. Desde allí, la línea seccional viaja subterránea o por cañería embutida hasta el interior de la vivienda.',
    componentsNeeded: ['Acometida / Red', 'Tablero Principal Pilar', 'Tablero Seccional Interior', 'Circuito'],
    instructions: [
      '1. Conecta la acometida al Tablero Principal.',
      '2. Conecta la línea seccional desde el Tablero Principal al Tablero Seccional.',
      '3. Del Tablero Seccional alimenta el circuito interior.',
    ],
    hints: ['La línea seccional debe ser de al menos 4 mm² o 6 mm² según la potencia contratada.'],
    initialProject: {
      symbols: [sym('fuente_ac', 80, 200), sym('tablero', 240, 200), sym('tablero', 400, 200), sym('tomacorriente', 540, 200)],
      wires: [],
    },
    solutionCheck: (project) => {
      if (project.symbols.length >= 4) {
        return { passed: true, feedback: '¡Instalación completa interpretada! Cadena de suministro y distribución normalizada.' };
      }
      return { passed: false, feedback: 'Completa la cadena de tableros de acometida y distribución.' };
    },
  },

  // =========================================================================
  // CATEGORÍA D: CÁLCULOS Y DIMENSIONAMIENTO (23 a 30)
  // =========================================================================
  {
    id: 23,
    category: 'calculos',
    categoryName: 'D. Cálculos y Dimensionamiento',
    title: '23. Calcular Corriente a Partir de Potencia y Tensión',
    difficulty: 'Principiante',
    objective: 'Aplicar la ley de Ohm y potencia eléctrica monofásica: I = P / (U · cos φ).',
    description: 'Para una carga puramente resistiva de 2200 W a 220 V con factor de potencia unitario (cos φ = 1), la corriente que circula por el cable es exactamente I = 2200 / (220 · 1) = 10 A.',
    componentsNeeded: ['Fuente 220V', 'Térmica 16A', 'Carga Resistiva 2200W'],
    instructions: [
      '1. Conecta la carga resistiva de 2200W a la fuente.',
      '2. Inicia la simulación para comprobar la corriente calculada de 10A.',
    ],
    hints: ['P = U · I · cos φ => I = P / (U · cos φ).'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 280, 200), sym('toma_especial', 460, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      if (sim.totalSimulatedCurrentAmps >= 0) {
        return { passed: true, feedback: '¡Cálculo verificado! La corriente calculada coincide con la ley electrotécnica.' };
      }
      return { passed: false, feedback: 'Conecta la carga para calcular la corriente en el simulador.' };
    },
  },

  {
    id: 24,
    category: 'calculos',
    categoryName: 'D. Cálculos y Dimensionamiento',
    title: '24. Comparar Cargas Monofásicas (220V) y Trifásicas (380V)',
    difficulty: 'Intermedio',
    objective: 'Calcular la corriente de línea en trifásica: I = P / (√3 · U · cos φ) y compararla con monofásica.',
    description: 'Para la misma potencia (ej. 6000 W), en monofásica se requieren 27.2 A (cables gruesos de 6mm²), mientras que en trifásica 380V la corriente por fase es de solo 9.1 A (cables de 1.5mm² a 2.5mm²).',
    componentsNeeded: ['Tablero Trifásico', 'Cargas de Ensayo'],
    instructions: [
      '1. Compara en la memoria de cálculo la ventaja de la alimentación trifásica.',
      '2. Verifica la reducción de sección de los conductores.',
    ],
    hints: ['En trifásica la tensión de línea es 380V y el factor raíz de 3 (1.732) reduce la corriente por conductor.'],
    initialProject: {
      symbols: [sym('tablero', 200, 200), sym('tomacorriente', 400, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Comparativa comprendida! La trifásica optimiza la sección de conductores para grandes potencias.' };
    },
  },

  {
    id: 25,
    category: 'calculos',
    categoryName: 'D. Cálculos y Dimensionamiento',
    title: '25. Calcular Caída de Tensión con Datos Explícitos',
    difficulty: 'Intermedio',
    objective: 'Calcular la caída de tensión porcentual: ΔV% = (2 · L · I) / (γ · S · U) · 100 y verificar que sea < 3%.',
    description: 'La conductividad del cobre γ es de 56 m/(Ω·mm²). En circuitos terminales de iluminación la caída máxima tolerada por AEA 771 es del 3% (6.6 V), y en fuerza motriz del 5% (11 V).',
    componentsNeeded: ['Fuente AC', 'Línea de 25 metros', 'Carga'],
    instructions: [
      '1. Analiza el impacto de la longitud del conductor en la caída de potencial.',
      '2. Comprueba que un aumento de sección reduce drásticamente el valor de ΔV%.',
    ],
    hints: ['Mayor longitud o mayor corriente aumentan la caída; mayor sección la disminuye.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 280, 200), sym('tomacorriente', 480, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Cálculo de caída de tensión validado! ΔV% dentro de los límites reglamentarios (< 3%).' };
    },
  },

  {
    id: 26,
    category: 'calculos',
    categoryName: 'D. Cálculos y Dimensionamiento',
    title: '26. Comparar Secciones de Conductores y sus Condiciones de Uso',
    difficulty: 'Intermedio',
    objective: 'Reconocer las secciones mínimas reglamentarias (AEA 90364-771 Tabla 771.13.I).',
    description: 'Línea principal/seccional: mín. 4 mm². Iluminación de uso general (IUG): mín. 1.5 mm². Tomacorrientes de uso general (TUG): mín. 2.5 mm². Conductor de protección (PE): mín. 2.5 mm².',
    componentsNeeded: ['Tablero', 'Conductor 1.5 mm²', 'Conductor 2.5 mm²', 'Conductor 4 mm²'],
    instructions: [
      '1. Asigna sección de 1.5 mm² para iluminación.',
      '2. Asigna sección de 2.5 mm² para tomacorrientes.',
      '3. Verifica que no existan advertencias de sección mínima.',
    ],
    hints: ['Nunca utilices 1 mm² o 0.75 mm² en cañerías embutidas; no están permitidos en instalaciones fijas.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('luminaria', 300, 200), sym('tomacorriente', 480, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Tabla de secciones mínimas asimilada con éxito!' };
    },
  },

  {
    id: 27,
    category: 'calculos',
    categoryName: 'D. Cálculos y Dimensionamiento',
    title: '27. Evaluar Cargas Simultáneas y Factor de Simultaneidad (FS)',
    difficulty: 'Intermedio',
    objective: 'Calcular la Demanda de Potencia Máxima Simultánea (DPMS) multiplicando la suma de cargas por el FS.',
    description: 'No todos los aparatos de una casa están encendidos al mismo tiempo. El factor de simultaneidad (0.7 a 0.8 en viviendas) evita sobredimensionar la acometida y los transformadores de distribución.',
    componentsNeeded: ['Tablero General', 'Cargas Múltiples'],
    instructions: [
      '1. Suma la potencia instalada de todas las bocas.',
      '2. Aplica el coeficiente de simultaneidad según grado de electrificación.',
    ],
    hints: ['DPMS = (Suma de potencias) · Coeficiente de simultaneidad.'],
    initialProject: {
      symbols: [sym('tablero', 150, 200), sym('luminaria', 300, 200), sym('tomacorriente', 450, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Cálculo de DPMS y factor de simultaneidad aprobado!' };
    },
  },

  {
    id: 28,
    category: 'calculos',
    categoryName: 'D. Cálculos y Dimensionamiento',
    title: '28. Distribuir Cargas entre Fases en un Ejercicio Trifásico',
    difficulty: 'Avanzado',
    objective: 'Equilibrar la potencia asignada a las fases R, S y T para que el desbalance sea menor al 5%.',
    description: 'Un desbalance excesivo de fases genera caída de tensión asimétrica, recalienta el neutro por circulación de corriente residual y sobrecarga el transformador de distribución.',
    componentsNeeded: ['Tablero Trifásico', 'Cargas R', 'Cargas S', 'Cargas T'],
    instructions: [
      '1. Reparte las cargas entre las fases R, S y T de manera que cada fase reciba potencia similar.',
      '2. Verifica en la herramienta de balance de fases que el desequilibrio sea mínimo.',
    ],
    hints: ['Intenta que la diferencia entre la fase más cargada y la menos cargada no supere el 10%.'],
    initialProject: {
      symbols: [sym('tablero', 100, 200), sym('luminaria', 280, 160), sym('tomacorriente', 280, 240), sym('toma_especial', 460, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Distribución de fases balanceada! Corriente por el neutro reducida al mínimo.' };
    },
  },

  {
    id: 29,
    category: 'calculos',
    categoryName: 'D. Cálculos y Dimensionamiento',
    title: '29. Analizar Arranque de Motores y Cargas Especiales',
    difficulty: 'Avanzado',
    objective: 'Considerar la corriente de arranque (Ip = 5 a 7 In) y seleccionar térmicas de Curva D o arrancador suave.',
    description: 'Los motores eléctricos de inducción demandan un pico de corriente violento durante los primeros ciclos de giro. Una térmica de Curva C estándar podría disparar por falso positivo.',
    componentsNeeded: ['Tablero con Protección Curva D', 'Motor de Bomba'],
    instructions: [
      '1. Analiza los datos de chapa del motor (In = 6A, Ip = 36A).',
      '2. Asigna una protección con curva de disparo adecuada para soportar el transitorio de arranque.',
    ],
    hints: ['Curva D retarda el disparo magnético hasta 10-20 In para absorber arranques de motores.'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('toma_especial', 340, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Coordinación para arranque de motores validada con éxito!' };
    },
  },

  {
    id: 30,
    category: 'calculos',
    categoryName: 'D. Cálculos y Dimensionamiento',
    title: '30. Evaluar Instalaciones para Bombas, Compresores y Soldadoras',
    difficulty: 'Avanzado',
    objective: 'Interpretar datos de placa (factor de marcha, cos φ, potencia en HP o kW) y calcular cable de alimentación.',
    description: '1 HP equivale a aproximadamente 746 W mecánicos. Considerando un rendimiento η = 0.85 y cos φ = 0.80, la potencia eléctrica aparente demandada es significativamente superior a la potencia mecánica.',
    componentsNeeded: ['Tablero', 'Alimentación de Bomba'],
    instructions: [
      '1. Calcula la corriente nominal a partir de los HP y rendimiento.',
      '2. Dimensiona los conductores con holgura para caída de tensión.',
    ],
    hints: ['P_eléctrica = P_mecánica / rendimiento.'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('toma_especial', 380, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Dimensionamiento de fuerza motriz verificado según datos de placa!' };
    },
  },

  // =========================================================================
  // CATEGORÍA E: DIAGNÓSTICO DE FALLAS (31 a 38)
  // =========================================================================
  {
    id: 31,
    category: 'diagnostico',
    categoryName: 'E. Diagnóstico de Fallas',
    title: '31. Encontrar un Circuito Abierto',
    difficulty: 'Principiante',
    objective: 'Localizar un conductor interrumpido o borne desconectado que impide el encendido de la luminaria.',
    description: 'Un circuito abierto es una discontinuidad física (cable cortado, borne flojo o llave rota). No circula corriente (I = 0) y la carga permanece inoperativa.',
    componentsNeeded: ['Fuente AC', 'Interruptor', 'Luminaria con cable desconectado'],
    instructions: [
      '1. Revisa el trazado del circuito entre el interruptor y la luminaria.',
      '2. Identifica el tramo faltante y tiende el conductor correspondiente.',
      '3. Verifica que la lámpara vuelva a encender.',
    ],
    hints: ['Sigue el camino del Neutro y del Retorno para encontrar dónde se interrumpe la corriente.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('interruptor_simple', 280, 200), sym('luminaria', 480, 200)],
      wires: [
        { id: 'w31_1', floorId: 'floor_1', circuitId: 'C1', type: 'fase', fromComponentId: 'sym_fuente_ac_1', fromTerminalId: 'L', toComponentId: 'sym_interruptor_simple_1', toTerminalId: 'L', color: '#854d0e', crossSectionMm2: 1.5, lengthMeters: 2 },
      ],
    },
    solutionCheck: (_project, sim) => {
      const lamp = _project.symbols.find((s) => s.type === 'luminaria');
      if (lamp && (sim.activeLamps.has(lamp.id) || sim.energizedComponents.has(lamp.id))) {
        return { passed: true, feedback: '¡Circuito abierto localizado y reparado! Continuidad eléctrica restablecida.' };
      }
      return { passed: false, feedback: 'La luminaria aún no enciende. Conecta el retorno y el neutro faltantes.' };
    },
  },

  {
    id: 32,
    category: 'diagnostico',
    categoryName: 'E. Diagnóstico de Fallas',
    title: '32. Localizar una Conexión Incorrecta entre Terminales (Interruptor en Neutro)',
    difficulty: 'Intermedio',
    objective: 'Corregir la falla reglamentaria de colocar la tecla de comando sobre el conductor Neutro.',
    description: 'Si se interrumpe el Neutro en vez de la Fase, la lámpara apagada sigue teniendo 220V vivos en su portalámparas, lo que provoca electrocuciones letales al cambiar el foco.',
    componentsNeeded: ['Fuente AC', 'Interruptor sobre Neutro (Incorrecto)', 'Luminaria'],
    instructions: [
      '1. Elimina la conexión del interruptor sobre el neutro.',
      '2. Conecta la Fase a través del interruptor y lleva el Neutro directo a la lámpara.',
      '3. Verifica que el aviso de peligro normativo desaparezca.',
    ],
    hints: ['La Fase es el conductor que debe ser seccionado mecánicamente por el comando.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('interruptor_simple', 280, 200), sym('luminaria', 480, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const wrongSwitch = sim.diagnostics.some((d) => d.id.includes('diag_sw_neutro'));
      if (!wrongSwitch) {
        return { passed: true, feedback: '¡Falla corregida! El interruptor ahora secciona correctamente la Fase viva.' };
      }
      return { passed: false, feedback: 'El interruptor aún se encuentra instalado sobre el conductor neutro.' };
    },
  },

  {
    id: 33,
    category: 'diagnostico',
    categoryName: 'E. Diagnóstico de Fallas',
    title: '33. Investigar una Sobrecarga Eléctrica',
    difficulty: 'Intermedio',
    objective: 'Detectar cuando la corriente demandada Ib supera la corriente admisible Iz del cable, recalentando la aislación.',
    description: 'Al conectar demasiados electrodomésticos de calor (estufas, pavas eléctricas, planchas) a un mismo circuito, la corriente se eleva por encima de los límites térmicos del PVC (70°C).',
    componentsNeeded: ['Fuente AC', 'Térmica 10A', 'Tomas con cargas simultáneas'],
    instructions: [
      '1. Comprueba en la simulación que la corriente exceda los 10A de la protección.',
      '2. Redistribuye las cargas o amplía el circuito a TUG de 16A con cable de 2.5 mm².',
    ],
    hints: ['Una sobrecarga sostenida terminará disparando la lámina bimetálica de la térmica.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 280, 200), sym('tomacorriente', 460, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Sobrecarga diagnosticada y mitigada exitosamente!' };
    },
  },

  {
    id: 34,
    category: 'diagnostico',
    categoryName: 'E. Diagnóstico de Fallas',
    title: '34. Interpretar un Escenario de Cortocircuito Simulado',
    difficulty: 'Intermedio',
    objective: 'Identificar un puente accidental entre Fase y Neutro y eliminarlo para evitar disparos magnéticos.',
    description: 'Un cortocircuito franco ocurre cuando dos conductores activos de polaridad opuesta se tocan sin carga intercalada (resistencia casi nula R ≈ 0). La corriente sube instantáneamente a miles de amperios.',
    componentsNeeded: ['Fuente AC', 'Térmica', 'Puente de Corto'],
    instructions: [
      '1. Localiza el cable indebido que une Fase con Neutro directamente.',
      '2. Elimina el cable de cortocircuito.',
      '3. Verifica que la simulación vuelva a operar normalmente.',
    ],
    hints: ['La Fase nunca debe unirse directamente al Neutro sin pasar por la impedancia de una carga.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('caja_paso', 300, 200), sym('luminaria', 500, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      if (!sim.hasShortCircuit) {
        return { passed: true, feedback: '¡Cortocircuito resuelto! El circuito opera en condiciones nominales de seguridad.' };
      }
      return { passed: false, feedback: 'Aún existe un cortocircuito entre Fase y Neutro en la instalación.' };
    },
  },

  {
    id: 35,
    category: 'diagnostico',
    categoryName: 'E. Diagnóstico de Fallas',
    title: '35. Detectar una Conexión de Protección a Tierra Ausente en el Modelo',
    difficulty: 'Principiante',
    objective: 'Auditar los tomacorrientes del plano e identificar cuáles carecen de borne PE conectado.',
    description: 'Un tomacorriente sin conductor PE conectado a la jabalina deja a los artefactos con chasis metálico (heladeras, lavarropas) expuestos a fugas eléctricas peligrosas para las personas.',
    componentsNeeded: ['Jabalina PAT', 'Tomacorrientes'],
    instructions: [
      '1. Identifica los tomas que carecen del conductor verde-amarillo.',
      '2. Conéctalos a la línea de tierra equipotencial.',
      '3. Comprueba que el diagnóstico de "Toma sin tierra" desaparezca.',
    ],
    hints: ['Todo tomacorriente IRAM 2071 debe tener sus 3 bornes (Fase, Neutro, Tierra) cableados.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('puesta_tierra', 100, 320), sym('tomacorriente', 360, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const missingPe = sim.diagnostics.some((d) => d.id.includes('diag_toma_no_pe'));
      if (!missingPe) {
        return { passed: true, feedback: '¡Protección equipotencial completada! Todos los tomas disponen de tierra.' };
      }
      return { passed: false, feedback: 'Aún quedan tomacorrientes sin conexión a tierra.' };
    },
  },

  {
    id: 36,
    category: 'diagnostico',
    categoryName: 'E. Diagnóstico de Fallas',
    title: '36. Investigar una Caída de Tensión Excesiva',
    difficulty: 'Intermedio',
    objective: 'Solucionar un problema de caída de tensión superior al 3% en una línea larga aumentando la sección del conductor.',
    description: 'Si una línea de 40 metros alimenta una carga con cable fino de 1.5 mm², la resistencia ohmica provoca que a la carga le lleguen 205 V en vez de 220 V, causando parpadeo y mal funcionamiento.',
    componentsNeeded: ['Fuente AC', 'Línea de 40 metros', 'Carga'],
    instructions: [
      '1. Evalúa la caída de tensión en el panel de cálculos.',
      '2. Cambia la sección del cable a 2.5 mm² o 4 mm².',
      '3. Verifica que la caída baje por debajo del 3% reglamentario.',
    ],
    hints: ['Al duplicar la sección del conductor, la resistencia y la caída de tensión se reducen a la mitad.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('toma_especial', 400, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Caída de tensión corregida! Tensión en bornes de carga estabilizada.' };
    },
  },

  {
    id: 37,
    category: 'diagnostico',
    categoryName: 'E. Diagnóstico de Fallas',
    title: '37. Corregir un Circuito que no Enciende una Luminaria',
    difficulty: 'Principiante',
    objective: 'Revisar la continuidad y el estado del interruptor basculante para encender la luz.',
    description: 'Un circuito bien cableado no encenderá si la tecla de comando se encuentra en estado abierto o si la protección termomagnética se encuentra disparada.',
    componentsNeeded: ['Fuente AC', 'Térmica', 'Interruptor Simple', 'Luminaria'],
    instructions: [
      '1. Verifica que los conductores estén bien orientados a los bornes.',
      '2. Haz clic sobre la tecla del interruptor para cerrarlo.',
      '3. Comprueba que la luminaria brille.',
    ],
    hints: ['Haz clic sobre el símbolo del interruptor para alternar su estado entre abierto y cerrado.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 260, 200), sym('interruptor_simple', 400, 200), sym('luminaria', 540, 200)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      const lamp = _project.symbols.find((s) => s.type === 'luminaria');
      if (lamp && sim.activeLamps.has(lamp.id)) {
        return { passed: true, feedback: '¡Luminaria encendida! Tecla accionada y circuito energizado correctamente.' };
      }
      return { passed: false, feedback: 'La lámpara aún no está encendida. Revisa el cableado y acciona la tecla.' };
    },
  },

  {
    id: 38,
    category: 'diagnostico',
    categoryName: 'E. Diagnóstico de Fallas',
    title: '38. Investigar una Protección Inadecuada según los Datos Disponibles',
    difficulty: 'Avanzado',
    objective: 'Reemplazar un fusible o interruptor de valor arbitrario por una protección calibrada según corriente de proyecto.',
    description: 'Las protecciones nunca deben sobredimensionarse "para que no salte". Si salta, es porque está cumpliendo su función de evitar un desastre mayor.',
    componentsNeeded: ['Tablero', 'Térmica C32 (Inadecuada)', 'Cable 2.5 mm²'],
    instructions: [
      '1. Detecta la inconsistencia entre la térmica de 32A y el cable de 2.5 mm².',
      '2. Modifica la protección a 16A Curva C.',
    ],
    hints: ['La capacidad admisible del cable fija el límite máximo de la térmica.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('termica', 280, 200), sym('tomacorriente', 460, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Protección calibrada con precisión según la normativa AEA 90364!' };
    },
  },

  // =========================================================================
  // CATEGORÍA F: TALLERES Y PROYECTOS INTEGRALES (39 a 45)
  // =========================================================================
  {
    id: 39,
    category: 'talleres',
    categoryName: 'F. Talleres y Proyectos Integrales',
    title: '39. Diseñar la Instalación de un Taller Pequeño',
    difficulty: 'Avanzado',
    objective: 'Proyectar circuitos de iluminación industrial, tomas de uso especial y tablero con corte de emergencia.',
    description: 'Los talleres mecánicos y de carpintería requieren iluminación reforzada anti-sombras, paradas de emergencia en tablero y tomas reforzados con canaleta metálica o cañería a la vista.',
    componentsNeeded: ['Tablero con Parada de Emergencia', 'Circuitos TUE', 'Luminarias Industriales'],
    instructions: [
      '1. Ubica el tablero principal en zona accesible sin obstrucciones.',
      '2. Tiende los circuitos de fuerza motriz e iluminación independiente.',
      '3. Conecta la puesta a tierra a todas las masas metálicas.',
    ],
    hints: ['En talleres se recomienda cañería rígida de acero o PVC semipesado contra impactos.'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('luminaria', 300, 160), sym('toma_especial', 300, 260)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Taller diseñado! Cumple con los requisitos de robustez mecánica y seguridad eléctrica.' };
    },
  },

  {
    id: 40,
    category: 'talleres',
    categoryName: 'F. Talleres y Proyectos Integrales',
    title: '40. Diseñar una Instalación con Bomba de Agua',
    difficulty: 'Avanzado',
    objective: 'Implementar el circuito de alimentación y automatización de bomba con flotantes de tanque y cisterna.',
    description: 'La bomba de elevación de agua debe contar con comando manual/automático y circuito de baja tensión de seguridad (24V) en los flotantes automáticos para evitar electrificar el agua del tanque.',
    componentsNeeded: ['Tablero con Guardamotor', 'Bomba de Agua', 'Tomacorriente Especial'],
    instructions: [
      '1. Alimenta la bomba a través del circuito dedicado.',
      '2. Asegura la conexión a tierra del motor para derivar cualquier pérdida de aislación.',
    ],
    hints: ['Los motores de bombas deben llevar protección térmica contra sobrecarga mecánica (rotor trabado).'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('toma_especial', 380, 200), sym('puesta_tierra', 380, 320)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Instalación de bombeo aprobada! Masa del motor protegida contra descargas al agua.' };
    },
  },

  {
    id: 41,
    category: 'talleres',
    categoryName: 'F. Talleres y Proyectos Integrales',
    title: '41. Planificar Circuitos para un Compresor y Herramientas de Taller',
    difficulty: 'Avanzado',
    objective: 'Coordinar la alimentación de compresores de aire (arranque bajo carga) con herramientas portátiles.',
    description: 'Los compresores de pistón arrancan contra contrapresión en el cabezal, demandando una corriente de pico elevada. Requieren circuito exclusivo con conductores de al menos 4 mm².',
    componentsNeeded: ['Tablero', 'Toma Especial 20A', 'Tomas de Banco'],
    instructions: [
      '1. Separa el compresor en un circuito independiente de las herramientas manuales.',
      '2. Verifica que las herramientas no sufran caídas de tensión al arrancar el compresor.',
    ],
    hints: ['Utiliza térmicas de Curva D para soportar el arranque del compresor sin disparos intempestivos.'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('toma_especial', 340, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Circuito de compresor y banco de trabajo coordinado exitosamente!' };
    },
  },

  {
    id: 42,
    category: 'talleres',
    categoryName: 'F. Talleres y Proyectos Integrales',
    title: '42. Analizar una Instalación Trifásica con Varias Cargas',
    difficulty: 'Avanzado',
    objective: 'Gestionar una red trifásica mixta: motores trifásicos a 380V y circuitos monofásicos a 220V entre fase y neutro.',
    description: 'En instalaciones mixtas conviven cargas de 380V (L1-L2-L3) sin neutro y circuitos de 220V (L1-N, L2-N, L3-N). Mantener el neutro con sección idéntica a las fases es requisito indispensable según AEA.',
    componentsNeeded: ['Tablero Trifásico Tetrapolar', 'Cargas Trifásicas', 'Cargas Monofásicas'],
    instructions: [
      '1. Conecta el motor trifásico a las 3 fases.',
      '2. Conecta las luces entre una fase y el neutro.',
      '3. Verifica que la tensión nominal sea la adecuada para cada equipo.',
    ],
    hints: ['Tensión entre fases = 380V. Tensión entre cualquier fase y neutro = 220V.'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('luminaria', 340, 160), sym('toma_especial', 340, 260)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Red trifásica mixta configurada con absoluta rigurosidad técnica!' };
    },
  },

  {
    id: 43,
    category: 'talleres',
    categoryName: 'F. Talleres y Proyectos Integrales',
    title: '43. Elaborar un Proyecto Residencial Completo',
    difficulty: 'Avanzado',
    objective: 'Integrar plano CAD, arquitectura, circuitos IUG/TUG, tablero general y puesta a tierra en una vivienda de 2 ambientes.',
    description: 'El proyecto eléctrico integral combina el cálculo de bocas mínimas por ambiente, el trazado de cañerías por losa y pared, el cálculo de secciones y la memoria descriptiva para su aprobación municipal.',
    componentsNeeded: ['Habitaciones', 'Tablero Seccional', 'Bocas IUG', 'Bocas TUG', 'Puesta a Tierra'],
    instructions: [
      '1. Distribuye bocas en estar, dormitorio, cocina y baño.',
      '2. Centraliza los circuitos en el tablero seccional.',
      '3. Conecta el sistema PAT con jabalina.',
      '4. Comprueba que no queden fallas activas.',
    ],
    hints: ['Revisa que cada ambiente cumpla con los puntos mínimos de utilización (PMU).'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('luminaria', 300, 160), sym('tomacorriente', 300, 260), sym('puesta_tierra', 120, 320)],
      wires: [],
    },
    solutionCheck: (project, sim) => {
      if (project.symbols.length >= 4 && !sim.hasShortCircuit) {
        return { passed: true, feedback: '¡Proyecto residencial integral completado y validado según AEA 90364!' };
      }
      return { passed: false, feedback: 'Verifica la integridad de las conexiones de la vivienda.' };
    },
  },

  {
    id: 44,
    category: 'talleres',
    categoryName: 'F. Talleres y Proyectos Integrales',
    title: '44. Preparar un Informe Técnico y una Lista de Materiales (BOM)',
    difficulty: 'Avanzado',
    objective: 'Generar el cómputo de materiales: metros de caño, metros de cable por color/sección, módulos y gabinetes.',
    description: 'Un buen proyecto técnico culmina en el presupuesto y cómputo de materiales exacto para que el instalador adquiera los elementos sin sobrantes ni faltantes que demoren la obra.',
    componentsNeeded: ['Tablero', 'Circuitos Cableados', 'Cómputo'],
    instructions: [
      '1. Revisa los metros calculados de cable marrón, celeste y verde-amarillo.',
      '2. Verifica las cantidades de llaves térmicas y cajas en la lista de materiales.',
    ],
    hints: ['Recuerda considerar un 10% a 15% de holgura de cable para borneras y empalmes.'],
    initialProject: {
      symbols: [sym('tablero', 120, 200), sym('luminaria', 300, 200), sym('tomacorriente', 460, 200)],
      wires: [],
    },
    solutionCheck: () => {
      return { passed: true, feedback: '¡Cómputo métrico y lista de materiales generada profesionalmente!' };
    },
  },

  {
    id: 45,
    category: 'talleres',
    categoryName: 'F. Talleres y Proyectos Integrales',
    title: '45. Resolver un Proyecto Integral con Varias Fallas Deliberadas',
    difficulty: 'Avanzado',
    objective: 'Diagnosticar y reparar una instalación completa que contiene cortocircuito, fuga a tierra y falta de neutro.',
    description: 'En este desafío final de graduación técnica, pondrás a prueba todo lo aprendido: auditarás el plano en 2D y 3D, localizarás las anomalías con el motor de simulación y restablecerás la seguridad total de la vivienda.',
    componentsNeeded: ['Tablero', 'Luminarias', 'Tomacorrientes', 'Jabalina'],
    instructions: [
      '1. Abre la simulación y consulta la lista de diagnósticos activos.',
      '2. Elimina los puentes en cortocircuito y restaura los neutros interrumpidos.',
      '3. Asegura la conexión a tierra de todas las masas metálicas.',
      '4. Verifica que todos los circuitos queden limpios de alertas.',
    ],
    hints: ['Procede metódicamente: primero elimina cortocircuitos, luego conecta tierras y finalmente verifica comandos.'],
    initialProject: {
      symbols: [sym('fuente_ac', 100, 200), sym('tablero', 260, 200), sym('luminaria', 440, 160), sym('tomacorriente', 440, 260), sym('puesta_tierra', 260, 340)],
      wires: [],
    },
    solutionCheck: (_project, sim) => {
      if (!sim.hasShortCircuit && sim.diagnostics.filter((d) => d.level === 'error').length === 0) {
        return { passed: true, feedback: '¡MAESTRÍA ELECTROTÉCNICA DEMOSTRADA! Todas las fallas del proyecto han sido diagnosticadas y resueltas con rigor normativo.' };
      }
      return { passed: false, feedback: 'Aún quedan fallas o alertas críticas en el modelo. Revisa la barra de diagnósticos.' };
    },
  },
];
