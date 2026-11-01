/**
 * ELECTRA PLAN — Desafíos y Evaluaciones Técnicas (Fase 10)
 * Entorno de exámenes interactivos y resolución de averías para electricistas.
 * Incluye:
 * 1. Casos de avería real con mediciones instrumentales y síntomas.
 * 2. Evaluación de conocimientos en normativa AEA 90364-771 e IRAM.
 * 3. Retroalimentación inmediata con justificación física de cada respuesta.
 * 4. Puntuación reglamentaria (escala 1 a 10).
 * 5. Emisión de Certificado de Acreditación de Competencias Eléctricas para calificaciones ≥ 7.
 */
import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Printer,
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Project } from '../types/electra';

interface TechnicalChallengesViewProps {
  project: Project;
}

interface ChallengeCase {
  id: string;
  title: string;
  category: 'falla_seguridad' | 'normativa_aea' | 'dimensionamiento' | 'mediciones';
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  symptom: string;
  measurements: string[];
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

const CHALLENGES_DATABASE: ChallengeCase[] = [
  {
    id: 'caso_1',
    title: 'Disparo Intempestivo del Diferencial al Llover',
    category: 'falla_seguridad',
    difficulty: 'Intermedio',
    symptom: 'El disyuntor diferencial de 30mA dispara automáticamente cada vez que llueve copiosamente, dejando sin luz toda la vivienda.',
    measurements: [
      'Tensión L-N: 224 VAC',
      'Corriente de fuga con pinza de fuga en el tablero: 38 mA en el circuito C3 (Quincho y Jardín)',
      'Resistencia de aislamiento entre Fase y Tierra en C3: 0.08 MΩ (muy inferior al mínimo de 0.5 MΩ)',
    ],
    question: '¿Cuál es el procedimiento técnico correcto y prioritario para resolver la falla?',
    options: [
      {
        id: 'c1_opt1',
        text: 'Reemplazar el disyuntor diferencial de 30mA por uno de 300mA para que no dispare con humedad.',
        isCorrect: false,
        explanation: 'PELIGROSO Y ANTIRREGLAMENTARIO. En viviendas, el diferencial DEBE ser de alta sensibilidad (≤ 30 mA) para proteger la vida humana contra contactos directos e indirectos. Un diferencial de 300 mA es para protección contra incendios industriales y no previene la fibrilación ventricular.',
      },
      {
        id: 'c1_opt2',
        text: 'Desconectar el cable verde-amarillo de tierra en el jardín para evitar que la fuga llegue al tablero.',
        isCorrect: false,
        explanation: 'NEGLIGENCIA GRAVE. Desconectar la tierra deja las carcasas metálicas de las luminarias expuestas a tensión (220V) permanente, con riesgo de electrocución mortal.',
      },
      {
        id: 'c1_opt3',
        text: 'Aislar el circuito exterior C3 mediante un disyuntor dedicado, inspeccionar las cajas de paso de jardín y reemplazar juntas estancas IP65 deterioradas.',
        isCorrect: true,
        explanation: 'CORRECTO. La lluvia humedece una caja o luminaria exterior sin estanqueidad (IP deficiente), derivando más de 30mA a tierra. Subdividir el circuito evita que una fuga exterior corte la luz en toda la casa, y reparar la caja estanca elimina la causa raíz.',
      },
      {
        id: 'c1_opt4',
        text: 'Subir el calibre de la térmica de C3 de 16A a 25A.',
        isCorrect: false,
        explanation: 'INCORRECTO. La térmica solo responde a sobrecargas y cortocircuitos térmicos/magnéticos, no a corrientes de fuga a tierra.',
      },
    ],
  },
  {
    id: 'caso_2',
    title: 'Neutro Cortado en Suministro Trifásico',
    category: 'falla_seguridad',
    difficulty: 'Avanzado',
    symptom: 'En una vivienda con acometida trifásica, al encender el horno eléctrico en una fase, las lámparas de la otra fase brillan intensamente y se quemó la fuente del televisor.',
    measurements: [
      'Tensión medible entre Fase R y Neutro: 145 VAC (subtensión)',
      'Tensión medible entre Fase S y Neutro: 320 VAC (sobretensión destructiva)',
      'Tensión medible entre Fase T y Neutro: 190 VAC',
      'Tensión entre Fases (R-S, S-T, R-T): 380 VAC estable',
    ],
    question: '¿Cuál es la causa electromecánica del fenómeno de sobretensión?',
    options: [
      {
        id: 'c2_opt1',
        text: 'La empresa proveedora de energía envió accidentalmente 380V por el cable neutro.',
        isCorrect: false,
        explanation: 'INCORRECTO. El neutro es el punto estrella del transformador; la empresa no envía tensión por él.',
      },
      {
        id: 'c2_opt2',
        text: 'Interrupción o falso contacto en el conductor Neutro (Neutro flotante), desplazando el baricentro de tensiones según la carga de cada fase.',
        isCorrect: true,
        explanation: 'CORRECTO. Al cortarse el neutro de retorno, las cargas monofásicas de 220V quedan conectadas en serie entre dos fases distintas a 380V. Por divisor de tensión resistivo, la fase con menor consumo recibe tensiones destructivas de hasta 380V.',
      },
      {
        id: 'c2_opt3',
        text: 'Las jabalinas de tierra de la casa tienen demasiada sal y condujeron corriente al televisor.',
        isCorrect: false,
        explanation: 'ABSURDO. La puesta a tierra no causa desplazamiento de neutro.',
      },
      {
        id: 'c2_opt4',
        text: 'Las térmicas monofásicas están colocadas al revés en el riel DIN.',
        isCorrect: false,
        explanation: 'INCORRECTO. La posición física no altera la conexión del neutro.',
      },
    ],
  },
  {
    id: 'caso_3',
    title: 'Dimensión de Circuito para Aire Acondicionado Split',
    category: 'dimensionamiento',
    difficulty: 'Intermedio',
    symptom: 'El cliente instala un equipo de aire acondicionado split frío/calor de 4500 frigorías (potencia eléctrica nominal 1950 W, corriente de arranque pico 22 A). Desea saber cómo proyectar su circuito según AEA 90364-771.',
    measurements: [
      'Tensión de red: 220 VAC',
      'Corriente nominal Ib: 1950W / (220V * 0.9) = 9.85 A',
      'Longitud de la línea desde el tablero: 18 metros',
    ],
    question: '¿Qué tipo de circuito, calibre de térmica y sección de conductor corresponden según norma?',
    options: [
      {
        id: 'c3_opt1',
        text: 'Conectarlo a cualquier toma existente de uso general (TUG) con cable de 1.5 mm² y térmica de 10A.',
        isCorrect: false,
        explanation: 'ANTIRREGLAMENTARIO. La norma AEA prohíbe colgar equipos de aire acondicionado de más de 2500 frigorías en circuitos de uso general comunes.',
      },
      {
        id: 'c3_opt2',
        text: 'Circuito Terminal de Uso Especial (TUE) independiente, conductor de 2.5 mm² mín., tomacorriente de 20A (espiga gruesa) y térmica bipolar C16.',
        isCorrect: true,
        explanation: 'CORRECTO. Según AEA 90364-771, los aires acondicionados deben poseer circuito TUE dedicado con toma de 20A (IRAM 2071 ficha de 20A) o conexión fija, cable de sección mínima 2.5 mm² y térmica C16 para admitir la corriente de inrush sin disparos intempestivos.',
      },
      {
        id: 'c3_opt3',
        text: 'Circuito con cable de 10 mm² y térmica de 40A curva D.',
        isCorrect: false,
        explanation: 'SOBREDIMENSIONADO Y PELIGROSO. Una térmica de 40A no protegerá el equipo ni el borne del enchufe ante una avería interna.',
      },
      {
        id: 'c3_opt4',
        text: 'Colocar un fusible de plomo de 15A en la línea de fase únicamente.',
        isCorrect: false,
        explanation: 'PROHIBIDO. Los fusibles no están permitidos como corte seccional en tableros de inmuebles domiciliarios, y el corte debe ser siempre omnipolar simultáneo (bipolar).',
      },
    ],
  },
  {
    id: 'caso_4',
    title: 'Hormigueo al Tocar el Gabinete del Lavarropas',
    category: 'falla_seguridad',
    difficulty: 'Básico',
    symptom: 'El usuario siente una descarga o cosquilleo en los dedos cada vez que toca el chasis metálico del lavarropas descalzo en el lavadero.',
    measurements: [
      'Tensión medida con multímetro entre el gabinete del lavarropas y una canilla metálica de agua: 110 VAC',
      'Comprobación de espiga de tierra del tomacorriente: el cable verde-amarillo no está conectado en el borne central.',
      'El disyuntor no disparó porque el usuario tenía zapatillas de goma y la corriente de fuga a su cuerpo fue inferior a 10 mA.',
    ],
    question: '¿Por qué existían 110V en el gabinete y cuál es la solución técnica?',
    options: [
      {
        id: 'c4_opt1',
        text: 'El motor está roto y hay que tirarlo.',
        isCorrect: false,
        explanation: 'INCORRECTO. El lavarropas funciona normalmente.',
      },
      {
        id: 'c4_opt2',
        text: 'El filtro antiparasitario EMC interno deriva naturalmente corriente al chasis; al faltar la conexión a tierra (PE), el gabinete flota a la mitad de la tensión de red (110V). Se debe conectar el cable PE al borne central del toma y vincularlo a la jabalina.',
        isCorrect: true,
        explanation: 'CORRECTO. Todos los electrodomésticos modernos con fuentes conmutadas o filtros EMC tienen capacitores en Y conectados entre Fase-Tierra y Neutro-Tierra. Si la puesta a tierra está desconectada, estos capacitores forman un divisor de tensión flotante a 110V. La tierra drena esta corriente de fuga y elimina el peligro.',
      },
      {
        id: 'c4_opt3',
        text: 'Conectar un cable desde el lavarropas hasta el caño de gas.',
        isCorrect: false,
        explanation: 'PROHIBIDO Y MORTAL. Utilizar cañerías de gas como puesta a tierra puede provocar una explosión catastrófica.',
      },
      {
        id: 'c4_opt4',
        text: 'Pintar el lavarropas con esmalte para aislarlo.',
        isCorrect: false,
        explanation: 'INSUFICIENTE. La pintura se raya y no resuelve el peligro de aislamiento.',
      },
    ],
  },
  {
    id: 'caso_5',
    title: 'Coordinación y Capacidad de Ruptura de Protecciones',
    category: 'normativa_aea',
    difficulty: 'Avanzado',
    symptom: 'En un edificio a 15 metros de la cámara transformadora de la distribuidora, se proyecta el tablero seccional general con interruptores termomagnéticos (PIAs).',
    measurements: [
      'Corriente de Cortocircuito Presunta (Icc) calculada en bornes del tablero: 4.800 A (4.8 kA)',
      'Térmicas comunes de bajo costo instaladas: Capacidad de ruptura asignada Icn = 3.000 A (3 kA)',
    ],
    question: '¿Qué riesgo existe con esas térmicas de 3 kA y qué exige la reglamentación?',
    options: [
      {
        id: 'c5_opt1',
        text: 'No hay ningún riesgo porque la corriente nominal es de 16A.',
        isCorrect: false,
        explanation: 'FALSO. La corriente de corto (Icc) es miles de veces mayor que la nominal.',
      },
      {
        id: 'c5_opt2',
        text: 'Ante un cortocircuito franco, la energía superará la capacidad de la cámara de extinción de arco, pudiendo soldarse los contactos o estallar el módulo. Se deben colocar interruptores con poder de corte mínimo Icn ≥ 6 kA (o 4.5 kA según AEA 771).',
        isCorrect: true,
        explanation: 'CORRECTO. La norma AEA 90364-771 exige que el poder de corte nominal (Icn) de los interruptores termomagnéticos sea mayor o igual a la corriente de cortocircuito presunta en el punto de instalación. En Argentina se exige como mínimo 4.5 kA o 6 kA en cercanías de transformadores.',
      },
      {
        id: 'c5_opt3',
        text: 'Se soluciona colocando un disyuntor de 10 mA antes de las térmicas.',
        isCorrect: false,
        explanation: 'INCORRECTO. El diferencial no tiene poder de corte de cortocircuito, debe ser protegido por las térmicas.',
      },
      {
        id: 'c5_opt4',
        text: 'Basta con poner cables de color celeste más grueso.',
        isCorrect: false,
        explanation: 'ABSURDO.',
      },
    ],
  },
];

export const TechnicalChallengesView: React.FC<TechnicalChallengesViewProps> = ({ project }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>('caso_1');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, boolean>>({});
  const [showCertificateModal, setShowCertificateModal] = useState<boolean>(false);
  const [studentName, setStudentName] = useState<string>('Técnico / Estudiante ELECTRA');

  const activeCase = useMemo(
    () => CHALLENGES_DATABASE.find((c) => c.id === selectedCaseId) || CHALLENGES_DATABASE[0],
    [selectedCaseId]
  );

  const handleSelectOption = (optionId: string) => {
    if (submittedAnswers[activeCase.id]) return; // ya enviado
    setSelectedAnswers((prev) => ({ ...prev, [activeCase.id]: optionId }));
  };

  const handleSubmitCase = () => {
    if (!selectedAnswers[activeCase.id]) return;
    setSubmittedAnswers((prev) => ({ ...prev, [activeCase.id]: true }));
  };

  const handleResetChallenge = (caseId: string) => {
    setSelectedAnswers((prev) => {
      const next = { ...prev };
      delete next[caseId];
      return next;
    });
    setSubmittedAnswers((prev) => {
      const next = { ...prev };
      delete next[caseId];
      return next;
    });
  };

  // Puntuación General
  const scoreData = useMemo(() => {
    const total = CHALLENGES_DATABASE.length;
    let correctCount = 0;
    let evaluatedCount = 0;

    CHALLENGES_DATABASE.forEach((c) => {
      if (submittedAnswers[c.id]) {
        evaluatedCount++;
        const chosenId = selectedAnswers[c.id];
        const opt = c.options.find((o) => o.id === chosenId);
        if (opt && opt.isCorrect) {
          correctCount++;
        }
      }
    });

    const grade = evaluatedCount > 0 ? (correctCount / total) * 10 : 0;
    const isApproved = grade >= 7;

    return {
      total,
      correctCount,
      evaluatedCount,
      grade: Number(grade.toFixed(1)),
      isApproved,
    };
  }, [selectedAnswers, submittedAnswers]);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFB] dark:bg-[#0B1319] overflow-y-auto">
      {/* Encabezado */}
      <div className="bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-6 py-5 sticky top-0 z-10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#111827] dark:text-[#E8F0F2]">
                  Desafíos Técnicos y Evaluación de Averías
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                  Casos de Campo Reales
                </span>
              </div>
              <p className="text-xs text-[#5A7184] dark:text-[#8BA2B2]">
                Diagnóstico de fallas ocultas, aplicación rigurosa de AEA 90364-771 y acreditación de competencias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-gray-100 dark:bg-[#1A2833] px-3.5 py-1.5 rounded-xl flex items-center gap-2 text-xs">
              <span className="text-[#5A7184]">Calificación:</span>
              <span
                className={`font-black text-sm ${
                  scoreData.grade >= 7
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : scoreData.grade > 0
                    ? 'text-amber-600'
                    : 'text-gray-500'
                }`}
              >
                {scoreData.grade} / 10
              </span>
            </div>

            {scoreData.isApproved && (
              <button
                onClick={() => setShowCertificateModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all animate-pulse"
              >
                <Award className="w-4 h-4" />
                <span>Ver Certificado Aprobado</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Barra Lateral: Selector de Casos */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-xs font-bold text-[#5A7184] uppercase tracking-wider mb-2">
            Casos de Estudio ({CHALLENGES_DATABASE.length})
          </h2>

          <div className="space-y-1.5">
            {CHALLENGES_DATABASE.map((c, index) => {
              const isSubmitted = submittedAnswers[c.id];
              const chosen = selectedAnswers[c.id];
              const isCorrect = isSubmitted && c.options.find((o) => o.id === chosen)?.isCorrect;
              const isSelected = selectedCaseId === c.id;

              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCaseId(c.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-white dark:bg-[#142028] border-[#167D78] shadow-xs'
                      : 'bg-white/60 dark:bg-[#142028]/60 border-transparent hover:bg-white dark:hover:bg-[#142028]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isSubmitted ? (
                      isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )
                    ) : (
                      <span className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] flex items-center justify-center font-bold text-gray-600 dark:text-gray-300">
                        {index + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold text-[#111827] dark:text-white truncate">
                      {c.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-500">{c.difficulty}</span>
                      <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                        {c.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Banner de progreso */}
          <div className="p-4 bg-white dark:bg-[#142028] rounded-xl border border-[#DCE4E8] dark:border-[#243542] text-xs space-y-2 mt-4">
            <span className="font-bold text-[#111827] dark:text-white block">
              Progreso de Evaluación
            </span>
            <div className="flex justify-between text-[#5A7184] text-[11px]">
              <span>Respondidos: {scoreData.evaluatedCount} / {scoreData.total}</span>
              <span>Aciertos: {scoreData.correctCount}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full transition-all"
                style={{ width: `${(scoreData.evaluatedCount / scoreData.total) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 pt-1">
              Obtenga 7 puntos o más para desbloquear el Certificado Oficial de Acreditación Técnica.
            </p>
          </div>
        </div>

        {/* Panel Central: Contenido del Caso Activo */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-[#142028] p-6 rounded-2xl border border-[#DCE4E8] dark:border-[#243542] space-y-6 shadow-xs">
            {/* Título y Dificultad */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <span className="text-xs uppercase font-bold text-purple-600 dark:text-purple-400 tracking-wider">
                  Caso Clínico de Electricidad
                </span>
                <h2 className="text-lg font-bold text-[#111827] dark:text-white mt-0.5">
                  {activeCase.title}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  Dificultad: {activeCase.difficulty}
                </span>
                {submittedAnswers[activeCase.id] && (
                  <button
                    onClick={() => handleResetChallenge(activeCase.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
                    title="Reintentar este caso"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Síntoma Reportado */}
            <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Síntoma Reportado por el Cliente:
              </span>
              <p className="text-amber-800/90 dark:text-amber-200/90 leading-relaxed">
                "{activeCase.symptom}"
              </p>
            </div>

            {/* Datos de Medición Instrumental */}
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200/60 dark:border-sky-800/40 text-xs space-y-2">
              <span className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                <Activity className="w-4 h-4" /> Ensayos y Mediciones Instrumentales Obtenidas:
              </span>
              <ul className="list-disc list-inside space-y-1 text-sky-800 dark:text-sky-200">
                {activeCase.measurements.map((m, i) => (
                  <li key={i} className="font-mono text-[11px]">
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pregunta */}
            <div>
              <h3 className="text-sm font-bold text-[#111827] dark:text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#167D78]" />
                {activeCase.question}
              </h3>
            </div>

            {/* Opciones de Respuesta */}
            <div className="space-y-3">
              {activeCase.options.map((option) => {
                const isSelected = selectedAnswers[activeCase.id] === option.id;
                const isSubmitted = submittedAnswers[activeCase.id];
                const showExplanation = isSubmitted && isSelected;

                let borderStyle = 'border-gray-200 dark:border-gray-700 hover:border-gray-300';
                let bgStyle = 'bg-white dark:bg-[#142028]';

                if (isSelected && !isSubmitted) {
                  borderStyle = 'border-[#167D78] ring-1 ring-[#167D78]';
                  bgStyle = 'bg-[#E8F5F5]/40 dark:bg-[#1B2B36]/40';
                } else if (isSubmitted) {
                  if (option.isCorrect) {
                    borderStyle = 'border-emerald-500 ring-1 ring-emerald-500';
                    bgStyle = 'bg-emerald-50/60 dark:bg-emerald-950/30';
                  } else if (isSelected && !option.isCorrect) {
                    borderStyle = 'border-red-500 ring-1 ring-red-500';
                    bgStyle = 'bg-red-50/60 dark:bg-red-950/30';
                  }
                }

                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelectOption(option.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${borderStyle} ${bgStyle}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#167D78] bg-[#167D78] text-white'
                              : 'border-gray-400'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-[#111827] dark:text-[#E8F0F2]">
                          {option.text}
                        </p>

                        {/* Explicación Técnica al Enviar */}
                        {isSubmitted && (
                          <div
                            className={`mt-2 p-2.5 rounded-lg text-xs leading-relaxed ${
                              option.isCorrect
                                ? 'bg-emerald-100/70 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200'
                                : 'bg-red-100/70 text-red-900 dark:bg-red-900/40 dark:text-red-200'
                            }`}
                          >
                            <strong>{option.isCorrect ? '✓ FUNDAMENTO: ' : '✗ ERROR TÉCNICO: '}</strong>
                            {option.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Botón de Confirmación de Respuesta */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-xs text-[#5A7184]">
                {submittedAnswers[activeCase.id]
                  ? 'Respuesta evaluada. Puede revisar el fundamento o pasar al siguiente caso.'
                  : 'Seleccione una opción y presione Validar Diagnóstico.'}
              </span>

              {!submittedAnswers[activeCase.id] ? (
                <button
                  onClick={handleSubmitCase}
                  disabled={!selectedAnswers[activeCase.id]}
                  className="px-5 py-2.5 bg-[#167D78] hover:bg-[#12635F] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validar Diagnóstico</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    const currentIndex = CHALLENGES_DATABASE.findIndex((c) => c.id === activeCase.id);
                    if (currentIndex < CHALLENGES_DATABASE.length - 1) {
                      setSelectedCaseId(CHALLENGES_DATABASE[currentIndex + 1].id);
                    }
                  }}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2"
                >
                  <span>Siguiente Caso</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CERTIFICADO DE ACREDITACIÓN DE COMPETENCIAS */}
      {showCertificateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowCertificateModal(false)}
        >
          <div
            className="bg-white dark:bg-[#142028] border-2 border-emerald-500 rounded-2xl max-w-3xl w-full p-8 space-y-6 shadow-2xl relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Marco de Honor */}
            <div className="border-4 border-double border-emerald-600/30 p-8 rounded-xl text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                <Award className="w-9 h-9" />
              </div>

              <div>
                <span className="text-xs uppercase tracking-widest text-[#167D78] font-bold">
                  ELECTRA PLAN — PLATAFORMA DE INGENIERÍA ELÉCTRICA
                </span>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-wider mt-1">
                  Certificado de Acreditación Técnica
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Acreditación de Idoneidad en Diagnóstico de Averías y Reglamentación AEA 90364-771
                </p>
              </div>

              <div className="py-4">
                <p className="text-xs text-gray-500">Se certifica que:</p>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="text-xl font-bold text-center text-[#111827] dark:text-[#2DD4BF] border-b-2 border-emerald-500 bg-transparent py-1 w-full max-w-md mx-auto focus:outline-hidden"
                />
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-3 max-w-lg mx-auto leading-relaxed">
                  Ha resuelto satisfactoriamente la batería de casos prácticos de localización de fallas,
                  coordinación termomagnética, esquema de puesta a tierra y protección diferencial, obteniendo una
                  calificación sobresaliente de:
                </p>
                <div className="text-3xl font-black text-emerald-600 mt-2">
                  {scoreData.grade} / 10 PUNTOS
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-xs">
                <div>
                  <span className="font-bold block text-gray-800 dark:text-gray-200">
                    Comité Técnico Evaluador
                  </span>
                  <span className="text-[10px] text-gray-500">ELECTRA PLAN Engineering Engine</span>
                </div>
                <div>
                  <span className="font-mono text-[11px] block text-gray-700 dark:text-gray-300">
                    ID Verificación: EP-CERT-{Date.now().toString().slice(-8)}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Emisión: {new Date().toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowCertificateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Certificado</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
