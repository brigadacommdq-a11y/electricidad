/**
 * ELECTRA PLAN — Módulo de Cálculos Eléctricos Transparentes
 * Fórmulas matemáticas abiertas, verificación de caída de tensión y coordinación térmica
 */
import React, { useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Info,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { Project } from '../types/electra';
import {
  calculateProjectInstallation,
  GlobalProjectCalculation,
  CircuitCalculation,
} from '../services/electricalCalculations';

interface CalculationsViewProps {
  project: Project;
}

export const CalculationsView: React.FC<CalculationsViewProps> = ({ project }) => {
  const [simultaneityFactor, setSimultaneityFactor] = useState(0.8);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const calcResult: GlobalProjectCalculation = calculateProjectInstallation(
    project,
    simultaneityFactor
  );

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-6 text-slate-100 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-900 border border-slate-800 p-3.5 sm:p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base sm:text-lg">
            <Calculator className="w-5 h-5 shrink-0" />
            <h2>Memoria de Cálculos Eléctricos (AEA 90364)</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Fórmulas electrotécnicas transparentes: corriente de proyecto (Ib), caída de tensión (ΔV) y coordinación térmica (Ib ≤ In ≤ Iz).
          </p>
        </div>

        {/* Selector de Simultaneidad */}
        <div className="flex items-center justify-between sm:justify-end gap-3 bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-700 shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 block">Factor de Simultaneidad</span>
            <span className="text-xs font-mono font-bold text-amber-400">{simultaneityFactor}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.0"
            step="0.05"
            value={simultaneityFactor}
            onChange={(e) => setSimultaneityFactor(Number(e.target.value))}
            className="w-24 sm:w-28 accent-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Tarjetas de Totales Globales (2x2 en Celular, 4x1 en Desktop) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Potencia Total (P)</span>
          <div className="text-lg sm:text-2xl font-bold font-mono text-white mt-0.5 sm:mt-1 truncate">
            {calcResult.totalInstalledWatts} W
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
            {(calcResult.totalInstalledWatts / 1000).toFixed(2)} kW activos
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Aparente Total (S)</span>
          <div className="text-lg sm:text-2xl font-bold font-mono text-cyan-300 mt-0.5 sm:mt-1 truncate">
            {calcResult.totalInstalledVA} VA
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
            {(calcResult.totalInstalledVA / 1000).toFixed(2)} kVA
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Demanda Máx (DMPS)</span>
          <div className="text-lg sm:text-2xl font-bold font-mono text-amber-400 mt-0.5 sm:mt-1 truncate">
            {calcResult.maxDemandWatts} W
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
            con factor {simultaneityFactor}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl">
          <span className="text-[10px] sm:text-[11px] text-slate-400 block truncate">Corriente Acometida</span>
          <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5 sm:mt-1 truncate">
            {calcResult.generalMainCurrentAmps} A
          </div>
          <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono">
            Tensión 220 V
          </span>
        </div>
      </div>

      {/* Explicación de Fórmulas y Criterios Matemáticos */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 sm:p-5 rounded-xl space-y-2.5 sm:space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Info className="w-4 h-4 shrink-0" />
          <span>Fórmulas Matemáticas Transparentes Aplicadas</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-4 text-xs">
          <div className="bg-slate-950 p-3 sm:p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200">1. Corriente de Proyecto (Ib)</span>
            <div className="font-mono text-amber-300 text-[11px] bg-slate-900 p-2 rounded">
              Ib = P / (V · cos φ)
            </div>
            <p className="text-[11px] text-slate-400">
              P es potencia activa (W), V tensión (220V) y cos φ factor de potencia.
            </p>
          </div>

          <div className="bg-slate-950 p-3 sm:p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200">2. Caída de Tensión (ΔV)</span>
            <div className="font-mono text-cyan-300 text-[11px] bg-slate-900 p-2 rounded">
              ΔV = (2 · L · Ib · cos φ) / (κ · S)
            </div>
            <p className="text-[11px] text-slate-400">
              L: metros, κ Cu = 56, S: sección mm². Límite: 3% (Ilum.), 5% (Tomas).
            </p>
          </div>

          <div className="bg-slate-950 p-3 sm:p-3.5 rounded-lg border border-slate-800 space-y-1">
            <span className="font-semibold text-slate-200">3. Regla de Coordinación</span>
            <div className="font-mono text-emerald-300 text-[11px] bg-slate-900 p-2 rounded">
              Ib ≤ In ≤ Iz
            </div>
            <p className="text-[11px] text-slate-400">
              Térmica In mayor que carga Ib y menor o igual que admisible Iz del cable.
            </p>
          </div>
        </div>
      </div>

      {/* Cuadro de Cargas por Circuito */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm text-white">Cuadro de Cargas y Verificación por Circuito</h3>
            <span className="text-[11px] text-slate-400">Valores calculados dinámicamente</span>
          </div>

          {/* Selector de Vista (Tarjetas en Celular vs Tabla) */}
          <div className="flex md:hidden items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                viewMode === 'cards' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Fichas
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded font-semibold transition-colors ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Tabla ↔
            </button>
          </div>
        </div>

        {/* Vista en Fichas / Tarjetas para Celular */}
        <div className={`p-3 space-y-2.5 ${viewMode === 'cards' ? 'block md:hidden' : 'hidden'}`}>
          {calcResult.circuits.map((c: CircuitCalculation) => (
            <div
              key={c.circuitId}
              className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-amber-400 text-sm">{c.circuitId}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {c.circuitType}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-semibold mt-0.5">{c.circuitName}</div>
                </div>

                <div>
                  {c.isVoltageDropCompliant && c.isProtectionCoordinated ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      Conforme
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                      <AlertTriangle className="w-3 h-3" />
                      Verificar
                    </span>
                  )}
                </div>
              </div>

              {/* Grid técnico compacto de valores */}
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                <div className="bg-slate-900/80 p-2 rounded">
                  <span className="text-[9px] text-slate-400 font-sans block">Potencia</span>
                  <span className="font-bold text-white">{c.activePowerWatts} W</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded">
                  <span className="text-[9px] text-slate-400 font-sans block">Corriente (Ib)</span>
                  <span className="font-bold text-emerald-400">{c.designCurrentAmps} A</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded">
                  <span className="text-[9px] text-slate-400 font-sans block">Sección (S)</span>
                  <span className="font-bold text-cyan-300">{c.crossSectionMm2} mm²</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded">
                  <span className="text-[9px] text-slate-400 font-sans block">Térmica (In)</span>
                  <span className="font-bold text-amber-300">{c.breakerRatingAmps} A</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded">
                  <span className="text-[9px] text-slate-400 font-sans block">Admisible (Iz)</span>
                  <span className="font-bold text-slate-300">{c.admissibleCurrentAmps} A</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded">
                  <span className="text-[9px] text-slate-400 font-sans block">Caída (ΔV)</span>
                  <span className={`font-bold ${c.isVoltageDropCompliant ? 'text-slate-200' : 'text-red-400'}`}>
                    {c.voltageDropPercent}%
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-1 font-sans border-t border-slate-800/80">
                {c.verificationNotes[0]}
              </div>
            </div>
          ))}
        </div>

        {/* Vista en Tabla con Desplazamiento Horizontal Suave */}
        <div className={`overflow-x-auto ${viewMode === 'table' ? 'block' : 'hidden md:block'}`}>
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800 font-semibold uppercase">
              <tr>
                <th className="py-3 px-4">Circuito</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Bocas</th>
                <th className="py-3 px-3">Potencia (W)</th>
                <th className="py-3 px-3">Corriente (Ib)</th>
                <th className="py-3 px-3">Sección (S)</th>
                <th className="py-3 px-3">Long. Ida</th>
                <th className="py-3 px-3">Caída (ΔV)</th>
                <th className="py-3 px-3">Térmica (In)</th>
                <th className="py-3 px-3">Admisible (Iz)</th>
                <th className="py-3 px-4">Diagnóstico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {calcResult.circuits.map((c: CircuitCalculation) => {
                return (
                  <tr key={c.circuitId} className="hover:bg-slate-850 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      <span className="text-amber-400">{c.circuitId}</span>
                      <span className="font-sans font-normal text-slate-300 block text-[11px]">
                        {c.circuitName}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans font-semibold">
                      {c.circuitType}
                    </td>
                    <td className="py-3 px-3 text-slate-300">{c.loadCount}</td>
                    <td className="py-3 px-3 text-slate-200">{c.activePowerWatts} W</td>
                    <td className="py-3 px-3 font-bold text-emerald-400">{c.designCurrentAmps} A</td>
                    <td className="py-3 px-3 text-cyan-300">{c.crossSectionMm2} mm²</td>
                    <td className="py-3 px-3 text-slate-300">{c.lengthMeters} m</td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          c.isVoltageDropCompliant ? 'text-slate-200' : 'text-red-400 font-bold'
                        }`}
                      >
                        {c.voltageDropVolts} V ({c.voltageDropPercent}%)
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        máx {c.maxAllowedVoltageDropPercent}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-amber-300 font-bold">{c.breakerRatingAmps} A</td>
                    <td className="py-3 px-3 text-slate-400">{c.admissibleCurrentAmps} A</td>
                    <td className="py-3 px-4 font-sans">
                      {c.isVoltageDropCompliant && c.isProtectionCoordinated ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60">
                          <CheckCircle2 className="w-3 h-3" />
                          Conforme
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                          <AlertTriangle className="w-3 h-3" />
                          Verificar
                        </span>
                      )}
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                        {c.verificationNotes[0]}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cuadro de Advertencia Normativa */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-xl text-xs text-slate-400 space-y-1">
        <span className="font-semibold text-slate-200">Pendiente de verificación normativa en obra:</span>
        <p className="leading-relaxed">
          Los valores de corriente admisible (Iz) tabulados corresponden a conductores de cobre con aislación de PVC en cañería embutida en pared a 40 °C de temperatura ambiente (Método de instalación B1 de la Reglamentación AEA 90364-7-771).
          Si varios circuitos comparten la misma cañería, debe aplicarse un factor de reducción por agrupamiento (fn) y por temperatura según tablas oficiales.
        </p>
      </div>
    </div>
  );
};
