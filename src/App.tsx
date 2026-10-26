/**
 * ELECTRA PLAN — Software de diseño, cálculo, simulación y aprendizaje de instalaciones eléctricas
 * Componente Principal y Coordinador de la Aplicación
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ConductorType } from './types/electra';
import { createDemoProject } from './services/demoProject';
import { simulateElectricalNetwork } from './services/electricalSimulation';
import { Header } from './components/Header';
import { Navigation, ActiveTab } from './components/Navigation';
import { Toolbar, CADTool } from './components/Toolbar';
import { CADEditor } from './components/CADEditor';
import { PropertiesPanel } from './components/PropertiesPanel';
import { DiagnosticsBar } from './components/DiagnosticsBar';
import { SimulatorView } from './components/SimulatorView';
import { CircuitsView } from './components/CircuitsView';
import { CalculationsView } from './components/CalculationsView';
import { SwitchboardView } from './components/SwitchboardView';
import { BOMView } from './components/BOMView';
import { PracticesView } from './components/PracticesView';
import { ReportView } from './components/ReportView';
import { HelpModal } from './components/HelpModal';

const STORAGE_KEY = 'electra_plan_project_v1';

export default function App() {
  // Cargar proyecto desde localStorage si existe, o utilizar el proyecto demo preconfigurado
  const [project, setProject] = useState<Project>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.version && parsed.symbols) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Error al recuperar proyecto previo:', e);
    }
    return createDemoProject();
  });

  // Historial de Deshacer / Rehacer
  const [history, setHistory] = useState<Project[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Navegación
  const [activeTab, setActiveTab] = useState<ActiveTab>('plano');

  // Herramientas CAD
  const [activeTool, setActiveTool] = useState<CADTool>('select');
  const [selectedTemplateType, setSelectedTemplateType] = useState<string | null>('luminaria');
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('C1');
  const [activeWireType, setActiveWireType] = useState<ConductorType>('fase');

  // Elemento seleccionado en el plano
  const [selectedElementType, setSelectedElementType] = useState<'symbol' | 'wire' | 'room' | 'wall' | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Estado de guardado y modales
  const [saveStatus, setSaveStatus] = useState<string>('Guardado');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  // Motor de simulación en tiempo real
  const { simState, updatedSymbols, updatedWires } = useMemo(() => {
    return simulateElectricalNetwork(project);
  }, [project]);

  // Actualizador con historial
  const updateProject = useCallback(
    (updater: (prev: Project) => Project) => {
      setProject((prev) => {
        const next = updater(prev);
        // Guardar en historial (máximo 20 pasos)
        setHistory((h) => {
          const currentPast = h.slice(0, historyIndex + 1);
          return [...currentPast, JSON.parse(JSON.stringify(prev))].slice(-20);
        });
        setHistoryIndex((idx) => Math.min(idx + 1, 19));
        setSaveStatus('Modificado');
        return next;
      });
    },
    [historyIndex]
  );

  // Auto-guardado en LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSaveStatus('Guardado en navegador');
    } catch (err) {
      console.error('Error al guardar en localStorage', err);
    }
  }, [project]);

  // Deshacer
  const handleUndo = useCallback(() => {
    if (historyIndex >= 0 && history[historyIndex]) {
      const prevProject = history[historyIndex];
      setHistoryIndex((idx) => idx - 1);
      setProject(prevProject);
    }
  }, [history, historyIndex]);

  // Rehacer
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setProject(history[nextIndex]);
    }
  }, [history, historyIndex]);

  // Nuevo Proyecto
  const handleNewProject = () => {
    if (confirm('¿Deseas iniciar un nuevo proyecto en blanco? Los cambios actuales están guardados.')) {
      const blankProject: Project = {
        version: '1.2.0',
        metadata: {
          id: `proj_${Date.now()}`,
          name: 'Nuevo Proyecto Eléctrico',
          client: '',
          address: '',
          description: '',
          author: '',
          date: new Date().toISOString().slice(0, 10),
          country: 'Argentina',
          normative: 'AEA 90364-771',
          gridSize: 20,
          snapToGrid: true,
          showDimensions: true,
          scale: 40,
        },
        floors: [{ id: 'floor_1', name: 'Planta 1', level: 0, scalePixelsPerMeter: 40 }],
        activeFloorId: 'floor_1',
        rooms: [],
        architecturalElements: [],
        symbols: [],
        wires: [],
        circuits: [
          {
            id: 'C1',
            name: 'Iluminación de Uso General (IUG)',
            type: 'IUG',
            voltage: 220,
            phases: 1,
            powerFactor: 0.95,
            conductorMaterial: 'Cu',
            crossSectionMm2: 1.5,
            breakerAmps: 10,
            breakerCurve: 'C',
            breakerPoles: '2P',
            color: '#3b82f6',
            installationMethod: 'cañeria_embutida',
            lengthMetersEstimate: 12,
          },
          {
            id: 'C2',
            name: 'Tomacorrientes de Uso General (TUG)',
            type: 'TUG',
            voltage: 220,
            phases: 1,
            powerFactor: 0.9,
            conductorMaterial: 'Cu',
            crossSectionMm2: 2.5,
            breakerAmps: 16,
            breakerCurve: 'C',
            breakerPoles: '2P',
            color: '#10b981',
            installationMethod: 'cañeria_embutida',
            lengthMetersEstimate: 16,
          },
        ],
        switchboard: {
          id: 'board_main',
          name: 'Tablero Seccional',
          location: 'Acceso',
          mainBreakerAmps: 32,
          differentialAmps: 40,
          components: [
            {
              id: 'comp_iga',
              type: 'iga',
              name: 'Interruptor General (IGA 32A)',
              ratingAmps: 32,
              poles: '2P',
              state: 'closed',
            },
            {
              id: 'comp_id',
              type: 'diferencial',
              name: 'Disyuntor Diferencial (ID 40A / 30mA)',
              ratingAmps: 40,
              poles: '2P',
              sensitivityMa: 30,
              state: 'closed',
            },
          ],
        },
        currency: 'ARS',
      };
      setProject(blankProject);
      setSelectedElementId(null);
      setSelectedElementType(null);
    }
  };

  // Cargar Proyecto Demo
  const handleOpenDemo = () => {
    if (confirm('¿Deseas cargar el proyecto de demostración (Vivienda 2 ambientes con IUG y TUG)?')) {
      const demo = createDemoProject();
      setProject(demo);
      setSelectedElementId(null);
      setSelectedElementType(null);
    }
  };

  // Guardar Manualmente
  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setSaveStatus('¡Guardado exitosamente!');
      setTimeout(() => setSaveStatus('Guardado en navegador'), 3000);
    } catch (e) {
      alert('Error al guardar proyecto en el navegador.');
    }
  };

  // Exportar JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `ELECTRA_PLAN_${project.metadata.name.replace(/\s+/g, '_')}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.version && parsed.symbols && parsed.circuits) {
          setProject(parsed);
          setSelectedElementId(null);
          setSelectedElementType(null);
          alert('¡Proyecto importado con éxito!');
        } else {
          alert('El archivo no posee una estructura de proyecto válida de ELECTRA PLAN.');
        }
      } catch (err) {
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Alternar estado de interruptor (tecla simple, conmutada, etc.)
  const handleToggleSwitch = useCallback((symbolId: string) => {
    updateProject((prev) => {
      const nextSymbols = prev.symbols.map((sym) => {
        if (sym.id === symbolId) {
          if (sym.type === 'conmutado') {
            const nextPos = sym.state?.switchPosition === 1 ? 2 : 1;
            return {
              ...sym,
              state: {
                ...sym.state,
                switchPosition: nextPos,
              },
            };
          }
          const nextOpen = sym.state?.isOpen === false ? true : false;
          return {
            ...sym,
            state: {
              ...sym.state,
              isOpen: nextOpen,
            },
          };
        }
        return sym;
      });
      return { ...prev, symbols: nextSymbols };
    });
  }, [updateProject]);

  // Alternar protección (térmica / diferencial en el plano)
  const handleToggleBreaker = useCallback((symbolId: string) => {
    updateProject((prev) => {
      const nextSymbols = prev.symbols.map((sym) => {
        if (sym.id === symbolId) {
          const isClosed = !sym.state?.isOpen && !sym.state?.isTripped;
          return {
            ...sym,
            state: {
              ...sym.state,
              isOpen: isClosed,
              isTripped: false,
            },
          };
        }
        return sym;
      });
      return { ...prev, symbols: nextSymbols };
    });
  }, [updateProject]);

  // Agregar habitación predefinida desde la barra de herramientas
  const handleAddPresetRoom = (roomName: string, w: number, h: number) => {
    const newRoom = {
      id: `room_${Date.now()}`,
      floorId: project.activeFloorId,
      name: roomName,
      x: 100 + project.rooms.length * 20,
      y: 100 + project.rooms.length * 20,
      width: w,
      height: h,
      color: 'rgba(59, 130, 246, 0.05)',
    };
    updateProject((prev) => ({
      ...prev,
      rooms: [...prev.rooms, newRoom],
    }));
    setSelectedElementType('room');
    setSelectedElementId(newRoom.id);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* 1. Barra Superior */}
      <Header
        project={project}
        onNewProject={handleNewProject}
        onOpenDemo={handleOpenDemo}
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex >= 0}
        canRedo={historyIndex < history.length - 1}
        onSimulate={() => setActiveTab('simulador')}
        onCalculate={() => setActiveTab('calculos')}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onPrintReport={() => setActiveTab('informe')}
        onShowHelp={() => setIsHelpOpen(true)}
        isSimulating={simState.activeLamps.size > 0}
        saveStatus={saveStatus}
      />

      {/* 2. Pestañas de Navegación */}
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeLampsCount={simState.activeLamps.size}
        hasErrors={simState.hasShortCircuit}
      />

      {/* 3. Área de Contenido Principal según la Pestaña Activa */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'plano' && (
          <div className="flex-1 flex w-full h-full">
            {/* Barra lateral de herramientas */}
            <Toolbar
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              selectedTemplateType={selectedTemplateType}
              onSelectTemplate={setSelectedTemplateType}
              selectedCircuitId={selectedCircuitId}
              onSelectCircuit={setSelectedCircuitId}
              circuits={project.circuits}
              activeWireType={activeWireType}
              onSelectWireType={setActiveWireType}
              onAddPresetRoom={handleAddPresetRoom}
            />

            {/* Lienzo CAD */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <CADEditor
                project={{
                  ...project,
                  symbols: updatedSymbols,
                  wires: updatedWires,
                }}
                onUpdateProject={updateProject}
                activeTool={activeTool}
                selectedTemplateType={selectedTemplateType}
                selectedCircuitId={selectedCircuitId}
                activeWireType={activeWireType}
                selectedElementId={selectedElementId}
                selectedElementType={selectedElementType}
                onSelectElement={(type, id) => {
                  setSelectedElementType(type);
                  setSelectedElementId(id);
                }}
                onToggleSwitch={handleToggleSwitch}
                isSimulating={true}
              />

              {/* Barra inferior de diagnósticos */}
              <DiagnosticsBar
                simState={simState}
                onStartSimulation={() => {}}
                onPauseSimulation={() => {}}
                onResetSimulation={() => {}}
                onVerifyCircuit={() => {}}
              />
            </div>

            {/* Panel lateral derecho de propiedades */}
            <PropertiesPanel
              project={project}
              selectedElementType={selectedElementType}
              selectedElementId={selectedElementId}
              onUpdateProject={updateProject}
              onDeleteSelected={() => {
                if (!selectedElementId) return;
                updateProject((prev) => ({
                  ...prev,
                  symbols: prev.symbols.filter((s) => s.id !== selectedElementId),
                  wires: prev.wires.filter(
                    (w) => w.id !== selectedElementId && w.fromComponentId !== selectedElementId && w.toComponentId !== selectedElementId
                  ),
                  rooms: prev.rooms.filter((r) => r.id !== selectedElementId),
                  architecturalElements: prev.architecturalElements.filter((a) => a.id !== selectedElementId),
                }));
                setSelectedElementId(null);
                setSelectedElementType(null);
              }}
              onToggleSwitch={handleToggleSwitch}
            />
          </div>
        )}

        {activeTab === 'simulador' && (
          <SimulatorView
            project={{
              ...project,
              symbols: updatedSymbols,
              wires: updatedWires,
            }}
            simState={simState}
            onToggleSwitch={handleToggleSwitch}
            onToggleBreaker={handleToggleBreaker}
            onVerifyCircuit={() => {}}
            onResetSimulation={() => {
              updateProject((prev) => ({
                ...prev,
                symbols: prev.symbols.map((s) => ({
                  ...s,
                  state: {
                    ...s.state,
                    isOpen: s.category === 'comando' ? true : false,
                    isTripped: false,
                  },
                })),
              }));
            }}
          />
        )}

        {activeTab === 'circuitos' && (
          <CircuitsView project={project} onUpdateProject={updateProject} />
        )}

        {activeTab === 'calculos' && <CalculationsView project={project} />}

        {activeTab === 'tablero' && (
          <SwitchboardView project={project} onUpdateProject={updateProject} />
        )}

        {activeTab === 'materiales' && <BOMView project={project} onUpdateProject={updateProject} />}

        {activeTab === 'practicas' && (
          <PracticesView
            onLoadPracticeToMain={(practiceProj) => {
              setProject(practiceProj);
              setActiveTab('plano');
            }}
          />
        )}

        {activeTab === 'informe' && <ReportView project={project} />}
      </main>

      {/* Modal de Ayuda */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
