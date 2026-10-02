import { MonthlyDataset, Appointment } from '../types/clinical';
import { august2026Dataset } from './initialData';
import { calculateOportunidad } from '../utils/normalizer';

// Generates Julio 2026 and Septiembre 2026 datasets derived with realistic variations
function generateAdjacentMonth(baseDataset: MonthlyDataset, targetMonthId: string, monthName: string, factor: number): MonthlyDataset {
  const targetMonthNum = targetMonthId.split('-')[1]; // "07" or "09"
  const prevMonthNum = targetMonthId === '2026-07' ? '06' : '08';

  const citas: Appointment[] = baseDataset.citas.map((c, i) => {
    const rawFecha = c.FECHA_CITA.replace('202608', targetMonthId.replace('-', ''));
    
    // Vary attendance slightly
    const assistRoll = (i * 13 + factor * 7) % 100;
    const asistio: 'SI' | 'NO' = assistRoll > 18 ? 'SI' : 'NO';

    const factClean = (c.NOMBRE_ENTIDAD_FACT || c.NOMBRE_ENTIDAD || c.epsNormalizada || 'PARTICULAR').trim().toUpperCase();

    // Fecha de consulta en formato WWWWYYXX (Año expandido, Mes, Día)
    const citaYear = parseInt(rawFecha.substring(0, 4), 10);
    const citaMonth = parseInt(rawFecha.substring(4, 6), 10);
    const citaDay = parseInt(rawFecha.substring(6, 8), 10);

    // Calcular demora y fecha de agendamiento exacta para OBSERVACIONES: procedimiento/entidadfact/XX/YY/WW
    const targetWaitDays = Math.max(3, (c.oportunidadDias || 8) + ((i % 3) - 1));
    const dCitaMs = Date.UTC(citaYear, citaMonth - 1, citaDay);
    const dAgendMs = dCitaMs - targetWaitDays * 86400000;
    const agendDate = new Date(dAgendMs);

    const agDayStr = agendDate.getUTCDate().toString().padStart(2, '0');
    const agMonthStr = (agendDate.getUTCMonth() + 1).toString().padStart(2, '0');
    const agYearCompressed = (agendDate.getUTCFullYear() % 100).toString().padStart(2, '0'); // "26"

    const procTag = (c.DESCRIPCION_CUPS || c.tipoProcedimientoCorto || 'PROC').substring(0, 4).toUpperCase();
    const epsTag = factClean.substring(0, 7).toUpperCase();

    // Formato oficial CCICOL: procedimiento/entidadfact/XX/YY/WW
    const obs = `${procTag}/${epsTag}/${agDayStr}/${agMonthStr}/${agYearCompressed}`;

    const opInfo = calculateOportunidad(rawFecha, obs);

    return {
      ...c,
      id: `cita_${targetMonthId}_${i}_${c.IDENTIFICACION_PACIENTE}`,
      mes: targetMonthId,
      FECHA_CITA: rawFecha,
      FECHA_CREACION: opInfo.fechaAgendamientoIso,
      OBSERVACIONES: obs,
      oportunidadDias: opInfo.oportunidadDias,
      NOMBRE_ENTIDAD_FACT: factClean,
      epsNormalizada: factClean,
      ASISTIO: asistio,
      ESTADO_CITA: asistio === 'SI' ? (i % 5 === 0 ? 'ATENDIDA' : 'VIGENTE') : 'INASISTENCIA',
      COMPROBANTE: asistio === 'SI' ? `${parseInt(c.COMPROBANTE || '124000', 10) + (factor * 500)}` : ''
    };
  });

  return {
    mesId: targetMonthId,
    nombreMes: monthName,
    fechaInicio: `${targetMonthId}-01`,
    fechaFin: `${targetMonthId}-30`,
    profesional: baseDataset.profesional,
    empresa: baseDataset.empresa,
    citas,
    cargadoEn: `${targetMonthId}-28T18:00:00.000Z`,
    origen: 'predefinido',
    archivoNombre: `CCICOL_CITAS_${targetMonthId.replace('-', '_')}_SALCEDO.PDF`
  };
}

export const julio2026Dataset: MonthlyDataset = generateAdjacentMonth(august2026Dataset, '2026-07', 'Julio 2026', -1);
export const septiembre2026Dataset: MonthlyDataset = generateAdjacentMonth(august2026Dataset, '2026-09', 'Septiembre 2026', 1);

export const defaultDatasets: Record<string, MonthlyDataset> = {
  '2026-07': julio2026Dataset,
  '2026-08': august2026Dataset,
  '2026-09': septiembre2026Dataset,
};
