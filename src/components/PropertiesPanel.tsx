/**
 * ELECTRA PLAN — Panel Lateral de Propiedades Técnicas
 * Inspección y edición detallada de parámetros del componente o cable seleccionado.
 */
import React from 'react';
import {
  Sliders,
  Zap,
  Trash2,
  RotateCw,
  Power,
  Layers,
  Info,
  X,
} from 'lucide-react';
import { Project, ElectricalSymbol, Wire, Room, ArchElement } from '../types/electra';

export interface PropertiesPanelProps {
  project: Project;
  selectedElementType: 'symbol' | 'wire' | 'room' | 'wall' | null;
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

            {/* Parámetros Eléctricos */}
            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <span className="text-[10px] text-slate-300 font-semibold block">Parámetros Eléctricos</span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Potencia (W)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
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
                  <input
                    type="number"
                    value={selectedSymbol.voltage}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 220;
                      onUpdateProject((prev) => ({
                        ...prev,
                        symbols: prev.symbols.map((s) =>
                          s.id === selectedSymbol.id ? { ...s, voltage: val } : s
                        ),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Factor de Potencia (cos φ)</label>
                <input
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={selectedSymbol.powerFactor}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0.9;
                    onUpdateProject((prev) => ({
                      ...prev,
                      symbols: prev.symbols.map((s) =>
                        s.id === selectedSymbol.id ? { ...s, powerFactor: val } : s
                      ),
                    }));
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Estado Interactivo (para interruptores / teclas) */}
            {selectedSymbol.category === 'comando' && (
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-800 space-y-2">
                <span className="text-[10px] text-slate-300 font-semibold block">Accionamiento Virtual</span>
                <button
                  onClick={() => onToggleSwitch(selectedSymbol.id)}
                  className={`w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded font-medium transition-colors ${
                    selectedSymbol.state?.isOpen
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500 font-semibold'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>
                    {selectedSymbol.state?.isOpen ? 'Interruptor ABIERTO (Apagar)' : 'Interruptor CERRADO (Encendido)'}
                  </span>
                </button>
              </div>
            )}

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
                Conductor Eléctrico
              </span>
              <h3 className="text-sm font-bold text-white mt-0.5">
                Cable {selectedWire.type.toUpperCase()} ({selectedWire.crossSectionMm2} mm²)
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {selectedWire.id}</p>
            </div>

            <div className="space-y-2 bg-slate-950/60 p-2.5 rounded border border-slate-800">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Sección del Conductor (mm²)</label>
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
                  <option value={1.5}>1.5 mm² (Iluminación - máx 10A)</option>
                  <option value={2.5}>2.5 mm² (Tomacorrientes - máx 16A/20A)</option>
                  <option value={4.0}>4.0 mm² (Cargas especiales - máx 25A)</option>
                  <option value={6.0}>6.0 mm² (Alimentación seccional - máx 32A)</option>
                  <option value={10.0}>10.0 mm² (Línea principal - máx 50A)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Longitud estimada de ida (metros)</label>
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

              <div className="pt-1">
                <span className="text-[10px] text-slate-400 block">Conecta:</span>
                <div className="text-[11px] font-mono text-slate-300 bg-slate-900 p-1.5 rounded mt-0.5 border border-slate-800">
                  {selectedWire.fromComponentId} [{selectedWire.fromTerminalId}] →{' '}
                  {selectedWire.toComponentId} [{selectedWire.toTerminalId}]
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Caso 3: Habitación Seleccionada */}
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

              {/* Posición en el plano */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Posición X (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={Number((selectedRoom.x / 40).toFixed(1))}
                    onChange={(e) => {
                      const newX = Number(e.target.value) * 40;
                      const dx = newX - selectedRoom.x;
                      onUpdateProject((prev) => ({
                        ...prev,
                        rooms: prev.rooms.map((r) =>
                          r.id === selectedRoom.id ? { ...r, x: newX } : r
                        ),
                        symbols: prev.symbols.map((s) => {
                          const isInside =
                            s.x >= selectedRoom.x &&
                            s.x <= selectedRoom.x + selectedRoom.width &&
                            s.y >= selectedRoom.y &&
                            s.y <= selectedRoom.y + selectedRoom.height;
                          return isInside ? { ...s, x: s.x + dx } : s;
                        }),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-0.5">Posición Y (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={Number((selectedRoom.y / 40).toFixed(1))}
                    onChange={(e) => {
                      const newY = Number(e.target.value) * 40;
                      const dy = newY - selectedRoom.y;
                      onUpdateProject((prev) => ({
                        ...prev,
                        rooms: prev.rooms.map((r) =>
                          r.id === selectedRoom.id ? { ...r, y: newY } : r
                        ),
                        symbols: prev.symbols.map((s) => {
                          const isInside =
                            s.x >= selectedRoom.x &&
                            s.x <= selectedRoom.x + selectedRoom.width &&
                            s.y >= selectedRoom.y &&
                            s.y <= selectedRoom.y + selectedRoom.height;
                          return isInside ? { ...s, y: s.y + dy } : s;
                        }),
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Superficie y Componentes Contenidos */}
              <div className="p-2.5 bg-slate-900 rounded border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Superficie Total:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    {((selectedRoom.width / 40) * (selectedRoom.height / 40)).toFixed(2)} m²
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Bocas en este ambiente:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {
                      project.symbols.filter(
                        (s) =>
                          s.x >= selectedRoom.x &&
                          s.x <= selectedRoom.x + selectedRoom.width &&
                          s.y >= selectedRoom.y &&
                          s.y <= selectedRoom.y + selectedRoom.height
                      ).length
                    }
                  </span>
                </div>
              </div>

              {/* Botón para generar muros perimetrales automáticos */}
              <button
                onClick={() => {
                  const r = selectedRoom;
                  const newWalls: ArchElement[] = [
                    // Muro Superior
                    { id: `wall_${r.id}_top_${Date.now()}`, floorId: r.floorId, type: 'wall', x1: r.x, y1: r.y, x2: r.x + r.width, y2: r.y, thickness: 10 },
                    // Muro Derecho
                    { id: `wall_${r.id}_right_${Date.now()}`, floorId: r.floorId, type: 'wall', x1: r.x + r.width, y1: r.y, x2: r.x + r.width, y2: r.y + r.height, thickness: 10 },
                    // Muro Inferior
                    { id: `wall_${r.id}_bottom_${Date.now()}`, floorId: r.floorId, type: 'wall', x1: r.x + r.width, y1: r.y + r.height, x2: r.x, y2: r.y + r.height, thickness: 10 },
                    // Muro Izquierdo
                    { id: `wall_${r.id}_left_${Date.now()}`, floorId: r.floorId, type: 'wall', x1: r.x, y1: r.y + r.height, x2: r.x, y2: r.y, thickness: 10 },
                  ];
                  onUpdateProject((prev) => ({
                    ...prev,
                    architecturalElements: [...prev.architecturalElements, ...newWalls],
                  }));
                  alert('¡Muros perimetrales generados alrededor del ambiente!');
                }}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-750 text-amber-300 font-semibold text-[11px] rounded border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Generar Muros Perimetrales</span>
              </button>
            </div>
          </div>
        )}

        {/* Sin Selección: Resumen General del Proyecto */}
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
                <span className="text-slate-400">Ambientes/Habitaciones:</span>
                <span className="font-mono font-semibold text-white">{project.rooms.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Circuitos derivados:</span>
                <span className="font-mono font-semibold text-amber-400">{project.circuits.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Potencia conectada:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {project.symbols.reduce((a, s) => a + (s.powerWatts || 0), 0)} W
                </span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <span className="text-slate-300 font-medium block mb-1">💡 Consejos del editor:</span>
              • Haz clic en cualquier símbolo, muro o cable para inspeccionar sus datos.
              <br />
              • Puedes pulsar la tecla <kbd className="font-mono bg-slate-800 px-1 rounded">Supr</kbd> para borrar el elemento seleccionado.
              <br />
              • En modo Cablear, une bornes de Fase (marrón) con bornes de tecla o carga.
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
