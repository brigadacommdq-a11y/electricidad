/**
 * ELECTRA PLAN — Barra de Navegación Organizada
 * En PC: Acceso rápido prioritario + menús desplegables agrupados en 6 categorías limpias.
 * En Móvil: Barra inferior fija (Plano, Componentes, Propiedades, Menú) y Bottom Sheet con las 6 categorías.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  PlayCircle,
  Network,
  Calculator,
  Cpu,
  ShoppingBag,
  GraduationCap,
  FileText,
  Sparkles,
  ClipboardList,
  Activity,
  Scan,
  Sliders,
  ArrowRightLeft,
  ChevronDown,
  Box,
  Menu,
  X,
  Zap,
  FolderOpen,
  Settings,
  ShieldCheck,
  Check,
} from 'lucide-react';

export type ActiveTab =
  | 'plano'
  | 'simulador'
  | 'circuitos'
  | 'calculos'
  | 'tablero'
  | 'materiales'
  | 'practicas'
  | 'aprender'
  | 'diagnostico'
  | 'analizar_foto'
  | 'explicaciones'
  | 'trifasica'
  | 'solicitud'
  | 'informe'
  | 'configuracion';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeLampsCount: number;
  hasErrors: boolean;
  onOpenAcometidaModal?: () => void;
  onOpenProjectManager?: () => void;
  // Acciones móviles
  isMobileToolbarOpen?: boolean;
  onToggleMobileToolbar?: () => void;
  isMobilePropertiesOpen?: boolean;
  onToggleMobileProperties?: () => void;
  selectedElementId?: string | null;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeLampsCount,
  hasErrors,
  onOpenAcometidaModal,
  onOpenProjectManager,
  isMobileToolbarOpen = false,
  onToggleMobileToolbar,
  isMobilePropertiesOpen = false,
  onToggleMobileProperties,
  selectedElementId = null,
}) => {
  // Estado para desplegables en PC
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuSheetOpen, setIsMobileMenuSheetOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Cerrar desplegables al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Definición de las 6 categorías reglamentarias solicitadas
  const categories = [
    {
      id: 'instalacion',
      label: 'Instalación Eléctrica',
      icon: Network,
      tabs: ['circuitos', 'tablero', 'trifasica'],
      items: [
        {
          id: 'circuitos' as ActiveTab,
          label: 'Circuitos Derivados',
          desc: 'IUG, TUG, TUE, secciones y protecciones',
          icon: Network,
          badge: null,
        },
        {
          id: 'tablero' as ActiveTab,
          label: 'Taller de Tableros DIN',
          desc: 'Montaje sobre riel, cableado e interruptores',
          icon: Cpu,
          badge: '15 Talleres',
        },
        {
          id: 'trifasica' as ActiveTab,
          label: 'Balance de Fases',
          desc: 'Distribución equilibrada R-S-T',
          icon: ArrowRightLeft,
          badge: 'Trifásica',
        },
        {
          action: 'acometida',
          label: 'Acometida & Pilar',
          desc: 'Punto de entrega, medición y jabalina PAT',
          icon: Zap,
          badge: 'AEA 90364',
        },
      ],
    },
    {
      id: 'analisis',
      label: 'Herramientas & Análisis',
      icon: Activity,
      tabs: ['calculos', 'diagnostico', 'analizar_foto', 'explicaciones'],
      items: [
        {
          id: 'calculos' as ActiveTab,
          label: 'Memoria de Cálculos',
          desc: 'Corriente Ib, caída ΔV y sección térmica',
          icon: Calculator,
          badge: null,
        },
        {
          id: 'diagnostico' as ActiveTab,
          label: 'Diagnóstico & Fallas',
          desc: 'Detección de cortos, sobrecargas y fugas',
          icon: Activity,
          badge: hasErrors ? 'Falla Activa' : 'Auditoría OK',
          badgeColor: hasErrors ? 'text-red-600 bg-red-100' : 'text-emerald-600 bg-emerald-100',
        },
        {
          id: 'analizar_foto' as ActiveTab,
          label: 'Analizar Foto con Visión',
          desc: 'Inspección visual de tableros y cajas',
          icon: Scan,
          badge: 'Visual',
        },
        {
          id: 'explicaciones' as ActiveTab,
          label: 'Explicaciones Visuales',
          desc: 'Animaciones de fases, neutro y puesta a tierra',
          icon: Sparkles,
          badge: 'Animado',
        },
      ],
    },
    {
      id: 'aprender',
      label: 'Aprender & Practicar',
      icon: GraduationCap,
      tabs: ['practicas', 'aprender'],
      items: [
        {
          id: 'practicas' as ActiveTab,
          label: 'Aula de Prácticas Guiadas',
          desc: '14 desafíos paso a paso con validación',
          icon: GraduationCap,
          badge: '14 Talleres',
        },
        {
          id: 'aprender' as ActiveTab,
          label: 'Reconocimiento de Componentes',
          desc: 'Laboratorio visual para principiantes',
          icon: Sparkles,
          badge: 'Principiante',
        },
      ],
    },
    {
      id: 'documentacion',
      label: 'Proyectos & Documentación',
      icon: FileText,
      tabs: ['informe', 'materiales', 'solicitud'],
      items: [
        {
          id: 'informe' as ActiveTab,
          label: 'Informe Técnico Imprimible',
          desc: 'Documentación profesional para presentar',
          icon: FileText,
          badge: 'PDF/Print',
        },
        {
          id: 'materiales' as ActiveTab,
          label: 'Cómputo & Presupuesto',
          desc: 'Lista de materiales con exportación CSV',
          icon: ShoppingBag,
          badge: 'BOM',
        },
        {
          id: 'solicitud' as ActiveTab,
          label: 'Solicitud de Cliente',
          desc: 'Requisitos del comitente y programa de necesidades',
          icon: ClipboardList,
          badge: null,
        },
        {
          action: 'proyectos',
          label: 'Mis Proyectos',
          desc: 'Crear nueva vivienda, abrir y guardar',
          icon: FolderOpen,
          badge: null,
        },
      ],
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    onTabChange(tab);
    setOpenDropdown(null);
    setIsMobileMenuSheetOpen(false);
  };

  return (
    <>
      {/* =========================================================================
          1. BARRA DE NAVEGACIÓN EN ESCRITORIO (md y superior)
          Limpia, en una sola fila, con accesos directos y menús desplegables
          ========================================================================= */}
      <div
        ref={navRef}
        className="hidden md:block no-print bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] shrink-0 transition-colors z-25 relative"
      >
        <div className="px-3 sm:px-4 py-1.5 flex items-center justify-between gap-2 max-w-full">
          <nav className="flex items-center gap-1 sm:gap-1.5 flex-wrap" aria-label="Navegación principal">
            {/* Acceso Rápido 1: Plano CAD (Área Principal) */}
            <button
              onClick={() => handleSelectTab('plano')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                activeTab === 'plano'
                  ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] font-bold border border-[#B7DFDD] dark:border-[#167D78]/50 shadow-2xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36]'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeTab === 'plano' ? 'text-[#167D78] dark:text-[#2DD4BF]' : 'text-[#8E9FAA]'}`} />
              <span>Plano CAD</span>
            </button>

            {/* Acceso Rápido 2: Simulador */}
            <button
              onClick={() => handleSelectTab('simulador')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                activeTab === 'simulador'
                  ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] font-bold border border-[#B7DFDD] dark:border-[#167D78]/50 shadow-2xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36]'
              }`}
            >
              <PlayCircle
                className={`w-4 h-4 ${activeTab === 'simulador' ? 'text-[#167D78] dark:text-[#2DD4BF]' : 'text-[#8E9FAA]'}`}
              />
              <span>Simulador</span>
              {activeLampsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  {activeLampsCount} enc.
                </span>
              )}
            </button>

            <div className="h-4 w-px bg-[#DCE4E8] dark:bg-[#243542] mx-1" />

            {/* Menús Desplegables de Categorías */}
            {categories.map((cat) => {
              const Icon = cat.icon;
              const hasActiveChild = cat.tabs.includes(activeTab);
              const isOpen = openDropdown === cat.id;

              return (
                <div key={cat.id} className="relative">
                  <button
                    onClick={() => setOpenDropdown(isOpen ? null : cat.id)}
                    aria-expanded={isOpen}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                      hasActiveChild
                        ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] font-bold border border-[#B7DFDD] dark:border-[#167D78]/50 shadow-2xs'
                        : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${hasActiveChild ? 'text-[#167D78] dark:text-[#2DD4BF]' : 'text-[#8E9FAA]'}`} />
                    <span>{cat.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown flotante */}
                  {isOpen && (
                    <div className="absolute left-0 mt-1.5 w-72 bg-white dark:bg-[#142028] border border-[#DCE4E8] dark:border-[#243542] rounded-xl shadow-xl py-1.5 z-50 text-xs text-[#18313B] dark:text-[#F1F5F9] animate-fade-in">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8E9FAA] dark:text-[#64748B]">
                        {cat.label}
                      </div>
                      {cat.items.map((item, idx) => {
                        const ItemIcon = item.icon;
                        const isCurrent = 'id' in item && activeTab === item.id;

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              if ('action' in item) {
                                if (item.action === 'acometida' && onOpenAcometidaModal) onOpenAcometidaModal();
                                if (item.action === 'proyectos' && onOpenProjectManager) onOpenProjectManager();
                                setOpenDropdown(null);
                              } else {
                                handleSelectTab(item.id);
                              }
                            }}
                            className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors min-h-[44px] ${
                              isCurrent
                                ? 'bg-[#E8F5F5] dark:bg-[#167D78]/20 text-[#167D78] dark:text-[#2DD4BF] font-semibold'
                                : 'hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36] text-[#18313B] dark:text-[#F1F5F9]'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4 mt-0.5 shrink-0 text-[#167D78] dark:text-[#2DD4BF]" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-semibold truncate">{item.label}</span>
                                {item.badge && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded font-bold border border-[#DCE4E8] dark:border-[#243542] text-[#64748B] dark:text-[#94A3B8] shrink-0">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">{item.desc}</div>
                            </div>
                            {isCurrent && <Check className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF] shrink-0 mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Botón de Configuración en barra de escritorio */}
          <button
            onClick={() => handleSelectTab('configuracion')}
            title="Preferencias de interfaz, editor CAD y parámetros"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[36px] shrink-0 ${
              activeTab === 'configuracion'
                ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] font-bold border border-[#B7DFDD] dark:border-[#167D78]/50 shadow-2xs'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden lg:inline">Configuración</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2. BARRA INFERIOR FIJA EN MÓVIL (< md)
          Requisito UX: Barra inferior fija con Plano, Componentes, Propiedades y Menú
          Objetivos táctiles de 48px con soporte de safe-area
          ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#142028]/95 border-t border-[#DCE4E8] dark:border-[#243542] backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-lg no-print">
        <div className="grid grid-cols-4 h-14 items-center px-1">
          {/* Botón 1: Plano */}
          <button
            onClick={() => {
              handleSelectTab('plano');
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
              activeTab === 'plano' && !isMobileToolbarOpen && !isMobilePropertiesOpen && !isMobileMenuSheetOpen
                ? 'text-[#167D78] dark:text-[#2DD4BF] font-bold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B]'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Plano</span>
          </button>

          {/* Botón 2: Componentes / Catálogo CAD */}
          <button
            onClick={() => {
              if (onToggleMobileToolbar) onToggleMobileToolbar();
              setIsMobileMenuSheetOpen(false);
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] relative transition-colors ${
              isMobileToolbarOpen
                ? 'text-[#167D78] dark:text-[#2DD4BF] font-bold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B]'
            }`}
          >
            <Box className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Componentes</span>
            {isMobileToolbarOpen && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#167D78] dark:bg-[#2DD4BF] absolute top-2 right-6" />
            )}
          </button>

          {/* Botón 3: Propiedades Técnicas */}
          <button
            onClick={() => {
              if (onToggleMobileProperties) onToggleMobileProperties();
              setIsMobileMenuSheetOpen(false);
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] relative transition-colors ${
              isMobilePropertiesOpen
                ? 'text-[#167D78] dark:text-[#2DD4BF] font-bold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B]'
            }`}
          >
            <Sliders className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Propiedades</span>
            {selectedElementId && (
              <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2 right-6 animate-pulse" />
            )}
          </button>

          {/* Botón 4: Menú Completo de Funciones */}
          <button
            onClick={() => {
              setIsMobileMenuSheetOpen(!isMobileMenuSheetOpen);
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
              isMobileMenuSheetOpen
                ? 'text-[#167D78] dark:text-[#2DD4BF] font-bold'
                : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B]'
            }`}
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Menú</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          3. BOTTOM SHEET MENÚ MÓVIL
          Despliega las 6 categorías organizadas de forma accesible
          ========================================================================= */}
      {isMobileMenuSheetOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-fade-in"
          onClick={() => setIsMobileMenuSheetOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#142028] border-t border-[#DCE4E8] dark:border-[#243542] rounded-t-2xl max-h-[85vh] h-[80vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Bottom Sheet */}
            <div className="flex items-center justify-between p-4 border-b border-[#DCE4E8] dark:border-[#243542] shrink-0">
              <div className="flex items-center gap-2 font-bold text-sm text-[#18313B] dark:text-white">
                <Menu className="w-4 h-4 text-[#167D78] dark:text-[#2DD4BF]" />
                <span>Navegación & Módulos</span>
              </div>
              <button
                onClick={() => setIsMobileMenuSheetOpen(false)}
                className="p-2 text-[#64748B] hover:text-[#18313B] dark:hover:text-white bg-[#F4F6F8] dark:bg-[#1B2B36] rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cerrar menú"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido en 6 categorías */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
              {/* Categoría 1: Plano de Trabajo */}
              <div className="bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/60 rounded-xl p-2.5 border border-[#DCE4E8] dark:border-[#243542]">
                <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase px-1 mb-1">
                  1. Plano de Trabajo
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSelectTab('plano')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'plano'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Plano CAD</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('simulador')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'simulador'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4 shrink-0" />
                    <span>Simulador</span>
                  </button>
                </div>
              </div>

              {/* Categoría 2: Instalación Eléctrica */}
              <div className="bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/60 rounded-xl p-2.5 border border-[#DCE4E8] dark:border-[#243542]">
                <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase px-1 mb-1">
                  2. Instalación Eléctrica
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSelectTab('circuitos')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'circuitos'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <Network className="w-4 h-4 shrink-0" />
                    <span>Circuitos</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('tablero')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'tablero'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <Cpu className="w-4 h-4 shrink-0" />
                    <span>Tableros DIN</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('trifasica')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'trifasica'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4 shrink-0" />
                    <span>Balance Fases</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenAcometidaModal) onOpenAcometidaModal();
                      setIsMobileMenuSheetOpen(false);
                    }}
                    className="p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] bg-white dark:bg-[#142028] text-[#167D78] dark:text-[#2DD4BF] border border-[#B7DFDD] dark:border-[#167D78]/50"
                  >
                    <Zap className="w-4 h-4 shrink-0" />
                    <span>Acometida & Pilar</span>
                  </button>
                </div>
              </div>

              {/* Categoría 3: Herramientas y Análisis */}
              <div className="bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/60 rounded-xl p-2.5 border border-[#DCE4E8] dark:border-[#243542]">
                <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase px-1 mb-1">
                  3. Herramientas & Análisis
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSelectTab('calculos')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'calculos'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <Calculator className="w-4 h-4 shrink-0" />
                    <span>Cálculos AEA</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('diagnostico')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'diagnostico'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <Activity className="w-4 h-4 shrink-0" />
                    <span>Diagnóstico</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('analizar_foto')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'analizar_foto'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <Scan className="w-4 h-4 shrink-0" />
                    <span>Analizar Foto</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('explicaciones')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'explicaciones'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Explicaciones</span>
                  </button>
                </div>
              </div>

              {/* Categoría 4: Aprender y Practicar */}
              <div className="bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/60 rounded-xl p-2.5 border border-[#DCE4E8] dark:border-[#243542]">
                <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase px-1 mb-1">
                  4. Aprender & Practicar
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSelectTab('practicas')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'practicas'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 shrink-0" />
                    <span>Aula de Prácticas</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('aprender')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'aprender'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Componentes</span>
                  </button>
                </div>
              </div>

              {/* Categoría 5: Proyectos y Documentación */}
              <div className="bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/60 rounded-xl p-2.5 border border-[#DCE4E8] dark:border-[#243542]">
                <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase px-1 mb-1">
                  5. Proyectos & Documentación
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleSelectTab('informe')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'informe'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Informe PDF</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('materiales')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'materiales'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Presupuesto</span>
                  </button>
                  <button
                    onClick={() => handleSelectTab('solicitud')}
                    className={`p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] ${
                      activeTab === 'solicitud'
                        ? 'bg-[#167D78] text-white'
                        : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 shrink-0" />
                    <span>Solicitud</span>
                  </button>
                  <button
                    onClick={() => {
                      if (onOpenProjectManager) onOpenProjectManager();
                      setIsMobileMenuSheetOpen(false);
                    }}
                    className="p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2 min-h-[44px] bg-white dark:bg-[#142028] text-[#167D78] dark:text-[#2DD4BF] border border-[#B7DFDD] dark:border-[#167D78]/50"
                  >
                    <FolderOpen className="w-4 h-4 shrink-0" />
                    <span>Mis Proyectos</span>
                  </button>
                </div>
              </div>

              {/* Categoría 6: Configuración */}
              <div className="bg-[#F4F6F8]/60 dark:bg-[#1B2B36]/60 rounded-xl p-2.5 border border-[#DCE4E8] dark:border-[#243542]">
                <div className="text-[10px] font-bold text-[#167D78] dark:text-[#2DD4BF] uppercase px-1 mb-1">
                  6. Configuración & Preferencias
                </div>
                <button
                  onClick={() => handleSelectTab('configuracion')}
                  className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex items-center gap-2.5 min-h-[44px] ${
                    activeTab === 'configuracion'
                      ? 'bg-[#167D78] text-white'
                      : 'bg-white dark:bg-[#142028] text-[#18313B] dark:text-[#F1F5F9] border border-[#DCE4E8] dark:border-[#243542]'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="font-bold">Ajustes del Sistema</div>
                    <div className="text-[10px] opacity-80">Apariencia, cuadrícula CAD, modo táctil y accesibilidad</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
