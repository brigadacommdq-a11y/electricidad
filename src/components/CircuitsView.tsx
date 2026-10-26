/**
 * ELECTRA PLAN — Módulo de Gestión de Circuitos Eléctricos
 * Configuración de circuitos derivados (IUG, TUG, TUE, etc.), secciones de cable,
 * asignación de protecciones y control de número máximo de bocas según AEA 90364.
 * Optimizado para pantallas móviles (360px - 430px) y escritorio.
 */
import React, { useState } from 'react';
import {
  Network,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Shield,
  Zap,
} from 'lucide-react';
import { Circuit, Project, CircuitType } from '../types/electra';

interface CircuitsViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const CircuitsView: React.FC<CircuitsViewProps> = ({ project, onUpdateProject }) => {
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>(project.circuits[0]?.id || 'C1');

  const selectedCircuit = project.circuits.find((c) => c.id === selectedCircuitId) || project.circuits[0];

  // Agregar nuevo circuito
  const handleAddCircuit = () => {
    const nextNumber = project.circuits.length + 1;
    const newId = `C${nextNumber}`;
    const newCircuit: Circuit = {
      id: newId,
      name: `Circuito Derivado ${newId}`,
      type: 'TUG',
      voltage: 220,
      phases: 1,
      powerFactor: 0.9,
      conductorMaterial: 'Cu',
      crossSectionMm2: 2.5,
      breakerAmps: 16,
      breakerCurve: 'C',
      breakerPoles: '2P',
      color: '#06b6d4',
      installationMethod: 'cañeria_embutida',
      lengthMetersEstimate: 15,
      description: 'Nuevo circuito para tomas o cargas específicas.',
    };

    onUpdateProject((prev) => ({
      ...prev,
      circuits: [...prev.circuits, newCircuit],
      switchboard: {
        ...prev.switchboard,
        components: [
          ...prev.switchboard.components,
          {
            id: `comp_pia_${newId.toLowerCase()}`,
            type: 'pia',
            name: `PIA ${newCircuit.breakerAmps}A (${newId})`,
            ratingAmps: newCircuit.breakerAmps,
            poles: '2P',
            circuitId: newId,
            state: 'closed',
          },
        ],
      },
    }));
    setSelectedCircuitId(newId);
  };

  // Eliminar circuito
  const handleDeleteCircuit = (circuitId: string) => {
    if (project.circuits.length <= 1) {
      alert('El proyecto debe contar con al menos un circuito derivado.');
      return;
    }
    if (confirm(`¿Deseas eliminar el circuito ${circuitId}? Las cargas asociadas quedarán sin circuito asignado.`)) {
      onUpdateProject((prev) => ({
        ...prev,
        circuits: prev.circuits.filter((c) => c.id !== circuitId),
        symbols: prev.symbols.map((s) => (s.circuitId === circuitId ? { ...s, circuitId: undefined } : s)),
        switchboard: {
          ...prev.switchboard,
          components: prev.switchboard.components.filter((comp) => comp.circuitId !== circuitId),
        },
      }));
      setSelectedCircuitId(project.circuits.find((c) => c.id !== circuitId)?.id || '');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-3 sm:p-6 text-slate-100 space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Cabecera Responsiva */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base sm:text-lg">
            <Network className="w-5 h-5 shrink-0" />
            <h2>Distribución y Esquema de Circuitos</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Reglamentación AEA 90364-771: Mínimo 2 circuitos independientes (IUG y TUG) con protección calibrada para cada sección.
          </p>
        </div>

        <button
          onClick={handleAddCircuit}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Circuito</span>
        </button>
      </div>

      {/* Selector Rápido de Circuitos para Móvil (Horizontal Carousel) */}
      <div className="block lg:hidden bg-slate-900/90 border border-slate-800 p-2.5 rounded-xl">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <span className="font-semibold text-slate-300">Seleccionar circuito para editar:</span>
          <span className="text-[11px] text-amber-400">{project.circuits.length} circuitos</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {project.circuits.map((circ) => {
            const isSelected = selectedCircuit?.id === circ.id;
            return (
              <button
                key={circ.id}
                onClick={() => setSelectedCircuitId(circ.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: circ.color || '#3b82f6' }}
                />
                <span>{circ.id}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-sans ${isSelected ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                  {circ.type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Lista de Circuitos a la Izquierda (En móvil va después o se usa el carrusel superior) */}
        <div className="lg:col-span-1 space-y-3 order-2 lg:order-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-slate-300">Todos los Circuitos ({project.circuits.length})</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">Haz clic para editar</span>
          </div>

          <div className="space-y-2">
            {project.circuits.map((circ) => {
              const isSelected = selectedCircuit?.id === circ.id;
              const loads = project.symbols.filter((s) => s.circuitId === circ.id);
              const sumWatts = loads.reduce((a, s) => a + (s.powerWatts || 0), 0);
              const isOverBocas = loads.length > 15; // AEA limit: 15 bocas per circuit

              return (
                <div
                  key={circ.id}
                  onClick={() => setSelectedCircuitId(circ.id)}
                  className={`p-3 sm:p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/80 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: circ.color || '#3b82f6' }}
                      />
                      <span className="font-bold font-mono text-sm text-white">{circ.id}</span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {circ.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-amber-300">
                        {circ.breakerAmps} A
                      </span>
                      {project.circuits.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCircuit(circ.id);
                          }}
                          aria-label={`Eliminar circuito ${circ.id}`}
                          className="p-1.5 text-slate-500 hover:text-red-400 active:text-red-300 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 font-medium mt-1 truncate">{circ.name}</div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {loads.length} boca(s) {isOverBocas && <span className="text-amber-400 font-bold">(! &gt;15)</span>}
                    </span>
                    <span className="font-mono text-slate-300">{sumWatts} W</span>
                    <span className="font-mono text-cyan-400">{circ.crossSectionMm2} mm²</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Configuración del Circuito Seleccionado */}
        {selectedCircuit && (
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-4 sm:p-6 rounded-xl space-y-4 sm:space-y-5 order-1 lg:order-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                  Configuración Técnica
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-amber-400">{selectedCircuit.id}</span>
                  <span className="truncate max-w-[200px] sm:max-w-md">{selectedCircuit.name}</span>
                </h3>
              </div>
              <div
                className="w-6 h-6 rounded-full border-2 border-white/20 shrink-0"
                style={{ backgroundColor: selectedCircuit.color }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre del Circuito</label>
                <input
                  type="text"
                  value={selectedCircuit.name}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateProject((prev) => ({
                      ...prev,
                      circuits: prev.circuits.map((c) => (c.id === selectedCircuit.id ? { ...c, name: val } : c)),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipo de Circuito (AEA 771)</label>
                <select
                  value={selectedCircuit.type}
                  onChange={(e) => {
                    const val = e.target.value as CircuitType;
                    onUpdateProject((prev) => ({
                      ...prev,
                      circuits: prev.circuits.map((c) => (c.id === selectedCircuit.id ? { ...c, type: val } : c)),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-400 font-semibold focus:border-amber-500 focus:outline-hidden"
                >
                  <option value="IUG">IUG - Iluminación de Uso General (máx 15 bocas, PIA 10A/16A)</option>
                  <option value="TUG">TUG - Tomacorrientes de Uso General (máx 15 bocas, PIA 16A/20A)</option>
                  <option value="IUE">IUE - Iluminación de Uso Especial (exterior / ambientes húmedos)</option>
                  <option value="TUE">TUE - Tomacorrientes de Uso Especial (20A, cargas pesadas &gt; 10A)</option>
                  <option value="AC">AC - Climatización / Aire Acondicionado exclusivo</option>
                  <option value="OTRO">OTRO - Circuito específico / trifásico</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Sección de Conductor (mm²)</label>
                <select
                  value={selectedCircuit.crossSectionMm2}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateProject((prev) => ({
                      ...prev,
                      circuits: prev.circuits.map((c) =>
                        c.id === selectedCircuit.id ? { ...c, crossSectionMm2: val } : c
                      ),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:border-amber-500 focus:outline-hidden"
                >
                  <option value={1.5}>1.5 mm² (Mínimo reglamentario para IUG)</option>
                  <option value={2.5}>2.5 mm² (Mínimo reglamentario para TUG y líneas seccionales)</option>
                  <option value={4.0}>4.0 mm² (Recomendado para TUE y Aires)</option>
                  <option value={6.0}>6.0 mm² (Líneas principales y cargas elevadas)</option>
                  <option value={10.0}>10.0 mm² (Acometidas y subdistribución)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Protección Asignada (In Térmica)</label>
                <select
                  value={selectedCircuit.breakerAmps}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateProject((prev) => ({
                      ...prev,
                      circuits: prev.circuits.map((c) =>
                        c.id === selectedCircuit.id ? { ...c, breakerAmps: val } : c
                      ),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 font-bold focus:border-amber-500 focus:outline-hidden"
                >
                  <option value={10}>10 A (Curva C)</option>
                  <option value={16}>16 A (Curva C)</option>
                  <option value={20}>20 A (Curva C)</option>
                  <option value={25}>25 A (Curva C)</option>
                  <option value={32}>32 A (Curva C)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Longitud Estimada de Recorrido (m)</label>
                <input
                  type="number"
                  min="2"
                  max="100"
                  value={selectedCircuit.lengthMetersEstimate}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 15;
                    onUpdateProject((prev) => ({
                      ...prev,
                      circuits: prev.circuits.map((c) =>
                        c.id === selectedCircuit.id ? { ...c, lengthMetersEstimate: val } : c
                      ),
                    }));
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Color de Representación en Plano</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedCircuit.color || '#3b82f6'}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateProject((prev) => ({
                        ...prev,
                        circuits: prev.circuits.map((c) => (c.id === selectedCircuit.id ? { ...c, color: val } : c)),
                      }));
                    }}
                    className="w-12 h-9 bg-slate-950 border border-slate-700 rounded-lg p-1 cursor-pointer shrink-0"
                  />
                  <span className="text-xs font-mono text-slate-400">{selectedCircuit.color || '#3b82f6'}</span>
                </div>
              </div>
            </div>

            {/* Bocas asignadas a este circuito */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-200 mb-2">
                Bocas y Cargas Asignadas ({project.symbols.filter((s) => s.circuitId === selectedCircuit.id).length})
              </h4>
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5 sm:p-3 max-h-48 overflow-y-auto space-y-1.5">
                {project.symbols.filter((s) => s.circuitId === selectedCircuit.id).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-2">
                    No hay elementos del plano vinculados a este circuito. Selecciona un símbolo en el editor CAD y asígnalo aquí.
                  </p>
                ) : (
                  project.symbols
                    .filter((s) => s.circuitId === selectedCircuit.id)
                    .map((sym) => (
                      <div
                        key={sym.id}
                        className="flex items-center justify-between text-xs py-1.5 px-2 bg-slate-900 rounded border border-slate-800/60"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono font-semibold text-slate-200">{sym.label}</span>
                          <span className="text-slate-400 truncate">{sym.name}</span>
                        </div>
                        <span className="font-mono text-emerald-400 shrink-0 font-medium">{sym.powerWatts} W</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
