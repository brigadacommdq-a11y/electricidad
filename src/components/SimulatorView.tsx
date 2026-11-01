/**
 * ELECTRA PLAN — Vista Dedicada del Simulador Eléctrico
 * Banco de ensayos virtual interactivo con maniobra individual de protecciones (IGA, ID, PIAs),
 * accionamiento de interruptores, comprobación de continuidad lógica, detección de cortocircuitos
 * y análisis de cargas según estado real (elementos no conectados = 0 A / 0 W).
 * Cumple con normas AEA 90364 e IRAM 2183.
 */
import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Power,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Info,
  BookOpen,
  Palette,
  RotateCcw,
  Cpu,
  Flame,
  Activity,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Project, SimulationState, ElectricalSymbol } from '../types/electra';
import { ComponentLearningModal } from './ComponentLearningModal';
import { WireColorReferenceModal } from './WireColorReferenceModal';

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
  const [isColorGuideOpen, setIsColorGuideOpen] = useState(false);

  const switches = project.symbols.filter((s) => s.category === 'comando');
  const lamps = project.symbols.filter((s) => s.type === 'luminaria');
  const outlets = project.symbols.filter((s) => s.type === 'tomacorriente' || s.type === 'toma_especial');

  // Artefactos de potencia y utilización (soldadoras, bombas, termotanques, etc.)
  const appliances = project.symbols.filter(
    (s) => s.category === 'utilizacion' && s.type !== 'tomacorriente' && s.type !== 'toma_especial'
  );

  // Protecciones en el plano
  const protectionsOnCanvas = project.symbols.filter(
    (s) => s.category === 'proteccion' || s.type === 'termica' || s.type === 'diferencial' || s.type === 'interruptor_general'
  );

  // Protecciones en el tablero (switchboard)
  const switchboardComps = project.switchboard?.components || [];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F6F8] dark:bg-[#0D161C] p-3 sm:p-6 text-[#18313B] dark:text-[#F1F5F9] space-y-4 sm:space-y-6 max-w-full overflow-x-hidden transition-colors duration-150">
      {/* Cabecera del Banco de Ensayos Responsiva */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#167D78] dark:text-[#2DD4BF] font-bold text-base sm:text-lg">
            <Zap className="w-5 h-5 fill-current shrink-0" />
            <h2>Banco de Pruebas y Simulación Eléctrica</h2>
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Entorno interactivo en tiempo real. Maniobra protecciones (térmicas y diferencial) de forma individual, acciona interruptores y verifica el estado real de la red.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setIsColorGuideOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#E8F5F5] dark:bg-[#167D78]/25 border border-[#B7DFDD] dark:border-[#167D78]/40 text-[#167D78] dark:text-[#2DD4BF] font-bold text-xs rounded-lg shadow-xs transition-colors"
            title="Ver código de colores IRAM 2183 / AEA 90364"
          >
            <Palette className="w-4 h-4" />
            <span>Colores IRAM</span>
          </button>
          <button
            onClick={onVerifyCircuit}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#167D78] hover:bg-[#0F5E5A] active:bg-[#0A4542] text-white font-bold text-xs rounded-lg shadow-xs transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verificar Red</span>
          </button>
          <button
            onClick={() => setEduModalType('termica')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8FAFC] dark:bg-[#1B2B36] hover:bg-[#F1F5F9] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] text-[#167D78] dark:text-[#2DD4BF] text-xs rounded-lg transition-colors font-semibold"
            title="Ver catálogo educativo de componentes con normas AEA"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Guía Técnica</span>
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
              ¡PELIGRO: CORTOCIRCUITO DIRECTO DETECTADO!
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              Existe un camino de resistencia nula entre Fase viva y Neutro sin intercalar una carga resistiva o inductiva. La protección correspondiente ha actuado de inmediato.
            </p>
            <p className="text-xs font-semibold text-red-900 dark:text-red-100 mt-1">
              👉 Acción correctiva: Revisa los cables tendidos en el editor CAD, elimina el puente incorrecto y luego podrás rearmar la térmica con un clic.
            </p>
          </div>
        </div>
      )}

      {/* Resumen de Métricas de Simulación (4 tarjetas métricas) */}
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
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Potencia y Corriente Activa</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#167D78] dark:text-[#2DD4BF]">
              {simState.totalSimulatedCurrentAmps} A
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">
              ({(simState.totalSimulatedCurrentAmps * 220).toFixed(0)} W)
            </span>
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
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Cables con Corriente</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#18313B] dark:text-slate-200">
              {simState.energizedWires.size}
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">de {project.wires.length}</span>
          </div>
        </div>
      </div>

      {/* 1. SECCIÓN DE MANIOBRA INDIVIDUAL DE PROTECCIONES (Objetivo Principal) */}
      <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
          <div>
            <h3 className="font-bold text-[#18313B] dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#167D78] dark:text-[#2DD4BF]" />
              <span>Protecciones Eléctricas — Maniobra y Rearme Individual</span>
            </h3>
            <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
              Cada interruptor controla únicamente su circuito. Puedes bajar una térmica para mantenimiento sin afectar a los demás circuitos, o rearmarla tras corregir una falla.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#167D78] dark:text-[#2DD4BF] border border-[#DCE4E8] dark:border-[#243542] shrink-0">
            Norma AEA 90364-771
          </span>
        </div>

        {/* Tarjetas de Protecciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* A. Interruptor General Automático (IGA) */}
          {(() => {
            const igaSym = project.symbols.find((s) => s.type === 'interruptor_general');
            const igaComp = switchboardComps.find((c) => c.type === 'iga');
            const isTripped = igaSym?.state?.isTripped || igaComp?.state === 'tripped';
            const isOpen = igaSym?.state?.isOpen === true || igaComp?.state === 'open';
            const isClosed = !isTripped && !isOpen;
            const targetId = igaSym?.id || igaComp?.id || 'iga';

            return (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isTripped
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-md'
                    : isOpen
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                      CABECERA GENERAL
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white mt-1">
                      Interruptor General (IGA)
                    </h4>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                      Corte omnipolar general 32A (2P)
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      isTripped
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : isOpen
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isTripped ? '¡DISPARADO!' : isOpen ? 'OFF (ABIERTO)' : 'ON (CERRADO)'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                    {isTripped ? 'Disparo por sobrecorriente' : isOpen ? 'Desconectado manualmente' : 'Alimentando tablero'}
                  </span>
                  <button
                    onClick={() => onToggleBreaker(targetId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 ${
                      isTripped
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                        : isOpen
                        ? 'bg-[#167D78] hover:bg-[#0F5E5A] text-white'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isTripped ? 'Rearmar IGA' : isOpen ? 'Subir Palanca' : 'Bajar Palanca'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* B. Interruptor Diferencial (ID 40A / 30mA) con Botón TEST */}
          {(() => {
            const diffSym = project.symbols.find((s) => s.type === 'diferencial');
            const diffComp = switchboardComps.find((c) => c.type === 'diferencial');
            const isTripped = diffSym?.state?.isTripped || diffComp?.state === 'tripped';
            const isOpen = diffSym?.state?.isOpen === true || diffComp?.state === 'open';
            const isClosed = !isTripped && !isOpen;
            const targetId = diffSym?.id || diffComp?.id || 'diferencial';

            return (
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isTripped
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-md'
                    : isOpen
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                      PROTECCIÓN HUMANA
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white mt-1">
                      Disyuntor Diferencial (ID)
                    </h4>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                      Sensibilidad de fuga: 30 mA (IΔn)
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      isTripped
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : isOpen
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {isTripped ? '¡FUGA A TIERRA!' : isOpen ? 'OFF (ABIERTO)' : 'ON (PROTEGIENDO)'}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  {/* Botón TEST de disparo voluntario */}
                  <button
                    onClick={() => {
                      // Simular fuga residual mediante el botón test
                      onToggleBreaker(targetId);
                    }}
                    className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-amber-950 text-[11px] font-bold shadow-xs active:scale-95 flex items-center gap-1"
                    title="Simular fuga a tierra de 30mA para verificar disparo mecánico"
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-900 inline-block" />
                    <span>TEST (T)</span>
                  </button>

                  <button
                    onClick={() => onToggleBreaker(targetId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 ${
                      isTripped
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                        : isOpen
                        ? 'bg-[#167D78] hover:bg-[#0F5E5A] text-white'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isTripped ? 'Rearmar ID' : isOpen ? 'Subir Palanca' : 'Bajar Palanca'}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* C. Térmicas individuales por Circuito (C1, C2, C3, etc.) */}
          {project.circuits.map((circ) => {
            const breakerSym = project.symbols.find(
              (s) => (s.type === 'termica' || s.category === 'proteccion') && s.circuitId === circ.id
            );
            const switchComp = switchboardComps.find(
              (c) => c.circuitId === circ.id || c.name.includes(circ.id)
            );

            const isTripped = breakerSym?.state?.isTripped || switchComp?.state === 'tripped';
            const isOpen = breakerSym?.state?.isOpen === true || switchComp?.state === 'open';
            const isClosed = !isTripped && !isOpen;
            const targetId = breakerSym?.id || switchComp?.id || circ.id;

            // Calcular potencia y corriente activa que realmente está consumiendo este circuito
            const circLoads = project.symbols.filter((s) => {
              if (s.circuitId !== circ.id) return false;
              if (s.category !== 'utilizacion' && s.type !== 'luminaria') return false;
              return s.state?.isOn;
            });
            const circWatts = circLoads.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
            const circAmps = (circWatts / 220).toFixed(1);

            return (
              <div
                key={circ.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isTripped
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-md'
                    : isOpen
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    : 'bg-white dark:bg-[#1A2833] border-[#DCE4E8] dark:border-[#2A3C4A]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {circ.type} ({circ.id})
                    </span>
                    <h4 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white mt-1">
                      Térmica {circ.id}: {circ.name}
                    </h4>
                    <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                      Calibre: Curva {circ.breakerCurve || 'C'} {circ.breakerAmps || 16}A | Conductor {circ.crossSectionMm2 || 2.5} mm²
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      isTripped
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : isOpen
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isTripped ? '¡DISPARADA!' : isOpen ? 'OFF (ABIERTA)' : 'ON (ACTIVA)'}
                  </span>
                </div>

                <div className="mt-2 text-[11px] text-[#64748B] dark:text-slate-400 flex items-center justify-between">
                  <span>Demanda actual:</span>
                  <span className="font-mono font-bold text-[#18313B] dark:text-slate-200">
                    {circAmps} A ({circWatts} W) de {circ.breakerAmps}A
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                    {isTripped ? 'Disparo térmico/magnético' : isOpen ? 'Circuito seccionado' : 'Circuito energizado'}
                  </span>
                  <button
                    onClick={() => onToggleBreaker(targetId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 ${
                      isTripped
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                        : isOpen
                        ? 'bg-[#167D78] hover:bg-[#0F5E5A] text-white'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {isTripped ? 'Rearmar Térmica' : isOpen ? 'Subir Palanca' : 'Bajar Palanca'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Cuadrículas de Control Interactivo (Interruptores y Cargas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Panel 1: Interruptores y Llaves de Comando */}
        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-3 sm:space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-2">
            <h3 className="font-bold text-[#18313B] dark:text-slate-200 text-xs sm:text-sm flex items-center gap-2">
              <Power className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
              <span>Interruptores y Llaves de Comando</span>
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
                        {isEnergized ? '⚡ Con potencial vivo' : '⚪ Sin tensión aguas arriba'}
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
              <span>Bocas de Iluminación y Lámparas</span>
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
                          className={`w-3.5 h-3.5 shrink-0 ${isOn ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-slate-400'}`}
                        />
                        <span className="truncate">{lamp.label}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-300 truncate max-w-[150px]">{lamp.name}</div>
                      <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
                        {lamp.powerWatts || 60} W ({((lamp.powerWatts || 60) / 220).toFixed(2)} A)
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${
                        isOn ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isOn ? 'ENCENDIDA' : 'APAGADA'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Panel de Artefactos de Potencia y Utilización (Soldadoras, Bombas, Termotanques) */}
      {appliances.length > 0 && (
        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-2">
            <h3 className="font-bold text-[#18313B] dark:text-slate-200 text-xs sm:text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
              <span>Artefactos de Potencia y Cargas Especiales (Estado Real)</span>
            </h3>
            <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400">
              Sin cables = 0 A / 0 W (No generan sobrecargas falsas)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {appliances.map((app) => {
              const isEnergized = app.state?.isOn;
              const hasWires = project.wires.some(
                (w) => w.fromComponentId === app.id || w.toComponentId === app.id
              );

              return (
                <div
                  key={app.id}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-2.5 transition-all ${
                    isEnergized
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 text-emerald-900 dark:text-emerald-100'
                      : 'bg-[#F8FAFC] dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#64748B] dark:text-slate-400'
                  }`}
                >
                  <div className="space-y-0.5 truncate">
                    <div className="font-bold text-xs text-[#18313B] dark:text-white truncate">
                      {app.label}: {app.name}
                    </div>
                    <div className="text-[10px] text-[#64748B] dark:text-slate-400">
                      Potencia nominal: {app.powerWatts} W
                    </div>
                    <div className="text-[10px] font-mono">
                      {!hasWires ? (
                        <span className="text-slate-400 italic">Desconectado (0 A — Sin cables)</span>
                      ) : isEnergized ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Consumiendo {((app.powerWatts || 0) / 220).toFixed(1)} A
                        </span>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400">Térmica abierta (0 A)</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      !hasWires
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        : isEnergized
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {!hasWires ? 'DESCONECTADO' : isEnergized ? 'ACTIVO' : 'SIN TENSIÓN'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nota de Responsabilidad */}
      <div className="p-3.5 sm:p-4 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-xl text-xs text-[#64748B] dark:text-slate-400 leading-relaxed flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-[#167D78] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#18313B] dark:text-slate-200">Aviso técnico y educativo:</span>
          <p className="mt-0.5 text-[11px] sm:text-xs">
            El motor de simulación de ELECTRA PLAN modela continuidad topológica de grafos, maniobra individual de protecciones termomagnéticas y diferenciales, y cálculo riguroso de corrientes activas según la ley de Ohm y AEA 90364-771.
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

      {/* Modal de Código de Colores IRAM 2183 */}
      {isColorGuideOpen && (
        <WireColorReferenceModal onClose={() => setIsColorGuideOpen(false)} />
      )}
    </div>
  );
};
