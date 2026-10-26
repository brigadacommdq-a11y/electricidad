/**
 * ELECTRA PLAN — Vista Dedicada del Simulador Eléctrico
 * Banco de ensayos virtual interactivo con accionamiento de interruptores,
 * comprobación de continuidad lógica, detección de cortocircuitos y análisis de cargas.
 */
import React from 'react';
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
} from 'lucide-react';
import { Project, SimulationState, ElectricalSymbol } from '../types/electra';

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
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 text-slate-100 space-y-6">
      {/* Cabecera del Banco de Ensayos */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
            <Zap className="w-5 h-5 fill-amber-400" />
            <h2>Banco de Pruebas y Simulación Eléctrica</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Entorno lógico interactivo. Acciona teclas e interruptores en tiempo real para verificar el flujo de potencial (Fase) y retorno (Neutro) hacia las cargas conectadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onVerifyCircuit}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verificar Continuidad</span>
          </button>
          <button
            onClick={onResetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Alerta de Cortocircuito si existe */}
      {simState.hasShortCircuit && (
        <div className="bg-red-950/80 border-2 border-red-500 p-4 rounded-xl flex items-start gap-3 shadow-lg">
          <XCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-200 text-sm">
              ¡PELIGRO: CORTOCIRCUITO DETECTADO EN EL MODELO!
            </h3>
            <p className="text-xs text-red-300 leading-relaxed">
              Existe un conductor que une directamente la Fase con el Neutro sin intercalar una carga con resistencia o impedancia adecuada.
              En una instalación real, esto provocaría una corriente de cortocircuito elevada (Icc) y el disparo magnético instantáneo de la protección.
            </p>
            <p className="text-xs font-semibold text-red-100 mt-2">
              👉 Acción correctiva: Revisa los cables tendidos en el editor CAD y elimina el puente indebido entre Fase y Neutro.
            </p>
          </div>
        </div>
      )}

      {/* Resumen de Métricas de Simulación */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block">Lámparas Encendidas</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-amber-400">
              {simState.activeLamps.size}
            </span>
            <span className="text-xs text-slate-500">de {lamps.length} instaladas</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block">Corriente Activa en Simulación</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-emerald-400">
              {simState.totalSimulatedCurrentAmps} A
            </span>
            <span className="text-xs text-slate-500">a 220 V</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block">Tomas Energizados</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-cyan-400">
              {outlets.filter((o) => o.state?.isEnergized).length}
            </span>
            <span className="text-xs text-slate-500">de {outlets.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <span className="text-[11px] text-slate-400 block">Cables Activos con Flujo</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold font-mono text-slate-200">
              {simState.energizedWires.size}
            </span>
            <span className="text-xs text-slate-500">de {project.wires.length} cables</span>
          </div>
        </div>
      </div>

      {/* Cuadrículas de Control Interactivo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Comandos e Interruptores Activos */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Power className="w-4 h-4 text-emerald-400" />
              <span>Interruptores y Llaves de Comando</span>
            </h3>
            <span className="text-[11px] text-slate-400">Haz clic para alternar encendido</span>
          </div>

          {switches.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No hay interruptores colocados en el plano.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {switches.map((sw: ElectricalSymbol) => {
                const isOpen = sw.state?.isOpen !== false;
                const isEnergized = sw.state?.isEnergized;

                return (
                  <button
                    key={sw.id}
                    onClick={() => onToggleSwitch(sw.id)}
                    className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between gap-3 ${
                      !isOpen
                        ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-200 shadow-sm'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-white">{sw.label}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{sw.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {isEnergized ? '⚡ Con potencial (Fase)' : '⚪ Sin tensión'}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        !isOpen ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {!isOpen ? 'CERRADO (ON)' : 'ABIERTO (OFF)'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel 2: Puntos de Luz y Estado Luminoso */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Bocas de Iluminación y Cargas</span>
            </h3>
            <span className="text-[11px] text-slate-400">Estado simulado</span>
          </div>

          {lamps.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">No hay luminarias colocadas en el plano.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {lamps.map((lamp: ElectricalSymbol) => {
                const isOn = simState.activeLamps.has(lamp.id);
                return (
                  <div
                    key={lamp.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                      isOn
                        ? 'bg-amber-950/40 border-amber-500/70 text-amber-100 shadow-amber-500/10 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                        <Lightbulb
                          className={`w-3.5 h-3.5 ${isOn ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`}
                        />
                        <span>{lamp.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate max-w-[140px]">{lamp.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Consumo: {lamp.powerWatts} W ({((lamp.powerWatts || 60) / 220).toFixed(2)} A)
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        isOn ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-500'
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

      {/* Nota de Responsabilidad y Verificación Normativa */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed flex items-start gap-3">
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Aviso técnico y educativo:</span>
          <p className="mt-0.5">
            El motor de simulación de ELECTRA PLAN realiza una verificación de continuidad lógica de nodos y caminos eléctricos basada en el modelo matemático del grafo de terminales.
            No simula fenómenos físicos transitorios de alta frecuencia, arqueos eléctricos por aislación deficiente ni resistencia óhmica de contacto real.
            Toda instalación debe ser certificada por un profesional matriculado cumpliendo la reglamentación AEA 90364 y leyes locales vigentes.
          </p>
        </div>
      </div>
    </div>
  );
};
