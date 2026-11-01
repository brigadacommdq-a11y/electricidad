/**
 * ELECTRA PLAN — Vista y Panel de Configuración
 * Opciones completas de Apariencia, Editor CAD, Controles Táctiles,
 * Parámetros Eléctricos Reglamentarios, Guardado, Accesibilidad y Datos del Proyecto.
 */
import React, { useState } from 'react';
import {
  Sliders,
  Palette,
  Maximize2,
  Smartphone,
  Zap,
  Save,
  Eye,
  Info,
  CheckCircle2,
  RotateCcw,
  Sun,
  Moon,
  ShieldCheck,
  Download,
  Upload,
  Layers,
  HelpCircle,
  FileText,
  Activity,
  PlayCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  Check,
  X,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { AppSettings, DEFAULT_SETTINGS } from '../services/settingsService';
import { Project } from '../types/electra';
import {
  AuditTestCase,
  AuditSummary,
  AUDIT_TEST_DEFINITIONS,
  executeSingleTest,
  runAllSystemAuditTests,
  exportAuditReportAsText,
  ModuleCategory,
} from '../services/systemAuditService';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (updater: (prev: AppSettings) => AppSettings) => void;
  project: Project;
  onOpenProjectManager: () => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetDemo: () => void;
  saveStatus: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  project,
  onOpenProjectManager,
  onExportJSON,
  onImportJSON,
  onResetDemo,
  saveStatus,
}) => {
  const [activeSection, setActiveSection] = useState<
    'apariencia' | 'editor' | 'controles' | 'electricidad' | 'guardado' | 'accesibilidad' | 'app' | 'pruebas'
  >('apariencia');

  // Estado para el Centro de Pruebas y Diagnóstico
  const [testCases, setTestCases] = useState<AuditTestCase[]>(() =>
    AUDIT_TEST_DEFINITIONS.map((def) => ({
      ...def,
      status: 'pending' as const,
      executionDate: null,
    }))
  );
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [isRunningTests, setIsRunningTests] = useState<boolean>(false);
  const [testFilterModule, setTestFilterModule] = useState<string>('todos');
  const [testFilterStatus, setTestFilterStatus] = useState<string>('todos');
  const [selectedDetailTest, setSelectedDetailTest] = useState<AuditTestCase | null>(null);

  const [notification, setNotification] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleResetSettings = () => {
    if (confirm('¿Restablecer todas las configuraciones a sus valores predeterminados?')) {
      onUpdateSettings(() => ({ ...DEFAULT_SETTINGS }));
      showFeedback('Configuración restablecida a valores iniciales');
    }
  };

  // Ejecutar todas las pruebas del sistema
  const handleRunAllTests = async () => {
    setIsRunningTests(true);
    try {
      const { summary, tests } = await runAllSystemAuditTests(project);
      setTestCases(tests);
      setAuditSummary(summary);
      showFeedback(`Auditoría completa: ${summary.passed}/${summary.totalTests} pruebas aprobadas`);
    } catch (err: any) {
      showFeedback('Error al ejecutar suite de pruebas');
    } finally {
      setIsRunningTests(false);
    }
  };

  // Ejecutar pruebas de un módulo específico
  const handleRunModuleTests = async (mod: ModuleCategory) => {
    setIsRunningTests(true);
    try {
      const updated = [...testCases];
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].module === mod) {
          const res = await executeSingleTest(updated[i], project);
          updated[i] = res;
        }
      }
      setTestCases(updated);
      showFeedback(`Módulo "${mod.toUpperCase()}" auditado con éxito`);
    } catch {
      showFeedback('Error al probar módulo');
    } finally {
      setIsRunningTests(false);
    }
  };

  // Repetir pruebas fallidas
  const handleRepeatFailedTests = async () => {
    setIsRunningTests(true);
    try {
      const updated = [...testCases];
      let retested = 0;
      for (let i = 0; i < updated.length; i++) {
        if (updated[i].status === 'failed' || updated[i].status === 'pending') {
          const res = await executeSingleTest(updated[i], project);
          updated[i] = res;
          retested++;
        }
      }
      setTestCases(updated);
      showFeedback(`Se re-evaluaron ${retested} pruebas`);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Exportar informe de pruebas
  const handleExportAuditReport = () => {
    const summary = auditSummary || {
      totalFunctionsAudited: 42,
      totalTests: testCases.length,
      passed: testCases.filter((t) => t.status === 'passed').length,
      failed: testCases.filter((t) => t.status === 'failed').length,
      pending: testCases.filter((t) => t.status === 'pending').length,
      unimplemented: 0,
      requiringExternalAPI: testCases.filter((t) => t.requiresExternalAPI).length,
      lastExecutionDate: new Date().toLocaleString('es-AR'),
      moduleSummaries: [],
    };
    const reportText = exportAuditReportAsText(summary, testCases);
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Auditoria_ELECTRA_PLAN_${new Date().toISOString().slice(0, 10)}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Informe de auditoría exportado correctamente');
  };

  const sections = [
    { id: 'apariencia' as const, label: 'Apariencia', icon: Palette, desc: 'Tema, texto y densidad' },
    { id: 'editor' as const, label: 'Editor CAD', icon: Layers, desc: 'Rejilla, snap y cotas' },
    { id: 'controles' as const, label: 'Controles Táctiles', icon: Smartphone, desc: 'Gestos y objetivos' },
    { id: 'electricidad' as const, label: 'Parámetros Eléctricos', icon: Zap, desc: 'Tensión y límites AEA' },
    { id: 'guardado' as const, label: 'Guardado & Respaldo', icon: Save, desc: 'Copias y proyectos' },
    { id: 'accesibilidad' as const, label: 'Accesibilidad', icon: Eye, desc: 'Contraste y visibilidad' },
    { id: 'app' as const, label: 'Información & Normativa', icon: Info, desc: 'Versión y proyecto' },
    { id: 'pruebas' as const, label: 'Centro de Pruebas', icon: Activity, desc: 'Auditoría y diagnóstico', isHighlight: true },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4F6F8] dark:bg-[#0D161C] p-3 sm:p-6 text-[#18313B] dark:text-[#F1F5F9] space-y-4 sm:space-y-6 max-w-full overflow-x-hidden pb-24 md:pb-8 transition-colors">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-5 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-[#167D78] dark:text-[#2DD4BF] font-extrabold text-base sm:text-lg">
            <Sliders className="w-5 h-5 shrink-0" />
            <h1>Configuración & Preferencias del Sistema</h1>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-2xl">
            Personaliza el entorno de trabajo, optimiza la experiencia táctil para móvil o tablet y calibra los valores de cálculo normativo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notification && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F5F5] dark:bg-[#167D78]/20 border border-[#B7DFDD] dark:border-[#167D78]/40 text-[#167D78] dark:text-[#2DD4BF] text-xs font-semibold rounded-lg animate-fade-in">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notification}</span>
            </div>
          )}
          <button
            onClick={handleResetSettings}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] border border-[#DCE4E8] dark:border-[#243542] text-xs font-semibold rounded-lg transition-colors text-[#64748B] dark:text-[#94A3B8]"
            title="Restablecer opciones predeterminadas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Valores Iniciales</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Navegación lateral de Secciones */}
        <div className="md:col-span-1 space-y-1 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-2 rounded-2xl shadow-xs h-fit">
          <div className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8] px-3 py-2">
            Categorías
          </div>
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isSelected = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all min-h-[44px] ${
                  isSelected
                    ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] font-bold border border-[#B7DFDD] dark:border-[#167D78]/50 shadow-2xs'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36] hover:text-[#18313B] dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#167D78] dark:text-[#2DD4BF]' : 'text-[#8E9FAA]'}`} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold truncate">{sec.label}</div>
                  <div className="text-[10px] text-[#8E9FAA] dark:text-[#64748B] truncate">{sec.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Panel de Contenido de la Sección Seleccionada */}
        <div className="md:col-span-3 space-y-4">
          {/* 1. SECCIÓN: APARIENCIA */}
          {activeSection === 'apariencia' && (
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#18313B] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Tema Visual y Apariencia</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Controla la paleta de colores global y la densidad espacial en pantalla.
                </p>
              </div>

              {/* Selector de Tema */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">Tema del Sistema</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => {
                      onUpdateSettings((prev) => ({ ...prev, theme: 'light' }));
                      showFeedback('Tema Claro activado');
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.theme === 'light'
                        ? 'border-[#167D78] bg-[#E8F5F5] text-[#167D78] ring-1 ring-[#167D78]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#64748B]'
                    }`}
                  >
                    <Sun className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <div>
                      <div className="text-xs font-bold">Modo Claro</div>
                      <div className="text-[10px] text-[#64748B]">Fondo gris suave y blanco</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateSettings((prev) => ({ ...prev, theme: 'dark' }));
                      showFeedback('Tema Oscuro activado');
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.theme === 'dark'
                        ? 'border-[#2DD4BF] bg-[#167D78]/20 text-[#2DD4BF] ring-1 ring-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#64748B]'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                    <div>
                      <div className="text-xs font-bold">Modo Oscuro</div>
                      <div className="text-[10px] text-[#64748B]">Fondo pizarra noche</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Densidad de Interfaz */}
              <div className="space-y-2 pt-4 border-t border-[#DCE4E8] dark:border-[#243542]">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">Densidad de Elementos</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, density: 'comfortable' }))}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.density === 'comfortable'
                        ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36]'
                    }`}
                  >
                    <div className="text-xs font-bold">Cómoda (Recomendada)</div>
                    <div className="text-[10px] text-[#64748B]">Mayor espacio y objetivos táctiles holgados</div>
                  </button>
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, density: 'compact' }))}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.density === 'compact'
                        ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36]'
                    }`}
                  >
                    <div className="text-xs font-bold">Compacta</div>
                    <div className="text-[10px] text-[#64748B]">Más información visible en pantallas chicas</div>
                  </button>
                </div>
              </div>

              {/* Tamaño de Tipografía */}
              <div className="space-y-2 pt-4 border-t border-[#DCE4E8] dark:border-[#243542]">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">Tamaño del Texto Base</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, fontSize: 'normal' }))}
                    className={`px-4 py-2 rounded-lg border text-xs font-semibold min-h-[44px] ${
                      settings.fontSize === 'normal'
                        ? 'bg-[#167D78] text-white border-[#167D78]'
                        : 'bg-[#F4F6F8] dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#64748B]'
                    }`}
                  >
                    Normal (100%)
                  </button>
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, fontSize: 'large' }))}
                    className={`px-4 py-2 rounded-lg border text-xs font-semibold min-h-[44px] ${
                      settings.fontSize === 'large'
                        ? 'bg-[#167D78] text-white border-[#167D78]'
                        : 'bg-[#F4F6F8] dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#64748B]'
                    }`}
                  >
                    Grande (+15%)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. SECCIÓN: EDITOR CAD */}
          {activeSection === 'editor' && (
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#18313B] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Comportamiento del Editor CAD</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Ajusta la cuadrícula de dibujo, magnetismo y cotas métricas del plano.
                </p>
              </div>

              {/* Tamaño de Cuadrícula */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">
                  Paso de Cuadrícula (Grid)
                </label>
                <div className="grid grid-cols-3 gap-2 max-w-md">
                  {[
                    { val: 10, label: '10 px (Fina)', desc: '25 cm' },
                    { val: 20, label: '20 px (Estándar)', desc: '50 cm' },
                    { val: 40, label: '40 px (Métrica)', desc: '1.0 m' },
                  ].map((g) => (
                    <button
                      key={g.val}
                      onClick={() => onUpdateSettings((p) => ({ ...p, gridSize: g.val }))}
                      className={`p-2.5 rounded-xl border text-center transition-all min-h-[48px] ${
                        settings.gridSize === g.val
                          ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF] font-bold'
                          : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#64748B]'
                      }`}
                    >
                      <div className="text-xs">{g.label}</div>
                      <div className="text-[10px] text-[#8E9FAA]">{g.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ajuste Magnético (Snap) */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/50 dark:bg-[#1B2B36]/50">
                <div>
                  <div className="text-xs font-bold text-[#18313B] dark:text-slate-200">Ajuste Magnético (Snap to Grid)</div>
                  <div className="text-[10px] text-[#64748B]">Alinea componentes y vértices automáticamente a la retícula</div>
                </div>
                <button
                  onClick={() => onUpdateSettings((p) => ({ ...p, snapToGrid: !p.snapToGrid }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                    settings.snapToGrid
                      ? 'bg-[#167D78] text-white'
                      : 'bg-[#DCE4E8] dark:bg-[#243542] text-[#64748B]'
                  }`}
                >
                  {settings.snapToGrid ? 'Activado' : 'Desactivado'}
                </button>
              </div>

              {/* Visualización de Cotas */}
              <div className="space-y-2 pt-2 border-t border-[#DCE4E8] dark:border-[#243542]">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">
                  Visualización de Medidas y Cotas
                </label>
                <div className="grid grid-cols-3 gap-2 max-w-md">
                  {[
                    { id: 'selected' as const, label: 'Al seleccionar' },
                    { id: 'always' as const, label: 'Siempre visibles' },
                    { id: 'never' as const, label: 'Ocultar' },
                  ].map((dim) => (
                    <button
                      key={dim.id}
                      onClick={() => onUpdateSettings((p) => ({ ...p, showDimensions: dim.id }))}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                        settings.showDimensions === dim.id
                          ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                          : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#64748B]'
                      }`}
                    >
                      {dim.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. SECCIÓN: CONTROLES TÁCTILES */}
          {activeSection === 'controles' && (
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#18313B] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Modo Táctil Real (Celular y Tablet)</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Optimiza la ergonomía para evitar pulsaciones accidentales y facilitar el dibujo con dedos.
                </p>
              </div>

              {/* Objetivos Táctiles Ampliados */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/50 dark:bg-[#1B2B36]/50">
                <div>
                  <div className="text-xs font-bold text-[#18313B] dark:text-slate-200">
                    Objetivos Táctiles Ampliados (48px)
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    Garantiza botones de al menos 48x48 px recomendados por WCAG AA
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings((p) => ({ ...p, touchEnhancedTargets: !p.touchEnhancedTargets }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                    settings.touchEnhancedTargets
                      ? 'bg-[#167D78] text-white'
                      : 'bg-[#DCE4E8] dark:bg-[#243542] text-[#64748B]'
                  }`}
                >
                  {settings.touchEnhancedTargets ? 'Habilitado' : 'Estándar'}
                </button>
              </div>

              {/* Sensibilidad del Zoom por Pellizco */}
              <div className="space-y-2 pt-2 border-t border-[#DCE4E8] dark:border-[#243542]">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">
                  Sensibilidad del Pellizco (Pinch-to-Zoom)
                </label>
                <div className="grid grid-cols-3 gap-2 max-w-md">
                  {[
                    { id: 'smooth' as const, label: 'Suave' },
                    { id: 'normal' as const, label: 'Normal' },
                    { id: 'high' as const, label: 'Rápida' },
                  ].map((sens) => (
                    <button
                      key={sens.id}
                      onClick={() => onUpdateSettings((p) => ({ ...p, touchZoomSensitivity: sens.id }))}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all min-h-[44px] ${
                        settings.touchZoomSensitivity === sens.id
                          ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                          : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#64748B]'
                      }`}
                    >
                      {sens.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Acción al tocar plano vacío con 1 dedo */}
              <div className="space-y-2 pt-2 border-t border-[#DCE4E8] dark:border-[#243542]">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">
                  Acción por Defecto con 1 Dedo en Fondo Vacío
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, defaultTapAction: 'select' }))}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.defaultTapAction === 'select'
                        ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36]'
                    }`}
                  >
                    <div className="text-xs font-bold">Seleccionar / Mover</div>
                    <div className="text-[10px] text-[#64748B]">Tocar elemento para editarlo; paneo con 2 dedos</div>
                  </button>
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, defaultTapAction: 'pan' }))}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.defaultTapAction === 'pan'
                        ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36]'
                    }`}
                  >
                    <div className="text-xs font-bold">Desplazar Plano (Pan)</div>
                    <div className="text-[10px] text-[#64748B]">Arrastrar libremente con 1 dedo en cualquier zona</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 4. SECCIÓN: PARÁMETROS ELÉCTRICOS */}
          {activeSection === 'electricidad' && (
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#18313B] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Parámetros Eléctricos y Normativa (AEA 90364)</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Valores de referencia para los cálculos de caída de tensión, corriente de proyecto y calibración de protecciones.
                </p>
              </div>

              {/* Tensión Nominal de Suministro */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">
                  Tensión Nominal Predeterminada
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, nominalVoltage: 220 }))}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.nominalVoltage === 220
                        ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36]'
                    }`}
                  >
                    <div className="text-xs font-bold">220 V (Monofásica)</div>
                    <div className="text-[10px] text-[#64748B]">Viviendas estándar (Fase + Neutro + PE)</div>
                  </button>
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, nominalVoltage: 380 }))}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.nominalVoltage === 380
                        ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36]'
                    }`}
                  >
                    <div className="text-xs font-bold">380 V (Trifásica)</div>
                    <div className="text-[10px] text-[#64748B]">Talleres y suministros comerciales (3F + N + PE)</div>
                  </button>
                </div>
              </div>

              {/* Caída de Tensión Máxima Permitida */}
              <div className="space-y-2 pt-2 border-t border-[#DCE4E8] dark:border-[#243542]">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">
                  Límite Admisible de Caída de Tensión (ΔV%)
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, maxVoltageDropPercent: 3.0 }))}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.maxVoltageDropPercent === 3.0
                        ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36]'
                    }`}
                  >
                    <div className="text-xs font-bold">3.0% (Alumbrado y Tomacorrientes)</div>
                    <div className="text-[10px] text-[#64748B]">Límite estricto reglamentario AEA 771.19</div>
                  </button>
                  <button
                    onClick={() => onUpdateSettings((p) => ({ ...p, maxVoltageDropPercent: 5.0 }))}
                    className={`p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                      settings.maxVoltageDropPercent === 5.0
                        ? 'border-[#167D78] bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF]'
                        : 'border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8] dark:bg-[#1B2B36]'
                    }`}
                  >
                    <div className="text-xs font-bold">5.0% (Fuerza Motriz / Motores)</div>
                    <div className="text-[10px] text-[#64748B]">Permitido para arranque y bombas</div>
                  </button>
                </div>
              </div>

              {/* Factor de Potencia Cos Phi */}
              <div className="space-y-2 pt-2 border-t border-[#DCE4E8] dark:border-[#243542]">
                <label className="text-xs font-semibold text-[#18313B] dark:text-slate-200">
                  Factor de Potencia por Defecto (cos φ)
                </label>
                <div className="flex items-center gap-3">
                  {[0.85, 0.9, 0.95].map((fp) => (
                    <button
                      key={fp}
                      onClick={() => onUpdateSettings((p) => ({ ...p, defaultPowerFactor: fp }))}
                      className={`px-4 py-2 rounded-lg border text-xs font-mono font-bold min-h-[44px] ${
                        settings.defaultPowerFactor === fp
                          ? 'bg-[#167D78] text-white border-[#167D78]'
                          : 'bg-[#F4F6F8] dark:bg-[#1B2B36] border-[#DCE4E8] dark:border-[#243542] text-[#64748B]'
                      }`}
                    >
                      {fp.toFixed(2)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 5. SECCIÓN: GUARDADO & RESPALDO */}
          {activeSection === 'guardado' && (
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#18313B] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Save className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Guardado, Respaldo y Proyectos</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Manejo de almacenamiento seguro en el navegador sin dependencias de servicios externos ni cookies invasivas.
                </p>
              </div>

              {/* Estado de Guardado */}
              <div className="p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/60 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#18313B] dark:text-slate-200">
                    Estado Actual del Proyecto: <span className="text-[#167D78] dark:text-[#2DD4BF]">{saveStatus}</span>
                  </div>
                  <div className="text-[10px] text-[#64748B] mt-0.5">
                    Versión: {project.version} · Fecha: {project.metadata.date || 'Actual'} · Norma: {project.metadata.normative}
                  </div>
                </div>
                <button
                  onClick={onOpenProjectManager}
                  className="px-3.5 py-2 bg-[#167D78] hover:bg-[#0F5E5A] text-white text-xs font-bold rounded-lg transition-colors min-h-[44px]"
                >
                  Gestor de Proyectos
                </button>
              </div>

              {/* Acciones de Copia y Restauración */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={onExportJSON}
                  className="flex items-center justify-center gap-2 p-3.5 bg-white dark:bg-[#142028] hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-xl text-xs font-semibold transition-all min-h-[48px]"
                >
                  <Download className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Descargar Copia de Seguridad JSON</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 p-3.5 bg-white dark:bg-[#142028] hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36] border border-[#DCE4E8] dark:border-[#243542] rounded-xl text-xs font-semibold transition-all min-h-[48px]"
                >
                  <Upload className="w-4 h-4 text-[#64748B]" />
                  <span>Restaurar desde Archivo JSON</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={onImportJSON}
                />
              </div>

              {/* Restablecer Demo */}
              <div className="pt-4 border-t border-[#DCE4E8] dark:border-[#243542] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-600 dark:text-red-400">Restablecer Proyecto Prototipo</div>
                  <div className="text-[10px] text-[#64748B]">Carga nuevamente la vivienda didáctica de 2 ambientes</div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('¿Cargar el prototipo de ejemplo? Los cambios no guardados se reemplazarán.')) {
                      onResetDemo();
                      showFeedback('Proyecto prototipo cargado exitosamente');
                    }
                  }}
                  className="px-3 py-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold transition-colors min-h-[44px]"
                >
                  Cargar Ejemplo
                </button>
              </div>
            </div>
          )}

          {/* 6. SECCIÓN: ACCESIBILIDAD */}
          {activeSection === 'accesibilidad' && (
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#18313B] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Accesibilidad y Confort Visual</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Opciones para mejorar la visibilidad de conexiones, bornes y diagramas en cualquier condición de luz.
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/50 dark:bg-[#1B2B36]/50">
                <div>
                  <div className="text-xs font-bold text-[#18313B] dark:text-slate-200">
                    Alto Contraste en Etiquetas del Plano
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    Aumenta el grosor y añade contorno protector a las letras sobre cables y paredes
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings((p) => ({ ...p, highContrastLabels: !p.highContrastLabels }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                    settings.highContrastLabels
                      ? 'bg-[#167D78] text-white'
                      : 'bg-[#DCE4E8] dark:bg-[#243542] text-[#64748B]'
                  }`}
                >
                  {settings.highContrastLabels ? 'Activado' : 'Normal'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/50 dark:bg-[#1B2B36]/50">
                <div>
                  <div className="text-xs font-bold text-[#18313B] dark:text-slate-200">
                    Reducir Animaciones de Corriente
                  </div>
                  <div className="text-[10px] text-[#64748B]">
                    Detiene el movimiento continuo de electrones para menor consumo de batería y confort
                  </div>
                </div>
                <button
                  onClick={() =>
                    onUpdateSettings((p) => ({ ...p, reducedMotion: !p.reducedMotion }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[44px] ${
                    settings.reducedMotion
                      ? 'bg-[#167D78] text-white'
                      : 'bg-[#DCE4E8] dark:bg-[#243542] text-[#64748B]'
                  }`}
                >
                  {settings.reducedMotion ? 'Reducidas' : 'Normales'}
                </button>
              </div>
            </div>
          )}

          {/* 7. SECCIÓN: INFORMACIÓN & NORMATIVA */}
          {activeSection === 'app' && (
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-[#18313B] dark:text-[#F1F5F9] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                  <span>Información Técnica y Normativa de Referencia</span>
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Parámetros reglamentarios integrados en el motor de cálculo y simulación.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/40 dark:bg-[#1B2B36]/40 space-y-1">
                  <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase">Reglamento Base</div>
                  <div className="font-bold text-[#18313B] dark:text-white">AEA 90364 Parte 7 - Sección 771</div>
                  <div className="text-[11px] text-[#64748B]">Instalaciones eléctricas en inmuebles (Viviendas y locales)</div>
                </div>

                <div className="p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/40 dark:bg-[#1B2B36]/40 space-y-1">
                  <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase">Normas de Fabricación</div>
                  <div className="font-bold text-[#18313B] dark:text-white">IRAM 2183 / IRAM NM 247-3 / IEC 60898</div>
                  <div className="text-[11px] text-[#64748B]">Cables aislados en PVC, interruptores termomagnéticos y diferenciales</div>
                </div>

                <div className="p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/40 dark:bg-[#1B2B36]/40 space-y-1">
                  <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase">Proyecto Actual</div>
                  <div className="font-bold text-[#18313B] dark:text-white">{project.metadata.name}</div>
                  <div className="text-[11px] text-[#64748B]">
                    {project.symbols.length} componentes · {project.circuits.length} circuitos · {project.wires.length} tramos
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/40 dark:bg-[#1B2B36]/40 space-y-1">
                  <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase">Versión de Suite</div>
                  <div className="font-bold text-[#18313B] dark:text-white">ELECTRA PLAN v2.5</div>
                  <div className="text-[11px] text-[#64748B]">Motor híbrido CAD 2D/3D + Simulación electrotécnica en tiempo real</div>
                </div>
              </div>
            </div>
          )}

          {/* 8. SECCIÓN: CENTRO DE PRUEBAS Y DIAGNÓSTICO (Auditoría permanente) */}
          {activeSection === 'pruebas' && (
            <div className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] p-4 sm:p-6 rounded-2xl shadow-xs space-y-6">
              {/* Encabezado y Acciones Principales */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#DCE4E8] dark:border-[#243542] pb-4">
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#18313B] dark:text-[#F1F5F9] flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#167D78] dark:text-[#2DD4BF]" />
                    <span>CENTRO DE PRUEBAS Y DIAGNÓSTICO</span>
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-2xl leading-relaxed">
                    Auditoría automatizada en tiempo real. Ejecuta comprobaciones con aserciones electrotécnicas reales sobre el estado de cada módulo, herramientas y conexiones.
                  </p>
                </div>

                {/* Botones de acción principales */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleRunAllTests}
                    disabled={isRunningTests}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#167D78] hover:bg-[#0F5E5A] active:bg-[#0A4542] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isRunningTests ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlayCircle className="w-4 h-4" />
                    )}
                    <span>{isRunningTests ? 'Ejecutando...' : 'Ejecutar todas las pruebas'}</span>
                  </button>

                  <button
                    onClick={handleRepeatFailedTests}
                    disabled={isRunningTests}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542] text-[#18313B] dark:text-[#F1F5F9] rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    title="Re-ejecutar pruebas pendientes o fallidas"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#167D78] dark:text-[#2DD4BF]" />
                    <span className="hidden sm:inline">Repetir fallidas</span>
                  </button>

                  <button
                    onClick={handleExportAuditReport}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#F4F6F8] dark:bg-[#1B2B36] hover:bg-[#E8EFF2] dark:hover:bg-[#253947] border border-[#DCE4E8] dark:border-[#243542] text-[#167D78] dark:text-[#2DD4BF] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    title="Descargar informe de auditoría completo en formato TXT"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exportar informe</span>
                  </button>
                </div>
              </div>

              {/* Métricas Resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-[#DCE4E8] dark:border-[#243542] bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/60">
                  <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] block">Total de Pruebas</span>
                  <div className="text-xl sm:text-2xl font-black text-[#18313B] dark:text-white mt-0.5">
                    {testCases.length}
                  </div>
                  <span className="text-[10px] text-[#64748B]">11 módulos auditados</span>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block">Correctas (Aprobadas)</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {testCases.filter((t) => t.status === 'passed').length}
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Sin anomalías</span>
                </div>

                <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/20">
                  <span className="text-[11px] font-semibold text-red-800 dark:text-red-300 block">Errores Detectados</span>
                  <div className="text-xl sm:text-2xl font-black text-red-700 dark:text-red-400 mt-0.5">
                    {testCases.filter((t) => t.status === 'failed').length}
                  </div>
                  <span className="text-[10px] text-red-600 dark:text-red-400">Requiere acción</span>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20">
                  <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block">Pendientes</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">
                    {testCases.filter((t) => t.status === 'pending').length}
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400">Por comprobar</span>
                </div>
              </div>

              {/* Filtros de Módulo y Estado */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F6F8] dark:bg-[#1B2B36] p-3 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] shrink-0 mr-1">
                    Módulos:
                  </span>
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'cad', label: 'CAD 2D' },
                    { id: 'instalacion', label: 'Instalación' },
                    { id: 'simulador', label: 'Simulador' },
                    { id: 'tableros', label: 'Tableros DIN' },
                    { id: 'calculos', label: 'Cálculos AEA' },
                    { id: 'diagnostico', label: 'Diagnóstico' },
                    { id: 'asistente_visual', label: 'IA Visual' },
                    { id: 'acometida', label: 'Pilar PAT' },
                    { id: 'practicas', label: 'Prácticas' },
                    { id: 'materiales', label: 'Materiales' },
                    { id: 'persistencia', label: 'Guardado' },
                  ].map((m) => {
                    const isSel = testFilterModule === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setTestFilterModule(m.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                          isSel
                            ? 'bg-[#167D78] text-white shadow-2xs'
                            : 'bg-white dark:bg-[#142028] text-[#64748B] dark:text-slate-300 hover:text-[#18313B] border border-[#DCE4E8] dark:border-[#243542]'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">Estado:</span>
                  <select
                    value={testFilterStatus}
                    onChange={(e) => setTestFilterStatus(e.target.value)}
                    className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-lg px-2.5 py-1 text-xs text-[#18313B] dark:text-white font-medium focus:outline-hidden"
                  >
                    <option value="todos">Todos los estados</option>
                    <option value="passed">Solo Correctas (Aprobadas)</option>
                    <option value="failed">Solo Errores Detectados</option>
                    <option value="pending">Solo Pendientes</option>
                  </select>
                </div>
              </div>

              {/* Botón rápido para probar módulo seleccionado individualmente */}
              {testFilterModule !== 'todos' && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#E8F5F5] dark:bg-[#167D78]/20 border border-[#B7DFDD] dark:border-[#167D78]/40 text-xs">
                  <span className="font-semibold text-[#167D78] dark:text-[#2DD4BF]">
                    ¿Deseas probar únicamente las funciones de {testFilterModule.toUpperCase()}?
                  </span>
                  <button
                    onClick={() => handleRunModuleTests(testFilterModule as ModuleCategory)}
                    disabled={isRunningTests}
                    className="px-3 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    Probar {testFilterModule.toUpperCase()}
                  </button>
                </div>
              )}

              {/* Lista Detallada de Pruebas */}
              <div className="space-y-3">
                {testCases
                  .filter((t) => (testFilterModule === 'todos' ? true : t.module === testFilterModule))
                  .filter((t) => (testFilterStatus === 'todos' ? true : t.status === testFilterStatus))
                  .map((t) => {
                    const isPassed = t.status === 'passed';
                    const isFailed = t.status === 'failed';
                    const isPending = t.status === 'pending';

                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isPassed
                            ? 'bg-white dark:bg-[#142028] border-[#DCE4E8] dark:border-[#243542] hover:border-emerald-300'
                            : isFailed
                            ? 'bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-900/60'
                            : 'bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/40 border-dashed border-[#DCE4E8] dark:border-[#243542]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {t.moduleName}
                              </span>

                              <h4 className="text-sm font-bold text-[#18313B] dark:text-white">
                                {t.name}
                              </h4>

                              {t.requiresExternalAPI && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  Requiere API/Internet
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                              {t.description}
                            </p>

                            {/* Detalle del resultado */}
                            {t.detail && (
                              <div
                                className={`text-xs p-2.5 rounded-lg border mt-2 leading-relaxed ${
                                  isPassed
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                                    : isFailed
                                    ? 'bg-red-100/70 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700'
                                }`}
                              >
                                <strong className="font-semibold">Resultado de la prueba:</strong>{' '}
                                <span>{t.detail}</span>
                              </div>
                            )}

                            {/* Posible solución si falló */}
                            {isFailed && t.remedySuggestion && (
                              <div className="text-xs p-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 mt-2">
                                <strong className="font-semibold">Acción correctiva sugerida:</strong>{' '}
                                <span>{t.remedySuggestion}</span>
                              </div>
                            )}

                            {t.executionDate && (
                              <div className="flex items-center gap-1 text-[10px] text-[#8E9FAA] dark:text-slate-500 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>Última ejecución: {t.executionDate}</span>
                              </div>
                            )}
                          </div>

                          {/* Badge de estado y botón individual */}
                          <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                                isPassed
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : isFailed
                                  ? 'bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800'
                                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {isPassed ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Correcto
                                </>
                              ) : isFailed ? (
                                <>
                                  <XCircle className="w-3.5 h-3.5" /> Error detectado
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3.5 h-3.5" /> Pendiente
                                </>
                              )}
                            </span>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={async () => {
                                  const res = await executeSingleTest(t, project);
                                  setTestCases((prev) => prev.map((item) => (item.id === t.id ? res : item)));
                                }}
                                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Re-probar
                              </button>
                              <button
                                onClick={() => setSelectedDetailTest(t)}
                                className="px-2.5 py-1 bg-[#167D78] hover:bg-[#0F5E5A] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              >
                                Ver detalles
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Modal de Detalle de Prueba */}
              {selectedDetailTest && (
                <div
                  className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
                  onClick={() => setSelectedDetailTest(null)}
                >
                  <div
                    className="bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-[#18313B] dark:text-[#F1F5F9]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between border-b border-[#DCE4E8] dark:border-[#243542] pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#167D78] dark:text-[#2DD4BF]">
                          {selectedDetailTest.moduleName}
                        </span>
                        <h3 className="text-base font-bold">{selectedDetailTest.name}</h3>
                      </div>
                      <button
                        onClick={() => setSelectedDetailTest(null)}
                        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        <X className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed">
                      <div>
                        <strong className="block text-slate-500 dark:text-slate-400 mb-0.5">Propósito:</strong>
                        <p>{selectedDetailTest.description}</p>
                      </div>

                      <div>
                        <strong className="block text-slate-500 dark:text-slate-400 mb-0.5">Estado:</strong>
                        <span
                          className={`inline-block px-2 py-0.5 rounded font-bold uppercase text-[11px] ${
                            selectedDetailTest.status === 'passed'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : selectedDetailTest.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {selectedDetailTest.status.toUpperCase()}
                        </span>
                      </div>

                      {selectedDetailTest.detail && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                          <strong className="block text-slate-700 dark:text-slate-300 mb-1">Resultado de la auditoría:</strong>
                          <p>{selectedDetailTest.detail}</p>
                        </div>
                      )}

                      {selectedDetailTest.remedySuggestion && (
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                          <strong className="block mb-1">Acción correctiva propuesta:</strong>
                          <p>{selectedDetailTest.remedySuggestion}</p>
                        </div>
                      )}

                      {selectedDetailTest.executionDate && (
                        <div className="text-[11px] text-slate-400">
                          Fecha de auditoría: {selectedDetailTest.executionDate}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DCE4E8] dark:border-[#243542]">
                      <button
                        onClick={async () => {
                          const res = await executeSingleTest(selectedDetailTest, project);
                          setSelectedDetailTest(res);
                          setTestCases((prev) => prev.map((item) => (item.id === res.id ? res : item)));
                        }}
                        className="px-3 py-1.5 bg-[#167D78] hover:bg-[#0F5E5A] text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Re-ejecutar prueba
                      </button>
                      <button
                        onClick={() => setSelectedDetailTest(null)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
