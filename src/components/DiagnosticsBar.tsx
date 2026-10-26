/**
 * ELECTRA PLAN — Barra Inferior de Diagnósticos y Controles de Simulación
 */
import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronUp,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { SimulationState, DiagnosticItem } from '../types/electra';

interface DiagnosticsBarProps {
  simState: SimulationState;
  onStartSimulation: () => void;
  onPauseSimulation: () => void;
  onResetSimulation: () => void;
  onVerifyCircuit: () => void;
}

export const DiagnosticsBar: React.FC<DiagnosticsBarProps> = ({
  simState,
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  onVerifyCircuit,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const errors = simState.diagnostics.filter((d) => d.level === 'error');
  const warnings = simState.diagnostics.filter((d) => d.level === 'warning');
  const infos = simState.diagnostics.filter((d) => d.level === 'info');
  const successes = simState.diagnostics.filter((d) => d.level === 'success');

  const mainStatus = simState.hasShortCircuit
    ? { text: '¡CORTOCIRCUITO DIRECTO!', color: 'bg-red-500 text-slate-950 font-bold', icon: XCircle }
    : errors.length > 0
    ? { text: 'Errores de Conexión', color: 'bg-red-900/60 text-red-200 border border-red-700', icon: XCircle }
    : warnings.length > 0
    ? { text: 'Observaciones Técnicas', color: 'bg-amber-900/60 text-amber-200 border border-amber-700', icon: AlertTriangle }
    : successes.length > 0
    ? { text: 'Continuidad Conforme en Modelo', color: 'bg-emerald-950/60 text-emerald-300 border border-emerald-700', icon: CheckCircle2 }
    : { text: 'Modelo Listo para Verificar', color: 'bg-slate-800 text-slate-300', icon: Info };

  const StatusIcon = mainStatus.icon;

  return (
    <div className="no-print bg-slate-900 border-t border-slate-800 text-slate-200 text-xs shadow-xl select-none z-30">
      {/* Barra principal compacta */}
      <div className="px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        {/* Controles de Simulación */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onVerifyCircuit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded shadow-xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verificar Circuito</span>
          </button>

          <button
            onClick={simState.isRunning && !simState.isPaused ? onPauseSimulation : onStartSimulation}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors text-slate-200"
          >
            {simState.isRunning && !simState.isPaused ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>Iniciar</span>
              </>
            )}
          </button>

          <button
            onClick={onResetSimulation}
            title="Reiniciar estados de simulación"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Estado y Métricas en Tiempo Real */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs ${mainStatus.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{mainStatus.text}</span>
          </div>

          <div className="hidden sm:flex items-center gap-3 font-mono text-[11px] text-slate-400 border-l border-slate-700 pl-3">
            <span className="flex items-center gap-1 text-amber-300">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{simState.activeLamps.size} lámparas encendidas</span>
            </span>
            <span>·</span>
            <span>Corriente: <strong className="text-white font-semibold">{simState.totalSimulatedCurrentAmps} A</strong></span>
          </div>

          {/* Botón expandir diagnósticos */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700 rounded transition-colors"
          >
            <span>{simState.diagnostics.length} mensajes</span>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Panel Desplegable con Lista de Diagnósticos */}
      {isExpanded && (
        <div className="border-t border-slate-800 bg-slate-950 p-3 max-h-56 overflow-y-auto space-y-2">
          {simState.diagnostics.length === 0 ? (
            <div className="text-slate-500 text-center py-2">
              No hay diagnósticos pendientes. Pulsa "Verificar Circuito" para analizar la instalación.
            </div>
          ) : (
            simState.diagnostics.map((diag: DiagnosticItem) => {
              const borderBadge =
                diag.level === 'error'
                  ? 'border-red-600/50 bg-red-950/30 text-red-200'
                  : diag.level === 'warning'
                  ? 'border-amber-600/50 bg-amber-950/30 text-amber-200'
                  : diag.level === 'success'
                  ? 'border-emerald-600/50 bg-emerald-950/30 text-emerald-200'
                  : 'border-slate-700 bg-slate-900/60 text-slate-300';

              return (
                <div
                  key={diag.id}
                  className={`p-2.5 rounded border text-xs leading-relaxed space-y-1 ${borderBadge}`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      {diag.level === 'error' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                      {diag.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {diag.level === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {diag.level === 'info' && <Info className="w-3.5 h-3.5 text-sky-400" />}
                      {diag.title}
                    </span>
                    <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                      {diag.level}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{diag.message}</p>
                  {diag.recommendation && (
                    <p className="text-slate-400 text-[10px] italic border-t border-slate-800/80 pt-1 mt-1">
                      💡 Solución: {diag.recommendation}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
