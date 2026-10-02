import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { FilterState } from '../types/clinical';

interface FilterToolbarProps {
  filters: FilterState;
  onUpdateFilters: (partial: Partial<FilterState>) => void;
  onResetFilters: () => void;
  availableProcedures: string[];
  availableEps: string[];
  availableMunicipalities: string[];
  totalRecords: number;
  filteredCount: number;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  availableProcedures,
  availableEps,
  totalRecords,
  filteredCount,
}) => {
  const isFiltered =
    filters.search !== '' ||
    filters.procedimientos.length > 0 ||
    filters.eps.length > 0 ||
    filters.asistencia !== 'ALL' ||
    filters.sexo !== 'ALL' ||
    filters.gruposEtarios.length > 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3.5 mb-6 shadow-xs">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por paciente, cédula, teléfono, barrio..."
            value={filters.search}
            onChange={(e) => onUpdateFilters({ search: e.target.value })}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#d21d1f] focus:bg-white transition-all font-medium"
          />
          {filters.search && (
            <button
              onClick={() => onUpdateFilters({ search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Procedure */}
          <select
            value={filters.procedimientos[0] || ''}
            onChange={(e) => onUpdateFilters({ procedimientos: e.target.value ? [e.target.value] : [] })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Todos los Procedimientos</option>
            {availableProcedures.map((proc) => (
              <option key={proc} value={proc}>
                {proc}
              </option>
            ))}
          </select>

          {/* EPS */}
          <select
            value={filters.eps[0] || ''}
            onChange={(e) => onUpdateFilters({ eps: e.target.value ? [e.target.value] : [] })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">Todas las EPS / Aseguradores</option>
            {availableEps.map((eps) => (
              <option key={eps} value={eps}>
                {eps}
              </option>
            ))}
          </select>

          {/* Attendance */}
          <select
            value={filters.asistencia}
            onChange={(e) => onUpdateFilters({ asistencia: e.target.value as FilterState['asistencia'] })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">Asistencia: Todas</option>
            <option value="SI">Asistió (Efectiva)</option>
            <option value="NO">Inasistencia (No-Show)</option>
          </select>

          {/* Sex */}
          <select
            value={filters.sexo}
            onChange={(e) => onUpdateFilters({ sexo: e.target.value as FilterState['sexo'] })}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">Sexo: Todos</option>
            <option value="F">Femenino (F)</option>
            <option value="M">Masculino (M)</option>
          </select>

          {/* Clear button */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="px-2.5 py-1.5 text-xs text-[#d21d1f] hover:text-white bg-[#fff1f2] hover:bg-[#d21d1f] border border-red-200 rounded-lg transition-colors flex items-center gap-1 font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Counter bar */}
      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#162b6f]" />
          <span>
            Mostrando <strong className="font-bold text-[#162b6f] tabular-nums">{filteredCount}</strong> de{' '}
            <span className="tabular-nums">{totalRecords}</span> citas médicas
          </span>
          {isFiltered && (
            <span className="text-[#d21d1f] bg-[#fff1f2] border border-red-200 px-2 py-0.5 rounded text-[11px] font-bold">
              Filtros activos
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-500 hidden sm:block font-medium">
          Dr. SALCEDO VALLE OSCAR JAVIER · CCICOL S.A.S
        </div>
      </div>
    </div>
  );
};
