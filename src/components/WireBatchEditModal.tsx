/**
 * ELECTRA PLAN — Modal de Edición de Tramos de Conductores
 * Permite editar tramo individual, toda la conexión o todo el circuito con confirmación.
 */
import React, { useState } from 'react';
import { Wire, Project, ConductorType } from '../types/electra';
import { Layers, AlertTriangle, Check, ShieldCheck, Zap, X } from 'lucide-react';

interface WireBatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  wire: Wire;
  project: Project;
  onApplyChanges: (
    scope: 'single' | 'connection' | 'circuit',
    updatedValues: Partial<Wire>
  ) => void;
}

export const WireBatchEditModal: React.FC<WireBatchEditModalProps> = ({
  isOpen,
  onClose,
  wire,
  project,
  onApplyChanges,
}) => {
  const [scope, setScope] = useState<'single' | 'connection' | 'circuit'>('single');
  const [crossSection, setCrossSection] = useState<number>(wire.crossSectionMm2 || 2.5);
  const [conductorMaterial, setConductorMaterial] = useState<'Cu' | 'Al'>(wire.conductorMaterial || 'Cu');
  const [insulationType, setInsulationType] = useState<'PVC_70' | 'LS0H_90'>(wire.insulationType || 'PVC_70');
  const [installationMethod, setInstallationMethod] = useState<'B1' | 'B2' | 'C'>(wire.installationMethod || 'B1');
  const [conduitType, setConduitType] = useState<string>(wire.conduitType || 'corrugado_ignifugo');
  const [wireType, setWireType] = useState<ConductorType>(wire.type);

  if (!isOpen) return null;

  // Cantidad de cables afectados según el alcance
  const circuitWires = project.wires.filter((w) => w.circuitId === wire.circuitId);
  const connectionWires = project.wires.filter(
    (w) =>
      (w.fromComponentId === wire.fromComponentId && w.toComponentId === wire.toComponentId) ||
      (w.fromComponentId === wire.toComponentId && w.toComponentId === wire.fromComponentId)
  );

  const affectedCount =
    scope === 'single' ? 1 : scope === 'connection' ? connectionWires.length : circuitWires.length;

  const handleConfirm = () => {
    const updatedValues: Partial<Wire> = {
      crossSectionMm2: crossSection,
      conductorMaterial,
      insulationType,
      installationMethod,
      type: wireType,
      conduitType: conduitType as any,
    };
    onApplyChanges(scope, updatedValues);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Especificación de Conductor</h3>
              <p className="text-xs text-slate-400 font-mono">
                Tramo ID: {wire.id} · Circuito: {wire.circuitId || 'Sin Circuito'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* Selector de Alcance de Edición */}
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider block">
              Alcance de la Modificación
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('single')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  scope === 'single'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-white">Solo este tramo</div>
                <div className="text-[10px] text-slate-400 mt-0.5">1 cable individual</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('connection')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  scope === 'connection'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-white">Conexión</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{connectionWires.length} tramos vinculados</div>
              </button>

              <button
                type="button"
                onClick={() => setScope('circuit')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  scope === 'circuit'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-xs text-white">Todo el Circuito</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{circuitWires.length} cables ({wire.circuitId})</div>
              </button>
            </div>
          </div>

          {/* Sección del Conductor */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Sección Nominal (mm²) — AEA 90364-771
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {[1.5, 2.5, 4.0, 6.0, 10.0, 16.0].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setCrossSection(s)}
                  className={`py-2 px-2 rounded-lg font-mono text-center border text-xs font-bold transition-all ${
                    crossSection === s
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {s} mm²
                </button>
              ))}
            </div>
            {crossSection < 2.5 && (wire.circuitId?.startsWith('TUG') || wire.circuitId?.startsWith('C2')) && (
              <p className="mt-1.5 text-[11px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Atención: AEA 771 exige mínimo 2,5 mm² para circuitos de tomacorrientes (TUG).</span>
              </p>
            )}
          </div>

          {/* Material y Aislación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Material Conductor</label>
              <select
                value={conductorMaterial}
                onChange={(e) => setConductorMaterial(e.target.value as 'Cu' | 'Al')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-amber-500"
              >
                <option value="Cu">Cobre electrolítico (IRAM NM 280)</option>
                <option value="Al">Aluminio (Secciones ≥ 16 mm²)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Aislación</label>
              <select
                value={insulationType}
                onChange={(e) => setInsulationType(e.target.value as 'PVC_70' | 'LS0H_90')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-amber-500"
              >
                <option value="PVC_70">PVC 70°C (IRAM NM 247-3)</option>
                <option value="LS0H_90">Libre de Halógenos LS0H 90°C (IRAM 62267)</option>
              </select>
            </div>
          </div>

          {/* Método de Instalación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Método de Instalación</label>
              <select
                value={installationMethod}
                onChange={(e) => setInstallationMethod(e.target.value as 'B1' | 'B2' | 'C')}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-amber-500"
              >
                <option value="B1">B1 — Cañería embutida en mampostería</option>
                <option value="B2">B2 — Cañería a la vista en cielo raso / pared</option>
                <option value="C">C — Cable subterráneo o bajo piso</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Canalización Asignada</label>
              <select
                value={conduitType}
                onChange={(e) => setConduitType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-hidden focus:border-amber-500"
              >
                <option value="corrugado_ignifugo">Corrugado ignífugo blanco (IRAM 62386)</option>
                <option value="pvc_rigido">Caño rígido de PVC semipesado</option>
                <option value="canaleta">Canaleta plástica con tabique divisor</option>
                <option value="acero_semipesado">Caño de acero semipesado esmaltado</option>
              </select>
            </div>
          </div>

          {/* Alerta de confirmación de lote si aplica a circuito */}
          {scope === 'circuit' && (
            <div className="p-3 bg-amber-950/60 border border-amber-600/50 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Confirmación de cambio por circuito:</span>
                Esta acción modificará <strong>{affectedCount} tramos de cable</strong> del circuito{' '}
                <strong>{wire.circuitId}</strong> a {crossSection} mm² ({conductorMaterial}, {insulationType}).
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Afectará a: <strong className="text-white">{affectedCount} tramo(s)</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Aplicar {scope === 'circuit' ? 'a Circuito' : scope === 'connection' ? 'a Conexión' : 'al Tramo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
