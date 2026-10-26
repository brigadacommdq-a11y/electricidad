/**
 * ELECTRA PLAN — Laboratorio de Reconocimiento Físico y Práctica para Principiantes
 * Módulo de aprendizaje progresivo interactivo desde cero:
 * 1. Reconocimiento por aspecto físico real
 * 2. Térmica vs. Disyuntor Diferencial (Botón T, 30 mA, disparos)
 * 3. Identificación de Bornes y Sentido de Conexión (Entrada, Salida, Fase, Neutro)
 * 4. Tomacorriente Argentino IRAM 2071 (Fase a la derecha, Neutro a la izquierda, Tierra abajo)
 * 5. Puesta a Tierra (Jabalina, barra PE y prohibición de corte del conductor de protección)
 */
import React, { useState } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { RealisticCADSymbolSVG } from './cad/RealisticCADSymbolSVG';
import { ElectricalSymbol } from '../types/electra';

interface ExerciseQuestion {
  id: string;
  category: string;
  title: string;
  beginnerContext: string;
  prompt: string;
  componentTypeToRender: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  tip: string;
}

const BEGINNER_EXERCISES: ExerciseQuestion[] = [
  // 1. Térmica vs Diferencial
  {
    id: 'diff_vs_breaker_1',
    category: 'Térmica vs. Disyuntor',
    title: '¿Térmica o Disyuntor Diferencial?',
    beginnerContext:
      'En un tablero eléctrico hay dos aparatos que se parecen mucho porque ambos tienen una palanca. Sin embargo, uno salva los cables y el otro salva tu vida.',
    prompt:
      'Observá el componente de la imagen. Tiene un botón amarillo con una letra "T" y una leyenda que dice "30 mA". ¿De qué aparato se trata?',
    componentTypeToRender: 'diferencial',
    options: [
      {
        id: 'opt_1',
        label: 'Disyuntor Diferencial (protege a las personas contra electrocución)',
        isCorrect: true,
        explanation:
          '¡EXCELENTE! El botón "T" (Test) y el valor "30 mA" son la firma inconfundible del Disyuntor Diferencial. Debe probarse una vez al mes apretando ese botón.',
      },
      {
        id: 'opt_2',
        label: 'Interruptor Termomagnético o Térmica (protege contra sobrecargas)',
        isCorrect: false,
        explanation:
          'Incorrecto. La térmica NO tiene botón de prueba "T". Si ves un botón "T" con una inscripción de "30 mA", es un Disyuntor Diferencial.',
      },
      {
        id: 'opt_3',
        label: 'Transformador reductor de 220V a 12V',
        isCorrect: false,
        explanation:
          'Incorrecto. Es un dispositivo de maniobra y protección modular para riel DIN.',
      },
    ],
    tip: 'Buscá siempre el botón "T". Si tiene botón T, es disyuntor. Si no lo tiene, es térmica.',
  },

  // 2. Reconocimiento de Térmica
  {
    id: 'breaker_function_2',
    category: 'Térmica vs. Disyuntor',
    title: 'Función de la Llave Térmica',
    beginnerContext:
      'La Térmica tiene impreso un calibre de corriente como "C16" o "C10" y no posee botón de prueba T.',
    prompt:
      'Si en una casa se enchufan 4 caloventores al mismo tiempo en el mismo enchufe y los cables empiezan a recalentarse peligrosamente, ¿qué aparato debe saltar para evitar un incendio?',
    componentTypeToRender: 'termica',
    options: [
      {
        id: 'opt_1',
        label: 'La Térmica (PIA), cortando la sobrecarga por efecto térmico',
        isCorrect: true,
        explanation:
          '¡CORRECTO! La térmica posee una lámina bimetálica interna que se dilata con el calor excesivo de la sobrecarga y abre los contactos antes de que los cables se prendan fuego.',
      },
      {
        id: 'opt_2',
        label: 'El Disyuntor Diferencial',
        isCorrect: false,
        explanation:
          'Incorrecto. El disyuntor solo detecta fugas de corriente a tierra (cuando la electricidad se escapa fuera del circuito). Las sobrecargas y cortocircuitos son detectados por la térmica.',
      },
      {
        id: 'opt_3',
        label: 'La jabalina de tierra',
        isCorrect: false,
        explanation:
          'Incorrecto. La jabalina es un electrodo pasivo en el suelo, no tiene mecanismos para interrumpir el paso de corriente.',
      },
    ],
    tip: 'Regla mnemotécnica: La TÉRMICA cuida los CABLES; el DISYUNTOR cuida a las PERSONAS.',
  },

  // 3. Bornes del Interruptor Simple
  {
    id: 'switch_wiring_3',
    category: 'Mecanismos de Pared',
    title: 'Conexión de la Tecla de Luz (Interruptor Simple)',
    beginnerContext:
      'La tecla de luz tiene solo dos bornes traseros con tornillos. Funciona como un interruptor de paso.',
    prompt:
      '¿Qué cable NUNCA debe conectarse a los bornes de un interruptor simple de luz?',
    componentTypeToRender: 'interruptor_simple',
    options: [
      {
        id: 'opt_1',
        label: 'El Neutro (cable celeste). Jamás debe entrar a la tecla.',
        isCorrect: true,
        explanation:
          '¡FUNDAMENTAL! La tecla NUNCA debe recibir neutro. Si conectás Fase y Neutro en los dos bornes de una tecla, al apretarla provocarás un violento cortocircuito.',
      },
      {
        id: 'opt_2',
        label: 'La Fase (cable marrón)',
        isCorrect: false,
        explanation:
          'Incorrecto. La Fase DEBE ingresar obligatoriamente a la tecla para ser interrumpida con seguridad hacia el retorno.',
      },
      {
        id: 'opt_3',
        label: 'El Retorno (cable gris)',
        isCorrect: false,
        explanation:
          'Incorrecto. El retorno es el cable que sale desde la tecla hacia el portalámparas cuando la encendés.',
      },
    ],
    tip: '¡Regla de oro! La llave corta SIEMPRE la Fase. El Neutro va directo a la lámpara sin pasar por la tecla.',
  },

  // 4. Polaridad del Tomacorriente IRAM 2071
  {
    id: 'outlet_polarity_4',
    category: 'Tomacorrientes IRAM',
    title: 'Polaridad del Tomacorriente Argentino (Norma IRAM 2071)',
    beginnerContext:
      'El enchufe argentino de 3 patas planas tiene una posición obligatoria por seguridad de los artefactos.',
    prompt:
      'Mirando un tomacorriente de frente en la pared, con la ranura vertical de Tierra apuntando HACIA ABAJO: ¿dónde debe conectarse la Fase (cable vivo de 220V)?',
    componentTypeToRender: 'tomacorriente',
    options: [
      {
        id: 'opt_1',
        label: 'A la DERECHA va la Fase, a la IZQUIERDA el Neutro, y ABAJO la Tierra',
        isCorrect: true,
        explanation:
          '¡EXCELENTE! La norma IRAM 2071 y el reglamento AEA 90364 establecen: con la tierra abajo, la FASE SIEMPRE A LA DERECHA y el NEUTRO A LA IZQUIERDA.',
      },
      {
        id: 'opt_2',
        label: 'A la izquierda la Fase y a la derecha el Neutro',
        isCorrect: false,
        explanation:
          'Incorrecto. Si ponés la fase a la izquierda, el tomacorriente queda polarizado al revés, dejando interruptores de electrodomésticos del lado incorrecto.',
      },
      {
        id: 'opt_3',
        label: 'Es indistinto, la corriente alterna no tiene polaridad de bornes',
        isCorrect: false,
        explanation:
          'Falso y peligroso. Aunque la CA oscile a 50Hz, el Neutro está referenciado a tierra (0V) y la Fase tiene 220V vivos de potencial.',
      },
    ],
    tip: 'Mnemotecnia fácil: "Fase a la Derecha" (como dar la mano derecha).',
  },

  // 5. La Puesta a Tierra y Conductor PE
  {
    id: 'grounding_safety_5',
    category: 'Puesta a Tierra (PAT)',
    title: 'La Jabalina y el Conductor de Protección (PE)',
    beginnerContext:
      'La puesta a tierra utiliza una jabalina clavada en la tierra y un cable bicolor verde y amarillo que recorre toda la vivienda.',
    prompt:
      '¿Por qué el reglamento prohíbe de manera terminante colocar una llave térmica, fusible o interruptor en el cable verde-amarillo de tierra?',
    componentTypeToRender: 'puesta_tierra',
    options: [
      {
        id: 'opt_1',
        label:
          'Porque si el cable de tierra se interrumpe, las carcasas metálicas quedarían electrizadas sin escape y una persona recibiría la descarga mortal',
        isCorrect: true,
        explanation:
          '¡EXACTO! El conductor PE de tierra DEBE SER CONTINUO y PERMANENTE. Nunca debe existir nada que pueda abrirlo o desconectarlo.',
      },
      {
        id: 'opt_2',
        label: 'Porque el cable verde-amarillo es más caro que los demás',
        isCorrect: false,
        explanation:
          'No es una cuestión de costo sino de preservación de la vida humana.',
      },
      {
        id: 'opt_3',
        label: 'Porque la jabalina consume electricidad continuamente',
        isCorrect: false,
        explanation:
          'Falso. La jabalina no consume nada de energía en condiciones normales.',
      },
    ],
    tip: 'El cable verde-amarillo jamás se interrumpe. Va directo e ininterrumpido desde cada enchufe a la barra y a la jabalina.',
  },

  // 6. Conmutador de Combinación
  {
    id: 'twoway_switch_6',
    category: 'Mecanismos de Pared',
    title: 'Llave de Combinación (2 Vías)',
    beginnerContext:
      'Permite encender y apagar una luz desde dos puntos distantes (ej. escalera o cabecera de cama).',
    prompt:
      '¿Cuántos bornes de conexión traseros tiene una llave de combinación a diferencia de una llave simple de 1 punto?',
    componentTypeToRender: 'conmutado',
    options: [
      {
        id: 'opt_1',
        label: 'Tiene 3 bornes (1 Común y 2 Puentes Viajeros), mientras que la simple solo tiene 2 bornes',
        isCorrect: true,
        explanation:
          '¡CORRECTO! Los 3 bornes son el sello característico del conmutador. Los dos puentes unen las dos llaves por la cañería.',
      },
      {
        id: 'opt_2',
        label: 'Tiene 2 bornes igual que la simple',
        isCorrect: false,
        explanation:
          'Incorrecto. Si tiene 2 bornes es una llave simple. La llave de combinación necesita 3 bornes para poder alternar entre los dos puentes.',
      },
      {
        id: 'opt_3',
        label: 'Tiene 4 bornes para Fase, Neutro, Retorno y Tierra',
        isCorrect: false,
        explanation:
          'Incorrecto. La llave de combinación no lleva Neutro ni Tierra.',
      },
    ],
    tip: 'Mirá la parte trasera: 2 tornillos = Tecla simple. 3 tornillos = Llave de combinación.',
  },
];

export const BeginnerRecognitionLab: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [completedList, setCompletedList] = useState<string[]>([]);
  const [showTip, setShowTip] = useState<boolean>(false);

  const currentExercise = BEGINNER_EXERCISES[currentIdx];

  // Símbolo simulado para previsualización interactiva
  const mockSymbol: ElectricalSymbol = {
    id: `lab_sim_${currentExercise.componentTypeToRender}`,
    floorId: 'floor_1',
    category: 'utilizacion',
    type: currentExercise.componentTypeToRender,
    name: currentExercise.title,
    label: currentExercise.componentTypeToRender.slice(0, 3).toUpperCase(),
    x: 0,
    y: 0,
    rotation: 0,
    powerWatts: 60,
    voltage: 220,
    powerFactor: 0.9,
    terminals: [
      { id: 'L_IN', name: 'L Entrada', type: 'fase', relX: -16, relY: -10 },
      { id: 'N_IN', name: 'N Entrada', type: 'neutro', relX: -16, relY: 10 },
      { id: 'L_OUT', name: 'L Salida', type: 'fase', relX: 16, relY: -10 },
      { id: 'N_OUT', name: 'N Salida', type: 'neutro', relX: 16, relY: 10 },
    ],
    state: { isOpen: false, isOn: true, isEnergized: true },
  };

  const handleSelectOption = (optId: string) => {
    if (hasSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleCheckAnswer = () => {
    if (!selectedOptionId || hasSubmitted) return;
    setHasSubmitted(true);
    const chosen = currentExercise.options.find((o) => o.id === selectedOptionId);
    if (chosen?.isCorrect) {
      setScore((prev) => prev + 1);
      setCompletedList((prev) => [...prev, currentExercise.id]);
    }
  };

  const handleNextExercise = () => {
    setSelectedOptionId(null);
    setHasSubmitted(false);
    setShowTip(false);
    if (currentIdx < BEGINNER_EXERCISES.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setSelectedOptionId(null);
    setHasSubmitted(false);
    setScore(0);
    setCompletedList([]);
    setShowTip(false);
  };

  const isCurrentCorrect =
    hasSubmitted && currentExercise.options.find((o) => o.id === selectedOptionId)?.isCorrect;

  return (
    <div className="flex-1 h-full w-full bg-slate-950 text-slate-100 flex flex-col overflow-y-auto">
      {/* Cabecera del Laboratorio */}
      <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 uppercase tracking-wider">
                Modo Principiante Desde Cero
              </span>
              <span className="text-xs text-slate-400">
                Paso {currentIdx + 1} de {BEGINNER_EXERCISES.length}
              </span>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-white mt-0.5">
              Taller de Reconocimiento de Componentes Reales
            </h1>
            <p className="text-xs text-slate-400">
              Aprende a identificar aparatos físicos reales, sus bornes y normas de seguridad sin tecnicismos complejos.
            </p>
          </div>
        </div>

        {/* Puntuación y Progreso */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Award className="w-5 h-5 text-amber-400" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Desafíos Correctos</span>
            <span className="font-bold text-white text-sm">
              {score} / {BEGINNER_EXERCISES.length}
            </span>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-2"
            title="Reiniciar cuestionario"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra de Progreso de Pasos */}
      <div className="grid grid-cols-6 gap-1 p-2 bg-slate-900/60 border-b border-slate-800">
        {BEGINNER_EXERCISES.map((ex, idx) => {
          const isDone = completedList.includes(ex.id);
          const isCurrent = idx === currentIdx;
          return (
            <button
              key={ex.id}
              onClick={() => {
                setCurrentIdx(idx);
                setSelectedOptionId(null);
                setHasSubmitted(false);
                setShowTip(false);
              }}
              className={`h-2 rounded-full transition-all ${
                isDone
                  ? 'bg-emerald-500'
                  : isCurrent
                  ? 'bg-amber-400 ring-2 ring-amber-400/30'
                  : 'bg-slate-800'
              }`}
              title={`Paso ${idx + 1}: ${ex.title}`}
            />
          );
        })}
      </div>

      {/* Contenido Principal del Ejercicio */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda: Modelo Físico y Símbolo IRAM (5 columnas) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center shadow-xl">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 self-start flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Inspección Visual del Aparato</span>
            </span>

            {/* Renderizado realista del componente bajo estudio */}
            <div className="w-full h-48 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
              <svg className="w-36 h-36" viewBox="-30 -30 60 60">
                <RealisticCADSymbolSVG
                  symbol={mockSymbol}
                  viewMode="realista"
                  isSelected={false}
                  isOn={true}
                />
              </svg>
              <span className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded">
                Fotografía / SVG Real
              </span>
            </div>

            {/* Símbolo normalizado correspondiente debajo */}
            <div className="w-full mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                  Símbolo en Plano Eléctrico (IRAM):
                </span>
                <span className="text-xs text-slate-300">
                  {currentExercise.category}
                </span>
              </div>
              <div className="w-14 h-14 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-center">
                <svg className="w-10 h-10" viewBox="-25 -25 50 50">
                  <RealisticCADSymbolSVG
                    symbol={mockSymbol}
                    viewMode="esquematica"
                    isSelected={false}
                    isOn={true}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Tarjeta de Consejo Didáctico */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between text-amber-400 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Pista del Instructor</span>
              </span>
              <button
                onClick={() => setShowTip(!showTip)}
                className="text-[11px] underline hover:text-amber-200"
              >
                {showTip ? 'Ocultar' : 'Ver Pista'}
              </button>
            </div>
            {showTip ? (
              <p className="text-slate-200 leading-relaxed mt-1 animate-fade-in">
                {currentExercise.tip}
              </p>
            ) : (
              <p className="text-slate-400 italic">
                ¿No estás seguro de la respuesta? Hacé clic en "Ver Pista" para recibir una ayuda sin penalización.
              </p>
            )}
          </div>
        </div>

        {/* Columna Derecha: Pregunta Interactiva y Opciones (7 columnas) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                {currentExercise.category}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white mt-2">
                {currentExercise.title}
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1.5">
                {currentExercise.beginnerContext}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-medium text-amber-200 leading-relaxed">
              {currentExercise.prompt}
            </div>

            {/* Opciones de Respuesta */}
            <div className="space-y-2.5">
              {currentExercise.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                let optionClasses =
                  'bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-200';

                if (isSelected && !hasSubmitted) {
                  optionClasses =
                    'bg-amber-500/20 border-amber-500 text-white font-semibold ring-1 ring-amber-500/50';
                } else if (hasSubmitted) {
                  if (opt.isCorrect) {
                    optionClasses =
                      'bg-emerald-500/20 border-emerald-500 text-emerald-100 font-semibold ring-1 ring-emerald-500';
                  } else if (isSelected && !opt.isCorrect) {
                    optionClasses =
                      'bg-red-500/20 border-red-500 text-red-100 font-semibold ring-1 ring-red-500';
                  } else {
                    optionClasses = 'bg-slate-900/60 border-slate-800/80 text-slate-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    disabled={hasSubmitted}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${optionClasses}`}
                  >
                    <div className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                      {hasSubmitted && opt.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : hasSubmitted && isSelected && !opt.isCorrect ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                    <div className="flex-1">
                      <span>{opt.label}</span>
                      {hasSubmitted && (isSelected || opt.isCorrect) && (
                        <p className="mt-1.5 text-xs text-slate-300 font-normal leading-relaxed border-t border-slate-700/50 pt-1.5">
                          {opt.explanation}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botones de Acción (Comprobar / Siguiente) */}
          <div className="flex items-center justify-between gap-3 pt-2">
            {!hasSubmitted ? (
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedOptionId}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Comprobar Respuesta</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-full flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isCurrentCorrect ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>¡Respuesta Correcta!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span>Repasá la explicación arriba</span>
                    </div>
                  )}
                </div>

                {currentIdx < BEGINNER_EXERCISES.length - 1 ? (
                  <button
                    onClick={handleNextExercise}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl transition-all flex items-center gap-2"
                  >
                    <span>Siguiente Desafío</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-xl transition-all flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>¡Taller Finalizado! Reiniciar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
