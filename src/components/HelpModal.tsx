/**
 * ELECTRA PLAN — Modal de Ayuda, Guía de Uso y Normativa Técnica
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 text-slate-100 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <BookOpen className="w-5 h-5" />
            <span>Guía de Uso y Manual Técnico — ELECTRA PLAN</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* 1. Inicio Rápido */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 text-amber-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>1. Cómo utilizar el Editor CAD y Cablear</span>
            </h3>
            <p>
              • <strong>Seleccionar y Mover:</strong> Usa la herramienta "Puntero" para hacer clic sobre un símbolo, habitación o cable. Puedes arrastrarlo para reubicarlo o presionar <kbd className="font-mono bg-slate-800 px-1 py-0.5 rounded text-white">Supr</kbd> para borrarlo.
            </p>
            <p>
              • <strong>Colocar Elementos:</strong> Selecciona un componente en la barra lateral izquierda y haz clic en cualquier punto del plano.
            </p>
            <p>
              • <strong>Herramienta Cablear:</strong> Selecciona "Cablear", haz clic en el borne de origen (ej. Fase del tablero) y luego en el borne de destino (ej. entrada de tecla o carga). El cable quedará registrado en el modelo de conexiones eléctricas.
            </p>
            <p>
              • <strong>Accionar Interruptores:</strong> Puedes hacer clic sobre el pequeño icono de encendido en cada interruptor directamente sobre el plano para encender o apagar luces en tiempo real.
            </p>
          </div>

          {/* 2. Código de Colores Reglamentario (AEA 90364) */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 text-cyan-300">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>2. Código de Colores Reglamentario de Conductores (Argentina)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#854d0e]" />
                <span><strong>Fase (L):</strong> Marrón, Negro o Rojo</span>
              </div>
              <div className="p-2 rounded bg-sky-950/40 border border-sky-800/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#0284c7]" />
                <span><strong>Neutro (N):</strong> Celeste exclusivo</span>
              </div>
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#16a34a]" />
                <span><strong>Protección (PE):</strong> Verde-Amarillo</span>
              </div>
              <div className="p-2 rounded bg-amber-950/40 border border-amber-600/60 flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-[#f59e0b]" />
                <span><strong>Retornos:</strong> Gris, Blanco o Negro</span>
              </div>
            </div>
          </div>

          {/* 3. Secciones y Protecciones Mínimas (AEA 771) */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>3. Secciones Mínimas y Circuitos Residenciales</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li><strong>Iluminación de Uso General (IUG):</strong> Sección mínima 1.5 mm², protección máxima con PIA de 10A o 16A, máximo 15 bocas por circuito.</li>
              <li><strong>Tomacorrientes de Uso General (TUG):</strong> Sección mínima 2.5 mm², protección máxima con PIA de 16A o 20A, tomas 10A IRAM 2071, máximo 15 bocas.</li>
              <li><strong>Tomacorrientes Especiales (TUE):</strong> Sección mínima 2.5 mm² o 4.0 mm² con tomas de 20A, máximo 12 bocas por circuito.</li>
              <li><strong>Línea Principal / Seccional:</strong> Sección mínima reglamentaria 4.0 mm² en cobre.</li>
              <li><strong>Conductor de Protección a Tierra (PE):</strong> Sección mínima de 2.5 mm² conectado a jabalina de puesta a tierra reglamentaria.</li>
            </ul>
          </div>

          {/* 4. Descargo de Responsabilidad */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-normal">
            <strong>Aviso de Seguridad:</strong> ELECTRA PLAN es una herramienta de asistencia al cálculo y diseño educativo. Las instalaciones eléctricas reales presentan riesgos mortales de choque eléctrico e incendio si no son ejecutadas por personal idóneo. No practiques con tensión de red real sin supervisión profesional calificada.
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
