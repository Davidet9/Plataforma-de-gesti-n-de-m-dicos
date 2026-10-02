import { Appointment, RawAppointment } from '../types/clinical';

/**
 * Extrae la fecha de agendamiento de la columna OBSERVACIONES
 * Formato oficial CCICOL: procedimiento/entidadfact/XX/YY/WW
 * Donde:
 * XX = Día del mes (1-31)
 * YY = Mes del año (1-12)
 * WW = Año comprimido ("26" para "2026") o expandido ("2026")
 * Los números finales en OBSERVACIONES corresponden a XX/YY/WW
 * Ejemplos: "ECO/FAMI/22/07/26", "ECO/FAMI/22/07/26/NICOL", "MESA/CPTAL/22/07/26", "STREES/FAMI/FER/23/07/2026"
 */
export function extractAgendamientoDateFromObs(obsVal?: any): { day: number; month: number; year: number; dateStr: string; formatted: string } | null {
  if (!obsVal) return null;
  const str = String(obsVal).trim();
  if (!str) return null;

  // 1. Busca patrones XX/YY/WW o XX/YY/WWWW (separados por / - . o espacios)
  const regex = /(\d{1,2})\s*[\/\-\.]\s*(\d{1,2})\s*[\/\-\.]\s*(\d{2,4})/g;
  const matches = [...str.matchAll(regex)];

  // Los números finales corresponden a XX/YY/WW: buscar de atrás hacia adelante
  if (matches && matches.length > 0) {
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      let year = parseInt(match[3], 10);

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
        if (year < 100) {
          year = 2000 + year; // Ej: "26" -> 2026
        }
        if (year >= 2020 && year <= 2040) {
          const dStr = day.toString().padStart(2, '0');
          const mStr = month.toString().padStart(2, '0');
          const yStr = year.toString();
          return {
            day,
            month,
            year,
            dateStr: `${yStr}${mStr}${dStr}`, // "20260722"
            formatted: `${dStr}/${mStr}/${yStr}` // "22/07/2026"
          };
        }
      }
    }
  }

  // 2. Token-based fallback: división por / o -
  const tokens = str.split(/[\/\-]/).map((t) => t.trim()).filter(Boolean);
  for (let i = tokens.length - 1; i >= 2; i--) {
    const dVal = parseInt(tokens[i - 2], 10);
    const mVal = parseInt(tokens[i - 1], 10);
    let yVal = parseInt(tokens[i], 10);

    if (!isNaN(dVal) && !isNaN(mVal) && !isNaN(yVal) &&
        dVal >= 1 && dVal <= 31 && mVal >= 1 && mVal <= 12) {
      if (yVal < 100) {
        yVal = 2000 + yVal;
      }
      if (yVal >= 2020 && yVal <= 2040) {
        const dStr = dVal.toString().padStart(2, '0');
        const mStr = mVal.toString().padStart(2, '0');
        const yStr = yVal.toString();
        return {
          day: dVal,
          month: mVal,
          year: yVal,
          dateStr: `${yStr}${mStr}${dStr}`,
          formatted: `${dStr}/${mStr}/${yStr}`
        };
      }
    }
  }

  return null;
}

/**
 * Descompone la fecha de consulta/atención de la columna FECHA CITA: WWWWYYXX
 * WWWW = Año expandido ("2026")
 * YY = Mes del año (1-12)
 * XX = Día del mes (1-31)
 * También soporta Date objects, YYYY-MM-DD y DD/MM/YYYY
 */
export function parseFechaCita(fechaCitaVal?: any): { year: number; month: number; day: number; dateStr: string; formatted: string } | null {
  if (!fechaCitaVal) return null;

  if (fechaCitaVal instanceof Date) {
    const year = fechaCitaVal.getFullYear();
    const month = fechaCitaVal.getMonth() + 1;
    const day = fechaCitaVal.getDate();
    const dStr = day.toString().padStart(2, '0');
    const mStr = month.toString().padStart(2, '0');
    const yStr = year.toString();
    return {
      year,
      month,
      day,
      dateStr: `${yStr}${mStr}${dStr}`,
      formatted: `${dStr}/${mStr}/${yStr}`
    };
  }

  const str = String(fechaCitaVal).trim();
  const digits = str.replace(/\D/g, '');

  // 1. Formato WWWWYYXX (8 dígitos iniciando por 20)
  if (digits.length === 8 && (digits.startsWith('202') || digits.startsWith('201') || digits.startsWith('203'))) {
    const year = parseInt(digits.substring(0, 4), 10);
    const month = parseInt(digits.substring(4, 6), 10);
    const day = parseInt(digits.substring(6, 8), 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dStr = day.toString().padStart(2, '0');
      const mStr = month.toString().padStart(2, '0');
      const yStr = year.toString();
      return { year, month, day, dateStr: digits, formatted: `${dStr}/${mStr}/${yStr}` };
    }
  }

  // 2. Formato YYYY-MM-DD o YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dStr = day.toString().padStart(2, '0');
      const mStr = month.toString().padStart(2, '0');
      const yStr = year.toString();
      return { year, month, day, dateStr: `${yStr}${mStr}${dStr}`, formatted: `${dStr}/${mStr}/${yStr}` };
    }
  }

  // 3. Formato DD/MM/YYYY o DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const dStr = day.toString().padStart(2, '0');
      const mStr = month.toString().padStart(2, '0');
      const yStr = year.toString();
      return { year, month, day, dateStr: `${yStr}${mStr}${dStr}`, formatted: `${dStr}/${mStr}/${yStr}` };
    }
  }

  return null;
}

/**
 * Calcula la demora en la oportunidad de la cita en días:
 * Demora = Fecha de Atención (FECHA CITA: WWWWYYXX) - Fecha de Agendamiento (OBSERVACIONES: .../XX/YY/WW)
 */
export function calculateOportunidad(
  fechaCitaVal?: any,
  observacionesStr?: string,
  fallbackFechaCreacion?: string
): {
  oportunidadDias: number;
  hasAgendamientoDate: boolean;
  fechaAgendamientoIso: string;
  fechaAgendamientoDisplay: string;
  fechaAtencionDisplay: string;
} {
  const cita = parseFechaCita(fechaCitaVal);
  const agendObs = extractAgendamientoDateFromObs(observacionesStr);

  let agend = agendObs;
  if (!agend && fallbackFechaCreacion) {
    agend = extractAgendamientoDateFromObs(fallbackFechaCreacion) || parseFechaCita(fallbackFechaCreacion);
  }

  const atencionDisplay = cita ? cita.formatted : String(fechaCitaVal || '');

  if (cita && agend) {
    // Cálculo de días naturales entre Fecha de Atención y Fecha de Agendamiento
    const dCita = Date.UTC(cita.year, cita.month - 1, cita.day);
    const dAgend = Date.UTC(agend.year, agend.month - 1, agend.day);
    const diffMs = dCita - dAgend;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    return {
      oportunidadDias: Math.max(0, diffDays),
      hasAgendamientoDate: true,
      fechaAgendamientoIso: agend.dateStr,
      fechaAgendamientoDisplay: agend.formatted,
      fechaAtencionDisplay: atencionDisplay
    };
  }

  return {
    oportunidadDias: 0,
    hasAgendamientoDate: false,
    fechaAgendamientoIso: String(fechaCitaVal || ''),
    fechaAgendamientoDisplay: 'No especificada',
    fechaAtencionDisplay: atencionDisplay
  };
}

/**
 * Calcula la demora promedio en la oportunidad de cita para todas las citas de la base de datos
 * Demora = Fecha de Atención (FECHA CITA) - Fecha de Agendamiento (OBSERVACIONES)
 * Promedio = suma de demoras / total de citas de la base de datos
 */
export function calculateAverageOportunidad(citas: Appointment[]): {
  promedioDias: number;
  promedioDiasStr: string;
  totalCitas: number;
  citasConAgendamiento: number;
  sumaDias: number;
} {
  if (!citas || citas.length === 0) {
    return {
      promedioDias: 0,
      promedioDiasStr: '0.0',
      totalCitas: 0,
      citasConAgendamiento: 0,
      sumaDias: 0
    };
  }

  const sumaDias = citas.reduce((acc, c) => acc + (c.oportunidadDias || 0), 0);
  const totalCitas = citas.length;
  const promedio = sumaDias / totalCitas;

  return {
    promedioDias: Number(promedio.toFixed(1)),
    promedioDiasStr: promedio.toFixed(1),
    totalCitas,
    citasConAgendamiento: citas.filter((c) => (c as any).hasAgendamientoDate !== false).length,
    sumaDias
  };
}

export function normalizeRawAppointment(raw: RawAppointment, index: number, defaultMes = '2026-08'): Appointment {
  const edadNum = parseInt(raw.EDAD_PACIENTE?.replace(/\D/g, '') || '0', 10);

  let grupoEtario = 'Adulto Mayor (60-74)';
  if (edadNum < 18) grupoEtario = 'Pediatría (< 18)';
  else if (edadNum < 40) grupoEtario = 'Adulto Joven (18-39)';
  else if (edadNum < 60) grupoEtario = 'Adulto Maduro (40-59)';
  else if (edadNum < 75) grupoEtario = 'Adulto Mayor (60-74)';
  else grupoEtario = 'Tercera Edad Avanzada (75+)';

  const direccionLower = (raw.DIRECCION_PACIENTE || '').toLowerCase();
  let municipio = 'Villavicencio';

  if (direccionLower.includes('acacia') || direccionLower.includes('acacías')) municipio = 'Acacías';
  else if (direccionLower.includes('restrepo')) municipio = 'Restrepo';
  else if (direccionLower.includes('cumaral')) municipio = 'Cumaral';
  else if (direccionLower.includes('pto gaitan') || direccionLower.includes('puerto gaitan') || direccionLower.includes('puerto gaitán')) municipio = 'Puerto Gaitán';
  else if (direccionLower.includes('granada')) municipio = 'Granada';
  else if (direccionLower.includes('san martin') || direccionLower.includes('san martín')) municipio = 'San Martín';
  else if (direccionLower.includes('castilla la nueva') || direccionLower.includes('castilla')) municipio = 'Castilla La Nueva';
  else if (direccionLower.includes('medina')) municipio = 'Medina (Cund.)';
  else if (direccionLower.includes('quetame')) municipio = 'Quetame (Cund.)';
  else if (direccionLower.includes('puerto lopez') || direccionLower.includes('puerto lópez') || direccionLower.includes('pto lopez')) municipio = 'Puerto López';
  else if (direccionLower.includes('pto lleras') || direccionLower.includes('puerto lleras')) municipio = 'Puerto Lleras';
  else if (direccionLower.includes('puerto rico') || direccionLower.includes('pto rico')) municipio = 'Puerto Rico';
  else if (direccionLower.includes('el castillo') || direccionLower.includes('castillo')) municipio = 'El Castillo';
  else if (direccionLower.includes('guamal')) municipio = 'Guamal';
  else if (direccionLower.includes('cabuyaro')) municipio = 'Cabuyaro';
  else if (direccionLower.includes('cubarral')) municipio = 'Cubarral';
  else if (direccionLower.includes('lejanias') || direccionLower.includes('lejanías')) municipio = 'Lejanías';
  else if (direccionLower.includes('la macarena')) municipio = 'La Macarena';
  else if (direccionLower.includes('vista hermosa')) municipio = 'Vista Hermosa';
  else if (direccionLower.includes('fuente de oro')) municipio = 'Fuente de Oro';
  else if (direccionLower.includes('barranca de upia') || direccionLower.includes('barranca')) municipio = 'Barranca de Upía';
  else if (direccionLower.includes('paratebueno')) municipio = 'Paratebueno';
  else if (direccionLower.includes('pto carreño') || direccionLower.includes('puerto carreño')) municipio = 'Puerto Carreño (Vichada)';
  else if (direccionLower.includes('primavera vichada')) municipio = 'La Primavera (Vichada)';
  else if (direccionLower.includes('mitu') || direccionLower.includes('mitú')) municipio = 'Mitú (Vaupés)';
  else if (direccionLower.includes('san jose del guaviare') || direccionLower.includes('guaviare')) municipio = 'San José del Guaviare';
  else if (direccionLower.includes('guayabetal')) municipio = 'Guayabetal';
  else if (direccionLower.includes('caqueza') || direccionLower.includes('cáqueza')) municipio = 'Cáqueza (Cund.)';
  else municipio = 'Villavicencio';

  // Regla CCICOL:
  // "debes tomar las estadísticas por repetición de la EPS en la columna NOMBRE ENTIDAD FACT en el excel que te esté subiendo. Tenerlo en cuenta en las bases de datos ya compartidas, pero también en los ejercicios futuros."
  const rawFactClean = (raw.NOMBRE_ENTIDAD_FACT || raw.NOMBRE_ENTIDAD || raw.EPS_PACI || 'PARTICULAR')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();

  // La EPS normalizada toma exactamente la entidad facturada de la columna NOMBRE ENTIDAD FACT
  const epsNormalizada = rawFactClean || 'PARTICULAR';

  let regimen: Appointment['regimen'] = 'Subsidiado';
  if (
    rawFactClean.includes('PREPAGADA') ||
    rawFactClean.includes('POLIZA') ||
    rawFactClean.includes('PÓLIZA') ||
    rawFactClean.includes('SEGUROS') ||
    rawFactClean.includes('MEDPLUS') ||
    rawFactClean.includes('COLMEDICA') ||
    rawFactClean.includes('SURAMERICANA') ||
    rawFactClean.includes('COOMEVA')
  ) {
    regimen = 'Medicina Prepagada';
  } else if (rawFactClean.includes('CONTRIBUTIVO') || rawFactClean.includes('POS-C') || rawFactClean.includes('CONTRIB')) {
    regimen = 'Contributivo';
  } else if (rawFactClean.includes('SUBSIDIADO') || rawFactClean.includes('SUB') || rawFactClean.includes('POS-S')) {
    regimen = 'Subsidiado';
  } else if (rawFactClean.includes('PARTICULAR') || rawFactClean.includes('SIN DETERMINAR')) {
    regimen = 'Particular / Otro';
  } else if (
    rawFactClean.includes('FAMISANAR') ||
    rawFactClean.includes('NUEVA EPS') ||
    rawFactClean.includes('SALUD TOTAL') ||
    rawFactClean.includes('COMPENSAR') ||
    rawFactClean.includes('SANITAS')
  ) {
    regimen = 'Contributivo';
  } else if (
    rawFactClean.includes('CAPITAL SALUD') ||
    rawFactClean.includes('ASMET') ||
    rawFactClean.includes('MUTUAL') ||
    rawFactClean.includes('COOSALUD') ||
    rawFactClean.includes('EMSSANAR')
  ) {
    regimen = 'Subsidiado';
  } else {
    regimen = 'Particular / Otro';
  }

  // Procedure Short Label
  let tipoProcedimientoCorto = 'Ecocardiograma Transtorácico';
  const cups = raw.CUPS?.trim();
  if (cups === '881202') tipoProcedimientoCorto = 'Eco Transtorácico';
  else if (cups === '894102') tipoProcedimientoCorto = 'Prueba de Esfuerzo';
  else if (cups === '881210') tipoProcedimientoCorto = 'Eco Stress (Esfuerzo/Farm.)';
  else if (cups === '895003') tipoProcedimientoCorto = 'Mesa Basculante';
  else if (cups === '881205') tipoProcedimientoCorto = 'Eco Transesofágico';
  else if (raw.DESCRIPCION_CUPS) {
    if (raw.DESCRIPCION_CUPS.includes('MESA')) tipoProcedimientoCorto = 'Mesa Basculante';
    else if (raw.DESCRIPCION_CUPS.includes('STREES') || raw.DESCRIPCION_CUPS.includes('STRESS')) tipoProcedimientoCorto = 'Eco Stress (Esfuerzo/Farm.)';
    else if (raw.DESCRIPCION_CUPS.includes('ESFUERZO')) tipoProcedimientoCorto = 'Prueba de Esfuerzo';
    else if (raw.DESCRIPCION_CUPS.includes('TRANSESOFAGICO')) tipoProcedimientoCorto = 'Eco Transesofágico';
  }

  // Regla CCICOL de Oportunidad de Cita:
  // "La fecha de agendamiento de cada cita se encuentra en la columna de OBSERVACIONES, los números finales corresponden a XX/YY/WW"
  // "XX: día, YY: Mes, WW: Año comprimido '26' para '2026'. En observaciones está siempre procedimiento/entidadfact/XX/YY/WW"
  // "Esta es la fecha que debes tomar como agendamiento y compararla con la fecha cuando se da la consulta que corresponde a la columna FECHA CITA (WWWWYYXX)"
  const opInfo = calculateOportunidad(raw.FECHA_CITA, raw.OBSERVACIONES, raw.FECHA_CREACION);
  const oportunidadDias = opInfo.oportunidadDias;
  const fechaCreacionFinal = opInfo.fechaAgendamientoIso || raw.FECHA_CREACION || raw.FECHA_CITA;

  // Time slot (Horario)
  const hora = raw.HORA_CITA || '09:00';
  const hourNum = parseInt(hora.split(':')[0], 10) || 9;
  const horarioFranja = hourNum >= 12 ? 'Tarde (12:00 - 15:00)' : 'Mañana (08:00 - 11:59)';

  const mes = raw.FECHA_CITA ? `${raw.FECHA_CITA.substring(0, 4)}-${raw.FECHA_CITA.substring(4, 6)}` : defaultMes;

  const nombres = [raw.PRIMER_NOMBRE, raw.SEGUNDO_NOMBRE].filter(Boolean).join(' ');
  const apellidos = [raw.PRIMER_APELLIDO, raw.SEGUNDO_APELLIDO].filter(Boolean).join(' ');
  const pacienteNombreCompleto = `${apellidos} ${nombres}`.trim() || 'Paciente sin nombre';

  // Normalize Day of Week
  let diaSem = 'Lunes';
  const diaLower = (raw.DIA_SEM || '').toLowerCase();
  if (diaLower.includes('lun')) diaSem = 'Lunes';
  else if (diaLower.includes('mar')) diaSem = 'Martes';
  else if (diaLower.includes('mi')) diaSem = 'Miércoles';
  else if (diaLower.includes('jue')) diaSem = 'Jueves';
  else if (diaLower.includes('vie')) diaSem = 'Viernes';
  else if (diaLower.includes('s')) diaSem = 'Sábado';
  else if (raw.FECHA_CITA && raw.FECHA_CITA.length === 8) {
    const y = parseInt(raw.FECHA_CITA.substring(0, 4));
    const m = parseInt(raw.FECHA_CITA.substring(4, 6)) - 1;
    const d = parseInt(raw.FECHA_CITA.substring(6, 8));
    const dayIdx = new Date(y, m, d).getDay();
    const map = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    diaSem = map[dayIdx] || 'Lunes';
  }

  // Regla CCICOL:
  // "Los que no tengan número de comprobante en la columna del excel correspondiente, se cuenta como inasistencia"
  const compClean = (raw.COMPROBANTE || '').trim();
  const hasValidComprobante =
    compClean !== '' &&
    compClean !== '0' &&
    compClean.toUpperCase() !== 'N/A' &&
    compClean.toUpperCase() !== 'SIN COMPROBANTE' &&
    compClean.toUpperCase() !== 'NO TIENE' &&
    compClean.toUpperCase() !== 'PENDIENTE';

  let asistioFinal: 'SI' | 'NO' = 'NO';
  if (hasValidComprobante) {
    const rawAsist = (raw.ASISTIO || '').trim().toUpperCase();
    asistioFinal = (rawAsist === 'NO' || rawAsist.startsWith('INASIST') || rawAsist === 'FALSE') ? 'NO' : 'SI';
  } else {
    // Si no tiene número de comprobante => Inasistencia automática
    asistioFinal = 'NO';
  }

  return {
    ...raw,
    ASISTIO: asistioFinal,
    COMPROBANTE: hasValidComprobante ? compClean : '',
    DIA_SEM: diaSem,
    id: `cita_${mes}_${index}_${raw.IDENTIFICACION_PACIENTE || index}`,
    mes,
    pacienteNombreCompleto,
    edadNum,
    grupoEtario,
    municipio,
    regimen,
    NOMBRE_ENTIDAD_FACT: rawFactClean,
    ESTADO_CITA: asistioFinal === 'SI' ? (raw.ESTADO_CITA || 'VIGENTE') : 'INASISTENCIA',
    epsNormalizada,
    FECHA_CREACION: fechaCreacionFinal,
    oportunidadDias,
    tipoProcedimientoCorto,
    horarioFranja,
  };
}
