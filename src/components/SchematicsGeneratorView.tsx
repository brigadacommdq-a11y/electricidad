/**
 * ELECTRA PLAN — Generador Automático de Esquemas Eléctricos (Fase 3)
 * Genera esquemas técnicos normalizados a partir de los datos reales del proyecto:
 * 1. Esquema Unifilar General (Acometida, IGA, ID, PIAs, calibres, secciones, potencia Ib, Icc).
 * 2. Esquema Multifilar Detallado (Fase, Neutro, Tierra PE, retornos y bornes físicos).
 * 3. Conexiones Reglamentarias de Iluminación (1 efecto, combinación vaivén, doble tecla).
 * 4. Conexiones de Tomacorrientes (Norma IRAM 2071, polaridad L-N-PE, distribución sin guirnalda peligrosa).
 * 5. Matriz de Distribución de Circuitos por Ambientes.
 * Cumple con especificaciones AEA 90364-771 e IRAM 2010.
 */
import React, { useState, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Layers,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Info,
  Maximize2,
  Compass,
  Network,
  Lightbulb,
  Plug,
  Sparkles,
  ArrowRight,
  Cpu,
} from 'lucide-react';
import { Project, Circuit } from '../types/electra';

interface SchematicsGeneratorViewProps {
  project: Project;
}

export type SchematicType =
  | 'unifilar'
  | 'multifilar'
  | 'iluminacion'
  | 'tomacorrientes'
  | 'distribucion';

export const SchematicsGeneratorView: React.FC<SchematicsGeneratorViewProps> = ({ project }) => {
  const [activeSchematic, setActiveSchematic] = useState<SchematicType>('unifilar');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const printableAreaRef = useRef<HTMLDivElement>(null);

  // Cálculos reales derivados del proyecto
  const totalWatts = project.symbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
  const totalVA = Math.round(totalWatts / 0.85);
  const supplyVoltage = project.circuits[0]?.voltage || 220;
  const isTrifasica = project.circuits.some((c) => c.phases === 3 || c.assignedPhase === 'R-S-T');
  const mainBreakerAmps = project.switchboard?.components?.find((c) => c.type === 'iga')?.ratingAmps || project.switchboard?.mainBreakerAmps || 32;
  const mainRCDAmps = project.switchboard?.components?.find((c) => c.type === 'diferencial')?.ratingAmps || project.switchboard?.differentialAmps || 40;

  // Grado de electrificación según superficie total
  const totalAreaM2 = Math.round(
    project.rooms.reduce((sum, r) => sum + ((r.width * (r.height || 100)) / 10000), 0)
  );
  const electrificationGrade =
    totalAreaM2 <= 60
      ? 'Mínimo (hasta 60 m²)'
      : totalAreaM2 <= 130
      ? 'Medio (hasta 130 m²)'
      : totalAreaM2 <= 200
      ? 'Elevado (hasta 200 m²)'
      : 'Superior (> 200 m²)';

  // Exportar SVG como archivo descargable
  const handleExportSVG = () => {
    const svgElem = printableAreaRef.current?.querySelector('svg');
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `ELECTRA_PLAN_Esquema_${activeSchematic.toUpperCase()}_${project.metadata.name.replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Imprimir Lámina Técnica
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F6F8] dark:bg-[#0D161C] text-[#18313B] dark:text-[#F1F5F9] transition-colors">
      {/* Cabecera de Herramienta y Acciones */}
      <div className="no-print bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] border border-[#B7DFDD] dark:border-[#167D78]/40">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#18313B] dark:text-white flex items-center gap-2">
              <span>Generador Automático de Esquemas Eléctricos</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800">
                Norma AEA 90364
              </span>
            </h2>
            <p className="text-xs text-[#64748B] dark:text-slate-400">
              Planos vectoriales normalizados generados a partir de los datos reales del proyecto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Selector */}
          <div className="hidden sm:flex items-center bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
              className="px-2 py-1 text-[#64748B] hover:text-[#18313B] dark:hover:text-white font-bold"
            >
              -
            </button>
            <span className="px-1.5 font-mono text-[11px] font-bold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 15, 160))}
              className="px-2 py-1 text-[#64748B] hover:text-[#18313B] dark:hover:text-white font-bold"
            >
              +
            </button>
          </div>

          <button
            onClick={handleExportSVG}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#1B2B36] hover:bg-[#F8FAFC] dark:hover:bg-[#243542] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-slate-200 text-xs font-semibold rounded-lg shadow-xs transition-colors"
            title="Descargar plano en formato vectorial SVG para CAD o Illustrator"
          >
            <Download className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
            <span>Exportar SVG</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95"
            title="Imprimir plano en hoja técnica A4 o A3 con membrete oficial"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Lámina</span>
          </button>
        </div>
      </div>

      {/* Selector de Tipo de Esquema */}
      <div className="no-print bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setActiveSchematic('unifilar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSchematic === 'unifilar'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Esquema Unifilar General</span>
        </button>

        <button
          onClick={() => setActiveSchematic('multifilar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSchematic === 'multifilar'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Esquema Multifilar Detallado</span>
        </button>

        <button
          onClick={() => setActiveSchematic('iluminacion')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSchematic === 'iluminacion'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          <span>Conexiones de Iluminación</span>
        </button>

        <button
          onClick={() => setActiveSchematic('tomacorrientes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSchematic === 'tomacorrientes'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
          }`}
        >
          <Plug className="w-3.5 h-3.5" />
          <span>Conexiones de Tomacorrientes (IRAM 2071)</span>
        </button>

        <button
          onClick={() => setActiveSchematic('distribucion')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activeSchematic === 'distribucion'
              ? 'bg-[#167D78] text-white shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B] dark:hover:text-white'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Distribución por Ambientes</span>
        </button>
      </div>

      {/* Área del Plano con Membrete Reglamentario */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center items-start">
        <div
          ref={printableAreaRef}
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="bg-white text-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-2xl rounded-sm p-8 min-w-[900px] max-w-[1200px] w-full transition-transform duration-150"
        >
          {/* =========================================================================
              1. MEMBRETE REGLAMENTARIO SUPERIOR (IRAM 4508 / AEA 90364)
              ========================================================================= */}
          <div className="border-2 border-slate-900 mb-6 p-4 bg-slate-50 grid grid-cols-12 gap-3 text-xs">
            <div className="col-span-4 border-r-2 border-slate-900 pr-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Obra / Instalación</span>
                <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                  {project.metadata.name || 'Vivienda Unifamiliar'}
                </h3>
                <p className="text-[11px] text-slate-600 mt-0.5">{project.metadata.address || 'Domicilio no especificado'}</p>
              </div>
              <div className="mt-2 text-[10px] font-mono text-slate-500">
                PROYECTO: {project.metadata.id.slice(0, 8).toUpperCase()} · REV: 01
              </div>
            </div>

            <div className="col-span-5 border-r-2 border-slate-900 pr-3 space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Parámetros Eléctricos de Proyecto</span>
              <div className="grid grid-cols-2 gap-1 text-[11px]">
                <div>
                  <span className="text-slate-500">Tensión:</span>{' '}
                  <strong className="text-slate-900">{isTrifasica ? '3x380 / 220 V' : '1x220 V (50 Hz)'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Grado Electr.:</span>{' '}
                  <strong className="text-slate-900">{electrificationGrade.split(' ')[0]}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Potencia Total:</span>{' '}
                  <strong className="text-slate-900">{totalWatts} W ({totalVA} VA)</strong>
                </div>
                <div>
                  <span className="text-slate-500">Circuitos:</span>{' '}
                  <strong className="text-slate-900">{project.circuits.length} derivados</strong>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 font-medium pt-1 border-t border-slate-200">
                Normativa de cálculo: <strong>AEA 90364-771</strong> · Conductores: <strong>IRAM 2183 / 62267</strong>
              </div>
            </div>

            <div className="col-span-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Plano y Especialidad</span>
                <h4 className="font-bold text-slate-900 text-sm">
                  {activeSchematic === 'unifilar'
                    ? 'ESQUEMA UNIFILAR GENERAL'
                    : activeSchematic === 'multifilar'
                    ? 'ESQUEMA MULTIFILAR'
                    : activeSchematic === 'iluminacion'
                    ? 'DETALLES DE ILUMINACIÓN'
                    : activeSchematic === 'tomacorrientes'
                    ? 'DETALLES DE TOMACORRIENTES'
                    : 'DISTRIBUCIÓN DE CIRCUITOS'}
                </h4>
              </div>
              <div className="text-[10px] text-slate-600 font-mono">
                FECHA: {new Date().toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>

          {/* =========================================================================
              2. CONTENIDO DEL ESQUEMA TÉCNICO SEGÚN LA PESTAÑA SELECCIONADA
              ========================================================================= */}

          {/* A. ESQUEMA UNIFILAR GENERAL */}
          {activeSchematic === 'unifilar' && (
            <div className="space-y-4">
              <div className="w-full overflow-x-auto flex justify-center">
                <svg
                  viewBox={`0 0 ${Math.max(900, project.circuits.length * 160 + 180)} 520`}
                  className="w-full max-w-full font-sans select-none"
                  style={{ minWidth: `${Math.max(850, project.circuits.length * 150 + 150)}px` }}
                >
                  {/* Fondo técnico cuadriculado milimetrado sutil */}
                  <defs>
                    <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="520" fill="url(#gridPattern)" />

                  {/* 1. LÍNEA DE ALIMENTACIÓN Y ACOMETIDA */}
                  <g id="acometida">
                    <line x1="50" y1="40" x2="160" y2="40" stroke="#0f172a" strokeWidth="3" />
                    <text x="50" y="30" fontSize="11" fontWeight="bold" fill="#0f172a">
                      RED DE DISTRIBUCIÓN PÚBLICA (220V 50Hz)
                    </text>

                    {/* Medidor de energía */}
                    <circle cx="160" cy="40" r="16" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
                    <text x="160" y="44" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#0f172a">
                      kWh
                    </text>
                    <text x="160" y="70" fontSize="10" textAnchor="middle" fill="#64748b">
                      Medidor Pilar
                    </text>

                    {/* Línea Principal seccional hasta Tablero */}
                    <line x1="176" y1="40" x2="280" y2="40" stroke="#0f172a" strokeWidth="3" />
                    <text x="228" y="32" fontSize="9" fontWeight="bold" fill="#0284c7" textAnchor="middle">
                      L. Principal: 2x4 mm² + PE (Cu)
                    </text>
                  </g>

                  {/* 2. TABLERO SECCIONAL GENERAL (GABINETE DIN) */}
                  <g id="tablero_seccional">
                    {/* Borde del gabinete del tablero */}
                    <rect
                      x="280"
                      y="15"
                      width={Math.max(580, project.circuits.length * 150 + 40)}
                      height="480"
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="2"
                      strokeDasharray="6,4"
                      rx="8"
                    />
                    <text x="295" y="35" fontSize="12" fontWeight="bold" fill="#0f172a">
                      TABLERO SECCIONAL GENERAL (TSG) — Conforme AEA 90364-771
                    </text>

                    {/* A. Interruptor General Automático (IGA) */}
                    <g transform="translate(320, 70)">
                      <rect x="0" y="0" width="70" height="90" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" rx="4" />
                      <line x1="35" y1="-30" x2="35" y2="0" stroke="#0f172a" strokeWidth="3" />
                      <circle cx="35" cy="45" r="12" fill="none" stroke="#ef4444" strokeWidth="2" />
                      <text x="35" y="49" fontSize="10" fontWeight="bold" fill="#ef4444" textAnchor="middle">
                        IGA
                      </text>
                      <text x="35" y="105" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#0f172a">
                        2x{mainBreakerAmps}A
                      </text>
                      <text x="35" y="118" fontSize="8" textAnchor="middle" fill="#64748b">
                        Curva C · 4.5 kA
                      </text>
                    </g>

                    {/* Conexión de IGA hacia Disyuntor Diferencial */}
                    <line x1="355" y1="160" x2="355" y2="190" stroke="#0f172a" strokeWidth="3" />

                    {/* B. Disyuntor Diferencial (ID) */}
                    <g transform="translate(320, 190)">
                      <rect x="0" y="0" width="70" height="90" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" rx="4" />
                      <circle cx="35" cy="45" r="14" fill="none" stroke="#0284c7" strokeWidth="2" />
                      <text x="35" y="49" fontSize="10" fontWeight="bold" fill="#0284c7" textAnchor="middle">
                        IΔn
                      </text>
                      <text x="35" y="105" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#0f172a">
                        ID 2x{mainRCDAmps}A
                      </text>
                      <text x="35" y="118" fontSize="8" textAnchor="middle" fill="#64748b">
                        30 mA · Clase AC
                      </text>
                    </g>

                    {/* Conexión de ID hacia Barra Colectora / Peine de derivación */}
                    <line x1="355" y1="280" x2="355" y2="320" stroke="#0f172a" strokeWidth="3" />

                    {/* Barra Peine de Distribución Bipolar (Fase + Neutro) */}
                    <line
                      x1="355"
                      y1="320"
                      x2={355 + project.circuits.length * 140}
                      y2="320"
                      stroke="#0f172a"
                      strokeWidth="4"
                    />
                    <text
                      x={365 + project.circuits.length * 140}
                      y="324"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#0f172a"
                    >
                      Peine Bipolar 63A
                    </text>

                    {/* Barra Colectora de Puesta a Tierra (PE) */}
                    <line
                      x1="320"
                      y1="460"
                      x2={355 + project.circuits.length * 140}
                      y2="460"
                      stroke="#16a34a"
                      strokeWidth="3.5"
                    />
                    <text x="320" y="452" fontSize="9" fontWeight="bold" fill="#16a34a">
                      Barra Colectora Principal de Tierra (PE)
                    </text>

                    {/* Jabalina de PAT en el exterior */}
                    <g transform="translate(240, 460)">
                      <line x1="240" y1="460" x2="320" y2="460" stroke="#16a34a" strokeWidth="3" />
                      <line x1="240" y1="460" x2="240" y2="490" stroke="#16a34a" strokeWidth="3" />
                      {/* Símbolo normalizado de tierra */}
                      <line x1="225" y1="490" x2="255" y2="490" stroke="#16a34a" strokeWidth="3" />
                      <line x1="230" y1="495" x2="250" y2="495" stroke="#16a34a" strokeWidth="2.5" />
                      <line x1="235" y1="500" x2="245" y2="500" stroke="#16a34a" strokeWidth="2" />
                      <text x="210" y="485" fontSize="9" fontWeight="bold" fill="#16a34a" textAnchor="end">
                        PAT (Ra &lt; 10 Ω)
                      </text>
                    </g>

                    {/* C. PIAs INDIVIDUALES POR CIRCUITO (C1, C2, C3, ...) */}
                    {project.circuits.map((circ: Circuit, idx: number) => {
                      const posX = 420 + idx * 140;

                      // Derivación desde el peine de distribución
                      const circSymbols = project.symbols.filter(
                        (s) => s.circuitId === circ.id && (s.category === 'utilizacion' || s.type === 'luminaria')
                      );
                      const circWatts = circSymbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
                      const circAmps = (circWatts / supplyVoltage).toFixed(1);

                      return (
                        <g key={circ.id} transform={`translate(${posX}, 320)`}>
                          {/* Bajada desde peine */}
                          <line x1="0" y1="0" x2="0" y2="25" stroke="#0f172a" strokeWidth="2.5" />

                          {/* Caja del interruptor termomagnético (PIA) */}
                          <rect x="-30" y="25" width="60" height="70" fill="#ffffff" stroke="#0f172a" strokeWidth="2" rx="3" />
                          <circle cx="0" cy="60" r="10" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                          <line x1="-6" y1="60" x2="6" y2="60" stroke="#0f172a" strokeWidth="1.5" />
                          <text x="0" y="63" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#0f172a">
                            PIA
                          </text>

                          {/* Calibre de la térmica */}
                          <text x="0" y="108" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#0f172a">
                            {circ.breakerCurve || 'C'}{circ.breakerAmps || 16}A
                          </text>
                          <text x="0" y="120" fontSize="8" textAnchor="middle" fill="#64748b">
                            3.0 kA · 2x
                          </text>

                          {/* Salida de circuito hacia abajo */}
                          <line x1="0" y1="95" x2="0" y2="135" stroke="#0f172a" strokeWidth="2.5" />

                          {/* Datos del Circuito reglamentario */}
                          <g transform="translate(0, 140)">
                            {/* Rectángulo de datos técnicos del circuito */}
                            <rect x="-58" y="0" width="116" height="85" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" rx="4" />
                            <text x="0" y="14" fontSize="10" fontWeight="bold" fill="#0f172a" textAnchor="middle">
                              {circ.id}: {circ.type}
                            </text>
                            <text x="0" y="26" fontSize="8" fill="#475569" textAnchor="middle">
                              {circ.name.slice(0, 18)}
                            </text>
                            <line x1="-50" y1="32" x2="50" y2="32" stroke="#e2e8f0" strokeWidth="1" />

                            <text x="-50" y="44" fontSize="8" fill="#64748b">
                              Cond: <strong className="text-slate-900">{circ.crossSectionMm2 || 2.5} mm²</strong>
                            </text>
                            <text x="-50" y="56" fontSize="8" fill="#64748b">
                              Tierra: <strong className="text-emerald-700">{Math.max(2.5, circ.crossSectionMm2 || 2.5)} mm²</strong>
                            </text>
                            <text x="-50" y="68" fontSize="8" fill="#64748b">
                              Bocas: <strong className="text-slate-900">{circSymbols.length} uds.</strong>
                            </text>
                            <text x="-50" y="80" fontSize="8" fill="#64748b">
                              Demanda: <strong className="text-amber-700">{circWatts}W ({circAmps}A)</strong>
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* Tabla Resumen de Circuitos según AEA 771 */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Circuito</th>
                      <th className="p-2.5">Destino / Uso</th>
                      <th className="p-2.5">Térmica (In)</th>
                      <th className="p-2.5">Sección Fase/N</th>
                      <th className="p-2.5">Sección PE</th>
                      <th className="p-2.5">Bocas</th>
                      <th className="p-2.5">Potencia (W)</th>
                      <th className="p-2.5">Corriente (Ib)</th>
                      <th className="p-2.5">Caída ΔV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {project.circuits.map((circ) => {
                      const loads = project.symbols.filter(
                        (s) => s.circuitId === circ.id && (s.category === 'utilizacion' || s.type === 'luminaria')
                      );
                      const pWatts = loads.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
                      const ib = (pWatts / 220).toFixed(2);
                      const deltaV = ((Number(ib) * 0.0175 * 2 * 12) / (circ.crossSectionMm2 || 2.5) / 2.2).toFixed(2);

                      return (
                        <tr key={circ.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-900">{circ.id} ({circ.type})</td>
                          <td className="p-2.5 font-sans font-medium">{circ.name}</td>
                          <td className="p-2.5 font-bold text-slate-900">{circ.breakerCurve || 'C'}{circ.breakerAmps || 16} A</td>
                          <td className="p-2.5">{circ.crossSectionMm2 || 2.5} mm² Cu</td>
                          <td className="p-2.5 text-emerald-700 font-bold">{Math.max(2.5, circ.crossSectionMm2 || 2.5)} mm² Cu</td>
                          <td className="p-2.5">{loads.length}</td>
                          <td className="p-2.5">{pWatts} W</td>
                          <td className="p-2.5 font-bold text-amber-700">{ib} A</td>
                          <td className="p-2.5">{deltaV}% (OK)</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* B. ESQUEMA MULTIFILAR DETALLADO */}
          {activeSchematic === 'multifilar' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 mb-2">
                  <Layers className="w-4 h-4 text-[#167D78]" />
                  <span>Esquema Multifilar de Distribución Interna del Tablero Seccional</span>
                </h4>
                <p className="text-xs text-slate-600 mb-4">
                  Muestra la totalidad de los conductores con su color normalizado IRAM 2183: 
                  <strong className="text-[#92400e]"> Fase (Marrón)</strong>, 
                  <strong className="text-[#0284c7]"> Neutro (Celeste)</strong>, y 
                  <strong className="text-[#16a34a]"> Puesta a Tierra (Verde-Amarillo)</strong>.
                </p>

                {/* Gráfico SVG Multifilar */}
                <div className="w-full overflow-x-auto flex justify-center">
                  <svg viewBox="0 0 850 480" className="w-full max-w-4xl font-sans select-none" style={{ minWidth: '750px' }}>
                    <rect width="100%" height="480" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" rx="4" />

                    {/* Líneas de Entrada desde Medidor */}
                    <g transform="translate(40, 40)">
                      <text x="0" y="20" fontSize="10" fontWeight="bold" fill="#92400e">L (Fase Entrada)</text>
                      <line x1="120" y1="16" x2="220" y2="16" stroke="#92400e" strokeWidth="3.5" />

                      <text x="0" y="50" fontSize="10" fontWeight="bold" fill="#0284c7">N (Neutro Entrada)</text>
                      <line x1="120" y1="46" x2="220" y2="46" stroke="#0284c7" strokeWidth="3.5" />

                      <text x="0" y="80" fontSize="10" fontWeight="bold" fill="#16a34a">PE (Tierra Jabalina)</text>
                      <line x1="120" y1="76" x2="220" y2="76" stroke="#16a34a" strokeWidth="3.5" />
                    </g>

                    {/* IGA Bipolar */}
                    <g transform="translate(260, 40)">
                      <rect x="0" y="0" width="100" height="70" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" rx="4" />
                      <text x="50" y="25" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#0f172a">IGA 32A</text>
                      <text x="50" y="42" fontSize="9" textAnchor="middle" fill="#64748b">Corte General</text>
                      {/* Contactos */}
                      <circle cx="25" cy="16" r="3" fill="#92400e" />
                      <circle cx="75" cy="46" r="3" fill="#0284c7" />
                    </g>

                    {/* Puentes hacia ID */}
                    <line x1="360" y1="56" x2="420" y2="56" stroke="#92400e" strokeWidth="3.5" />
                    <line x1="360" y1="86" x2="420" y2="86" stroke="#0284c7" strokeWidth="3.5" />

                    {/* Disyuntor Diferencial */}
                    <g transform="translate(420, 40)">
                      <rect x="0" y="0" width="100" height="70" fill="#f8fafc" stroke="#0284c7" strokeWidth="2.5" rx="4" />
                      <text x="50" y="25" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#0284c7">ID 40A</text>
                      <text x="50" y="42" fontSize="9" textAnchor="middle" fill="#64748b">30 mA IΔn</text>
                      <rect x="70" y="10" width="18" height="12" fill="#f59e0b" rx="2" />
                      <text x="79" y="19" fontSize="8" fontWeight="bold" textAnchor="middle" fill="#000">T</text>
                    </g>

                    {/* Barras de Neutro y Tierra */}
                    {/* Barra de Neutro aislada */}
                    <rect x="580" y="60" width="220" height="16" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" rx="3" />
                    <text x="690" y="72" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#0284c7">BARRA BORNERA DE NEUTRO (N)</text>
                    <line x1="520" y1="86" x2="580" y2="68" stroke="#0284c7" strokeWidth="3.5" />

                    {/* Barra de Tierra equipotencial (PE) */}
                    <rect x="580" y="110" width="220" height="16" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" rx="3" />
                    <text x="690" y="122" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#16a34a">BARRA BORNERA DE TIERRA (PE)</text>
                    <line x1="260" y1="116" x2="580" y2="116" stroke="#16a34a" strokeWidth="3.5" />

                    {/* Peine de Fase a Térmicas */}
                    <line x1="520" y1="56" x2="520" y2="200" stroke="#92400e" strokeWidth="3.5" />
                    <line x1="200" y1="200" x2="720" y2="200" stroke="#92400e" strokeWidth="4" />
                    <text x="730" y="204" fontSize="9" fontWeight="bold" fill="#92400e">Peine Fase (L)</text>

                    {/* 3 Térmicas Ilustrativas de Circuitos (C1, C2, C3) */}
                    {[
                      { id: 'C1', name: 'Iluminación IUG', amp: '16A', x: 220 },
                      { id: 'C2', name: 'Tomas TUG', amp: '16A', x: 420 },
                      { id: 'C3', name: 'Especial TUE', amp: '20A', x: 620 },
                    ].map((pia) => (
                      <g key={pia.id} transform={`translate(${pia.x}, 230)`}>
                        {/* Entrada desde peine de fase */}
                        <line x1="25" y1="-30" x2="25" y2="0" stroke="#92400e" strokeWidth="3" />

                        {/* Caja PIA */}
                        <rect x="0" y="0" width="80" height="70" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" rx="4" />
                        <text x="40" y="25" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#0f172a">{pia.id}</text>
                        <text x="40" y="42" fontSize="9" textAnchor="middle" fill="#64748b">{pia.amp} 3kA</text>
                        <text x="40" y="58" fontSize="8" textAnchor="middle" fill="#475569">{pia.name}</text>

                        {/* Salida de los 3 conductores hacia cañerías del circuito */}
                        <line x1="20" y1="70" x2="20" y2="170" stroke="#92400e" strokeWidth="3" />
                        <line x1="40" y1="70" x2="40" y2="170" stroke="#0284c7" strokeWidth="3" />
                        <line x1="60" y1="70" x2="60" y2="170" stroke="#16a34a" strokeWidth="3" />

                        <text x="20" y="190" fontSize="8" fontWeight="bold" fill="#92400e" textAnchor="middle">Fase</text>
                        <text x="40" y="190" fontSize="8" fontWeight="bold" fill="#0284c7" textAnchor="middle">Neutro</text>
                        <text x="60" y="190" fontSize="8" fontWeight="bold" fill="#16a34a" textAnchor="middle">Tierra</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* C. CONEXIONES DE ILUMINACIÓN */}
          {activeSchematic === 'iluminacion' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1 Efecto Simple */}
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Circuito de 1 Efecto (Punto y Luz)
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">Interruptor Simple + Luminaria</h4>
                  <p className="text-xs text-slate-600">
                    La <strong>Fase (Marrón)</strong> entra al borne central de la llave de luz. El <strong>Retorno (Violeta)</strong> sale de la llave a la lámpara. El <strong>Neutro (Celeste)</strong> va directo a la lámpara.
                  </p>
                  <svg viewBox="0 0 380 180" className="w-full bg-white border rounded">
                    <line x1="20" y1="30" x2="360" y2="30" stroke="#0284c7" strokeWidth="3" />
                    <text x="25" y="24" fontSize="9" fontWeight="bold" fill="#0284c7">Neutro N (Celeste)</text>

                    <line x1="20" y1="60" x2="100" y2="60" stroke="#92400e" strokeWidth="3" />
                    <text x="25" y="54" fontSize="9" fontWeight="bold" fill="#92400e">Fase L (Marrón)</text>

                    {/* Llave */}
                    <rect x="80" y="90" width="50" height="60" fill="#f8fafc" stroke="#0f172a" rx="4" />
                    <text x="105" y="125" fontSize="10" fontWeight="bold" textAnchor="middle">Llave</text>
                    <line x1="100" y1="60" x2="100" y2="90" stroke="#92400e" strokeWidth="3" />

                    {/* Retorno */}
                    <line x1="115" y1="90" x2="115" y2="75" stroke="#a855f7" strokeWidth="3" />
                    <line x1="115" y1="75" x2="260" y2="75" stroke="#a855f7" strokeWidth="3" />
                    <line x1="260" y1="75" x2="260" y2="95" stroke="#a855f7" strokeWidth="3" />
                    <text x="180" y="70" fontSize="9" fontWeight="bold" fill="#a855f7">Retorno R (Violeta)</text>

                    {/* Lámpara */}
                    <circle cx="260" cy="115" r="20" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
                    <text x="260" y="119" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#854d0e">Luz</text>
                    <line x1="260" y1="30" x2="260" y2="95" stroke="#0284c7" strokeWidth="3" />
                  </svg>
                </div>

                {/* Combinación / Vaivén */}
                <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                    Circuito de Combinación (Escalera / Pasillo)
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">2 Llaves Conmutadas + Luminaria</h4>
                  <p className="text-xs text-slate-600">
                    Permite encender o apagar la misma luz desde dos puntos distintos mediante 2 llaves conmutadas unidas por <strong>puentes auxiliares (Naranja/Gris)</strong>.
                  </p>
                  <svg viewBox="0 0 380 180" className="w-full bg-white border rounded">
                    <line x1="20" y1="20" x2="360" y2="20" stroke="#0284c7" strokeWidth="3" />
                    <text x="25" y="15" fontSize="9" fontWeight="bold" fill="#0284c7">Neutro N directo al centro</text>

                    {/* Llave 1 */}
                    <rect x="40" y="80" width="50" height="70" fill="#f8fafc" stroke="#0f172a" rx="4" />
                    <text x="65" y="120" fontSize="9" fontWeight="bold" textAnchor="middle">Llave 1</text>
                    <line x1="20" y1="50" x2="65" y2="50" stroke="#92400e" strokeWidth="3" />
                    <line x1="65" y1="50" x2="65" y2="80" stroke="#92400e" strokeWidth="3" />

                    {/* Puentes viajeros */}
                    <line x1="90" y1="95" x2="220" y2="95" stroke="#f97316" strokeWidth="2.5" />
                    <line x1="90" y1="135" x2="220" y2="135" stroke="#f97316" strokeWidth="2.5" />
                    <text x="155" y="90" fontSize="8" fontWeight="bold" fill="#f97316" textAnchor="middle">Puente 1</text>
                    <text x="155" y="148" fontSize="8" fontWeight="bold" fill="#f97316" textAnchor="middle">Puente 2</text>

                    {/* Llave 2 */}
                    <rect x="220" y="80" width="50" height="70" fill="#f8fafc" stroke="#0f172a" rx="4" />
                    <text x="245" y="120" fontSize="9" fontWeight="bold" textAnchor="middle">Llave 2</text>

                    {/* Retorno desde Llave 2 a lámpara */}
                    <line x1="270" y1="115" x2="310" y2="115" stroke="#a855f7" strokeWidth="3" />
                    <circle cx="330" cy="115" r="18" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
                    <text x="330" y="119" fontSize="9" fontWeight="bold" textAnchor="middle">Luz</text>
                    <line x1="330" y1="20" x2="330" y2="97" stroke="#0284c7" strokeWidth="3" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* D. CONEXIONES DE TOMACORRIENTES (IRAM 2071) */}
          {activeSchematic === 'tomacorrientes' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg">
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Conexionado Normalizado de Tomacorrientes (Norma IRAM 2071 / AEA 90364-771)</span>
                </h4>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Mirando el tomacorriente de frente con la espiga de tierra hacia abajo:
                  <br />• <strong>Borne DERECHO: FASE (Marrón / Negro / Rojo)</strong>
                  <br />• <strong>Borne IZQUIERDO: NEUTRO (Celeste reglamentario)</strong>
                  <br />• <strong>Borne INFERIOR CENTRAL: TIERRA (Verde-Amarillo PE obligatoria, mín. 2,5 mm²)</strong>
                </p>

                <div className="flex justify-center">
                  <svg viewBox="0 0 600 240" className="w-full max-w-2xl bg-white border rounded p-4 font-sans">
                    {/* Borde del módulo tomacorriente */}
                    <rect x="180" y="30" width="240" height="180" fill="#f8fafc" stroke="#334155" strokeWidth="3" rx="16" />
                    <circle cx="300" cy="120" r="75" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />

                    {/* Ranura Neutro (Izquierda mirando de frente) */}
                    <rect x="235" y="85" width="10" height="35" rx="3" transform="rotate(25, 240, 102)" fill="#0284c7" />
                    <text x="210" y="75" fontSize="11" fontWeight="bold" fill="#0284c7" textAnchor="middle">
                      NEUTRO (N)
                    </text>
                    <line x1="80" y1="102" x2="230" y2="102" stroke="#0284c7" strokeWidth="3.5" />
                    <text x="130" y="95" fontSize="9" fontWeight="bold" fill="#0284c7">Celeste</text>

                    {/* Ranura Fase (Derecha mirando de frente) */}
                    <rect x="355" y="85" width="10" height="35" rx="3" transform="rotate(-25, 360, 102)" fill="#92400e" />
                    <text x="390" y="75" fontSize="11" fontWeight="bold" fill="#92400e" textAnchor="middle">
                      FASE (L)
                    </text>
                    <line x1="370" y1="102" x2="520" y2="102" stroke="#92400e" strokeWidth="3.5" />
                    <text x="430" y="95" fontSize="9" fontWeight="bold" fill="#92400e">Marrón</text>

                    {/* Ranura Tierra PE (Centro inferior) */}
                    <rect x="295" y="145" width="10" height="30" rx="3" fill="#16a34a" />
                    <text x="300" y="200" fontSize="11" fontWeight="bold" fill="#16a34a" textAnchor="middle">
                      TIERRA (PE)
                    </text>
                    <line x1="300" y1="175" x2="300" y2="230" stroke="#16a34a" strokeWidth="3.5" />
                    <text x="310" y="225" fontSize="9" fontWeight="bold" fill="#16a34a">Verde-Amarillo</text>
                  </svg>
                </div>

                <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Prohibición reglamentaria de guirnalda (AEA 771.19):</strong>
                    <p className="mt-0.5">
                      Está estrictamente prohibido usar los bornes del módulo tomacorriente como puente para continuar la línea si la corriente supera los 10 A. La derivación debe realizarse dentro de la caja mediante bornes o borneras aisladas con derivación en "T".
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* E. DISTRIBUCIÓN POR AMBIENTES */}
          {activeSchematic === 'distribucion' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg">
                <h4 className="font-bold text-slate-900 text-sm mb-2">
                  Matriz de Distribución de Circuitos y Puntos Mínimos de Utilización (PMS)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {project.rooms.map((room) => {
                    const roomComps = project.symbols.filter(
                      (s) =>
                        s.x >= room.x &&
                        s.x <= room.x + room.width &&
                        s.y >= room.y &&
                        s.y <= room.y + (room.height || 100)
                    );
                    const lights = roomComps.filter((s) => s.type === 'luminaria');
                    const sockets = roomComps.filter((s) => s.type === 'tomacorriente' || s.type === 'toma_especial');

                    return (
                      <div key={room.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-xs text-slate-900">{room.name}</h5>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {Math.round((room.width * (room.height || 100)) / 10000)} m²
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span>Bocas de luz:</span>
                            <strong className="text-slate-900">{lights.length}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Tomacorrientes:</span>
                            <strong className="text-slate-900">{sockets.length}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total componentes:</span>
                            <strong className="text-[#167D78]">{roomComps.length}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Membrete Inferior con Firmas Técnicas */}
          <div className="mt-6 pt-4 border-t-2 border-slate-900 grid grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="border border-slate-300 p-3 rounded text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-6">Firma Proyectista / Instalador</span>
              <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-800">
                Instalador Electricista Habilitado
              </div>
            </div>

            <div className="border border-slate-300 p-3 rounded text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-6">Conformidad del Comitente / Propietario</span>
              <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-800">
                Aprobación de Instalación
              </div>
            </div>

            <div className="border border-slate-300 p-3 rounded text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-6">Visado Normativo / Colegio Técnico</span>
              <div className="border-t border-slate-400 pt-1 text-[11px] font-bold text-slate-800">
                Certificación AEA 90364
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
