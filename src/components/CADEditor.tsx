/**
 * ELECTRA PLAN — Editor CAD Interactivo del Plano Eléctrico
 * Renderizado SVG de alta precisión, cuadrícula configurable, cotas, símbolos y cableado.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  Ruler,
  Trash2,
  RotateCw,
  Power,
  Zap,
  Hand,
  MousePointer,
  X,
} from 'lucide-react';
import {
  Project,
  ElectricalSymbol,
  Wire,
  Room,
  ArchElement,
  ConductorType,
} from '../types/electra';
import { CADTool } from './Toolbar';
import { createSymbolFromTemplate, WIRE_COLOR_MAP } from '../services/symbolCatalog';

interface CADEditorProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  activeTool: CADTool;
  selectedTemplateType: string | null;
  selectedCircuitId: string;
  activeWireType: ConductorType;
  selectedElementId: string | null;
  selectedElementType: 'symbol' | 'wire' | 'room' | 'wall' | null;
  onSelectElement: (type: 'symbol' | 'wire' | 'room' | 'wall' | null, id: string | null) => void;
  onToggleSwitch: (symbolId: string) => void;
  isSimulating: boolean;
}

export const CADEditor: React.FC<CADEditorProps> = ({
  project,
  onUpdateProject,
  activeTool,
  selectedTemplateType,
  selectedCircuitId,
  activeWireType,
  selectedElementId,
  selectedElementType,
  onSelectElement,
  onToggleSwitch,
  isSimulating,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1.0);

  // Arrastre de elementos
  const [draggingSymbolId, setDraggingSymbolId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Terminal seleccionado para inicio de cable
  const [wiringStart, setWiringStart] = useState<{
    componentId: string;
    terminalId: string;
    x: number;
    y: number;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Opciones de visualización
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);

  const gridSize = project.metadata.gridSize || 20;

  // Convertir coordenadas de pantalla a SVG
  const getSVGCoordinates = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = (clientX - rect.left - pan.x) / zoom;
    const rawY = (clientY - rect.top - pan.y) / zoom;
    if (snapToGrid) {
      return {
        x: Math.round(rawX / gridSize) * gridSize,
        y: Math.round(rawY / gridSize) * gridSize,
      };
    }
    return { x: Math.round(rawX), y: Math.round(rawY) };
  };

  // Manejador de clic en el lienzo
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPanning) return;
    const coords = getSVGCoordinates(e.clientX, e.clientY);

    if (activeTool === 'place_symbol' && selectedTemplateType) {
      const newSymbol = createSymbolFromTemplate(
        selectedTemplateType,
        coords.x,
        coords.y,
        project.activeFloorId,
        selectedCircuitId,
        project.symbols.filter((s) => s.type === selectedTemplateType).length + 1
      );

      onUpdateProject((prev) => ({
        ...prev,
        symbols: [...prev.symbols, newSymbol],
      }));
      onSelectElement('symbol', newSymbol.id);
    } else if (activeTool === 'room') {
      // Crear nueva habitación rectangular 6x5m (240x200 px)
      const newRoom: Room = {
        id: `room_${Date.now()}`,
        floorId: project.activeFloorId,
        name: `Ambiente ${project.rooms.length + 1}`,
        x: coords.x,
        y: coords.y,
        width: 240,
        height: 200,
        color: 'rgba(59, 130, 246, 0.05)',
      };
      onUpdateProject((prev) => ({
        ...prev,
        rooms: [...prev.rooms, newRoom],
      }));
      onSelectElement('room', newRoom.id);
    } else if (activeTool === 'wall') {
      // Crear muro horizontal de 3m (120px)
      const newWall: ArchElement = {
        id: `wall_${Date.now()}`,
        floorId: project.activeFloorId,
        type: 'wall',
        x1: coords.x,
        y1: coords.y,
        x2: coords.x + 160,
        y2: coords.y,
        thickness: 10,
      };
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: [...prev.architecturalElements, newWall],
      }));
      onSelectElement('wall', newWall.id);
    } else if (activeTool === 'door') {
      const newDoor: ArchElement = {
        id: `door_${Date.now()}`,
        floorId: project.activeFloorId,
        type: 'door',
        x1: coords.x,
        y1: coords.y,
        x2: coords.x,
        y2: coords.y + 60,
        thickness: 6,
      };
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: [...prev.architecturalElements, newDoor],
      }));
      onSelectElement('wall', newDoor.id);
    } else if (activeTool === 'window') {
      const newWindow: ArchElement = {
        id: `win_${Date.now()}`,
        floorId: project.activeFloorId,
        type: 'window',
        x1: coords.x,
        y1: coords.y,
        x2: coords.x + 100,
        y2: coords.y,
        thickness: 6,
      };
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: [...prev.architecturalElements, newWindow],
      }));
      onSelectElement('wall', newWindow.id);
    } else if (activeTool === 'select') {
      // Deseleccionar si hace clic en el fondo vacío
      if (e.target === e.currentTarget) {
        onSelectElement(null, null);
      }
    }
  };

  // Manejo de Pan con ratón
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isPanMode || e.button === 1 || e.altKey || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getSVGCoordinates(e.clientX, e.clientY);
    setCursorPos(coords);

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (draggingSymbolId) {
      onUpdateProject((prev) => ({
        ...prev,
        symbols: prev.symbols.map((sym) =>
          sym.id === draggingSymbolId
            ? { ...sym, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
            : sym
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingSymbolId(null);
  };

  // Manejo de eventos Touch (móvil y tablet)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Gesto de pellizco para acercar/alejar con 2 dedos
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      initialPinchDistRef.current = dist;
      initialZoomRef.current = zoom;
      setIsPanning(false);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      const coords = getSVGCoordinates(touch.clientX, touch.clientY);
      setCursorPos(coords);

      if (isPanMode || activeTool === 'select') {
        setIsPanning(true);
        setStartPan({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      // Zoom progresivo con dos dedos
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / initialPinchDistRef.current;
      const nextZoom = Math.min(2.5, Math.max(0.4, Number((initialZoomRef.current * ratio).toFixed(2))));
      setZoom(nextZoom);
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const coords = getSVGCoordinates(touch.clientX, touch.clientY);
      setCursorPos(coords);

      if (isPanning) {
        setPan({ x: touch.clientX - startPan.x, y: touch.clientY - startPan.y });
      } else if (draggingSymbolId) {
        onUpdateProject((prev) => ({
          ...prev,
          symbols: prev.symbols.map((sym) =>
            sym.id === draggingSymbolId
              ? { ...sym, x: coords.x - dragOffset.x, y: coords.y - dragOffset.y }
              : sym
          ),
        }));
      }
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    initialPinchDistRef.current = null;
    setIsPanning(false);
    setDraggingSymbolId(null);
  };

  // Conectar terminales con cable
  const handleTerminalClick = (
    e: React.MouseEvent,
    symbol: ElectricalSymbol,
    terminalId: string,
    termX: number,
    termY: number
  ) => {
    e.stopPropagation();

    if (!wiringStart) {
      // Iniciar cable
      setWiringStart({
        componentId: symbol.id,
        terminalId,
        x: termX,
        y: termY,
      });
    } else {
      // Completar cable si es con otro terminal distinto
      if (wiringStart.componentId === symbol.id && wiringStart.terminalId === terminalId) {
        setWiringStart(null);
        return;
      }

      const dx = (termX - wiringStart.x) / 40; // 40px = 1m
      const dy = (termY - wiringStart.y) / 40;
      const straightMeters = Math.sqrt(dx * dx + dy * dy);
      const estLength = Number(Math.max(1.5, straightMeters * 1.3).toFixed(1));

      const newWire: Wire = {
        id: `wire_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        floorId: project.activeFloorId,
        circuitId: symbol.circuitId || selectedCircuitId,
        type: activeWireType,
        fromComponentId: wiringStart.componentId,
        fromTerminalId: wiringStart.terminalId,
        toComponentId: symbol.id,
        toTerminalId: terminalId,
        color: WIRE_COLOR_MAP[activeWireType].stroke,
        crossSectionMm2: activeWireType === 'tierra' ? 2.5 : activeWireType === 'retorno' ? 1.5 : 2.5,
        lengthMeters: estLength,
      };

      onUpdateProject((prev) => ({
        ...prev,
        wires: [...prev.wires, newWire],
      }));

      setWiringStart(null);
      onSelectElement('wire', newWire.id);
    }
  };

  // Eliminar elemento seleccionado
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;

    if (selectedElementType === 'symbol') {
      onUpdateProject((prev) => ({
        ...prev,
        symbols: prev.symbols.filter((s) => s.id !== selectedElementId),
        wires: prev.wires.filter(
          (w) => w.fromComponentId !== selectedElementId && w.toComponentId !== selectedElementId
        ),
      }));
      onSelectElement(null, null);
    } else if (selectedElementType === 'wire') {
      onUpdateProject((prev) => ({
        ...prev,
        wires: prev.wires.filter((w) => w.id !== selectedElementId),
      }));
      onSelectElement(null, null);
    } else if (selectedElementType === 'room') {
      onUpdateProject((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((r) => r.id !== selectedElementId),
      }));
      onSelectElement(null, null);
    } else if (selectedElementType === 'wall') {
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: prev.architecturalElements.filter((a) => a.id !== selectedElementId),
      }));
      onSelectElement(null, null);
    }
  };

  // Rotar símbolo 90°
  const handleRotateSelected = () => {
    if (selectedElementType === 'symbol' && selectedElementId) {
      onUpdateProject((prev) => ({
        ...prev,
        symbols: prev.symbols.map((s) =>
          s.id === selectedElementId ? { ...s, rotation: (s.rotation + 90) % 360 } : s
        ),
      }));
    }
  };

  // Tecla Supr para borrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          handleDeleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
      className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden select-none cursor-crosshair touch-none"
    >
      {/* 1. Barra flotante de controles CAD para Escritorio y Tablet (sm y superior) */}
      <div className="hidden sm:flex absolute top-3 right-3 z-20 items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg shadow-lg backdrop-blur-xs text-xs">
        <button
          onClick={() => setIsPanMode(!isPanMode)}
          title={isPanMode ? 'Desactivar modo mover (volver a edición)' : 'Activar modo mover plano (Pan)'}
          className={`p-1.5 rounded transition-colors ${
            isPanMode ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          title="Acercar vista (Zoom +)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-1">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          title="Alejar vista (Zoom -)"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setZoom(1.0);
            setPan({ x: 40, y: 30 });
          }}
          title="Centrar y ajustar plano"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <button
          onClick={() => setShowGrid(!showGrid)}
          title="Activar / Desactivar cuadrícula CAD"
          className={`p-1.5 rounded transition-colors ${
            showGrid ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          title="Ajuste magnético a la cuadrícula (Snap)"
          className={`p-1.5 rounded transition-colors ${
            snapToGrid ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Magnet className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowDimensions(!showDimensions)}
          title="Mostrar / Ocultar cotas y medidas en metros"
          className={`p-1.5 rounded transition-colors ${
            showDimensions ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Ruler className="w-4 h-4" />
        </button>

        {selectedElementId && (
          <>
            <div className="h-4 w-px bg-slate-800 mx-0.5" />
            {selectedElementType === 'symbol' && (
              <button
                onClick={handleRotateSelected}
                title="Rotar símbolo 90° (R)"
                className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleDeleteSelected}
              title="Eliminar elemento seleccionado (Supr)"
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 2. Dock Flotante Táctil para Móviles (Android / iOS en pantallas pequeñas) */}
      <div className="flex sm:hidden absolute top-2 right-2 z-20 flex-col items-end gap-1.5">
        {/* Grupo de zoom y navegación táctil */}
        <div className="flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md overflow-hidden">
          <button
            onClick={() => setIsPanMode(!isPanMode)}
            title="Alternar entre mover plano y editar"
            className={`p-2.5 flex items-center justify-center transition-colors border-b border-slate-800 ${
              isPanMode ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 active:bg-slate-800'
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            title="Acercar vista"
            className="p-2.5 text-slate-200 active:bg-slate-800 active:text-white border-b border-slate-800 flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="text-[9px] font-mono font-bold text-center py-1 text-slate-400 border-b border-slate-800">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            title="Alejar vista"
            className="p-2.5 text-slate-200 active:bg-slate-800 active:text-white border-b border-slate-800 flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 40, y: 30 });
            }}
            title="Centrar plano"
            className="p-2.5 text-slate-200 active:bg-slate-800 active:text-white flex items-center justify-center"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Acciones si hay elemento seleccionado en móvil */}
        {selectedElementId && (
          <div className="flex flex-col bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-xl backdrop-blur-md overflow-hidden">
            {selectedElementType === 'symbol' && (
              <button
                onClick={handleRotateSelected}
                title="Rotar símbolo"
                className="p-2.5 text-amber-400 active:bg-slate-800 border-b border-slate-800 flex items-center justify-center"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleDeleteSelected}
              title="Eliminar elemento"
              className="p-2.5 text-red-400 active:bg-slate-800 flex items-center justify-center"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Cartel flotante en móvil cuando Modo Mover está activo */}
      {isPanMode && (
        <div className="sm:hidden absolute top-2 left-2 z-20 bg-amber-500 text-slate-950 font-bold text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-pulse">
          <Hand className="w-3.5 h-3.5 shrink-0" />
          <span>Modo Mover: Desliza 1 dedo</span>
        </div>
      )}

      {/* Indicador de ayuda en modo cablear */}
      {wiringStart && (
        <div className="absolute top-2 left-2 right-12 sm:right-auto sm:max-w-md z-30 bg-amber-950/95 border border-amber-500 text-amber-200 p-2.5 sm:px-3 sm:py-1.5 rounded-xl text-xs shadow-xl flex items-center justify-between gap-2 backdrop-blur-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span className="text-[11px] sm:text-xs truncate">
              Cableando desde <strong>{wiringStart.terminalId}</strong>. Toca destino.
            </span>
          </div>
          <button
            onClick={() => setWiringStart(null)}
            className="px-2 py-1 bg-amber-800/80 hover:bg-amber-700 text-amber-100 rounded text-[11px] font-bold shrink-0"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Lienzo SVG */}
      <svg
        onClick={handleCanvasClick}
        className="w-full h-full"
        style={{
          transformOrigin: '0 0',
        }}
      >
        <defs>
          {/* Patrón de cuadrícula CAD milimétrica */}
          <pattern
            id="cad-grid"
            width={gridSize * zoom}
            height={gridSize * zoom}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={(gridSize * zoom) / 2}
              cy={(gridSize * zoom) / 2}
              r={1}
              fill="rgba(148, 163, 184, 0.25)"
            />
          </pattern>

          {/* Filtro de resplandor para lámparas encendidas */}
          <filter id="lamp-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Fondo de cuadrícula */}
        {showGrid && (
          <rect
            x={0}
            y={0}
            width="100%"
            height="100%"
            fill="url(#cad-grid)"
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Grupo principal transformado con Pan y Zoom */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Habitaciones / Ambientes */}
          {project.rooms.map((room) => {
            const isSelected = selectedElementType === 'room' && selectedElementId === room.id;
            const areaM2 = ((room.width / 40) * (room.height / 40)).toFixed(1);
            return (
              <g
                key={room.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('room', room.id);
                }}
                className="cursor-pointer"
              >
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={room.color || 'rgba(59, 130, 246, 0.05)'}
                  stroke={isSelected ? '#f59e0b' : '#334155'}
                  strokeWidth={isSelected ? 2 : 1}
                  strokeDasharray={isSelected ? '4,4' : undefined}
                />
                {/* Nombre del ambiente y dimensiones */}
                <text
                  x={room.x + room.width / 2}
                  y={room.y + 24}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                >
                  {room.name}
                </text>
                {showDimensions && (
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + 40}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {areaM2} m² ({(room.width / 40).toFixed(1)}m × {(room.height / 40).toFixed(1)}m)
                  </text>
                )}
              </g>
            );
          })}

          {/* 2. Elementos arquitectónicos (Muros, Puertas, Ventanas) */}
          {project.architecturalElements.map((elem) => {
            const isSelected = selectedElementType === 'wall' && selectedElementId === elem.id;
            if (elem.type === 'wall') {
              return (
                <line
                  key={elem.id}
                  x1={elem.x1}
                  y1={elem.y1}
                  x2={elem.x2}
                  y2={elem.y2}
                  stroke={isSelected ? '#f59e0b' : '#475569'}
                  strokeWidth={elem.thickness || 10}
                  strokeLinecap="round"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('wall', elem.id);
                  }}
                  className="cursor-pointer"
                />
              );
            } else if (elem.type === 'door') {
              // Arco de puerta
              return (
                <g
                  key={elem.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('wall', elem.id);
                  }}
                  className="cursor-pointer"
                >
                  <line
                    x1={elem.x1}
                    y1={elem.y1}
                    x2={elem.x2}
                    y2={elem.y2}
                    stroke={isSelected ? '#f59e0b' : '#94a3b8'}
                    strokeWidth={4}
                  />
                  <path
                    d={`M ${elem.x1} ${elem.y1} A ${elem.y2 - elem.y1} ${elem.y2 - elem.y1} 0 0 1 ${elem.x1 + (elem.y2 - elem.y1)} ${elem.y2}`}
                    fill="none"
                    stroke={isSelected ? '#f59e0b' : '#64748b'}
                    strokeWidth={1.5}
                    strokeDasharray="2,2"
                  />
                </g>
              );
            } else if (elem.type === 'window') {
              // Ventana (doble línea vidriada)
              return (
                <g
                  key={elem.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectElement('wall', elem.id);
                  }}
                  className="cursor-pointer"
                >
                  <line
                    x1={elem.x1}
                    y1={elem.y1}
                    x2={elem.x2}
                    y2={elem.y2}
                    stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                    strokeWidth={6}
                  />
                  <line
                    x1={elem.x1}
                    y1={elem.y1}
                    x2={elem.x2}
                    y2={elem.y2}
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                </g>
              );
            }
            return null;
          })}

          {/* 3. Cables y canalizaciones */}
          {project.wires.map((wire) => {
            const isSelected = selectedElementType === 'wire' && selectedElementId === wire.id;
            const fromSym = project.symbols.find((s) => s.id === wire.fromComponentId);
            const toSym = project.symbols.find((s) => s.id === wire.toComponentId);
            if (!fromSym || !toSym) return null;

            const fromTerm = fromSym.terminals.find((t) => t.id === wire.fromTerminalId);
            const toTerm = toSym.terminals.find((t) => t.id === wire.toTerminalId);

            const x1 = fromSym.x + (fromTerm?.relX || 0);
            const y1 = fromSym.y + (fromTerm?.relY || 0);
            const x2 = toSym.x + (toTerm?.relX || 0);
            const y2 = toSym.y + (toTerm?.relY || 0);

            // Trazo curvo suave (Bézier cuadrática para realismo CAD de cañerías)
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2 + (x2 - x1) * 0.1;
            const pathD = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

            const wireColor = wire.color || WIRE_COLOR_MAP[wire.type]?.stroke || '#854d0e';

            return (
              <g
                key={wire.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement('wire', wire.id);
                }}
                className="cursor-pointer"
              >
                {/* Zona de impacto más amplia para hacer clic fácilmente */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth={16} />

                {/* Sombra de cable energizado */}
                {wire.isEnergized && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={wireColor}
                    strokeWidth={isSelected ? 6 : 4}
                    opacity={0.3}
                  />
                )}

                {/* Cable físico */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isSelected ? '#f59e0b' : wireColor}
                  strokeWidth={isSelected ? 3.5 : 2}
                  strokeDasharray={wire.type === 'tierra' ? '6,3' : wire.hasCurrent ? '8,4' : undefined}
                />

                {/* Etiqueta de longitud a mitad del recorrido */}
                {showDimensions && (
                  <text
                    x={midX}
                    y={midY - 4}
                    textAnchor="middle"
                    fill={wireColor}
                    fontSize="9"
                    fontWeight="500"
                    fontFamily="'JetBrains Mono', monospace"
                    className="select-none pointer-events-none"
                  >
                    {wire.lengthMeters}m ({wire.type.toUpperCase()})
                  </text>
                )}
              </g>
            );
          })}

          {/* Cable temporal mientras se está tendiendo */}
          {wiringStart && (
            <line
              x1={wiringStart.x}
              y1={wiringStart.y}
              x2={cursorPos.x}
              y2={cursorPos.y}
              stroke={WIRE_COLOR_MAP[activeWireType].stroke}
              strokeWidth={2}
              strokeDasharray="4,4"
              className="pointer-events-none"
            />
          )}

          {/* 4. Símbolos Eléctricos */}
          {project.symbols.map((sym) => {
            const isSelected = selectedElementType === 'symbol' && selectedElementId === sym.id;
            const isDragging = draggingSymbolId === sym.id;
            const isLampActive = sym.state?.isOn;

            return (
              <g
                key={sym.id}
                transform={`translate(${sym.x}, ${sym.y}) rotate(${sym.rotation})`}
                onMouseDown={(e) => {
                  if (activeTool === 'select' && !isPanMode) {
                    e.stopPropagation();
                    onSelectElement('symbol', sym.id);
                    setDraggingSymbolId(sym.id);
                    const coords = getSVGCoordinates(e.clientX, e.clientY);
                    setDragOffset({ x: coords.x - sym.x, y: coords.y - sym.y });
                  }
                }}
                onTouchStart={(e) => {
                  if (activeTool === 'select' && !isPanMode && e.touches.length === 1) {
                    e.stopPropagation();
                    onSelectElement('symbol', sym.id);
                    setDraggingSymbolId(sym.id);
                    const touch = e.touches[0];
                    const coords = getSVGCoordinates(touch.clientX, touch.clientY);
                    setDragOffset({ x: coords.x - sym.x, y: coords.y - sym.y });
                  }
                }}
                className={`${activeTool === 'select' && !isPanMode ? 'cursor-grab' : 'cursor-pointer'}`}
              >
                {/* Resplandor si es lámpara encendida */}
                {isLampActive && (
                  <circle
                    cx={0}
                    cy={0}
                    r={36}
                    fill="rgba(245, 158, 11, 0.25)"
                    filter="url(#lamp-glow)"
                    className="pointer-events-none"
                  />
                )}

                {/* Renderizado específico según el tipo de símbolo */}
                {renderSymbolSVG(sym, isSelected, isLampActive)}

                {/* Etiqueta técnica debajo del símbolo */}
                <text
                  x={0}
                  y={24}
                  textAnchor="middle"
                  fill={isSelected ? '#f59e0b' : '#cbd5e1'}
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="'JetBrains Mono', monospace"
                  className="pointer-events-none"
                >
                  {sym.label}
                </text>

                {/* Terminales de conexión */}
                {sym.terminals.map((term) => {
                  const termAbsX = sym.x + term.relX;
                  const termAbsY = sym.y + term.relY;
                  const isStartingTerm =
                    wiringStart?.componentId === sym.id && wiringStart.terminalId === term.id;

                  return (
                    <g
                      key={term.id}
                      transform={`translate(${term.relX}, ${term.relY})`}
                      onClick={(e) => handleTerminalClick(e, sym, term.id, termAbsX, termAbsY)}
                      onTouchEnd={(e) => {
                        e.stopPropagation();
                        handleTerminalClick(e as any, sym, term.id, termAbsX, termAbsY);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Área de clic ampliada para dedos en pantallas táctiles (36px diámetro) */}
                      <circle cx={0} cy={0} r={18} fill="transparent" />

                      {/* Borne físico */}
                      <circle
                        cx={0}
                        cy={0}
                        r={isStartingTerm ? 5 : 3.5}
                        fill={isStartingTerm ? '#f59e0b' : '#0f172a'}
                        stroke={isStartingTerm ? '#ffffff' : WIRE_COLOR_MAP[term.type]?.stroke || '#94a3b8'}
                        strokeWidth={1.5}
                        className="transition-transform group-hover:scale-125"
                      />

                      {/* Tooltip con nombre del terminal al pasar mouse */}
                      <title>{`${term.name} (${term.id})`}</title>
                    </g>
                  );
                })}

                {/* Botón interactivo directo sobre interruptores para accionarlos con 1 toque o clic */}
                {sym.category === 'comando' && (
                  <g
                    transform="translate(18, -18)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSwitch(sym.id);
                    }}
                    onTouchEnd={(e) => {
                      e.stopPropagation();
                      onToggleSwitch(sym.id);
                    }}
                    className="cursor-pointer hover:scale-110 active:scale-125 transition-transform"
                  >
                    <circle cx={0} cy={0} r={15} fill="transparent" />
                    <circle
                      cx={0}
                      cy={0}
                      r={9}
                      fill={sym.state?.isOpen ? '#334155' : '#10b981'}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                    />
                    <Power className="w-2.5 h-2.5 -translate-x-[5px] -translate-y-[5px] text-white stroke-[2.5]" />
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

/**
 * Renderiza el dibujo técnico vectorial de cada símbolo eléctrico normalizado
 */
function renderSymbolSVG(
  sym: ElectricalSymbol,
  isSelected: boolean,
  isLampActive?: boolean
): React.ReactNode {
  const strokeColor = isSelected ? '#f59e0b' : '#e2e8f0';

  switch (sym.type) {
    case 'luminaria':
      return (
        <g>
          <circle
            cx={0}
            cy={0}
            r={14}
            fill={isLampActive ? '#fef08a' : '#1e293b'}
            stroke={isLampActive ? '#eab308' : strokeColor}
            strokeWidth={2}
          />
          <line
            x1={-10}
            y1={-10}
            x2={10}
            y2={10}
            stroke={isLampActive ? '#ca8a04' : strokeColor}
            strokeWidth={1.5}
          />
          <line
            x1={-10}
            y1={10}
            x2={10}
            y2={-10}
            stroke={isLampActive ? '#ca8a04' : strokeColor}
            strokeWidth={1.5}
          />
        </g>
      );

    case 'interruptor_simple':
      // Tecla unipolar: círculo con aspa de contacto
      const isOpen = sym.state?.isOpen !== false;
      return (
        <g>
          <circle cx={0} cy={0} r={12} fill="#0f172a" stroke={strokeColor} strokeWidth={2} />
          {/* Cuchilla de contacto móvil */}
          <line
            x1={-8}
            y1={0}
            x2={isOpen ? 6 : 8}
            y2={isOpen ? -8 : 0}
            stroke={isOpen ? '#94a3b8' : '#10b981'}
            strokeWidth={2}
          />
          <circle cx={-8} cy={0} r={2} fill={strokeColor} />
          <circle cx={8} cy={0} r={2} fill={strokeColor} />
        </g>
      );

    case 'conmutado':
      // Llave de combinación: círculo con dos bornes de puente
      return (
        <g>
          <circle cx={0} cy={0} r={13} fill="#0f172a" stroke={strokeColor} strokeWidth={2} />
          <line
            x1={-8}
            y1={0}
            x2={8}
            y2={sym.state?.switchPosition === 2 ? 6 : -6}
            stroke="#a855f7"
            strokeWidth={2}
          />
          <circle cx={-8} cy={0} r={2} fill={strokeColor} />
          <circle cx={8} cy={-6} r={2} fill="#a855f7" />
          <circle cx={8} cy={6} r={2} fill="#a855f7" />
        </g>
      );

    case 'tomacorriente':
      // Símbolo IRAM tomacorriente (semicírculo con espigas)
      return (
        <g>
          <path
            d="M -12 0 A 12 12 0 0 1 12 0 Z"
            fill={sym.state?.isEnergized ? '#0284c7' : '#1e293b'}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line x1={-12} y1={0} x2={12} y2={0} stroke={strokeColor} strokeWidth={2} />
          {/* 3 patitas de espiga */}
          <line x1={-5} y1={-4} x2={-2} y2={-8} stroke="#ffffff" strokeWidth={1.5} />
          <line x1={5} y1={-4} x2={2} y2={-8} stroke="#ffffff" strokeWidth={1.5} />
          <line x1={0} y1={-2} x2={0} y2={-6} stroke="#10b981" strokeWidth={1.5} />
        </g>
      );

    case 'toma_especial':
      // Tomacorriente 20A reforzado (semicírculo relleno con doble aro)
      return (
        <g>
          <path
            d="M -14 0 A 14 14 0 0 1 14 0 Z"
            fill="#d97706"
            stroke={strokeColor}
            strokeWidth={2}
          />
          <path
            d="M -9 0 A 9 9 0 0 1 9 0 Z"
            fill="#0f172a"
            stroke="#ffffff"
            strokeWidth={1}
          />
          <line x1={-14} y1={0} x2={14} y2={0} stroke={strokeColor} strokeWidth={2} />
        </g>
      );

    case 'tablero':
      // Gabinete de tablero rectangular con riel
      return (
        <g>
          <rect
            x={-18}
            y={-14}
            width={36}
            height={28}
            fill="#1e293b"
            stroke={strokeColor}
            strokeWidth={2}
            rx={2}
          />
          <line x1={-18} y1={0} x2={18} y2={0} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3,2" />
          <line x1={0} y1={-14} x2={0} y2={14} stroke="#475569" strokeWidth={1} />
        </g>
      );

    case 'fuente_ac':
      // Acometida Red (círculo con onda senoidal)
      return (
        <g>
          <circle cx={0} cy={0} r={14} fill="#0f172a" stroke="#eab308" strokeWidth={2} />
          <path
            d="M -7 0 Q -3.5 -6 0 0 Q 3.5 6 7 0"
            fill="none"
            stroke="#eab308"
            strokeWidth={2}
          />
        </g>
      );

    case 'termica':
      // Térmica: rectángulo bipolar con símbolo de disparo térmico y magnético
      return (
        <g>
          <rect
            x={-14}
            y={-14}
            width={28}
            height={28}
            fill="#1e293b"
            stroke={strokeColor}
            strokeWidth={2}
            rx={3}
          />
          <line x1={-8} y1={-8} x2={8} y2={8} stroke="#ef4444" strokeWidth={1.5} />
          <rect x={-4} y={-4} width={8} height={8} fill="#ef4444" />
        </g>
      );

    case 'diferencial':
      // Disyuntor diferencial con botón de prueba
      return (
        <g>
          <rect
            x={-14}
            y={-14}
            width={28}
            height={28}
            fill="#1e293b"
            stroke="#38bdf8"
            strokeWidth={2}
            rx={3}
          />
          <text x={0} y={3} textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
            ΔI
          </text>
        </g>
      );

    case 'caja_paso':
      // Caja octogonal o cuadrada de paso
      return (
        <g>
          <rect
            x={-12}
            y={-12}
            width={24}
            height={24}
            fill="#0f172a"
            stroke={strokeColor}
            strokeWidth={2}
          />
          <circle cx={0} cy={0} r={3} fill="#94a3b8" />
        </g>
      );

    case 'puesta_tierra':
      // Símbolo normalizado de jabalina a tierra
      return (
        <g>
          <line x1={0} y1={-12} x2={0} y2={2} stroke="#16a34a" strokeWidth={2.5} />
          <line x1={-10} y1={2} x2={10} y2={2} stroke="#16a34a" strokeWidth={2.5} />
          <line x1={-6} y1={6} x2={6} y2={6} stroke="#16a34a" strokeWidth={2} />
          <line x1={-2} y1={10} x2={2} y2={10} stroke="#16a34a" strokeWidth={1.5} />
        </g>
      );

    default:
      return (
        <circle cx={0} cy={0} r={12} fill="#1e293b" stroke={strokeColor} strokeWidth={2} />
      );
  }
}
