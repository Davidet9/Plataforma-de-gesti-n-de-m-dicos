import React, { useState, useMemo } from 'react';
import { Appointment, CrossVariableField, CrossMetric } from '../types/clinical';
import { Download, Sparkles, HelpCircle } from 'lucide-react';

interface CrossVariableMatrixProps {
  citas: Appointment[];
}

interface VariableOption {
  field: CrossVariableField;
  label: string;
}

const VARIABLE_OPTIONS: VariableOption[] = [
  { field: 'tipoProcedimientoCorto', label: 'Tipo de Procedimiento (CUPS)' },
  { field: 'epsNormalizada', label: 'Asegurador / EPS (NOMBRE ENTIDAD FACT)' },
  { field: 'regimen', label: 'Régimen de Afiliación' },
  { field: 'grupoEtario', label: 'Grupo Etario' },
  { field: 'SEXO_PACIENTE', label: 'Sexo del Paciente' },
  { field: 'DIA_SEM', label: 'Día de la Semana (DIA SEM)' },
  { field: 'ASISTIO', label: 'Estado de Asistencia' },
  { field: 'municipio', label: 'Municipio de Procedencia' },
  { field: 'horarioFranja', label: 'Franja Horaria' },
];

const METRIC_OPTIONS: { id: CrossMetric; label: string; unit: string }[] = [
  { id: 'count', label: 'Número de Citas (Conteo)', unit: '' },
  { id: 'percent', label: '% del Total de Citas', unit: '%' },
  { id: 'attendanceRate', label: 'Tasa de Asistencia (%)', unit: '%' },
  { id: 'noShowRate', label: 'Tasa de Inasistencia (No-Show %)', unit: '%' },
  { id: 'avgAge', label: 'Edad Promedio', unit: ' años' },
  { id: 'avgWaitDays', label: 'Oportunidad Promedio (Días de Espera)', unit: ' días' },
];

export const CrossVariableMatrix: React.FC<CrossVariableMatrixProps> = ({ citas }) => {
  const [rowVar, setRowVar] = useState<CrossVariableField>('tipoProcedimientoCorto');
  const [colVar, setColVar] = useState<CrossVariableField>('epsNormalizada');
  const [metric, setMetric] = useState<CrossMetric>('count');

  // Knowledge Management Presets
  const applyPreset = (preset: 'eps_proc' | 'noshow_day' | 'age_proc' | 'wait_regimen' | 'muni_eps' | 'weekday_proc') => {
    if (preset === 'eps_proc') {
      setRowVar('tipoProcedimientoCorto');
      setColVar('epsNormalizada');
      setMetric('count');
    } else if (preset === 'noshow_day') {
      setRowVar('DIA_SEM');
      setColVar('epsNormalizada');
      setMetric('noShowRate');
    } else if (preset === 'weekday_proc') {
      setRowVar('DIA_SEM');
      setColVar('tipoProcedimientoCorto');
      setMetric('count');
    } else if (preset === 'age_proc') {
      setRowVar('grupoEtario');
      setColVar('tipoProcedimientoCorto');
      setMetric('count');
    } else if (preset === 'wait_regimen') {
      setRowVar('tipoProcedimientoCorto');
      setColVar('regimen');
      setMetric('avgWaitDays');
    } else if (preset === 'muni_eps') {
      setRowVar('municipio');
      setColVar('epsNormalizada');
      setMetric('count');
    }
  };

  // Matrix calculation
  const matrixData = useMemo(() => {
    const rowValuesSet = new Set<string>();
    const colValuesSet = new Set<string>();

    citas.forEach((c) => {
      const r = String(c[rowVar] || 'No definido');
      const col = String(c[colVar] || 'No definido');
      rowValuesSet.add(r);
      colValuesSet.add(col);
    });

    const rows = Array.from(rowValuesSet).sort();
    const cols = Array.from(colValuesSet).sort();

    interface CellData {
      value: number;
      sampleCount: number;
      formatted: string;
    }

    const values: Record<string, CellData> = {};
    let minVal = Infinity;
    let maxVal = -Infinity;

    rows.forEach((r) => {
      cols.forEach((c) => {
        const matches = citas.filter(
          (item) => String(item[rowVar] || 'No definido') === r && String(item[colVar] || 'No definido') === c
        );
        const count = matches.length;

        let computed = 0;
        let formatted = '0';

        if (count > 0) {
          if (metric === 'count') {
            computed = count;
            formatted = `${count}`;
          } else if (metric === 'percent') {
            computed = citas.length > 0 ? (count / citas.length) * 100 : 0;
            formatted = `${computed.toFixed(1)}%`;
          } else if (metric === 'attendanceRate') {
            const asistidas = matches.filter((m) => m.ASISTIO === 'SI').length;
            computed = (asistidas / count) * 100;
            formatted = `${computed.toFixed(1)}%`;
          } else if (metric === 'noShowRate') {
            const noShow = matches.filter((m) => m.ASISTIO === 'NO').length;
            computed = (noShow / count) * 100;
            formatted = `${computed.toFixed(1)}%`;
          } else if (metric === 'avgAge') {
            const sumAge = matches.reduce((acc, m) => acc + m.edadNum, 0);
            computed = sumAge / count;
            formatted = `${computed.toFixed(1)}a`;
          } else if (metric === 'avgWaitDays') {
            const sumWait = matches.reduce((acc, m) => acc + m.oportunidadDias, 0);
            computed = sumWait / count;
            formatted = `${computed.toFixed(1)}d`;
          }

          if (computed < minVal) minVal = computed;
          if (computed > maxVal) maxVal = computed;
        }

        values[`${r}:::${c}`] = {
          value: computed,
          sampleCount: count,
          formatted: count > 0 ? formatted : '-',
        };
      });
    });

    if (minVal === Infinity) minVal = 0;
    if (maxVal === -Infinity) maxVal = 1;

    return { rows, cols, values, minVal, maxVal, totalCitas: citas.length };
  }, [citas, rowVar, colVar, metric]);

  // Export current cross-matrix to CSV
  const handleExportMatrixCsv = () => {
    const header = [VARIABLE_OPTIONS.find((v) => v.field === rowVar)?.label || 'Fila', ...matrixData.cols];
    const lines = [header.join(',')];

    matrixData.rows.forEach((r) => {
      const line = [
        `"${r}"`,
        ...matrixData.cols.map((c) => {
          const val = matrixData.values[`${r}:::${c}`]?.formatted || '0';
          return `"${val}"`;
        }),
      ];
      lines.push(line.join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CCICOL_Cruce_${rowVar}_vs_${colVar}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper for background heat color using CCICOL Red #d21d1f & Navy #162b6f
  const getCellBgStyle = (val: number, count: number): React.CSSProperties => {
    if (count === 0) return { backgroundColor: '#f8fafc', color: '#94a3b8' };
    if (matrixData.maxVal === matrixData.minVal) return { backgroundColor: '#fff1f2', color: '#8c0f11' };

    const ratio = Math.max(0, Math.min(1, (val - matrixData.minVal) / (matrixData.maxVal - matrixData.minVal || 1)));

    if (metric === 'noShowRate') {
      // Inasistencia: Strong red alert
      if (ratio > 0.6) return { backgroundColor: '#d21d1f', color: '#ffffff', fontWeight: 'bold' };
      if (ratio > 0.3) return { backgroundColor: '#fca5a5', color: '#7f1d1d', fontWeight: '600' };
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    }

    // Default: Brand Red gradient (#d21d1f)
    if (ratio > 0.75) return { backgroundColor: '#d21d1f', color: '#ffffff', fontWeight: 'bold' };
    if (ratio > 0.5) return { backgroundColor: '#e84547', color: '#ffffff', fontWeight: '600' };
    if (ratio > 0.25) return { backgroundColor: '#fecdd3', color: '#881337', fontWeight: '600' };
    if (ratio > 0.1) return { backgroundColor: '#ffe4e6', color: '#9f1239' };
    return { backgroundColor: '#fff1f2', color: '#475569' };
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#162b6f]">Matriz de Cruce Multivariable e Inteligencia Clínica</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f0f4fc] text-[#162b6f] border border-blue-200">
                Pivote Dinámico
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cruza cualquier par de variables clínicas, temporales o territoriales para descubrir correlaciones y optimizar la toma de decisiones en CCICOL.
            </p>
          </div>
          <button
            onClick={handleExportMatrixCsv}
            className="px-3 py-1.5 text-xs font-semibold text-[#162b6f] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar Matriz CSV</span>
          </button>
        </div>

        {/* Knowledge Presets */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#d21d1f]" />
            <span>Preguntas Clave de Gestión (Atajos Rápidos):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyPreset('eps_proc')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-[#fff1f2] hover:text-[#d21d1f] text-slate-700 font-semibold border border-slate-200 transition-colors"
            >
              1. ¿Qué EPS solicita cada examen?
            </button>
            <button
              onClick={() => applyPreset('weekday_proc')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-[#fff1f2] hover:text-[#d21d1f] text-slate-700 font-semibold border border-slate-200 transition-colors"
            >
              2. ¿Cómo se distribuyen los exámenes por día (DIA SEM)?
            </button>
            <button
              onClick={() => applyPreset('noshow_day')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-[#fff1f2] hover:text-[#d21d1f] text-slate-700 font-semibold border border-slate-200 transition-colors"
            >
              3. ¿Qué días y EPS presentan más inasistencia?
            </button>
            <button
              onClick={() => applyPreset('age_proc')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-[#fff1f2] hover:text-[#d21d1f] text-slate-700 font-semibold border border-slate-200 transition-colors"
            >
              4. ¿Cuál es el perfil de edad según procedimiento?
            </button>
            <button
              onClick={() => applyPreset('wait_regimen')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-[#fff1f2] hover:text-[#d21d1f] text-slate-700 font-semibold border border-slate-200 transition-colors"
            >
              5. Oportunidad (Días espera) vs Régimen
            </button>
            <button
              onClick={() => applyPreset('muni_eps')}
              className="text-xs px-2.5 py-1 rounded-md bg-slate-50 hover:bg-[#fff1f2] hover:text-[#d21d1f] text-slate-700 font-semibold border border-slate-200 transition-colors"
            >
              6. Origen Territorial vs EPS
            </button>
          </div>
        </div>

        {/* Dynamic Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Row Var */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Variable en Eje Y (Filas):
            </label>
            <select
              value={rowVar}
              onChange={(e) => setRowVar(e.target.value as CrossVariableField)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-semibold focus:ring-1 focus:ring-[#d21d1f] focus:outline-none"
            >
              {VARIABLE_OPTIONS.map((opt) => (
                <option key={opt.field} value={opt.field}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Col Var */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Variable en Eje X (Columnas):
            </label>
            <select
              value={colVar}
              onChange={(e) => setColVar(e.target.value as CrossVariableField)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-semibold focus:ring-1 focus:ring-[#d21d1f] focus:outline-none"
            >
              {VARIABLE_OPTIONS.map((opt) => (
                <option key={opt.field} value={opt.field}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metric */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Métrica de Análisis:
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as CrossMetric)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-900 font-semibold focus:ring-1 focus:ring-[#d21d1f] focus:outline-none"
            >
              {METRIC_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Heatmap & Pivot Table Viewport */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 bg-[#f0f4fc] border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-700">
            <span className="font-extrabold text-[#162b6f]">
              {VARIABLE_OPTIONS.find((v) => v.field === rowVar)?.label}
            </span>
            <span className="text-[#d21d1f] font-bold">×</span>
            <span className="font-extrabold text-[#162b6f]">
              {VARIABLE_OPTIONS.find((v) => v.field === colVar)?.label}
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Métrica: <strong className="text-[#d21d1f] font-bold">{METRIC_OPTIONS.find((m) => m.id === metric)?.label}</strong></span>
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#162b6f]" />
            <span>Intensidad en rojo indica mayor magnitud</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th className="p-3 font-bold sticky left-0 bg-slate-100 border-r border-slate-200 z-10 min-w-[200px] text-[#162b6f]">
                  {VARIABLE_OPTIONS.find((v) => v.field === rowVar)?.label}
                </th>
                {matrixData.cols.map((c) => (
                  <th key={c} className="p-3 font-bold text-slate-800 text-center min-w-[130px] border-r border-slate-200 last:border-r-0">
                    <span className="truncate block max-w-[140px]" title={c}>{c}</span>
                  </th>
                ))}
                <th className="p-3 font-extrabold text-[#162b6f] text-center bg-slate-200/70 min-w-[90px]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {matrixData.rows.map((rowName) => {
                let rowCount = 0;
                matrixData.cols.forEach((colName) => {
                  const cell = matrixData.values[`${rowName}:::${colName}`];
                  if (cell) {
                    rowCount += cell.sampleCount;
                  }
                });

                return (
                  <tr key={rowName} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-sans font-semibold text-slate-900 sticky left-0 bg-white border-r border-slate-200 z-10 whitespace-nowrap">
                      {rowName}
                    </td>
                    {matrixData.cols.map((colName) => {
                      const cell = matrixData.values[`${rowName}:::${colName}`];
                      const val = cell?.value || 0;
                      const count = cell?.sampleCount || 0;
                      const formatted = cell?.formatted || '-';
                      const cellStyle = getCellBgStyle(val, count);

                      return (
                        <td
                          key={colName}
                          style={cellStyle}
                          className="p-3 text-center border-r border-slate-200/60 last:border-r-0 transition-all cursor-default"
                          title={`${rowName} × ${colName}: ${formatted} (${count} citas)`}
                        >
                          <span className="text-xs">{formatted}</span>
                          {metric !== 'count' && count > 0 && (
                            <span className="block text-[10px] opacity-80 font-normal">
                              n={count}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-bold text-[#162b6f] bg-slate-100/60">
                      {metric === 'count'
                        ? rowCount
                        : metric === 'percent'
                        ? `${((rowCount / (matrixData.totalCitas || 1)) * 100).toFixed(1)}%`
                        : `${rowCount} citas`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
