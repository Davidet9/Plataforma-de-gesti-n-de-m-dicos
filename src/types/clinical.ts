export interface RawAppointment {
  FECHA_CITA: string; // e.g. "20260803"
  DIA_SEM: string; // "lunes", "martes", etc.
  HORA_CITA: string; // "09:00"
  MEDICO: string; // "SALCEDO VALLE OSCAR JAVIER"
  CUPS: string; // "881202", "894102", "881210", "895003", "881205"
  DESCRIPCION_CUPS: string;
  PRIMER_APELLIDO: string;
  SEGUNDO_APELLIDO: string;
  PRIMER_NOMBRE: string;
  SEGUNDO_NOMBRE: string;
  SEXO_PACIENTE: 'M' | 'F';
  TELEFONO: string;
  TELEFONO_2: string;
  IDENTIFICACION_PACIENTE: string;
  TIPO_ID_PACIENTE: string; // "CC", "TI", "CE", "PT"
  DIRECCION_PACIENTE: string;
  EPS_PACI: string;
  NOMBRE_ENTIDAD: string;
  NIT_FACT: string;
  NOMBRE_ENTIDAD_FACT: string;
  FECHA_NACIMIENTO: string;
  EDAD_PACIENTE: string; // "A067", "A018"
  FECHA_CREACION: string; // "20260722"
  ASISTIO: 'SI' | 'NO';
  COMPROBANTE: string;
  ESTADO_CITA: string; // "VIGENTE", "ATENDIDA"
  OBSERVACIONES: string;
}

export type ProcedureCode = '881202' | '894102' | '881210' | '895003' | '881205';

export interface Appointment extends RawAppointment {
  id: string;
  mes: string; // "2026-08"
  pacienteNombreCompleto: string;
  edadNum: number;
  grupoEtario: string;
  municipio: string;
  regimen: 'Subsidiado' | 'Contributivo' | 'Medicina Prepagada' | 'Particular / Otro';
  epsNormalizada: string;
  oportunidadDias: number;
  tipoProcedimientoCorto: string;
  horarioFranja: 'Mañana (08:00 - 11:59)' | 'Tarde (12:00 - 15:00)';
}

export interface MonthlyDataset {
  mesId: string; // "2026-08"
  nombreMes: string; // "Agosto 2026"
  fechaInicio: string;
  fechaFin: string;
  profesional: string;
  empresa: string;
  citas: Appointment[];
  cargadoEn: string;
  origen: 'predefinido' | 'pdf' | 'excel' | 'manual';
  archivoNombre?: string;
}

export type CrossVariableField = 
  | 'tipoProcedimientoCorto'
  | 'epsNormalizada'
  | 'regimen'
  | 'grupoEtario'
  | 'SEXO_PACIENTE'
  | 'DIA_SEM'
  | 'ASISTIO'
  | 'municipio'
  | 'horarioFranja'
  | 'ESTADO_CITA';

export type CrossMetric = 
  | 'count'
  | 'percent'
  | 'attendanceRate'
  | 'noShowRate'
  | 'avgAge'
  | 'avgWaitDays';

export interface FilterState {
  search: string;
  procedimientos: string[];
  eps: string[];
  regimenes: string[];
  asistencia: 'ALL' | 'SI' | 'NO';
  sexo: 'ALL' | 'M' | 'F';
  gruposEtarios: string[];
  diasSemana: string[];
  municipios: string[];
  estadoCita: 'ALL' | 'VIGENTE' | 'ATENDIDA';
}
