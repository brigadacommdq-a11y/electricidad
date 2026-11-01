/**
 * ELECTRA PLAN — Gestión de Obras y Clientes (Fase 9)
 * Herramienta profesional de administración integral para el instalador electricista:
 * 1. Ficha Técnica de Cliente y Ubicación del Inmueble (Datos catastrales, distribuidora, acometida).
 * 2. Línea de Tiempo y Fases de Avance de Obra con control porcentual de ejecución.
 * 3. Bitácora de Campo de Electricidad (Registro cronológico de ensayos, mediciones y modificaciones).
 * 4. Checklist Reglamentario de Recepción y Acta de Entrega Definitiva de Obra.
 * 5. Generación de Documentación Formal de Entrega Imprimible.
 */
import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  User,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  Printer,
  Plus,
  Trash2,
  Phone,
  Mail,
  Zap,
  Building,
  ShieldCheck,
  ClipboardCheck,
  ChevronRight,
  Sparkles,
  Save,
} from 'lucide-react';
import { Project } from '../types/electra';

interface JobClientManagementViewProps {
  project: Project;
  onUpdateProject?: (updater: (prev: Project) => Project) => void;
}

interface WorkPhase {
  id: string;
  name: string;
  description: string;
  status: 'pendiente' | 'en_progreso' | 'completado';
  progressPercent: number;
  startDate: string;
  finishDate: string;
}

interface LogbookEntry {
  id: string;
  date: string;
  time: string;
  author: string;
  category: 'avance' | 'medicion' | 'material' | 'cambio_cliente' | 'incidencia';
  title: string;
  description: string;
  verified: boolean;
}

interface HandoverCheckItem {
  id: string;
  label: string;
  normative: string;
  checked: boolean;
  notes: string;
}

export const JobClientManagementView: React.FC<JobClientManagementViewProps> = ({
  project,
  onUpdateProject,
}) => {
  const [activeTab, setActiveTab] = useState<'ficha_obra' | 'cronograma' | 'bitacora' | 'acta_entrega'>('cronograma');

  // =========================================================================
  // 1. FICHA DEL CLIENTE Y DE LA OBRA
  // =========================================================================
  const [clientData, setClientData] = useState({
    clientName: project.clientRequest?.clientName || project.metadata?.client || 'Familia Rodríguez — Residencia Unifamiliar',
    clientPhone: '+54 11 4821-9982',
    clientEmail: 'comitente.obra@electraplan.com',
    siteAddress: project.clientRequest?.siteAddress || project.metadata?.address || 'Av. Libertador 4850, Piso 4 B, CABA',
    cadastralId: 'Circunscripción 16, Sección 24, Manzana 12',
    utilityCompany: 'Edenor S.A. (Tarifa T1-Residencial)',
    meterNumber: 'ED-8472910-X',
    supplyType: 'Monofásico 230V — 50Hz (Potencia Solicitada: 6.6 kW)',
    contractStartDate: '2025-03-01',
    targetDeliveryDate: '2025-04-15',
    totalBudgetAgreed: '$ 1.850.000 ARS',
  });

  // =========================================================================
  // 2. FASES DE AVANCE DE OBRA
  // =========================================================================
  const [phases, setPhases] = useState<WorkPhase[]>([
    {
      id: 'fase_1',
      name: '1. Replanteo y Canalización',
      description: 'Trazado sobre muros, calado y amurado de cañerías metálicas/corrugadas ignífugas.',
      status: 'completado',
      progressPercent: 100,
      startDate: '01/03/2025',
      finishDate: '08/03/2025',
    },
    {
      id: 'fase_2',
      name: '2. Cajas y Embutido de Tableros',
      description: 'Fijación a nivel de cajas de paso, derivación y gabinete de tablero DIN (IP40).',
      status: 'completado',
      progressPercent: 100,
      startDate: '09/03/2025',
      finishDate: '15/03/2025',
    },
    {
      id: 'fase_3',
      name: '3. Enhebrado de Conductores',
      description: 'Pasaje de cables antillama IRAM 247-3 con código de colores (Marrón, Celeste, Verde/Amarillo).',
      status: 'en_progreso',
      progressPercent: 75,
      startDate: '16/03/2025',
      finishDate: '26/03/2025',
    },
    {
      id: 'fase_4',
      name: '4. Conexionado de Dispositivos',
      description: 'Montaje de módulos de tomacorrientes con tierra (IRAM 2071) e interruptores de un efecto y combinación.',
      status: 'en_progreso',
      progressPercent: 40,
      startDate: '27/03/2025',
      finishDate: '05/04/2025',
    },
    {
      id: 'fase_5',
      name: '5. Tablero DIN, Ensayos y Entrega',
      description: 'Peinado de cables en tablero, prueba de disparo de disyuntor (30mA), medición de jabalina PAT y acta de entrega.',
      status: 'pendiente',
      progressPercent: 0,
      startDate: '06/04/2025',
      finishDate: '15/04/2025',
    },
  ]);

  // Progreso Global Ponderado
  const overallProgress = useMemo(() => {
    const total = phases.reduce((acc, p) => acc + p.progressPercent, 0);
    return Math.round(total / phases.length);
  }, [phases]);

  // =========================================================================
  // 3. BITÁCORA TÉCNICA DE CAMPO
  // =========================================================================
  const [logbook, setLogbook] = useState<LogbookEntry[]>([
    {
      id: 'log_1',
      date: '02/03/2025',
      time: '09:30',
      author: 'Téc. Lucas Silva',
      category: 'avance',
      title: 'Replanteo de bocas en Living y Cocina',
      description: 'Se marcaron 6 bocas de tomacorrientes sobre mesada y 2 centros de iluminación de acuerdo al plano CAD.',
      verified: true,
    },
    {
      id: 'log_2',
      date: '10/03/2025',
      time: '14:15',
      author: 'Téc. Lucas Silva',
      category: 'medicion',
      title: 'Hincado de Jabalina PAT y Medición Preliminar',
      description: 'Se clavó jabalina de cobre-acero de 1.50m en jardín frontal. Medición de resistencia con telurímetro: 6.8 Ω (Excelente, inferior a los 10 Ω que exige AEA).',
      verified: true,
    },
    {
      id: 'log_3',
      date: '18/03/2025',
      time: '11:00',
      author: 'Ing. Marcelo Gomez',
      category: 'cambio_cliente',
      title: 'Agregado de Circuito Especial para Aire Acondicionado',
      description: 'El comitente solicita agregar una boca de toma especial TUE de 20A en dormitorio principal para split inverter de 4500 frigorías. Se adicionó cañería de 20mm y cable de 4mm².',
      verified: true,
    },
  ]);

  // Formulario para nueva entrada de bitácora
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogDesc, setNewLogDesc] = useState('');
  const [newLogCategory, setNewLogCategory] = useState<LogbookEntry['category']>('avance');

  const handleAddLogEntry = () => {
    if (!newLogTitle.trim() || !newLogDesc.trim()) return;
    const now = new Date();
    const newEntry: LogbookEntry = {
      id: `log_${Date.now()}`,
      date: now.toLocaleDateString('es-AR'),
      time: now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      author: 'Electricista Matriculado',
      category: newLogCategory,
      title: newLogTitle,
      description: newLogDesc,
      verified: true,
    };
    setLogbook([newEntry, ...logbook]);
    setNewLogTitle('');
    setNewLogDesc('');
  };

  // =========================================================================
  // 4. CHECKLIST DE ENTREGA Y CONFORMIDAD
  // =========================================================================
  const [checklist, setChecklist] = useState<HandoverCheckItem[]>([
    {
      id: 'chk_1',
      label: 'Ensayo del Pulsador de Test del Disyuntor Diferencial (30 mA)',
      normative: 'AEA 90364-771.18 — Tiempo de disparo inferior a 200 ms verificado',
      checked: true,
      notes: 'Disparo instantáneo verificado en simulador y tablero',
    },
    {
      id: 'chk_2',
      label: 'Polaridad Correcta en todos los Tomacorrientes (IRAM 2071)',
      normative: 'Fase a la derecha (espiga inclinada der.), Neutro a la izquierda, Tierra al centro inferior',
      checked: true,
      notes: '100% de tomas verificados sin inversión de fase/neutro',
    },
    {
      id: 'chk_3',
      label: 'Continuidad Eléctrica del Conductor de Protección (PE) a todas las bocas',
      normative: 'Verificación con óhmetro / zumbador desde barra de tierra del tablero a cada chasis metálico',
      checked: true,
      notes: 'Todas las cajas metálicas y espigas de tierra tienen continuidad directa',
    },
    {
      id: 'chk_4',
      label: 'Resistencia de Aislación entre Conductores Activos y Tierra (> 0.5 MΩ)',
      normative: 'Ensayo con megóhmetro a 500 V DC según norma IRAM',
      checked: true,
      notes: 'Valor obtenido: > 50 MΩ en seco',
    },
    {
      id: 'chk_5',
      label: 'Rotulado Identificatorio y Señalización de Peligro en Tablero',
      normative: 'Etiquetas legibles por circuito (IUG, TUG, TUE) y símbolo de rayo de advertencia',
      checked: false,
      notes: 'Pendiente colocación de rótulos autoadhesivos finales',
    },
    {
      id: 'chk_6',
      label: 'Entrega de Planos "Conforme a Obra" y Esquema Unifilar al Propietario',
      normative: 'Exigencia reglamentaria para el legajo técnico domiciliario',
      checked: false,
      notes: 'Se entregarán impresos junto al acta definitiva',
    },
  ]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const checklistProgress = useMemo(() => {
    const passed = checklist.filter((c) => c.checked).length;
    return Math.round((passed / checklist.length) * 100);
  }, [checklist]);

  return (
    <div className="flex-1 flex flex-col bg-[#F8FAFB] dark:bg-[#0B1319] overflow-y-auto">
      {/* Encabezado */}
      <div className="bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] px-6 py-5 sticky top-0 z-10 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#E8F5F5] dark:bg-[#1B2B36] text-[#167D78] dark:text-[#2DD4BF] flex items-center justify-center shadow-inner">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#111827] dark:text-[#E8F0F2]">
                  Gestión de Obras, Clientes y Bitácora Técnica
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {overallProgress}% Ejecutado
                </span>
              </div>
              <p className="text-xs text-[#5A7184] dark:text-[#8BA2B2]">
                Control integral de etapas constructivas, libro de actas de campo y entrega formal
              </p>
            </div>
          </div>

          {/* Selector de Pestañas de Gestión */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#1A2833] p-1 rounded-xl">
            {[
              { id: 'cronograma', label: 'Etapas de Obra', icon: Clock },
              { id: 'bitacora', label: 'Bitácora de Campo', icon: FileText },
              { id: 'acta_entrega', label: 'Checklist & Entrega', icon: ClipboardCheck },
              { id: 'ficha_obra', label: 'Datos del Cliente', icon: User },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white dark:bg-[#142028] text-[#167D78] dark:text-[#2DD4BF] shadow-xs'
                      : 'text-[#5A7184] dark:text-[#8BA2B2] hover:text-[#111827]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* RESUMEN RÁPIDO DE LA OBRA */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-xs text-[#5A7184] font-medium block">Cliente Comitente</span>
            <span className="text-sm font-bold text-[#111827] dark:text-white mt-1 block truncate">
              {clientData.clientName}
            </span>
            <span className="text-[11px] text-[#5A7184] flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3 h-3 text-[#167D78]" /> {clientData.siteAddress}
            </span>
          </div>

          <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-xs text-[#5A7184] font-medium block">Avance Global de Obra</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#167D78] dark:text-[#2DD4BF]">
                {overallProgress}%
              </span>
              <span className="text-xs text-[#5A7184]">completado</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#167D78] h-full rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-xs text-[#5A7184] font-medium block">Conformidad de Entrega</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#111827] dark:text-white">
                {checklistProgress}%
              </span>
              <span className="text-xs text-[#5A7184]">
                ({checklist.filter((c) => c.checked).length}/{checklist.length} ítems)
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
              {checklistProgress === 100 ? 'Listo para entrega' : 'En proceso de pruebas'}
            </span>
          </div>

          <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542]">
            <span className="text-xs text-[#5A7184] font-medium block">Fecha Límite Prevista</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-lg font-bold text-[#111827] dark:text-white">
                {clientData.targetDeliveryDate}
              </span>
            </div>
            <span className="text-[11px] text-[#5A7184] block mt-1">
              Presupuesto: {clientData.totalBudgetAgreed}
            </span>
          </div>
        </div>

        {/* =====================================================================
            PESTAÑA 1: CRONOGRAMA Y FASES DE AVANCE
        ===================================================================== */}
        {activeTab === 'cronograma' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#111827] dark:text-white">
                  Cronograma de Ejecución y Estado de Fases
                </h2>
                <p className="text-xs text-[#5A7184]">
                  Control de hitos constructivos desde la canalización hasta el acta de recepción
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {phases.map((phase, idx) => (
                <div
                  key={phase.id}
                  className="bg-white dark:bg-[#142028] p-5 rounded-xl border border-[#DCE4E8] dark:border-[#243542] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-xs"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        phase.status === 'completado'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : phase.status === 'en_progreso'
                          ? 'bg-[#E8F5F5] text-[#167D78] dark:bg-[#1B2B36] dark:text-[#2DD4BF]'
                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                      }`}
                    >
                      {phase.status === 'completado' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <span>0{idx + 1}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#111827] dark:text-white">
                          {phase.name}
                        </h3>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            phase.status === 'completado'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : phase.status === 'en_progreso'
                              ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                          }`}
                        >
                          {phase.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-[#5A7184] mt-0.5">{phase.description}</p>
                      <div className="flex items-center gap-4 text-[11px] text-[#5A7184] mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> Inicio: {phase.startDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Finalización: {phase.finishDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:w-64 shrink-0">
                    <div className="w-full">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-[#5A7184]">Avance</span>
                        <span className="text-[#167D78]">{phase.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#167D78] h-full rounded-full transition-all"
                          style={{ width: `${phase.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setPhases((prev) =>
                            prev.map((p) => {
                              if (p.id !== phase.id) return p;
                              const nextStatus =
                                p.status === 'pendiente'
                                  ? 'en_progreso'
                                  : p.status === 'en_progreso'
                                  ? 'completado'
                                  : 'pendiente';
                              const nextPercent =
                                nextStatus === 'completado'
                                  ? 100
                                  : nextStatus === 'en_progreso'
                                  ? 50
                                  : 0;
                              return { ...p, status: nextStatus, progressPercent: nextPercent };
                            })
                          );
                        }}
                        className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-[#1A2833] dark:hover:bg-[#243542] rounded-lg transition-all"
                      >
                        Cambiar Estado
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 2: BITÁCORA TÉCNICA DE CAMPO (LIBRO DE ACTAS)
        ===================================================================== */}
        {activeTab === 'bitacora' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#111827] dark:text-white">
                    Libro de Actas y Novedades de Campo
                  </h2>
                  <p className="text-xs text-[#5A7184]">
                    Historial cronológico inalterable de ensayos, decisiones técnicas e instrucciones
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {logbook.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-[#DCE4E8] dark:border-[#243542] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            entry.category === 'medicion'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60'
                              : entry.category === 'cambio_cliente'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60'
                              : entry.category === 'incidencia'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60'
                          }`}
                        >
                          {entry.category.replace('_', ' ')}
                        </span>
                        <h4 className="text-sm font-bold text-[#111827] dark:text-white">
                          {entry.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#5A7184]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{entry.date} — {entry.time}</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#4B5563] dark:text-[#9CA3AF] leading-relaxed">
                      {entry.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px] text-[#5A7184] border-t border-gray-100 dark:border-gray-800">
                      <span>Registrado por: <strong>{entry.author}</strong></span>
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verificado en obra
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario de Nueva Entrada */}
            <div className="bg-white dark:bg-[#142028] p-5 rounded-xl border border-[#DCE4E8] dark:border-[#243542] h-fit space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                <Plus className="w-5 h-5 text-[#167D78]" />
                <h3 className="text-sm font-bold text-[#111827] dark:text-white">
                  Asentar Entrada en Bitácora
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-[#5A7184] block mb-1">
                    Tipo de Suceso / Categoría
                  </label>
                  <select
                    value={newLogCategory}
                    onChange={(e) => setNewLogCategory(e.target.value as any)}
                    className="w-full text-xs bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                  >
                    <option value="avance">Avance Constructivo</option>
                    <option value="medicion">Medición o Ensayo Técnico</option>
                    <option value="cambio_cliente">Modificación Solicitada por Cliente</option>
                    <option value="material">Recepción de Materiales</option>
                    <option value="incidencia">Incidencia u Obstáculo en Obra</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5A7184] block mb-1">
                    Título de la Novedad
                  </label>
                  <input
                    type="text"
                    value={newLogTitle}
                    onChange={(e) => setNewLogTitle(e.target.value)}
                    placeholder="Ej. Prueba de disparo diferencial C1 a C4"
                    className="w-full text-xs bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#5A7184] block mb-1">
                    Descripción Técnica Detallada
                  </label>
                  <textarea
                    rows={4}
                    value={newLogDesc}
                    onChange={(e) => setNewLogDesc(e.target.value)}
                    placeholder="Indicar instrumentos utilizados, valores medidos, circuitos intervenidos y conclusiones..."
                    className="w-full text-xs bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                  />
                </div>

                <button
                  onClick={handleAddLogEntry}
                  disabled={!newLogTitle.trim() || !newLogDesc.trim()}
                  className="w-full py-2.5 bg-[#167D78] hover:bg-[#12635F] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Asiento en Bitácora</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 3: CHECKLIST Y ACTA DE RECEPCIÓN
        ===================================================================== */}
        {activeTab === 'acta_entrega' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#142028] p-6 rounded-2xl border border-[#DCE4E8] dark:border-[#243542] space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-[#111827] dark:text-white">
                    Protocolo de Pruebas y Checklist de Recepción de Obra
                  </h2>
                  <p className="text-xs text-[#5A7184]">
                    Verificaciones de seguridad previas a la desocupación de la cuadrilla y firma del comitente
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-[#167D78] hover:bg-[#12635F] text-white rounded-lg text-xs font-semibold shadow-xs transition-all self-start"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Acta de Entrega</span>
                </button>
              </div>

              {/* Lista interactiva de ítems de checklist */}
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => toggleChecklist(item.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                      item.checked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40'
                        : 'bg-white dark:bg-[#142028] border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="mt-0.5">
                      {item.checked ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-xs font-bold ${
                            item.checked
                              ? 'text-emerald-900 dark:text-emerald-200'
                              : 'text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {item.label}
                        </h4>
                        <span className="text-[10px] font-mono text-gray-500">
                          {item.checked ? 'VERIFICADO' : 'PENDIENTE'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {item.normative}
                      </p>
                      <p className="text-[11px] text-[#167D78] dark:text-[#2DD4BF] font-medium pt-1">
                        Nota de campo: {item.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formato de Acta Formal */}
              <div className="p-6 rounded-xl bg-gray-50 dark:bg-[#1A2833] border border-gray-200 dark:border-gray-700 space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-gray-700 dark:text-gray-300">
                  Acta de Entrega y Recepción Conforme de Instalación
                </h3>
                <p className="text-xs text-[#5A7184] dark:text-[#8BA2B2] leading-relaxed">
                  En la Ciudad de Buenos Aires, a los {new Date().getDate()} días del mes de{' '}
                  {new Date().toLocaleString('es-AR', { month: 'long' })} de {new Date().getFullYear()}, el
                  profesional electricista hace entrega al comitente <strong>{clientData.clientName}</strong> de la
                  obra eléctrica ejecutada en el inmueble sito en <strong>{clientData.siteAddress}</strong>,
                  habiéndose verificado el 100% de los puntos de seguridad contra contactos directos, indirectos y
                  sobrecargas. La instalación cuenta con garantía de mano de obra de 12 (doce) meses.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="border-b border-gray-400 dark:border-gray-600 h-10 w-48 mx-auto" />
                    <span className="text-xs font-bold block mt-2 text-gray-800 dark:text-gray-200">
                      Firma del Instalador Electricista
                    </span>
                    <span className="text-[10px] text-gray-500 block">Matrícula Profesional / Sello</span>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-gray-400 dark:border-gray-600 h-10 w-48 mx-auto" />
                    <span className="text-xs font-bold block mt-2 text-gray-800 dark:text-gray-200">
                      Firma de Conformidad del Propietario
                    </span>
                    <span className="text-[10px] text-gray-500 block">{clientData.clientName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            PESTAÑA 4: FICHA COMPLETA DEL CLIENTE
        ===================================================================== */}
        {activeTab === 'ficha_obra' && (
          <div className="bg-white dark:bg-[#142028] p-6 rounded-2xl border border-[#DCE4E8] dark:border-[#243542] space-y-6">
            <div>
              <h2 className="text-base font-bold text-[#111827] dark:text-white">
                Ficha del Comitente y Datos del Suministro Eléctrico
              </h2>
              <p className="text-xs text-[#5A7184]">
                Información legal y administrativa requerida para trámites ante la empresa distribuidora de energía
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-[#5A7184] block mb-1">Nombre Completo del Comitente</label>
                <input
                  type="text"
                  value={clientData.clientName}
                  onChange={(e) => setClientData({ ...clientData, clientName: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A7184] block mb-1">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={clientData.clientPhone}
                  onChange={(e) => setClientData({ ...clientData, clientPhone: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A7184] block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={clientData.clientEmail}
                  onChange={(e) => setClientData({ ...clientData, clientEmail: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A7184] block mb-1">Dirección del Inmueble</label>
                <input
                  type="text"
                  value={clientData.siteAddress}
                  onChange={(e) => setClientData({ ...clientData, siteAddress: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A7184] block mb-1">Empresa Distribuidora de Energía</label>
                <input
                  type="text"
                  value={clientData.utilityCompany}
                  onChange={(e) => setClientData({ ...clientData, utilityCompany: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                />
              </div>

              <div>
                <label className="font-semibold text-[#5A7184] block mb-1">Tipo de Acometida y Tensión</label>
                <input
                  type="text"
                  value={clientData.supplyType}
                  onChange={(e) => setClientData({ ...clientData, supplyType: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-[#1A2833] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-200"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  if (onUpdateProject) {
                    onUpdateProject((prev) => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        client: clientData.clientName,
                        address: clientData.siteAddress,
                      },
                      clientRequest: {
                        ...prev.clientRequest,
                        clientName: clientData.clientName,
                        siteAddress: clientData.siteAddress,
                      },
                    }));
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#167D78] hover:bg-[#12635F] text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios en Proyecto</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
