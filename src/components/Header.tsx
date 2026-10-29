/**
 * ELECTRA PLAN — Barra Superior y Acciones Principales
 * Rediseño visual profesional con identidad en verde petróleo (#167D78),
 * soporte de tema claro/oscuro y organización jerárquica de acciones.
 */
import React, { useState, useRef } from 'react';
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
  GraduationCap,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react';
import { Project } from '../types/electra';

interface HeaderProps {
  project: Project;
  onNewProject: () => void;
  onOpenProjectManager: () => void;
  onOpenAcometidaModal: () => void;
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
  interfaceMode: 'aprendizaje' | 'profesional';
  onToggleInterfaceMode: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onNewProject,
  onOpenProjectManager,
  onOpenAcometidaModal,
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
  interfaceMode,
  onToggleInterfaceMode,
  theme,
  onToggleTheme,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <header className="no-print bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-[#F1F5F9] px-3 sm:px-4 py-2 flex items-center justify-between gap-2 shadow-xs relative z-30 transition-colors">
        {/* Logotipo y Título del Proyecto */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Logo Badge en Verde Petróleo #167D78 */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-[#167D78] hover:bg-[#0F5E5A] text-white px-2.5 py-1.5 rounded-lg shadow-xs shrink-0 transition-colors">
            <Zap className="w-4 h-4 fill-white stroke-white" />
            <span className="tracking-wider text-xs sm:text-sm font-extrabold whitespace-nowrap">
              ELECTRA PLAN
            </span>
          </div>

          <div className="hidden sm:block border-l border-[#DCE4E8] dark:border-[#243542] pl-3 min-w-0">
            <div className="text-xs sm:text-sm font-bold text-[#18313B] dark:text-[#F1F5F9] truncate max-w-[190px] md:max-w-[240px]">
              {project.metadata.name || 'Proyecto Eléctrico'}
            </div>
            <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5 font-medium">
              <span>{project.metadata.country} · {project.metadata.normative.split(' ')[0]}</span>
              <span>·</span>
              <span className="text-[#167D78] dark:text-[#2DD4BF] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#167D78] dark:bg-[#2DD4BF] inline-block"></span>
                {saveStatus}
              </span>
            </div>
          </div>

          {/* Selector de Modo: Principiante / Aprendizaje vs Profesional */}
          <button
            onClick={onToggleInterfaceMode}
            title={interfaceMode === 'aprendizaje' ? 'Cambiar a Modo Profesional' : 'Cambiar a Modo Principiante'}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full transition-all border shadow-xs ml-1 ${
              interfaceMode === 'aprendizaje'
                ? 'bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF] border-[#B7DFDD] dark:border-[#167D78]/40 hover:bg-[#D4ECEB]'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-current" />
            <span>{interfaceMode === 'aprendizaje' ? 'Modo Principiante' : 'Modo Profesional'}</span>
          </button>
        </div>

        {/* Acciones para Móvil (< md) */}
        <div className="flex md:hidden items-center gap-1">
          {/* Botón rápido de tema */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            aria-label="Cambiar tema"
            className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#167D78]" />}
          </button>

          {/* Deshacer / Rehacer en móvil */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Deshacer"
            aria-label="Deshacer"
            className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Rehacer"
            aria-label="Rehacer"
            className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Botón Simular compacto móvil */}
          <button
            onClick={onSimulate}
            title="Simular circuito"
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/40'
                : 'bg-[#167D78] hover:bg-[#0F5E5A] text-white shadow-xs'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="text-[11px]">{isSimulating ? 'ON' : 'Simular'}</span>
          </button>

          {/* Menú de Acciones Móvil */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú de acciones"
            className="p-2 text-[#18313B] dark:text-slate-100 bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors ml-0.5"
          >
            <Menu className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
          </button>
        </div>

        {/* Botones de Acción para Escritorio y Tablet (>= md) */}
        <div className="hidden md:flex items-center flex-wrap gap-1.5">
          {/* Acción Primaria: Nuevo Proyecto */}
          <button
            onClick={onNewProject}
            title="Crear un nuevo proyecto desde cero (vacío)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E2E8F0] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors shadow-2xs"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
            <span>Nuevo</span>
          </button>

          {/* Acción Primaria: Guardar */}
          <button
            onClick={onSave}
            title="Guardar cambios del proyecto en el navegador"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#167D78] hover:bg-[#0F5E5A] rounded-lg transition-all shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>

          <div className="h-4 w-px bg-[#DCE4E8] dark:bg-[#243542] mx-0.5" />

          {/* Deshacer / Rehacer */}
          <div className="flex items-center bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-lg p-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Deshacer última acción"
              className="p-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white rounded disabled:opacity-30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Rehacer acción"
              className="p-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white rounded disabled:opacity-30 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-4 w-px bg-[#DCE4E8] dark:bg-[#243542] mx-0.5" />

          {/* Menú Desplegable Archivo (Proyectos, Ejemplos, Importar, Exportar) */}
          <div className="relative">
            <button
              onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
              <span>Archivo</span>
              <ChevronDown className="w-3 h-3 text-[#64748B]" />
            </button>

            {isFileMenuOpen && (
              <div
                className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-xl shadow-xl py-1.5 z-40 text-xs text-[#18313B] dark:text-[#F1F5F9]"
                onMouseLeave={() => setIsFileMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    onOpenProjectManager();
                    setIsFileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36] flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Mis Proyectos</span>
                </button>
                <button
                  onClick={() => {
                    onOpenDemo();
                    setIsFileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Cargar Ejemplo 2 Amb.</span>
                </button>
                <div className="my-1 border-t border-[#DCE4E8] dark:border-[#243542]" />
                <button
                  onClick={() => {
                    onExportJSON();
                    setIsFileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36] flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-[#64748B]" />
                  <span>Exportar JSON</span>
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsFileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36] flex items-center gap-2"
                >
                  <Upload className="w-4 h-4 text-[#64748B]" />
                  <span>Importar JSON</span>
                </button>
              </div>
            )}
          </div>

          {/* Acceso a Acometida & Pilar */}
          <button
            onClick={onOpenAcometidaModal}
            title="Esquema interactivo de Acometida, Pilar de Medición y PAT (AEA 90364)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#167D78] dark:text-[#2DD4BF] bg-[#E8F5F5] dark:bg-[#167D78]/20 hover:bg-[#D4ECEB] border border-[#B7DFDD] dark:border-[#167D78]/40 rounded-lg transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
            <span className="hidden xl:inline">Acometida & Pilar</span>
            <span className="xl:hidden">Pilar</span>
          </button>

          {/* Cálculos AEA */}
          <button
            onClick={onCalculate}
            title="Ir a cálculos normativos de corriente, potencia y caída de tensión"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors"
          >
            <Calculator className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
            <span>Cálculos</span>
          </button>

          {/* Simular */}
          <button
            onClick={onSimulate}
            title="Probar y simular el circuito eléctrico"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-all ${
              isSimulating
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 ring-2 ring-amber-400/30'
                : 'bg-[#167D78] hover:bg-[#0F5E5A] text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{isSimulating ? 'Simulando' : 'Simular'}</span>
          </button>

          <button
            onClick={onPrintReport}
            title="Generar informe técnico imprimible"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
            <span className="hidden xl:inline">Informe</span>
          </button>

          <div className="h-4 w-px bg-[#DCE4E8] dark:bg-[#243542] mx-0.5" />

          {/* Selector de Tema Claro / Oscuro */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a Tema Claro' : 'Cambiar a Tema Oscuro'}
            aria-label="Cambiar tema visual"
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#18313B] dark:text-[#F1F5F9] bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden lg:inline">Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#167D78]" />
                <span className="hidden lg:inline">Oscuro</span>
              </>
            )}
          </button>

          {/* Ayuda */}
          <button
            onClick={onShowHelp}
            title="Guía de uso y normativa"
            className="p-1.5 text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] rounded-lg transition-colors"
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#142028] border-t border-[#DCE4E8] dark:border-[#243542] rounded-t-2xl p-4 max-h-[85vh] overflow-y-auto space-y-3.5 shadow-2xl text-[#18313B] dark:text-[#F1F5F9]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del menú móvil con handle de arrastre */}
            <div className="flex flex-col items-center pb-2 border-b border-[#DCE4E8] dark:border-[#243542]">
              <div className="w-12 h-1 bg-[#DCE4E8] dark:bg-[#243542] rounded-full mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <h3 className="text-sm font-bold truncate">
                    {project.metadata.name || 'Proyecto Eléctrico'}
                  </h3>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5 mt-0.5">
                    <span>{project.metadata.country} · {project.metadata.normative}</span>
                    <span>·</span>
                    <span className="text-[#167D78] dark:text-[#2DD4BF] font-semibold">{saveStatus}</span>
                  </p>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white bg-[#F4F6F8] dark:bg-[#1B2B36] rounded-full transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Alternador de Modo Móvil */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onToggleInterfaceMode();
                }}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  interfaceMode === 'aprendizaje'
                    ? 'bg-[#E8F5F5] dark:bg-[#167D78]/20 border-[#B7DFDD] text-[#167D78] dark:text-[#2DD4BF]'
                    : 'bg-amber-500/10 border-amber-300 text-amber-700 dark:text-amber-300'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>{interfaceMode === 'aprendizaje' ? 'Principiante' : 'Profesional'}</span>
              </button>

              <button
                onClick={onToggleTheme}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] text-xs font-semibold"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#167D78]" />}
                <span>Tema: {theme === 'dark' ? 'Oscuro' : 'Claro'}</span>
              </button>
            </div>

            {/* Grid de Acciones Principales en Celular */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  onNewProject();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] text-left"
              >
                <FilePlus className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF] shrink-0" />
                <div>
                  <div className="font-semibold">Nuevo Proyecto</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Empezar de cero</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onSave();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#167D78] text-white text-left shadow-xs"
              >
                <Save className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-semibold">Guardar</div>
                  <div className="text-[10px] text-white/80">En navegador</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenProjectManager();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] text-left"
              >
                <FolderOpen className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF] shrink-0" />
                <div>
                  <div className="font-semibold">Mis Proyectos</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Gestor de viviendas</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenAcometidaModal();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#E8F5F5] dark:bg-[#167D78]/20 border border-[#B7DFDD] dark:border-[#167D78]/40 text-left text-[#167D78] dark:text-[#2DD4BF]"
              >
                <Zap className="w-4 h-4 shrink-0" />
                <div>
                  <div className="font-semibold">Pilar & PAT</div>
                  <div className="text-[10px] text-[#167D78]/80 dark:text-[#2DD4BF]/80">Esquema medidor</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onOpenDemo();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-left text-amber-800 dark:text-amber-200"
              >
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <div>
                  <div className="font-semibold">Cargar Ejemplo</div>
                  <div className="text-[10px] text-amber-600 dark:text-amber-400">Vivienda 2 amb.</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onCalculate();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] text-left"
              >
                <Calculator className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF] shrink-0" />
                <div>
                  <div className="font-semibold">Cálculos AEA</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Ib, ΔV, térmicas</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onPrintReport();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] text-left"
              >
                <Printer className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                <div>
                  <div className="font-semibold">Informe Técnico</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Imprimir o PDF</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportJSON();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F4F6F8] dark:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] text-left"
              >
                <Download className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
                <div>
                  <div className="font-semibold">Exportar JSON</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">Guardar archivo</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
