/**
 * ELECTRA PLAN — Panel Lateral de Propiedades Técnicas
 * Inspección y edición detallada de parámetros del componente, cable o elemento arquitectónico seleccionado.
 */
import React, { useState } from 'react';
import {
  Sliders,
  Zap,
  Trash2,
  RotateCw,
  RotateCcw,
  Power,
  Layers,
  Info,
  X,
  DoorOpen,
  AppWindow,
  Minus,
  FlipHorizontal,
  FlipVertical,
  Activity,
  ShieldCheck,
  Wrench,
  Cpu,
  Layers2,
} from 'lucide-react';
import { Project, ElectricalSymbol, Wire, Room, ArchElement } from '../types/electra';
import { WireBatchEditModal } from './WireBatchEditModal';
import { generateConductorSpec } from '../services/conductorSizing';

export interface PropertiesPanelProps {
  project: Project;
  selectedElementType: 'symbol' | 'wire' | 'room' | 'wall' | 'door' | 'window' | null;
  selectedElementId: string | null;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  onDeleteSelected: () => void;
  onToggleSwitch: (symbolId: string) => void;
  onClose?: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  project,
  selectedElementType,
  selectedElementId,
  onUpdateProject,
  onDeleteSelected,
  onToggleSwitch,
  onClose,
}) => {
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);

  const selectedSymbol =
    selectedElementType === 'symbol'
      ? project.symbols.find((s) => s.id === selectedElementId)
      : null;

  const selectedWire =
    selectedElementType === 'wire'
      ? project.wires.find((w) => w.id === selectedElementId)
      : null;

  const selectedRoom =
    selectedElementType === 'room'
      ? project.rooms.find((r) => r.id === selectedElementId)
      : null;

  const selectedArch =
    selectedElementType === 'wall' || selectedElementType === 'door' || selectedElementType === 'window'
      ? project.architecturalElements.find((a) => a.id === selectedElementId)
      : null;

  // Rotar símbolo o elemento arquitectónico
  const handleRotate = (deltaDegrees: number) => {
    if (selectedSymbol) {
      onUpdateProject((prev) => ({
        ...prev,
        symbols: prev.symbols.map((s) =>
          s.id === selectedSymbol.id ? { ...s, rotation: (s.rotation + deltaDegrees + 360) % 360 } : s
        ),
      }));
    } else if (selectedArch) {
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: prev.architecturalElements.map((a) => {
          if (a.id !== selectedArch.id) return a;
          const currentRot = a.rotation || 0;
          const newRot = (currentRot + deltaDegrees + 360) % 360;
          // Calcular nuevo punto final x2, y2 rotado respecto a x1, y1
          const dx = a.x2 - a.x1;
          const dy = a.y2 - a.y1;
          const len = Math.sqrt(dx * dx + dy * dy) || 60;
          const rad = (newRot * Math.PI) / 180;
          return {
            ...a,
            rotation: newRot,
            x2: Math.round(a.x1 + len * Math.cos(rad)),
            y2: Math.round(a.y1 + len * Math.sin(rad)),
          };
        }),
      }));
    }
  };

  // Inversión horizontal / vertical
  const handleFlip = (axis: 'H' | 'V') => {
    if (selectedSymbol) {
      onUpdateProject((prev) => ({
        ...prev,
        symbols: prev.symbols.map((s) =>
          s.id === selectedSymbol.id
            ? {
                ...s,
                flipH: axis === 'H' ? !s.flipH : s.flipH,
                flipV: axis === 'V' ? !s.flipV : s.flipV,
              }
            : s
        ),
      }));
    } else if (selectedArch) {
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: prev.architecturalElements.map((a) =>
          a.id === selectedArch.id
            ? {
                ...a,
                flipH: axis === 'H' ? !a.flipH : a.flipH,
                flipV: axis === 'V' ? !a.flipV : a.flipV,
              }
            : a
        ),
      }));
    }
  };

  // Especificación de cable para feedback en tiempo real
  const conductorSpec = selectedWire ? generateConductorSpec(selectedWire, project) : null;

  return (
    <aside className="no-print w-full lg:w-72 bg-slate-900 border-l border-slate-800 flex flex-col h-full text-slate-200 select-none text-xs">
      {/* Cabecera del panel */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
        <div className="flex items-center gap-2 text-slate-200 font-semibold text-sm">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Propiedades</span>
        </div>
        <div className="flex items-center gap-1.5">
          {selectedElementId && (
            <button
              onClick={onDeleteSelected}
              title="Eliminar elemento"
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
              aria-label="Cerrar propiedades"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
        {/* Caso 1: Símbolo Eléctrico Seleccionado */}
        {selectedSymbol && (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Componente Eléctrico
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">{selectedSymbol.name}</h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {selectedSymbol.id}</p>
            </div>

            {/* Rotación y Giros Rápidos */}
            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-300 font-semibold block">Rotación & Inversión</span>
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => handleRotate(-15)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
                >
                  -15°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(15)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
                >
                  +15°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(45)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-[11px] font-mono font-bold"
                >
                  +45°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(90)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-[11px] font-mono font-bold"
                >
                  +90°
                </button>
              </div>

              {/* Inversión horizontal / vertical */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleFlip('H')}
                  className={`py-1 px-2 rounded border text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                    selectedSymbol.flipH ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Espejo H</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFlip('V')}
                  className={`py-1 px-2 rounded border text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                    selectedSymbol.flipV ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Espejo V</span>
                </button>
              </div>
            </div>

            {/* Etiqueta y Nombre */}
            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Etiqueta técnica (Label)</label>
                <input
                  type="text"
                  value={selectedSymbol.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateProject((prev) => ({
                      ...prev,
                      symbols: prev.symbols.map((s) =>
                        s.id === selectedSymbol.id ? { ...s, label: val } : s
                      ),
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Nombre descriptivo</label>
                <input
                  type="text"
                  value={selectedSymbol.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateProject((prev) => ({
                      ...prev,
                      symbols: prev.symbols.map((s) =>
                        s.id === selectedSymbol.id ? { ...s, name: val } : s
                      ),
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Asignación de Circuito */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Circuito asignado</label>
                <select
                  value={selectedSymbol.circuitId || 'C1'}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateProject((prev) => ({
                      ...prev,
                      symbols: prev.symbols.map((s) =>
                        s.id === selectedSymbol.id ? { ...s, circuitId: val } : s
                      ),
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-400 font-semibold text-xs focus:border-amber-500 focus:outline-hidden"
                >
                  {project.circuits.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} - {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parámetros Eléctricos y de Carga */}
            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-300 font-semibold block">Parámetros Eléctricos</span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Potencia (W)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={selectedSymbol.powerWatts}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      onUpdateProject((prev) => ({
                        ...prev,
                        symbols: prev.symbols.map((s) =>
                          s.id === selectedSymbol.id ? { ...s, powerWatts: val } : s
                        ),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Tensión (V)</label>
                  <select
                    value={selectedSymbol.voltage || 220}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      onUpdateProject((prev) => ({
                        ...prev,
                        symbols: prev.symbols.map((s) =>
                          s.id === selectedSymbol.id ? { ...s, voltage: val } : s
                        ),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                  >
                    <option value={220}>220 V (Monofásica)</option>
                    <option value={380}>380 V (Trifásica)</option>
                  </select>
                </div>
              </div>

              {/* Parámetros especiales para motores, bombas y soldadoras */}
              {(selectedSymbol.type.startsWith('bomba') ||
                selectedSymbol.type.startsWith('soldadora') ||
                selectedSymbol.type === 'compresor_aire' ||
                selectedSymbol.type === 'torno_metales' ||
                selectedSymbol.type === 'fresadora') && (
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                    Parámetros de Taller & Motor
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Método Arranque</label>
                      <select
                        value={selectedSymbol.startingMethod || 'directo'}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          onUpdateProject((prev) => ({
                            ...prev,
                            symbols: prev.symbols.map((s) =>
                              s.id === selectedSymbol.id ? { ...s, startingMethod: val } : s
                            ),
                          }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-200 text-[10px]"
                      >
                        <option value="directo">Directo</option>
                        <option value="estrella_triangulo">Y-Δ (Estrella-Triángulo)</option>
                        <option value="arrancador_suave">Arrancador Suave</option>
                        <option value="variador">Variador VFD</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Factor Marcha (%)</label>
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={selectedSymbol.dutyCyclePercent || 60}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          onUpdateProject((prev) => ({
                            ...prev,
                            symbols: prev.symbols.map((s) =>
                              s.id === selectedSymbol.id ? { ...s, dutyCyclePercent: val } : s
                            ),
                          }));
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bornes / Terminales del Componente */}
            <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-300 font-semibold block mb-1.5">
                Bornes de Conexión ({selectedSymbol.terminals.length})
              </span>
              <div className="space-y-1">
                {selectedSymbol.terminals.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between text-[11px] bg-slate-900 px-2 py-1 rounded border border-slate-800"
                  >
                    <span className="font-mono text-slate-300">{t.name}</span>
                    <span className="text-[10px] uppercase font-semibold text-amber-400">
                      {t.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Caso 2: Cable Seleccionado */}
        {selectedWire && (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Conductor Eléctrico Individual
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Cable {selectedWire.type.toUpperCase()} ({selectedWire.crossSectionMm2} mm²)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {selectedWire.id}</p>
            </div>

            {/* Sección independiente y parámetros de tramo */}
            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Sección de este tramo (mm²)</label>
                <select
                  value={selectedWire.crossSectionMm2}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateProject((prev) => ({
                      ...prev,
                      wires: prev.wires.map((w) =>
                        w.id === selectedWire.id ? { ...w, crossSectionMm2: val } : w
                      ),
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                >
                  <option value={1.5}>1.5 mm² (Iluminación IUG - máx 10A)</option>
                  <option value={2.5}>2.5 mm² (Tomacorrientes TUG - máx 16A/20A)</option>
                  <option value={4.0}>4.0 mm² (Cargas especiales TUE - máx 25A)</option>
                  <option value={6.0}>6.0 mm² (Alimentación seccional - máx 32A)</option>
                  <option value={10.0}>10.0 mm² (Línea principal - máx 50A)</option>
                  <option value={16.0}>16.0 mm² (Acometida / Fuerza motriz)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Material</label>
                  <select
                    value={selectedWire.conductorMaterial || 'Cu'}
                    onChange={(e) => {
                      const val = e.target.value as 'Cu' | 'Al';
                      onUpdateProject((prev) => ({
                        ...prev,
                        wires: prev.wires.map((w) =>
                          w.id === selectedWire.id ? { ...w, conductorMaterial: val } : w
                        ),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                  >
                    <option value="Cu">Cobre (Cu)</option>
                    <option value="Al">Aluminio (Al)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Aislación</label>
                  <select
                    value={selectedWire.insulationType || 'PVC_70'}
                    onChange={(e) => {
                      const val = e.target.value as 'PVC_70' | 'LS0H_90';
                      onUpdateProject((prev) => ({
                        ...prev,
                        wires: prev.wires.map((w) =>
                          w.id === selectedWire.id ? { ...w, insulationType: val } : w
                        ),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                  >
                    <option value="PVC_70">PVC 70°C</option>
                    <option value="LS0H_90">LS0H 90°C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Longitud calculada de ida (m)</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={selectedWire.lengthMeters}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 1;
                    onUpdateProject((prev) => ({
                      ...prev,
                      wires: prev.wires.map((w) =>
                        w.id === selectedWire.id ? { ...w, lengthMeters: val } : w
                      ),
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Botón para abrir el selector de edición por lote / circuito */}
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-amber-300 font-semibold text-xs rounded border border-slate-700 transition-colors flex items-center justify-center gap-1.5 mt-2"
              >
                <Layers2 className="w-3.5 h-3.5" />
                <span>Aplicar a Todo el Circuito ({selectedWire.circuitId})</span>
              </button>
            </div>

            {/* Diagnóstico técnico del tramo */}
            {conductorSpec && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] space-y-1.5">
                <span className="font-bold text-slate-300 block">Verificación AEA 90364-771:</span>
                <div className="flex justify-between">
                  <span className="text-slate-400">Capacidad Iz (corregida):</span>
                  <span className="font-mono font-bold text-white">{conductorSpec.admissibleCurrentIz} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Corriente diseño Ib:</span>
                  <span className="font-mono text-slate-200">{conductorSpec.designCurrentIb} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Caída de tensión ΔV:</span>
                  <span
                    className={`font-mono font-bold ${
                      conductorSpec.isVoltageDropCompliant ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {conductorSpec.voltageDropPercent}% ({conductorSpec.voltageDropVolts} V)
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  {conductorSpec.isProtectionCoordinated ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Coordinación Ib ≤ In ≤ Iz verificada
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold">
                      Incompatible: Requiere ajustar térmica o sección
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Caso 3: Elemento Arquitectónico (Puerta, Ventana o Muro) */}
        {selectedArch && (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Elemento Arquitectónico
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                {selectedArch.type === 'door'
                  ? 'Puerta de Paso'
                  : selectedArch.type === 'window'
                  ? 'Ventana Vidriada'
                  : 'Muro de Mampostería'}
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {selectedArch.id}</p>
            </div>

            {/* Rotación y Giros */}
            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-300 font-semibold block">Rotación & Inversión</span>
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => handleRotate(-15)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
                >
                  -15°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(15)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono"
                >
                  +15°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(45)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-[11px] font-mono font-bold"
                >
                  +45°
                </button>
                <button
                  type="button"
                  onClick={() => handleRotate(90)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-[11px] font-mono font-bold"
                >
                  +90°
                </button>
              </div>

              {/* Botones de espejo */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleFlip('H')}
                  className={`py-1 px-2 rounded border text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                    selectedArch.flipH ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Espejo H</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFlip('V')}
                  className={`py-1 px-2 rounded border text-[11px] flex items-center justify-center gap-1.5 transition-colors ${
                    selectedArch.flipV ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-300'
                  }`}
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>Espejo V</span>
                </button>
              </div>
            </div>

            {/* Opciones Específicas para Puertas */}
            {selectedArch.type === 'door' && (
              <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  Apertura y Bisagras de Puerta
                </span>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Sentido de Apertura:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateProject((prev) => ({
                            ...prev,
                            architecturalElements: prev.architecturalElements.map((a) =>
                              a.id === selectedArch.id ? { ...a, swingDirection: 'interior' } : a
                            ),
                          }));
                        }}
                        className={`py-1 px-2 rounded border text-[11px] transition-colors ${
                          selectedArch.swingDirection !== 'exterior'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Hacia Adentro
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateProject((prev) => ({
                            ...prev,
                            architecturalElements: prev.architecturalElements.map((a) =>
                              a.id === selectedArch.id ? { ...a, swingDirection: 'exterior' } : a
                            ),
                          }));
                        }}
                        className={`py-1 px-2 rounded border text-[11px] transition-colors ${
                          selectedArch.swingDirection === 'exterior'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Hacia Afuera
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Lado de Bisagra:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateProject((prev) => ({
                            ...prev,
                            architecturalElements: prev.architecturalElements.map((a) =>
                              a.id === selectedArch.id ? { ...a, hingeSide: 'izquierda' } : a
                            ),
                          }));
                        }}
                        className={`py-1 px-2 rounded border text-[11px] transition-colors ${
                          selectedArch.hingeSide !== 'derecha'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Izquierda
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateProject((prev) => ({
                            ...prev,
                            architecturalElements: prev.architecturalElements.map((a) =>
                              a.id === selectedArch.id ? { ...a, hingeSide: 'derecha' } : a
                            ),
                          }));
                        }}
                        className={`py-1 px-2 rounded border text-[11px] transition-colors ${
                          selectedArch.hingeSide === 'derecha'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Derecha
                      </button>
                    </div>
                  </div>

                  {/* Ancho de puerta en cm */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Ancho de Puerta (cm):</label>
                    <div className="grid grid-cols-4 gap-1">
                      {[60, 70, 80, 90].map((wCm) => (
                        <button
                          key={wCm}
                          type="button"
                          onClick={() => {
                            const px = (wCm / 100) * 40; // 40px = 1m
                            onUpdateProject((prev) => ({
                              ...prev,
                              architecturalElements: prev.architecturalElements.map((a) =>
                                a.id === selectedArch.id ? { ...a, width: px, y2: a.y1 + px } : a
                              ),
                            }));
                          }}
                          className="py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-[10px] font-mono"
                        >
                          {wCm} cm
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Opciones Específicas para Ventanas */}
            {selectedArch.type === 'window' && (
              <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                  Ancho de Ventana
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {[80, 100, 120, 150].map((wCm) => (
                    <button
                      key={wCm}
                      type="button"
                      onClick={() => {
                        const px = (wCm / 100) * 40;
                        onUpdateProject((prev) => ({
                          ...prev,
                          architecturalElements: prev.architecturalElements.map((a) =>
                            a.id === selectedArch.id ? { ...a, width: px, x2: a.x1 + px } : a
                          ),
                        }));
                      }}
                      className="py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded text-[10px] font-mono"
                    >
                      {wCm} cm
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Caso 4: Habitación Seleccionada */}
        {selectedRoom && (
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Ambiente Arquitectónico
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">{selectedRoom.name}</h3>
            </div>

            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Nombre del Ambiente</label>
                <input
                  type="text"
                  value={selectedRoom.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateProject((prev) => ({
                      ...prev,
                      rooms: prev.rooms.map((r) =>
                        r.id === selectedRoom.id ? { ...r, name: val } : r
                      ),
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Ancho (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={Number((selectedRoom.width / 40).toFixed(1))}
                    onChange={(e) => {
                      const val = Math.max(40, Number(e.target.value) * 40);
                      onUpdateProject((prev) => ({
                        ...prev,
                        rooms: prev.rooms.map((r) =>
                          r.id === selectedRoom.id ? { ...r, width: val } : r
                        ),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Largo (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={Number((selectedRoom.height / 40).toFixed(1))}
                    onChange={(e) => {
                      const val = Math.max(40, Number(e.target.value) * 40);
                      onUpdateProject((prev) => ({
                        ...prev,
                        rooms: prev.rooms.map((r) =>
                          r.id === selectedRoom.id ? { ...r, height: val } : r
                        ),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sin Selección */}
        {!selectedElementId && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-300">
              <Info className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-xs">Resumen del Proyecto</span>
            </div>

            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Bocas eléctricas:</span>
                <span className="font-mono font-semibold text-white">{project.symbols.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Conductores/Cables:</span>
                <span className="font-mono font-semibold text-white">{project.wires.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Ambientes:</span>
                <span className="font-mono font-semibold text-white">{project.rooms.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Elementos Arquitectónicos:</span>
                <span className="font-mono font-semibold text-white">{project.architecturalElements.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Circuitos:</span>
                <span className="font-mono font-semibold text-amber-400">{project.circuits.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Potencia Conectada:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {project.symbols.reduce((a, s) => a + (s.powerWatts || 0), 0)} W
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Edición de Conductor en Lote / Circuito */}
      {selectedWire && (
        <WireBatchEditModal
          isOpen={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          wire={selectedWire}
          project={project}
          onApplyChanges={(scope, updatedValues) => {
            onUpdateProject((prev) => {
              if (scope === 'single') {
                return {
                  ...prev,
                  wires: prev.wires.map((w) => (w.id === selectedWire.id ? { ...w, ...updatedValues } : w)),
                };
              } else if (scope === 'connection') {
                return {
                  ...prev,
                  wires: prev.wires.map((w) => {
                    const isSamePair =
                      (w.fromComponentId === selectedWire.fromComponentId && w.toComponentId === selectedWire.toComponentId) ||
                      (w.fromComponentId === selectedWire.toComponentId && w.toComponentId === selectedWire.fromComponentId);
                    return isSamePair ? { ...w, ...updatedValues } : w;
                  }),
                };
              } else {
                // Circuito completo
                return {
                  ...prev,
                  wires: prev.wires.map((w) =>
                    w.circuitId === selectedWire.circuitId ? { ...w, ...updatedValues } : w
                  ),
                };
              }
            });
          }}
        />
      )}
    </aside>
  );
};
