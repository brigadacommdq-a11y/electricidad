/**
 * ELECTRA PLAN — Módulo de Tablero Eléctrico y Riel DIN Virtual
 * Integra el TALLER DE TABLEROS ELÉCTRICOS REALISTAS (Editor DIN, Cableado y 15 Prácticas)
 * junto con la vista rápida de riel normalizado.
 */
import React, { useState } from 'react';
import {
  Cpu,
  Power,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  Wrench,
  Layers,
} from 'lucide-react';
import { Project, SwitchboardComponent } from '../types/electra';
import { SwitchboardWorkshopView } from './switchboard/SwitchboardWorkshopView';

interface SwitchboardViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const SwitchboardView: React.FC<SwitchboardViewProps> = ({ project, onUpdateProject }) => {
  const [activeSubMode, setActiveSubMode] = useState<'taller' | 'clasico'>('taller');
  const { switchboard } = project;

  // Si está en modo Taller Realista, renderizar la experiencia inmersiva del Taller
  if (activeSubMode === 'taller') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Barra superior de conmutación de modo */}
        <div className="bg-slate-900 border-b border-slate-800 px-3 py-1 flex items-center justify-between text-xs text-slate-400 shrink-0 z-30">
          <div className="flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-slate-200">Taller de Tableros Eléctricos Realistas (AEA 90364)</span>
          </div>
          <button
            onClick={() => setActiveSubMode('clasico')}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
          >
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Ver Riel Rápido Clásico</span>
          </button>
        </div>

        {/* Vista del Taller Realista */}
        <div className="flex-1 overflow-hidden relative">
          <SwitchboardWorkshopView project={project} onUpdateProject={onUpdateProject} />
        </div>
      </div>
    );
  }

  // Alternar estado de componente del tablero clásico (abrir/cerrar)
  const handleToggleState = (compId: string) => {
    onUpdateProject((prev) => ({
      ...prev,
      switchboard: {
        ...prev.switchboard,
        components: prev.switchboard.components.map((c) => {
          if (c.id === compId) {
            const nextState = c.state === 'closed' ? 'open' : 'closed';
            return { ...c, state: nextState };
          }
          return c;
        }),
      },
    }));
  };

  // Botón de prueba "TEST" del disyuntor diferencial (simula fuga que dispara la protección)
  const handleTestDifferential = (compId: string) => {
    onUpdateProject((prev) => ({
      ...prev,
      switchboard: {
        ...prev.switchboard,
        components: prev.switchboard.components.map((c) =>
          c.id === compId ? { ...c, state: 'tripped' } : c
        ),
      },
    }));
  };

  // Restablecer todas las protecciones del tablero a estado cerrado
  const handleResetAll = () => {
    onUpdateProject((prev) => ({
      ...prev,
      switchboard: {
        ...prev.switchboard,
        components: prev.switchboard.components.map((c) => ({ ...c, state: 'closed' })),
      },
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-6 text-slate-100 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Cabecera con selector para ir al Taller Realista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900 border border-slate-800 p-3.5 sm:p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base sm:text-lg">
            <Cpu className="w-5 h-5 shrink-0" />
            <h2>{switchboard.name} — Tablero Seccional</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Representación rápida sobre Riel DIN normalizado (35 mm). Incluye IGA, Interruptor Diferencial (ID 30mA) y PIAs seccionales.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubMode('taller')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all shrink-0"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Abrir Taller Realista</span>
          </button>
          <button
            onClick={handleResetAll}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 border border-slate-700 text-xs text-slate-200 hover:text-white rounded-lg transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Armario / Gabinete de Tablero Visual */}
      <div className="bg-slate-900 border-2 border-slate-700 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-slate-400 pb-3 sm:pb-4 border-b border-slate-800 font-mono gap-1">
          <span>GABINETE DIN 35mm · GRADO IP40</span>
          <span>UBICACIÓN: {switchboard.location || 'Acceso Principal'}</span>
        </div>

        {/* Indicador de desplazamiento para móviles */}
        <div className="sm:hidden text-[10px] text-amber-400/90 font-medium py-1.5 flex items-center gap-1">
          <span>↔ Desliza horizontalmente para ver todos los interruptores del riel</span>
        </div>

        {/* Riel DIN Metálico */}
        <div className="my-4 sm:my-8 relative">
          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-9 bg-gradient-to-b from-slate-400 via-slate-300 to-slate-500 rounded border border-slate-600 shadow-inner z-0">
            <div className="h-full w-full flex justify-between items-center px-4 opacity-40">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="w-4 h-2 bg-slate-700 rounded-sm" />
              ))}
            </div>
          </div>

          {/* Módulos de Protecciones Montados sobre el Riel */}
          <div
            className="relative z-10 flex items-center gap-2.5 overflow-x-auto py-4 px-2 sm:px-3 touch-pan-x"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {switchboard.components.map((comp: SwitchboardComponent) => {
              const isClosed = comp.state === 'closed';
              const isTripped = comp.state === 'tripped';
              const isDiff = comp.type === 'diferencial';
              const isIga = comp.type === 'iga';

              return (
                <div
                  key={comp.id}
                  className={`w-36 shrink-0 rounded-lg border-2 p-3 flex flex-col justify-between transition-all select-none shadow-md ${
                    isTripped
                      ? 'bg-red-950/80 border-red-500 text-red-100 shadow-red-500/20'
                      : isClosed
                      ? 'bg-slate-800/95 border-slate-600 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-400 opacity-80'
                  }`}
                  style={{ minHeight: '190px' }}
                >
                  <div className="border-b border-slate-700/60 pb-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                      <span className="text-amber-400">{comp.poles}</span>
                      <span className="text-slate-400">
                        {isIga ? 'IGA' : isDiff ? 'ID 30mA' : comp.circuitId || 'PIA'}
                      </span>
                    </div>
                    <div className="font-bold text-xs truncate mt-0.5 text-white">{comp.name}</div>
                  </div>

                  <div className="py-2 text-center space-y-1">
                    <div className="text-xl font-bold font-mono text-amber-300">
                      {comp.ratingAmps} A
                    </div>
                    {isDiff && (
                      <div className="text-[10px] font-mono text-cyan-300">
                        IΔn = {comp.sensitivityMa || 30} mA
                      </div>
                    )}
                    <div className="text-[10px] font-mono text-slate-400">
                      {isIga ? 'Curva C · 4.5kA' : isDiff ? 'Tipo AC · Clase A' : 'Curva C · 3kA'}
                    </div>
                  </div>

                  {isDiff && (
                    <button
                      onClick={() => handleTestDifferential(comp.id)}
                      title="Pulsar botón de prueba reglamentario TEST (simula disparo por corriente de fuga)"
                      className="w-full py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[10px] transition-colors mb-1.5"
                    >
                      BOTÓN TEST [T]
                    </button>
                  )}

                  <button
                    onClick={() => handleToggleState(comp.id)}
                    className={`w-full py-1.5 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                      isTripped
                        ? 'bg-red-600 text-white font-extrabold animate-pulse'
                        : isClosed
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{isTripped ? 'DISPARADO' : isClosed ? 'CONECTADO' : 'ABIERTO'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Barras Colectoras: Neutro y Tierra (PE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-sky-900/60">
            <div className="flex items-center justify-between text-xs text-sky-400 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                Barra Colectora de Neutro (N)
              </span>
              <span className="font-mono text-[10px]">Tensión ref: 0 V</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Bornera de latón aislada montada en zócalo plástico. Distribuye el neutro celeste a los circuitos derivados tras pasar por el diferencial.
            </p>
          </div>

          <div className="bg-slate-950/80 p-3.5 rounded-xl border border-emerald-900/60">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Barra de Puesta a Tierra (PE / BPT)
              </span>
              <span className="font-mono text-[10px]">Vinculada a Jabalina</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Bornera verde-amarilla conectada directamente al electrodo de dispersión en suelo. Mantiene todas las masas a potencial de tierra.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
