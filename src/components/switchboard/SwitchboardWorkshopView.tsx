/**
 * ELECTRA PLAN — TALLER DE TABLEROS ELÉCTRICOS REALISTAS
 * Módulo profesional interactivo: Editor de tableros, cableado ortogonal realista,
 * simulador funcional en tiempo real con acometida y 15 talleres prácticos guiados (AEA 90364).
 */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Cpu,
  Power,
  RotateCcw,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Hand,
  Trash2,
  Plus,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  DoorClosed,
  DoorOpen,
  LayoutGrid,
  FileSpreadsheet,
  X,
  Gauge,
  Info,
  ChevronRight,
  GitCommit,
  Radio,
} from 'lucide-react';
import { Project } from '../../types/electra';
import {
  RealisticSwitchboardState,
  RealisticDINDevice,
  RealisticSwitchboardWire,
  SwitchboardViewMode,
  DeviceTerminal,
  DINDeviceType,
} from '../../types/switchboardWorkshop';
import {
  SWITCHBOARD_COMPONENT_CATALOG,
  createRealisticDINDevice,
  SWITCHBOARD_WIRE_COLORS,
} from '../../services/switchboardCatalog';
import { simulateSwitchboard } from '../../services/switchboardSimulation';
import { SWITCHBOARD_WORKSHOP_LEVELS } from '../../services/switchboardWorkshops';
import { RealisticCabinetSVG } from './RealisticCabinetSVG';
import { SwitchboardWiringOverlay } from './SwitchboardWiringOverlay';

interface SwitchboardWorkshopViewProps {
  project: Project;
  onUpdateProject: (updater: (prev: Project) => Project) => void;
}

export const SwitchboardWorkshopView: React.FC<SwitchboardWorkshopViewProps> = ({
  project,
  onUpdateProject,
}) => {
  // Estado general del tablero realista
  const [boardState, setBoardState] = useState<RealisticSwitchboardState>(() => {
    // Si el proyecto ya tiene componentes de tablero, inicializarlos en el riel
    const initialDevices: RealisticDINDevice[] = [
      createRealisticDINDevice('iga', 1, 0, undefined, project.switchboard?.mainBreakerAmps || 32),
      createRealisticDINDevice('diferencial', 1, 1, undefined, project.switchboard?.differentialAmps || 40),
    ];

    // Añadir los PIAs de los circuitos del proyecto
    project.circuits.forEach((circ, idx) => {
      initialDevices.push(
        createRealisticDINDevice('termomagnetico', 1, idx + 2, circ.id, circ.breakerAmps || 16)
      );
    });

    // Añadir Barra de Tierra en riel inferior
    initialDevices.push(createRealisticDINDevice('barra_tierra', 2, 0));

    return {
      cabinetModel: 'Gabinete DIN 24 Módulos IP40',
      rowsCount: 2,
      modulesPerRow: 14,
      doorOpen: true,
      doorType: 'fume',
      hasCableDucts: true,
      mainsEnergized: true,
      supplyVoltage: 220,
      supplyFrequency: 50,
      simulatedFault: 'none',
      rails: [
        { id: 1, name: 'Riel Superior 1 (Protecciones)', capacityModules: 14 },
        { id: 2, name: 'Riel Inferior 2 (Distribución & Tierra)', capacityModules: 14 },
      ],
      devices: initialDevices,
      wires: [],
    };
  });

  // Modos de vista y herramientas
  const [viewMode, setViewMode] = useState<SwitchboardViewMode>('realista');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null);

  // Cableado interactivo
  const [activeWireType, setActiveWireType] = useState<
    'fase' | 'neutro' | 'tierra' | 'control' | 'retorno'
  >('fase');
  const [activeWireSection, setActiveWireSection] = useState<number>(4.0);
  const [wiringStart, setWiringStart] = useState<{
    deviceId: string;
    terminalId: string;
    absX: number;
    absY: number;
  } | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Navegación en el lienzo (Zoom y Pan con 2 dedos en celular)
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [isPanMode, setIsPanMode] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1.0);
  const initialMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const initialPanRef = useRef<{ x: number; y: number }>({ x: 30, y: 30 });

  // Paneles laterales y modales (Móvil y Escritorio)
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isWorkshopDrawerOpen, setIsWorkshopDrawerOpen] = useState(false);
  const [selectedWorkshopLevelId, setSelectedWorkshopLevelId] = useState<number>(1);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [workshopValidation, setWorkshopValidation] = useState<{
    passed: boolean;
    feedback: string;
    technicalNotes: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Motor de simulación en tiempo real para el tablero
  const simResult = useMemo(() => {
    return simulateSwitchboard(boardState, project);
  }, [boardState, project]);

  // Nivel de taller activo
  const activeLevel =
    SWITCHBOARD_WORKSHOP_LEVELS.find((lvl) => lvl.id === selectedWorkshopLevelId) ||
    SWITCHBOARD_WORKSHOP_LEVELS[0];

  // Alternar estado de palanca de un dispositivo (ON / OFF)
  const handleToggleDeviceState = (deviceId: string) => {
    setBoardState((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => {
        if (d.id === deviceId) {
          const nextState = d.state === 'closed' ? 'open' : 'closed';
          return { ...d, state: nextState };
        }
        return d;
      }),
    }));
  };

  // Botón de prueba TEST en disyuntor diferencial (simula fuga que dispara la protección)
  const handleTestDifferential = (deviceId: string) => {
    setBoardState((prev) => ({
      ...prev,
      devices: prev.devices.map((d) =>
        d.id === deviceId ? { ...d, state: 'tripped' } : d
      ),
    }));
  };

  // Re-armar todas las protecciones disparadas o abiertas
  const handleResetProtections = () => {
    setBoardState((prev) => ({
      ...prev,
      devices: prev.devices.map((d) => ({ ...d, state: 'closed' })),
    }));
  };

  // Manejo de clic en bornes para cablear
  const handleTerminalClick = (
    deviceId: string,
    terminal: DeviceTerminal,
    absX: number,
    absY: number
  ) => {
    if (!wiringStart) {
      // Iniciar nuevo cable
      setWiringStart({
        deviceId,
        terminalId: terminal.id,
        absX,
        absY,
      });
      setSelectedTerminalId(terminal.id);
    } else {
      // Finalizar cable
      if (wiringStart.deviceId === deviceId && wiringStart.terminalId === terminal.id) {
        setWiringStart(null);
        setSelectedTerminalId(null);
        return;
      }

      // Validar incompatibilidad directa (ej. cortocircuito Fase -> Neutro directo)
      const fromDev = boardState.devices.find((d) => d.id === wiringStart.deviceId);
      const fromTerm = fromDev?.terminals.find((t) => t.id === wiringStart.terminalId);

      if (fromTerm && terminal) {
        if (
          (fromTerm.type === 'fase' && terminal.type === 'neutro') ||
          (fromTerm.type === 'neutro' && terminal.type === 'fase')
        ) {
          if (
            !confirm(
              '⚠️ ADVERTENCIA: Estás uniendo directamente un borne de FASE con uno de NEUTRO. Esto provocará un cortocircuito franco. ¿Deseas colocarlo para análisis didáctico?'
            )
          ) {
            setWiringStart(null);
            setSelectedTerminalId(null);
            return;
          }
        }
      }

      const newWire: RealisticSwitchboardWire = {
        id: `wire_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        fromDeviceId: wiringStart.deviceId,
        fromTerminalId: wiringStart.terminalId,
        toDeviceId: deviceId,
        toTerminalId: terminal.id,
        conductorType: activeWireType,
        crossSectionMm2: activeWireSection,
        color: SWITCHBOARD_WIRE_COLORS[activeWireType]?.stroke || '#854d0e',
        routing: 'canaleta',
      };

      setBoardState((prev) => ({
        ...prev,
        wires: [...prev.wires, newWire],
      }));

      setWiringStart(null);
      setSelectedTerminalId(null);
    }
  };

  // Agregar componente desde la biblioteca
  const handleAddDevice = (templateType: DINDeviceType, targetRail: number = 1) => {
    const devicesInRail = boardState.devices.filter((d) => d.railId === targetRail);
    const nextSlot = devicesInRail.reduce((acc, d) => Math.max(acc, d.slotIndex + d.modulesWidth), 0);

    const newDev = createRealisticDINDevice(templateType, targetRail, nextSlot);
    setBoardState((prev) => ({
      ...prev,
      devices: [...prev.devices, newDev],
    }));
    setSelectedDeviceId(newDev.id);
    setIsLibraryOpen(false);
  };

  // Eliminar dispositivo
  const handleDeleteDevice = (deviceId: string) => {
    setBoardState((prev) => ({
      ...prev,
      devices: prev.devices.filter((d) => d.id !== deviceId),
      wires: prev.wires.filter(
        (w) => w.fromDeviceId !== deviceId && w.toDeviceId !== deviceId
      ),
    }));
    if (selectedDeviceId === deviceId) {
      setSelectedDeviceId(null);
    }
  };

  // Eliminar cable
  const handleDeleteWire = (wireId: string) => {
    setBoardState((prev) => ({
      ...prev,
      wires: prev.wires.filter((w) => w.id !== wireId),
    }));
    if (selectedWireId === wireId) {
      setSelectedWireId(null);
    }
  };

  // Cargar Taller Práctico Guiado
  const handleLoadWorkshop = (levelId: number) => {
    const level = SWITCHBOARD_WORKSHOP_LEVELS.find((l) => l.id === levelId);
    if (!level) return;

    setSelectedWorkshopLevelId(levelId);
    setRevealedHints(0);
    setWorkshopValidation(null);

    setBoardState((prev) => ({
      ...prev,
      devices: level.initialState.devices.map((d) => ({ ...d })),
      wires: level.initialState.wires.map((w) => ({ ...w })),
      mainsEnergized: level.initialState.mainsEnergized ?? true,
    }));
  };

  // Validar solución del taller
  const handleValidateWorkshop = () => {
    const res = activeLevel.validateSolution(boardState);
    setWorkshopValidation(res);
  };

  // Gestos táctiles de 2 dedos (Pinch to Zoom + Two-Finger Pan en celular)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length >= 2) {
      setIsPanning(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      initialPinchDistRef.current = Math.max(dist, 10);
      initialZoomRef.current = zoom;
      initialMidpointRef.current = { x: midX, y: midY };
      initialPanRef.current = { ...pan };
    } else if (e.touches.length === 1 && isPanMode) {
      const touch = e.touches[0];
      setIsPanning(true);
      setStartPan({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length >= 2 && initialPinchDistRef.current && initialMidpointRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      const ratio = dist / initialPinchDistRef.current;
      const nextZoom = Math.min(2.5, Math.max(0.4, Number((initialZoomRef.current * ratio).toFixed(2))));

      const rect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
      const startMidRelX = initialMidpointRef.current.x - rect.left;
      const startMidRelY = initialMidpointRef.current.y - rect.top;
      const currMidRelX = midX - rect.left;
      const currMidRelY = midY - rect.top;

      const worldX = (startMidRelX - initialPanRef.current.x) / initialZoomRef.current;
      const worldY = (startMidRelY - initialPanRef.current.y) / initialZoomRef.current;

      const newPanX = currMidRelX - worldX * nextZoom;
      const newPanY = currMidRelY - worldY * nextZoom;

      setZoom(nextZoom);
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else if (e.touches.length === 1 && isPanning) {
      const touch = e.touches[0];
      setPan({ x: touch.clientX - startPan.x, y: touch.clientY - startPan.y });
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistRef.current = null;
    initialMidpointRef.current = null;
    setIsPanning(false);
  };

  // Convertir mouse en lienzo
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left - pan.x) / zoom;
      const rawY = (e.clientY - rect.top - pan.y) / zoom;
      setCursorPos({ x: Math.round(rawX), y: Math.round(rawY) });

      if (isPanning) {
        setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      }
    }
  };

  const selectedDevice = boardState.devices.find((d) => d.id === selectedDeviceId);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* 1. BARRA SUPERIOR DE CONTROL DEL TALLER (Totalmente Responsiva) */}
      <header className="bg-slate-900 border-b border-slate-800 p-2.5 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2.5 shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400 shrink-0" />
            <h1 className="font-bold text-xs sm:text-sm text-white tracking-wide">
              Taller de Tableros Eléctricos
            </h1>
          </div>

          {/* Interruptor de Acometida (Energizar / Desenergizar Red) */}
          <button
            onClick={() =>
              setBoardState((prev) => ({ ...prev, mainsEnergized: !prev.mainsEnergized }))
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              boardState.mainsEnergized
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{boardState.mainsEnergized ? 'Red 220V ON' : 'Red OFF'}</span>
          </button>
        </div>

        {/* Indicadores Eléctricos de Medición en Vivo */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Tensión:</span>
          <span className="font-bold text-cyan-300">{simResult.voltageL_N} V</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Corriente:</span>
          <span className="font-bold text-amber-300">{simResult.totalCurrentAmps} A</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Potencia:</span>
          <span className="font-bold text-emerald-300">{simResult.totalActivePowerWatts} W</span>
        </div>

        {/* Acciones Rápidas de Vista y Taller */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Selector de Modo de Vista */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('realista')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                viewMode === 'realista'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Realista
            </button>
            <button
              onClick={() => setViewMode('esquema')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                viewMode === 'esquema'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Esquema
            </button>
          </div>

          {/* Alternar Puerta del Gabinete */}
          <button
            onClick={() => setBoardState((prev) => ({ ...prev, doorOpen: !prev.doorOpen }))}
            title={boardState.doorOpen ? 'Cerrar puerta del gabinete' : 'Abrir puerta del gabinete'}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              boardState.doorOpen
                ? 'bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
            }`}
          >
            {boardState.doorOpen ? (
              <DoorOpen className="w-4 h-4 text-slate-400" />
            ) : (
              <DoorClosed className="w-4 h-4 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {boardState.doorOpen ? 'Puerta Abierta' : 'Puerta Cerrada'}
            </span>
          </button>

          {/* Botón Abrir Biblioteca de Componentes */}
          <button
            onClick={() => setIsLibraryOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 border border-slate-700 text-xs text-amber-300 font-bold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Componentes</span>
          </button>

          {/* Botón Abrir 15 Talleres Guiados */}
          <button
            onClick={() => setIsWorkshopDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Talleres (15)</span>
          </button>
        </div>
      </header>

      {/* 2. ESPACIO CENTRAL: LIENZO VECTORIAL DEL TABLERO + BARRAS FLOTANTES */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 relative overflow-hidden bg-slate-950 cursor-crosshair touch-none"
      >
        {/* Controles Flotantes de Zoom y Navegación (Dock Vertical Táctil) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col bg-slate-900/95 border border-slate-800 rounded-xl shadow-xl backdrop-blur-md overflow-hidden">
          <button
            onClick={() => setIsPanMode(!isPanMode)}
            title="Alternar modo mover tablero"
            className={`p-2.5 flex items-center justify-center transition-colors border-b border-slate-800 ${
              isPanMode ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 active:bg-slate-800'
            }`}
          >
            <Hand className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            title="Acercar vista"
            className="p-2.5 text-slate-300 active:bg-slate-800 border-b border-slate-800 flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="text-[9px] font-mono font-bold text-center py-1 text-slate-400 border-b border-slate-800">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
            title="Alejar vista"
            className="p-2.5 text-slate-300 active:bg-slate-800 border-b border-slate-800 flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 30, y: 30 });
            }}
            title="Centrar tablero"
            className="p-2.5 text-slate-300 active:bg-slate-800 flex items-center justify-center"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Barra Flotante de Selección de Conductor para Cablear */}
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-1.5 bg-slate-900/95 border border-slate-800 p-1.5 rounded-xl shadow-xl backdrop-blur-md text-xs">
          <span className="text-[11px] text-slate-400 font-semibold px-1">Conductor:</span>
          {(['fase', 'neutro', 'tierra', 'control'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveWireType(type)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeWireType === type
                  ? 'bg-slate-800 text-white ring-1 ring-amber-400 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: SWITCHBOARD_WIRE_COLORS[type]?.stroke || '#854d0e' }}
              />
              <span className="capitalize">{type}</span>
            </button>
          ))}

          {/* Selector de Sección */}
          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
          <select
            value={activeWireSection}
            onChange={(e) => setActiveWireSection(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 text-amber-300 font-mono text-xs focus:outline-hidden"
          >
            <option value={1.5}>1.5 mm²</option>
            <option value={2.5}>2.5 mm²</option>
            <option value={4.0}>4.0 mm²</option>
            <option value={6.0}>6.0 mm²</option>
            <option value={10.0}>10.0 mm²</option>
          </select>
        </div>

        {/* Banner de ayuda si el usuario está cableando */}
        {wiringStart && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-amber-950/95 border-2 border-amber-500 text-amber-200 px-4 py-2 rounded-xl text-xs shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Cableando desde borne. Toca el borne de destino para conectar.</span>
            <button
              onClick={() => {
                setWiringStart(null);
                setSelectedTerminalId(null);
              }}
              className="px-2 py-1 bg-amber-800 hover:bg-amber-700 text-amber-100 rounded text-[11px] font-bold"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* SVG DEL TABLERO: GABINETE + DISPOSITIVOS + CABLES ORTOGONALES */}
        <RealisticCabinetSVG
          rowsCount={boardState.rowsCount}
          modulesPerRow={boardState.modulesPerRow}
          doorOpen={boardState.doorOpen}
          doorType={boardState.doorType}
          hasCableDucts={boardState.hasCableDucts}
          rails={boardState.rails}
          devices={boardState.devices}
          selectedDeviceId={selectedDeviceId}
          selectedTerminalId={selectedTerminalId}
          onSelectDevice={(id) => {
            setSelectedDeviceId(id);
            setSelectedWireId(null);
          }}
          onToggleDeviceState={handleToggleDeviceState}
          onTestDifferential={handleTestDifferential}
          onTerminalClick={handleTerminalClick}
          viewMode={viewMode}
          energizedTerminals={simResult.energizedTerminals}
          zoom={zoom}
          pan={pan}
        />

        {/* Superposición de Cableado Ortogonal */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transformOrigin: '0 0' }}
        >
          <SwitchboardWiringOverlay
            wires={boardState.wires}
            devices={boardState.devices}
            wiringStart={wiringStart}
            cursorPos={cursorPos}
            activeWireType={activeWireType}
            selectedWireId={selectedWireId}
            onSelectWire={(id) => {
              setSelectedWireId(id);
              setSelectedDeviceId(null);
            }}
            onDeleteWire={handleDeleteWire}
            energizedWires={simResult.energizedWires}
            zoom={zoom}
            pan={pan}
          />
        </svg>
      </div>

      {/* 3. BARRA INFERIOR DE DIAGNÓSTICOS ELÉCTRICOS Y METRICAS EN VIVO */}
      <footer className="bg-slate-900 border-t border-slate-800 p-2.5 sm:px-4 sm:py-2 flex items-center justify-between text-xs text-slate-300 shrink-0 z-20">
        <div className="flex items-center gap-2 truncate">
          {simResult.hasShortCircuit ? (
            <span className="flex items-center gap-1.5 text-red-400 font-bold bg-red-950/70 border border-red-800 px-2.5 py-1 rounded-lg">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>¡CORTOCIRCUITO EN EL TABLERO!</span>
            </span>
          ) : simResult.activeCircuits.length > 0 ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{simResult.activeCircuits.length} circuito(s) energizados</span>
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Tablero en espera. Acciona las palancas o energiza la acometida.</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetProtections}
            title="Re-armar todas las protecciones disparadas"
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Restablecer Palancas</span>
          </button>
        </div>
      </footer>

      {/* 4. CAJÓN DESLIZABLE (DRAWER) DE BIBLIOTECA DE COMPONENTES */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-end bg-slate-950/80 backdrop-blur-xs p-3">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Plus className="w-5 h-5" />
                <span>Biblioteca de Dispositivos DIN</span>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              {['cabecera', 'proteccion_circuitos', 'medicion_control', 'distribucion'].map(
                (catKey) => {
                  const catTitle =
                    catKey === 'cabecera'
                      ? 'Corte General y Diferenciales'
                      : catKey === 'proteccion_circuitos'
                      ? 'Termomagnéticos Derivados (PIAs)'
                      : catKey === 'medicion_control'
                      ? 'Medición Digital y Maniobra'
                      : 'Borneras y Repartidores';

                  const comps = SWITCHBOARD_COMPONENT_CATALOG.filter((c) => c.category === catKey);

                  return (
                    <div key={catKey} className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        {catTitle}
                      </span>
                      <div className="space-y-1.5">
                        {comps.map((c) => (
                          <div
                            key={c.name}
                            className="p-3 bg-slate-950 border border-slate-800 hover:border-amber-500/70 rounded-xl flex items-center justify-between gap-3 transition-colors"
                          >
                            <div>
                              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                                <span className="text-amber-400 font-mono text-[11px]">{c.label}</span>
                                <span className="text-slate-500 font-mono text-[10px]">({c.modulesWidth} mod)</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{c.description}</p>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                onClick={() => handleAddDevice(c.type, 1)}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded text-[10px]"
                              >
                                + Riel 1
                              </button>
                              <button
                                onClick={() => handleAddDevice(c.type, 2)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold rounded text-[10px]"
                              >
                                + Riel 2
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. CAJÓN DESLIZABLE (DRAWER) DE LOS 15 TALLERES GUIADOS */}
      {isWorkshopDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:justify-start bg-slate-950/80 backdrop-blur-xs p-3">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-lg h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <BookOpen className="w-5 h-5" />
                <span>15 Talleres Prácticos de Tableros (AEA 90364)</span>
              </div>
              <button
                onClick={() => setIsWorkshopDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector de Nivel */}
            <div className="p-3 bg-slate-950/90 border-b border-slate-800">
              <label className="text-[10px] text-slate-400 block mb-1 font-semibold">Seleccionar Taller:</label>
              <select
                value={selectedWorkshopLevelId}
                onChange={(e) => handleLoadWorkshop(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 text-amber-300 font-bold text-xs rounded-lg px-3 py-2 focus:border-amber-500 focus:outline-hidden"
              >
                {SWITCHBOARD_WORKSHOP_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.title} ({lvl.difficulty})
                  </option>
                ))}
              </select>
            </div>

            {/* Ficha Técnica del Taller Activo */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-950 text-amber-300 border border-amber-800">
                    {activeLevel.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{activeLevel.normativeRef}</span>
                </div>
                <h3 className="font-bold text-sm text-white">{activeLevel.title}</h3>
                <p className="text-slate-300 text-xs leading-relaxed">{activeLevel.description}</p>
              </div>

              {/* Objetivos de Aprendizaje */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-200">Objetivos del taller:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-400">
                  {activeLevel.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              {/* Instrucciones Paso a Paso */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-200">Instrucciones:</span>
                <div className="space-y-1">
                  {activeLevel.stepByStepInstructions.map((step, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-800 text-slate-300 leading-relaxed text-xs"
                    >
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pistas Progresivas */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Pistas ({revealedHints}/{activeLevel.hints.length})</span>
                  </span>
                  {revealedHints < activeLevel.hints.length && (
                    <button
                      onClick={() => setRevealedHints((h) => h + 1)}
                      className="text-[11px] text-amber-300 underline font-medium"
                    >
                      Revelar pista
                    </button>
                  )}
                </div>

                {revealedHints > 0 && (
                  <div className="space-y-1 pt-1">
                    {activeLevel.hints.slice(0, revealedHints).map((hint, i) => (
                      <div key={i} className="bg-amber-950/30 border border-amber-800/50 p-2 rounded text-amber-200 text-[11px]">
                        {hint}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón Comprobar Solución */}
              <div className="pt-2">
                <button
                  onClick={handleValidateWorkshop}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-xl text-sm shadow-lg transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Comprobar Ejercicio</span>
                </button>
              </div>

              {/* Resultado del Ensayo */}
              {workshopValidation && (
                <div
                  className={`p-3.5 rounded-xl border text-xs leading-relaxed space-y-1.5 shadow-lg ${
                    workshopValidation.passed
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100'
                      : 'bg-red-950/80 border-red-500 text-red-100'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    {workshopValidation.passed ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>¡TALLER APROBADO!</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span>PENDIENTE DE CORRECCIÓN</span>
                      </>
                    )}
                  </div>
                  <p>{workshopValidation.feedback}</p>
                  <p className="text-[11px] opacity-80 mt-1">{workshopValidation.technicalNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. PANEL DE PROPIEDADES DEL DISPOSITIVO SELECCIONADO */}
      {selectedDevice && (
        <div className="absolute top-16 left-3 z-30 bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-amber-400">{selectedDevice.name}</span>
            <button
              onClick={() => setSelectedDeviceId(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1 text-slate-300">
            <div><strong>Polos:</strong> {selectedDevice.poles}</div>
            <div><strong>Corriente Nominal:</strong> {selectedDevice.ratingAmps} A</div>
            {selectedDevice.sensitivityMa && (
              <div><strong>Sensibilidad:</strong> {selectedDevice.sensitivityMa} mA</div>
            )}
            <div><strong>Ancho DIN:</strong> {selectedDevice.modulesWidth} módulo(s) ({selectedDevice.modulesWidth * 18} mm)</div>
            {selectedDevice.circuitId && (
              <div><strong>Circuito:</strong> {selectedDevice.circuitId}</div>
            )}
            <div><strong>Estado:</strong> {selectedDevice.state}</div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => handleToggleDeviceState(selectedDevice.id)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold"
            >
              {selectedDevice.state === 'closed' ? 'Abrir (OFF)' : 'Cerrar (ON)'}
            </button>
            <button
              onClick={() => handleDeleteDevice(selectedDevice.id)}
              className="p-1 text-red-400 hover:text-red-300 rounded"
              title="Eliminar dispositivo del riel"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
