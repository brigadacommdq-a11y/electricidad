/**
 * ELECTRA PLAN — Módulo de Electricidad Industrial y Maquinarias de Taller (Fase 7)
 * Simulador y calculador interactivo de equipamiento industrial:
 * 1. Motores Trifásicos Asíncronos: Potencia kW/HP, corriente In, arranque directo con contactor y relé térmico.
 * 2. Automatización de Bombas de Agua con Flotantes Eléctricos en 24V (Cisterna y Tanque).
 * 3. Máquinas de Soldar: Ciclo de trabajo (factor de marcha), curvas térmicas y alimentación.
 * 4. Corrección de Factor de Potencia (cos φ) y cálculo de Baterías de Capacitores (kVAR).
 * Conforme a normas IRAM 2183, IEC 60947 (Aparamenta de baja tensión) y AEA 90364-771.
 */
import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Power,
  RotateCw,
  Activity,
  Flame,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Info,
  Sliders,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { Project } from '../types/electra';

interface IndustrialWorkshopViewProps {
  project: Project;
}

export type IndustrialSubTab = 'motor_arranque' | 'bomba_automatica' | 'soldadora_taller' | 'factor_potencia';

export const IndustrialWorkshopView: React.FC<IndustrialWorkshopViewProps> = ({ project }) => {
  const [activeSubTab, setActiveSubTab] = useState<IndustrialSubTab>('motor_arranque');

  // =========================================================================
  // 1. ESTADO DEL SIMULADOR DE MOTOR Y ARRANQUE DIRECTO
  // =========================================================================
  const [motorHP, setMotorHP] = useState<number>(5.5); // 5.5 HP (4 kW)
  const [motorVoltage, setMotorVoltage] = useState<number>(380);
  const [motorCosPhi, setMotorCosPhi] = useState<number>(0.84);
  const [motorEfficiency, setMotorEfficiency] = useState<number>(0.87);
  const [isMotorContactorClosed, setIsMotorContactorClosed] = useState<boolean>(false);
  const [isThermalRelayTripped, setIsThermalRelayTripped] = useState<boolean>(false);

  // Cálculos del motor trifásico
  const motorKW = Number((motorHP * 0.7457).toFixed(2));
  // In = P_watts / (sqrt(3) * V * cos phi * eta)
  const motorNominalAmps = useMemo(() => {
    const pWatts = motorKW * 1000;
    const denom = Math.sqrt(3) * motorVoltage * motorCosPhi * motorEfficiency;
    return Number((pWatts / denom).toFixed(1));
  }, [motorKW, motorVoltage, motorCosPhi, motorEfficiency]);

  const motorStartingAmps = Number((motorNominalAmps * 6.2).toFixed(1)); // Ia/In approx 6.2
  const contactorRating = Math.ceil(motorNominalAmps * 1.25);
  const thermalRelaySetting = motorNominalAmps;

  // Maniobra Marcha / Parada del contactor
  const handleStartMotor = () => {
    if (isThermalRelayTripped) return;
    setIsMotorContactorClosed(true);
  };

  const handleStopMotor = () => {
    setIsMotorContactorClosed(false);
  };

  const handleTripThermalRelay = () => {
    setIsThermalRelayTripped(true);
    setIsMotorContactorClosed(false);
  };

  const handleResetThermalRelay = () => {
    setIsThermalRelayTripped(false);
  };

  // =========================================================================
  // 2. ESTADO DEL SISTEMA DE BOMBEO AUTOMÁTICO (CISTERNA Y TANQUE)
  // =========================================================================
  const [pumpMode, setPumpMode] = useState<'auto' | 'manual' | 'off'>('auto');
  const [isCisternaFull, setIsCisternaFull] = useState<boolean>(true); // Tiene agua la cisterna
  const [isTanqueDemandingWater, setIsTanqueDemandingWater] = useState<boolean>(true); // Tanque bajo de agua

  const isPumpRunning = useMemo(() => {
    if (pumpMode === 'off') return false;
    if (pumpMode === 'manual') return isCisternaFull; // Manual respeta seguridad por falta de agua
    // Modo automático: requiere agua en cisterna Y demanda en tanque
    return isCisternaFull && isTanqueDemandingWater;
  }, [pumpMode, isCisternaFull, isTanqueDemandingWater]);

  // =========================================================================
  // 3. ESTADO DE SOLDADORA DE TALLER & CICLO DE TRABAJO
  // =========================================================================
  const [welderType, setWelderType] = useState<'inverter' | 'transformador'>('inverter');
  const [weldingCurrentA, setWeldingCurrentA] = useState<number>(160);

  // Ciclo de trabajo según amperaje: X% = (I_nominal / I_set)^2 * X_nominal
  const dutyCyclePercent = useMemo(() => {
    if (welderType === 'inverter') {
      // 200A al 60%
      if (weldingCurrentA <= 155) return 100;
      if (weldingCurrentA >= 200) return 60;
      return Math.round(60 * Math.pow(200 / weldingCurrentA, 2));
    } else {
      // Transformador tradicional: más pesado, menor rendimiento
      if (weldingCurrentA <= 110) return 100;
      if (weldingCurrentA >= 200) return 35;
      return Math.round(35 * Math.pow(200 / weldingCurrentA, 2));
    }
  }, [welderType, weldingCurrentA]);

  const welderEffectivePrimaryAmps = useMemo(() => {
    // Corriente eficaz en el enchufe 220V: I1eff = I1max * sqrt(X)
    const pApparentKVA = (weldingCurrentA * 26) / (welderType === 'inverter' ? 0.85 : 0.65) / 1000;
    const maxAmps = (pApparentKVA * 1000) / 220;
    const dutyRatio = dutyCyclePercent / 100;
    return Number((maxAmps * Math.sqrt(dutyRatio)).toFixed(1));
  }, [weldingCurrentA, welderType, dutyCyclePercent]);

  // =========================================================================
  // 4. COMPENSACIÓN DE FACTOR DE POTENCIA (cos φ)
  // =========================================================================
  const [activePowerKW, setActivePowerKW] = useState<number>(15);
  const [initialCosPhi, setInitialCosPhi] = useState<number>(0.72);
  const [targetCosPhi, setTargetCosPhi] = useState<number>(0.95);

  const capacitorKVAR = useMemo(() => {
    // Q_c = P * (tan phi_1 - tan phi_2)
    const phi1 = Math.acos(initialCosPhi);
    const phi2 = Math.acos(targetCosPhi);
    const tan1 = Math.tan(phi1);
    const tan2 = Math.tan(phi2);
    const q = activePowerKW * (tan1 - tan2);
    return Math.max(0, Number(q.toFixed(2)));
  }, [activePowerKW, initialCosPhi, targetCosPhi]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F8] dark:bg-[#0D161C] text-[#18313B] dark:text-[#F1F5F9] transition-colors">
      {/* Cabecera del Módulo Industrial */}
      <div className="bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#18313B] dark:text-white flex items-center gap-2">
              <span>Electricidad Industrial & Maquinarias de Taller</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/70 text-orange-800 dark:text-orange-300 font-bold border border-orange-300 dark:border-orange-800">
                Fuerza Motriz 380V
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Motores asíncronos, arranque con contactor, bombas automáticas en 24V, soldadoras y corrección de cos φ.
            </p>
          </div>
        </div>

        {/* Subpestañas del Módulo Industrial */}
        <div className="flex items-center gap-1.5 bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] p-1 rounded-xl text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('motor_arranque')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'motor_arranque'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            Motor & Arranque Directo
          </button>
          <button
            onClick={() => setActiveSubTab('bomba_automatica')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'bomba_automatica'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            Bomba & Flotantes 24V
          </button>
          <button
            onClick={() => setActiveSubTab('soldadora_taller')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'soldadora_taller'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            Soldadoras & Ciclo Marcha
          </button>
          <button
            onClick={() => setActiveSubTab('factor_potencia')}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              activeSubTab === 'factor_potencia'
                ? 'bg-[#167D78] text-white shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
            }`}
          >
            Compensación cos φ
          </button>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* =========================================================================
            SUBTAB 1: MOTOR TRIFÁSICO & ARRANQUE DIRECTO (CONTACTOR + RELÉ TÉRMICO)
            ========================================================================= */}
        {activeSubTab === 'motor_arranque' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Panel de Configuración de Motor */}
            <div className="lg:col-span-5 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 rounded-2xl shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-[#18313B] dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span>Parámetros de Placa del Motor Trifásico</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">
                    Potencia Mecánica: <strong>{motorHP} HP ({motorKW} kW)</strong>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={motorHP}
                    onChange={(e) => setMotorHP(Number(e.target.value))}
                    className="w-full accent-[#167D78]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">Tensión Nominal:</label>
                    <select
                      value={motorVoltage}
                      onChange={(e) => setMotorVoltage(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                    >
                      <option value={380}>3x380 V (Estrella Y)</option>
                      <option value={220}>3x220 V (Triángulo Δ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">Factor cos φ:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.7"
                      max="0.95"
                      value={motorCosPhi}
                      onChange={(e) => setMotorCosPhi(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-600 dark:text-slate-400 font-medium block mb-1">Rendimiento Motor (η):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.75"
                    max="0.95"
                    value={motorEfficiency}
                    onChange={(e) => setMotorEfficiency(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                  />
                </div>
              </div>

              {/* Ficha Técnica Calculada */}
              <div className="p-4 bg-[#F8FAFC] dark:bg-[#182631] rounded-xl border border-[#DCE4E8] dark:border-[#243542] space-y-2 text-xs">
                <span className="font-bold text-[#167D78] dark:text-[#2DD4BF] text-[11px] uppercase block">
                  Cálculo de Aparamenta (IEC 60947):
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Corriente Nominal (In):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{motorNominalAmps} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pico de Arranque (Ia ≈ 6.2 In):</span>
                  <span className="font-mono font-bold text-amber-600">{motorStartingAmps} A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contactor recomendado (AC-3):</span>
                  <span className="font-mono font-bold text-[#167D78] dark:text-[#2DD4BF]">Categoría AC-3 ({contactorRating} A)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Regulación Relé Térmico:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">Ajuste a {thermalRelaySetting} A</span>
                </div>
              </div>
            </div>

            {/* Simulador Interactivo del Tablero de Arranque Directo */}
            <div className="lg:col-span-7 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 rounded-2xl shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
                <h3 className="font-bold text-sm text-[#18313B] dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <span>Tablero de Maniobra & Circuito de Mando</span>
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isMotorContactorClosed
                      ? 'bg-emerald-500 text-white animate-pulse'
                      : isThermalRelayTripped
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {isMotorContactorClosed ? 'MOTOR EN MARCHA' : isThermalRelayTripped ? 'DISPARO TÉRMICO (TRIP)' : 'MOTOR DETENIDO'}
                </span>
              </div>

              {/* Botonera Industrial de Mando (Marcha / Parada / Test Relé) */}
              <div className="p-4 bg-slate-900 rounded-2xl border-2 border-slate-700 flex flex-wrap items-center justify-center gap-6">
                {/* Botón Marcha (Verde Rasante NO) */}
                <button
                  onClick={handleStartMotor}
                  disabled={isThermalRelayTripped}
                  className="w-20 h-20 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs flex flex-col items-center justify-center shadow-lg shadow-emerald-900/50 border-4 border-emerald-400 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  title="Pulsador NA de Marcha (Cierra circuito y activa autorretención 13-14)"
                >
                  <Power className="w-5 h-5 mb-1" />
                  <span>MARCHA</span>
                </button>

                {/* Botón Parada (Rojo Saliente NC) */}
                <button
                  onClick={handleStopMotor}
                  className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white font-extrabold text-xs flex flex-col items-center justify-center shadow-lg shadow-red-900/50 border-4 border-red-400 transition-all"
                  title="Pulsador NC de Parada (Abre circuito de bobina A1-A2)"
                >
                  <Power className="w-5 h-5 mb-1" />
                  <span>PARADA</span>
                </button>

                {/* Test / Reset Relé Térmico */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleTripThermalRelay}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs"
                    title="Simular sobrecarga mecánica prolongada para forzar disparo bimetal 95-96"
                  >
                    ⚡ Simular Disparo Relé Térmico
                  </button>
                  {isThermalRelayTripped && (
                    <button
                      onClick={handleResetThermalRelay}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs animate-bounce"
                      title="Rearmar relé térmico tras enfriamiento bimetálico"
                    >
                      ↺ Rearmar Relé (Reset)
                    </button>
                  )}
                </div>
              </div>

              {/* Animación del Rotor del Motor */}
              <div className="p-6 bg-[#F8FAFC] dark:bg-[#182631] rounded-2xl border border-[#DCE4E8] dark:border-[#243542] flex items-center justify-center gap-6">
                <div
                  className={`w-24 h-24 rounded-full border-8 flex items-center justify-center transition-all ${
                    isMotorContactorClosed
                      ? 'border-emerald-500 text-emerald-500 rotate-180 animate-spin'
                      : 'border-slate-300 dark:border-slate-700 text-slate-400'
                  }`}
                  style={{ animationDuration: '0.4s' }}
                >
                  <RotateCw className="w-12 h-12" />
                </div>

                <div className="space-y-1 text-xs">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    Motor Asíncrono Jaula de Ardilla
                  </span>
                  <p className="text-slate-500">
                    Velocidad sincrónica: <strong>1500 RPM</strong> (4 Polos, 50 Hz)
                  </p>
                  <p className="text-slate-500">
                    Consumo activo en bornes:{' '}
                    <strong className="text-[#167D78] dark:text-[#2DD4BF]">
                      {isMotorContactorClosed ? `${motorNominalAmps} A (${motorKW} kW)` : '0.0 A (En reposo)'}
                    </strong>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUBTAB 2: SISTEMA DE BOMBEO CON FLOTANTES ELÉCTRICOS EN 24V
            ========================================================================= */}
        {activeSubTab === 'bomba_automatica' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 sm:p-6 rounded-2xl shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
              <div>
                <h3 className="font-bold text-base text-[#18313B] dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <span>Automatización Segura de Bomba Elevadora (Circuito 24V SELV)</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                  Protección de vidas según AEA 771: Los flotantes dentro de tanques de agua NUNCA deben llevar 220V directo. Deben conmutar a 24V mediante transformador de aislación.
                </p>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  isPumpRunning ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {isPumpRunning ? 'BOMBA BOMBEO ACTIVO' : 'BOMBA DETENIDA'}
              </span>
            </div>

            {/* Selector de Modo Manual / Automático / Apagado */}
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Modo de Operación:</span>
              <button
                onClick={() => setPumpMode('auto')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pumpMode === 'auto' ? 'bg-[#167D78] text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Automático (Por Flotantes)
              </button>
              <button
                onClick={() => setPumpMode('manual')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pumpMode === 'manual' ? 'bg-amber-500 text-slate-950 shadow-xs font-extrabold' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Manual (Forzado)
              </button>
              <button
                onClick={() => setPumpMode('off')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  pumpMode === 'off' ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                Apagado (OFF)
              </button>
            </div>

            {/* Simulación Gráfica de Tanque y Cisterna */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tanque Elevado */}
              <div className="p-4 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs sm:text-sm text-blue-950 dark:text-blue-200">
                    Tanque Elevado (En Techo)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-bold">
                    Flotante 1 (24V)
                  </span>
                </div>
                <div className="h-24 bg-white dark:bg-slate-900 rounded-lg border flex flex-col justify-end p-2 relative overflow-hidden">
                  <div
                    className="w-full bg-blue-400/60 dark:bg-blue-600/60 transition-all rounded"
                    style={{ height: isTanqueDemandingWater ? '30%' : '90%' }}
                  />
                  <span className="absolute top-2 left-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Nivel: {isTanqueDemandingWater ? 'Bajo (Pide Agua)' : 'Lleno (Corta)'}
                  </span>
                </div>
                <button
                  onClick={() => setIsTanqueDemandingWater(!isTanqueDemandingWater)}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Alternar Nivel del Tanque (Consumir / Llenar)
                </button>
              </div>

              {/* Cisterna Subterránea */}
              <div className="p-4 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-200">
                    Cisterna Subterránea
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-300 dark:bg-slate-700 font-bold">
                    Seguridad Falta de Agua
                  </span>
                </div>
                <div className="h-24 bg-white dark:bg-slate-900 rounded-lg border flex flex-col justify-end p-2 relative overflow-hidden">
                  <div
                    className="w-full bg-cyan-500/60 transition-all rounded"
                    style={{ height: isCisternaFull ? '80%' : '10%' }}
                  />
                  <span className="absolute top-2 left-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Cisterna: {isCisternaFull ? 'Con Agua Disponible' : '¡VACÍA! Bloqueo de Bomba'}
                  </span>
                </div>
                <button
                  onClick={() => setIsCisternaFull(!isCisternaFull)}
                  className="w-full py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Alternar Estado Cisterna (Con Agua / Sin Agua)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUBTAB 3: MÁQUINAS DE SOLDAR & CICLO DE TRABAJO (FACTOR DE MARCHA)
            ========================================================================= */}
        {activeSubTab === 'soldadora_taller' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 sm:p-6 rounded-2xl shadow-xs space-y-5">
            <h3 className="font-bold text-base text-[#18313B] dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span>Calculador de Factor de Marcha y Alimentación de Soldadoras</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tecnología de Soldadora:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setWelderType('inverter')}
                      className={`p-2 rounded-lg font-bold border transition-all ${
                        welderType === 'inverter'
                          ? 'bg-[#167D78] text-white border-[#167D78]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Inverter IGBT (Moderna)
                    </button>
                    <button
                      onClick={() => setWelderType('transformador')}
                      className={`p-2 rounded-lg font-bold border transition-all ${
                        welderType === 'transformador'
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Transformador Núcleo
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Corriente de Soldadura Ajustada: <strong>{weldingCurrentA} A</strong>
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="220"
                    step="5"
                    value={weldingCurrentA}
                    onChange={(e) => setWeldingCurrentA(Number(e.target.value))}
                    className="w-full accent-orange-600"
                  />
                </div>
              </div>

              {/* Ficha de Ensayo Térmico */}
              <div className="p-4 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-orange-900 dark:text-orange-200 uppercase text-[11px] block">
                  Capacidad de Trabajo Térmico (Base 10 Minutos):
                </span>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Ciclo de Trabajo (Factor de Marcha):</span>
                  <strong className="font-mono text-base text-orange-700 dark:text-orange-300">
                    {dutyCyclePercent}%
                  </strong>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Podés soldar <strong>{(dutyCyclePercent * 0.1).toFixed(1)} minutos continuos</strong> cada 10 minutos antes de que corte el protector térmico.
                </p>
                <div className="pt-2 border-t border-orange-200 dark:border-orange-900/60 flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Corriente eficaz en la red (220V):</span>
                  <strong className="font-mono text-slate-900 dark:text-white">{welderEffectivePrimaryAmps} A</strong>
                </div>
                <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold">
                  {welderEffectivePrimaryAmps > 16
                    ? '⚠ Requiere tomacorriente industrial de 20A o ficha CEE azul de 32A. Prohibido enchufe de 10A.'
                    : '✓ Compatible con tomacorriente de uso especial TUE 20A.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SUBTAB 4: COMPENSACIÓN DE FACTOR DE POTENCIA (cos φ)
            ========================================================================= */}
        {activeSubTab === 'factor_potencia' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-5 sm:p-6 rounded-2xl shadow-xs space-y-5">
            <h3 className="font-bold text-base text-[#18313B] dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-emerald-600" />
              <span>Cálculo de Banco de Capacitores para Corrección de cos φ</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="font-semibold block mb-1">Potencia Activa Total (kW):</label>
                <input
                  type="number"
                  value={activePowerKW}
                  onChange={(e) => setActivePowerKW(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">cos φ Actual (Sin compensar):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="0.95"
                  value={initialCosPhi}
                  onChange={(e) => setInitialCosPhi(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold text-red-600"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">cos φ Objetivo (Reglamentario):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.9"
                  max="0.99"
                  value={targetCosPhi}
                  onChange={(e) => setTargetCosPhi(Number(e.target.value))}
                  className="w-full p-2 rounded-lg border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#182631] font-mono font-bold text-emerald-600"
                />
              </div>
            </div>

            {/* Resultado del Banco de Capacitores */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs uppercase block">
                Potencia Reactiva Capacitiva Requerida:
              </span>
              <div className="text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                Qc = {capacitorKVAR} kVAR
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                Instalar una batería de capacitores de <strong>{capacitorKVAR} kVAR</strong> conectada en bornes generales del tablero seccional industrial evita el recargo por energía reactiva inductiva y reduce la corriente total aparente en los conductores de acometida.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
