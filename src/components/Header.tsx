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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
      {/* Logotipo y Título del Proyecto */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold px-2.5 py-1 rounded-md shadow-sm">
          <Zap className="w-5 h-5 fill-slate-950 stroke-slate-950" />
          <span className="tracking-wider text-sm font-extrabold">ELECTRA PLAN</span>
        </div>
        <div className="hidden sm:block border-l border-slate-700 pl-3">
          <div className="text-xs font-semibold text-slate-200 truncate max-w-[220px]">
            {project.metadata.name || 'Proyecto Sin Título'}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <span>{project.metadata.country} · {project.metadata.normative.split(' ')[0]}</span>
            <span>·</span>
            <span className="text-emerald-400 font-medium">{saveStatus}</span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex items-center flex-wrap gap-1.5">
        <button
          onClick={onNewProject}
          title="Crear nuevo proyecto en blanco"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 rounded transition-colors"
        >
          <FilePlus className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Nuevo</span>
        </button>

        <button
          onClick={onOpenDemo}
          title="Cargar proyecto de demostración (Vivienda 2 ambientes)"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 rounded transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Ejemplo</span>
        </button>

        <button
          onClick={onSave}
          title="Guardar cambios en el almacenamiento local del navegador"
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Guardar</span>
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

        <div className="h-4 w-px bg-slate-750 mx-0.5 hidden lg:block" />

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
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImportJSON}
          accept=".json"
          className="hidden"
        />

        <button
          onClick={onPrintReport}
          title="Generar informe técnico imprimible o guardar en PDF"
          className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
        >
          <Printer className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Informe</span>
        </button>

        <button
          onClick={onShowHelp}
          title="Guía de uso y normativa"
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
