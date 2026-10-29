/**
 * ELECTRA PLAN — Barra de Navegación Principal
 */
import React from 'react';
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
  | 'informe';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeLampsCount: number;
  hasErrors: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeLampsCount,
  hasErrors,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  const tabs = [
    {
      id: 'plano' as ActiveTab,
      label: 'Plano CAD',
      icon: Layers,
      badge: null,
    },
    {
      id: 'simulador' as ActiveTab,
      label: 'Simulador',
      icon: PlayCircle,
      badge: activeLampsCount > 0 ? `${activeLampsCount} enc.` : null,
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-700/50',
    },
    {
      id: 'diagnostico' as ActiveTab,
      label: 'Diagnóstico & Fallas',
      icon: Activity,
      badge: hasErrors ? 'Falla' : 'Auditoría',
      badgeColor: hasErrors
        ? 'text-red-400 bg-red-950/60 border-red-700/50'
        : 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50',
    },
    {
      id: 'analizar_foto' as ActiveTab,
      label: 'Analizar Foto',
      icon: Scan,
      badge: 'Visual',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50',
    },
    {
      id: 'explicaciones' as ActiveTab,
      label: 'Explicaciones Visuales',
      icon: Sparkles,
      badge: 'Animado',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-700/50',
    },
    {
      id: 'trifasica' as ActiveTab,
      label: 'Balance Fases',
      icon: ArrowRightLeft,
      badge: 'R-S-T',
      badgeColor: 'text-purple-400 bg-purple-950/60 border-purple-700/50',
    },
    {
      id: 'circuitos' as ActiveTab,
      label: 'Circuitos',
      icon: Network,
      badge: null,
    },
    {
      id: 'calculos' as ActiveTab,
      label: 'Cálculos',
      icon: Calculator,
      badge: hasErrors ? 'Alerta' : null,
      badgeColor: 'text-red-400 bg-red-950/60 border-red-700/50',
    },
    {
      id: 'tablero' as ActiveTab,
      label: 'Taller de Tableros',
      icon: Cpu,
      badge: '15 Talleres',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-700/50',
    },
    {
      id: 'materiales' as ActiveTab,
      label: 'Materiales & Costos',
      icon: ShoppingBag,
      badge: null,
    },
    {
      id: 'practicas' as ActiveTab,
      label: 'Aula de Prácticas',
      icon: GraduationCap,
      badge: '14 Talleres',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50',
    },
    {
      id: 'aprender' as ActiveTab,
      label: 'Aprender Componentes',
      icon: Sparkles,
      badge: 'Principiante',
      badgeColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-700/50',
    },
    {
      id: 'solicitud' as ActiveTab,
      label: 'Solicitud Cliente',
      icon: ClipboardList,
      badge: 'Nuevo',
      badgeColor: 'text-amber-400 bg-amber-950/60 border-amber-700/50',
    },
    {
      id: 'informe' as ActiveTab,
      label: 'Informe Técnico',
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <div className="relative no-print bg-white dark:bg-[#142028] border-b border-[#DCE4E8] dark:border-[#243542] shrink-0 transition-colors">
      <nav
        ref={containerRef}
        aria-label="Pestañas de la aplicación"
        className="px-2 sm:px-3 py-1.5 sm:py-1 flex items-center overflow-x-auto scrollbar-none gap-1 sm:gap-1.5 touch-pan-x"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all shrink-0 min-h-[36px] sm:min-h-[32px] ${
                isActive
                  ? 'bg-[#E8F5F5] dark:bg-[#167D78]/25 text-[#167D78] dark:text-[#2DD4BF] font-bold border border-[#B7DFDD] dark:border-[#167D78]/50 shadow-2xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#18313B] dark:hover:text-white hover:bg-[#F4F6F8] dark:hover:bg-[#1B2B36]'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-3.5 sm:h-3.5 ${isActive ? 'text-[#167D78] dark:text-[#2DD4BF]' : 'text-[#8E9FAA] dark:text-[#64748B]'}`} />
              <span className="text-xs">{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold border ${
                    isActive
                      ? 'bg-white dark:bg-[#142028] text-[#167D78] dark:text-[#2DD4BF] border-[#B7DFDD] dark:border-[#167D78]/40'
                      : 'bg-[#F4F6F8] dark:bg-[#1B2B36] text-[#64748B] dark:text-[#94A3B8] border-[#DCE4E8] dark:border-[#243542]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
