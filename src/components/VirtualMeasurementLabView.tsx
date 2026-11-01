/**
 * ELECTRA PLAN — Laboratorio de Mediciones Virtual e Instrumentación (Fase 4)
 * Entorno de ensayos con instrumentos de medición profesionales interactivos:
 * 1. Multímetro Digital (Voltímetro AC/DC, Óhmetro, Comprobador de Continuidad con buzzer).
 * 2. Pinza Amperométrica de Efecto Hall / Transformador de Corriente (Medición de corriente activa y fuga).
 * 3. Comprobador de Tensión / Buscapolo Unipolar de Neón.
 * 4. Prácticas Guiadas de Medición con cálculo físico riguroso según el estado de la simulación.
 * Cumple con especificaciones de seguridad IEC 61010 (CAT III 600V).
 */
import React, { useState, useMemo } from 'react';
import {
  Activity,
  Zap,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Info,
  BookOpen,
  Volume2,
  VolumeX,
  Radio,
  Sliders,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { Project, SimulationState, ElectricalSymbol, Wire } from '../types/electra';

interface VirtualMeasurementLabViewProps {
  project: Project;
  simState: SimulationState;
}

type InstrumentType = 'multimetro' | 'pinza' | 'buscapolo';
type MultimeterScale = 'vac_750' | 'vac_200' | 'vdc_20' | 'res_200' | 'res_20k' | 'continuity';

export const VirtualMeasurementLabView: React.FC<VirtualMeasurementLabViewProps> = ({
  project,
  simState,
}) => {
  const [activeInstrument, setActiveInstrument] = useState<InstrumentType>('multimetro');
  const [multimeterScale, setMultimeterScale] = useState<MultimeterScale>('vac_750');
  const [isBuzzerEnabled, setIsBuzzerEnabled] = useState(true);

  // Puntas de prueba del Multímetro
  const [redProbeTarget, setRedProbeTarget] = useState<string>('tablero:L_OUT');
  const [blackProbeTarget, setBlackProbeTarget] = useState<string>('tablero:N_OUT');

  // Mordaza de la Pinza Amperométrica
  const [clampedWireId, setClampedWireId] = useState<string>(project.wires[0]?.id || '');
  const [clampMode, setClampMode] = useState<'single_wire' | 'both_conductors'>('single_wire');

  // Punta del Buscapolo
  const [buscapoloTarget, setBuscapoloTarget] = useState<string>('tablero:L_OUT');

  // Práctica guiada activa
  const [activeGuidedPracticeIndex, setActiveGuidedPracticeIndex] = useState<number>(0);

  // Lista de todos los puntos de prueba accesibles (bornes de componentes)
  const testPoints = useMemo(() => {
    const points: Array<{ id: string; label: string; group: string; comp: ElectricalSymbol }> = [];
    project.symbols.forEach((sym) => {
      if (sym.type === 'tablero') {
        points.push({ id: `${sym.id}:L_OUT`, label: `${sym.label}: Fase Salida Tablero (L)`, group: 'Tablero Seccional', comp: sym });
        points.push({ id: `${sym.id}:N_OUT`, label: `${sym.label}: Neutro Barra Tablero (N)`, group: 'Tablero Seccional', comp: sym });
        points.push({ id: `${sym.id}:PE_OUT`, label: `${sym.label}: Barra Puesta a Tierra (PE)`, group: 'Tablero Seccional', comp: sym });
      } else if (sym.type === 'luminaria') {
        points.push({ id: `${sym.id}:L`, label: `${sym.label}: Borne Retorno / Fase (L)`, group: 'Iluminación', comp: sym });
        points.push({ id: `${sym.id}:N`, label: `${sym.label}: Borne Neutro (N)`, group: 'Iluminación', comp: sym });
      } else if (sym.type === 'tomacorriente' || sym.type === 'toma_especial') {
        points.push({ id: `${sym.id}:L`, label: `${sym.label}: Borne Derecho (Fase L)`, group: 'Tomacorrientes', comp: sym });
        points.push({ id: `${sym.id}:N`, label: `${sym.label}: Borne Izquierdo (Neutro N)`, group: 'Tomacorrientes', comp: sym });
        points.push({ id: `${sym.id}:PE`, label: `${sym.label}: Borne Central (Tierra PE)`, group: 'Tomacorrientes', comp: sym });
      } else if (sym.category === 'comando') {
        points.push({ id: `${sym.id}:L`, label: `${sym.label}: Borne Entrada Fase (L)`, group: 'Interruptores', comp: sym });
        points.push({ id: `${sym.id}:R`, label: `${sym.label}: Borne Salida Retorno (R)`, group: 'Interruptores', comp: sym });
      } else if (sym.type === 'puesta_tierra') {
        points.push({ id: `${sym.id}:PE`, label: `${sym.label}: Jabalina PAT en Tierra (PE)`, group: 'Puesta a Tierra', comp: sym });
      }
    });
    return points;
  }, [project.symbols]);

  // =========================================================================
  // 1. CÁLCULO FÍSICO REAL PARA EL MULTÍMETRO DIGITAL
  // =========================================================================
  const multimeterReading = useMemo(() => {
    const isScaleVoltage = multimeterScale.startsWith('vac') || multimeterScale.startsWith('vdc');
    const isScaleResistance = multimeterScale.startsWith('res');
    const isScaleContinuity = multimeterScale === 'continuity';

    if (!redProbeTarget || !blackProbeTarget) {
      return { value: '0.0', unit: 'V', statusText: 'Puntas al aire', hasBuzzer: false, isOverload: false, isLiveWarning: false };
    }

    if (redProbeTarget === blackProbeTarget) {
      return {
        value: isScaleVoltage ? '0.0' : '0.0',
        unit: isScaleVoltage ? 'V' : 'Ω',
        statusText: 'Mismo punto de medición (cortocircuito de puntas)',
        hasBuzzer: isScaleContinuity,
        isOverload: false,
        isLiveWarning: false,
      };
    }

    const [redCompId, redTerm] = redProbeTarget.split(':');
    const [blackCompId, blackTerm] = blackProbeTarget.split(':');

    const redComp = project.symbols.find((s) => s.id === redCompId);
    const blackComp = project.symbols.find((s) => s.id === blackCompId);

    // Comprobar si hay potencial vivo aguas arriba (Fase)
    const isRedEnergized = Boolean(redComp?.state?.isEnergized || simState.energizedComponents.has(redCompId));
    const isBlackEnergized = Boolean(blackComp?.state?.isEnergized || simState.energizedComponents.has(blackCompId));
    const isCircuitLive = (isRedEnergized && redTerm === 'L') || (isBlackEnergized && blackTerm === 'L');

    // Comprobar disparo de protecciones
    const hasBreakerTripped = simState.hasShortCircuit || project.symbols.some((s) => s.type === 'termica' && s.state?.isTripped);

    // A. MEDICIÓN EN VOLTÍMETRO AC
    if (isScaleVoltage) {
      if (hasBreakerTripped) {
        return { value: '0.0', unit: 'V AC', statusText: 'Protección disparada (0 V)', hasBuzzer: false, isOverload: false, isLiveWarning: false };
      }

      // Medición entre Fase y Neutro
      if ((redTerm === 'L' && blackTerm === 'N') || (redTerm === 'N' && blackTerm === 'L')) {
        // Verificar si el neutro está interrumpido por falla didáctica
        const isNeutralCut = project.injectedFaults?.some((f) => f.type === 'neutro_interrumpido' && f.isSimulatedActive);
        if (isNeutralCut) {
          return { value: '0.2', unit: 'V AC', statusText: 'Neutro interrumpido: 0 V efectivo entre L y N', hasBuzzer: false, isOverload: false, isLiveWarning: false };
        }
        return { value: '221.4', unit: 'V AC', statusText: 'Tensión nominal de red normal (220 V)', hasBuzzer: false, isOverload: false, isLiveWarning: false };
      }

      // Medición entre Fase y Tierra PE
      if ((redTerm === 'L' && blackTerm === 'PE') || (redTerm === 'PE' && blackTerm === 'L')) {
        const hasGround = project.symbols.some((s) => s.type === 'puesta_tierra');
        if (!hasGround) {
          return { value: '14.8', unit: 'V AC', statusText: 'Tensión espuria capacitiva: Tierra flotante sin jabalina', hasBuzzer: false, isOverload: false, isLiveWarning: false };
        }
        return { value: '220.8', unit: 'V AC', statusText: 'Tensión Fase-Tierra correcta (220 V)', hasBuzzer: false, isOverload: false, isLiveWarning: false };
      }

      // Medición entre Neutro y Tierra PE
      if ((redTerm === 'N' && blackTerm === 'PE') || (redTerm === 'PE' && blackTerm === 'N')) {
        return { value: '1.2', unit: 'V AC', statusText: 'Caída de tensión residual de retorno en neutro (< 3V conforme)', hasBuzzer: false, isOverload: false, isLiveWarning: false };
      }

      // Medición en bornes de interruptor (L y R)
      if (redCompId === blackCompId && redComp?.category === 'comando') {
        const isOpen = redComp.state?.isOpen !== false;
        if (isOpen) {
          return { value: '220.0', unit: 'V AC', statusText: 'Contacto abierto: Tensión plena presente entre contactos', hasBuzzer: false, isOverload: false, isLiveWarning: false };
        } else {
          return { value: '0.0', unit: 'V AC', statusText: 'Contacto cerrado: Caída de tensión nula a través del puente', hasBuzzer: false, isOverload: false, isLiveWarning: false };
        }
      }

      return { value: '0.0', unit: 'V AC', statusText: 'Puntos equipotenciales o sin tensión', hasBuzzer: false, isOverload: false, isLiveWarning: false };
    }

    // B. MEDICIÓN EN CONTINUIDAD O RESISTENCIA (Requiere circuito desenergizado)
    if (isScaleContinuity || isScaleResistance) {
      if (isCircuitLive) {
        return {
          value: 'ERROR',
          unit: '',
          statusText: '¡PELIGRO! Tensión detectada en bornes. Desenergiza la térmica antes de medir Ohms o continuidad.',
          hasBuzzer: false,
          isOverload: true,
          isLiveWarning: true,
        };
      }

      // Prueba de continuidad en el mismo componente (ej. Interruptor L y R)
      if (redCompId === blackCompId && redComp?.category === 'comando') {
        const isOpen = redComp.state?.isOpen !== false;
        if (!isOpen) {
          // Contacto CERRADO -> 0.1 ohm + BEEP
          return { value: '0.1', unit: 'Ω', statusText: 'Continuidad comprobada (Contacto CERRADO)', hasBuzzer: isBuzzerEnabled, isOverload: false, isLiveWarning: false };
        } else {
          // Contacto ABIERTO -> O.L
          return { value: 'O.L', unit: 'MΩ', statusText: 'Circuito abierto (Contacto ABIERTO)', hasBuzzer: false, isOverload: true, isLiveWarning: false };
        }
      }

      // Medición de resistencia de filamento de luminaria (P = 60W -> R = V²/P = 220²/60 = 806 Ω)
      if (redCompId === blackCompId && redComp?.type === 'luminaria') {
        const pWatts = redComp.powerWatts || 60;
        const res = Math.round((220 * 220) / pWatts);
        return { value: `${res}`, unit: 'Ω', statusText: `Resistencia interna de carga (${pWatts} W)`, hasBuzzer: false, isOverload: false, isLiveWarning: false };
      }

      // Si los bornes están unidos directamente por un cable
      const isDirectWire = project.wires.some(
        (w) =>
          (w.fromComponentId === redCompId && w.fromTerminalId === redTerm && w.toComponentId === blackCompId && w.toTerminalId === blackTerm) ||
          (w.toComponentId === redCompId && w.toTerminalId === redTerm && w.fromComponentId === blackCompId && w.fromTerminalId === blackTerm)
      );

      if (isDirectWire) {
        return { value: '0.2', unit: 'Ω', statusText: 'Continuidad de conductor de cobre perfecta (< 1 Ω)', hasBuzzer: isBuzzerEnabled, isOverload: false, isLiveWarning: false };
      }

      return { value: 'O.L', unit: '', statusText: 'Sin continuidad eléctrica (Lazo abierto)', hasBuzzer: false, isOverload: true, isLiveWarning: false };
    }

    return { value: '0.0', unit: 'V', statusText: 'Listo para medir', hasBuzzer: false, isOverload: false, isLiveWarning: false };
  }, [redProbeTarget, blackProbeTarget, multimeterScale, project, simState, isBuzzerEnabled]);

  // =========================================================================
  // 2. CÁLCULO FÍSICO REAL PARA LA PINZA AMPEROMÉTRICA
  // =========================================================================
  const clampReading = useMemo(() => {
    if (!clampedWireId) return { currentA: '0.00', statusText: 'Pinza abierta sin abrazar conductor', isZeroDueToCancellation: false };

    const wire = project.wires.find((w) => w.id === clampedWireId);
    if (!wire) return { currentA: '0.00', statusText: 'Conductor no encontrado', isZeroDueToCancellation: false };

    // Si el usuario abraza AMBOS conductores (Fase y Neutro juntos)
    if (clampMode === 'both_conductors') {
      return {
        currentA: '0.00',
        statusText: '0.00 A: Cancelación vectorial de campos magnéticos opuestos (Ifase + Ineutro = 0). ¡Regla de oro: abrazar un solo conductor!',
        isZeroDueToCancellation: true,
      };
    }

    // Si la protección está disparada o abierta, corriente = 0
    if (simState.hasShortCircuit) {
      return { currentA: '0.00', statusText: 'Circuito desenergizado por disparo de protección (0 A)', isZeroDueToCancellation: false };
    }

    // Corriente del circuito al que pertenece el cable
    const circId = wire.circuitId || 'C1';
    const circLoads = project.symbols.filter(
      (s) => s.circuitId === circId && (s.category === 'utilizacion' || s.type === 'luminaria') && s.state?.isOn
    );
    const totalWatts = circLoads.reduce((sum, s) => sum + (s.powerWatts || 0), 0);

    // Sumar artefactos enchufados activos en tomas de ese circuito
    const pluggedWatts = (project.pluggedAppliances || [])
      .filter((app) => {
        if (!app.pluggedIntoSymbolId || app.isOn === false) return false;
        const socket = project.symbols.find((s) => s.id === app.pluggedIntoSymbolId);
        return socket && socket.circuitId === circId;
      })
      .reduce((sum, a) => sum + (a.powerWatts || 0), 0);

    const activeWatts = totalWatts + pluggedWatts;
    const currentA = (activeWatts / 220).toFixed(2);

    return {
      currentA,
      statusText: `Medición de corriente activa en conductor de circuito ${circId} (${activeWatts} W activos).`,
      isZeroDueToCancellation: false,
    };
  }, [clampedWireId, clampMode, project, simState]);

  // =========================================================================
  // 3. CÁLCULO FÍSICO REAL PARA EL BUSCAPOLO UNIPOLAR
  // =========================================================================
  const buscapoloReading = useMemo(() => {
    if (!buscapoloTarget) return { isLit: false, voltageDetected: '0 V', label: 'Sin contacto' };

    const [compId, term] = buscapoloTarget.split(':');
    const comp = project.symbols.find((s) => s.id === compId);
    const isEnergized = Boolean(comp?.state?.isEnergized || simState.energizedComponents.has(compId));

    // Si la protección está disparada, no hay fase viva
    if (simState.hasShortCircuit) {
      return { isLit: false, voltageDetected: '0 V', label: 'Sin tensión (Protección disparada)' };
    }

    if (term === 'L' && isEnergized) {
      return { isLit: true, voltageDetected: '220 V AC', label: '¡FASE VIVA DETECTADA! Lámpara de neón encendida.' };
    }

    if (term === 'R' && isEnergized && comp?.state?.isOpen === false) {
      return { isLit: true, voltageDetected: '220 V AC', label: '¡FASE DETECTADA EN RETORNO! Interruptor cerrado.' };
    }

    if (term === 'N') {
      // Caso didáctico especial: Si el neutro está interrumpido, el buscapolo enciende en el neutro a través del filamento
      const isNeutralCut = project.injectedFaults?.some((f) => f.type === 'neutro_interrumpido' && f.isSimulatedActive);
      if (isNeutralCut && isEnergized) {
        return { isLit: true, voltageDetected: '220 V AC Flotante', label: '¡PELIGRO: NEUTRO CON TENSIÓN! Neutro cortado aguas arriba.' };
      }
      return { isLit: false, voltageDetected: '0 V (Potencial Neutro)', label: 'Neutro de referencia (Lámpara de neón apagada).' };
    }

    if (term === 'PE') {
      return { isLit: false, voltageDetected: '0 V (Equipotencial Tierra)', label: 'Conductor de Protección a Tierra (Neón apagado).' };
    }

    return { isLit: false, voltageDetected: '0 V', label: 'Sin diferencia de potencial detectable' };
  }, [buscapoloTarget, project, simState]);

  // =========================================================================
  // 4. GUÍA DE PRÁCTICAS PEDAGÓGICAS CON INSTRUMENTOS
  // =========================================================================
  const GUIDED_PRACTICES = [
    {
      title: 'Práctica 1: Medición de Tensión de Servicio (Fase vs Neutro vs Tierra)',
      instrument: 'multimetro',
      objective: 'Verificar la tensión de 220V entre L y N, 220V entre L y PE, y menos de 3V entre N y PE.',
      steps: [
        '1. Selecciona el Multímetro en escala VAC 750V.',
        '2. Conecta la Punta Roja (+) en "Tablero: Fase Salida (L)".',
        '3. Conecta la Punta Negra (-) en "Tablero: Neutro Barra (N)".',
        '4. Observa el valor: Debe medir exactamente 220 V AC.',
        '5. Pasa la Punta Negra a "Barra Tierra PE": Debe medir 220 V.',
      ],
      setupAction: () => {
        setActiveInstrument('multimetro');
        setMultimeterScale('vac_750');
        setRedProbeTarget('tablero:L_OUT');
        setBlackProbeTarget('tablero:N_OUT');
      },
    },
    {
      title: 'Práctica 2: El Error Típico con la Pinza Amperométrica',
      instrument: 'pinza',
      objective: 'Comprender por qué una pinza amperométrica indica 0.00 A si abraza fase y neutro juntos.',
      steps: [
        '1. Selecciona la Pinza Amperométrica.',
        '2. Elige un cable del circuito C1 o C2 con cargas encendidas.',
        '3. Cambia el modo a "Abrazar Fase y Neutro simultáneamente".',
        '4. Observa la pantalla: Medirá 0.00 A debido a que los flujos magnéticos opuestos se cancelan.',
        '5. Vuelve al modo "Abrazar un solo conductor": Medirá la corriente real en amperes.',
      ],
      setupAction: () => {
        setActiveInstrument('pinza');
        setClampMode('both_conductors');
      },
    },
    {
      title: 'Práctica 3: Detección de Neutro Cortado con Buscapolo',
      instrument: 'buscapolo',
      objective: 'Aprender cómo diagnosticar un neutro cortado cuando los artefactos no encienden.',
      steps: [
        '1. Selecciona el Buscapolo.',
        '2. Toca el borne de Fase (L): Se enciende la luz de neón roja.',
        '3. Toca el borne de Neutro (N) normal: Permanece apagada.',
        '4. Si inyectas la falla "Neutro Interrumpido", el buscapolo encenderá en el borne de neutro del artefacto a través del filamento.',
      ],
      setupAction: () => {
        setActiveInstrument('buscapolo');
        setBuscapoloTarget('tablero:L_OUT');
      },
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F8] dark:bg-[#0D161C] text-[#18313B] dark:text-[#F1F5F9] transition-colors">
      {/* Cabecera del Laboratorio */}
      <div className="bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] border border-[#B7DFDD] dark:border-[#167D78]/40">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#18313B] dark:text-white flex items-center gap-2">
              <span>Laboratorio de Mediciones Virtual</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-300 dark:border-cyan-800">
                CAT III 600V IEC 61010
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Instrumentos virtuales con cálculo físico en tiempo real conectado al circuito simulado.
            </p>
          </div>
        </div>

        {/* Selector de Instrumento Activo */}
        <div className="flex items-center gap-1.5 bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveInstrument('multimetro')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeInstrument === 'multimetro'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            Multímetro Digital
          </button>
          <button
            onClick={() => setActiveInstrument('pinza')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeInstrument === 'pinza'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            Pinza Amperométrica
          </button>
          <button
            onClick={() => setActiveInstrument('buscapolo')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeInstrument === 'buscapolo'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            Buscapolo / Detector
          </button>
        </div>
      </div>

      {/* Cuerpo Principal del Laboratorio */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* =========================================================================
              COLUMNA IZQUIERDA: EL INSTRUMENTO VIRTUAL INTERACTIVO
              ========================================================================= */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. MULTÍMETRO DIGITAL */}
            {activeInstrument === 'multimetro' && (
              <div className="bg-slate-900 border-4 border-amber-500 rounded-3xl p-6 shadow-2xl text-white space-y-6 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">ELECTRA INSTRUMENTS</span>
                    <h3 className="font-extrabold text-sm text-white">DMM-90364 TRUE RMS</h3>
                  </div>
                  <button
                    onClick={() => setIsBuzzerEnabled(!isBuzzerEnabled)}
                    className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 ${
                      isBuzzerEnabled ? 'border-amber-400 text-amber-400 bg-amber-400/10' : 'border-slate-700 text-slate-500'
                    }`}
                    title="Activar/Desactivar zumbador acústico de continuidad"
                  >
                    {isBuzzerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span>Buzzer</span>
                  </button>
                </div>

                {/* Display LCD Digital Retroiluminado */}
                <div className="bg-[#a3b18a] text-slate-950 p-4 rounded-xl font-mono text-right shadow-inner border-2 border-slate-800 relative">
                  <div className="flex justify-between text-[10px] font-bold text-slate-800 uppercase">
                    <span>{multimeterScale.toUpperCase().replace('_', ' ')}</span>
                    <span>{multimeterReading.hasBuzzer ? '🔊 BEEP' : 'AUTO-HOLD'}</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black tracking-tight my-1">
                    {multimeterReading.value}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {multimeterReading.unit}
                  </div>

                  {multimeterReading.isLiveWarning && (
                    <div className="mt-1 p-1 bg-red-600 text-white text-[10px] font-bold text-center rounded animate-pulse">
                      ⚡ ¡ALERTA: TENSIÓN VIVA EN ESCALA DE OHMIOS!
                    </div>
                  )}
                </div>

                {/* Selector Giratorio de Escala */}
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400 font-semibold block text-center uppercase tracking-wider">
                    Selector Giratorio de Función:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setMultimeterScale('vac_750')}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        multimeterScale === 'vac_750'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      750 V ~ (AC)
                    </button>
                    <button
                      onClick={() => setMultimeterScale('vac_200')}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        multimeterScale === 'vac_200'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      200 V ~ (AC)
                    </button>
                    <button
                      onClick={() => setMultimeterScale('vdc_20')}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        multimeterScale === 'vdc_20'
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-extrabold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      20 V ⎓ (DC)
                    </button>
                    <button
                      onClick={() => setMultimeterScale('continuity')}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        multimeterScale === 'continuity'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-extrabold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      🔊 Continuidad
                    </button>
                    <button
                      onClick={() => setMultimeterScale('res_200')}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        multimeterScale === 'res_200'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-extrabold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      200 Ω (Ohms)
                    </button>
                    <button
                      onClick={() => setMultimeterScale('res_20k')}
                      className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                        multimeterScale === 'res_20k'
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-extrabold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      20 kΩ (Ohms)
                    </button>
                  </div>
                </div>

                {/* Explicación Técnica en Vivo del Valor Medido */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-amber-400 block text-[10px] uppercase">Diagnóstico Físico:</span>
                  <p className="leading-relaxed">{multimeterReading.statusText}</p>
                </div>
              </div>
            )}

            {/* 2. PINZA AMPEROMÉTRICA */}
            {activeInstrument === 'pinza' && (
              <div className="bg-slate-900 border-4 border-red-600 rounded-3xl p-6 shadow-2xl text-white space-y-6 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider block">ELECTRA MEASURE</span>
                    <h3 className="font-extrabold text-sm text-white">PINZA AMPEROMÉTRICA 400A</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-800">
                    Efecto Hall
                  </span>
                </div>

                {/* Mordaza Gráfica */}
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-center space-y-2">
                  <div className="inline-block p-4 border-4 border-red-500 rounded-full border-t-transparent animate-pulse">
                    <span className="text-2xl font-bold font-mono text-red-400">⚡ ⭕</span>
                  </div>
                  <p className="text-xs text-slate-300 font-semibold">
                    Mordaza Inductiva Abrazando:
                  </p>
                  <p className="text-[11px] font-mono text-cyan-300">
                    {project.wires.find((w) => w.id === clampedWireId)?.id || 'Conductor'} ({project.wires.find((w) => w.id === clampedWireId)?.type.toUpperCase()})
                  </p>
                </div>

                {/* Display LCD Digital */}
                <div className="bg-[#a3b18a] text-slate-950 p-4 rounded-xl font-mono text-right shadow-inner border-2 border-slate-800">
                  <div className="flex justify-between text-[10px] font-bold text-slate-800 uppercase">
                    <span>AC CURRENT (50 Hz)</span>
                    <span>RMS</span>
                  </div>
                  <div className="text-4xl sm:text-5xl font-black tracking-tight my-1">
                    {clampReading.currentA}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    A (Amperes)
                  </div>
                </div>

                {/* Selector de Modo de Abrazo */}
                <div className="space-y-2">
                  <label className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                    Modo de Abrazo con la Mordaza:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setClampMode('single_wire')}
                      className={`p-2.5 rounded-lg text-xs font-bold border transition-all ${
                        clampMode === 'single_wire'
                          ? 'bg-red-600 text-white border-red-500 shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      1 Solo Conductor (Reglamentario)
                    </button>
                    <button
                      onClick={() => setClampMode('both_conductors')}
                      className={`p-2.5 rounded-lg text-xs font-bold border transition-all ${
                        clampMode === 'both_conductors'
                          ? 'bg-red-600 text-white border-red-500 shadow-md'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      Fase + Neutro Juntos (Error Típico)
                    </button>
                  </div>
                </div>

                {/* Explicación Técnica */}
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-red-400 block text-[10px] uppercase">Principio Electromagnético:</span>
                  <p className="leading-relaxed">{clampReading.statusText}</p>
                </div>
              </div>
            )}

            {/* 3. BUSCAPOLO UNIPOLAR DE NEÓN */}
            {activeInstrument === 'buscapolo' && (
              <div className="bg-slate-900 border-4 border-amber-400 rounded-3xl p-6 shadow-2xl text-white space-y-6 max-w-md mx-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">ELECTRA TESTER</span>
                    <h3 className="font-extrabold text-sm text-white">COMPROBADOR UNIPOLAR DE TENSIÓN</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800">
                    Neón 100-250V
                  </span>
                </div>

                {/* Representación Visual del Buscapolo */}
                <div className="p-6 bg-slate-800/80 rounded-2xl border border-slate-700 flex flex-col items-center justify-center space-y-4">
                  <div className="flex items-center gap-3">
                    {/* Mango transparente con lámpara de neón */}
                    <div
                      className={`w-16 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                        buscapoloReading.isLit
                          ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/50'
                          : 'bg-slate-800 border-slate-600'
                      }`}
                    >
                      <div
                        className={`w-6 h-10 rounded-full transition-all ${
                          buscapoloReading.isLit
                            ? 'bg-amber-400 shadow-lg shadow-amber-400 animate-pulse'
                            : 'bg-slate-700'
                        }`}
                      />
                      <span className="text-[9px] font-mono mt-2 text-slate-400">NEÓN</span>
                    </div>

                    {/* Vástago metálico de prueba */}
                    <div className="h-1.5 w-24 bg-slate-300 rounded-r shadow-xs" />
                  </div>

                  <div className="text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        buscapoloReading.isLit
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {buscapoloReading.isLit ? '⚡ LUZ ENCENDIDA (FASE VIVA)' : '⚪ LUZ APAGADA'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs text-slate-300 space-y-1">
                  <span className="font-bold text-amber-400 block text-[10px] uppercase">Resultado de Contacto:</span>
                  <p className="leading-relaxed">{buscapoloReading.label}</p>
                </div>
              </div>
            )}
          </div>

          {/* =========================================================================
              COLUMNA DERECHA: PUNTOS DE CONEXIÓN Y PRÁCTICAS GUIADAS
              ========================================================================= */}
          <div className="lg:col-span-5 space-y-4">
            {/* Panel de Selección de Terminales a Medir */}
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-4 shadow-xs">
              <h3 className="font-bold text-sm text-[#18313B] dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span>Puntos de Contacto de las Puntas de Prueba</span>
              </h3>

              {activeInstrument === 'multimetro' && (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      <span>Punta Roja (+ Positivo / Fase / Medición):</span>
                    </label>
                    <select
                      value={redProbeTarget}
                      onChange={(e) => setRedProbeTarget(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#182631] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 font-medium"
                    >
                      {testPoints.map((tp) => (
                        <option key={`red_${tp.id}`} value={tp.id}>
                          [{tp.group}] {tp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-900 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-950 dark:bg-slate-500 inline-block" />
                      <span>Punta Negra (- COM / Neutro / Referencia):</span>
                    </label>
                    <select
                      value={blackProbeTarget}
                      onChange={(e) => setBlackProbeTarget(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#182631] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 font-medium"
                    >
                      {testPoints.map((tp) => (
                        <option key={`black_${tp.id}`} value={tp.id}>
                          [{tp.group}] {tp.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeInstrument === 'pinza' && (
                <div className="space-y-3 text-xs">
                  <label className="text-[11px] font-bold text-[#18313B] dark:text-slate-200 block mb-1">
                    Seleccionar Conductor a Abrazar con la Mordaza:
                  </label>
                  <select
                    value={clampedWireId}
                    onChange={(e) => setClampedWireId(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#182631] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 font-medium"
                  >
                    {project.wires.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.id}: {w.type.toUpperCase()} ({w.circuitId || 'General'}) — {w.crossSectionMm2 || 2.5} mm²
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeInstrument === 'buscapolo' && (
                <div className="space-y-3 text-xs">
                  <label className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-1">
                    Punto de Contacto de la Punta del Buscapolo:
                  </label>
                  <select
                    value={buscapoloTarget}
                    onChange={(e) => setBuscapoloTarget(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#182631] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 font-medium"
                  >
                    {testPoints.map((tp) => (
                      <option key={`busca_${tp.id}`} value={tp.id}>
                        [{tp.group}] {tp.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Prácticas Guiadas de Medición */}
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-2">
                <h3 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Prácticas de Medición Guiadas</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {activeGuidedPracticeIndex + 1} de {GUIDED_PRACTICES.length}
                </span>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {GUIDED_PRACTICES[activeGuidedPracticeIndex].title}
                </h4>
                <p className="text-xs text-[#64748B] dark:text-slate-400">
                  {GUIDED_PRACTICES[activeGuidedPracticeIndex].objective}
                </p>

                <div className="bg-[#F8FAFC] dark:bg-[#182631] p-3 rounded-lg border border-[#DCE4E8] dark:border-[#243542] space-y-1 text-xs">
                  <span className="font-bold text-[#167D78] dark:text-[#2DD4BF] block text-[11px]">Procedimiento:</span>
                  {GUIDED_PRACTICES[activeGuidedPracticeIndex].steps.map((st, i) => (
                    <p key={i} className="text-[#64748B] dark:text-slate-300 text-[11px] leading-relaxed">
                      {st}
                    </p>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={GUIDED_PRACTICES[activeGuidedPracticeIndex].setupAction}
                    className="px-3 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <span>Configurar Instrumento</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveGuidedPracticeIndex((prev) => (prev > 0 ? prev - 1 : GUIDED_PRACTICES.length - 1))}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setActiveGuidedPracticeIndex((prev) => (prev < GUIDED_PRACTICES.length - 1 ? prev + 1 : 0))}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-700"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
