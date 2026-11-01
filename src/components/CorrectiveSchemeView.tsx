/**
 * ELECTRA PLAN — Componente de Visualización y Comparación de Esquema Correctivo
 * "MOSTRARME CÓMO DEBERÍA QUEDAR"
 * Representación visual técnica interactiva con conexiones en colores normalizados (IRAM 2183 / AEA 90364)
 * y comparativa Antes y Después.
 */
import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info,
  Maximize2,
  HelpCircle,
  Layers,
  ArrowLeftRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export interface CorrectiveSchemeData {
  schemeTitle: string;
  diagramType: 'tablero' | 'tomacorriente' | 'interruptor_luminaria' | 'caja_derivacion' | 'pilar_acometida' | 'maquina_taller' | 'general';
  summary: string;
  requiredComponents: {
    id: string;
    name: string;
    technicalSpec: string;
    role: string;
    normativeRef: string;
  }[];
  connections: {
    id: string;
    from: string;
    to: string;
    conductorType: 'fase' | 'neutro' | 'tierra' | 'retorno' | 'puente';
    color: string;
    crossSectionMm2: number;
    purpose: string;
  }[];
  differencesBeforeAfter: {
    aspect: string;
    observedInPhoto: string;
    correctedState: string;
  }[];
  stepByStepExecution: string[];
  safetyDisclaimer: string;
}

interface CorrectiveSchemeViewProps {
  data: CorrectiveSchemeData;
  originalPhotoUrl: string | null;
  onAskQuestionAboutComponent: (question: string) => void;
  onBackToAnalysis: () => void;
}

export const CorrectiveSchemeView: React.FC<CorrectiveSchemeViewProps> = ({
  data,
  originalPhotoUrl,
  onAskQuestionAboutComponent,
  onBackToAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<'esquema' | 'comparativa' | 'pasos'>('esquema');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const selectedConn = data.connections.find((c) => c.id === selectedElementId);
  const selectedComp = data.requiredComponents.find((c) => c.id === selectedElementId);

  return (
    <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Cabecera del Esquema Correctivo */}
      <div className="p-4 sm:p-5 bg-linear-to-r from-[#167D78]/15 via-[#167D78]/5 to-transparent border-b border-[#DCE4E8] dark:border-[#243542] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#167D78] text-white flex items-center justify-center shadow-md shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]">
                SOLUCIÓN TÉCNICA AEA 90364
              </span>
              <span className="text-xs text-[#64748B] dark:text-slate-400">Cómo debería quedar</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#18313B] dark:text-white mt-0.5">
              {data.schemeTitle}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBackToAnalysis}
            className="px-3 py-1.5 rounded-lg border border-[#DCE4E8] dark:border-[#243542] text-xs font-semibold text-[#64748B] hover:text-[#18313B] dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ← Volver a la Foto
          </button>
        </div>
      </div>

      {/* Pestañas de Vista */}
      <div className="flex border-b border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#0D161C] p-1.5 gap-1.5 text-xs">
        <button
          onClick={() => setActiveTab('esquema')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'esquema'
              ? 'bg-white dark:bg-[#142028] text-[#167D78] dark:text-[#2DD4BF] shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B]'
          }`}
        >
          <Zap className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
          <span>Esquema Eléctrico Interactivo</span>
        </button>

        <button
          onClick={() => setActiveTab('comparativa')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'comparativa'
              ? 'bg-white dark:bg-[#142028] text-[#167D78] dark:text-[#2DD4BF] shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B]'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4 text-amber-500" />
          <span>Antes y Después (Contraste)</span>
        </button>

        <button
          onClick={() => setActiveTab('pasos')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'pasos'
              ? 'bg-white dark:bg-[#142028] text-[#167D78] dark:text-[#2DD4BF] shadow-xs'
              : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Procedimiento Seguro</span>
        </button>
      </div>

      {/* Resumen explicativo */}
      <div className="p-3 sm:px-6 py-2.5 bg-[#E8F5F5] dark:bg-[#167D78]/15 border-b border-[#B7DFDD] dark:border-[#167D78]/30 flex items-start gap-2.5 text-xs text-[#167D78] dark:text-[#2DD4BF]">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">{data.summary}</p>
      </div>

      {/* Contenido principal según pestaña */}
      <div className="p-4 sm:p-6 overflow-y-auto max-h-[650px] space-y-6">
        {activeTab === 'esquema' && (
          <div className="space-y-6">
            {/* Lienzo Gráfico Interactivo del Esquema Eléctrico Correctivo */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 relative overflow-x-auto shadow-inner">
              <div className="text-[11px] font-mono text-slate-400 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Haz clic en cualquier cable o componente para consultar sus detalles técnicos
                </span>
                <span className="text-slate-500 text-[10px]">Normas IRAM 2183 / AEA 771</span>
              </div>

              {/* Diagrama Esquemático Vectorial según tipo de instalación */}
              <div className="min-w-[600px] flex flex-col items-center justify-center py-4">
                {/* SVG del Esquema Técnico Normalizado */}
                <svg viewBox="0 0 760 380" className="w-full h-auto max-w-3xl select-none">
                  <defs>
                    {/* Patrón rayado verde-amarillo para tierra */}
                    <pattern id="pe-stripe" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="6" height="12" fill="#15803d" />
                      <rect x="6" width="6" height="12" fill="#facc15" />
                    </pattern>
                  </defs>

                  {/* 1. Módulos / Dispositivos Principales */}
                  {data.diagramType === 'tablero' ? (
                    // Diagrama de Tablero Normalizado (IGA -> ID -> PIAs -> Barra PE)
                    <g>
                      {/* Fondo de Riel DIN */}
                      <rect x="50" y="160" width="660" height="24" rx="3" fill="#334155" opacity="0.6" />
                      <line x1="50" y1="172" x2="710" y2="172" stroke="#64748b" strokeWidth="2" strokeDasharray="6,3" />

                      {/* 1. IGA General (Corte Cabecera) */}
                      <g
                        transform="translate(80, 110)"
                        onClick={() => setSelectedElementId(data.requiredComponents[0]?.id || 'iga')}
                        className="cursor-pointer hover:opacity-90"
                      >
                        <rect x="0" y="0" width="70" height="120" rx="6" fill="#1e293b" stroke="#dc2626" strokeWidth="2.5" />
                        <rect x="10" y="15" width="50" height="30" rx="3" fill="#0f172a" />
                        <rect x="25" y="20" width="20" height="20" rx="2" fill="#dc2626" />
                        <text x="35" y="70" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">IGA 32A</text>
                        <text x="35" y="84" textAnchor="middle" fill="#94a3b8" fontSize="7.5">2P Curva C</text>
                        <text x="35" y="105" textAnchor="middle" fill="#f87171" fontSize="7" fontWeight="bold">Cabecera</text>
                        {/* Bornes L y N */}
                        <circle cx="20" cy="5" r="4" fill="#92400e" />
                        <circle cx="50" cy="5" r="4" fill="#0284c7" />
                        <circle cx="20" cy="115" r="4" fill="#92400e" />
                        <circle cx="50" cy="115" r="4" fill="#0284c7" />
                      </g>

                      {/* 2. Disyuntor Diferencial (ID 30mA) */}
                      <g
                        transform="translate(190, 110)"
                        onClick={() => setSelectedElementId(data.requiredComponents[1]?.id || 'diff')}
                        className="cursor-pointer hover:opacity-90"
                      >
                        <rect x="0" y="0" width="76" height="120" rx="6" fill="#1e293b" stroke="#0284c7" strokeWidth="2.5" />
                        <rect x="10" y="15" width="56" height="30" rx="3" fill="#0f172a" />
                        <circle cx="24" cy="30" r="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
                        <text x="24" y="33" textAnchor="middle" fill="#713f12" fontSize="7.5" fontWeight="black">T</text>
                        <rect x="42" y="22" width="16" height="16" rx="2" fill="#0284c7" />
                        <text x="38" y="70" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">DIFERENCIAL</text>
                        <text x="38" y="84" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">40A 30mA</text>
                        <text x="38" y="105" textAnchor="middle" fill="#4ade80" fontSize="7" fontWeight="bold">Vida Humana</text>
                        <circle cx="22" cy="5" r="4" fill="#92400e" />
                        <circle cx="54" cy="5" r="4" fill="#0284c7" />
                        <circle cx="22" cy="115" r="4" fill="#92400e" />
                        <circle cx="54" cy="115" r="4" fill="#0284c7" />
                      </g>

                      {/* 3. PIAs de Circuitos (C1 Iluminación, C2 Tomas, C3 Especial) */}
                      <g transform="translate(310, 110)">
                        {/* PIA C1 */}
                        <g onClick={() => setSelectedElementId('c1')} className="cursor-pointer hover:opacity-90">
                          <rect x="0" y="0" width="55" height="120" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                          <rect x="18" y="20" width="18" height="20" rx="2" fill="#0f172a" />
                          <text x="27" y="70" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">C1 (IUG)</text>
                          <text x="27" y="84" textAnchor="middle" fill="#94a3b8" fontSize="8">C10 1.5mm²</text>
                          <text x="27" y="105" textAnchor="middle" fill="#fbbf24" fontSize="7">Luces</text>
                          <circle cx="16" cy="5" r="4" fill="#92400e" />
                          <circle cx="38" cy="5" r="4" fill="#0284c7" />
                          <circle cx="16" cy="115" r="4" fill="#92400e" />
                          <circle cx="38" cy="115" r="4" fill="#0284c7" />
                        </g>

                        {/* PIA C2 */}
                        <g transform="translate(70, 0)" onClick={() => setSelectedElementId('c2')} className="cursor-pointer hover:opacity-90">
                          <rect x="0" y="0" width="55" height="120" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                          <rect x="18" y="20" width="18" height="20" rx="2" fill="#0f172a" />
                          <text x="27" y="70" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">C2 (TUG)</text>
                          <text x="27" y="84" textAnchor="middle" fill="#94a3b8" fontSize="8">C16 2.5mm²</text>
                          <text x="27" y="105" textAnchor="middle" fill="#38bdf8" fontSize="7">Tomas 10A</text>
                          <circle cx="16" cy="5" r="4" fill="#92400e" />
                          <circle cx="38" cy="5" r="4" fill="#0284c7" />
                          <circle cx="16" cy="115" r="4" fill="#92400e" />
                          <circle cx="38" cy="115" r="4" fill="#0284c7" />
                        </g>

                        {/* PIA C3 */}
                        <g transform="translate(140, 0)" onClick={() => setSelectedElementId('c3')} className="cursor-pointer hover:opacity-90">
                          <rect x="0" y="0" width="55" height="120" rx="6" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                          <rect x="18" y="20" width="18" height="20" rx="2" fill="#0f172a" />
                          <text x="27" y="70" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="bold">C3 (TUE)</text>
                          <text x="27" y="84" textAnchor="middle" fill="#94a3b8" fontSize="8">C20 4.0mm²</text>
                          <text x="27" y="105" textAnchor="middle" fill="#f43f5e" fontSize="7">Bomba / AC</text>
                          <circle cx="16" cy="5" r="4" fill="#92400e" />
                          <circle cx="38" cy="5" r="4" fill="#0284c7" />
                          <circle cx="16" cy="115" r="4" fill="#92400e" />
                          <circle cx="38" cy="115" r="4" fill="#0284c7" />
                        </g>
                      </g>

                      {/* 4. Barra Colectora de Tierra PE */}
                      <g transform="translate(120, 290)">
                        <rect x="0" y="0" width="500" height="20" rx="3" fill="#ca8a04" stroke="#eab308" strokeWidth="1" />
                        <text x="250" y="14" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="black" letterSpacing="2">
                          BARRA EQUIPOTENCIAL PRINCIPAL PE (LATÓN / BRONCE)
                        </text>
                        {/* Tornillos de conexión a tierra */}
                        {[30, 80, 150, 220, 300, 370, 450].map((tx, idx) => (
                          <circle key={idx} cx={tx} cy={10} r="3" fill="#713f12" />
                        ))}
                      </g>

                      {/* 5. Jabalina de Puesta a Tierra */}
                      <g transform="translate(640, 270)">
                        <circle cx="20" cy="20" r="18" fill="#1e293b" stroke="#15803d" strokeWidth="2" />
                        <circle cx="20" cy="20" r="7" fill="#b45309" />
                        <line x1="8" y1="20" x2="32" y2="20" stroke="#facc15" strokeWidth="2" />
                        <line x1="12" y1="24" x2="28" y2="24" stroke="#facc15" strokeWidth="2" />
                        <line x1="16" y1="28" x2="24" y2="28" stroke="#facc15" strokeWidth="2" />
                        <text x="20" y="48" textAnchor="middle" fill="#4ade80" fontSize="8" fontWeight="bold">JABALINA PAT</text>
                      </g>

                      {/* Cables Interconexión Normalizada */}
                      {/* Puente IGA a Diferencial */}
                      <path d="M 100 225 L 100 250 L 212 250 L 212 115" fill="none" stroke="#92400e" strokeWidth="3.5" />
                      <path d="M 130 225 L 130 260 L 244 260 L 244 115" fill="none" stroke="#0284c7" strokeWidth="3.5" />

                      {/* Peine de Distribución desde Diferencial a PIAs */}
                      <path d="M 212 225 L 212 250 L 326 250 L 326 115" fill="none" stroke="#92400e" strokeWidth="3" />
                      <path d="M 326 250 L 396 250 L 396 115" fill="none" stroke="#92400e" strokeWidth="3" />
                      <path d="M 396 250 L 466 250 L 466 115" fill="none" stroke="#92400e" strokeWidth="3" />

                      <path d="M 244 225 L 244 260 L 348 260 L 348 115" fill="none" stroke="#0284c7" strokeWidth="3" />
                      <path d="M 348 260 L 418 260 L 418 115" fill="none" stroke="#0284c7" strokeWidth="3" />
                      <path d="M 418 260 L 488 260 L 488 115" fill="none" stroke="#0284c7" strokeWidth="3" />

                      {/* Conductor PE hacia Jabalina */}
                      <path d="M 570 300 L 640 300 L 640 288" fill="none" stroke="#facc15" strokeWidth="4" />
                      <path d="M 570 300 L 640 300 L 640 288" fill="none" stroke="#15803d" strokeWidth="4" strokeDasharray="6,6" />
                    </g>
                  ) : (
                    // Diagrama para Tomacorriente / Tecla / Conexión General
                    <g>
                      {/* Fondo de caja de derivación o embutir */}
                      <rect x="80" y="50" width="600" height="280" rx="12" fill="#0f172a" stroke="#334155" strokeWidth="2" />

                      {/* Componente Izquierdo: Alimentación / Caja */}
                      <rect x="110" y="100" width="130" height="180" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
                      <text x="175" y="130" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">ALIMENTACIÓN</text>
                      <text x="175" y="148" textAnchor="middle" fill="#94a3b8" fontSize="9">Desde Tablero Seccional</text>

                      {/* Bornes L, N, PE */}
                      <circle cx="150" cy="180" r="7" fill="#92400e" />
                      <text x="150" y="184" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">L</text>
                      <text x="185" y="184" fill="#92400e" fontSize="9" fontWeight="bold">Fase (Marrón)</text>

                      <circle cx="150" cy="215" r="7" fill="#0284c7" />
                      <text x="150" y="219" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">N</text>
                      <text x="185" y="219" fill="#0284c7" fontSize="9" fontWeight="bold">Neutro (Celeste)</text>

                      <circle cx="150" cy="250" r="7" fill="#15803d" stroke="#facc15" strokeWidth="2" />
                      <text x="150" y="254" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">PE</text>
                      <text x="185" y="254" fill="#22c55e" fontSize="9" fontWeight="bold">Tierra (Verde-Am.)</text>

                      {/* Componente Derecho: Tomacorriente / Módulo IRAM 2071 */}
                      <g transform="translate(480, 90)">
                        <rect x="0" y="0" width="150" height="200" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
                        <circle cx="75" cy="100" r="55" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
                        {/* Ranura Fase */}
                        <g transform="translate(55, 88) rotate(30)">
                          <rect x="-3" y="-10" width="6" height="20" rx="1.5" fill="#0f172a" />
                          <circle cx="0" cy="0" r="3" fill="#92400e" />
                        </g>
                        {/* Ranura Neutro */}
                        <g transform="translate(95, 88) rotate(-30)">
                          <rect x="-3" y="-10" width="6" height="20" rx="1.5" fill="#0f172a" />
                          <circle cx="0" cy="0" r="3" fill="#0284c7" />
                        </g>
                        {/* Ranura Tierra */}
                        <g transform="translate(75, 125)">
                          <rect x="-3" y="-12" width="6" height="24" rx="1.5" fill="#0f172a" />
                          <circle cx="0" cy="0" r="3" fill="#15803d" />
                        </g>
                        <text x="75" y="175" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold">IRAM 2071 (2P+T)</text>
                      </g>

                      {/* Cable Fase */}
                      <path d="M 157 180 C 280 180, 360 170, 525 178" fill="none" stroke="#92400e" strokeWidth="4" />
                      {/* Cable Neutro */}
                      <path d="M 157 215 C 280 215, 360 195, 565 178" fill="none" stroke="#0284c7" strokeWidth="4" />
                      {/* Cable Tierra Bicolor */}
                      <path d="M 157 250 C 280 250, 380 230, 555 215" fill="none" stroke="#facc15" strokeWidth="4.5" />
                      <path d="M 157 250 C 280 250, 380 230, 555 215" fill="none" stroke="#15803d" strokeWidth="4.5" strokeDasharray="8,8" />
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Listado de Componentes Necesarios y Conexiones Normalizadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Componentes Reglamentarios */}
              <div className="p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#1A2833] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#18313B] dark:text-white uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Componentes y Protecciones Requeridas</span>
                </div>
                <div className="space-y-2">
                  {data.requiredComponents.map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedElementId(comp.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedElementId === comp.id
                          ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] font-semibold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#142028] text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{comp.name}</span>
                        <span className="text-[10px] text-slate-400">{comp.normativeRef}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{comp.technicalSpec}</div>
                      <div className="text-[10px] text-[#167D78] dark:text-[#2DD4BF] mt-1 font-medium">{comp.role}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conexiones y Conductores Normalizados */}
              <div className="p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#1A2833] space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#18313B] dark:text-white uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Conexiones y Cableado (IRAM 2183)</span>
                </div>
                <div className="space-y-2">
                  {data.connections.map((conn) => (
                    <div
                      key={conn.id}
                      onClick={() => setSelectedElementId(conn.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        selectedElementId === conn.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/25 text-amber-900 dark:text-amber-200 font-semibold'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#142028] text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                conn.conductorType === 'fase'
                                  ? '#92400e'
                                  : conn.conductorType === 'neutro'
                                  ? '#0284c7'
                                  : conn.conductorType === 'tierra'
                                  ? '#15803d'
                                  : '#a855f7',
                            }}
                          />
                          <span>{conn.from} → {conn.to}</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold">{conn.crossSectionMm2} mm²</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{conn.purpose}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">{conn.color}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Panel de Consulta Rápida con la IA sobre el elemento seleccionado */}
            {(selectedComp || selectedConn) && (
              <div className="p-4 bg-[#E8F5F5] dark:bg-[#167D78]/15 border border-[#167D78]/40 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#167D78] dark:text-[#2DD4BF]">
                    Elemento seleccionado: {selectedComp?.name || `${selectedConn?.from} → ${selectedConn?.to}`}
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">
                    ¿Quieres saber por qué va conectado así o qué pasa si se omite?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      onAskQuestionAboutComponent(
                        `¿Por qué va conectado así ${selectedComp?.name || selectedConn?.from} en este esquema y qué exige la norma AEA 90364?`
                      )
                    }
                    className="px-3 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] text-white font-bold rounded-lg shadow-xs transition-colors"
                  >
                    Preguntar en el Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pestaña: Comparativa Antes y Después */}
        {activeTab === 'comparativa' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Lado 1: Situación Observada en la Foto Original */}
              <div className="border border-red-300 dark:border-red-900/60 rounded-xl p-4 bg-red-50/40 dark:bg-red-950/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Situación Observada en la Fotografía</span>
                </div>
                {originalPhotoUrl && (
                  <div className="relative rounded-lg overflow-hidden border border-red-200 dark:border-red-900/40 max-h-56">
                    <img src={originalPhotoUrl} alt="Foto original" className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-xs text-red-800 dark:text-red-200">
                  Condición actual identificada con riesgos normativos o faltantes mecánicos/eléctricos.
                </p>
              </div>

              {/* Lado 2: Propuesta de Corrección Normalizada */}
              <div className="border border-emerald-300 dark:border-emerald-900/60 rounded-xl p-4 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Instalación Correctamente Ejecutada (AEA 90364)</span>
                </div>
                <div className="p-4 bg-slate-900 rounded-lg border border-emerald-500/30 text-center text-xs text-emerald-400 font-mono py-12">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  <span>Protección Integral: Corte Omnipolar + Disyuntor 30mA + Puesta a Tierra</span>
                </div>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  Garantiza seguridad de las personas, vida útil de artefactos y no propagación de incendios.
                </p>
              </div>
            </div>

            {/* Tabla de diferencias detalladas */}
            <div className="border border-[#DCE4E8] dark:border-[#243542] rounded-xl overflow-hidden">
              <div className="p-3 bg-[#F8FAFC] dark:bg-[#1A2833] font-bold text-xs text-[#18313B] dark:text-white border-b border-[#DCE4E8] dark:border-[#243542]">
                Diferencias Clave: Lo Observado vs. La Solución Correcta
              </div>
              <div className="divide-y divide-[#DCE4E8] dark:divide-[#243542] text-xs">
                {data.differencesBeforeAfter.map((diff, idx) => (
                  <div key={idx} className="p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="font-bold text-[#18313B] dark:text-slate-200">{diff.aspect}</div>
                    <div className="text-red-700 dark:text-red-400 flex items-start gap-1">
                      <span className="font-bold">Antes:</span> {diff.observedInPhoto}
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-300 flex items-start gap-1">
                      <span className="font-bold">Correcto:</span> {diff.correctedState}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pestaña: Pasos de Ejecución Segura */}
        {activeTab === 'pasos' && (
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 p-4 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Protocolo de Seguridad Fundamental (5 Reglas de Oro)</span>
              </div>
              <p>
                Toda tarea debe realizarse sin tensión eléctrica. Desconecta siempre el interruptor general (IGA) de cabecera y verifica con voltímetro que no exista potencial antes de manipular cualquier conductor o bornera.
              </p>
            </div>

            <div className="border border-[#DCE4E8] dark:border-[#243542] rounded-xl p-4 bg-white dark:bg-[#1A2833] space-y-3">
              <h4 className="font-bold text-xs sm:text-sm text-[#18313B] dark:text-white">
                Pasos recomendados para la ejecución técnica:
              </h4>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {data.stepByStepExecution.map((step, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#142028] border border-slate-200 dark:border-slate-800 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#167D78] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pie con Advertencia Reglamentaria Obligatoria */}
      <div className="p-3.5 sm:p-4 bg-[#F8FAFC] dark:bg-[#0D161C] border-t border-[#DCE4E8] dark:border-[#243542] flex items-center justify-between gap-3 text-xs">
        <span className="text-[11px] text-[#64748B] dark:text-slate-400 italic">
          ⚠️ {data.safetyDisclaimer}
        </span>
        <button
          onClick={() =>
            onAskQuestionAboutComponent(
              `¿Qué herramientas y precauciones específicas necesito para realizar la corrección según este esquema?`
            )
          }
          className="px-3.5 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
        >
          Consultar en Chat
        </button>
      </div>
    </div>
  );
};
