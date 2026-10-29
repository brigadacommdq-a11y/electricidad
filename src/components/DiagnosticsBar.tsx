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
  onFocusCoordinates?: (coords: { x: number; y: number }) => void;
}

export const DiagnosticsBar: React.FC<DiagnosticsBarProps> = ({
  simState,
  onStartSimulation,
  onPauseSimulation,
  onResetSimulation,
  onVerifyCircuit,
  onFocusCoordinates,
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
    <div className="no-print bg-white dark:bg-[#142028] border-t border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-[#F1F5F9] text-xs shadow-xl select-none z-30 shrink-0 transition-colors duration-150">
      {/* Barra principal responsive */}
      <div className="px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Controles de Simulación */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={onVerifyCircuit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] active:bg-[#0A4542] text-white font-bold rounded-lg shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[11px] sm:text-xs">Verificar</span>
          </button>

          <button
            onClick={simState.isRunning && !simState.isPaused ? onPauseSimulation : onStartSimulation}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#F8FAFC] dark:bg-[#1B2B36] hover:bg-[#F1F5F9] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors text-[#18313B] dark:text-slate-200"
          >
            {simState.isRunning && !simState.isPaused ? (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-500" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF] fill-current" />
                <span>Iniciar</span>
              </>
            )}
          </button>

          <button
            onClick={onResetSimulation}
            title="Reiniciar estados de simulación"
            className="hidden sm:block p-1.5 bg-[#F8FAFC] dark:bg-[#1B2B36] hover:bg-[#F1F5F9] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Estado y Diagnóstico */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs truncate font-medium ${mainStatus.color}`}>
            <StatusIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">{mainStatus.text}</span>
          </div>

          <div className="hidden lg:flex items-center gap-3 font-mono text-[11px] text-[#64748B] dark:text-slate-400 border-l border-[#DCE4E8] dark:border-[#243542] pl-3">
            <span className="flex items-center gap-1 text-[#167D78] dark:text-[#2DD4BF] font-semibold">
              <Zap className="w-3 h-3 text-[#167D78] dark:text-[#2DD4BF]" />
              <span>{simState.activeLamps.size} lámparas encendidas</span>
            </span>
            <span>·</span>
            <span>Corriente: <strong className="text-[#18313B] dark:text-white font-semibold">{simState.totalSimulatedCurrentAmps} A</strong></span>
          </div>

          {/* Botón expandir diagnósticos */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] sm:text-xs text-[#18313B] dark:text-slate-300 hover:bg-[#F1F5F9] dark:hover:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors shrink-0"
          >
            <span className="font-bold text-[#167D78] dark:text-[#2DD4BF]">{simState.diagnostics.length}</span>
            <span className="hidden sm:inline">mensajes</span>
            {isExpanded ? <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
          </button>
        </div>
      </div>

      {/* Panel Desplegable con Lista de Diagnósticos */}
      {isExpanded && (
        <div className="border-t border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#0D161C] p-3 max-h-56 overflow-y-auto space-y-2">
          {simState.diagnostics.length === 0 ? (
            <div className="text-[#64748B] dark:text-slate-400 text-center py-2 text-xs">
              No hay diagnósticos pendientes. Pulsa "Verificar Circuito" para analizar la instalación.
            </div>
          ) : (
            simState.diagnostics.map((diag: DiagnosticItem) => {
              const borderBadge =
                diag.level === 'error'
                  ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                  : diag.level === 'warning'
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
                  : diag.level === 'success'
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                  : 'border-[#DCE4E8] dark:border-[#243542] bg-white dark:bg-[#142028] text-[#18313B] dark:text-slate-300';

              return (
                <div
                  key={diag.id}
                  className={`p-2.5 rounded-lg border text-xs leading-relaxed space-y-1.5 ${borderBadge}`}
                >
                  <div className="flex items-center justify-between font-semibold gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {diag.level === 'error' && <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                      {diag.level === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      {diag.level === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      {diag.level === 'info' && <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      <span className="truncate">{diag.title}</span>
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {diag.faultDetail && onFocusCoordinates && (
                        <button
                          onClick={() => onFocusCoordinates(diag.faultDetail!.coordinates)}
                          className="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold shadow-xs transition-colors flex items-center gap-1"
                          title="Centrar y acercar el plano al lugar exacto de la falla"
                        >
                          <span>Localizar</span>
                        </button>
                      )}
                      <span className="text-[10px] uppercase font-mono tracking-wider opacity-75">
                        {diag.level}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] opacity-90">{diag.message}</p>

                  {diag.faultDetail?.trippedProtection && (
                    <div className="text-[10px] p-1.5 rounded bg-black/5 dark:bg-black/40 border border-red-500/30 text-red-600 dark:text-red-300 font-mono">
                      ⚡ <strong>Protección Disparada:</strong> {diag.faultDetail.trippedProtection.statusText}
                    </div>
                  )}

                  {diag.recommendation && (
                    <p className="text-[10px] italic border-t border-black/10 dark:border-white/10 pt-1 opacity-80">
                      💡 Solución sugerida: {diag.recommendation}
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
