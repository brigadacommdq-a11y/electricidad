/**
 * ELECTRA PLAN — Modal y Guía Interactiva de Códigos de Colores Normalizados
 * Referencia técnica según Normas IRAM 2183 y AEA 90364-771
 * Incluye comparador entre Norma Vigente e Instalaciones Antiguas/Preexistentes.
 */
import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, BookOpen, Layers, Zap } from 'lucide-react';

interface WireColorReferenceModalProps {
  onClose: () => void;
}

export const WireColorReferenceModal: React.FC<WireColorReferenceModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'vigente' | 'antiguas'>('vigente');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#0D161C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#167D78]/15 text-[#167D78] dark:text-[#2DD4BF] flex items-center justify-center">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#18313B] dark:text-white">
                Código de Colores de Conductores (IRAM 2183 / AEA 90364)
              </h2>
              <p className="text-xs text-[#64748B] dark:text-slate-400">
                Guía técnica obligatoria para instalaciones eléctricas en inmuebles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#18313B] dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex border-b border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36] p-1.5 gap-1.5 text-xs">
          <button
            onClick={() => setActiveTab('vigente')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'vigente'
                ? 'bg-white dark:bg-[#142028] text-[#167D78] dark:text-[#2DD4BF] shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
            <span>Norma Vigente (AEA 90364 / IRAM 2183)</span>
          </button>
          <button
            onClick={() => setActiveTab('antiguas')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'antiguas'
                ? 'bg-white dark:bg-[#142028] text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-[#64748B] dark:text-slate-400 hover:text-[#18313B]'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>Instalaciones Existentes / Antiguas</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-[#18313B] dark:text-slate-200">
          {activeTab === 'vigente' ? (
            <div className="space-y-4">
              <div className="bg-[#E8F5F5] dark:bg-[#167D78]/20 border border-[#167D78]/40 p-3 rounded-xl text-xs text-[#167D78] dark:text-[#2DD4BF]">
                <strong>Regla de Oro Reglamentaria:</strong> Los colores identifican la FUNCIÓN ELÉCTRICA de cada conductor, no el tipo de circuito (IUG/TUG). Está terminantemente prohibido utilizar el color celeste o el verde-amarillo para funciones distintas a las normalizadas.
              </div>

              {/* Lista de conductores normalizados */}
              <div className="space-y-2.5">
                {/* FASE L1 */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1A2833] border border-[#DCE4E8] dark:border-[#2A3C4A] rounded-xl">
                  <div className="w-10 h-6 rounded-md bg-[#92400e] border border-amber-950 shrink-0 shadow-inner flex items-center justify-center text-white font-mono font-bold text-[10px]">
                    L1
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#18313B] dark:text-white flex items-center gap-2">
                      <span>Fase L1 (Línea Monofásica o Fase R)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                        Marrón
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      Conductor activo estándar para todas las líneas monofásicas de 220V.
                    </p>
                  </div>
                </div>

                {/* FASES L2 y L3 */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1A2833] border border-[#DCE4E8] dark:border-[#2A3C4A] rounded-xl">
                  <div className="flex flex-col gap-1 shrink-0">
                    <div className="w-10 h-3 rounded bg-[#18181b] border border-slate-900 text-white font-mono font-bold text-[8px] flex items-center justify-center">L2</div>
                    <div className="w-10 h-3 rounded bg-[#dc2626] border border-red-900 text-white font-mono font-bold text-[8px] flex items-center justify-center">L3</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#18313B] dark:text-white flex items-center gap-2">
                      <span>Fases L2 y L3 (Fase S y Fase T en Trifásica 380V)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                        Negro y Rojo
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      Fase S: Negro (#18181b). Fase T: Rojo (#dc2626). Para tableros trifásicos y balance de cargas.
                    </p>
                  </div>
                </div>

                {/* NEUTRO */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1A2833] border border-[#DCE4E8] dark:border-[#2A3C4A] rounded-xl">
                  <div className="w-10 h-6 rounded-md bg-[#0284c7] border border-blue-900 shrink-0 shadow-inner flex items-center justify-center text-white font-mono font-bold text-[10px]">
                    N
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#18313B] dark:text-white flex items-center gap-2">
                      <span>Conductor Neutro</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                        Celeste Exclusivo
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      Uso EXCLUSIVO e INDELEGABLE. Prohibido usar como fase, retorno, puente o tierra.
                    </p>
                  </div>
                </div>

                {/* PROTECCIÓN PE */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1A2833] border border-[#DCE4E8] dark:border-[#2A3C4A] rounded-xl">
                  <div className="w-10 h-6 rounded-md bg-[#facc15] border border-emerald-800 shrink-0 shadow-inner flex items-center justify-center overflow-hidden relative">
                    {/* Franjas diagonales verdes */}
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, #15803d, #15803d 4px, #facc15 4px, #facc15 8px)',
                      }}
                    />
                    <span className="relative z-10 text-white font-mono font-black text-[9px] drop-shadow-md">PE</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#18313B] dark:text-white flex items-center gap-2">
                      <span>Protección a Tierra (PE)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                        Bicolor Verde-Amarillo
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      Conductor de protección equipotencial conectado a la jabalina. Jamás debe transportar corriente de servicio ni conectarse como conductor activo.
                    </p>
                  </div>
                </div>

                {/* RETORNOS */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1A2833] border border-[#DCE4E8] dark:border-[#2A3C4A] rounded-xl">
                  <div className="w-10 h-6 rounded-md bg-[#a855f7] border border-purple-900 shrink-0 shadow-inner flex items-center justify-center text-white font-mono font-bold text-[10px]">
                    R
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#18313B] dark:text-white flex items-center gap-2">
                      <span>Retornos de Iluminación</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                        Violeta / Blanco / Gris
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      Va desde el interruptor unipolar hacia el borne de la luminaria. No confundir con neutro.
                    </p>
                  </div>
                </div>

                {/* PUENTES COMBINACIÓN */}
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-[#1A2833] border border-[#DCE4E8] dark:border-[#2A3C4A] rounded-xl">
                  <div className="w-10 h-6 rounded-md bg-[#f97316] border border-orange-900 shrink-0 shadow-inner flex items-center justify-center text-white font-mono font-bold text-[10px]">
                    P
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[#18313B] dark:text-white flex items-center gap-2">
                      <span>Puentes de Combinación (Escalera)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 font-bold">
                        Naranja / Violeta
                      </span>
                    </div>
                    <p className="text-xs text-[#64748B] dark:text-slate-400 mt-0.5">
                      Conductores que interconectan los bornes auxiliares (P1 y P2) entre dos llaves conmutadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/50 p-3.5 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Criterio para Inmuebles Construidos antes de 1980 / 1990</span>
                </div>
                <p>
                  En instalaciones antiguas argentinas o reformas no homologadas, es habitual encontrar códigos de colores diferentes a la norma actual.
                  <strong> NUNCA confíe únicamente en el color visual sin verificar con instrumental.</strong>
                </p>
              </div>

              <div className="border border-[#DCE4E8] dark:border-[#2A3C4A] rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8FAFC] dark:bg-[#1A2833] text-[#64748B] dark:text-slate-400 font-bold border-b border-[#DCE4E8] dark:border-[#2A3C4A]">
                    <tr>
                      <th className="p-2.5">Función</th>
                      <th className="p-2.5">Color Antiguo Común</th>
                      <th className="p-2.5 text-red-600 dark:text-red-400">Riesgo Típico</th>
                      <th className="p-2.5 text-[#167D78] dark:text-[#2DD4BF]">Reemplazo AEA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE4E8] dark:divide-[#2A3C4A]">
                    <tr>
                      <td className="p-2.5 font-bold">Fase</td>
                      <td className="p-2.5">Rojo, Blanco o Negro</td>
                      <td className="p-2.5 text-[#64748B] dark:text-slate-400">El negro se confunde con neutro viejo</td>
                      <td className="p-2.5 font-bold text-[#92400e]">Marrón (L1)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Neutro</td>
                      <td className="p-2.5">Negro o Azul Oscuro</td>
                      <td className="p-2.5 text-red-600 dark:text-red-400 font-medium">¡Puede confundirse con fase viva!</td>
                      <td className="p-2.5 font-bold text-[#0284c7]">Celeste</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Tierra PE</td>
                      <td className="p-2.5">Cable desnudo o inexistente</td>
                      <td className="p-2.5 text-red-600 dark:text-red-400 font-medium">Falta de protección a contactos indirectos</td>
                      <td className="p-2.5 font-bold text-[#15803d]">Verde-Amarillo</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">Retorno</td>
                      <td className="p-2.5">Cualquier retazo sobrante</td>
                      <td className="p-2.5 text-[#64748B] dark:text-slate-400">Falta de trazabilidad en cajas</td>
                      <td className="p-2.5 font-bold text-[#a855f7]">Violeta / Gris</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                <span className="font-bold text-[#18313B] dark:text-white">Procedimiento de Adecuación y Seguridad:</span>
                <ol className="list-decimal list-inside space-y-1 text-[#64748B] dark:text-slate-300">
                  <li>Cortar la energía general antes de abrir cualquier caja de derivación.</li>
                  <li>Identificar con multímetro o analizador de polaridad Fase viva (220V respecto a tierra).</li>
                  <li>Repasar o recablear con conductores normalizados tipo IRAM 2183 / NM 247-3.</li>
                  <li>Incorporar conductor de protección PE verde-amarillo si no existiera en la cañería.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Pie con botón de cierre */}
        <div className="p-4 border-t border-[#DCE4E8] dark:border-[#243542] bg-[#F8FAFC] dark:bg-[#0D161C] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#167D78] hover:bg-[#0F5E5A] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
