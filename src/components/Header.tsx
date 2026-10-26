/**
 * ELECTRA PLAN — Barra Superior y Acciones Principales
 */
import React from 'react';
import {
  Zap,
  FolderOpen,
  Save,
  RotateCcw,
  RotateCw,
  Play,
  Calculator,
  Download,
  Upload,
  Printer,
  Sparkles,
  HelpCircle,
  FilePlus,
  Menu,
  X,
  MoreVertical,
} from 'lucide-react';
import { Project } from '../types/electra';

interface HeaderProps {
  project: Project;
  onNewProject: () => void;
  onOpenDemo: () => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onSimulate: () => void;
  onCalculate: () => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrintReport: () => void;
  onShowHelp: () => void;
  isSimulating: boolean;
  saveStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onNewProject,
  onOpenDemo,
  onSave,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onSimulate,
  onCalculate,
  onExportJSON,
  onImportJSON,
  onPrintReport,
  onShowHelp,
  isSimulating,
  saveStatus,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <>
      <header className="no-print bg-slate-900 border-b border-slate-800 text-slate-100 px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 shadow-md relative z-30">
        {/* Logotipo y Título del Proyecto */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold px-2 py-1 rounded-md shadow-xs shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-slate-950 stroke-slate-950" />
            <span className="tracking-wider text-xs sm:text-sm font-extrabold whitespace-nowrap">ELECTRA PLAN</span>
          </div>
          <div className="hidden sm:block border-l border-slate-700 pl-3 min-w-0">
            <div className="text-xs font-semibold text-slate-200 truncate max-w-[200px] md:max-w-[260px]">
              {project.metadata.name || 'Proyecto Sin Título'}
            </div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
              <span>{project.metadata.country} · {project.metadata.normative.split(' ')[0]}</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">{saveStatus}</span>
            </div>
          </div>
        </div>

        {/* Acciones para Móvil (< md) */}
        <div className="flex md:hidden items-center gap-1">
          {/* Deshacer / Rehacer en móvil */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer"
            aria-label="Deshacer"
            className="p-2 text-slate-300 hover:text-white bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer"
            aria-label="Rehacer"
            className="p-2 text-slate-300 hover:text-white bg-slate-800 active:bg-slate-700 border border-slate-700 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Botón Simular compacto móvil */}
          <button
            onClick={onSimulate}
            title="Simular circuito"
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/30'
                : 'bg-emerald-600 text-white active:bg-emerald-500'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="text-[11px]">{isSimulating ? 'ON' : 'Simular'}</span>
          </button>

          {/* Menú de Acciones Móvil */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú de acciones"
            className="p-2 text-slate-200 bg-slate-800 hover:bg-slate-700 active:bg-slate-650 border border-slate-700 rounded-lg transition-colors ml-0.5"
          >
            <Menu className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Botones de Acción para Escritorio y Tablet (>= md) */}
        <div className="hidden md:flex items-center flex-wrap gap-1.5">
          <button
            onClick={onNewProject}
            title="Crear nuevo proyecto en blanco"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Nuevo</span>
          </button>

          <button
            onClick={onOpenDemo}
            title="Cargar proyecto de demostración (Vivienda 2 ambientes)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ejemplo</span>
          </button>

          <button
            onClick={onSave}
            title="Guardar cambios en el almacenamiento local del navegador"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardar</span>
          </button>

          <div className="h-4 w-px bg-slate-750 mx-0.5" />

          {/* Deshacer / Rehacer */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer última acción"
            className="p-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer acción"
            className="p-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-slate-750 mx-0.5" />

          {/* Acciones principales: Calcular & Simular */}
          <button
            onClick={onCalculate}
            title="Ir al módulo de cálculos de potencia, corriente y caída de tensión"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 rounded transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-cyan-400" />
            <span>Calcular</span>
          </button>

          <button
            onClick={onSimulate}
            title="Probar y simular el circuito eléctrico"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded shadow-sm transition-all ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 ring-2 ring-amber-400/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? 'Simulando' : 'Simular'}</span>
          </button>

          <div className="h-4 w-px bg-slate-750 mx-0.5 hidden xl:block" />

          {/* Exportar / Importar JSON */}
          <button
            onClick={onExportJSON}
            title="Exportar archivo de proyecto en formato JSON"
            className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportar</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar proyecto desde archivo JSON"
            className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>Importar</span>
          </button>

          <button
            onClick={onPrintReport}
            title="Generar informe técnico imprimible o guardar en PDF"
            className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Informe</span>
          </button>

          <button
            onClick={onShowHelp}
            title="Guía de uso y normativa"
            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportJSON}
          accept=".json"
          className="hidden"
        />
      </header>

      {/* Modal / Bottom-Sheet de Acciones para Móvil */}
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-slate-900 border-t border-slate-700 rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto space-y-3.5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del menú móvil con handle de arrastre */}
            <div className="flex flex-col items-center pb-2 border-b border-slate-800">
              <div className="w-12 h-1 bg-slate-700 rounded-full mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h3 className="text-sm font-bold text-white truncate">
                    {project.metadata.name || 'Proyecto Eléctrico'}
                  </h3>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{project.metadata.country} · {project.metadata.normative}</span>
                    <span>·</span>
                    <span className="text-emerald-400 font-semibold">{saveStatus}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Grid de Acciones Principales en Celular */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  onSave();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-left text-slate-200"
              >
                <Save className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Guardar</div>
                  <div className="text-[10px] text-slate-400">En navegador</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenDemo();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-950/40 active:bg-amber-900/50 border border-amber-800/60 text-left text-amber-200"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-amber-300">Cargar Ejemplo</div>
                  <div className="text-[10px] text-amber-400/80">Vivienda 2 amb.</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onCalculate();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-cyan-950/40 active:bg-cyan-900/50 border border-cyan-800/60 text-left text-cyan-200"
              >
                <Calculator className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <div className="font-semibold text-cyan-300">Cálculos AEA</div>
                  <div className="text-[10px] text-cyan-400/80">Ib, ΔV, térmicas</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onPrintReport();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-left text-slate-200"
              >
                <Printer className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Informe PDF</div>
                  <div className="text-[10px] text-slate-400">Memoria técnica</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onNewProject();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-left text-slate-200"
              >
                <FilePlus className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Nuevo Proyecto</div>
                  <div className="text-[10px] text-slate-400">En blanco</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportJSON();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-left text-slate-200"
              >
                <Download className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Exportar JSON</div>
                  <div className="text-[10px] text-slate-400">Descargar copia</div>
                </div>
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-left text-slate-200"
              >
                <Upload className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Importar JSON</div>
                  <div className="text-[10px] text-slate-400">Cargar archivo</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onShowHelp();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-left text-slate-200"
              >
                <HelpCircle className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">Guía y Ayuda</div>
                  <div className="text-[10px] text-slate-400">Normativa AEA</div>
                </div>
              </button>
            </div>

            <div className="pt-1 text-center">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full py-2.5 text-xs font-semibold text-slate-400 bg-slate-800/60 rounded-xl"
              >
                Cerrar Menú
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
