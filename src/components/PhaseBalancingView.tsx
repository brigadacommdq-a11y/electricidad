/**
 * ELECTRA PLAN — Módulo de Balance de Fases Monofásico y Trifásico
 * Distribución de cargas entre R, S, T, cálculo de corriente en el neutro y porcentaje de desequilibrio según AEA 771.
 */
import React, { useMemo } from 'react';
import { Project, Circuit } from '../types/electra';
import {
  Activity,
  Zap,
  Layers,
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Sliders,
} from 'lucide-react';

interface PhaseBalancingViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const PhaseBalancingView: React.FC<PhaseBalancingViewProps> = ({ project, onUpdateProject }) => {
  const supplyType = project.metadata.supplyType || 'monofasica_220v';

  // Cambiar tipo de suministro
  const handleSetSupplyType = (type: 'monofasica_220v' | 'trifasica_380v' | 'trifasica_sin_neutro') => {
    onUpdateProject((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        supplyType: type,
      },
    }));
  };

  // Calcular potencia y corriente por fase
  const phaseStats = useMemo(() => {
    const circuits = project.circuits;
    let powerR = 0;
    let powerS = 0;
    let powerT = 0;

    circuits.forEach((c) => {
      // Calcular potencia total de las bocas asociadas a este circuito
      const symbols = project.symbols.filter((s) => s.circuitId === c.id);
      const circuitPower =
        symbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0) || (c.type === 'IUG' ? 600 : 1800);

      const assigned = c.assignedPhase || 'R';
      if (assigned === 'R') {
        powerR += circuitPower;
      } else if (assigned === 'S') {
        powerS += circuitPower;
      } else if (assigned === 'T') {
        powerT += circuitPower;
      } else if (assigned === 'R-S-T') {
        powerR += circuitPower / 3;
        powerS += circuitPower / 3;
        powerT += circuitPower / 3;
      }
    });

    const vPhase = 220; // V fase-neutro
    const cosPhi = 0.9;

    const currentR = Number((powerR / (vPhase * cosPhi)).toFixed(1));
    const currentS = Number((powerS / (vPhase * cosPhi)).toFixed(1));
    const currentT = Number((powerT / (vPhase * cosPhi)).toFixed(1));

    const totalPower = powerR + powerS + powerT;
    const avgCurrent = (currentR + currentS + currentT) / 3 || 1;
    const maxCurrent = Math.max(currentR, currentS, currentT);
    const minCurrent = Math.min(currentR, currentS, currentT);

    // Desbalance % = ((Imax - Iprom) / Iprom) * 100
    const unbalancePercent = avgCurrent > 0 ? Number((((maxCurrent - avgCurrent) / avgCurrent) * 100).toFixed(1)) : 0;

    // Estimación corriente de neutro vectorial
    // In = sqrt(Ir^2 + Is^2 + It^2 - Ir*Is - Is*It - It*Ir)
    const iNeutro = Number(
      Math.sqrt(
        Math.max(
          0,
          currentR ** 2 +
            currentS ** 2 +
            currentT ** 2 -
            currentR * currentS -
            currentS * currentT -
            currentT * currentR
        )
      ).toFixed(1)
    );

    return {
      powerR: Math.round(powerR),
      powerS: Math.round(powerS),
      powerT: Math.round(powerT),
      currentR,
      currentS,
      currentT,
      totalPower,
      unbalancePercent,
      iNeutro,
      isBalanced: unbalancePercent <= 10.0,
    };
  }, [project.circuits, project.symbols]);

  // Reasignar fase de un circuito
  const handleAssignPhase = (circuitId: string, phase: 'R' | 'S' | 'T' | 'R-S-T') => {
    onUpdateProject((prev) => ({
      ...prev,
      circuits: prev.circuits.map((c) => (c.id === circuitId ? { ...c, assignedPhase: phase } : c)),
    }));
  };

  // Auto-balancear fases automáticamente
  const handleAutoBalance = () => {
    onUpdateProject((prev) => {
      const circuits = [...prev.circuits];
      // Ordenar por potencia descendente
      const circuitsWithPower = circuits.map((c) => {
        const symbols = prev.symbols.filter((s) => s.circuitId === c.id);
        const p = symbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0) || (c.type === 'IUG' ? 600 : 1800);
        return { circuit: c, power: p };
      });
      circuitsWithPower.sort((a, b) => b.power - a.power);

      const phaseLoads = { R: 0, S: 0, T: 0 };
      const nextCircuits = circuits.map((c) => {
        const item = circuitsWithPower.find((i) => i.circuit.id === c.id);
        const p = item?.power || 1000;

        // Elegir la fase con menor carga actual
        let targetPhase: 'R' | 'S' | 'T' = 'R';
        if (phaseLoads.S < phaseLoads[targetPhase]) targetPhase = 'S';
        if (phaseLoads.T < phaseLoads[targetPhase]) targetPhase = 'T';

        phaseLoads[targetPhase] += p;
        return { ...c, assignedPhase: targetPhase };
      });

      return {
        ...prev,
        circuits: nextCircuits,
      };
    });
  };

  return (
    <div className="flex-1 bg-slate-950 text-slate-100 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Cabecera */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                DISTRIBUCIÓN DE POTENCIA
              </span>
              <span className="text-xs text-slate-400 font-mono">AEA 90364-771 Tabla 771.18</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-amber-400" />
              <span>Balance de Cargas Monofásico & Trifásico</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Configura el tipo de acometida y equilibra la corriente demandada entre las fases R, S y T para evitar sobrecargas y caídas de tensión en el neutro.
            </p>
          </div>

          {/* Selector de suministro */}
          <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => handleSetSupplyType('monofasica_220v')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                supplyType === 'monofasica_220v'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Monofásica (220V)
            </button>
            <button
              onClick={() => handleSetSupplyType('trifasica_380v')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                supplyType === 'trifasica_380v'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trifásica (380V 3F+N)
            </button>
            <button
              onClick={() => handleSetSupplyType('trifasica_sin_neutro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                supplyType === 'trifasica_sin_neutro'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trifásica 3F
            </button>
          </div>
        </div>
      </div>

      {/* Tarjetas de Métricas de Fases R, S, T */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Fase R */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>Fase R (L1)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">220V</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{phaseStats.currentR} A</div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Potencia:</span>
            <span className="text-slate-200 font-mono font-bold">{phaseStats.powerR} W</span>
          </div>
          {/* Barra de carga */}
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (phaseStats.currentR / 32) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Fase S */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span>Fase S (L2)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">220V</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{phaseStats.currentS} A</div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Potencia:</span>
            <span className="text-slate-200 font-mono font-bold">{phaseStats.powerS} W</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (phaseStats.currentS / 32) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Fase T */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
              <span>Fase T (L3)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">220V</span>
          </div>
          <div className="text-2xl font-black text-white font-mono">{phaseStats.currentT} A</div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Potencia:</span>
            <span className="text-slate-200 font-mono font-bold">{phaseStats.powerT} W</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, (phaseStats.currentT / 32) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Diagnóstico de Neutro y Desbalance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Desequilibrio & Neutro
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-2xl font-black font-mono ${
                  phaseStats.isBalanced ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {phaseStats.unbalancePercent}%
              </span>
              <span className="text-[10px] text-slate-400 font-mono">(Máx: 10%)</span>
            </div>
          </div>

          <div className="text-xs text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
            Corriente en Neutro IN: <strong>{phaseStats.iNeutro} A</strong>
          </div>

          <div className="text-[10px] text-slate-400">
            {phaseStats.isBalanced ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Cargas correctamente equilibradas
              </span>
            ) : (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Desbalance &gt; 10%, redistribuir circuitos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de Asignación de Circuitos a Fases */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              <span>Asignación de Fases por Circuito</span>
            </h3>
            <p className="text-xs text-slate-400">
              Distribuye los circuitos entre R, S y T para optimizar el rendimiento y evitar caídas de tensión en el neutro.
            </p>
          </div>

          <button
            onClick={handleAutoBalance}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Equilibrar Fases Automáticamente</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3">Circuito</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Potencia Estimada</th>
                <th className="py-2.5 px-3">Corriente Ib</th>
                <th className="py-2.5 px-3">Protección In</th>
                <th className="py-2.5 px-3 text-center">Fase Asignada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {project.circuits.map((c) => {
                const symbols = project.symbols.filter((s) => s.circuitId === c.id);
                const p = symbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0) || (c.type === 'IUG' ? 600 : 1800);
                const ib = Number((p / (220 * 0.9)).toFixed(1));
                const currentPhase = c.assignedPhase || 'R';

                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-amber-400">{c.id} - {c.name}</td>
                    <td className="py-2.5 px-3 text-slate-300">{c.type}</td>
                    <td className="py-2.5 px-3 text-white font-bold">{p} W</td>
                    <td className="py-2.5 px-3 text-slate-300">{ib} A</td>
                    <td className="py-2.5 px-3 text-slate-300">{c.breakerAmps} A (Curva {c.breakerCurve})</td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        {(['R', 'S', 'T'] as const).map((phase) => (
                          <button
                            key={phase}
                            type="button"
                            onClick={() => handleAssignPhase(c.id, phase)}
                            className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                              currentPhase === phase
                                ? phase === 'R'
                                  ? 'bg-red-500 text-white shadow-xs'
                                  : phase === 'S'
                                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                                  : 'bg-sky-500 text-white shadow-xs'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {phase}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
