/**
 * ELECTRA PLAN — Aula de Prácticas
 * Catálogo pedagógico ampliado de 45 prácticas organizadas en 6 categorías (A-F)
 * con verificador automático, pistas progresivas, supuestos de cálculo y persistencia de progreso.
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Zap,
  Play,
  Layers,
  BookOpen,
  X,
  Sparkles,
  Trophy,
  Filter,
  Check,
  ExternalLink,
} from 'lucide-react';
import { PRACTICE_LEVELS } from '../services/practiceLevels';
import { Project, PracticeLevel, PracticeCategory, SimulationState } from '../types/electra';
import { simulateElectricalNetwork } from '../services/electricalSimulation';
import { CADEditor } from './CADEditor';

interface PracticesViewProps {
  onLoadPracticeToMain: (project: Project) => void;
  onOpenRecognitionLab?: () => void;
}

const STORAGE_PROGRESS_KEY = 'electra_plan_completed_practices_v1';

export const PracticesView: React.FC<PracticesViewProps> = ({ onLoadPracticeToMain, onOpenRecognitionLab }) => {
  const [selectedCategory, setSelectedCategory] = useState<PracticeCategory | 'todas'>('todas');
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [isMobileGuideOpen, setIsMobileGuideOpen] = useState<boolean>(false);
  const [showPedagogicalDetails, setShowPedagogicalDetails] = useState<boolean>(true);

  // Registro de prácticas completadas persistidas en localStorage
  const [completedLevels, setCompletedLevels] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROGRESS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const currentLevel = useMemo(() => {
    return PRACTICE_LEVELS.find((l) => l.id === currentLevelId) || PRACTICE_LEVELS[0];
  }, [currentLevelId]);

  const [practiceProject, setPracticeProject] = useState<Project>(() => {
    return initPractice(currentLevel);
  });

  const [testResult, setTestResult] = useState<{
    passed: boolean;
    feedback: string;
  } | null>(null);

  function initPractice(level: PracticeLevel): Project {
    return {
      version: '1.2.0',
      metadata: {
        id: `practice_level_${level.id}`,
        name: level.title,
        client: 'Aula de Aprendizaje ELECTRA PLAN',
        address: 'Taller Virtual',
        description: level.objective,
        author: 'Estudiante',
        date: '2026-10-30',
        country: 'Argentina',
        normative: 'AEA 90364-771',
        gridSize: 20,
        snapToGrid: true,
        showDimensions: true,
        scale: 40,
      },
      floors: [{ id: 'floor_1', name: 'Mesa de Trabajo', level: 0, scalePixelsPerMeter: 40 }],
      activeFloorId: 'floor_1',
      rooms: [
        {
          id: 'room_bench',
          floorId: 'floor_1',
          name: 'Mesa de Ensayos',
          x: 40,
          y: 40,
          width: 720,
          height: 480,
          color: 'rgba(59, 130, 246, 0.03)',
        },
      ],
      architecturalElements: [],
      symbols: level.initialProject.symbols?.map((s) => JSON.parse(JSON.stringify(s))) || [],
      wires: level.initialProject.wires?.map((w) => JSON.parse(JSON.stringify(w))) || [],
      circuits: [
        {
          id: 'C1',
          name: 'Circuito de Práctica',
          type: 'IUG',
          voltage: 220,
          phases: 1,
          powerFactor: 0.95,
          conductorMaterial: 'Cu',
          crossSectionMm2: 1.5,
          breakerAmps: 10,
          breakerCurve: 'C',
          breakerPoles: '2P',
          color: '#3b82f6',
          installationMethod: 'cañeria_embutida',
          lengthMetersEstimate: 5,
        },
      ],
      switchboard: {
        id: 'board_p',
        name: 'Tablero de Práctica',
        location: 'Banco',
        mainBreakerAmps: 16,
        differentialAmps: 25,
        components: [],
      },
      currency: 'ARS',
    };
  }

  // Filtrado de prácticas por categoría
  const filteredLevels = useMemo(() => {
    if (selectedCategory === 'todas') return PRACTICE_LEVELS;
    return PRACTICE_LEVELS.filter((l) => l.category === selectedCategory);
  }, [selectedCategory]);

  // Cambiar de nivel
  const handleSelectLevel = (levelId: number) => {
    setCurrentLevelId(levelId);
    const target = PRACTICE_LEVELS.find((l) => l.id === levelId) || PRACTICE_LEVELS[0];
    setPracticeProject(initPractice(target));
    setTestResult(null);
    setRevealedHints(0);
  };

  // Reiniciar nivel actual
  const handleResetLevel = () => {
    setPracticeProject(initPractice(currentLevel));
    setTestResult(null);
    setRevealedHints(0);
  };

  // Ejecutar verificación de la solución
  const handleVerifySolution = () => {
    const { simState } = simulateElectricalNetwork(practiceProject);
    const result = currentLevel.solutionCheck(practiceProject, simState);
    setTestResult(result);

    if (result.passed && !completedLevels.includes(currentLevel.id)) {
      const next = [...completedLevels, currentLevel.id];
      setCompletedLevels(next);
      try {
        localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('Error al guardar progreso:', e);
      }
    }
  };

  // Navegación anterior / siguiente
  const handlePrevLevel = () => {
    const currentIndex = PRACTICE_LEVELS.findIndex((l) => l.id === currentLevelId);
    if (currentIndex > 0) {
      handleSelectLevel(PRACTICE_LEVELS[currentIndex - 1].id);
    }
  };

  const handleNextLevel = () => {
    const currentIndex = PRACTICE_LEVELS.findIndex((l) => l.id === currentLevelId);
    if (currentIndex < PRACTICE_LEVELS.length - 1) {
      handleSelectLevel(PRACTICE_LEVELS[currentIndex + 1].id);
    }
  };

  // Alternar tecla
  const handleToggleSwitch = (symbolId: string) => {
    setPracticeProject((prev) => {
      const nextSymbols = prev.symbols.map((s) => {
        if (s.id === symbolId) {
          if (s.type === 'conmutado') {
            const nextPos = s.state?.switchPosition === 1 ? 2 : 1;
            return { ...s, state: { ...s.state, switchPosition: nextPos } };
          }
          return { ...s, state: { ...s.state, isOpen: !s.state?.isOpen } };
        }
        return s;
      });
      return { ...prev, symbols: nextSymbols };
    });
  };

  // Calcular simulación para la mesa de trabajo
  const { simState, updatedSymbols, updatedWires } = simulateElectricalNetwork(practiceProject);

  const categories: { id: PracticeCategory | 'todas'; label: string; count: number }[] = [
    { id: 'todas', label: 'Todas las Prácticas', count: 45 },
    { id: 'fundamentos', label: 'A. Fundamentos', count: 6 },
    { id: 'domesticas', label: 'B. Domésticas', count: 9 },
    { id: 'tableros', label: 'C. Tableros', count: 7 },
    { id: 'calculos', label: 'D. Cálculos', count: 8 },
    { id: 'diagnostico', label: 'E. Diagnóstico', count: 8 },
    { id: 'talleres', label: 'F. Talleres & Proyectos', count: 7 },
  ];

  // Componente de contenido de la guía pedagógica
  const renderGuideContent = (isMobile = false) => (
    <div className="space-y-4">
      {/* Cabecera del Aula y Progreso */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
          <GraduationCap className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Aula de Prácticas</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>{completedLevels.length}/45</span>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsMobileGuideOpen(false)}
              className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selector de Categorías (Pills) */}
      <div>
        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
          Categoría Pedagógica:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`p-1.5 rounded-lg text-left text-[11px] font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-950/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="block truncate">{cat.label}</span>
              <span className="text-[9px] opacity-75">{cat.count} talleres</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selector Desplegable de Talleres de la Categoría */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Taller Activo:
          </label>
          <span className="text-[10px] text-slate-500 font-mono">
            {filteredLevels.findIndex((l) => l.id === currentLevelId) + 1} de {filteredLevels.length}
          </span>
        </div>
        <select
          value={currentLevelId}
          onChange={(e) => handleSelectLevel(Number(e.target.value))}
          className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs rounded-xl px-3 py-2.5 focus:border-amber-500 focus:outline-hidden"
        >
          {filteredLevels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.title} {completedLevels.includes(lvl.id) ? '✓' : ''} ({lvl.difficulty})
            </option>
          ))}
        </select>
      </div>

      {/* Ficha Principal del Taller Activo */}
      <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                currentLevel.difficulty === 'Principiante'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : currentLevel.difficulty === 'Intermedio'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-purple-950 text-purple-300 border border-purple-800'
              }`}
            >
              {currentLevel.difficulty}
            </span>
            {currentLevel.categoryName && (
              <span className="text-[10px] text-slate-400 font-semibold truncate max-w-[170px]">
                {currentLevel.categoryName.split('.')[1] || currentLevel.categoryName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {completedLevels.includes(currentLevel.id) && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700/50 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Check className="w-3 h-3" />
                <span>Superado</span>
              </span>
            )}
            <button
              onClick={handleResetLevel}
              title="Restablecer ejercicio al estado inicial"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 active:text-amber-400"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        <h3 className="font-bold text-sm text-white leading-snug">{currentLevel.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">{currentLevel.description}</p>

        {/* Botón para alternar ficha técnica pedagógica avanzada */}
        <button
          onClick={() => setShowPedagogicalDetails(!showPedagogicalDetails)}
          className="text-[11px] text-[#2DD4BF] hover:text-cyan-300 font-semibold flex items-center gap-1 pt-1"
        >
          <span>{showPedagogicalDetails ? 'Ocultar Ficha Pedagógica' : 'Ver Conocimientos Previos y Supuestos'}</span>
        </button>

        {/* Ficha Pedagógica Detallada (Etapa 5) */}
        {showPedagogicalDetails && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] animate-fade-in">
            {currentLevel.prerequisites && currentLevel.prerequisites.length > 0 && (
              <div>
                <span className="text-slate-400 font-bold block">Conocimientos previos:</span>
                <ul className="list-disc list-inside text-slate-300 space-y-0.5 mt-0.5">
                  {currentLevel.prerequisites.map((p, idx) => (
                    <li key={idx}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentLevel.inputsAndAssumptions && currentLevel.inputsAndAssumptions.length > 0 && (
              <div>
                <span className="text-slate-400 font-bold block">Datos de entrada y supuestos:</span>
                <ul className="list-disc list-inside text-amber-200/90 space-y-0.5 mt-0.5">
                  {currentLevel.inputsAndAssumptions.map((ia, idx) => (
                    <li key={idx}>{ia}</li>
                  ))}
                </ul>
              </div>
            )}

            {currentLevel.expectedOutcome && (
              <div>
                <span className="text-slate-400 font-bold block">Resultado esperado:</span>
                <p className="text-emerald-300/90 mt-0.5">{currentLevel.expectedOutcome}</p>
              </div>
            )}

            {currentLevel.keyLearnings && currentLevel.keyLearnings.length > 0 && (
              <div>
                <span className="text-slate-400 font-bold block">Conceptos aprendidos:</span>
                <ul className="list-disc list-inside text-cyan-200/90 space-y-0.5 mt-0.5">
                  {currentLevel.keyLearnings.map((kl, idx) => (
                    <li key={idx}>{kl}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instrucciones Paso a Paso */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-200">Instrucciones del ejercicio:</span>
        <div className="space-y-1.5">
          {currentLevel.instructions.map((inst, idx) => (
            <div
              key={idx}
              className="text-xs bg-slate-800/60 p-2.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed"
            >
              {inst}
            </div>
          ))}
        </div>
      </div>

      {/* Sistema de Pistas Progresivas */}
      {currentLevel.hints && currentLevel.hints.length > 0 && (
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Pistas Progresivas ({revealedHints}/{currentLevel.hints.length})</span>
            </span>
            {revealedHints < currentLevel.hints.length && (
              <button
                onClick={() => setRevealedHints((h) => h + 1)}
                className="text-[11px] text-amber-300 hover:text-amber-200 underline font-medium active:text-white"
              >
                Revelar pista
              </button>
            )}
          </div>

          {revealedHints === 0 ? (
            <p className="text-[11px] text-slate-500 italic">
              Intenta resolver el ejercicio por tu cuenta. Si tienes dudas, pulsa "Revelar pista".
            </p>
          ) : (
            <div className="space-y-1.5 pt-1">
              {currentLevel.hints.slice(0, revealedHints).map((hint, idx) => (
                <div
                  key={idx}
                  className="text-[11px] bg-amber-950/30 border border-amber-800/50 p-2 rounded text-amber-200"
                >
                  {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botón de Comprobación */}
      <div className="pt-2">
        <button
          onClick={handleVerifySolution}
          className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verificar Resultado</span>
        </button>
      </div>

      {/* Resultado del Ensayo */}
      {testResult && (
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 shadow-lg ${
            testResult.passed
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
              : 'bg-red-950/80 border-red-500 text-red-100'
          }`}
        >
          <div className="font-bold flex items-center gap-1.5 text-sm">
            {testResult.passed ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>¡Práctica Verificada y Aprobada!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span>Comprobación Incompleta</span>
              </>
            )}
          </div>
          <p className="text-xs leading-relaxed">{testResult.feedback}</p>

          {testResult.passed && currentLevelId < 45 && (
            <button
              onClick={handleNextLevel}
              className="mt-2 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
            >
              <span>Avanzar al Siguiente Ejercicio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Navegación Anterior / Siguiente y Cargar en Plano */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={handlePrevLevel}
          disabled={currentLevelId === 1}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Anterior</span>
        </button>

        <button
          onClick={() => onLoadPracticeToMain(practiceProject)}
          title="Exportar esta mesa de trabajo hacia el Plano CAD principal"
          className="px-2.5 py-1.5 bg-[#167D78]/20 hover:bg-[#167D78]/30 border border-[#167D78]/40 text-[#2DD4BF] rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Llevar al CAD</span>
        </button>

        <button
          onClick={handleNextLevel}
          disabled={currentLevelId === 45}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1"
        >
          <span>Siguiente</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex w-full h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Panel Izquierdo para Escritorio (>= md) con scroll independiente */}
      <div className="hidden md:flex md:w-[420px] bg-slate-900 border-r border-slate-800 flex-col h-full overflow-y-auto p-4 shrink-0 custom-scrollbar">
        {renderGuideContent(false)}
      </div>

      {/* Espacio de Trabajo Central (Lienzo Interactivo de Práctica) */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0">
        {/* Barra superior de la mesa de trabajo (Responsive) */}
        <div className="p-2 sm:p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="font-semibold text-amber-400 truncate text-[11px] sm:text-xs">
              {currentLevel.id}. {currentLevel.title}
            </span>
            <span className="text-slate-500 hidden sm:inline">·</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">Toca bornes para cablear</span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Botón abrir Guía en Celular */}
            <button
              onClick={() => setIsMobileGuideOpen(true)}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 active:bg-slate-700 border border-slate-700 text-amber-300 rounded-lg text-xs font-semibold"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Guía</span>
            </button>

            {/* Botón de verificación rápida en Celular */}
            <button
              onClick={handleVerifySolution}
              className="md:hidden flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 active:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verificar</span>
            </button>

            {/* Estado de lámpara */}
            <span
              className={`text-[11px] sm:text-xs font-bold px-2 py-1 rounded-md ${
                simState.activeLamps.size > 0
                  ? 'text-amber-300 bg-amber-950/60 border border-amber-800'
                  : 'text-slate-400 bg-slate-800'
              }`}
            >
              {simState.activeLamps.size > 0 ? '💡 ON' : '⚪ OFF'}
            </span>
          </div>
        </div>

        {/* Lienzo CAD de la Práctica (100% de la pantalla) */}
        <div className="flex-1 h-full w-full relative overflow-hidden">
          <CADEditor
            project={{
              ...practiceProject,
              symbols: updatedSymbols,
              wires: updatedWires,
            }}
            onUpdateProject={(updater) => setPracticeProject(updater)}
            activeTool="wire"
            selectedTemplateType={null}
            selectedCircuitId="C1"
            activeWireType="fase"
            selectedElementId={null}
            selectedElementType={null}
            onSelectElement={() => {}}
            onToggleSwitch={handleToggleSwitch}
            isSimulating={true}
          />

          {/* Banner flotante de feedback en celular cuando se comprueba el circuito */}
          {testResult && !isMobileGuideOpen && (
            <div
              onClick={() => setIsMobileGuideOpen(true)}
              className={`md:hidden absolute bottom-3 left-3 right-3 z-30 p-3 rounded-xl border text-xs shadow-2xl flex items-center justify-between gap-2 cursor-pointer backdrop-blur-md ${
                testResult.passed
                  ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100'
                  : 'bg-red-950/95 border-red-500 text-red-100'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {testResult.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <div className="truncate">
                  <span className="font-bold block">
                    {testResult.passed ? '¡Práctica Superada!' : 'Circuito Incompleto'}
                  </span>
                  <span className="text-[10px] opacity-80 truncate block">{testResult.feedback}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-300 underline shrink-0">
                {testResult.passed ? 'Avanzar' : 'Ver Pistas'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Drawer Móvil de Instrucciones y Guía Paso a Paso */}
      {isMobileGuideOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex flex-col justify-end md:hidden animate-fade-in"
          onClick={() => setIsMobileGuideOpen(false)}
        >
          <div
            className="bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[85vh] h-[80vh] flex flex-col p-4 overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {renderGuideContent(true)}
          </div>
        </div>
      )}
    </div>
  );
};
