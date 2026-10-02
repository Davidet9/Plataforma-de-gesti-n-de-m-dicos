import React from 'react';
import { UploadCloud, Download, RotateCcw, Calendar, GitCompare } from 'lucide-react';
import { MonthlyDataset } from '../types/clinical';

interface HeaderProps {
  datasets: Record<string, MonthlyDataset>;
  selectedMonthId: string;
  onSelectMonth: (mesId: string) => void;
  isComparisonMode: boolean;
  onToggleComparison: () => void;
  onOpenUpload: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  datasets,
  selectedMonthId,
  onSelectMonth,
  isComparisonMode,
  onToggleComparison,
  onOpenUpload,
  onExportCsv,
  onResetData,
}) => {
  const monthKeys = Object.keys(datasets).sort();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity zone */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg text-white flex items-center justify-center font-black text-xl shadow-xs"
            style={{ backgroundColor: '#d21d1f' }}
          >
            C
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight leading-none" style={{ color: '#162b6f' }}>
              CCICOL <span style={{ color: '#d21d1f' }}>S.A.S</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Cardiodata · Dr. Oscar Javier Salcedo Valle
            </div>
          </div>
        </div>

        {/* Navigation & Month Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 ml-2 mr-1.5" style={{ color: '#162b6f' }} />
            <select
              value={selectedMonthId}
              onChange={(e) => onSelectMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 pr-3 py-1 focus:outline-none cursor-pointer"
            >
              {monthKeys.map((key) => (
                <option key={key} value={key}>
                  {datasets[key]?.nombreMes || key} ({datasets[key]?.citas.length || 0} citas)
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onToggleComparison}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border ${
              isComparisonMode
                ? 'bg-[#f0f4fc] border-blue-300 text-[#162b6f]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" style={{ color: isComparisonMode ? '#d21d1f' : '#162b6f' }} />
            <span className="whitespace-nowrap">Comparar Meses</span>
          </button>
        </div>

        {/* Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            title="Exportar registros a CSV"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 hover:brightness-95 active:scale-98"
            style={{ backgroundColor: '#d21d1f' }}
          >
            <UploadCloud className="w-4 h-4 text-white" />
            <span>Subir Datos (Excel / PDF)</span>
          </button>

          <button
            onClick={onResetData}
            title="Restablecer datos originales"
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors hover:bg-slate-100"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
