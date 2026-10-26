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
} from 'lucide-react';

export type ActiveTab =
  | 'plano'
  | 'simulador'
  | 'circuitos'
  | 'calculos'
  | 'tablero'
  | 'materiales'
  | 'practicas'
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
      label: 'Tablero',
      icon: Cpu,
      badge: null,
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
      badge: '10 Talleres',
      badgeColor: 'text-cyan-400 bg-cyan-950/60 border-cyan-700/50',
    },
    {
      id: 'informe' as ActiveTab,
      label: 'Informe Técnico',
      icon: FileText,
      badge: null,
    },
  ];

  return (
    <nav className="no-print bg-slate-900/95 border-b border-slate-800 px-3 py-1 flex items-center overflow-x-auto scrollbar-none gap-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              isActive
                ? 'bg-slate-800 text-amber-400 font-semibold shadow-xs border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded border font-normal ${
                  tab.badgeColor || 'text-slate-300 bg-slate-800 border-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
