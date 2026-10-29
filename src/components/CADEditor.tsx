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
  Eye,
  BookOpen,
  Layers,
  Box,
  Tag,
  AlertOctagon,
  AlertTriangle,
  Crosshair,
  GitBranch,
  FlipHorizontal,
  Sliders,
} from 'lucide-react';
import {
  Project,
  ElectricalSymbol,
  Wire,
  Room,
  ArchElement,
  ConductorType,
  SimulationState,
  FaultDetail,
} from '../types/electra';
import { CADTool } from './Toolbar';
import { createSymbolFromTemplate, WIRE_COLOR_MAP, getComponentLabelInfo } from '../services/symbolCatalog';
import { RealisticCADSymbolSVG, CADViewMode } from './cad/RealisticCADSymbolSVG';
import { Room3DViewer } from './cad/Room3DViewer';
import { ComponentLearningModal } from './ComponentLearningModal';
import { PhysicalComponentCard } from './PhysicalComponentCard';
import { ConductorSpecificationModal } from './ConductorSpecificationModal';
import { calculateOrthogonalPath, pointsToSVGPath } from '../services/orthogonalRouting';

interface CADEditorProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
  activeTool: CADTool;
  selectedTemplateType: string | null;
  selectedCircuitId: string;
  activeWireType: ConductorType;
  selectedElementId: string | null;
  selectedElementType: 'symbol' | 'wire' | 'room' | 'wall' | 'door' | 'window' | null;
  onSelectElement: (type: 'symbol' | 'wire' | 'room' | 'wall' | 'door' | 'window' | null, id: string | null) => void;
  onToggleSwitch: (symbolId: string) => void;
  isSimulating: boolean;
  simState?: SimulationState;
  onOpenProperties?: () => void;
  onResetTool?: () => void;
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
  simState,
  onOpenProperties,
  onResetTool,
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
  const initialMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 40, y: 30 });
  const [isTwoFingerGesture, setIsTwoFingerGesture] = useState<boolean>(false);

  // Modos de Visualización Realista y 3D
  const [viewMode, setViewMode] = useState<CADViewMode>('realista');
  const [is3DView, setIs3DView] = useState<boolean>(false);
  const [learningType, setLearningType] = useState<string | null>(null);
  // Control de tamaño y visibilidad de etiquetas permanentes
  const [labelSize, setLabelSize] = useState<'oculto' | 'pequeno' | 'mediano' | 'grande'>('mediano');

  // Modo de trazado de cables y canalizaciones (Ortogonal a 90° vs Bézier curvo)
  const [routingMode, setRoutingMode] = useState<'orthogonal' | 'bezier'>('orthogonal');
  // Modal de Ficha Técnica de Conductor
  const [isConductorModalOpen, setIsConductorModalOpen] = useState<boolean>(false);
  // Panel y zoom de localizador de fallas
  const [isFaultPanelOpen, setIsFaultPanelOpen] = useState<boolean>(false);

  // Centrar vista en coordenadas específicas (ej. foco en cortocircuito)
  const zoomToCoordinates = (x: number, y: number, targetZoom = 1.4) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setZoom(targetZoom);
    setPan({
      x: rect.width / 2 - x * targetZoom,
      y: rect.height / 2 - y * targetZoom,
    });
  };

  // Arrastre de elementos
  const [draggingSymbolId, setDraggingSymbolId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Elementos seleccionados para toolbar contextual
  const selectedSymbol = selectedElementType === 'symbol' ? project.symbols.find((s) => s.id === selectedElementId) : null;
  const selectedWire = selectedElementType === 'wire' ? project.wires.find((w) => w.id === selectedElementId) : null;
  const selectedArch = (selectedElementType === 'wall' || selectedElementType === 'door' || selectedElementType === 'window')
    ? project.architecturalElements.find((a) => a.id === selectedElementId)
    : null;
  const selectedRoom = selectedElementType === 'room' ? project.rooms.find((r) => r.id === selectedElementId) : null;

  // Arrastre y movimiento de habitaciones completas con su contenido
  const [draggingRoomId, setDraggingRoomId] = useState<string | null>(null);
  const [roomDragStart, setRoomDragStart] = useState<{
    cursorX: number;
    cursorY: number;
    roomX: number;
    roomY: number;
    internalSymbols: { id: string; initX: number; initY: number }[];
    boundaryWalls: { id: string; initX1: number; initY1: number; initX2: number; initY2: number }[];
  } | null>(null);

  // Redimensionamiento de habitaciones desde esquinas
  const [resizingRoomCorner, setResizingRoomCorner] = useState<'tl' | 'tr' | 'bl' | 'br' | null>(null);
  const [roomResizeStart, setRoomResizeStart] = useState<{
    cursorX: number;
    cursorY: number;
    roomX: number;
    roomY: number;
    roomWidth: number;
    roomHeight: number;
  } | null>(null);

  // Arrastre independiente de elementos arquitectónicos (puertas, ventanas, muros)
  const [draggingArchId, setDraggingArchId] = useState<string | null>(null);
  const [archDragStart, setArchDragStart] = useState<{
    cursorX: number;
    cursorY: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);

  // Modal de confirmación para borrado de habitación con componentes interiores
  const [roomDeleteModalData, setRoomDeleteModalData] = useState<{
    roomId: string;
    roomName: string;
    symbolCount: number;
    symbolIds: string[];
  } | null>(null);

  // Estado de aviso de falla descartado/cerrado por el usuario con (X) o Esc
  const [isFaultBannerDismissed, setIsFaultBannerDismissed] = useState<boolean>(false);

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
    } else if (draggingRoomId && roomDragStart) {
      const rawDx = coords.x - roomDragStart.cursorX;
      const rawDy = coords.y - roomDragStart.cursorY;
      const dx = snapToGrid ? Math.round(rawDx / gridSize) * gridSize : rawDx;
      const dy = snapToGrid ? Math.round(rawDy / gridSize) * gridSize : rawDy;

      onUpdateProject((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) =>
          r.id === draggingRoomId
            ? { ...r, x: roomDragStart.roomX + dx, y: roomDragStart.roomY + dy }
            : r
        ),
        symbols: prev.symbols.map((s) => {
          const match = roomDragStart.internalSymbols.find((item) => item.id === s.id);
          return match ? { ...s, x: match.initX + dx, y: match.initY + dy } : s;
        }),
        architecturalElements: prev.architecturalElements.map((a) => {
          const match = roomDragStart.boundaryWalls.find((item) => item.id === a.id);
          return match
            ? { ...a, x1: match.initX1 + dx, y1: match.initY1 + dy, x2: match.initX2 + dx, y2: match.initY2 + dy }
            : a;
        }),
      }));
    } else if (resizingRoomCorner && roomResizeStart && selectedElementId) {
      const dx = coords.x - roomResizeStart.cursorX;
      const dy = coords.y - roomResizeStart.cursorY;

      onUpdateProject((prev) => ({
        ...prev,
        rooms: prev.rooms.map((r) => {
          if (r.id !== selectedElementId) return r;
          let newX = roomResizeStart.roomX;
          let newY = roomResizeStart.roomY;
          let newW = roomResizeStart.roomWidth;
          let newH = roomResizeStart.roomHeight;

          if (resizingRoomCorner === 'br') {
            newW = Math.max(80, roomResizeStart.roomWidth + dx);
            newH = Math.max(80, roomResizeStart.roomHeight + dy);
          } else if (resizingRoomCorner === 'bl') {
            const targetW = Math.max(80, roomResizeStart.roomWidth - dx);
            newX = roomResizeStart.roomX + (roomResizeStart.roomWidth - targetW);
            newW = targetW;
            newH = Math.max(80, roomResizeStart.roomHeight + dy);
          } else if (resizingRoomCorner === 'tr') {
            newW = Math.max(80, roomResizeStart.roomWidth + dx);
            const targetH = Math.max(80, roomResizeStart.roomHeight - dy);
            newY = roomResizeStart.roomY + (roomResizeStart.roomHeight - targetH);
            newH = targetH;
          } else if (resizingRoomCorner === 'tl') {
            const targetW = Math.max(80, roomResizeStart.roomWidth - dx);
            const targetH = Math.max(80, roomResizeStart.roomHeight - dy);
            newX = roomResizeStart.roomX + (roomResizeStart.roomWidth - targetW);
            newY = roomResizeStart.roomY + (roomResizeStart.roomHeight - targetH);
            newW = targetW;
            newH = targetH;
          }

          if (snapToGrid) {
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
            newW = Math.round(newW / gridSize) * gridSize;
            newH = Math.round(newH / gridSize) * gridSize;
          }

          return { ...r, x: newX, y: newY, width: newW, height: newH };
        }),
      }));
    } else if (draggingArchId && archDragStart) {
      const rawDx = coords.x - archDragStart.cursorX;
      const rawDy = coords.y - archDragStart.cursorY;
      const dx = snapToGrid ? Math.round(rawDx / gridSize) * gridSize : rawDx;
      const dy = snapToGrid ? Math.round(rawDy / gridSize) * gridSize : rawDy;

      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: prev.architecturalElements.map((a) =>
          a.id === draggingArchId
            ? {
                ...a,
                x1: archDragStart.x1 + dx,
                y1: archDragStart.y1 + dy,
                x2: archDragStart.x2 + dx,
                y2: archDragStart.y2 + dy,
              }
            : a
        ),
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingSymbolId(null);
    setDraggingRoomId(null);
    setRoomDragStart(null);
    setResizingRoomCorner(null);
    setRoomResizeStart(null);
    setDraggingArchId(null);
    setArchDragStart(null);
  };

  // Manejo de eventos Touch avanzados (móvil y tablet):
  // Soporta pellizco para zoom (Pinch to Zoom) y arrastre con dos dedos (Two-Finger Pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length >= 2) {
      // Prioridad máxima a la navegación con dos dedos: cancelar arrastre de símbolos
      setDraggingSymbolId(null);
      setIsPanning(false);
      setIsTwoFingerGesture(true);

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      initialPinchDistRef.current = Math.max(dist, 10);
      initialZoomRef.current = zoom;
      initialMidpointRef.current = { x: midX, y: midY };
      initialPanRef.current = { ...pan };
    } else if (e.touches.length === 1) {
      setIsTwoFingerGesture(false);
      initialPinchDistRef.current = null;
      initialMidpointRef.current = null;

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
    if (e.touches.length >= 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      // Si por alguna razón no estaban inicializados los refs de dos dedos
      if (initialPinchDistRef.current === null || initialMidpointRef.current === null) {
        initialPinchDistRef.current = Math.max(dist, 10);
        initialZoomRef.current = zoom;
        initialMidpointRef.current = { x: midX, y: midY };
        initialPanRef.current = { ...pan };
        return;
      }

      // 1. Zoom por pellizco (Pinch to Zoom)
      const ratio = dist / initialPinchDistRef.current;
      const nextZoom = Math.min(3.0, Math.max(0.35, Number((initialZoomRef.current * ratio).toFixed(2))));

      // 2. Paneo con dos dedos (Two-Finger Pan) y anclaje al punto focal medio
      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const startMidRelX = initialMidpointRef.current.x - rect.left;
      const startMidRelY = initialMidpointRef.current.y - rect.top;
      const currMidRelX = midX - rect.left;
      const currMidRelY = midY - rect.top;

      // Coordenada en espacio SVG del punto medio inicial
      const worldX = (startMidRelX - initialPanRef.current.x) / initialZoomRef.current;
      const worldY = (startMidRelY - initialPanRef.current.y) / initialZoomRef.current;

      // Nuevo pan para que el punto en espacio SVG siga bajo el centro táctil actual
      const newPanX = currMidRelX - worldX * nextZoom;
      const newPanY = currMidRelY - worldY * nextZoom;

      setZoom(nextZoom);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else if (e.touches.length === 1 && !isTwoFingerGesture) {
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
      } else if (draggingRoomId && roomDragStart) {
        const rawDx = coords.x - roomDragStart.cursorX;
        const rawDy = coords.y - roomDragStart.cursorY;
        const dx = snapToGrid ? Math.round(rawDx / gridSize) * gridSize : rawDx;
        const dy = snapToGrid ? Math.round(rawDy / gridSize) * gridSize : rawDy;

        onUpdateProject((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.id === draggingRoomId
              ? { ...r, x: roomDragStart.roomX + dx, y: roomDragStart.roomY + dy }
              : r
          ),
          symbols: prev.symbols.map((s) => {
            const match = roomDragStart.internalSymbols.find((item) => item.id === s.id);
            return match ? { ...s, x: match.initX + dx, y: match.initY + dy } : s;
          }),
          architecturalElements: prev.architecturalElements.map((a) => {
            const match = roomDragStart.boundaryWalls.find((item) => item.id === a.id);
            return match
              ? { ...a, x1: match.initX1 + dx, y1: match.initY1 + dy, x2: match.initX2 + dx, y2: match.initY2 + dy }
              : a;
          }),
        }));
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Transición suave si se levanta 1 dedo y queda otro
      initialPinchDistRef.current = null;
      initialMidpointRef.current = null;
      setIsTwoFingerGesture(false);

      const remainingTouch = e.touches[0];
      touchStartRef.current = { x: remainingTouch.clientX, y: remainingTouch.clientY };
      if (isPanMode) {
        setStartPan({ x: remainingTouch.clientX - pan.x, y: remainingTouch.clientY - pan.y });
      } else {
        setIsPanning(false);
      }
    } else if (e.touches.length === 0) {
      // Fin del contacto táctil
      touchStartRef.current = null;
      initialPinchDistRef.current = null;
      initialMidpointRef.current = null;
      setIsTwoFingerGesture(false);
      setIsPanning(false);
      setDraggingSymbolId(null);
      setDraggingRoomId(null);
      setRoomDragStart(null);
      setResizingRoomCorner(null);
      setRoomResizeStart(null);
    }
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

  // Eliminar elemento seleccionado con confirmación si afecta conexiones
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;

    if (selectedElementType === 'symbol') {
      const connectedWires = project.wires.filter(
        (w) => w.fromComponentId === selectedElementId || w.toComponentId === selectedElementId
      );
      if (connectedWires.length > 0) {
        if (!confirm(`Este componente tiene ${connectedWires.length} cable(s) conectado(s). ¿Deseas eliminarlo junto con sus conexiones?`)) {
          return;
        }
      }
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
      const room = project.rooms.find((r) => r.id === selectedElementId);
      if (room) {
        const internalSymbols = project.symbols.filter(
          (s) => s.x >= room.x && s.x <= room.x + room.width && s.y >= room.y && s.y <= room.y + room.height
        );
        if (internalSymbols.length > 0) {
          setRoomDeleteModalData({
            roomId: room.id,
            roomName: room.name,
            symbolCount: internalSymbols.length,
            symbolIds: internalSymbols.map((s) => s.id),
          });
          return;
        }
      }
      onUpdateProject((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((r) => r.id !== selectedElementId),
      }));
      onSelectElement(null, null);
    } else if (selectedElementType === 'wall' || selectedElementType === 'door' || selectedElementType === 'window') {
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: prev.architecturalElements.filter((a) => a.id !== selectedElementId),
      }));
      onSelectElement(null, null);
    }
  };

  // Rotar símbolo o abertura 90°
  const handleRotateSelected = () => {
    if (selectedElementType === 'symbol' && selectedElementId) {
      onUpdateProject((prev) => ({
        ...prev,
        symbols: prev.symbols.map((s) =>
          s.id === selectedElementId ? { ...s, rotation: (s.rotation + 90) % 360 } : s
        ),
      }));
    } else if ((selectedElementType === 'door' || selectedElementType === 'window') && selectedElementId) {
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: prev.architecturalElements.map((a) => {
          if (a.id !== selectedElementId) return a;
          const currentRot = a.rotation || 0;
          const newRot = (currentRot + 90) % 360;
          const dx = a.x2 - a.x1;
          const dy = a.y2 - a.y1;
          const len = Math.hypot(dx, dy) || 40;
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

  // Invertir horizontalmente o verticalmente
  const handleFlipSelected = (axis: 'H' | 'V') => {
    if (selectedElementType === 'symbol' && selectedElementId) {
      onUpdateProject((prev) => ({
        ...prev,
        symbols: prev.symbols.map((s) =>
          s.id === selectedElementId
            ? { ...s, flipH: axis === 'H' ? !s.flipH : s.flipH, flipV: axis === 'V' ? !s.flipV : s.flipV }
            : s
        ),
      }));
    } else if ((selectedElementType === 'door' || selectedElementType === 'window') && selectedElementId) {
      onUpdateProject((prev) => ({
        ...prev,
        architecturalElements: prev.architecturalElements.map((a) =>
          a.id === selectedElementId
            ? { ...a, flipH: axis === 'H' ? !a.flipH : a.flipH, flipV: axis === 'V' ? !a.flipV : a.flipV }
            : a
        ),
      }));
    }
  };

  // Tecla Supr para borrar y tecla Escape para deseleccionar y cerrar avisos
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFaultBannerDismissed(true);
        setIsConductorModalOpen(false);
        setWiringStart(null);
        setRoomDeleteModalData(null);
        onSelectElement(null, null);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea') {
          handleDeleteSelected();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Prevenir que el navegador móvil (Android Chrome / Safari) intercepte los gestos con zoom o scroll nativo de la página
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeTouchMove = (e: TouchEvent) => {
      // Si hay 2 o más dedos en la pantalla o está activo el modo mover, prevenir el scroll/zoom del navegador
      if (e.touches.length >= 2 || isPanMode) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => {
      container.removeEventListener('touchmove', handleNativeTouchMove);
    };
  }, [isPanMode]);

  // Soporte de rueda de ratón y trackpad (Zoom focal con Ctrl / Paneo normal)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const nextZoom = Math.min(3.0, Math.max(0.35, Number((zoom * zoomFactor).toFixed(2))));

      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const mouseRelX = e.clientX - rect.left;
      const mouseRelY = e.clientY - rect.top;
      const worldX = (mouseRelX - pan.x) / zoom;
      const worldY = (mouseRelY - pan.y) / zoom;

      const newPanX = mouseRelX - worldX * nextZoom;
      const newPanY = mouseRelY - worldY * nextZoom;

      setZoom(nextZoom);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else {
      setPan((prev) => ({
        x: Math.round(prev.x - e.deltaX),
        y: Math.round(prev.y - e.deltaY),
      }));
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'none' }}
      className="relative flex-1 h-full w-full bg-[#F8FAFC] dark:bg-[#0B1218] overflow-hidden select-none cursor-crosshair touch-none transition-colors duration-150"
    >
      {/* Selector de Modos de Vista Realista / Conexiones / Esquemática y Estudio 3D */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-20 flex flex-wrap items-center gap-1.5 max-w-[85vw] sm:max-w-none">
        {/* Alternador 2D / 3D */}
        <div className="flex items-center bg-white/95 dark:bg-[#142028]/95 border border-[#DCE4E8] dark:border-[#243542] rounded-lg p-0.5 shadow-xl backdrop-blur-md">
          <button
            onClick={() => setIs3DView(false)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              !is3DView
                ? 'bg-[#167D78] text-white font-bold shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Plano 2D</span>
          </button>
          <button
            onClick={() => setIs3DView(true)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              is3DView
                ? 'bg-[#0F5E5A] text-white font-bold shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Estudio 3D</span>
          </button>
        </div>

        {/* Selector de los 3 Modos de Visualización Requeridos: REALISTA / SÍMBOLO / APRENDER */}
        {!is3DView && (
          <div className="flex items-center bg-white/95 dark:bg-[#142028]/95 border border-[#DCE4E8] dark:border-[#243542] rounded-lg p-0.5 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setViewMode('realista')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'realista'
                  ? 'bg-[#167D78] text-white font-bold shadow-xs'
                  : 'text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Modo Realista: Muestra el aspecto físico real detallado"
            >
              REALISTA
            </button>
            <button
              onClick={() => setViewMode('simbolo')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'simbolo' || viewMode === 'esquematica'
                  ? 'bg-[#0284C7] text-white font-bold shadow-xs'
                  : 'text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Modo Símbolo: Muestra el símbolo unifilar/multifilar normalizado IRAM"
            >
              SÍMBOLO
            </button>
            <button
              onClick={() => setViewMode('aprender')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'aprender'
                  ? 'bg-[#059669] text-white font-bold shadow-xs'
                  : 'text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
              title="Modo Aprender: Muestra modelo físico y símbolo esquemático conectados lado a lado"
            >
              APRENDER
            </button>
          </div>
        )}

        {/* Control de Tamaño y Visibilidad de Etiquetas Permanentes */}
        {!is3DView && (
          <div className="flex items-center bg-white/95 dark:bg-[#142028]/95 border border-[#DCE4E8] dark:border-[#243542] rounded-lg p-0.5 shadow-xl backdrop-blur-md">
            <button
              onClick={() => {
                const nextSize =
                  labelSize === 'mediano'
                    ? 'grande'
                    : labelSize === 'grande'
                    ? 'oculto'
                    : labelSize === 'oculto'
                    ? 'pequeno'
                    : 'mediano';
                setLabelSize(nextSize);
              }}
              className="px-2 py-1 text-xs font-medium rounded-md text-[#18313B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all flex items-center gap-1.5"
              title="Cambiar tamaño o visibilidad de etiquetas encima de cada componente"
            >
              <Tag className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
              <span className="capitalize text-xs">
                Etiquetas: <strong className="text-[#167D78] dark:text-[#2DD4BF]">{labelSize}</strong>
              </span>
            </button>
          </div>
        )}

        {/* Control de Modo de Trazado (Ortogonal a 90° vs Bézier Curvo) */}
        {!is3DView && (
          <div className="flex items-center bg-white/95 dark:bg-[#142028]/95 border border-[#DCE4E8] dark:border-[#243542] rounded-lg p-0.5 shadow-xl backdrop-blur-md">
            <button
              onClick={() => setRoutingMode((m) => (m === 'orthogonal' ? 'bezier' : 'orthogonal'))}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                routingMode === 'orthogonal'
                  ? 'bg-[#167D78]/15 text-[#167D78] dark:text-[#2DD4BF] border border-[#167D78]/30'
                  : 'text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white'
              }`}
              title="Alternar entre trazado ortogonal de canalizaciones (Manhattan 90°) y trazo curvo"
            >
              <GitBranch className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
              <span className="hidden sm:inline">Trazado:</span>
              <strong className="text-[#167D78] dark:text-[#2DD4BF] capitalize">{routingMode === 'orthogonal' ? 'Ortogonal' : 'Curvo'}</strong>
            </button>
          </div>
        )}

        {/* Botón de Ficha de Conductor cuando hay un cable seleccionado */}
        {!is3DView && selectedElementType === 'wire' && selectedElementId && (
          <button
            onClick={() => setIsConductorModalOpen(true)}
            className="px-2.5 py-1 bg-[#167D78] text-white hover:bg-[#0F5E5A] font-bold text-xs rounded-lg shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-all"
            title="Abrir ficha técnica de dimensionamiento y normas AEA del conductor seleccionado"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Ficha Conductor</span>
          </button>
        )}

        {/* Botón de Ficha Educativa con Normas */}
        <button
          onClick={() => {
            const selectedSym = project.symbols.find((s) => s.id === selectedElementId);
            setLearningType(selectedSym?.type || 'luminaria');
          }}
          className="px-2.5 py-1 bg-white/95 dark:bg-[#142028]/95 hover:bg-[#F8FAFC] dark:hover:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] text-[#167D78] dark:text-[#2DD4BF] text-xs font-semibold rounded-lg shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-all"
          title="Ver enciclopedia técnica de normas y especificaciones"
        >
          <BookOpen className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
          <span className="hidden sm:inline">Enciclopedia</span>
        </button>
      </div>

      {/* Floating Card: Localizador de Fallas y Cortocircuitos (cuando se detectan fallas activas) */}
      {!is3DView && simState?.activeFaults && simState.activeFaults.length > 0 && !isFaultBannerDismissed && (
        <div className="absolute top-12 left-2 sm:left-3 z-30 max-w-sm sm:max-w-md w-[calc(100%-1rem)] sm:w-auto bg-slate-950/95 border-2 border-red-500 rounded-2xl shadow-2xl p-3 backdrop-blur-md space-y-2 text-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-red-900/60 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h4 className="font-black text-red-300 text-xs sm:text-sm tracking-wide">
                ¡LOCALIZADOR DE FALLAS ({simState.activeFaults.length})!
              </h4>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsFaultPanelOpen(!isFaultPanelOpen)}
                className="text-[11px] text-red-400 hover:text-red-200 font-semibold px-2 py-0.5 bg-red-950/60 rounded border border-red-800"
              >
                {isFaultPanelOpen ? 'Ocultar' : 'Ver detalle'}
              </button>
              <button
                onClick={() => setIsFaultBannerDismissed(true)}
                className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                title="Cerrar aviso de falla (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Primera falla con botón de Centrado Automático */}
          {(() => {
            const mainFault = simState.activeFaults[0];
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white text-[11px] truncate">{mainFault.title}</span>
                  <button
                    onClick={() => zoomToCoordinates(mainFault.coordinates.x, mainFault.coordinates.y, 1.4)}
                    className="px-2 py-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-[11px] rounded-lg shadow-md flex items-center gap-1 shrink-0 transition-transform active:scale-95"
                    title="Centrar y acercar el plano al lugar exacto de la falla"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Centrar en Falla</span>
                  </button>
                </div>
                <p className="text-[11px] text-red-200 leading-tight line-clamp-2">
                  {mainFault.detectionReason}
                </p>

                {mainFault.trippedProtection && (
                  <div className="p-1.5 bg-red-950/80 rounded border border-red-700/60 text-[10px] text-red-300">
                    <strong className="text-white">Protección que actúa: </strong>
                    {mainFault.trippedProtection.statusText}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Lista expandida de fallas si se abre */}
          {isFaultPanelOpen && (
            <div className="space-y-2 pt-2 border-t border-slate-800 max-h-48 overflow-y-auto">
              {simState.activeFaults.slice(1).map((f) => (
                <div key={f.id} className="p-2 bg-slate-900 rounded-lg border border-red-800/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-white block truncate">{f.title}</span>
                    <span className="text-[10px] text-slate-400 truncate block">{f.faultLoopDescription}</span>
                  </div>
                  <button
                    onClick={() => zoomToCoordinates(f.coordinates.x, f.coordinates.y, 1.4)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-red-300 rounded shrink-0"
                    title="Centrar en esta falla"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botón flotante accesible para volver a abrir el aviso de fallas si fue cerrado */}
      {!is3DView && simState?.activeFaults && simState.activeFaults.length > 0 && isFaultBannerDismissed && (
        <button
          onClick={() => setIsFaultBannerDismissed(false)}
          className="absolute top-12 left-2 sm:left-3 z-30 flex items-center gap-1.5 px-3 py-1.5 bg-red-950/90 hover:bg-red-900 border border-red-600 text-red-200 rounded-xl shadow-xl backdrop-blur-md text-xs font-bold transition-all animate-pulse"
          title="Ver detalle del cortocircuito o falla detectada"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{simState.activeFaults.length} Falla(s) Detectada(s) (Ver)</span>
        </button>
      )}

      {/* Si está activo el Visor 3D, mostramos el canvas Three.js interactivo */}
      {is3DView ? (
        <Room3DViewer
          project={project}
          simState={
            simState || {
              isRunning: true,
              isPaused: false,
              diagnostics: [],
              activeLamps: new Set(project.symbols.filter((s) => s.state?.isOn).map((s) => s.id)),
              energizedComponents: new Set(),
              energizedWires: new Set(),
              totalSimulatedCurrentAmps: 0,
              hasShortCircuit: false,
            }
          }
          onToggleSwitch={onToggleSwitch}
          onSelectSymbol={(id) => onSelectElement('symbol', id)}
          onOpenLearningModal={(type) => setLearningType(type)}
        />
      ) : (
        <>
          {/* 1. Barra flotante de controles CAD para Escritorio y Tablet (sm y superior) */}
          <div className="hidden sm:flex absolute top-3 right-3 z-20 items-center gap-1 bg-white/95 dark:bg-[#142028]/95 border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-[#F1F5F9] p-1 rounded-lg shadow-lg backdrop-blur-md text-xs">
            <button
              onClick={() => setIsPanMode(!isPanMode)}
              title={isPanMode ? 'Desactivar modo mover (volver a edición)' : 'Activar modo mover plano (Pan)'}
              className={`p-1.5 rounded transition-colors ${
                isPanMode ? 'bg-[#167D78] text-white font-bold' : 'text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Hand className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-[#DCE4E8] dark:bg-[#243542] mx-0.5" />

            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              title="Acercar vista (Zoom +)"
              className="p-1.5 text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-slate-400 px-1 font-semibold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              title="Alejar vista (Zoom -)"
              className="p-1.5 text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoom(1.0);
                setPan({ x: 40, y: 30 });
              }}
              title="Centrar y ajustar plano"
              className="p-1.5 text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-[#DCE4E8] dark:bg-[#243542] mx-0.5" />

            <button
              onClick={() => setShowGrid(!showGrid)}
              title="Activar / Desactivar cuadrícula CAD"
              className={`p-1.5 rounded transition-colors ${
                showGrid ? 'bg-[#167D78]/15 dark:bg-[#167D78]/30 text-[#167D78] dark:text-[#2DD4BF] font-semibold' : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>

            <button
              onClick={() => setSnapToGrid(!snapToGrid)}
              title="Ajuste magnético a la cuadrícula (Snap)"
              className={`p-1.5 rounded transition-colors ${
                snapToGrid ? 'bg-[#167D78]/15 dark:bg-[#167D78]/30 text-[#167D78] dark:text-[#2DD4BF] font-semibold' : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Magnet className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowDimensions(!showDimensions)}
              title="Mostrar / Ocultar cotas y medidas en metros"
              className={`p-1.5 rounded transition-colors ${
                showDimensions ? 'bg-[#167D78]/15 dark:bg-[#167D78]/30 text-[#167D78] dark:text-[#2DD4BF] font-semibold' : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Ruler className="w-4 h-4" />
            </button>

        {selectedElementId && (
          <>
            <div className="h-4 w-px bg-[#DCE4E8] dark:bg-[#243542] mx-0.5" />
            {selectedElementType === 'symbol' && (
              <button
                onClick={handleRotateSelected}
                title="Rotar símbolo 90° (R)"
                className="p-1.5 text-[#167D78] dark:text-[#2DD4BF] hover:bg-[#E8F5F5] dark:hover:bg-slate-800 rounded transition-colors"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleDeleteSelected}
              title="Eliminar elemento seleccionado (Supr)"
              className="p-1.5 text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 2. Dock Flotante Táctil para Móviles (Android / iOS en pantallas pequeñas) */}
      <div className="flex sm:hidden absolute top-2 right-2 z-20 flex-col items-end gap-1.5">
        {/* Grupo de zoom y navegación táctil con objetivos mínimos de 44px */}
        <div className="flex flex-col bg-white/95 dark:bg-[#142028]/95 border border-[#DCE4E8] dark:border-[#243542] rounded-xl shadow-xl backdrop-blur-md overflow-hidden">
          <button
            onClick={() => setIsPanMode(!isPanMode)}
            title="Alternar entre mover plano y editar"
            className={`w-11 h-11 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors border-b border-[#DCE4E8] dark:border-[#243542] ${
              isPanMode ? 'bg-[#167D78] text-white font-bold' : 'text-[#18313B] dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800'
            }`}
          >
            <Hand className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            title="Acercar vista"
            className="w-11 h-11 min-h-[44px] min-w-[44px] text-[#18313B] dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 border-b border-[#DCE4E8] dark:border-[#243542] flex items-center justify-center"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <div className="text-[10px] font-mono font-bold text-center py-1 text-[#64748B] dark:text-slate-400 border-b border-[#DCE4E8] dark:border-[#243542]">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.2))}
            title="Alejar vista"
            className="w-11 h-11 min-h-[44px] min-w-[44px] text-[#18313B] dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 border-b border-[#DCE4E8] dark:border-[#243542] flex items-center justify-center"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 40, y: 30 });
            }}
            title="Centrar plano"
            className="w-11 h-11 min-h-[44px] min-w-[44px] text-[#18313B] dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 flex items-center justify-center"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 3. Barra Contextual Flotante (Contextual Toolbar) al seleccionar cualquier elemento */}
      {selectedElementId && (
        <div
          role="toolbar"
          aria-label="Acciones del elemento seleccionado"
          className="absolute bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-35 max-w-[94vw] bg-white/95 dark:bg-[#142028]/95 border border-[#DCE4E8] dark:border-[#243542] rounded-2xl shadow-2xl backdrop-blur-md px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none animate-fade-in"
        >
          {/* Nombre/Tipo del elemento seleccionado */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-[#DCE4E8] dark:border-[#243542] shrink-0">
            <span className="w-2 h-2 rounded-full bg-[#167D78] dark:bg-[#2DD4BF] animate-pulse shrink-0" />
            <span className="text-xs font-bold text-[#18313B] dark:text-white truncate max-w-[120px] sm:max-w-[180px]">
              {selectedSymbol?.name ||
                (selectedElementType === 'wire' ? `Cable ${selectedWire?.type || ''} ${selectedWire?.crossSectionMm2 || 2.5}mm²` : '') ||
                selectedArch?.type ||
                selectedRoom?.name ||
                'Elemento'}
            </span>
          </div>

          {/* Acciones para símbolos */}
          {selectedElementType === 'symbol' && (
            <>
              <button
                onClick={handleRotateSelected}
                title="Rotar 90° (R)"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] shrink-0 min-h-[44px]"
              >
                <RotateCw className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span className="hidden sm:inline">Rotar 90°</span>
              </button>
              <button
                onClick={() => handleFlipSelected('H')}
                title="Invertir horizontalmente"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] shrink-0 min-h-[44px]"
              >
                <FlipHorizontal className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span className="hidden sm:inline">Invertir H</span>
              </button>
            </>
          )}

          {/* Acciones para aberturas (puertas / ventanas) */}
          {(selectedElementType === 'door' || selectedElementType === 'window') && (
            <>
              <button
                onClick={handleRotateSelected}
                title="Rotar apertura"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] shrink-0 min-h-[44px]"
              >
                <RotateCw className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span className="hidden sm:inline">Rotar</span>
              </button>
              <button
                onClick={() => handleFlipSelected('H')}
                title="Cambiar sentido de apertura"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] shrink-0 min-h-[44px]"
              >
                <FlipHorizontal className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span className="hidden sm:inline">Invertir Sentido</span>
              </button>
            </>
          )}

          {/* Botón para abrir Propiedades Técnicas completas */}
          {onOpenProperties && (
            <button
              onClick={onOpenProperties}
              title="Abrir propiedades técnicas del elemento"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#167D78] dark:text-[#2DD4BF] bg-[#E8F5F5] dark:bg-[#167D78]/20 border border-[#B7DFDD] dark:border-[#167D78]/40 shrink-0 min-h-[44px]"
            >
              <Sliders className="w-4 h-4" />
              <span>Propiedades</span>
            </button>
          )}

          {/* Botón Eliminar con confirmación */}
          <button
            onClick={handleDeleteSelected}
            title="Eliminar elemento seleccionado (Supr)"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#DC2626] bg-red-50 dark:bg-red-950/40 hover:bg-red-100 border border-red-200 dark:border-red-800 shrink-0 min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Eliminar</span>
          </button>

          {/* Botón Deseleccionar / Cerrar */}
          <button
            onClick={() => onSelectElement(null, null)}
            title="Deseleccionar (Esc)"
            className="p-2.5 text-[#64748B] hover:text-[#18313B] dark:hover:text-white bg-[#F4F6F8] dark:bg-[#1B2B36] rounded-xl border border-[#DCE4E8] dark:border-[#243542] shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. Botón flotante para Cancelar Acción actual / Volver a Selección */}
      {(activeTool !== 'select' || wiringStart) && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#18313B]/95 text-white px-3.5 py-2 rounded-2xl shadow-2xl border border-amber-400 backdrop-blur-md animate-fade-in">
          <span className="text-xs font-medium">
            {wiringStart
              ? `Cableando ${wiringStart.terminalId}...`
              : `Herramienta: ${activeTool === 'place_symbol' ? selectedTemplateType || 'símbolo' : activeTool}`}
          </span>
          <button
            onClick={() => {
              setWiringStart(null);
              if (onResetTool) onResetTool();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 min-h-[40px]"
          >
            <X className="w-4 h-4" />
            <span>Cancelar Acción</span>
          </button>
        </div>
      )}

      {/* Cartel flotante en móvil cuando Modo Mover está activo */}
      {isPanMode && (
        <div className="sm:hidden absolute top-2 left-2 z-20 bg-[#167D78] text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-pulse">
          <Hand className="w-3.5 h-3.5 shrink-0" />
          <span>Modo Mover: Desliza 1 dedo</span>
        </div>
      )}

      {/* Indicador visual de retroalimentación de gestos de 2 dedos en móvil */}
      {isTwoFingerGesture && (
        <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 border border-amber-500/80 text-amber-300 font-mono text-[11px] font-bold px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 backdrop-blur-md animate-pulse pointer-events-none">
          <Hand className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Paneo y Zoom 2 Dedos ({Math.round(zoom * 100)}%)</span>
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
              fill="var(--cad-grid-dots, rgba(148, 163, 184, 0.45))"
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
              >
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.width}
                  height={room.height}
                  fill={room.color || 'rgba(59, 130, 246, 0.05)'}
                  stroke={isSelected ? '#f59e0b' : '#334155'}
                  strokeWidth={isSelected ? 2.5 : 1}
                  strokeDasharray={isSelected ? '6,3' : undefined}
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isPanMode) {
                      e.stopPropagation();
                      onSelectElement('room', room.id);
                      const coords = getSVGCoordinates(e.clientX, e.clientY);
                      const internalSymbols = project.symbols
                        .filter((s) => s.x >= room.x && s.x <= room.x + room.width && s.y >= room.y && s.y <= room.y + room.height)
                        .map((s) => ({ id: s.id, initX: s.x, initY: s.y }));
                      const margin = 20;
                      const boundaryWalls = project.architecturalElements
                        .filter((a) => {
                          const midX = (a.x1 + a.x2) / 2;
                          const midY = (a.y1 + a.y2) / 2;
                          return (
                            midX >= room.x - margin &&
                            midX <= room.x + room.width + margin &&
                            midY >= room.y - margin &&
                            midY <= room.y + room.height + margin
                          );
                        })
                        .map((a) => ({ id: a.id, initX1: a.x1, initY1: a.y1, initX2: a.x2, initY2: a.y2 }));

                      setDraggingRoomId(room.id);
                      setRoomDragStart({
                        cursorX: coords.x,
                        cursorY: coords.y,
                        roomX: room.x,
                        roomY: room.y,
                        internalSymbols,
                        boundaryWalls,
                      });
                    }
                  }}
                  onTouchStart={(e) => {
                    if (activeTool === 'select' && !isPanMode && e.touches.length === 1) {
                      e.stopPropagation();
                      onSelectElement('room', room.id);
                      const touch = e.touches[0];
                      const coords = getSVGCoordinates(touch.clientX, touch.clientY);
                      const internalSymbols = project.symbols
                        .filter((s) => s.x >= room.x && s.x <= room.x + room.width && s.y >= room.y && s.y <= room.y + room.height)
                        .map((s) => ({ id: s.id, initX: s.x, initY: s.y }));
                      const margin = 20;
                      const boundaryWalls = project.architecturalElements
                        .filter((a) => {
                          const midX = (a.x1 + a.x2) / 2;
                          const midY = (a.y1 + a.y2) / 2;
                          return (
                            midX >= room.x - margin &&
                            midX <= room.x + room.width + margin &&
                            midY >= room.y - margin &&
                            midY <= room.y + room.height + margin
                          );
                        })
                        .map((a) => ({ id: a.id, initX1: a.x1, initY1: a.y1, initX2: a.x2, initY2: a.y2 }));

                      setDraggingRoomId(room.id);
                      setRoomDragStart({
                        cursorX: coords.x,
                        cursorY: coords.y,
                        roomX: room.x,
                        roomY: room.y,
                        internalSymbols,
                        boundaryWalls,
                      });
                    }
                  }}
                  className={activeTool === 'select' && !isPanMode ? 'cursor-move' : 'cursor-pointer'}
                />

                {/* 4 Manijas de redimensionamiento en las esquinas cuando la habitación está seleccionada */}
                {isSelected && (
                  <g className="cursor-pointer">
                    {/* Superior Izquierda (TL) */}
                    <rect
                      x={room.x - 5}
                      y={room.y - 5}
                      width={10}
                      height={10}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="cursor-nwse-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const coords = getSVGCoordinates(e.clientX, e.clientY);
                        setResizingRoomCorner('tl');
                        setRoomResizeStart({
                          cursorX: coords.x,
                          cursorY: coords.y,
                          roomX: room.x,
                          roomY: room.y,
                          roomWidth: room.width,
                          roomHeight: room.height,
                        });
                      }}
                    />
                    {/* Superior Derecha (TR) */}
                    <rect
                      x={room.x + room.width - 5}
                      y={room.y - 5}
                      width={10}
                      height={10}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="cursor-nesw-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const coords = getSVGCoordinates(e.clientX, e.clientY);
                        setResizingRoomCorner('tr');
                        setRoomResizeStart({
                          cursorX: coords.x,
                          cursorY: coords.y,
                          roomX: room.x,
                          roomY: room.y,
                          roomWidth: room.width,
                          roomHeight: room.height,
                        });
                      }}
                    />
                    {/* Inferior Izquierda (BL) */}
                    <rect
                      x={room.x - 5}
                      y={room.y + room.height - 5}
                      width={10}
                      height={10}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="cursor-nesw-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const coords = getSVGCoordinates(e.clientX, e.clientY);
                        setResizingRoomCorner('bl');
                        setRoomResizeStart({
                          cursorX: coords.x,
                          cursorY: coords.y,
                          roomX: room.x,
                          roomY: room.y,
                          roomWidth: room.width,
                          roomHeight: room.height,
                        });
                      }}
                    />
                    {/* Inferior Derecha (BR) */}
                    <rect
                      x={room.x + room.width - 5}
                      y={room.y + room.height - 5}
                      width={10}
                      height={10}
                      fill="#f59e0b"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="cursor-nwse-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const coords = getSVGCoordinates(e.clientX, e.clientY);
                        setResizingRoomCorner('br');
                        setRoomResizeStart({
                          cursorX: coords.x,
                          cursorY: coords.y,
                          roomX: room.x,
                          roomY: room.y,
                          roomWidth: room.width,
                          roomHeight: room.height,
                        });
                      }}
                    />
                  </g>
                )}

                {/* Nombre del ambiente y dimensiones */}
                <text
                  x={room.x + room.width / 2}
                  y={room.y + 24}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="'Plus Jakarta Sans', sans-serif"
                  style={{ pointerEvents: 'none' }}
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
                    style={{ pointerEvents: 'none' }}
                  >
                    {areaM2} m² ({(room.width / 40).toFixed(1)}m × {(room.height / 40).toFixed(1)}m)
                  </text>
                )}
              </g>
            );
          })}

          {/* 2. Elementos arquitectónicos (Muros, Puertas, Ventanas) */}
          {project.architecturalElements.map((elem) => {
            const isSelected =
              (selectedElementType === elem.type || (selectedElementType === 'wall' && elem.type === 'wall')) &&
              selectedElementId === elem.id;

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
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isPanMode) {
                      e.stopPropagation();
                      onSelectElement('wall', elem.id);
                      const coords = getSVGCoordinates(e.clientX, e.clientY);
                      setDraggingArchId(elem.id);
                      setArchDragStart({
                        cursorX: coords.x,
                        cursorY: coords.y,
                        x1: elem.x1,
                        y1: elem.y1,
                        x2: elem.x2,
                        y2: elem.y2,
                      });
                    }
                  }}
                  className="cursor-move"
                />
              );
            } else if (elem.type === 'door') {
              // Geometría y apertura de puerta
              const dx = elem.x2 - elem.x1;
              const dy = elem.y2 - elem.y1;
              const doorLength = Math.max(30, Math.round(Math.sqrt(dx * dx + dy * dy)));
              const isExterior = elem.swingDirection === 'exterior';
              const isRightHinge = elem.hingeSide === 'derecha';
              const sweepFlag = (isExterior && !isRightHinge) || (!isExterior && isRightHinge) ? 1 : 0;
              const arcRadius = doorLength;

              return (
                <g
                  key={elem.id}
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isPanMode) {
                      e.stopPropagation();
                      onSelectElement('door', elem.id);
                      const coords = getSVGCoordinates(e.clientX, e.clientY);
                      setDraggingArchId(elem.id);
                      setArchDragStart({
                        cursorX: coords.x,
                        cursorY: coords.y,
                        x1: elem.x1,
                        y1: elem.y1,
                        x2: elem.x2,
                        y2: elem.y2,
                      });
                    }
                  }}
                  className="cursor-move"
                >
                  {/* Hoja de la puerta */}
                  <line
                    x1={elem.x1}
                    y1={elem.y1}
                    x2={elem.x2}
                    y2={elem.y2}
                    stroke={isSelected ? '#f59e0b' : '#94a3b8'}
                    strokeWidth={5}
                    strokeLinecap="round"
                  />

                  {/* Arco de barrido de apertura */}
                  <path
                    d={`M ${elem.x1} ${elem.y1} A ${arcRadius} ${arcRadius} 0 0 ${sweepFlag} ${
                      isExterior ? elem.x1 + (isRightHinge ? -arcRadius : arcRadius) : elem.x1 + (isRightHinge ? arcRadius : -arcRadius)
                    } ${elem.y2}`}
                    fill="none"
                    stroke={isSelected ? '#f59e0b' : '#64748b'}
                    strokeWidth={1.5}
                    strokeDasharray="3,3"
                  />

                  {/* Manija / Punto de bisagra */}
                  <circle cx={elem.x1} cy={elem.y1} r={3.5} fill="#f59e0b" />

                  {/* Indicador de selección y controles rápidos si está seleccionada */}
                  {isSelected && (
                    <g className="pointer-events-auto">
                      <rect
                        x={Math.min(elem.x1, elem.x2) - 8}
                        y={Math.min(elem.y1, elem.y2) - 8}
                        width={Math.abs(elem.x2 - elem.x1) + 16}
                        height={Math.abs(elem.y2 - elem.y1) + 16}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth={1}
                        strokeDasharray="4,2"
                      />
                      {/* Botón flotante para alternar sentido de apertura */}
                      <g
                        transform={`translate(${(elem.x1 + elem.x2) / 2}, ${(elem.y1 + elem.y2) / 2 - 20})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateProject((prev) => ({
                            ...prev,
                            architecturalElements: prev.architecturalElements.map((a) =>
                              a.id === elem.id
                                ? { ...a, swingDirection: a.swingDirection === 'exterior' ? 'interior' : 'exterior' }
                                : a
                            ),
                          }));
                        }}
                        className="cursor-pointer"
                      >
                        <rect x="-35" y="-10" width="70" height="20" rx="10" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
                        <text x="0" y="3" textAnchor="middle" fill="#fcd34d" fontSize="8" fontWeight="bold">
                          {elem.swingDirection === 'exterior' ? '⇄ Afuera' : '⇄ Adentro'}
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              );
            } else if (elem.type === 'window') {
              // Ventana (doble línea vidriada con marco)
              return (
                <g
                  key={elem.id}
                  onMouseDown={(e) => {
                    if (activeTool === 'select' && !isPanMode) {
                      e.stopPropagation();
                      onSelectElement('window', elem.id);
                      const coords = getSVGCoordinates(e.clientX, e.clientY);
                      setDraggingArchId(elem.id);
                      setArchDragStart({
                        cursorX: coords.x,
                        cursorY: coords.y,
                        x1: elem.x1,
                        y1: elem.y1,
                        x2: elem.x2,
                        y2: elem.y2,
                      });
                    }
                  }}
                  className="cursor-move"
                >
                  {/* Marco de ventana */}
                  <line
                    x1={elem.x1}
                    y1={elem.y1}
                    x2={elem.x2}
                    y2={elem.y2}
                    stroke={isSelected ? '#f59e0b' : '#38bdf8'}
                    strokeWidth={8}
                    strokeLinecap="square"
                  />
                  {/* Doble vidriado interior */}
                  <line
                    x1={elem.x1}
                    y1={elem.y1}
                    x2={elem.x2}
                    y2={elem.y2}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                  {isSelected && (
                    <rect
                      x={Math.min(elem.x1, elem.x2) - 6}
                      y={Math.min(elem.y1, elem.y2) - 6}
                      width={Math.abs(elem.x2 - elem.x1) + 12}
                      height={Math.abs(elem.y2 - elem.y1) + 12}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth={1}
                      strokeDasharray="4,2"
                    />
                  )}
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

            // Verificar si este cable es parte de una falla activa (cortocircuito / tierra / sobrecarga)
            const activeFault = simState?.activeFaults?.find((f) => f.involvedWireIds.includes(wire.id));
            const isFaultWire = Boolean(activeFault);

            // Determinar tipo de trazado: Ortogonal (Canalización) o Bézier curvo
            const isOrthogonal = (wire.routingMode || routingMode) === 'orthogonal';
            let pathD = '';
            let labelX = (x1 + x2) / 2;
            let labelY = (y1 + y2) / 2;

            if (isOrthogonal) {
              const orthPoints = calculateOrthogonalPath({ x: x1, y: y1 }, { x: x2, y: y2 }, wire.points);
              pathD = pointsToSVGPath(orthPoints, 10);
              if (orthPoints.length >= 3) {
                labelX = orthPoints[1].x;
                labelY = orthPoints[1].y;
              }
            } else {
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2 + (x2 - x1) * 0.1;
              pathD = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
              labelX = midX;
              labelY = midY;
            }

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
                <path d={pathD} fill="none" stroke="transparent" strokeWidth={18} />

                {/* Resplandor de ALERTA DE FALLA / CORTOCIRCUITO (Pulsante rojo brillante) */}
                {isFaultWire && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={isSelected ? 10 : 8}
                    opacity={0.85}
                    className="animate-pulse"
                  />
                )}

                {/* Sombra de cable energizado */}
                {wire.isEnergized && !isFaultWire && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke={wireColor}
                    strokeWidth={isSelected ? 6 : 4}
                    opacity={0.3}
                  />
                )}

                {/* Cable físico / Canalización */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={isFaultWire ? '#ef4444' : isSelected ? '#f59e0b' : wireColor}
                  strokeWidth={isFaultWire ? 4 : isSelected ? 3.5 : 2.2}
                  strokeDasharray={wire.type === 'tierra' ? '6,3' : wire.hasCurrent ? '8,4' : undefined}
                />

                {/* Etiqueta técnica a mitad del recorrido */}
                {showDimensions && (
                  <g className="select-none pointer-events-none">
                    <rect
                      x={labelX - 32}
                      y={labelY - 14}
                      width={64}
                      height={13}
                      rx={2}
                      fill="rgba(15, 23, 42, 0.88)"
                      stroke={isFaultWire ? '#ef4444' : isSelected ? '#f59e0b' : '#334155'}
                      strokeWidth={0.8}
                    />
                    <text
                      x={labelX}
                      y={labelY - 4}
                      textAnchor="middle"
                      fill={isFaultWire ? '#fca5a5' : isSelected ? '#f59e0b' : wireColor}
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="'JetBrains Mono', monospace"
                    >
                      {isFaultWire ? '¡FALLA!' : `${wire.lengthMeters}m ${wire.crossSectionMm2 || 2.5}mm²`}
                    </text>
                  </g>
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
            const isFaultSym = simState?.activeFaults?.some((f) => f.involvedComponentIds.includes(sym.id));

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
                {/* Resplandor de ALERTA si el componente está comprometido en una falla */}
                {isFaultSym && (
                  <g className="animate-pulse pointer-events-none">
                    <circle
                      cx={0}
                      cy={0}
                      r={36}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth={3}
                      strokeDasharray="5,3"
                    />
                    <circle
                      cx={0}
                      cy={0}
                      r={44}
                      fill="rgba(239, 68, 68, 0.18)"
                    />
                  </g>
                )}

                {/* Resplandor si es lámpara encendida */}
                {isLampActive && !isFaultSym && (
                  <circle
                    cx={0}
                    cy={0}
                    r={36}
                    fill="rgba(245, 158, 11, 0.25)"
                    filter="url(#lamp-glow)"
                    className="pointer-events-none"
                  />
                )}

                {/* Renderizado fotorrealista según el modo de vista elegido */}
                <RealisticCADSymbolSVG
                  symbol={sym}
                  viewMode={viewMode}
                  isSelected={isSelected}
                  isOn={isLampActive}
                />

                {/* 1. Etiquetas Permanentes en el Plano (Encima del Componente) */}
                {labelSize !== 'oculto' && (() => {
                  const labelData = getComponentLabelInfo(sym, project.circuits);
                  const isLarge = labelSize === 'grande';
                  const isSmall = labelSize === 'pequeno';
                  const badgeY = isLarge ? -38 : isSmall ? -28 : -33;
                  const badgeW = isLarge ? 94 : isSmall ? 70 : 82;
                  const badgeH = isLarge ? 24 : isSmall ? 18 : 21;
                  const titleFont = isLarge ? 9 : isSmall ? 7 : 8;
                  const subFont = isLarge ? 7.5 : isSmall ? 6 : 6.8;

                  return (
                    <g className="pointer-events-none select-none">
                      {/* Fondo de placa/badge con esquinas redondeadas y contraste reforzado */}
                      <rect
                        x={-badgeW / 2}
                        y={badgeY - badgeH / 2}
                        width={badgeW}
                        height={badgeH}
                        rx={3}
                        fill="rgba(15, 23, 42, 0.94)"
                        stroke={isSelected ? '#f59e0b' : '#334155'}
                        strokeWidth={isSelected ? 1.5 : 0.8}
                      />
                      {/* Título: NOMBRE HABITUAL + TAG TÉCNICO (ej: TÉRMICA Q1, DIFERENCIAL ID1, LÁMPARA L1) */}
                      <text
                        x={0}
                        y={badgeY - 1.5}
                        textAnchor="middle"
                        fill={isSelected ? '#f59e0b' : '#f8fafc'}
                        fontSize={titleFont}
                        fontWeight="bold"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {labelData.bannerTitle}
                      </text>
                      {/* Subtítulo: CIRCUITO ASIGNADO (ej: C1 (IUG), C2 (TUG)) */}
                      <text
                        x={0}
                        y={badgeY + (isLarge ? 8 : isSmall ? 6 : 7)}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize={subFont}
                        fontWeight="600"
                        fontFamily="'Plus Jakarta Sans', sans-serif"
                      >
                        {labelData.circuitInfo}
                      </text>
                    </g>
                  );
                })()}

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
    </>
  )}

  {/* Ficha de Reconocimiento Físico al Seleccionar Componente (Objetivo 2) */}
  {selectedElementType === 'symbol' && selectedElementId && (
    (() => {
      const selectedSym = project.symbols.find((s) => s.id === selectedElementId);
      if (!selectedSym) return null;
      return (
        <PhysicalComponentCard
          symbol={selectedSym}
          onClose={() => onSelectElement(null, null)}
          onOpenDetailedNormativeModal={(type) => setLearningType(type)}
        />
      );
    })()
  )}

  {/* Modal de Ficha Educativa Técnica para Principiantes */}
  {learningType && (
    <ComponentLearningModal
      symbolType={learningType}
      onClose={() => setLearningType(null)}
    />
  )}

  {/* Modal de Especificación y Dimensionamiento de Conductores (AEA 771) */}
  <ConductorSpecificationModal
    isOpen={isConductorModalOpen}
    wire={project.wires.find((w) => w.id === selectedElementId) || null}
    project={project}
    onClose={() => setIsConductorModalOpen(false)}
    onUpdateWire={(updatedWire) => {
      onUpdateProject((prev) => ({
        ...prev,
        wires: prev.wires.map((w) => (w.id === updatedWire.id ? updatedWire : w)),
      }));
    }}
  />

  {/* Modal de Confirmación de Borrado de Habitación con Componentes */}
  {roomDeleteModalData && (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-700 max-w-md w-full rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 text-slate-100">
        <div className="flex items-center gap-2.5 text-amber-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="font-bold text-sm sm:text-base text-white">
            Eliminar Ambiente "{roomDeleteModalData.roomName}"
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Este ambiente contiene <strong className="text-amber-400 font-bold">{roomDeleteModalData.symbolCount} componentes eléctricos</strong> en su interior. ¿Qué deseas hacer?
        </p>
        <div className="space-y-2 pt-1">
          <button
            onClick={() => {
              const toDeleteIds = new Set(roomDeleteModalData.symbolIds);
              onUpdateProject((prev) => ({
                ...prev,
                rooms: prev.rooms.filter((r) => r.id !== roomDeleteModalData.roomId),
                symbols: prev.symbols.filter((s) => !toDeleteIds.has(s.id)),
                wires: prev.wires.filter(
                  (w) => !toDeleteIds.has(w.fromComponentId) && !toDeleteIds.has(w.toComponentId)
                ),
              }));
              setRoomDeleteModalData(null);
              onSelectElement(null, null);
            }}
            className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Eliminar Ambiente y su contenido ({roomDeleteModalData.symbolCount} bocas y cables)</span>
          </button>

          <button
            onClick={() => {
              onUpdateProject((prev) => ({
                ...prev,
                rooms: prev.rooms.filter((r) => r.id !== roomDeleteModalData.roomId),
              }));
              setRoomDeleteModalData(null);
              onSelectElement(null, null);
            }}
            className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
          >
            Eliminar solo el Ambiente (conservar bocas en el plano)
          </button>

          <button
            onClick={() => setRoomDeleteModalData(null)}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );
};

