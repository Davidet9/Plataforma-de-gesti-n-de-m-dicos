import React, { useState } from 'react';
import { Appointment } from '../types/clinical';
import { Activity, UserCheck, Clock, Users, Building2, AlertTriangle, CheckCircle2, Calendar, TrendingUp, HelpCircle } from 'lucide-react';
import { calculateAverageOportunidad } from '../utils/normalizer';

interface ExecutiveSummaryProps {
  citas: Appointment[];
  nombreMes: string;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ citas, nombreMes }) => {
  const [selectedDayDetail, setSelectedDayDetail] = useState<string | null>(null);

  const totalCitas = citas.length;
  const asistidas = citas.filter((c) => c.ASISTIO === 'SI').length;
  const inasistencias = citas.filter((c) => c.ASISTIO === 'NO').length;
  const tasaAsistencia = totalCitas > 0 ? ((asistidas / totalCitas) * 100).toFixed(1) : '0';
  const tasaInasistencia = totalCitas > 0 ? ((inasistencias / totalCitas) * 100).toFixed(1) : '0';

  // Average wait days (oportunidad de cita)
  // Regla CCICOL: Demora = Fecha Atención (FECHA CITA: WWWWYYXX) - Fecha Agendamiento (OBSERVACIONES: .../XX/YY/WW)
  // Promedio de todas las citas de la base de datos
  const opStats = calculateAverageOportunidad(citas);
  const oportunidadPromedio = opStats.promedioDiasStr;
  const sumaDias = opStats.sumaDias;

  // Distribución de oportunidad por rangos de días
  const opRanges = {
    inmediata: citas.filter((c) => c.oportunidadDias <= 3).length,
    rapida: citas.filter((c) => c.oportunidadDias >= 4 && c.oportunidadDias <= 7).length,
    moderada: citas.filter((c) => c.oportunidadDias >= 8 && c.oportunidadDias <= 14).length,
    prolongada: citas.filter((c) => c.oportunidadDias >= 15).length,
  };

  // Unique patients
  const pacientesUnicosSet = new Set(citas.map((c) => c.IDENTIFICACION_PACIENTE));
  const pacientesUnicos = pacientesUnicosSet.size;
  const procedimientosPorPaciente = pacientesUnicos > 0 ? (totalCitas / pacientesUnicos).toFixed(2) : '1.0';

  // Procedures breakdown with wait time
  const procCounts: Record<string, { total: number; asistidas: number; inasistencias: number; sumaEspera: number }> = {};
  citas.forEach((c) => {
    const key = c.tipoProcedimientoCorto;
    if (!procCounts[key]) procCounts[key] = { total: 0, asistidas: 0, inasistencias: 0, sumaEspera: 0 };
    procCounts[key].total += 1;
    procCounts[key].sumaEspera += (c.oportunidadDias || 0);
    if (c.ASISTIO === 'SI') procCounts[key].asistidas += 1;
    else procCounts[key].inasistencias += 1;
  });

  const procArray = Object.entries(procCounts)
    .map(([proc, d]) => ({
      proc,
      total: d.total,
      pct: ((d.total / (totalCitas || 1)) * 100).toFixed(1),
      tasaAsistencia: ((d.asistidas / d.total) * 100).toFixed(1),
      demoraPromedio: ((d.sumaEspera / (d.total || 1))).toFixed(1),
      inasistencias: d.inasistencias,
    }))
    .sort((a, b) => b.total - a.total);

  // EPS breakdown - Basado estrictamente en repetición de la columna NOMBRE ENTIDAD FACT
  const epsCounts: Record<string, { total: number; asistidas: number; inasistencias: number; sumaEspera: number }> = {};
  citas.forEach((c) => {
    // Tomar las estadísticas por repetición de la EPS en la columna NOMBRE ENTIDAD FACT
    const rawKey = (c.NOMBRE_ENTIDAD_FACT || c.NOMBRE_ENTIDAD || c.epsNormalizada || 'PARTICULAR').trim();
    const key = rawKey.replace(/\s+/g, ' ').toUpperCase();
    if (!epsCounts[key]) {
      epsCounts[key] = { total: 0, asistidas: 0, inasistencias: 0, sumaEspera: 0 };
    }
    epsCounts[key].total += 1;
    epsCounts[key].sumaEspera += (c.oportunidadDias || 0);
    if (c.ASISTIO === 'SI') {
      epsCounts[key].asistidas += 1;
    } else {
      epsCounts[key].inasistencias += 1;
    }
  });

  const epsArray = Object.entries(epsCounts)
    .map(([eps, d]) => ({
      eps,
      count: d.total,
      asistidas: d.asistidas,
      inasistencias: d.inasistencias,
      tasaAsistencia: d.total > 0 ? ((d.asistidas / d.total) * 100).toFixed(1) : '0',
      pct: ((d.total / (totalCitas || 1)) * 100).toFixed(1),
      demoraPromedio: d.total > 0 ? (d.sumaEspera / d.total).toFixed(1) : '0',
    }))
    .sort((a, b) => b.count - a.count);

  // Age groups
  const ageGroups: Record<string, { M: number; F: number; total: number }> = {
    'Pediatría (< 18)': { M: 0, F: 0, total: 0 },
    'Adulto Joven (18-39)': { M: 0, F: 0, total: 0 },
    'Adulto Maduro (40-59)': { M: 0, F: 0, total: 0 },
    'Adulto Mayor (60-74)': { M: 0, F: 0, total: 0 },
    'Tercera Edad Avanzada (75+)': { M: 0, F: 0, total: 0 },
  };
  citas.forEach((c) => {
    if (ageGroups[c.grupoEtario]) {
      ageGroups[c.grupoEtario].total += 1;
      if (c.SEXO_PACIENTE === 'M') ageGroups[c.grupoEtario].M += 1;
      else ageGroups[c.grupoEtario].F += 1;
    }
  });

  // Weekdays - Detailed breakdown and robust normalization matching PDF DIA SEM column
  const weekdaysConfig = [
    { key: 'Lunes', label: 'Lunes', short: 'Lun' },
    { key: 'Martes', label: 'Martes', short: 'Mar' },
    { key: 'Miércoles', label: 'Miércoles', short: 'Mié' },
    { key: 'Jueves', label: 'Jueves', short: 'Jue' },
    { key: 'Viernes', label: 'Viernes', short: 'Vie' },
    { key: 'Sábado', label: 'Sábado', short: 'Sáb' },
  ];

  interface DayStat {
    total: number;
    asistidas: number;
    inasistencias: number;
    procedures: Record<string, number>;
  }

  const dayStats: Record<string, DayStat> = {
    Lunes: { total: 0, asistidas: 0, inasistencias: 0, procedures: {} },
    Martes: { total: 0, asistidas: 0, inasistencias: 0, procedures: {} },
    Miércoles: { total: 0, asistidas: 0, inasistencias: 0, procedures: {} },
    Jueves: { total: 0, asistidas: 0, inasistencias: 0, procedures: {} },
    Viernes: { total: 0, asistidas: 0, inasistencias: 0, procedures: {} },
    Sábado: { total: 0, asistidas: 0, inasistencias: 0, procedures: {} },
  };

  citas.forEach((c) => {
    const rawDay = (c.DIA_SEM || '').toLowerCase();
    let canonical = 'Lunes';
    if (rawDay.includes('lun')) canonical = 'Lunes';
    else if (rawDay.includes('mar')) canonical = 'Martes';
    else if (rawDay.includes('mi')) canonical = 'Miércoles';
    else if (rawDay.includes('jue')) canonical = 'Jueves';
    else if (rawDay.includes('vie')) canonical = 'Viernes';
    else if (rawDay.includes('s')) canonical = 'Sábado';

    if (dayStats[canonical]) {
      dayStats[canonical].total += 1;
      if (c.ASISTIO === 'SI') dayStats[canonical].asistidas += 1;
      else dayStats[canonical].inasistencias += 1;

      const proc = c.tipoProcedimientoCorto;
      dayStats[canonical].procedures[proc] = (dayStats[canonical].procedures[proc] || 0) + 1;
    }
  });

  const maxDayCount = Math.max(...Object.values(dayStats).map((d) => d.total), 1);
  const weekdayAvg = Math.round(
    ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].reduce((sum, d) => sum + dayStats[d].total, 0) / 5
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#d21d1f]" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Citas Programadas</span>
            <div className="w-7 h-7 rounded-lg bg-[#fff1f2] flex items-center justify-center text-[#d21d1f]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#162b6f] tabular-nums">{totalCitas}</div>
          <div className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
            <span className="font-semibold text-emerald-700">{asistidas} asistidas</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{procArray.length} modalidades</span>
          </div>
        </div>

        {/* Card 2: Attendance Rate */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#162b6f]" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Tasa de Asistencia</span>
            <div className="w-7 h-7 rounded-lg bg-[#f0f4fc] flex items-center justify-center text-[#162b6f]">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#162b6f] tabular-nums">{tasaAsistencia}%</div>
          <div className="text-xs mt-1 flex items-center gap-1.5">
            <span className="text-[#d21d1f] font-semibold bg-[#fff1f2] px-1.5 py-0.5 rounded">
              {tasaInasistencia}% inasist. ({inasistencias})
            </span>
          </div>
        </div>

        {/* Card 3: Oportunidad */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#d21d1f]" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Oportunidad Cita</span>
            <div className="w-7 h-7 rounded-lg bg-[#fff1f2] flex items-center justify-center text-[#d21d1f]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#162b6f] tabular-nums">
            {oportunidadPromedio} <span className="text-base font-normal text-slate-500">días</span>
          </div>
          <div className="text-xs text-slate-600 mt-1 flex flex-col gap-0.5">
            <div className="flex items-center justify-between">
              <span>Promedio general ({totalCitas} citas)</span>
              <span className="font-mono text-[10px] text-[#162b6f] font-bold bg-[#f0f4fc] px-1.5 py-0.5 rounded border border-blue-200" title="Demora = FECHA CITA (WWWWYYXX) - OBSERVACIONES (.../XX/YY/WW)">
                Σ {sumaDias} d / {totalCitas}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              FECHA CITA (WWWWYYXX) vs OBSERVACIONES (XX/YY/WW)
            </div>
          </div>
        </div>

        {/* Card 4: Patients */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#162b6f]" />
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Pacientes Únicos</span>
            <div className="w-7 h-7 rounded-lg bg-[#f0f4fc] flex items-center justify-center text-[#162b6f]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#162b6f] tabular-nums">{pacientesUnicos}</div>
          <div className="text-xs text-slate-600 mt-1">
            <span className="font-semibold text-slate-800">{procedimientosPorPaciente}</span> exámenes por paciente
          </div>
        </div>
      </div>

      {/* Strategic Management Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#fff1f2] border border-red-200 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#d21d1f] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800">
            <strong className="font-semibold text-[#d21d1f] block mb-0.5">Control de Inasistencia en Estudios Especiales</strong>
            La <em>Mesa Basculante</em> y el <em>Eco Stress</em> concentran cancelaciones o ausencias (24% - 30%). Se recomienda confirmación telefónica 48h antes con indicación de ayuno estricto.
          </div>
        </div>

        <div className="bg-[#f0f4fc] border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-[#162b6f] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-800">
            <strong className="font-semibold text-[#162b6f] block mb-0.5">Distribución Semanal Homogénea</strong>
            El volumen de citas en <strong>CCICOL</strong> muestra una programación continua y bien balanceada de lunes a viernes (~{weekdayAvg} citas/día) con soporte activo los sábados.
          </div>
        </div>
      </div>

      {/* Primary Section: Weekly Volume Chart (DIA SEM PDF analysis) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#162b6f]">Volumen Semanal de Citas</h3>
              <span className="bg-[#fff1f2] text-[#d21d1f] text-[11px] font-semibold px-2 py-0.5 rounded-full border border-red-200">
                Columna DIA SEM del PDF
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Distribución de la carga asistencial del Dr. Oscar Javier Salcedo Valle a lo largo de los días de la semana
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded bg-[#d21d1f] inline-block" />
              <span>Citas Programadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block" />
              <span>Asistencia Real</span>
            </div>
          </div>
        </div>

        {/* Weekly Bars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {weekdaysConfig.map((day) => {
            const data = dayStats[day.key] || { total: 0, asistidas: 0, inasistencias: 0, procedures: {} };
            const heightPct = Math.max(12, Math.round((data.total / maxDayCount) * 100));
            const sharePct = totalCitas > 0 ? ((data.total / totalCitas) * 100).toFixed(1) : '0';
            const rate = data.total > 0 ? Math.round((data.asistidas / data.total) * 100) : 0;
            const isSelected = selectedDayDetail === day.key;

            return (
              <div
                key={day.key}
                onClick={() => setSelectedDayDetail(isSelected ? null : day.key)}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#d21d1f] bg-[#fff1f2] shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                }`}
              >
                {/* Day Header */}
                <div className="text-center mb-2">
                  <span className="text-xs font-bold text-[#162b6f] block uppercase tracking-wide">
                    {day.label}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {sharePct}% del mes
                  </span>
                </div>

                {/* Bar Graph Visual */}
                <div className="w-full h-36 bg-slate-100 rounded-lg p-1.5 flex flex-col justify-end items-center relative overflow-hidden">
                  {/* Background grid line for reference */}
                  <div className="absolute inset-x-0 top-1/4 border-b border-dashed border-slate-200 pointer-events-none" />
                  <div className="absolute inset-x-0 top-1/2 border-b border-dashed border-slate-200 pointer-events-none" />
                  <div className="absolute inset-x-0 top-3/4 border-b border-dashed border-slate-200 pointer-events-none" />

                  {/* Main bar (Red #d21d1f) */}
                  <div
                    className="w-full max-w-[48px] rounded-md transition-all duration-500 flex flex-col justify-between p-1 shadow-xs"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: '#d21d1f',
                    }}
                  >
                    <span className="text-[10px] font-bold text-white text-center drop-shadow-xs font-mono">
                      {data.total}
                    </span>
                    {/* Inner Attendance indicator */}
                    <div
                      className="w-full bg-white/25 rounded-xs h-1 mt-auto"
                      title={`Tasa asistencia: ${rate}%`}
                    />
                  </div>
                </div>

                {/* Day Metrics Bottom */}
                <div className="w-full mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Asist:</span>
                  <span className="font-semibold text-emerald-700 font-mono">{rate}%</span>
                </div>
                <div className="w-full flex items-center justify-between text-[11px] text-slate-500">
                  <span>Citas:</span>
                  <span className="font-mono font-bold text-[#162b6f]">{data.total}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Day Inspector / Modal View */}
        {selectedDayDetail && dayStats[selectedDayDetail] && (
          <div className="mt-4 p-4 rounded-xl bg-[#f0f4fc] border border-blue-200 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#162b6f]" />
                <h4 className="text-xs font-bold text-[#162b6f]">
                  Detalle de Procedimientos del día: <span className="uppercase text-[#d21d1f]">{selectedDayDetail}</span>
                </h4>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-2 py-0.5"
              >
                Cerrar ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {Object.entries(dayStats[selectedDayDetail].procedures).map(([procName, count]) => (
                <div key={procName} className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-medium truncate pr-2">{procName}</span>
                  <span className="font-mono font-bold text-[#162b6f] bg-[#f0f4fc] px-2 py-0.5 rounded">
                    {count} citas
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footnote explanation for DIA SEM distribution */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-[#d21d1f]" />
            <span>
              <strong>Análisis de Demanda:</strong> Los días lunes a viernes mantienen una actividad sostenida y equilibrada (~{weekdayAvg} citas/día), garantizando un aprovechamiento óptimo de la capacidad instalada.
            </span>
          </div>
          <span className="font-mono text-slate-400 text-[11px] shrink-0">
            Total {nombreMes}: {totalCitas} citas
          </span>
        </div>
      </div>

      {/* Row 2: Procedures Breakdown & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Procedure Distribution Bar Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#162b6f]">Distribución de Procedimientos Realizados</h3>
              <p className="text-xs text-slate-500">Demanda por tipo de estudio cardiovascular en {nombreMes}</p>
            </div>
            <span className="text-xs text-[#d21d1f] font-mono bg-[#fff1f2] px-2 py-0.5 rounded border border-red-200 font-semibold">
              CUPS
            </span>
          </div>

          <div className="space-y-3.5">
            {procArray.map((item) => (
              <div key={item.proc}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-800">{item.proc}</span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="font-mono tabular-nums text-[#162b6f] font-bold">{item.total} citas</span>
                    <span className="text-slate-400">({item.pct}%)</span>
                    <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded text-[11px] font-semibold border border-blue-100" title="Demora promedio de oportunidad">
                      ⏱ {item.demoraPromedio}d
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[11px] font-medium">
                      {item.tasaAsistencia}% asist.
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: '#d21d1f',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* EPS Market Share */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#162b6f]">Participación de Aseguradores</h3>
                  <span className="text-[10px] font-mono font-bold bg-[#fff1f2] text-[#d21d1f] px-1.5 py-0.5 rounded border border-red-200">
                    NOMBRE ENTIDAD FACT
                  </span>
                </div>
                <p className="text-xs text-slate-500">Repetición por asegurador en {nombreMes}</p>
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#f0f4fc] flex items-center justify-center text-[#162b6f]">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {epsArray.map((e, idx) => {
                const colors = ['#d21d1f', '#162b6f', '#c0181a', '#2c4391', '#8c0f11', '#546baf', '#e03a3c', '#0f1f50'];
                const color = colors[idx % colors.length];
                return (
                  <div key={e.eps} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between text-xs mb-1 gap-2">
                      <span className="text-slate-800 font-semibold truncate flex-1" title={e.eps}>
                        {e.eps}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-[#162b6f] font-bold tabular-nums">
                          {e.count} <span className="text-[11px] font-normal text-slate-500">({e.pct}%)</span>
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1 rounded border border-blue-100" title="Demora promedio de oportunidad">
                          ⏱ {e.demoraPromedio}d
                        </span>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1 rounded">
                          {e.tasaAsistencia}% asist.
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${e.pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Total aseguradores: <strong className="text-slate-700">{epsArray.length}</strong></span>
            <span className="font-mono text-slate-400 text-[10px]">Col: NOMBRE ENTIDAD FACT</span>
          </div>
        </div>
      </div>

      {/* Row 2.5: Oportunidad de Cita (Demora de Agendamiento a Consulta) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#162b6f]">Oportunidad de Cita y Demora de Agendamiento</h3>
              <span className="text-[10px] font-mono font-bold bg-[#f0f4fc] text-[#162b6f] px-1.5 py-0.5 rounded border border-blue-200">
                FECHA CITA vs OBSERVACIONES
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cálculo de demora individual y promedio de todas las citas de la base de datos ({nombreMes})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Promedio General</span>
              <span className="text-xl font-extrabold text-[#d21d1f] font-mono tabular-nums">{oportunidadPromedio} días</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#fff1f2] flex items-center justify-center text-[#d21d1f]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CCICOL Calculation Rule Explanatory Card */}
        <div className="mb-4 bg-[#f8fafc] border border-slate-200 rounded-lg p-3 text-xs text-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-[#162b6f] shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-semibold">1. Fecha de Atención (FECHA CITA)</strong>
              <span className="text-[11px] text-slate-500">Formato <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-[10px]">WWWWYYXX</code> (WWWW=2026, YY=Mes, XX=Día).</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-[#d21d1f] shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-semibold">2. Fecha de Agendamiento (OBSERVACIONES)</strong>
              <span className="text-[11px] text-slate-500">Números finales <code className="bg-slate-200 px-1 py-0.2 rounded font-mono text-[10px]">XX/YY/WW</code> (XX=Día, YY=Mes, WW=Año '26').</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-900 block font-semibold">3. Demora & Promedio Global</strong>
              <span className="text-[11px] text-slate-500">Demora = Atención − Agendamiento. Promedio: <strong className="text-slate-800">{sumaDias} días / {totalCitas} citas = {oportunidadPromedio} d</strong>.</span>
            </div>
          </div>
        </div>

        {/* 4 Range Breakdown Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#f0fdf4] border border-emerald-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-emerald-800 flex items-center justify-between mb-1">
              <span>Inmediata (0-3 días)</span>
              <span className="font-mono text-xs">{((opRanges.inmediata / (totalCitas || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono tabular-nums">
              {opRanges.inmediata} <span className="text-xs font-normal text-emerald-600">citas</span>
            </div>
            <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${(opRanges.inmediata / (totalCitas || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-[#f0f4fc] border border-blue-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-[#162b6f] flex items-center justify-between mb-1">
              <span>Rápida (4-7 días)</span>
              <span className="font-mono text-xs">{((opRanges.rapida / (totalCitas || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-black text-[#162b6f] font-mono tabular-nums">
              {opRanges.rapida} <span className="text-xs font-normal text-blue-600">citas</span>
            </div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#162b6f] h-full rounded-full"
                style={{ width: `${(opRanges.rapida / (totalCitas || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-[#fffbeb] border border-amber-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-amber-800 flex items-center justify-between mb-1">
              <span>Moderada (8-14 días)</span>
              <span className="font-mono text-xs">{((opRanges.moderada / (totalCitas || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-black text-amber-700 font-mono tabular-nums">
              {opRanges.moderada} <span className="text-xs font-normal text-amber-600">citas</span>
            </div>
            <div className="w-full bg-amber-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full"
                style={{ width: `${(opRanges.moderada / (totalCitas || 1)) * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-[#fff1f2] border border-red-200 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-rose-800 flex items-center justify-between mb-1">
              <span>Prolongada (15+ días)</span>
              <span className="font-mono text-xs">{((opRanges.prolongada / (totalCitas || 1)) * 100).toFixed(1)}%</span>
            </div>
            <div className="text-2xl font-black text-[#d21d1f] font-mono tabular-nums">
              {opRanges.prolongada} <span className="text-xs font-normal text-rose-600">citas</span>
            </div>
            <div className="w-full bg-red-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#d21d1f] h-full rounded-full"
                style={{ width: `${(opRanges.prolongada / (totalCitas || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Demographics & Age Groups */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#162b6f]">Perfil Demográfico por Grupos de Edad</h3>
            <p className="text-xs text-slate-500">Distribución etaria y proporción Femenino / Masculino</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#d21d1f] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d21d1f] inline-block" /> Femenino
            </span>
            <span className="flex items-center gap-1.5 text-[#162b6f] font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-[#162b6f] inline-block" /> Masculino
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {Object.entries(ageGroups).map(([group, data]) => {
            const pctF = data.total > 0 ? (data.F / data.total) * 100 : 0;
            const pctM = data.total > 0 ? (data.M / data.total) * 100 : 0;
            return (
              <div key={group} className="border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{group}</span>
                  <span className="font-mono text-slate-800 font-semibold tabular-nums">
                    {data.total} pac. <span className="text-[11px] font-normal text-slate-400">({data.F} F / {data.M} M)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="h-full"
                    style={{ width: `${pctF}%`, backgroundColor: '#d21d1f' }}
                    title={`Femenino: ${data.F}`}
                  />
                  <div
                    className="h-full"
                    style={{ width: `${pctM}%`, backgroundColor: '#162b6f' }}
                    title={`Masculino: ${data.M}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
