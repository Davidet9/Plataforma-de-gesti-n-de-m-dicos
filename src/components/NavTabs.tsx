import React from 'react';
import { LayoutDashboard, Grid3X3, GitCompare, TableProperties, FileUp } from 'lucide-react';

export type DashboardTab = 'overview' | 'cross' | 'comparison' | 'explorer' | 'uploader';

interface NavTabsProps {
  activeTab: DashboardTab;
  onChangeTab: (tab: DashboardTab) => void;
  recordsCount: number;
}

export const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onChangeTab, recordsCount }) => {
  const tabs: { id: DashboardTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Resumen Clínico & KPIs', icon: LayoutDashboard },
    { id: 'cross', label: 'Cruce Multivariable (Matriz & Heatmap)', icon: Grid3X3 },
    { id: 'comparison', label: 'Comparativa Mensual', icon: GitCompare },
    { id: 'explorer', label: `Explorador de Datos (${recordsCount})`, icon: TableProperties },
    { id: 'uploader', label: 'Cargar Datos (Excel / PDF)', icon: FileUp },
  ];

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2.5 no-scrollbar" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-2 py-2 px-3.5 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
                style={
                  isActive
                    ? { backgroundColor: '#162b6f' }
                    : undefined
                }
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#ff6b6d]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full"
                    style={{ backgroundColor: '#d21d1f' }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
