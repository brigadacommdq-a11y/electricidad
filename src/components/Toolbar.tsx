/**
 * ELECTRA PLAN — Barra Lateral de Herramientas y Catálogo CAD
 * Rediseño visual profesional con identidad en verde petróleo (#167D78)
 * y distinción entre componentes disponibles y colocados en el plano.
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
  Wrench,
  Check,
} from 'lucide-react';
import { SYMBOL_TEMPLATES, SymbolTemplate } from '../services/symbolCatalog';
import { Circuit, ConductorType, ElectricalSymbol } from '../types/electra';

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
  placedSymbols?: ElectricalSymbol[];
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
  placedSymbols = [],
}) => {
  const [activeCategory, setActiveCategory] = useState<
    'utilizacion' | 'comando' | 'tablero' | 'taller' | 'canalizacion' | 'habitaciones'
  >('utilizacion');

  const categories = [
    { id: 'utilizacion' as const, label: 'Ilum. & Tomas', icon: Lightbulb },
    { id: 'taller' as const, label: 'Bombas & Taller', icon: Wrench },
    { id: 'comando' as const, label: 'Comandos', icon: ToggleLeft },
    { id: 'tablero' as const, label: 'Protecciones', icon: ShieldAlert },
    { id: 'canalizacion' as const, label: 'Cajas & PAT', icon: Box },
    { id: 'habitaciones' as const, label: 'Ambientes', icon: Square },
  ];

  const filteredTemplates = SYMBOL_TEMPLATES.filter((t) => {
    if (activeCategory === 'tablero') return t.category === 'tablero' || t.category === 'proteccion';
    if (activeCategory === 'taller') {
      return (
        t.type.startsWith('bomba') ||
        t.type.startsWith('soldadora') ||
        t.type === 'compresor_aire' ||
        t.type === 'taladro_banco' ||
        t.type === 'amoladora_banco' ||
        t.type === 'torno_metales' ||
        t.type === 'fresadora' ||
        t.type === 'sierra_electrica' ||
        t.type === 'extractor_industrial' ||
        t.type === 'colector_polvo' ||
        t.type === 'polipasto_electrico'
      );
    }
    if (activeCategory === 'utilizacion') {
      const isTaller =
        t.type.startsWith('bomba') ||
        t.type.startsWith('soldadora') ||
        t.type === 'compresor_aire' ||
        t.type === 'taladro_banco' ||
        t.type === 'amoladora_banco' ||
        t.type === 'torno_metales' ||
        t.type === 'fresadora' ||
        t.type === 'sierra_electrica' ||
        t.type === 'extractor_industrial' ||
        t.type === 'colector_polvo' ||
        t.type === 'polipasto_electrico';
      return t.category === 'utilizacion' && !isTaller;
    }
    return t.category === activeCategory;
  });

  // Conteo de elementos colocados en el plano por tipo
  const placedCountsByType = React.useMemo(() => {
    const map: Record<string, number> = {};
    placedSymbols.forEach((s) => {
      map[s.type] = (map[s.type] || 0) + 1;
    });
    return map;
  }, [placedSymbols]);

  return (
    <aside className="no-print w-full lg:w-72 bg-white dark:bg-[#142028] border-r border-[#DCE4E8] dark:border-[#243542] flex flex-col h-full text-[#18313B] dark:text-[#F1F5F9] select-none text-xs transition-colors">
      {/* Cabecera para móvil cuando se abre en modal o drawer */}
      {onClose && (
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#0D161C]">
          <div className="flex items-center gap-2 font-bold text-sm text-[#18313B] dark:text-white">
            <Compass className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
            <span>Herramientas & Catálogo</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white bg-white dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-full transition-colors"
            aria-label="Cerrar catálogo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Herramientas Principales de Edición */}
      <div className="p-2.5 border-b border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/60 dark:bg-[#182631]/60">
        <div className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8] px-1 mb-1.5 flex items-center justify-between tracking-wider">
          <span>Herramientas CAD</span>
          <span className="text-[9px] text-[#8E9FAA] font-normal">Edición en plano</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => onSelectTool('select')}
            title="Seleccionar, mover y rotar elementos (V)"
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left font-semibold transition-all ${
              activeTool === 'select'
                ? 'bg-[#167D78] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1B2B36] text-[#18313B] dark:text-slate-200 hover:bg-[#EDF2F5] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542]'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Puntero</span>
          </button>

          <button
            onClick={() => onSelectTool('wire')}
            title="Tirar cables entre bornes de componentes (W)"
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left font-semibold transition-all ${
              activeTool === 'wire'
                ? 'bg-[#167D78] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1B2B36] text-[#18313B] dark:text-slate-200 hover:bg-[#EDF2F5] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542]'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
            <span>Cablear</span>
          </button>

          <button
            onClick={() => onSelectTool('wall')}
            title="Dibujar muros y tabiques"
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left font-semibold transition-all ${
              activeTool === 'wall'
                ? 'bg-[#167D78] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1B2B36] text-[#18313B] dark:text-slate-200 hover:bg-[#EDF2F5] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542]'
            }`}
          >
            <Minus className="w-3.5 h-3.5" />
            <span>Muro</span>
          </button>

          <button
            onClick={() => onSelectTool('room')}
            title="Dibujar habitación rectangular personalizada"
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left font-semibold transition-all ${
              activeTool === 'room'
                ? 'bg-[#167D78] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1B2B36] text-[#18313B] dark:text-slate-200 hover:bg-[#EDF2F5] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542]'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Ambiente</span>
          </button>

          <button
            onClick={() => onSelectTool('door')}
            title="Colocar puerta de paso"
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left font-semibold transition-all ${
              activeTool === 'door'
                ? 'bg-[#167D78] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1B2B36] text-[#18313B] dark:text-slate-200 hover:bg-[#EDF2F5] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542]'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            <span>Puerta</span>
          </button>

          <button
            onClick={() => onSelectTool('window')}
            title="Colocar ventana vidriada"
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left font-semibold transition-all ${
              activeTool === 'window'
                ? 'bg-[#167D78] text-white shadow-2xs'
                : 'bg-white dark:bg-[#1B2B36] text-[#18313B] dark:text-slate-200 hover:bg-[#EDF2F5] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542]'
            }`}
          >
            <AppWindow className="w-3.5 h-3.5" />
            <span>Ventana</span>
          </button>
        </div>

        {/* Opciones cuando está activa la herramienta Cablear */}
        {activeTool === 'wire' && (
          <div className="mt-2 p-2 bg-[#E8F5F5] dark:bg-[#182631] border border-[#B7DFDD] dark:border-[#243542] rounded-lg">
            <span className="text-[10px] text-[#167D78] dark:text-[#2DD4BF] font-bold block mb-1">
              Tipo de conductor activo:
            </span>
            <div className="grid grid-cols-2 gap-1">
              {[
                { type: 'fase' as ConductorType, label: 'Fase (Marrón)', color: 'bg-amber-900 text-amber-100' },
                { type: 'neutro' as ConductorType, label: 'Neutro (Celeste)', color: 'bg-sky-700 text-sky-100' },
                { type: 'tierra' as ConductorType, label: 'Tierra (Verde-Am.)', color: 'bg-emerald-700 text-emerald-100' },
                { type: 'retorno' as ConductorType, label: 'Retorno (Blanco/Gris)', color: 'bg-slate-700 text-slate-100' },
                { type: 'puente' as ConductorType, label: 'Puente Combinación', color: 'bg-orange-700 text-orange-100' },
              ].map((c) => (
                <button
                  key={c.type}
                  onClick={() => onSelectWireType(c.type)}
                  className={`px-1.5 py-1 text-[10px] rounded transition-all text-left font-medium ${c.color} ${
                    activeWireType === c.type ? 'ring-2 ring-[#167D78] font-bold shadow-xs' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#18313B] dark:text-[#94A3B8] mt-1.5 leading-tight">
              Toca el borne de origen y luego el de destino para tender el conductor.
            </p>
          </div>
        )}

        {/* Circuito de Asignación por defecto */}
        <div className="mt-2 flex items-center justify-between gap-1 text-[11px] bg-white dark:bg-[#1B2B36] p-1.5 rounded-lg border border-[#DCE4E8] dark:border-[#243542]">
          <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">Circuito activo:</span>
          <select
            value={selectedCircuitId}
            onChange={(e) => onSelectCircuit(e.target.value)}
            className="bg-[#F4F6F8] dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] text-[#167D78] dark:text-[#2DD4BF] font-bold px-2 py-0.5 rounded text-[11px] focus:outline-hidden"
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
      <div className="flex border-b border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#182631] p-1 gap-1">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              title={cat.label}
              className={`flex-1 py-1.5 px-1 rounded-md flex flex-col items-center gap-0.5 transition-colors ${
                isActive
                  ? 'bg-white dark:bg-[#1B2B36] text-[#167D78] dark:text-[#2DD4BF] font-bold shadow-2xs border border-[#DCE4E8] dark:border-[#243542]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white hover:bg-white/60 dark:hover:bg-[#1B2B36]/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[9px] truncate max-w-full font-medium">{cat.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Lista de Símbolos o Habitaciones */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {activeCategory === 'habitaciones' ? (
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mb-2 px-1 font-medium">
              Ambientes estándar (haz clic para insertar en el plano):
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
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#1B2B36] hover:bg-[#F4F6F8] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] text-left transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <Square className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                    <div>
                      <div className="font-semibold text-[#18313B] dark:text-slate-200">{room.name}</div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Área: {room.area}</div>
                    </div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mb-1.5 px-1 font-medium">
              Componentes disponibles (toca y luego haz clic en el plano):
            </span>
            <div className="space-y-1.5">
              {filteredTemplates.map((template: SymbolTemplate) => {
                const isSelected = activeTool === 'place_symbol' && selectedTemplateType === template.type;
                const placedCount = placedCountsByType[template.type] || 0;

                return (
                  <button
                    key={template.type}
                    onClick={() => {
                      onSelectTool('place_symbol');
                      onSelectTemplate(template.type);
                    }}
                    className={`w-full text-left p-2 rounded-lg border transition-all flex items-start gap-2.5 shadow-2xs ${
                      isSelected
                        ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 border-[#167D78] dark:border-[#2DD4BF] text-[#18313B] dark:text-white ring-1 ring-[#167D78]'
                        : 'bg-white dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 hover:bg-[#F4F6F8] dark:hover:bg-[#243542]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-[#167D78] text-white border-[#167D78]'
                          : 'bg-[#F4F6F8] dark:bg-[#142028] border-[#DCE4E8] dark:border-[#243542] text-[#167D78] dark:text-[#2DD4BF]'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[11px] truncate flex items-center justify-between gap-1">
                        <span className="truncate">{template.name}</span>
                        <span className="text-[9px] text-[#167D78] dark:text-[#2DD4BF] font-mono font-bold bg-[#E8F5F5] dark:bg-[#167D78]/20 px-1 py-0.2 rounded shrink-0">
                          {template.labelPrefix}
                        </span>
                      </div>

                      <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8] leading-tight mt-0.5 line-clamp-2">
                        {template.description}
                      </p>

                      <div className="mt-1 flex items-center justify-between gap-2 text-[9px] text-[#8E9FAA]">
                        <div>
                          {template.defaultPowerWatts > 0 ? (
                            <span className="text-[#167D78] dark:text-[#2DD4BF] font-mono font-bold">
                              {template.defaultPowerWatts} W
                            </span>
                          ) : (
                            <span>{template.terminals.length} bornes</span>
                          )}
                        </div>

                        {/* Distinción clara de componentes ya colocados en el plano */}
                        {placedCount > 0 ? (
                          <span className="text-[9px] font-bold text-[#167D78] dark:text-[#2DD4BF] bg-[#E8F5F5] dark:bg-[#167D78]/25 px-1.5 py-0.2 rounded-full border border-[#B7DFDD] dark:border-[#167D78]/40 flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            <span>{placedCount} en plano</span>
                          </span>
                        ) : (
                          <span className="text-[9px] text-[#8E9FAA] font-normal">Disponible</span>
                        )}
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
      <div className="p-2.5 border-t border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#0D161C] text-[10px] text-[#64748B] dark:text-[#94A3B8] leading-normal">
        <span className="text-[#18313B] dark:text-[#F1F5F9] font-bold">Norma AEA 90364:</span> Simbología normalizada y
        topología eléctrica interactiva.
      </div>
    </aside>
  );
};
