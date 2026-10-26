/**
 * ELECTRA PLAN — Modal de Ayuda, Guía de Uso y Normativa Técnica
 * Optimizado para pantallas móviles (360px - 430px) y escritorio.
 */
import React from 'react';
import { X, BookOpen, Zap, Shield, HelpCircle, CheckCircle2 } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-3.5 sm:p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm sm:text-base">
            <BookOpen className="w-5 h-5 shrink-0" />
            <span className="truncate">Guía de Uso y Manual Técnico</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar modal de ayuda"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* 1. Inicio Rápido */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 text-amber-300">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>1. Cómo utilizar el Editor CAD y Cablear en Móvil y PC</span>
            </h3>
            <p>
              • <strong>Seleccionar y Mover:</strong> Con la herramienta "Puntero", toca un símbolo o habitación para seleccionarlo o arrastrarlo. En móvil puedes alternar el modo Mover Plano (✋) o Selección (👆).
            </p>
            <p>
              • <strong>Zoom y Desplazamiento:</strong> En el celular puedes pellizcar con dos dedos para acercar o alejar el plano, o usar los botones flotantes de Zoom (+ / - / Ajustar).
            </p>
            <p>
              • <strong>Herramienta Cablear:</strong> Toca "Cablear", elige el tipo de conductor (Fase, Neutro, Retorno, PE) y pulsa sobre el borne de origen y luego en el borne de destino. Los bornes táctiles se han ampliado para facilitar la conexión con el dedo.
            </p>
            <p>
              • <strong>Accionar Interruptores:</strong> Puedes tocar sobre el interruptor en el plano o en el Simulador para abrirlo o cerrarlo y observar cómo enciende la lámpara conectada.
            </p>
          </div>

          {/* 2. Código de Colores Reglamentario (AEA 90364) */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 text-cyan-300">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>2. Código de Colores Reglamentario de Conductores (Argentina)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#854d0e] shrink-0" />
                <span><strong>Fase (L):</strong> Marrón, Negro o Rojo</span>
              </div>
              <div className="p-2 rounded bg-sky-950/40 border border-sky-800/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7] shrink-0" />
                <span><strong>Neutro (N):</strong> Celeste exclusivo</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#16a34a] shrink-0" />
                <span><strong>Protección (PE):</strong> Verde-Amarillo</span>
              </div>
              <div className="p-2 rounded bg-amber-950/40 border border-amber-600/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b] shrink-0" />
                <span><strong>Retornos:</strong> Gris, Blanco o Negro</span>
              </div>
            </div>
          </div>

          {/* 3. Secciones y Protecciones Mínimas (AEA 771) */}
          <div className="space-y-2">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>3. Secciones Mínimas y Circuitos Residenciales</span>
            </h3>
            <ul className="list-disc pl-4 space-y-1 text-slate-300 text-[11px] sm:text-xs">
              <li><strong>Iluminación de Uso General (IUG):</strong> Sección mínima 1.5 mm², protección máxima con PIA de 10A o 16A, máx 15 bocas.</li>
              <li><strong>Tomacorrientes de Uso General (TUG):</strong> Sección mínima 2.5 mm², protección máxima con PIA de 16A o 20A, tomas 10A IRAM 2071, máx 15 bocas.</li>
              <li><strong>Tomacorrientes Especiales (TUE):</strong> Sección mínima 2.5 mm² o 4.0 mm² con tomas de 20A, máx 12 bocas.</li>
              <li><strong>Línea Principal / Seccional:</strong> Sección mínima reglamentaria 4.0 mm² en cobre.</li>
              <li><strong>Conductor de Protección (PE):</strong> Sección mínima de 2.5 mm² a jabalina de puesta a tierra (RPAT ≤ 40 Ω).</li>
            </ul>
          </div>

          {/* 4. Descargo de Responsabilidad */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-normal">
            <strong>Aviso de Seguridad:</strong> ELECTRA PLAN es una herramienta de asistencia al cálculo y diseño educativo. Las instalaciones eléctricas reales presentan riesgos de choque eléctrico e incendio si no son ejecutadas por personal calificado.
          </div>
        </div>

        {/* Pie */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 flex justify-end bg-slate-950/60 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold rounded-lg text-xs transition-colors text-center"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
