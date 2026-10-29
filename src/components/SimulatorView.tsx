/**
 * ELECTRA PLAN — Vista Dedicada del Simulador Eléctrico
 * Banco de ensayos virtual interactivo con accionamiento de interruptores,
 * comprobación de continuidad lógica, detección de cortocircuitos y análisis de cargas.
 * Optimizado para pantallas móviles (360px - 430px) y escritorio.
 */
import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Power,
  ShieldAlert,
  Zap,
  Info,
  Sliders,
  BookOpen,
} from 'lucide-react';
import { Project, SimulationState, ElectricalSymbol } from '../types/electra';
import { ComponentLearningModal } from './ComponentLearningModal';

interface SimulatorViewProps {
  project: Project;
  simState: SimulationState;
  onToggleSwitch: (symbolId: string) => void;
  onToggleBreaker: (symbolId: string) => void;
  onVerifyCircuit: () => void;
  onResetSimulation: () => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  project,
  simState,
  onToggleSwitch,
  onToggleBreaker,
  onVerifyCircuit,
  onResetSimulation,
}) => {
  const [eduModalType, setEduModalType] = useState<string | null>(null);

  const switches = project.symbols.filter(
    (s) => s.category === 'comando'
  );
  const lamps = project.symbols.filter((s) => s.type === 'luminaria');
  const outlets = project.symbols.filter(
    (s) => s.type === 'tomacorriente' || s.type === 'toma_especial'
  );
  const protections = project.symbols.filter(
    (s) => s.category === 'proteccion' || s.type === 'tablero'
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F6F8] dark:bg-[#0D161C] p-3 sm:p-6 text-[#18313B] dark:text-[#F1F5F9] space-y-4 sm:space-y-6 max-w-full overflow-x-hidden transition-colors duration-150">
      {/* Cabecera del Banco de Ensayos Responsiva */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[#167D78] dark:text-[#2DD4BF] font-bold text-base sm:text-lg">
            <Zap className="w-5 h-5 fill-current shrink-0" />
            <h2>Banco de Pruebas y Simulación Eléctrica</h2>
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Entorno interactivo en tiempo real. Acciona interruptores y llaves para verificar el flujo de potencial (Fase) y retorno (Neutro).
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={onVerifyCircuit}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#167D78] hover:bg-[#0F5E5A] active:bg-[#0A4542] text-white font-bold text-xs rounded-lg shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verificar Continuidad</span>
          </button>
          <button
            onClick={() => setEduModalType('luminaria')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#F8FAFC] dark:bg-[#1B2B36] hover:bg-[#F1F5F9] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] text-[#167D78] dark:text-[#2DD4BF] text-xs rounded-lg transition-colors font-semibold"
            title="Ver catálogo educativo de componentes con normas AEA"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Ficha de Componentes</span>
          </button>
          <button
            onClick={onResetSimulation}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8FAFC] dark:bg-[#1B2B36] hover:bg-[#F1F5F9] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white text-xs rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Alerta de Cortocircuito si existe */}
      {simState.hasShortCircuit && (
        <div className="bg-red-50 dark:bg-red-950/80 border-2 border-red-500 p-3.5 sm:p-4 rounded-xl flex items-start gap-3 shadow-md">
          <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-800 dark:text-red-200 text-xs sm:text-sm">
              ¡PELIGRO: CORTOCIRCUITO DETECTADO EN EL MODELO!
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              Existe un conductor que une directamente la Fase con el Neutro sin intercalar una carga con resistencia adecuada.
            </p>
            <p className="text-xs font-semibold text-red-900 dark:text-red-100 mt-1">
              👉 Acción correctiva: Revisa los cables tendidos en el editor CAD y elimina el puente entre Fase y Neutro.
            </p>
          </div>
        </div>
      )}

      {/* Resumen de Métricas de Simulación (2x2 en móvil, 4x1 en desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-3 sm:p-4 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Lámparas Encendidas</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#D99A32] dark:text-amber-400">
              {simState.activeLamps.size}
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">de {lamps.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-3 sm:p-4 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Corriente Activa</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#167D78] dark:text-[#2DD4BF]">
              {simState.totalSimulatedCurrentAmps} A
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">220 V</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-3 sm:p-4 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Tomas Energizados</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#2563EB] dark:text-cyan-400">
              {outlets.filter((o) => o.state?.isEnergized).length}
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">de {outlets.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-3 sm:p-4 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Cables Activos</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#18313B] dark:text-slate-200">
              {simState.energizedWires.size}
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">de {project.wires.length}</span>
          </div>
        </div>
      </div>

      {/* Cuadrículas de Control Interactivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Panel 1: Comandos e Interruptores Activos */}
        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-3 sm:space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-2">
            <h3 className="font-bold text-[#18313B] dark:text-slate-200 text-xs sm:text-sm flex items-center gap-2">
              <Power className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
              <span>Interruptores y Llaves</span>
            </h3>
            <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400">Toca para accionar</span>
          </div>

          {switches.length === 0 ? (
            <p className="text-xs text-[#64748B] dark:text-slate-500 py-3">No hay interruptores colocados en el plano.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {switches.map((sw: ElectricalSymbol) => {
                const isOpen = sw.state?.isOpen !== false;
                const isEnergized = sw.state?.isEnergized;

                return (
                  <button
                    key={sw.id}
                    onClick={() => onToggleSwitch(sw.id)}
                    className={`p-3 rounded-lg border text-left transition-all active:scale-[0.98] flex items-center justify-between gap-2.5 ${
                      !isOpen
                        ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 border-[#167D78] text-[#167D78] dark:text-[#2DD4BF] shadow-xs'
                        : 'bg-[#F8FAFC] dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-300 hover:border-[#167D78]'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-bold text-xs text-[#18313B] dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: !isOpen ? '#167D78' : '#64748b' }} />
                        <span className="truncate">{sw.label}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400 truncate max-w-[150px]">{sw.name}</div>
                      <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-500">
                        {isEnergized ? '⚡ Con potencial' : '⚪ Sin tensión'}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        !isOpen ? 'bg-[#167D78] text-white' : 'bg-slate-200 dark:bg-slate-800 text-[#64748B] dark:text-slate-400'
                      }`}
                    >
                      {!isOpen ? 'ON' : 'OFF'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel 2: Puntos de Luz y Estado Luminoso */}
        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-3 sm:space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-2">
            <h3 className="font-bold text-[#18313B] dark:text-slate-200 text-xs sm:text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#D99A32]" />
              <span>Bocas de Iluminación</span>
            </h3>
            <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400">Estado en vivo</span>
          </div>

          {lamps.length === 0 ? (
            <p className="text-xs text-[#64748B] dark:text-slate-500 py-3">No hay luminarias colocadas en el plano.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {lamps.map((lamp: ElectricalSymbol) => {
                const isOn = simState.activeLamps.has(lamp.id);
                return (
                  <div
                    key={lamp.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-2.5 transition-all ${
                      isOn
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/70 text-amber-900 dark:text-amber-100 shadow-amber-500/10 shadow-sm'
                        : 'bg-[#F8FAFC] dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#64748B] dark:text-slate-400'
                    }`}
                  >
                    <div className="space-y-0.5 truncate">
                      <div className="font-bold text-xs text-[#18313B] dark:text-white flex items-center gap-1.5 truncate">
                        <Lightbulb
                          className={`w-3.5 h-3.5 shrink-0 ${isOn ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`}
                        />
                        <span className="truncate">{lamp.label}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-300 truncate max-w-[150px]">{lamp.name}</div>
                      <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
                        {lamp.powerWatts} W ({((lamp.powerWatts || 60) / 220).toFixed(2)} A)
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${
                        isOn ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isOn ? 'ON' : 'OFF'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Nota de Responsabilidad */}
      <div className="p-3.5 sm:p-4 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-xl text-xs text-[#64748B] dark:text-slate-400 leading-relaxed flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-[#167D78] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#18313B] dark:text-slate-200">Aviso técnico y educativo:</span>
          <p className="mt-0.5 text-[11px] sm:text-xs">
            El motor de simulación de ELECTRA PLAN realiza una verificación de continuidad lógica de nodos y caminos eléctricos basada en el modelo de grafo de terminales.
            Toda instalación debe ser certificada por un profesional matriculado cumpliendo la reglamentación AEA 90364 y leyes locales vigentes.
          </p>
        </div>
      </div>

      {/* Modal Educativo de Componentes */}
      {eduModalType && (
        <ComponentLearningModal
          symbolType={eduModalType}
          onClose={() => setEduModalType(null)}
        />
      )}
    </div>
  );
};
