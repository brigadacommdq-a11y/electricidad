/**
 * ELECTRA PLAN — Gestor de Proyectos y Creación de Vivienda desde Cero
 * Permite iniciar proyectos en blanco, elegir nombre, abrir proyectos guardados,
 * duplicar, borrar y volver a abrir la Vivienda Prototipo en cualquier momento.
 */
import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Clock,
  Sparkles,
  Layers,
  Zap,
  X,
  AlertTriangle,
  Save,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Project } from '../types/electra';
import {
  ProjectMetadataSummary,
  getSavedProjectsList,
  createEmptyProject,
  loadProjectFromStorage,
  deleteProjectFromStorage,
  duplicateProjectInStorage,
  saveProjectToStorage,
  DEMO_PROJECT_ID,
} from '../services/projectStorage';

interface ProjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: Project;
  onSelectProject: (project: Project) => void;
  hasUnsavedChanges: boolean;
  onSaveCurrent: () => void;
}

export const ProjectManagerModal: React.FC<ProjectManagerModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onSelectProject,
  hasUnsavedChanges,
  onSaveCurrent,
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'new'>('list');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [projectsList, setProjectsList] = useState<ProjectMetadataSummary[]>(() =>
    getSavedProjectsList()
  );

  const refreshList = () => {
    setProjectsList(getSavedProjectsList());
  };

  if (!isOpen) return null;

  const handleCreateNew = (forceDiscard = false) => {
    if (!newProjectName.trim()) {
      alert('Por favor, ingresa un nombre para el nuevo proyecto.');
      return;
    }

    if (hasUnsavedChanges && !forceDiscard) {
      if (
        confirm(
          'Tienes modificaciones en el proyecto actual. ¿Deseas guardarlas antes de crear el nuevo proyecto?'
        )
      ) {
        onSaveCurrent();
      }
    }

    const blankProject = createEmptyProject(newProjectName, newProjectClient);
    saveProjectToStorage(blankProject);
    onSelectProject(blankProject);
    setNewProjectName('');
    setNewProjectClient('');
    onClose();
  };

  const handleOpenProject = (id: string) => {
    if (id === currentProject.metadata.id) {
      onClose();
      return;
    }

    if (hasUnsavedChanges) {
      if (
        confirm(
          'Tienes modificaciones en el proyecto actual. ¿Deseas guardarlas antes de cambiar de proyecto?'
        )
      ) {
        onSaveCurrent();
      }
    }

    const loaded = loadProjectFromStorage(id);
    if (loaded) {
      onSelectProject(loaded);
      onClose();
    } else {
      alert('No se pudo abrir el proyecto seleccionado.');
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (id === DEMO_PROJECT_ID) {
      alert('La plantilla de demostración no puede ser eliminada.');
      return;
    }
    if (confirm(`¿Estás seguro de que deseas eliminar el proyecto "${name}"? Esta acción no se puede deshacer.`)) {
      if (deleteProjectFromStorage(id)) {
        refreshList();
        // Si borramos el proyecto actual, cargar la plantilla
        if (currentProject.metadata.id === id) {
          const fallback = loadProjectFromStorage(DEMO_PROJECT_ID);
          if (fallback) onSelectProject(fallback);
        }
      }
    }
  };

  const handleDuplicate = (id: string) => {
    const cloned = duplicateProjectInStorage(id);
    if (cloned) {
      refreshList();
      alert(`¡Proyecto duplicado como "${cloned.metadata.name}"!`);
    }
  };

  const filteredProjects = projectsList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client && p.client.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Gestor */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Gestor de Proyectos de Viviendas</h2>
              <p className="text-xs text-slate-400">
                Crea viviendas desde cero, abre proyectos guardados o vuelve a la plantilla modelo
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

        {/* Pestañas: Lista de Proyectos / Nueva Vivienda en Blanco */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'list'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Mis Proyectos ({projectsList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'new'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Vivienda en Blanco</span>
          </button>
        </div>

        {/* Contenido según pestaña */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'new' ? (
            <div className="space-y-4 max-w-lg mx-auto py-2">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-semibold mb-0.5">
                    Inicio completamente limpio
                  </strong>
                  Se creará un lienzo CAD en blanco sin habitaciones predefinidas, cables ni bocas
                  heredadas de la maqueta demo. Podrás agregar los ambientes y componentes que desees.
                </div>
              </div>

              <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div>
                  <label className="text-xs font-semibold text-slate-200 block mb-1">
                    Nombre de la Vivienda o Proyecto <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Casa Unifamiliar B° San Martín"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs sm:text-sm focus:border-amber-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Cliente / Propietario (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={newProjectClient}
                    onChange={(e) => setNewProjectClient(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-xs focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {hasUnsavedChanges && (
                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Hay cambios sin guardar en el proyecto actual.</span>
                  </div>
                  <button
                    onClick={onSaveCurrent}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded text-xs flex items-center gap-1 shrink-0"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Ahora</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleCreateNew(false)}
                  disabled={!newProjectName.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Vivienda Vacía</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Buscador de proyectos */}
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar proyecto por nombre o cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
                <button
                  onClick={() => setActiveTab('new')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 shrink-0 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Proyecto</span>
                </button>
              </div>

              {/* Lista de proyectos */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {filteredProjects.map((p) => {
                  const isCurrent = p.id === currentProject.metadata.id;
                  const isTemplate = p.isTemplate || p.id === DEMO_PROJECT_ID;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-amber-950/20 border-amber-500/60 ring-1 ring-amber-500/30'
                          : isTemplate
                          ? 'bg-slate-800/40 border-cyan-800/60 hover:border-cyan-600'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-[280px]">
                            {p.name}
                          </h4>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded uppercase">
                              Activo
                            </span>
                          )}
                          {isTemplate && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Plantilla Modelo</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                          {p.client && <span>Cliente: <strong className="text-slate-300">{p.client}</strong></span>}
                          <span>Ambientes: <strong className="text-slate-300">{p.roomsCount}</strong></span>
                          <span>Bocas: <strong className="text-slate-300">{p.symbolsCount}</strong></span>
                          <span>Circuitos: <strong className="text-slate-300">{p.circuitsCount}</strong></span>
                        </div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {isCurrent ? (
                          <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 px-2 py-1 bg-emerald-950/40 rounded border border-emerald-800/50">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Abierto</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenProject(p.id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors"
                          >
                            Abrir
                          </button>
                        )}

                        <button
                          onClick={() => handleDuplicate(p.id)}
                          title="Duplicar proyecto"
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {!isTemplate && (
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            title="Eliminar proyecto"
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {filteredProjects.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    No se encontraron proyectos con ese nombre.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pie del modal */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-[11px] text-slate-400 shrink-0">
          <span>ELECTRA PLAN almacena tus proyectos de forma segura y local en tu navegador.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
