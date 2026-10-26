/**
 * ELECTRA PLAN — Aula de Prácticas
 * 10 Talleres interactivos progresivos de instalaciones residenciales con validador de conexiones.
 */
import React, { useState } from 'react';
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
} from 'lucide-react';
import { PRACTICE_LEVELS } from '../services/practiceLevels';
import { Project, PracticeLevel, SimulationState } from '../types/electra';
import { simulateElectricalNetwork } from '../services/electricalSimulation';
import { CADEditor } from './CADEditor';

interface PracticesViewProps {
  onLoadPracticeToMain: (project: Project) => void;
}

export const PracticesView: React.FC<PracticesViewProps> = ({ onLoadPracticeToMain }) => {
  const [currentLevelId, setCurrentLevelId] = useState<number>(1);
  const [practiceProject, setPracticeProject] = useState<Project>(() => {
    return initPractice(PRACTICE_LEVELS[0]);
  });
  const [testResult, setTestResult] = useState<{
    passed: boolean;
    feedback: string;
  } | null>(null);
  const [revealedHints, setRevealedHints] = useState<number>(0);

  const currentLevel = PRACTICE_LEVELS.find((l) => l.id === currentLevelId) || PRACTICE_LEVELS[0];

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
        date: '2026-10-26',
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

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full bg-slate-950 overflow-hidden text-slate-100">
      {/* Panel Izquierdo: Lista de Talleres y Guía Paso a Paso */}
      <div className="w-full md:w-96 bg-slate-900 border-r border-slate-800 flex flex-col h-full overflow-y-auto p-4 space-y-4">
        {/* Cabecera del Aula */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <GraduationCap className="w-5 h-5" />
            <span>Aula de Prácticas</span>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
            Nivel {currentLevel.id} de 10
          </span>
        </div>

        {/* Selector Desplegable de Niveles */}
        <div>
          <label className="text-[10px] text-slate-400 block mb-1">Seleccionar Taller:</label>
          <select
            value={currentLevelId}
            onChange={(e) => handleSelectLevel(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg px-3 py-2 focus:border-amber-500 focus:outline-hidden"
          >
            {PRACTICE_LEVELS.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>
                {lvl.title} ({lvl.difficulty})
              </option>
            ))}
          </select>
        </div>

        {/* Ficha del Taller Activo */}
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
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
            <button
              onClick={handleResetLevel}
              title="Restablecer ejercicio al estado inicial"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reiniciar</span>
            </button>
          </div>

          <h3 className="font-bold text-sm text-white">{currentLevel.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{currentLevel.description}</p>
        </div>

        {/* Instrucciones Paso a Paso */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-200">Instrucciones del ejercicio:</span>
          <div className="space-y-1.5">
            {currentLevel.instructions.map((inst, idx) => (
              <div
                key={idx}
                className="text-xs bg-slate-800/60 p-2.5 rounded-lg border border-slate-800 text-slate-300 leading-relaxed"
              >
                {inst}
              </div>
            ))}
          </div>
        </div>

        {/* Sistema de Pistas Progresivas */}
        <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Pistas Progresivas ({revealedHints}/{currentLevel.hints.length})</span>
            </span>
            {revealedHints < currentLevel.hints.length && (
              <button
                onClick={() => setRevealedHints((h) => h + 1)}
                className="text-[11px] text-amber-300 hover:text-amber-200 underline font-medium"
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

        {/* Botón de Comprobación */}
        <div className="pt-2">
          <button
            onClick={handleVerifySolution}
            className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verificar Resultado</span>
          </button>
        </div>

        {/* Resultado del Ensayo */}
        {testResult && (
          <div
            className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 shadow-lg ${
              testResult.passed
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100'
                : 'bg-red-950/70 border-red-500 text-red-100'
            }`}
          >
            <div className="font-bold flex items-center gap-1.5 text-sm">
              {testResult.passed ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>¡PRÁCTICA SUPERADA!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>CIRCUITO INCOMPLETO</span>
                </>
              )}
            </div>
            <p className="text-xs">{testResult.feedback}</p>
            {testResult.passed && currentLevelId < 10 && (
              <button
                onClick={() => handleSelectLevel(currentLevelId + 1)}
                className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Siguiente Taller (Nivel {currentLevelId + 1})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Espacio de Trabajo Central (Lienzo Interactivo de Práctica) */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <span className="font-mono flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Mesa de Ensayos · Toca los bornes de los componentes para tirar cables
          </span>
          <span className="text-amber-400 font-bold">
            {simState.activeLamps.size > 0 ? '💡 Lámpara ENCENDIDA' : '⚪ Lámpara Apagada'}
          </span>
        </div>

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
      </div>
    </div>
  );
};
