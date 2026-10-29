/**
 * ELECTRA PLAN — Módulo de Explicaciones Visuales y Animaciones Interactivas
 * Enseña los principios fundamentales de la electricidad de forma intuitiva, visual y con cuestionarios.
 */
import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Zap,
  Flame,
  ShieldCheck,
  Activity,
  Layers,
  Volume2,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  subtitle: string;
  category: 'basico' | 'seguridad' | 'fallas';
  steps: {
    title: string;
    description: string;
    subtitles: string;
    flowState: 'normal' | 'short_circuit' | 'ground_leakage' | 'overload' | 'off';
  }[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

const LESSONS: Lesson[] = [
  {
    id: 'flujo_basico',
    title: '1. Circulación de Corriente y Circuito Cerrado',
    subtitle: 'El viaje de los electrones desde la fase hasta el neutro a través de la lámpara.',
    category: 'basico',
    steps: [
      {
        title: 'Circuito Abierto (Interruptor Desconectado)',
        description: 'La tensión eléctrica (220V) está presente en el borne de fase de la tecla, pero el aire impide el paso de electrones. La lámpara permanece apagada.',
        subtitles: 'Cuando la tecla está abierta, no existe camino continuo. La corriente es exactamente 0 Amperes.',
        flowState: 'off',
      },
      {
        title: 'Cierre del Contacto (Tecla Accionada)',
        description: 'Las láminas metálicas de la tecla se tocan, cerrando el circuito. Se establece una diferencia de potencial.',
        subtitles: 'Al cerrarse el interruptor, el potencial eléctrico empuja a los electrones libres a través del filamento.',
        flowState: 'normal',
      },
      {
        title: 'Transformación de Energía en la Carga',
        description: 'La corriente atraviesa la lámpara, transformando energía eléctrica en luz y calor. La corriente regresa a la fuente por el conductor celeste de neutro.',
        subtitles: 'La misma corriente que entra por la Fase sale por el Neutro hacia la red eléctrica.',
        flowState: 'normal',
      },
    ],
    quiz: [
      {
        question: '¿Por qué la tecla de luz debe cortar siempre el conductor de FASE y nunca el NEUTRO?',
        options: [
          'Para que al apagar la tecla no quede tensión viva en el portalámparas, evitando electrocuciones al cambiar el foco.',
          'Porque el neutro tiene más potencia que la fase.',
          'Para que la lámpara consuma la mitad de energía.',
        ],
        correctIndex: 0,
        explanation: 'Por norma AEA 90364-771, cortar la fase garantiza que la lámpara quede a potencial 0V al abrir el interruptor.',
      },
      {
        question: '¿Qué color de conductor exige la norma IRAM 2183 para el Neutro?',
        options: ['Marrón o Negro', 'Celeste claro', 'Verde con franja amarilla'],
        correctIndex: 1,
        explanation: 'El color celeste claro es exclusivo e inalterable para el conductor neutro en toda la Argentina.',
      },
    ],
  },
  {
    id: 'cortocircuito',
    title: '2. Qué ocurre en un Cortocircuito Franco',
    subtitle: 'Unión directa entre Fase y Neutro con resistencia cercana a cero.',
    category: 'fallas',
    steps: [
      {
        title: 'Ley de Ohm: I = V / R',
        description: 'En funcionamiento normal, la resistencia de la lámpara limita la corriente (ej. 220V / 2200Ω = 0.1A).',
        subtitles: 'La impedancia de los artefactos mantiene la corriente en valores seguros y calculados.',
        flowState: 'normal',
      },
      {
        title: 'Contacto Accidental Directo',
        description: 'Si la fase toca el neutro directamente, la resistencia cae a fracciones de Ohm (R ≈ 0.2Ω). La corriente se dispara a miles de amperes en microsegundos.',
        subtitles: 'La corriente de cortocircuito supera los 1500 a 4500 Amperes casi instantáneamente.',
        flowState: 'short_circuit',
      },
      {
        title: 'Disparo Magnético de la Térmica (PIA)',
        description: 'La bobina electromagnética interna de la llave termomagnética detecta el pulso violento de corriente y abre los contactos en menos de 20 milisegundos.',
        subtitles: 'El disparo magnético ultrarrápido salva a los cables de prenderse fuego.',
        flowState: 'off',
      },
    ],
    quiz: [
      {
        question: '¿Qué mecanismo de la termomagnética actúa ante un cortocircuito franco?',
        options: [
          'La bobina electromagnética de disparo instantáneo (< 20 ms).',
          'La lámina bimetálica por calentamiento lento (minutos).',
          'El botón de prueba Test mensual.',
        ],
        correctIndex: 0,
        explanation: 'El disparo magnético está diseñado para cortar sobrecorrientes extremas en milisegundos antes del daño térmico.',
      },
    ],
  },
  {
    id: 'diferencial_salvavidas',
    title: '3. El Disyuntor Diferencial: Cómo salva vidas',
    subtitle: 'Detección de corrientes de fuga a tierra de apenas 30 miliamperes.',
    category: 'seguridad',
    steps: [
      {
        title: 'Equilibrio de Corrientes (IFase = INeutro)',
        description: 'El disyuntor posee un toroide sensor magnético. La corriente que entra por la fase debe ser idéntica a la que sale por el neutro. El flujo magnético resultante es cero.',
        subtitles: 'En condición normal: IFase - INeutro = 0. El interruptor permanece cerrado.',
        flowState: 'normal',
      },
      {
        title: 'Contacto Accidental o Fuga a Masa',
        description: 'Una persona toca una carcasa con pérdida de aislación. Una parte diminuta de la corriente (30 mA) se desvía por el cuerpo o por el cable de tierra verde-amarillo hacia la jabalina.',
        subtitles: 'Ahora IFase > INeutro. Aparece una corriente residual diferencial IΔn.',
        flowState: 'ground_leakage',
      },
      {
        title: 'Disparo Diferencial Ultrarrápido',
        description: 'El toroide induce tensión en el relé de disparo, abriendo el circuito en menos de 30 ms, evitando la fibrilación ventricular cardíaca.',
        subtitles: 'El disyuntor de 30mA es el único dispositivo que previene la muerte por electrocución.',
        flowState: 'off',
      },
    ],
    quiz: [
      {
        question: '¿A qué valor de corriente de fuga está calibrado el disyuntor hogareño estándar?',
        options: ['30 mA (0.030 Amperes)', '10 Amperes', '300 Amperes'],
        correctIndex: 0,
        explanation: '30 mA es el umbral normativo mundial para evitar que la corriente provoque fibrilación ventricular en el corazón humano.',
      },
    ],
  },
];

export const VisualExplanationsView: React.FC = () => {
  const [activeLessonId, setActiveLessonId] = useState<string>('flujo_basico');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState<boolean>(false);

  const activeLesson = LESSONS.find((l) => l.id === activeLessonId) || LESSONS[0];
  const currentStep = activeLesson.steps[currentStepIdx] || activeLesson.steps[0];

  // Temporizador para avance automático en modo reproducción
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIdx((prev) => (prev + 1) % activeLesson.steps.length);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeLesson.steps.length]);

  const handleSelectLesson = (id: string) => {
    setActiveLessonId(id);
    setCurrentStepIdx(0);
    setQuizAnswers({});
    setShowQuizResults(false);
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Encabezado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                DIDÁCTICA VISUAL INTERACTIVA
              </span>
              <span className="text-xs text-slate-400 font-mono">Electricidad Explicada Paso a Paso</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <span>Explicaciones Visuales y Animaciones Eléctricas</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Observa el comportamiento físico de la corriente, las fallas y cómo actúan las protecciones en tiempo real.
            </p>
          </div>
        </div>

        {/* Pestañas de Lecciones */}
        <div className="flex items-center overflow-x-auto gap-2 mt-4 pt-3 border-t border-slate-800">
          {LESSONS.map((lesson) => (
            <button
              key={lesson.id}
              onClick={() => handleSelectLesson(lesson.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeLessonId === lesson.id
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{lesson.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visor de Animación Eléctrica */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                Paso {currentStepIdx + 1} de {activeLesson.steps.length}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">{currentStep.title}</h2>
            </div>

            {/* Controles de reproducción */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
              </button>
              <button
                onClick={() => setCurrentStepIdx(0)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                title="Reiniciar lección"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Lienzo SVG Animado */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-64 sm:h-72 flex items-center justify-center">
            <svg viewBox="0 0 600 240" className="w-full h-full">
              {/* Fuente de Red 220V */}
              <rect x="30" y="70" width="70" height="100" rx="8" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
              <text x="65" y="115" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="bold">RED</text>
              <text x="65" y="135" textAnchor="middle" fill="#60a5fa" fontSize="10" fontFamily="monospace">220V AC</text>

              {/* Cable de Fase (Marrón) Superior */}
              <line
                x1="100"
                y1="95"
                x2="220"
                y2="95"
                stroke="#854d0e"
                strokeWidth="5"
                strokeDasharray={currentStep.flowState === 'normal' || currentStep.flowState === 'short_circuit' ? '8 4' : undefined}
                className={currentStep.flowState === 'normal' || currentStep.flowState === 'short_circuit' ? 'animate-pulse' : ''}
              />

              {/* Interruptor / Protección */}
              <rect x="220" y="75" width="60" height="40" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1.5" />
              <text x="250" y="98" textAnchor="middle" fill="#fcd34d" fontSize="9" fontWeight="bold">
                {activeLesson.id === 'cortocircuito' ? 'PIA C16' : 'TECLA S1'}
              </text>

              {/* Contacto móvil */}
              {currentStep.flowState === 'off' ? (
                <line x1="235" y1="95" x2="260" y2="82" stroke="#e2e8f0" strokeWidth="3" />
              ) : (
                <line x1="235" y1="95" x2="265" y2="95" stroke="#22c55e" strokeWidth="3" />
              )}

              {/* Cable hacia la carga */}
              <line
                x1="280"
                y1="95"
                x2="450"
                y2="95"
                stroke="#854d0e"
                strokeWidth="5"
                strokeDasharray={currentStep.flowState === 'normal' ? '8 4' : undefined}
              />

              {/* Carga / Lámpara */}
              <g transform="translate(450, 60)">
                <circle
                  cx="35"
                  cy="35"
                  r="25"
                  fill={currentStep.flowState === 'normal' ? '#fef08a' : '#1e293b'}
                  stroke={currentStep.flowState === 'normal' ? '#eab308' : '#475569'}
                  strokeWidth="2.5"
                  filter={currentStep.flowState === 'normal' ? 'drop-shadow(0 0 12px #facc15)' : undefined}
                />
                <path d="M 22 22 L 48 48 M 48 22 L 22 48" stroke={currentStep.flowState === 'normal' ? '#ca8a04' : '#64748b'} strokeWidth="2.5" />
                <text x="35" y="75" textAnchor="middle" fill="#94a3b8" fontSize="10">Lámpara (L1)</text>
              </g>

              {/* Retorno de Neutro (Celeste) Inferior */}
              <line
                x1="450"
                y1="145"
                x2="100"
                y2="145"
                stroke="#0284c7"
                strokeWidth="5"
                strokeDasharray={currentStep.flowState === 'normal' ? '8 4' : undefined}
              />
              <line x1="485" y1="120" x2="485" y2="145" stroke="#0284c7" strokeWidth="5" />

              {/* Efecto de cortocircuito con chispas */}
              {currentStep.flowState === 'short_circuit' && (
                <g transform="translate(340, 120)">
                  <circle cx="0" cy="0" r="22" fill="#ef4444" opacity="0.4" className="animate-ping" />
                  <path d="M -10 -15 L 0 -5 L 8 -18 L 14 0 L 2 8 L 10 18 L -6 6 Z" fill="#facc15" stroke="#ef4444" strokeWidth="1.5" />
                  <text x="0" y="32" textAnchor="middle" fill="#ef4444" fontSize="11" fontWeight="bold">
                    ¡CORTOCIRCUITO! I &gt; 2000A
                  </text>
                </g>
              )}

              {/* Efecto de fuga a tierra */}
              {currentStep.flowState === 'ground_leakage' && (
                <g transform="translate(485, 170)">
                  <line x1="0" y1="-25" x2="0" y2="20" stroke="#16a34a" strokeWidth="3" strokeDasharray="4 2" />
                  <text x="0" y="35" textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">
                    Fuga a tierra &gt; 30 mA
                  </text>
                </g>
              )}
            </svg>

            {/* Subtítulo dinámico con locución */}
            <div className="absolute bottom-2 left-3 right-3 bg-slate-900/90 border border-slate-700/80 px-3 py-2 rounded-lg text-xs text-slate-200 flex items-center gap-2 backdrop-blur-xs">
              <Volume2 className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
              <span className="font-mono text-[11px] leading-tight">{currentStep.subtitles}</span>
            </div>
          </div>

          {/* Explicación textual del paso */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-bold text-amber-400 block">Detalle técnico:</span>
            <p className="leading-relaxed">{currentStep.description}</p>
          </div>
        </div>

        {/* Columna Derecha: Cuestionario de Comprensión */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              <span>Autoevaluación de Aprendizaje</span>
            </div>
            <p className="text-xs text-slate-400">
              Responde las preguntas para afianzar tus conocimientos antes de diseñar en el plano:
            </p>

            <div className="space-y-4 pt-1">
              {activeLesson.quiz.map((q, qIdx) => {
                const selectedOpt = quizAnswers[qIdx];
                const isAnswered = selectedOpt !== undefined;
                const isCorrect = selectedOpt === q.correctIndex;

                return (
                  <div key={qIdx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <p className="font-bold text-slate-200">{q.question}</p>
                    <div className="space-y-1.5">
                      {q.options.map((opt, optIdx) => {
                        const isChosen = selectedOpt === optIdx;
                        let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

                        if (showQuizResults && isChosen) {
                          btnStyle = isCorrect
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-red-500/20 border-red-500 text-red-300 font-bold';
                        } else if (isChosen) {
                          btnStyle = 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                            className={`w-full text-left p-2 rounded-lg border text-[11px] transition-all ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    {showQuizResults && (
                      <div
                        className={`p-2 rounded text-[11px] leading-tight ${
                          isCorrect ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'
                        }`}
                      >
                        {isCorrect ? '✓ ¡Correcto!' : '✗ Incorrecto.'} {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setShowQuizResults(true)}
            className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>Verificar Respuestas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
