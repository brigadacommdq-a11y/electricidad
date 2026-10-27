/**
 * ELECTRA PLAN — Módulo Interactivo de Acometida, Pilar de Medición y Puesta a Tierra
 * Representación técnica y funcional desde la red pública de distribución hasta el tablero seccional
 * según AEA 90364-7-771 y especificaciones técnicas de pilares normalizados.
 */
import React, { useState } from 'react';
import {
  Zap,
  ShieldCheck,
  ShieldAlert,
  Info,
  CheckCircle2,
  AlertTriangle,
  X,
  Gauge,
  Activity,
  Layers,
  ArrowRight,
  Power,
  RotateCcw,
} from 'lucide-react';
import { Project } from '../types/electra';

interface AcometidaPilarModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export const AcometidaPilarModal: React.FC<AcometidaPilarModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [supplyType, setSupplyType] = useState<'monofasica' | 'trifasica'>('monofasica');
  const [pilarBreakerClosed, setPilarBreakerClosed] = useState<boolean>(true);
  const [selectedSection, setSelectedSection] = useState<
    'red' | 'acometida' | 'medidor' | 'tablero_pilar' | 'linea_principal' | 'tsg' | 'pat' | 'pilar'
  >('pilar');

  if (!isOpen) return null;

  // Cálculos de potencia y corriente calculada del proyecto
  const totalWatts = project.symbols.reduce((sum, s) => sum + (s.powerWatts || 0), 0);
  const voltage = supplyType === 'monofasica' ? 220 : 380;
  const currentAmps =
    supplyType === 'monofasica'
      ? Number((totalWatts / (220 * 0.9)).toFixed(1))
      : Number((totalWatts / (Math.sqrt(3) * 380 * 0.9)).toFixed(1));

  // Tensión activa en la línea principal
  const isLineEnergized = pilarBreakerClosed;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Módulo */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Instalación de Enlace: Acometida, Pilar y Puesta a Tierra
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-slate-950 rounded uppercase">
                  AEA 90364-7-771
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Desde la red pública de distribución hasta el Tablero Seccional de la vivienda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Controles Rápidos */}
        <div className="bg-slate-950/80 border-b border-slate-800 px-3 sm:px-4 py-2 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Tipo de Suministro:</span>
            <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5">
              <button
                onClick={() => setSupplyType('monofasica')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  supplyType === 'monofasica'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monofásico 220V (F+N)
              </button>
              <button
                onClick={() => setSupplyType('trifasica')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  supplyType === 'trifasica'
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Trifásico 380V (3F+N)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Térmica IGA en Pilar:</span>
            <button
              onClick={() => setPilarBreakerClosed(!pilarBreakerClosed)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs shadow-md transition-all ${
                pilarBreakerClosed
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-red-600 hover:bg-red-500 text-white animate-pulse'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{pilarBreakerClosed ? 'CONECTADO (Cerrado)' : 'DESCONECTADO (Abierto)'}</span>
            </button>
          </div>
        </div>

        {/* Diagrama Esquemático / Arquitectónico del Pilar y Enlace */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 relative overflow-hidden shadow-inner">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Esquema Funcional de Enlace en Línea (IRAM / AEA 771)</span>
              <span className={`font-bold ${isLineEnergized ? 'text-emerald-400' : 'text-red-400'}`}>
                {isLineEnergized ? '● Tensión presente en vivienda (220V)' : '○ Vivienda desenergizada desde pilar'}
              </span>
            </div>

            {/* Diagrama SVG de la Acometida, Pilar, Cañería y Vivienda */}
            <div className="w-full overflow-x-auto py-2">
              <svg viewBox="0 0 900 280" className="w-full min-w-[700px] h-64 sm:h-72 select-none">
                <defs>
                  {/* Gradientes de tierra y conductores */}
                  <linearGradient id="earthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3f2e1a" />
                    <stop offset="100%" stopColor="#1a140d" />
                  </linearGradient>
                  <linearGradient id="pilarGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="100%" stopColor="#334155" />
                  </linearGradient>
                </defs>

                {/* Terreno / Línea de Suelo */}
                <rect x="0" y="210" width="900" height="70" fill="url(#earthGrad)" />
                <line x1="0" y1="210" x2="900" y2="210" stroke="#78350f" strokeWidth="2" strokeDasharray="4,2" />
                <text x="20" y="235" fill="#a16207" fontSize="10" fontFamily="monospace">
                  NIVEL DE TERRENO NATURAL (±0.00)
                </text>

                {/* 1. RED DE DISTRIBUCIÓN PÚBLICA (Poste o Red Aérea) */}
                <g className="cursor-pointer" onClick={() => setSelectedSection('red')}>
                  <rect x="30" y="20" width="24" height="190" fill="#64748b" rx="2" />
                  {/* Ménsula y aisladores */}
                  <line x1="15" y1="40" x2="70" y2="40" stroke="#334155" strokeWidth="6" />
                  <circle cx="25" cy="40" r="5" fill="#0284c7" />
                  <circle cx="42" cy="40" r="5" fill="#0284c7" />
                  <circle cx="60" cy="40" r="5" fill="#0284c7" />
                  {/* Cables de red pública */}
                  <line x1="0" y1="36" x2="100" y2="36" stroke="#0284c7" strokeWidth="3" />
                  <line x1="0" y1="44" x2="100" y2="44" stroke="#38bdf8" strokeWidth="2" />
                  <text x="42" y="16" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle">
                    RED PÚBLICA (220V)
                  </text>
                </g>

                {/* Cable de Acometida Aérea / Preensamblado hacia el Pilar */}
                <path
                  d="M 60 40 Q 140 50 180 65"
                  fill="none"
                  stroke={isLineEnergized ? '#f59e0b' : '#64748b'}
                  strokeWidth="4"
                  strokeDasharray="6,2"
                />

                {/* 2. PILAR DE MEDICIÓN REGLAMENTARIO */}
                <g className="cursor-pointer" onClick={() => setSelectedSection('pilar')}>
                  {/* Mampostería del pilar */}
                  <rect x="170" y="60" width="130" height="150" fill="url(#pilarGrad)" stroke="#1e293b" strokeWidth="2" rx="4" />
                  {/* Pipeta y caño de bajada 1¼" */}
                  <path d="M 180 45 C 180 50 185 55 190 60 L 190 85" fill="none" stroke="#94a3b8" strokeWidth="5" />
                  <circle cx="180" cy="45" r="4" fill="#64748b" />

                  {/* Caja de Medidor */}
                  <rect x="185" y="80" width="100" height="55" fill="#0f172a" stroke="#64748b" rx="3" />
                  <rect x="195" y="90" width="80" height="24" fill="#022c22" rx="2" stroke="#059669" />
                  {/* Display digital del medidor */}
                  <text x="235" y="106" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    {isLineEnergized ? '220.4 V  ' + currentAmps + 'A' : '000.0 V  0A'}
                  </text>
                  <text x="235" y="125" fill="#94a3b8" fontSize="8" textAnchor="middle" fontWeight="bold">
                    MEDIDOR HOMOLOGADO
                  </text>

                  {/* Tablero Principal de Pilar (con IGA) */}
                  <rect x="185" y="145" width="100" height="50" fill="#0f172a" stroke="#64748b" rx="3" />
                  <text x="235" y="160" fill="#cbd5e1" fontSize="9" fontWeight="bold" textAnchor="middle">
                    TABLERO PRINCIPAL
                  </text>
                  {/* Interruptor termomagnético en pilar */}
                  <rect
                    x="215"
                    y="167"
                    width="40"
                    height="20"
                    fill={pilarBreakerClosed ? '#065f46' : '#7f1d1d'}
                    rx="2"
                    stroke={pilarBreakerClosed ? '#10b981' : '#ef4444'}
                  />
                  <text x="235" y="181" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                    {pilarBreakerClosed ? 'IGA 32A' : 'ABIERTO'}
                  </text>
                </g>

                {/* 3. SISTEMA DE PUESTA A TIERRA (PAT) AL PIE DEL PILAR */}
                <g className="cursor-pointer" onClick={() => setSelectedSection('pat')}>
                  {/* Caja de inspección de jabalina */}
                  <rect x="205" y="210" width="40" height="25" fill="#1e293b" stroke="#78350f" rx="1" />
                  {/* Jabalina de cobre 5/8" */}
                  <rect x="222" y="220" width="6" height="50" fill="#d97706" rx="1" />
                  {/* Conductor verde-amarillo hacia el pilar */}
                  <path d="M 225 220 L 225 195 L 200 195" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeDasharray="4,2" />
                  <text x="250" y="245" fill="#d97706" fontSize="9" fontWeight="bold">
                    JABALINA PAT (5/8" Cu)
                  </text>
                </g>

                {/* 4. LÍNEA PRINCIPAL (SUBTERRÁNEA / EMBUTIDA SINTENAX) */}
                <g className="cursor-pointer" onClick={() => setSelectedSection('linea_principal')}>
                  {/* Caño o zanja subterránea */}
                  <path
                    d="M 270 195 L 270 230 L 620 230 L 620 180"
                    fill="none"
                    stroke={isLineEnergized ? '#f59e0b' : '#475569'}
                    strokeWidth="4"
                    strokeDasharray={isLineEnergized ? '6,3' : '2,2'}
                  />
                  {/* Conductor PE de protección acompañando */}
                  <path
                    d="M 225 210 L 250 240 L 630 240 L 630 180"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                  />
                  <text x="440" y="222" fill={isLineEnergized ? '#fbbf24' : '#64748b'} fontSize="9" fontWeight="bold" textAnchor="middle">
                    LÍNEA PRINCIPAL (SINTENAX 2x4mm² + PE)
                  </text>
                </g>

                {/* 5. VIVIENDA Y TABLERO SECCIONAL GENERAL (TSG) */}
                <g className="cursor-pointer" onClick={() => setSelectedSection('tsg')}>
                  {/* Fachada / Muro de la vivienda */}
                  <rect x="600" y="50" width="270" height="160" fill="#1e293b" stroke="#334155" strokeWidth="2" rx="4" />
                  <rect x="615" y="70" width="130" height="100" fill="#0f172a" stroke="#475569" rx="3" />
                  <text x="680" y="86" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle">
                    TABLERO SECCIONAL (TSG)
                  </text>

                  {/* Disyuntor Diferencial */}
                  <rect x="625" y="96" width="50" height="26" fill="#1e3a8a" rx="2" stroke="#3b82f6" />
                  <text x="650" y="112" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">
                    ID 40A/30mA
                  </text>

                  {/* Térmicas Seccionales PIAs */}
                  <rect x="680" y="96" width="26" height="26" fill="#047857" rx="2" stroke="#10b981" />
                  <text x="693" y="112" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    IUG 10A
                  </text>
                  <rect x="710" y="96" width="26" height="26" fill="#047857" rx="2" stroke="#10b981" />
                  <text x="723" y="112" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">
                    TUG 16A
                  </text>

                  {/* Lámpara testigo de vivienda encendida */}
                  <circle
                    cx="810"
                    cy="100"
                    r="16"
                    fill={isLineEnergized ? '#f59e0b' : '#334155'}
                    stroke={isLineEnergized ? '#fbbf24' : '#64748b'}
                    strokeWidth="2"
                  />
                  <text x="810" y="130" fill={isLineEnergized ? '#fde047' : '#64748b'} fontSize="9" fontWeight="bold" textAnchor="middle">
                    {isLineEnergized ? 'VIVIENDA ACTIVA' : 'SIN ENERGÍA'}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Ficha Técnica y Explicación Educativa según Sección */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                1. Acometida y Pilar
              </span>
              <h4 className="text-xs font-bold text-white">Pilar Normalizado</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                El pilar se ubica sobre la línea municipal. Incluye pipeta estanca, caño de acero galvanizado aislado de 1¼",
                caja para medidor reglamentario y caja con interruptor general termomagnético (IGA) de corte omnipolar a no más de 2 metros del medidor.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                2. Línea Principal
              </span>
              <h4 className="text-xs font-bold text-white">Canalización a TSG</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Conecta el tablero principal del pilar con el primer tablero dentro del inmueble. Según AEA 90364-771, la sección mínima es de <strong>4 mm²</strong> (cobre) con aislamiento reforzado IRAM 2178 (Sintenax) o IRAM 62266 libre de halógenos.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                3. Puesta a Tierra (PAT)
              </span>
              <h4 className="text-xs font-bold text-white">Electrodo de Dispersión</h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Jabalina de acero-cobre IRAM 2309 hincada en suelo con cámara de inspección de 15x15cm. Resistencia de difusión máxima exigida: <strong>≤ 10 Ohms</strong>. Conductor PE verde-amarillo continuo sin fusibles ni interruptores.
              </p>
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Los componentes representados respetan el esquema TT obligatorio en Argentina según AEA 90364.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
