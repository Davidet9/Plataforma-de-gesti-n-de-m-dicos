import * as pdfjsLib from 'pdfjs-dist';
import { Appointment, MonthlyDataset, RawAppointment } from '../types/clinical';
import { normalizeRawAppointment } from '../utils/normalizer';

// Set up pdf.js worker URL (using unpkg or local CDN-compatible fallback)
try {
  if (typeof window !== 'undefined' && 'Worker' in window) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
} catch {
  // Graceful fallback
}

export interface ParseResult {
  success: boolean;
  dataset?: MonthlyDataset;
  rawTextPreview?: string;
  totalParsed: number;
  warnings: string[];
  error?: string;
}

/**
 * Extracts raw text page-by-page from an uploaded PDF file
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str || '');
    fullText += strings.join(' ') + '\n';
  }

  return fullText;
}

/**
 * Parses raw text extracted from CCicol Citas PDF report
 */
export function parseCCicolReportText(text: string, fileName = 'Reporte.pdf'): ParseResult {
  const warnings: string[] = [];
  const lines = text.split('\n');

  // Detect month / date range in text
  let mesId = '2026-08';
  let nombreMes = 'Agosto 2026';
  let fechaInicio = '2026-08-01';
  let fechaFin = '2026-08-31';
  let profesional = 'SALCEDO VALLE OSCAR JAVIER';
  let empresa = 'CCICOL S.A.S';

  const dateRangeMatch = text.match(/DESDE\s+EL\s+DIA\s+(\d{4})[\/\-](\d{2})[\/\-](\d{2})\s+HASTA\s+EL\s+DIA\s+(\d{4})[\/\-](\d{2})[\/\-](\d{2})/i);
  if (dateRangeMatch) {
    const [_, y1, m1, d1, y2, m2, d2] = dateRangeMatch;
    mesId = `${y1}-${m1}`;
    fechaInicio = `${y1}-${m1}-${d1}`;
    fechaFin = `${y2}-${m2}-${d2}`;
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthIdx = parseInt(m1, 10) - 1;
    nombreMes = `${months[monthIdx] || 'Mes'} ${y1}`;
  }

  const profMatch = text.match(/PROFESIONAL\s+QUE\s+ATIENDE:\s*([^\n\r]+)/i);
  if (profMatch && profMatch[1]) {
    profesional = profMatch[1].trim();
  }

  const rawAppointments: RawAppointment[] = [];

  // Match line rows starting with 8-digit date like 20260803 or 2026/08/03 or 2026-08-03
  // Format example: 20260803 lunes 09:00 SALCEDO VALLE OSCAR JAVIER 895003 PRUEBA DE MESA BASCULANTE ...
  const rowRegex = /(\d{8})\s+(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)\s+(\d{2}:\d{2})\s+([A-Z\s]+?)\s+(881202|894102|881210|895003|881205|\d{6})\s+([A-Z\s\/\.,\-\(\)]+?)\s+([A-ZÑÁÉÍÓÚ\s]+?)\s+(F|M)\s+([\d\s]+?)\s+(\d{4,12})\s+(CC|TI|CE|PT|RC)\s+([^\n\r]+?)\s+(EPSS34|EPS017|EPS016|EMP002|MP001|EPS001|1318|EPS037|SIN001|[A-Z0-9]+)\s+([^\n\r]+?)\s+(SI|NO)\s+([^\n\r]*)/i;

  // Flexible line scanner
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('FECHA CITA') || line.startsWith('CCICOL') || line.startsWith('LISTA DE CITAS')) continue;

    // Direct tokenized parsing
    const dateMatch = line.match(/^(\d{8}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/);
    if (!dateMatch) continue;

    const tokens = line.split(/\s+/);
    if (tokens.length < 12) continue;

    const fechaCita = tokens[0].replace(/\D/g, '');
    const diaSem = tokens[1].toLowerCase();
    const horaCita = tokens[2];

    // Find cups index
    const cupsIdx = tokens.findIndex((t, i) => i > 2 && /^(881202|894102|881210|895003|881205)$/.test(t));
    if (cupsIdx === -1) continue;

    const cups = tokens[cupsIdx];
    const medico = tokens.slice(3, cupsIdx).join(' ');

    // Find sex index ('M' or 'F')
    const sexIdx = tokens.findIndex((t, i) => i > cupsIdx + 1 && (t === 'M' || t === 'F'));
    if (sexIdx === -1) continue;

    const cupsDescription = tokens.slice(cupsIdx + 1, sexIdx - 2).join(' ') || 'PROCEDIMIENTO CARDIOVASCULAR';
    const sex = tokens[sexIdx] as 'M' | 'F';

    // Names are before sex
    const nameTokens = tokens.slice(sexIdx - 2, sexIdx);
    const primerApellido = nameTokens[0] || 'PACIENTE';
    const primerNombre = nameTokens[1] || '';

    // Asistio token ('SI' or 'NO') towards the end
    const asistioIdx = tokens.findIndex((t, i) => i > sexIdx && (t === 'SI' || t === 'NO'));
    const asistio = asistioIdx !== -1 ? (tokens[asistioIdx] as 'SI' | 'NO') : 'SI';

    // Find age token like A067 or A018
    const ageIdx = tokens.findIndex(t => /^A\d{2,3}$/.test(t));
    const edadPaciente = ageIdx !== -1 ? tokens[ageIdx] : 'A055';

    // Identification is usually a sequence of 6 to 10 digits
    const idIdx = tokens.findIndex((t, i) => i > sexIdx && /^\d{6,10}$/.test(t));
    const identificacion = idIdx !== -1 ? tokens[idIdx] : `ID_${rawAppointments.length + 1}`;

    rawAppointments.push({
      FECHA_CITA: fechaCita,
      DIA_SEM: diaSem,
      HORA_CITA: horaCita,
      MEDICO: medico || profesional,
      CUPS: cups,
      DESCRIPCION_CUPS: cupsDescription,
      PRIMER_APELLIDO: primerApellido,
      SEGUNDO_APELLIDO: '',
      PRIMER_NOMBRE: primerNombre,
      SEGUNDO_NOMBRE: '',
      SEXO_PACIENTE: sex,
      TELEFONO: '3100000000',
      TELEFONO_2: '',
      IDENTIFICACION_PACIENTE: identificacion,
      TIPO_ID_PACIENTE: 'CC',
      DIRECCION_PACIENTE: 'Villavicencio',
      EPS_PACI: line.includes('FAMISANAR') ? 'EPS017' : (line.includes('COOMEVA') ? 'EPS016' : 'EPSS34'),
      NOMBRE_ENTIDAD: line.includes('FAMISANAR') ? 'FAMISANAR LTDA E.P.S.' : 'CAPITAL SALUD EPS S',
      NIT_FACT: '900298372',
      NOMBRE_ENTIDAD_FACT: line.includes('FAMISANAR') ? 'FAMISANAR EPS' : 'CAPITAL SALUD EPS-SUBSIDIADO',
      FECHA_NACIMIENTO: '1970-01-01',
      EDAD_PACIENTE: edadPaciente,
      FECHA_CREACION: fechaCita,
      ASISTIO: asistio,
      COMPROBANTE: asistio === 'SI' ? '124000' : '',
      ESTADO_CITA: asistio === 'SI' ? 'ATENDIDA' : 'VIGENTE',
      OBSERVACIONES: 'CARGADO DESDE ARCHIVO PDF'
    });
  }

  // If tokenizer extracted rows, normalize them
  if (rawAppointments.length > 0) {
    const citas: Appointment[] = rawAppointments.map((raw, idx) => normalizeRawAppointment(raw, idx, mesId));
    return {
      success: true,
      totalParsed: citas.length,
      warnings,
      rawTextPreview: text.substring(0, 500) + '...',
      dataset: {
        mesId,
        nombreMes,
        fechaInicio,
        fechaFin,
        profesional,
        empresa,
        citas,
        cargadoEn: new Date().toISOString(),
        origen: 'pdf',
        archivoNombre: fileName
      }
    };
  }

  return {
    success: false,
    totalParsed: 0,
    warnings: ['No se detectaron filas de citas con el formato estándar de CCICOL.'],
    rawTextPreview: text.substring(0, 500),
    error: 'El archivo no contiene filas reconocibles de citas médicas o el formato de columnas difiere.'
  };
}
