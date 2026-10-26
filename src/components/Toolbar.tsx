/**
 * ELECTRA PLAN — Barra Lateral de Herramientas y Catálogo CAD
 */
import React, { useState } from 'react';
import {
  MousePointer,
  Square,
  Minus,
  DoorOpen,
  AppWindow,
  GitCommit,
  Lightbulb,
  ToggleLeft,
  Plug,
  ShieldAlert,
  Plus,
  Box,
  Compass,
  X,
} from 'lucide-react';
import { SYMBOL_TEMPLATES, SymbolTemplate } from '../services/symbolCatalog';
import { Circuit, ConductorType } from '../types/electra';

export type CADTool = 'select' | 'room' | 'wall' | 'door' | 'window' | 'wire' | 'place_symbol';

export interface ToolbarProps {
  activeTool: CADTool;
  onSelectTool: (tool: CADTool) => void;
  selectedTemplateType: string | null;
  onSelectTemplate: (type: string) => void;
  selectedCircuitId: string;
  onSelectCircuit: (circuitId: string) => void;
  circuits: Circuit[];
  activeWireType: ConductorType;
  onSelectWireType: (type: ConductorType) => void;
  onAddPresetRoom: (roomName: string, w: number, h: number) => void;
  onClose?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  selectedTemplateType,
  onSelectTemplate,
  selectedCircuitId,
  onSelectCircuit,
  circuits,
  activeWireType,
  onSelectWireType,
  onAddPresetRoom,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState<'utilizacion' | 'comando' | 'tablero' | 'canalizacion' | 'habitaciones'>('utilizacion');

  const categories = [
    { id: 'utilizacion' as const, label: 'Cargas y Luces', icon: Lightbulb },
    { id: 'comando' as const, label: 'Comandos', icon: ToggleLeft },
    { id: 'tablero' as const, label: 'Protecciones', icon: ShieldAlert },
    { id: 'canalizacion' as const, label: 'Cajas & PAT', icon: Box },
    { id: 'habitaciones' as const, label: 'Habitaciones', icon: Square },
  ];

  const filteredTemplates = SYMBOL_TEMPLATES.filter((t) => {
    if (activeCategory === 'tablero') return t.category === 'tablero' || t.category === 'proteccion';
    return t.category === activeCategory;
  });

  return (
    <aside className="no-print w-full lg:w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full text-slate-200 select-none text-xs">
      {/* Cabecera para móvil cuando se abre en modal o drawer */}
      {onClose && (
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Herramientas & Catálogo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
            aria-label="Cerrar catálogo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Herramientas Principales de Edición */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/60">
        <div className="text-[10px] uppercase font-semibold text-slate-400 px-1 mb-1.5 flex items-center justify-between">
          <span>Herramientas CAD</span>
          <span className="text-[9px] text-slate-500">Atajos rápidos</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onSelectTool('select')}
            title="Seleccionar, mover y rotar elementos (V)"
            className={`flex items-center gap-1.5 px-2 py-2 rounded text-left font-medium transition-colors ${
              activeTool === 'select'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Puntero</span>
          </button>

          <button
            onClick={() => onSelectTool('wire')}
            title="Tirar cables entre terminales de componentes (W)"
            className={`flex items-center gap-1.5 px-2 py-2 rounded text-left font-medium transition-colors ${
              activeTool === 'wire'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cablear</span>
          </button>

          <button
            onClick={() => onSelectTool('wall')}
            title="Dibujar muros y tabiques"
            className={`flex items-center gap-1.5 px-2 py-2 rounded text-left font-medium transition-colors ${
              activeTool === 'wall'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Muro</span>
          </button>

          <button
            onClick={() => onSelectTool('room')}
            title="Dibujar habitación rectangular personalizada"
            className={`flex items-center gap-1.5 px-2 py-2 rounded text-left font-medium transition-colors ${
              activeTool === 'room'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Ambiente</span>
          </button>

          <button
            onClick={() => onSelectTool('door')}
            title="Colocar puerta de acceso o interior"
            className={`flex items-center gap-1.5 px-2 py-2 rounded text-left font-medium transition-colors ${
              activeTool === 'door'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Puerta</span>
          </button>

          <button
            onClick={() => onSelectTool('window')}
            title="Colocar ventana"
            className={`flex items-center gap-1.5 px-2 py-2 rounded text-left font-medium transition-colors ${
              activeTool === 'window'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <AppWindow className="w-3.5 h-3.5" />
            <span>Ventana</span>
          </button>
        </div>

        {/* Opciones cuando está activa la herramienta Cablear */}
        {activeTool === 'wire' && (
          <div className="mt-2 p-2 bg-slate-950/70 border border-slate-800 rounded">
            <span className="text-[10px] text-slate-400 block mb-1">Tipo de conductor activo:</span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { type: 'fase' as ConductorType, label: 'Fase (Marrón)', color: 'bg-amber-800 text-amber-100' },
                { type: 'neutro' as ConductorType, label: 'Neutro (Celeste)', color: 'bg-sky-700 text-sky-100' },
                { type: 'tierra' as ConductorType, label: 'Tierra (Verde-Am.)', color: 'bg-emerald-700 text-emerald-100' },
                { type: 'retorno' as ConductorType, label: 'Retorno (Gris/Bco)', color: 'bg-amber-600 text-amber-950 font-medium' },
                { type: 'puente' as ConductorType, label: 'Puente Combinación', color: 'bg-purple-700 text-purple-100' },
              ].map((c) => (
                <button
                  key={c.type}
                  onClick={() => onSelectWireType(c.type)}
                  className={`px-1.5 py-1 text-[10px] rounded transition-all text-left ${c.color} ${
                    activeWireType === c.type ? 'ring-2 ring-white font-semibold' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-cyan-300 mt-1.5 leading-tight">
              Haz clic en el terminal de origen y luego en el de destino en el plano para tender el cable.
            </p>
          </div>
        )}

        {/* Circuito de Asignación por defecto */}
        <div className="mt-2 flex items-center justify-between gap-1 text-[11px] bg-slate-800/40 p-1.5 rounded">
          <span className="text-slate-400">Circuito activo:</span>
          <select
            value={selectedCircuitId}
            onChange={(e) => onSelectCircuit(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-amber-400 font-semibold px-2 py-0.5 rounded text-[11px] focus:outline-hidden"
          >
            {circuits.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} - {c.name.slice(0, 18)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Pestañas de Categoría de Símbolos */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1 gap-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              title={cat.label}
              className={`flex-1 py-1 px-1 rounded flex flex-col items-center gap-0.5 transition-colors ${
                isActive
                  ? 'bg-slate-800 text-amber-400 border border-slate-700 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[9px] truncate max-w-full">{cat.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Lista de Símbolos o Habitaciones según la Pestaña */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {activeCategory === 'habitaciones' ? (
          <div>
            <span className="text-[10px] text-slate-400 block mb-2 px-1">
              Ambientes estándar predefinidos (haz clic para insertar en el plano):
            </span>
            <div className="space-y-1.5">
              {[
                { name: 'Estar - Comedor', w: 360, h: 280, area: '14.4 m²' },
                { name: 'Dormitorio Principal', w: 300, h: 280, area: '10.5 m²' },
                { name: 'Cocina', w: 240, h: 240, area: '7.2 m²' },
                { name: 'Baño Completo', w: 200, h: 240, area: '4.8 m²' },
                { name: 'Pasillo / Hall', w: 180, h: 240, area: '3.6 m²' },
                { name: 'Lavadero', w: 180, h: 180, area: '3.2 m²' },
                { name: 'Cochera / Quincho', w: 360, h: 400, area: '21.6 m²' },
              ].map((room) => (
                <button
                  key={room.name}
                  onClick={() => onAddPresetRoom(room.name, room.w, room.h)}
                  className="w-full flex items-center justify-between p-2 rounded bg-slate-800/60 hover:bg-slate-750 border border-slate-700/60 text-left transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Square className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-medium text-slate-200">{room.name}</div>
                      <div className="text-[10px] text-slate-400">Área est.: {room.area}</div>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-[10px] text-slate-400 block mb-1.5 px-1">
              Selecciona un componente y haz clic en el plano para colocarlo:
            </span>
            <div className="space-y-1">
              {filteredTemplates.map((template: SymbolTemplate) => {
                const isSelected = activeTool === 'place_symbol' && selectedTemplateType === template.type;
                return (
                  <button
                    key={template.type}
                    onClick={() => {
                      onSelectTool('place_symbol');
                      onSelectTemplate(template.type);
                    }}
                    className={`w-full text-left p-2 rounded border transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/80 text-amber-200 shadow-xs'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-750 hover:border-slate-600'
                    }`}
                  >
                    <div className="p-1 rounded bg-slate-900 border border-slate-700 text-amber-400 mt-0.5">
                      <Compass className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[11px] truncate flex items-center justify-between">
                        <span>{template.name}</span>
                        <span className="text-[9px] text-amber-400/90 font-mono font-bold bg-amber-950/40 px-1 rounded">
                          {template.labelPrefix}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                        {template.description}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-[9px] text-slate-400">
                        {template.defaultPowerWatts > 0 && (
                          <span className="text-amber-300 font-mono">{template.defaultPowerWatts} W</span>
                        )}
                        <span>{template.terminals.length} bornes ({template.terminals.map((t) => t.id).join(', ')})</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Pie de catálogo con información normativa */}
      <div className="p-2 border-t border-slate-800 bg-slate-950/70 text-[10px] text-slate-400 leading-normal">
        <span className="text-slate-300 font-medium">Norma de referencia:</span> AEA 90364-771
        <p className="mt-0.5 text-slate-400">
          Los símbolos representan elementos físicos y su topología eléctrica lógica dentro del simulador.
        </p>
      </div>
    </aside>
  );
};
