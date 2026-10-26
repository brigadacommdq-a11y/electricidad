/**
 * ELECTRA PLAN — Ficha Técnica y Especificación de Conductor
 * Detalle normativo AEA 90364-771, cálculo transparente de Iz, coordinación de protecciones y caída de tensión.
 */

import React, { useState } from 'react';
import {
  X,
  Zap,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sliders,
  CheckCircle,
  HelpCircle,
  Cpu,
  Layers,
} from 'lucide-react';
import { Wire, Project } from '../types/electra';
import { generateConductorSpec, ConductorSpecSheet } from '../services/conductorSizing';

interface ConductorSpecificationModalProps {
  isOpen: boolean;
  wire: Wire | null;
  project: Project;
  onClose: () => void;
  onUpdateWire: (updatedWire: Wire) => void;
}

export const ConductorSpecificationModal: React.FC<ConductorSpecificationModalProps> = ({
  isOpen,
  wire,
  project,
  onClose,
  onUpdateWire,
}) => {
  const [ambientTemp, setAmbientTemp] = useState<number>(40);
  const [groupingCount, setGroupingCount] = useState<number>(1);
  const [overrideSection, setOverrideSection] = useState<number | null>(null);
  const [overrideSlack, setOverrideSlack] = useState<number | null>(null);

  if (!isOpen || !wire) return null;

  const currentWire: Wire = {
    ...wire,
    crossSectionMm2: overrideSection !== null ? overrideSection : wire.crossSectionMm2,
    slackPercent: overrideSlack !== null ? overrideSlack : wire.slackPercent || 15,
  };

  const spec: ConductorSpecSheet = generateConductorSpec(
    currentWire,
    project,
    ambientTemp,
    groupingCount
  );

  const handleSave = () => {
    onUpdateWire({
      ...wire,
      crossSectionMm2: spec.crossSectionMm2,
      slackPercent: spec.slackPercent,
      isManualOverride: true,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full border border-white/20 shadow-xs"
              style={{ backgroundColor: spec.standardColorHex }}
            />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Especificación Técnica de Conductor
                <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {spec.crossSectionMm2} mm²
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Función: <strong className="text-slate-200 capitalize">{spec.functionType}</strong> • {spec.circuitName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto text-xs sm:text-sm">
          {/* Alertas o Notas de advertencia */}
          {spec.notes.length > 0 && (
            <div className="p-3 bg-red-950/60 border border-red-700/80 rounded-xl space-y-1.5 text-red-200 text-xs">
              {spec.notes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}

          {/* Grilla 1: Identificación física y normativa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Identificación y Aislación
              </span>
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Función:</span>
                  <span className="font-semibold text-white capitalize">{spec.functionType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Color reglamentario:</span>
                  <span className="font-semibold text-slate-200">{spec.standardColorName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Material conductor:</span>
                  <span className="font-semibold text-slate-200">{spec.material}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Tipo de aislación:</span>
                  <span className="font-semibold text-amber-300">{spec.insulationDescription}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Sección y Longitud de Tendido
              </span>
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Sección instalada:</span>
                  <span className="font-bold text-amber-400">{spec.crossSectionMm2} mm²</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Mínimo AEA 771 (Tabla 771.13.I):</span>
                  <span className="font-semibold text-slate-200">{spec.minimumRequiredSectionMm2} mm²</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Longitud nominal de dibujo:</span>
                  <span className="font-mono text-slate-200">{spec.lengthMetersNominal} m</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Holgura (+{spec.slackPercent}% curvas y bornes):</span>
                  <span className="font-bold text-emerald-400">{spec.lengthMetersTotal} m totales</span>
                </div>
              </div>
            </div>
          </div>

          {/* Factores de Instalación e Iz */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-amber-400" />
                Cálculo de Capacidad Admisible (Iz) según AEA 771 Tabla 771.16.I
              </span>
              <span className="text-[11px] font-mono text-slate-400">{spec.installationMethodName}</span>
            </div>

            {/* Controles de prueba de factores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Temperatura Ambiente: <strong className="text-amber-400">{ambientTemp} °C</strong> (Factor kt = {spec.kt})
                </label>
                <div className="flex gap-1.5">
                  {[30, 35, 40, 45, 50].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAmbientTemp(t)}
                      className={`flex-1 py-1 text-xs rounded border transition-all ${
                        ambientTemp === t
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {t}°
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Circuitos en la misma cañería: <strong className="text-amber-400">{groupingCount}</strong> (Factor kn = {spec.kn})
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setGroupingCount(n)}
                      className={`flex-1 py-1 text-xs rounded border transition-all ${
                        groupingCount === n
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {n} {n === 1 ? 'circ.' : 'circs.'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ecuación de Iz */}
            <div className="p-3 bg-slate-900 border border-slate-700/80 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
              <div className="text-slate-300">
                Fórmula: <span className="text-white font-bold">Iz = Iz0 × kt × kn</span> = {spec.admissibleCurrentIz0} A × {spec.kt} × {spec.kn}
              </div>
              <div className="text-base font-bold text-amber-400 bg-amber-950/60 px-3 py-1 rounded border border-amber-500/40">
                Iz = {spec.admissibleCurrentIz} A
              </div>
            </div>
          </div>

          {/* Coordinación de Protecciones */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Coordinación de Protecciones (Regla Ib ≤ In ≤ Iz e I2 ≤ 1.45 × Iz)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Corriente de Diseño (Ib)</span>
                <span className="text-sm font-bold text-slate-100">{spec.designCurrentIb} A</span>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Termomagnética (In)</span>
                <span className="text-sm font-bold text-amber-400">{spec.breakerRatingIn} A</span>
              </div>
              <div className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px] block">Capacidad de Cable (Iz)</span>
                <span className="text-sm font-bold text-emerald-400">{spec.admissibleCurrentIz} A</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg border bg-slate-900/60 border-slate-700/60">
              {spec.isProtectionCoordinated ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-medium">
                    Condición cumplida: {spec.designCurrentIb} A (Ib) ≤ {spec.breakerRatingIn} A (In) ≤ {spec.admissibleCurrentIz} A (Iz). Cable protegido contra sobrecargas continuas.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-red-300 font-medium">
                    Falla de coordinación: In ({spec.breakerRatingIn} A) supera la capacidad corregida Iz ({spec.admissibleCurrentIz} A). Modifica la sección del conductor o la termomagnética.
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Caída de Tensión y Canalización */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Verificación de Caída de Tensión (ΔV)
              </span>
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">ΔV en Voltios:</span>
                  <span className="font-mono text-slate-200">{spec.voltageDropVolts} V</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">ΔV porcentual:</span>
                  <span className={`font-mono font-bold ${spec.isVoltageDropCompliant ? 'text-emerald-400' : 'text-red-400'}`}>
                    {spec.voltageDropPercent}%
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Límite reglamentario:</span>
                  <span className="font-semibold text-slate-200">≤ {spec.maxAllowedVoltageDropPercent}%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Canalización Recomendada (Ocupación ≤ 35%)
              </span>
              <div className="space-y-1">
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Tipo de cañería:</span>
                  <span className="font-semibold text-slate-200">Corrugado ignífugo IRAM 62386</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Diámetro interno:</span>
                  <span className="font-bold text-amber-400">Ø {spec.recommendedConduitDiameterMm} mm ({spec.recommendedConduitDiameterMm === 19 ? '3/4"' : spec.recommendedConduitDiameterMm === 22 ? '7/8"' : '1"'})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Norma de cañerías:</span>
                  <span className="text-slate-300">IRAM 62386 / AEA 771.12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ajuste manual (Override) */}
          <div className="p-3 bg-slate-950 border border-amber-500/30 rounded-xl space-y-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Ajuste Manual de Sección para este Conductor
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              {[1.5, 2.5, 4.0, 6.0, 10.0].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setOverrideSection(sec)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    spec.crossSectionMm2 === sec
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {sec} mm²
                </button>
              ))}
              <div className="h-4 w-px bg-slate-800 mx-1" />
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <span>Holgura:</span>
                {[10, 15, 20].map((slk) => (
                  <button
                    key={slk}
                    onClick={() => setOverrideSlack(slk)}
                    className={`px-2 py-1 text-xs rounded border ${
                      spec.slackPercent === slk
                        ? 'bg-slate-700 text-white font-bold border-slate-600'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    +{slk}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Normativa AEA 90364-7-771 • Reglamentación para la ejecución de instalaciones eléctricas en inmuebles
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition-colors"
            >
              Aplicar al Conductor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
