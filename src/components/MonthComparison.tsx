import React, { useState } from 'react';
import { MonthlyDataset, Appointment } from '../types/clinical';
import { TrendingUp, TrendingDown, ArrowRight, GitCompare, Calendar } from 'lucide-react';

interface MonthComparisonProps {
  datasets: Record<string, MonthlyDataset>;
  defaultMonthA: string;
}

export const MonthComparison: React.FC<MonthComparisonProps> = ({ datasets, defaultMonthA }) => {
  const monthKeys = Object.keys(datasets).sort();
  const [monthAId, setMonthAId] = useState<string>(defaultMonthA);
  const [monthBId, setMonthBId] = useState<string>(monthKeys[0] !== defaultMonthA ? monthKeys[0] : (monthKeys[1] || defaultMonthA));

  const dataA = datasets[monthAId];
  const dataB = datasets[monthBId];

  if (!dataA || !dataB) {
    return <div className="p-8 text-center text-slate-500">Se requieren al menos dos meses para realizar comparativas.</div>;
  }

  // Calculate metrics for Month A
  const totalA = dataA.citas.length;
  const asistA = dataA.citas.filter((c) => c.ASISTIO === 'SI').length;
  const inasistA = totalA - asistA;
  const tasaAsistA = totalA > 0 ? (asistA / totalA) * 100 : 0;
  const tasaInasistA = totalA > 0 ? (inasistA / totalA) * 100 : 0;
  const avgWaitA = totalA > 0 ? dataA.citas.reduce((acc, c) => acc + c.oportunidadDias, 0) / totalA : 0;
  const uniquePatientsA = new Set(dataA.citas.map((c) => c.IDENTIFICACION_PACIENTE)).size;

  // Calculate metrics for Month B
  const totalB = dataB.citas.length;
  const asistB = dataB.citas.filter((c) => c.ASISTIO === 'SI').length;
  const inasistB = totalB - asistB;
  const tasaAsistB = totalB > 0 ? (asistB / totalB) * 100 : 0;
  const tasaInasistB = totalB > 0 ? (inasistB / totalB) * 100 : 0;
  const avgWaitB = totalB > 0 ? dataB.citas.reduce((acc, c) => acc + c.oportunidadDias, 0) / totalB : 0;
  const uniquePatientsB = new Set(dataB.citas.map((c) => c.IDENTIFICACION_PACIENTE)).size;

  // Deltas (A compared to B)
  const deltaTotal = totalB > 0 ? ((totalA - totalB) / totalB) * 100 : 0;
  const deltaTasaAsist = tasaAsistA - tasaAsistB;
  const deltaTasaInasist = tasaInasistA - tasaInasistB;
  const deltaWait = avgWaitA - avgWaitB;

  // Comparative Procedures
  const allProcs = Array.from(new Set([...dataA.citas.map((c) => c.tipoProcedimientoCorto), ...dataB.citas.map((c) => c.tipoProcedimientoCorto)]));
  const procComparison = allProcs.map((proc) => {
    const countA = dataA.citas.filter((c) => c.tipoProcedimientoCorto === proc).length;
    const countB = dataB.citas.filter((c) => c.tipoProcedimientoCorto === proc).length;
    const diff = countA - countB;
    const pctDiff = countB > 0 ? ((diff / countB) * 100).toFixed(0) : '+100';
    return { proc, countA, countB, diff, pctDiff };
  }).sort((a, b) => b.countA - a.countA);

  // Comparative EPS - Basado en repetición de la columna NOMBRE ENTIDAD FACT
  const getEpsKey = (c: Appointment) => (c.NOMBRE_ENTIDAD_FACT || c.epsNormalizada || 'PARTICULAR').trim().toUpperCase();
  const allEps = Array.from(new Set([...dataA.citas.map(getEpsKey), ...dataB.citas.map(getEpsKey)])).filter(Boolean);
  const epsComparison = allEps.map((eps) => {
    const countA = dataA.citas.filter((c) => getEpsKey(c) === eps).length;
    const countB = dataB.citas.filter((c) => getEpsKey(c) === eps).length;
    const diff = countA - countB;
    return { eps, countA, countB, diff };
  }).sort((a, b) => b.countA - a.countA);

  return (
    <div className="space-y-6">
      {/* Month Selectors Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitCompare className="w-5 h-5 text-[#d21d1f]" />
              <h2 className="text-base font-extrabold text-[#162b6f]">Análisis Comparativo Intermensual</h2>
            </div>
            <p className="text-xs text-slate-500">
              Compara la evolución asistencial, variación de demanda y tasas de no-show entre períodos de CCICOL.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#f0f4fc] p-2 rounded-xl border border-blue-200">
            {/* Base Month */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 font-bold">Mes Actual (A):</span>
              <select
                value={monthAId}
                onChange={(e) => setMonthAId(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[#162b6f] cursor-pointer"
              >
                {monthKeys.map((key) => (
                  <option key={key} value={key}>
                    {datasets[key]?.nombreMes || key}
                  </option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-4 h-4 text-[#d21d1f]" />

            {/* Compared Month */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-600 font-bold">Comparar con (B):</span>
              <select
                value={monthBId}
                onChange={(e) => setMonthBId(e.target.value)}
                className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[#162b6f] cursor-pointer"
              >
                {monthKeys.map((key) => (
                  <option key={key} value={key}>
                    {datasets[key]?.nombreMes || key}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Appointments */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#d21d1f]" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Volumen Total Citas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#162b6f] tabular-nums font-mono">{totalA}</span>
            <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${deltaTotal >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-[#fff1f2] text-[#d21d1f]'}`}>
              {deltaTotal >= 0 ? <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> : <TrendingDown className="w-3.5 h-3.5 mr-0.5" />}
              <span>{deltaTotal >= 0 ? '+' : ''}{deltaTotal.toFixed(1)}%</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>{dataA.nombreMes}: {totalA}</span>
            <span>vs {dataB.nombreMes}: {totalB}</span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#162b6f]" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Tasa de Asistencia
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-emerald-700 tabular-nums font-mono">{tasaAsistA.toFixed(1)}%</span>
            <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${deltaTasaAsist >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-[#fff1f2] text-[#d21d1f]'}`}>
              <span>{deltaTasaAsist >= 0 ? '+' : ''}{deltaTasaAsist.toFixed(1)} pts</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>{dataA.nombreMes}: {tasaAsistA.toFixed(0)}%</span>
            <span>vs {dataB.nombreMes}: {tasaAsistB.toFixed(0)}%</span>
          </div>
        </div>

        {/* No-show rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#d21d1f]" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Inasistencia (No-Show)
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#d21d1f] tabular-nums font-mono">{tasaInasistA.toFixed(1)}%</span>
            <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${deltaTasaInasist <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-[#fff1f2] text-[#d21d1f]'}`}>
              <span>{deltaTasaInasist >= 0 ? '+' : ''}{deltaTasaInasist.toFixed(1)} pts</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>{inasistA} citas no-show</span>
            <span>vs {inasistB} {dataB.nombreMes}</span>
          </div>
        </div>

        {/* Average wait time */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#162b6f]" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Oportunidad Promedio
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-[#162b6f] tabular-nums font-mono">{avgWaitA.toFixed(1)} <span className="text-sm font-normal text-slate-500">días</span></span>
            <div className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${deltaWait <= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              <span>{deltaWait <= 0 ? '' : '+'}{deltaWait.toFixed(1)}d</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-2 flex items-center justify-between">
            <span>{dataA.nombreMes}: {avgWaitA.toFixed(1)}d</span>
            <span>vs {dataB.nombreMes}: {avgWaitB.toFixed(1)}d</span>
          </div>
        </div>
      </div>

      {/* Procedure Comparison Table & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procedure variation */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#162b6f]">Variación por Procedimiento (CUPS)</h3>
              <p className="text-xs text-slate-500">Demanda comparada entre {dataA.nombreMes} y {dataB.nombreMes}</p>
            </div>
          </div>

          <div className="space-y-4">
            {procComparison.map((p) => {
              const maxVal = Math.max(p.countA, p.countB, 1);
              const pctA = (p.countA / maxVal) * 100;
              const pctB = (p.countB / maxVal) * 100;

              return (
                <div key={p.proc} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-800">{p.proc}</span>
                    <span className={`font-mono font-bold ${p.diff >= 0 ? 'text-emerald-700' : 'text-[#d21d1f]'}`}>
                      {p.diff >= 0 ? `+${p.diff}` : p.diff} ({p.pctDiff}%)
                    </span>
                  </div>

                  {/* Dual comparison bar */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono w-16 truncate">{dataA.nombreMes}</span>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pctA}%`, backgroundColor: '#d21d1f' }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-800 font-bold w-7 text-right">{p.countA}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono w-16 truncate">{dataB.nombreMes}</span>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pctB}%`, backgroundColor: '#162b6f' }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-600 font-medium w-7 text-right">{p.countB}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* EPS Comparison Table */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#162b6f]">Participación de Aseguradores</h3>
              <p className="text-xs text-slate-500">Fluctuación de pacientes remitidos por EPS</p>
            </div>
          </div>

          <div className="space-y-3">
            {epsComparison.map((e) => (
              <div key={e.eps} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white text-xs transition-colors">
                <div>
                  <span className="font-semibold text-slate-800 block">{e.eps}</span>
                  <span className="text-[11px] text-slate-400">
                    {dataA.nombreMes}: <strong className="text-[#162b6f]">{e.countA}</strong> vs {dataB.nombreMes}: <strong className="text-slate-600">{e.countB}</strong>
                  </span>
                </div>
                <div className={`font-mono font-bold text-right px-2 py-0.5 rounded ${
                  e.diff > 0 ? 'bg-emerald-50 text-emerald-700' : e.diff < 0 ? 'bg-[#fff1f2] text-[#d21d1f]' : 'text-slate-400'
                }`}>
                  {e.diff > 0 ? `+${e.diff}` : e.diff}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
