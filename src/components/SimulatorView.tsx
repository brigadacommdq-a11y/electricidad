/**
 * ELECTRA PLAN — Vista Dedicada del Simulador Eléctrico
 * Banco de ensayos virtual interactivo con maniobra individual de protecciones (IGA, ID, PIAs),
 * accionamiento de interruptores, comprobación de continuidad lógica, detección de cortocircuitos
 * y análisis de cargas según estado real (elementos no conectados = 0 A / 0 W).
 * Cumple con normas AEA 90364 e IRAM 2183.
 */
import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lightbulb,
  Power,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Info,
  BookOpen,
  Palette,
  RotateCcw,
  Cpu,
  Flame,
  Activity,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Project, SimulationState, ElectricalSymbol } from '../types/electra';
import { ComponentLearningModal } from './ComponentLearningModal';
import { WireColorReferenceModal } from './WireColorReferenceModal';
import {
  Wrench,
  Search,
  Sliders,
  Plug,
  PlugZap,
  ListOrdered,
  Layers,
  ArrowRight,
  Trash2,
  PlusCircle,
  Wind,
  Coffee,
} from 'lucide-react';
import { InjectedFault, PluggableAppliance, InjectedFaultType } from '../types/electra';

interface SimulatorViewProps {
  project: Project;
  simState: SimulationState;
  onToggleSwitch: (symbolId: string) => void;
  onToggleBreaker: (symbolId: string) => void;
  onVerifyCircuit: () => void;
  onResetSimulation: () => void;
  onUpdateProject?: (updater: (prev: Project) => Project) => void;
}

const PRESET_APPLIANCES: Array<Omit<PluggableAppliance, 'id' | 'pluggedIntoSymbolId' | 'isOn'>> = [
  {
    name: 'Caloventor Cerámico',
    category: 'calefaccion',
    powerWatts: 2000,
    powerFactor: 1.0,
    apparentAmps: 9.09,
    iconName: 'Flame',
    description: 'Resistencia calefactora forzada de alto consumo continuo (9,1 A).',
  },
  {
    name: 'Aire Acondicionado 3000 Fg',
    category: 'climatizacion',
    powerWatts: 2200,
    powerFactor: 0.85,
    apparentAmps: 11.76,
    iconName: 'Wind',
    description: 'Compresor rotativo con corriente inductiva de marcha (10,0 A).',
  },
  {
    name: 'Plancha a Vapor',
    category: 'electrodomestico',
    powerWatts: 1600,
    powerFactor: 1.0,
    apparentAmps: 7.27,
    iconName: 'Zap',
    description: 'Resistencia pura para planchado doméstico (7,3 A).',
  },
  {
    name: 'Soldadora Inverter MMA 200A',
    category: 'taller',
    powerWatts: 4500,
    powerFactor: 0.75,
    apparentAmps: 27.27,
    iconName: 'Cpu',
    description: 'Equipo de soldadura de arco. Excede la capacidad de tomas de 10A.',
  },
  {
    name: 'Pava Eléctrica Digital',
    category: 'electrodomestico',
    powerWatts: 1800,
    powerFactor: 1.0,
    apparentAmps: 8.18,
    iconName: 'Coffee',
    description: 'Hervidor de agua rápido (8,2 A). Provoca sobrecarga si coincide con caloventor.',
  },
  {
    name: 'Bomba Centrífuga 1 HP',
    category: 'motores',
    powerWatts: 1100,
    powerFactor: 0.8,
    apparentAmps: 6.25,
    iconName: 'Activity',
    description: 'Elevación de agua a tanque. Carga inductiva continua.',
  },
  {
    name: 'Horno Eléctrico Convector',
    category: 'electrodomestico',
    powerWatts: 2400,
    powerFactor: 1.0,
    apparentAmps: 10.9,
    iconName: 'Flame',
    description: 'Resistencias convectoras. Requiere toma de uso especial (TUE 20A).',
  },
];

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  project,
  simState,
  onToggleSwitch,
  onToggleBreaker,
  onVerifyCircuit,
  onResetSimulation,
  onUpdateProject,
}) => {
  const [eduModalType, setEduModalType] = useState<string | null>(null);
  const [isColorGuideOpen, setIsColorGuideOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'maniobra' | 'cargas' | 'fallas' | 'protocolo'>('maniobra');
  const [selectedOutletForPlug, setSelectedOutletForPlug] = useState<string>('');
  const [selectedApplianceTemplateIndex, setSelectedApplianceTemplateIndex] = useState<number>(0);

  const switches = project.symbols.filter((s) => s.category === 'comando');
  const lamps = project.symbols.filter((s) => s.type === 'luminaria');
  const outlets = project.symbols.filter((s) => s.type === 'tomacorriente' || s.type === 'toma_especial');

  // Artefactos de potencia y utilización (soldadoras, bombas, termotanques, etc.)
  const appliances = project.symbols.filter(
    (s) => s.category === 'utilizacion' && s.type !== 'tomacorriente' && s.type !== 'toma_especial'
  );

  // Protecciones en el plano
  const protectionsOnCanvas = project.symbols.filter(
    (s) => s.category === 'proteccion' || s.type === 'termica' || s.type === 'diferencial' || s.type === 'interruptor_general'
  );

  // Protecciones en el tablero (switchboard)
  const switchboardComps = project.switchboard?.components || [];

  // Manejo de Cargas Enchufables
  const pluggedList = project.pluggedAppliances || [];
  const injectedList = project.injectedFaults || [];
  const activeFaults = simState.activeFaults || [];

  const handlePlugAppliance = () => {
    if (!selectedOutletForPlug || !onUpdateProject) return;
    const template = PRESET_APPLIANCES[selectedApplianceTemplateIndex];
    const newApp: PluggableAppliance = {
      id: `plug_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: template.name,
      category: template.category,
      powerWatts: template.powerWatts,
      powerFactor: template.powerFactor,
      apparentAmps: template.apparentAmps,
      iconName: template.iconName,
      description: template.description,
      pluggedIntoSymbolId: selectedOutletForPlug,
      isOn: true,
    };

    onUpdateProject((prev) => ({
      ...prev,
      pluggedAppliances: [...(prev.pluggedAppliances || []), newApp],
    }));
  };

  const handleUnplugAppliance = (appId: string) => {
    if (!onUpdateProject) return;
    onUpdateProject((prev) => ({
      ...prev,
      pluggedAppliances: (prev.pluggedAppliances || []).filter((a) => a.id !== appId),
    }));
  };

  const handleToggleApplianceSwitch = (appId: string) => {
    if (!onUpdateProject) return;
    onUpdateProject((prev) => ({
      ...prev,
      pluggedAppliances: (prev.pluggedAppliances || []).map((a) =>
        a.id === appId ? { ...a, isOn: !a.isOn } : a
      ),
    }));
  };

  // Manejo de Inyección de Fallas Didácticas
  const handleToggleInjectedFault = (
    type: InjectedFaultType,
    title: string,
    description: string,
    targetCircId?: string,
    targetCompId?: string
  ) => {
    if (!onUpdateProject) return;
    onUpdateProject((prev) => {
      const existing = (prev.injectedFaults || []).find((f) => f.type === type);
      if (existing) {
        // Alternar o quitar
        return {
          ...prev,
          injectedFaults: prev.injectedFaults!.filter((f) => f.type !== type),
        };
      }
      const newFault: InjectedFault = {
        id: `inj_${Date.now()}`,
        type,
        title,
        description,
        targetCircuitId: targetCircId || prev.circuits[0]?.id || 'C1',
        targetComponentId: targetCompId,
        isSimulatedActive: true,
        leakageCurrentMa: type === 'falla_tierra_30ma' ? 35 : undefined,
        resistanceOhms: type === 'falso_contacto_borne' ? 10 : undefined,
      };
      return {
        ...prev,
        injectedFaults: [...(prev.injectedFaults || []), newFault],
      };
    });
  };

  const handleClearAllInjectedFaults = () => {
    if (!onUpdateProject) return;
    onUpdateProject((prev) => ({
      ...prev,
      injectedFaults: [],
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F6F8] dark:bg-[#0D161C] p-3 sm:p-6 text-[#18313B] dark:text-[#F1F5F9] space-y-4 sm:space-y-6 max-w-full overflow-x-hidden transition-colors duration-150">
      {/* Cabecera del Banco de Ensayos Responsiva */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#167D78] dark:text-[#2DD4BF] font-bold text-base sm:text-lg">
            <Zap className="w-5 h-5 fill-current shrink-0" />
            <h2>Banco de Pruebas y Simulación Eléctrica</h2>
          </div>
          <p className="text-xs text-[#64748B] dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Entorno interactivo en tiempo real. Maniobra protecciones (térmicas y diferencial) de forma individual, acciona interruptores y verifica el estado real de la red.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => setIsColorGuideOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#E8F5F5] dark:bg-[#167D78]/25 border border-[#B7DFDD] dark:border-[#167D78]/40 text-[#167D78] dark:text-[#2DD4BF] font-bold text-xs rounded-lg shadow-xs transition-colors"
            title="Ver código de colores IRAM 2183 / AEA 90364"
          >
            <Palette className="w-4 h-4" />
            <span>Colores IRAM</span>
          </button>
          <button
            onClick={onVerifyCircuit}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-[#167D78] hover:bg-[#0F5E5A] active:bg-[#0A4542] text-white font-bold text-xs rounded-lg shadow-xs transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Verificar Red</span>
          </button>
          <button
            onClick={() => setEduModalType('termica')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8FAFC] dark:bg-[#1B2B36] hover:bg-[#F1F5F9] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] text-[#167D78] dark:text-[#2DD4BF] text-xs rounded-lg transition-colors font-semibold"
            title="Ver catálogo educativo de componentes con normas AEA"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Guía Técnica</span>
          </button>
          <button
            onClick={onResetSimulation}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F8FAFC] dark:bg-[#1B2B36] hover:bg-[#F1F5F9] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white text-xs rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Restablecer</span>
          </button>
        </div>
      </div>

      {/* Alerta de Cortocircuito si existe */}
      {simState.hasShortCircuit && (
        <div className="bg-red-50 dark:bg-red-950/80 border-2 border-red-500 p-3.5 sm:p-4 rounded-xl flex items-start gap-3 shadow-md">
          <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-800 dark:text-red-200 text-xs sm:text-sm">
              ¡PELIGRO: CORTOCIRCUITO DIRECTO DETECTADO!
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              Existe un camino de resistencia nula entre Fase viva y Neutro sin intercalar una carga resistiva o inductiva. La protección correspondiente ha actuado de inmediato.
            </p>
            <p className="text-xs font-semibold text-red-900 dark:text-red-100 mt-1">
              👉 Acción correctiva: Revisa los cables tendidos en el editor CAD, elimina el puente incorrecto y luego podrás rearmar la térmica con un clic.
            </p>
          </div>
        </div>
      )}

      {/* Resumen de Métricas de Simulación (4 tarjetas métricas) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-3 sm:p-4 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Lámparas Encendidas</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#D99A32] dark:text-amber-400">
              {simState.activeLamps.size}
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">de {lamps.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-3 sm:p-4 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Potencia y Corriente Activa</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#167D78] dark:text-[#2DD4BF]">
              {simState.totalSimulatedCurrentAmps} A
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">
              ({(simState.totalSimulatedCurrentAmps * 220).toFixed(0)} W)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-3 sm:p-4 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Tomas Energizados</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#2563EB] dark:text-cyan-400">
              {outlets.filter((o) => o.state?.isEnergized).length}
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">de {outlets.length}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-3 sm:p-4 rounded-xl shadow-xs">
          <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400 block truncate font-medium">Cables con Corriente</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-[#18313B] dark:text-slate-200">
              {simState.energizedWires.size}
            </span>
            <span className="text-[10px] sm:text-xs text-[#64748B] dark:text-slate-500">de {project.wires.length}</span>
          </div>
        </div>
      </div>

      {/* Barra de Sub-Pestañas del Simulador Avanzado */}
      <div className="flex items-center gap-2 border-b border-[#DCE4E8] dark:border-[#243542] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('maniobra')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'maniobra'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'bg-white dark:bg-[#142028] text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white border border-[#DCE4E8] dark:border-[#243542]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Tablero & Maniobras</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cargas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'cargas'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'bg-white dark:bg-[#142028] text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white border border-[#DCE4E8] dark:border-[#243542]'
          }`}
        >
          <PlugZap className="w-4 h-4" />
          <span>Cargas Enchufables</span>
          {pluggedList.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
              {pluggedList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('fallas')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'fallas'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'bg-white dark:bg-[#142028] text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white border border-[#DCE4E8] dark:border-[#243542]'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Inyección de Fallas</span>
          {injectedList.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-black animate-pulse">
              {injectedList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('protocolo')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'protocolo'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'bg-white dark:bg-[#142028] text-[#64748B] dark:text-slate-300 hover:text-[#18313B] dark:hover:text-white border border-[#DCE4E8] dark:border-[#243542]'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Protocolo de Aislamiento</span>
          {activeFaults.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-black">
              {activeFaults.length}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: TABLERO & MANIOBRAS (IGA, ID, PIAS, INTERRUPTORES Y LÁMPARAS)
          ========================================================================= */}
      {activeSubTab === 'maniobra' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Tarjeta de Protecciones */}
          <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
              <div>
                <h3 className="font-bold text-[#18313B] dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Protecciones Eléctricas — Maniobra y Rearme Individual</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Cada interruptor controla únicamente su circuito. Puedes bajar una térmica para mantenimiento sin afectar a los demás circuitos, o rearmarla tras corregir una falla.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#167D78] dark:text-[#2DD4BF] border border-[#DCE4E8] dark:border-[#243542] shrink-0">
                Norma AEA 90364-771
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* IGA */}
              {(() => {
                const igaSym = project.symbols.find((s) => s.type === 'interruptor_general');
                const igaComp = switchboardComps.find((c) => c.type === 'iga');
                const isTripped = igaSym?.state?.isTripped || igaComp?.state === 'tripped';
                const isOpen = igaSym?.state?.isOpen === true || igaComp?.state === 'open';
                const targetId = igaSym?.id || igaComp?.id || 'iga';

                return (
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      isTripped
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-md'
                        : isOpen
                        ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        : 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                          CABECERA GENERAL
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white mt-1">
                          Interruptor General (IGA)
                        </h4>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                          Corte omnipolar general 32A (2P)
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                          isTripped
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : isOpen
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isTripped ? '¡DISPARADO!' : isOpen ? 'OFF (ABIERTO)' : 'ON (CERRADO)'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#64748B] dark:text-slate-400">
                        {isTripped ? 'Disparo por sobrecorriente' : isOpen ? 'Desconectado manualmente' : 'Alimentando tablero'}
                      </span>
                      <button
                        onClick={() => onToggleBreaker(targetId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1.5 ${
                          isTripped
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                            : isOpen
                            ? 'bg-[#167D78] hover:bg-[#0F5E5A] text-white'
                            : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isTripped ? 'Rearmar IGA' : isOpen ? 'Subir Palanca' : 'Bajar Palanca'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* ID */}
              {(() => {
                const diffSym = project.symbols.find((s) => s.type === 'diferencial');
                const diffComp = switchboardComps.find((c) => c.type === 'diferencial');
                const isTripped = diffSym?.state?.isTripped || diffComp?.state === 'tripped';
                const isOpen = diffSym?.state?.isOpen === true || diffComp?.state === 'open';
                const targetId = diffSym?.id || diffComp?.id || 'diferencial';

                return (
                  <div
                    className={`p-3.5 rounded-xl border transition-all ${
                      isTripped
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-md'
                        : isOpen
                        ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        : 'bg-blue-50/60 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 text-blue-950 dark:text-blue-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          PROTECCIÓN HUMANA
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white mt-1">
                          Disyuntor Diferencial (ID)
                        </h4>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                          Sensibilidad de fuga: 30 mA (IΔn)
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                          isTripped
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : isOpen
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {isTripped ? '¡FUGA A TIERRA!' : isOpen ? 'OFF (ABIERTO)' : 'ON (PROTEGIENDO)'}
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onToggleBreaker(targetId)}
                        className="px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-amber-950 text-[11px] font-bold shadow-xs active:scale-95 flex items-center gap-1"
                        title="Simular fuga a tierra de 30mA para verificar disparo mecánico"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-900 inline-block" />
                        <span>TEST (T)</span>
                      </button>

                      <button
                        onClick={() => onToggleBreaker(targetId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 ${
                          isTripped
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                            : isOpen
                            ? 'bg-[#167D78] hover:bg-[#0F5E5A] text-white'
                            : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isTripped ? 'Rearmar ID' : isOpen ? 'Subir Palanca' : 'Bajar Palanca'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* PIAs por Circuito */}
              {project.circuits.map((circ) => {
                const breakerSym = project.symbols.find(
                  (s) => (s.type === 'termica' || s.category === 'proteccion') && s.circuitId === circ.id
                );
                const switchComp = switchboardComps.find(
                  (c) => c.circuitId === circ.id || c.name.includes(circ.id)
                );

                const isTripped = breakerSym?.state?.isTripped || switchComp?.state === 'tripped';
                const isOpen = breakerSym?.state?.isOpen === true || switchComp?.state === 'open';
                const targetId = breakerSym?.id || switchComp?.id || circ.id;

                const circLoads = project.symbols.filter((s) => {
                  if (s.circuitId !== circ.id) return false;
                  if (s.category !== 'utilizacion' && s.type !== 'luminaria') return false;
                  return s.state?.isOn;
                });
                const circWatts = circLoads.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
                const circAmps = (circWatts / 220).toFixed(1);

                return (
                  <div
                    key={circ.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isTripped
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-md'
                        : isOpen
                        ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        : 'bg-white dark:bg-[#1A2833] border-[#DCE4E8] dark:border-[#2A3C4A]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {circ.type} ({circ.id})
                        </span>
                        <h4 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white mt-1">
                          Térmica {circ.id}: {circ.name}
                        </h4>
                        <p className="text-[11px] text-[#64748B] dark:text-slate-400">
                          Curva {circ.breakerCurve || 'C'} {circ.breakerAmps || 16}A | Conductor {circ.crossSectionMm2 || 2.5} mm²
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                          isTripped
                            ? 'bg-amber-500 text-slate-950 animate-pulse'
                            : isOpen
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {isTripped ? '¡DISPARADA!' : isOpen ? 'OFF (ABIERTA)' : 'ON (ACTIVA)'}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-[#64748B] dark:text-slate-400 flex items-center justify-between">
                      <span>Demanda actual:</span>
                      <span className="font-mono font-bold text-[#18313B] dark:text-slate-200">
                        {circAmps} A ({circWatts} W) de {circ.breakerAmps}A
                      </span>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-[#64748B] dark:text-slate-400">
                        {isTripped ? 'Disparo térmico/magnético' : isOpen ? 'Circuito seccionado' : 'Circuito energizado'}
                      </span>
                      <button
                        onClick={() => onToggleBreaker(targetId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 ${
                          isTripped
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                            : isOpen
                            ? 'bg-[#167D78] hover:bg-[#0F5E5A] text-white'
                            : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isTripped ? 'Rearmar Térmica' : isOpen ? 'Subir Palanca' : 'Bajar Palanca'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cuadrículas de Control: Interruptores y Lámparas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Interruptores */}
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-2">
                <h3 className="font-bold text-[#18313B] dark:text-slate-200 text-xs sm:text-sm flex items-center gap-2">
                  <Power className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Interruptores y Llaves de Comando</span>
                </h3>
                <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400">Toca para accionar</span>
              </div>

              {switches.length === 0 ? (
                <p className="text-xs text-[#64748B] dark:text-slate-500 py-3">No hay interruptores colocados en el plano.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {switches.map((sw: ElectricalSymbol) => {
                    const isOpen = sw.state?.isOpen !== false;
                    const isEnergized = sw.state?.isEnergized;

                    return (
                      <button
                        key={sw.id}
                        onClick={() => onToggleSwitch(sw.id)}
                        className={`p-3 rounded-lg border text-left transition-all active:scale-[0.98] flex items-center justify-between gap-2.5 ${
                          !isOpen
                            ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 border-[#167D78] text-[#167D78] dark:text-[#2DD4BF] shadow-xs'
                            : 'bg-[#F8FAFC] dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-300 hover:border-[#167D78]'
                        }`}
                      >
                        <div className="space-y-0.5 truncate">
                          <div className="font-bold text-xs text-[#18313B] dark:text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: !isOpen ? '#167D78' : '#64748b' }} />
                            <span className="truncate">{sw.label}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-slate-400 truncate max-w-[150px]">{sw.name}</div>
                          <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-500">
                            {isEnergized ? '⚡ Con potencial vivo' : '⚪ Sin tensión aguas arriba'}
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            !isOpen ? 'bg-[#167D78] text-white' : 'bg-slate-200 dark:bg-slate-800 text-[#64748B] dark:text-slate-400'
                          }`}
                        >
                          {!isOpen ? 'ON' : 'OFF'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Puntos de Luz */}
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-3 sm:space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-2">
                <h3 className="font-bold text-[#18313B] dark:text-slate-200 text-xs sm:text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-[#D99A32]" />
                  <span>Bocas de Iluminación y Lámparas</span>
                </h3>
                <span className="text-[10px] sm:text-[11px] text-[#64748B] dark:text-slate-400">Estado en vivo</span>
              </div>

              {lamps.length === 0 ? (
                <p className="text-xs text-[#64748B] dark:text-slate-500 py-3">No hay luminarias colocadas en el plano.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {lamps.map((lamp: ElectricalSymbol) => {
                    const isOn = simState.activeLamps.has(lamp.id);
                    return (
                      <div
                        key={lamp.id}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-2.5 transition-all ${
                          isOn
                            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/70 text-amber-900 dark:text-amber-100 shadow-amber-500/10 shadow-sm'
                            : 'bg-[#F8FAFC] dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#64748B] dark:text-slate-400'
                        }`}
                      >
                        <div className="space-y-0.5 truncate">
                          <div className="font-bold text-xs text-[#18313B] dark:text-white flex items-center gap-1.5 truncate">
                            <Lightbulb
                              className={`w-3.5 h-3.5 shrink-0 ${isOn ? 'text-amber-500 fill-amber-500 animate-pulse' : 'text-slate-400'}`}
                            />
                            <span className="truncate">{lamp.label}</span>
                          </div>
                          <div className="text-[11px] text-[#64748B] dark:text-slate-300 truncate max-w-[150px]">{lamp.name}</div>
                          <div className="text-[10px] font-mono text-[#64748B] dark:text-slate-400">
                            {lamp.powerWatts || 60} W ({((lamp.powerWatts || 60) / 220).toFixed(2)} A)
                          </div>
                        </div>
                        <div
                          className={`px-2 py-1 rounded text-[10px] font-bold shrink-0 ${
                            isOn ? 'bg-amber-400 text-slate-950 font-extrabold' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {isOn ? 'ENCENDIDA' : 'APAGADA'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: BANCO DE CARGAS ENCHUFABLES (ENCHUFAR / DESENCHUFAR ARTEFACTOS)
          ========================================================================= */}
      {activeSubTab === 'cargas' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
              <div>
                <h3 className="font-bold text-[#18313B] dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                  <PlugZap className="w-5 h-5 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Banco de Cargas Enchufables en Tiempo Real</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Conecta electrodomésticos reales a cualquier tomacorriente de la vivienda. Observa el consumo dinámico y comprueba cómo múltiples cargas simultáneas provocan el disparo bimetálico por sobrecarga.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#167D78] dark:text-[#2DD4BF] border border-[#DCE4E8] dark:border-[#243542] shrink-0">
                P = V · I · cos φ
              </span>
            </div>

            {/* Selector para Enchufar Nueva Carga */}
            <div className="bg-[#F8FAFC] dark:bg-[#182631] border border-[#DCE4E8] dark:border-[#243542] p-4 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-[#18313B] dark:text-slate-200 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span>Enchufar un nuevo artefacto a un tomacorriente</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-5 space-y-1">
                  <label className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">
                    Seleccionar Artefacto de Carga:
                  </label>
                  <select
                    value={selectedApplianceTemplateIndex}
                    onChange={(e) => setSelectedApplianceTemplateIndex(Number(e.target.value))}
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 font-medium"
                  >
                    {PRESET_APPLIANCES.map((p, idx) => (
                      <option key={p.name} value={idx}>
                        {p.name} — {p.powerWatts} W ({p.apparentAmps} A)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[11px] font-semibold text-[#64748B] dark:text-slate-300">
                    Tomacorriente Destino:
                  </label>
                  <select
                    value={selectedOutletForPlug}
                    onChange={(e) => setSelectedOutletForPlug(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 font-medium"
                  >
                    <option value="">-- Elige un Tomacorriente --</option>
                    {outlets.map((out) => {
                      const isEnergized = out.state?.isEnergized;
                      return (
                        <option key={out.id} value={out.id}>
                          {out.label}: {out.name} ({out.circuitId || 'Sin circ.'}) {isEnergized ? '⚡ Activo' : '⚪ Sin tensión'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    onClick={handlePlugAppliance}
                    disabled={!selectedOutletForPlug}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#167D78] hover:bg-[#0F5E5A] disabled:opacity-40 disabled:pointer-events-none text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95"
                  >
                    <Plug className="w-4 h-4" />
                    <span>Enchufar Carga</span>
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B] dark:text-slate-400 italic">
                {PRESET_APPLIANCES[selectedApplianceTemplateIndex]?.description}
              </p>
            </div>

            {/* Listado de Cargas Enchufadas */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#18313B] dark:text-slate-200">
                  Cargas Actualmente Conectadas ({pluggedList.length})
                </span>
                {pluggedList.length > 0 && (
                  <button
                    onClick={() => {
                      if (onUpdateProject) {
                        onUpdateProject((prev) => ({ ...prev, pluggedAppliances: [] }));
                      }
                    }}
                    className="text-[11px] text-red-600 dark:text-red-400 hover:underline font-semibold"
                  >
                    Desenchufar todas
                  </button>
                )}
              </div>

              {pluggedList.length === 0 ? (
                <div className="p-8 text-center bg-[#F8FAFC] dark:bg-[#142028] border border-dashed border-[#DCE4E8] dark:border-[#243542] rounded-xl text-xs text-[#64748B] dark:text-slate-400">
                  <Plug className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  No hay artefactos enchufados en este momento. Selecciona un electrodoméstico arriba para conectarlo a un toma del plano.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {pluggedList.map((app) => {
                    const socket = project.symbols.find((s) => s.id === app.pluggedIntoSymbolId);
                    const isSocketEnergized = socket?.state?.isEnergized;
                    const isDrawingPower = isSocketEnergized && app.isOn !== false && !simState.hasShortCircuit;

                    return (
                      <div
                        key={app.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isDrawingPower
                            ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            : 'bg-white dark:bg-[#182631] border-[#DCE4E8] dark:border-[#243542]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5 truncate">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {app.category}
                            </span>
                            <h5 className="font-bold text-xs text-[#18313B] dark:text-white truncate mt-1">
                              {app.name}
                            </h5>
                            <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                              Enchufado en: {socket?.label || 'Toma'} ({socket?.circuitId || 'Circuito'})
                            </p>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                              isDrawingPower
                                ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isDrawingPower ? 'CONSUMIENDO' : 'APAGADO / SIN RED'}
                          </span>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-[#167D78] dark:text-[#2DD4BF]">
                            {app.powerWatts} W ({app.apparentAmps} A)
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleApplianceSwitch(app.id)}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
                                app.isOn !== false
                                  ? 'bg-[#167D78] text-white hover:bg-[#0F5E5A]'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {app.isOn !== false ? 'Encendido' : 'Apagado'}
                            </button>
                            <button
                              onClick={() => handleUnplugAppliance(app.id)}
                              className="p-1 text-red-500 hover:text-red-700 rounded transition-colors"
                              title="Desenchufar artefacto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: INYECCIÓN DE FALLAS DIDÁCTICAS (FALLAS PARA ENTRENAMIENTO)
          ========================================================================= */}
      {activeSubTab === 'fallas' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
              <div>
                <h3 className="font-bold text-[#18313B] dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-red-500" />
                  <span>Laboratorio de Inyección de Fallas Didácticas</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Provoca anomalías controladas para aprender a diagnosticar problemas reales en obra: cortocircuitos, fugas a tierra, neutro cortado y bornes con falso contacto.
                </p>
              </div>

              {injectedList.length > 0 && (
                <button
                  onClick={handleClearAllInjectedFaults}
                  className="px-3 py-1.5 bg-red-100 dark:bg-red-950/70 hover:bg-red-200 dark:hover:bg-red-900 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg transition-colors"
                >
                  Limpiar Todas las Fallas ({injectedList.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Cortocircuito Franco */}
              {(() => {
                const isActive = injectedList.some((f) => f.type === 'cortocircuito_franco');
                return (
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-950 dark:text-red-100 shadow-sm'
                        : 'bg-white dark:bg-[#182631] border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300">
                          FALLA DE ALTA ENERGÍA
                        </span>
                        <h4 className="font-bold text-sm text-[#18313B] dark:text-white mt-1">
                          Cortocircuito Franco (Fase a Neutro)
                        </h4>
                        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                          Unión directa accidental (R = 0 Ω). Corriente instantánea Icc {'>'} 1500 A.
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          isActive ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-2">
                      👉 <strong>Efecto en el circuito:</strong> Provoca el disparo electromagnético instantáneo en menos de 20 ms del interruptor termomagnético correspondiente.
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() =>
                          handleToggleInjectedFault(
                            'cortocircuito_franco',
                            'Cortocircuito Franco L-N',
                            'Cruce directo de fase y neutro provocado didácticamente'
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isActive ? 'Eliminar Cortocircuito' : 'Inyectar Cortocircuito'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Fuga a Tierra de 35mA */}
              {(() => {
                const isActive = injectedList.some((f) => f.type === 'falla_tierra_30ma');
                return (
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-sm'
                        : 'bg-white dark:bg-[#182631] border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          PROTECCIÓN DE VIDAS
                        </span>
                        <h4 className="font-bold text-sm text-[#18313B] dark:text-white mt-1">
                          Fuga de Aislación a Tierra (35 mA)
                        </h4>
                        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                          Corriente de fuga IΔn superando el umbral de disparo del disyuntor (30 mA).
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          isActive ? 'bg-amber-500 text-slate-950 animate-pulse font-black' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-2">
                      👉 <strong>Efecto en el circuito:</strong> Provoca el disparo residual por desbalance toroidal del Interruptor Diferencial (ID) en menos de 30 ms.
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() =>
                          handleToggleInjectedFault(
                            'falla_tierra_30ma',
                            'Fuga a Tierra 35mA',
                            'Derivación residual a chasis/tierra provocada para testear el diferencial'
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isActive ? 'Eliminar Fuga a Tierra' : 'Inyectar Fuga 35 mA'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 3. Neutro Interrumpido */}
              {(() => {
                const isActive = injectedList.some((f) => f.type === 'neutro_interrumpido');
                return (
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 text-indigo-950 dark:text-indigo-100 shadow-sm'
                        : 'bg-white dark:bg-[#182631] border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                          FALLA DE RETORNO
                        </span>
                        <h4 className="font-bold text-sm text-[#18313B] dark:text-white mt-1">
                          Neutro Interrumpido / Flotante
                        </h4>
                        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                          Corte o desconexión en el conductor azul en una caja de paso de la instalación.
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          isActive ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-2">
                      👉 <strong>Efecto en el circuito:</strong> Los artefactos no encienden, el voltímetro mide 0 V entre L y N, pero el buscapolo detecta 220V en ambos bornes de la carga.
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() =>
                          handleToggleInjectedFault(
                            'neutro_interrumpido',
                            'Neutro Interrumpido',
                            'Seccionamiento intencional del cable de neutro para diagnóstico con multímetro'
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isActive ? 'Reparar Neutro' : 'Interrumpir Neutro'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 4. Borne Flojo / Resistencia de Contacto Anormal */}
              {(() => {
                const isActive = injectedList.some((f) => f.type === 'falso_contacto_borne');
                return (
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 text-amber-950 dark:text-amber-100 shadow-sm'
                        : 'bg-white dark:bg-[#182631] border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                          RIESGO TÉRMICO
                        </span>
                        <h4 className="font-bold text-sm text-[#18313B] dark:text-white mt-1">
                          Borne Flojo con Resistencia Anómala (10 Ω)
                        </h4>
                        <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                          Tornillo desajustado provocando disipación térmica y caída de tensión.
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          isActive ? 'bg-orange-500 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isActive ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-2">
                      👉 <strong>Efecto en el circuito:</strong> Caída excesiva de tensión bajo carga (ΔV {'>'} 5%), calentamiento por efecto Joule (P = I²·R) y riesgo de incendio.
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                      <button
                        onClick={() =>
                          handleToggleInjectedFault(
                            'falso_contacto_borne',
                            'Borne Flojo',
                            'Simulación de resistencia de contacto anormal en bornera'
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-orange-600 hover:bg-orange-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isActive ? 'Apretar Borne' : 'Aflojar Borne (10 Ω)'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: PROTOCOLO DE AISLAMIENTO Y DIAGNÓSTICO GUIADO
          ========================================================================= */}
      {activeSubTab === 'protocolo' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
              <div>
                <h3 className="font-bold text-[#18313B] dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Protocolo Profesional de Aislamiento y Localización de Fallas</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Procedimiento de búsqueda sistemática y resolución de averías según el disparo de protecciones de cabecera o circuito.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#167D78] dark:text-[#2DD4BF] border border-[#DCE4E8] dark:border-[#243542] shrink-0">
                5 Reglas de Oro
              </span>
            </div>

            {activeFaults.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-100">
                  Instalación en Estado Seguro y Conforme
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 max-w-lg mx-auto">
                  No se detectan cortocircuitos francos, sobrecargas en bimetales ni fugas residuales a tierra en la red simulada.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeFaults.map((fault, idx) => (
                  <div
                    key={fault.id || idx}
                    className="p-4 sm:p-5 rounded-xl border-2 border-red-400 dark:border-red-600 bg-red-50/60 dark:bg-red-950/30 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200">
                          {fault.category.toUpperCase().replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-red-950 dark:text-red-100">
                          {fault.title}
                        </h4>
                        <p className="text-xs text-red-800 dark:text-red-300">
                          {fault.faultLoopDescription}
                        </p>
                      </div>

                      {fault.trippedProtection && (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-[#182631] border border-red-300 dark:border-red-800 text-right shrink-0">
                          <span className="text-[10px] font-mono text-[#64748B] dark:text-slate-400 block">
                            Protección que actuó:
                          </span>
                          <span className="text-xs font-bold text-red-700 dark:text-red-300">
                            {fault.trippedProtection.nominalRating}
                          </span>
                          <span className="text-[10px] text-[#64748B] dark:text-slate-400 block font-mono">
                            {fault.trippedProtection.responseTimeMs} ms
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="bg-white dark:bg-[#182631] p-3.5 rounded-lg border border-red-200 dark:border-red-900/60 text-xs text-[#18313B] dark:text-slate-200 space-y-2">
                      <div className="font-bold text-[#167D78] dark:text-[#2DD4BF] flex items-center gap-1.5">
                        <ListOrdered className="w-4 h-4" />
                        <span>Pasos del Protocolo de Reparación y Aislamiento:</span>
                      </div>
                      <ul className="space-y-1.5 pl-2 text-[11px] sm:text-xs text-[#64748B] dark:text-slate-300">
                        {fault.remedySteps.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-1.5">
                            <span className="text-[#167D78] dark:text-[#2DD4BF] font-bold">✓</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Nota de Responsabilidad */}
      <div className="p-3.5 sm:p-4 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-xl text-xs text-[#64748B] dark:text-slate-400 leading-relaxed flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-[#167D78] dark:text-[#2DD4BF] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#18313B] dark:text-slate-200">Aviso técnico y educativo:</span>
          <p className="mt-0.5 text-[11px] sm:text-xs">
            El motor de simulación de ELECTRA PLAN modela continuidad topológica de grafos, maniobra individual de protecciones termomagnéticas y diferenciales, y cálculo riguroso de corrientes activas según la ley de Ohm y AEA 90364-771.
          </p>
        </div>
      </div>

      {/* Modal Educativo de Componentes */}
      {eduModalType && (
        <ComponentLearningModal
          symbolType={eduModalType}
          onClose={() => setEduModalType(null)}
        />
      )}

      {/* Modal de Código de Colores IRAM 2183 */}
      {isColorGuideOpen && (
        <WireColorReferenceModal onClose={() => setIsColorGuideOpen(false)} />
      )}
    </div>
  );
};
