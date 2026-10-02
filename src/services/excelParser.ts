import * as XLSX from 'xlsx';
import { RawAppointment, MonthlyDataset, Appointment } from '../types/clinical';
import { normalizeRawAppointment, extractAgendamientoDateFromObs } from '../utils/normalizer';
import { ParseResult } from './pdfParser';

/**
 * Parses an Excel file (.xlsx, .xls) containing appointment records
 */
export async function parseExcelReportFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        totalParsed: 0,
        warnings: ['El libro de Excel no contiene hojas de cálculo.'],
        error: 'El archivo Excel está vacío o no contiene hojas legibles.'
      };
    }

    // Inspect all sheets and pick the one with most data or matching clinical headers
    let bestSheetName = workbook.SheetNames[0];
    let maxScore = -1;
    let bestRawRows: any[][] = [];

    for (const sName of workbook.SheetNames) {
      const s = workbook.Sheets[sName];
      if (!s) continue;
      const rows: any[][] = XLSX.utils.sheet_to_json(s, { header: 1, raw: false });
      if (!rows || rows.length === 0) continue;

      let score = rows.length;
      // Bonus if it has key clinical headers
      const sampleText = rows.slice(0, 15).map(r => (r || []).join(' ')).join(' ').toUpperCase();
      if (sampleText.includes('ENTIDAD') && sampleText.includes('FACT')) score += 5000;
      if (sampleText.includes('NOMBRE ENTIDAD FACT')) score += 5000;
      if (sampleText.includes('FECHA') && sampleText.includes('CITA')) score += 3000;
      if (sampleText.includes('CUPS')) score += 2000;
      if (sampleText.includes('COMPROBANTE')) score += 2000;

      if (score > maxScore) {
        maxScore = score;
        bestSheetName = sName;
        bestRawRows = rows;
      }
    }

    const sheetName = bestSheetName;
    const rawRows = bestRawRows;

    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        totalParsed: 0,
        warnings: ['La hoja de cálculo está vacía.'],
        error: 'La hoja de cálculo de Excel no contiene datos.'
      };
    }

    // Find header row: look for row containing key terms like NOMBRE ENTIDAD FACT, FECHA, CITA, CUPS, PACIENTE, EPS, DIA, etc.
    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rawRows.length, 35); i++) {
      const rowStr = (rawRows[i] || []).map(cell => String(cell || '').toUpperCase()).join(' ');
      if (
        (rowStr.includes('ENTIDAD') && (rowStr.includes('FACT') || rowStr.includes('PAGO') || rowStr.includes('COBRO'))) ||
        (rowStr.includes('FECHA') && (rowStr.includes('CITA') || rowStr.includes('DIA') || rowStr.includes('CUPS'))) ||
        (rowStr.includes('CUPS') && (rowStr.includes('PACIENTE') || rowStr.includes('PROCEDIMIENTO') || rowStr.includes('DESCRIPCION'))) ||
        (rowStr.includes('IDENTIFICACION') || rowStr.includes('CEDULA')) ||
        (rowStr.includes('COMPROBANTE') && rowStr.includes('PACIENTE'))
      ) {
        headerRowIdx = i;
        break;
      }
    }

    // Column mapping index
    const colMap: Record<string, number> = {};

    if (headerRowIdx !== -1) {
      const headerCells = rawRows[headerRowIdx] || [];
      headerCells.forEach((cellVal, colIdx) => {
        const rawH = String(cellVal || '').trim();
        const h = rawH.toUpperCase().replace(/[\s_\/\-\.]+/g, '_');
        if (!h) return;

        // Prioridad absoluta: NOMBRE ENTIDAD FACT (columna determinante de Asegurador en CCICOL)
        if (
          h.includes('NOMBRE_ENTIDAD_FACT') ||
          h.includes('ENTIDAD_FACT') ||
          (h.includes('ENTIDAD') && (h.includes('FACT') || h.includes('COBRO') || h.includes('PAGO'))) ||
          (h.includes('EPS') && h.includes('FACT')) ||
          h.includes('FACTURAR_A') ||
          h.includes('ENTIDAD_A_FACTURAR') ||
          h.includes('NOMBRE_FACT') ||
          h.includes('FACTURACION') ||
          h.includes('FACTURAR') ||
          h.includes('ASEGURADOR_FACT') ||
          h.includes('ASEGURADORA_FACT')
        ) {
          colMap['NOMBRE_ENTIDAD_FACT'] = colIdx;
        } else if (
          h.includes('NOMBRE_ENTIDAD') ||
          h.includes('ENTIDAD') ||
          h.includes('EPS') ||
          h.includes('ASEGURADOR') ||
          h.includes('ASEGURADORA')
        ) {
          if (colMap['NOMBRE_ENTIDAD'] === undefined) {
            colMap['NOMBRE_ENTIDAD'] = colIdx;
          }
        } else if (
          h.includes('COMPROB') ||
          h.includes('FACTURA') ||
          h === 'COMP' ||
          h.includes('RECIBO') ||
          h.includes('NUM_COMP') ||
          h.includes('NO_COMP') ||
          h.includes('NRO_COMP')
        ) {
          colMap['COMPROBANTE'] = colIdx;
        } else if (
          h.includes('FECHA_CITA') ||
          h === 'FECHA' ||
          h === 'FECHA_DE_CITA' ||
          h.includes('DIA_CITA') ||
          h.includes('FECHA_ATENCION')
        ) {
          colMap['FECHA_CITA'] = colIdx;
        } else if (h.includes('DIA_SEM') || h.includes('DIA_SEMANA') || h === 'DIA' || h === 'DÍA') {
          colMap['DIA_SEM'] = colIdx;
        } else if (h.includes('HORA_CITA') || h === 'HORA' || h === 'HORA_DE_CITA') {
          colMap['HORA_CITA'] = colIdx;
        } else if (h.includes('MEDICO') || h.includes('PROFESIONAL') || h.includes('DOCTOR')) {
          colMap['MEDICO'] = colIdx;
        } else if (h === 'CUPS' || h.includes('CODIGO_CUPS') || h === 'COD_CUPS' || h.includes('COD_PROC')) {
          colMap['CUPS'] = colIdx;
        } else if (
          h.includes('DESCRIPCION_CUPS') ||
          h.includes('PROCEDIMIENTO') ||
          h.includes('ESTUDIO') ||
          h.includes('EXAMEN') ||
          h === 'DESCRIPCION'
        ) {
          colMap['DESCRIPCION_CUPS'] = colIdx;
        } else if (h.includes('PRIMER_APELLIDO') || h === 'APELLIDO_1' || h === '1ER_APELLIDO') {
          colMap['PRIMER_APELLIDO'] = colIdx;
        } else if (h.includes('SEGUNDO_APELLIDO') || h === 'APELLIDO_2' || h === '2DO_APELLIDO') {
          colMap['SEGUNDO_APELLIDO'] = colIdx;
        } else if (h.includes('PRIMER_NOMBRE') || h === 'NOMBRE_1' || h === '1ER_NOMBRE') {
          colMap['PRIMER_NOMBRE'] = colIdx;
        } else if (h.includes('SEGUNDO_NOMBRE') || h === 'NOMBRE_2' || h === '2DO_NOMBRE') {
          colMap['SEGUNDO_NOMBRE'] = colIdx;
        } else if (
          h === 'PACIENTE' ||
          h.includes('NOMBRE_PACIENTE') ||
          h.includes('NOMBRE_COMPLETO') ||
          h.includes('APELLIDOS_Y_NOMBRES')
        ) {
          colMap['PACIENTE_COMPLETO'] = colIdx;
        } else if (h === 'SEXO' || h.includes('SEXO_PACIENTE') || h === 'GENERO') {
          colMap['SEXO_PACIENTE'] = colIdx;
        } else if (
          h.includes('IDENTIFICACION') ||
          h.includes('DOCUMENTO') ||
          h.includes('CEDULA') ||
          h === 'ID' ||
          h.includes('NUM_DOC') ||
          h.includes('NUMERO_DOC')
        ) {
          colMap['IDENTIFICACION_PACIENTE'] = colIdx;
        } else if (h.includes('TIPO_ID') || h.includes('TIPO_DOC')) {
          colMap['TIPO_ID_PACIENTE'] = colIdx;
        } else if (h.includes('TELEFONO_2') || h.includes('CELULAR_2')) {
          colMap['TELEFONO_2'] = colIdx;
        } else if (h.includes('TELEFONO') || h.includes('CELULAR') || h === 'TEL') {
          colMap['TELEFONO'] = colIdx;
        } else if (h.includes('DIRECCION') || h.includes('BARRIO') || h.includes('DIR')) {
          colMap['DIRECCION_PACIENTE'] = colIdx;
        } else if (h.includes('MUNICIPIO') || h.includes('CIUDAD')) {
          colMap['MUNICIPIO'] = colIdx;
        } else if (h.includes('EPS_PACI') || h.includes('CODIGO_EPS') || h === 'COD_EPS') {
          colMap['EPS_PACI'] = colIdx;
        } else if (h.includes('EDAD') || h.includes('EDAD_PACIENTE')) {
          colMap['EDAD_PACIENTE'] = colIdx;
        } else if (h.includes('FECHA_NACIMIENTO') || h.includes('NACIMIENTO')) {
          colMap['FECHA_NACIMIENTO'] = colIdx;
        } else if (h.includes('FECHA_CREACION') || h.includes('FECHA_ASIGNACION') || h.includes('FECHA_SOLICITUD')) {
          colMap['FECHA_CREACION'] = colIdx;
        } else if (h.includes('ASISTIO') || h.includes('ASISTENCIA') || h === 'ASIST') {
          colMap['ASISTIO'] = colIdx;
        } else if (h.includes('ESTADO_CITA') || h === 'ESTADO') {
          colMap['ESTADO_CITA'] = colIdx;
        } else if (
          h.includes('OBSERVACION') ||
          h.includes('NOTAS') ||
          h.includes('OBS') ||
          h.includes('COMENTARIO') ||
          h.includes('DETALLE') ||
          h.includes('AGENDAMIENTO') ||
          h.includes('AGEND')
        ) {
          colMap['OBSERVACIONES'] = colIdx;
        }
      });
    }

    const startDataRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 1;
    const rawAppointments: RawAppointment[] = [];
    const datesFound: string[] = [];

    // Helper to format date cell into YYYYMMDD
    const formatDateVal = (val: any): string => {
      if (!val) return '';
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = (val.getMonth() + 1).toString().padStart(2, '0');
        const d = val.getDate().toString().padStart(2, '0');
        return `${y}${m}${d}`;
      }
      const str = String(val).trim();
      const cleanDigits = str.replace(/\D/g, '');
      if (cleanDigits.length === 8 && (cleanDigits.startsWith('202') || cleanDigits.startsWith('201'))) {
        return cleanDigits;
      }
      // Check if format is DD/MM/YYYY or YYYY-MM-DD
      const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (dmy) {
        const d = dmy[1].padStart(2, '0');
        const m = dmy[2].padStart(2, '0');
        const y = dmy[3];
        return `${y}${m}${d}`;
      }
      const ymd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (ymd) {
        const y = ymd[1];
        const m = ymd[2].padStart(2, '0');
        const d = ymd[3].padStart(2, '0');
        return `${y}${m}${d}`;
      }
      return cleanDigits.length >= 8 ? cleanDigits.substring(0, 8) : '';
    };

    // Parse each data row
    for (let r = startDataRow; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;

      // Extract values with colMap or fallback by typical positions
      let fechaCita = '';
      if (colMap['FECHA_CITA'] !== undefined) {
        fechaCita = formatDateVal(row[colMap['FECHA_CITA']]);
      } else {
        // Fallback: look for a date in the row
        for (let c = 0; c < Math.min(row.length, 5); c++) {
          const formatted = formatDateVal(row[c]);
          if (formatted && formatted.length === 8 && formatted.startsWith('202')) {
            fechaCita = formatted;
            break;
          }
        }
      }

      if (!fechaCita) continue;
      datesFound.push(fechaCita);

      // Day of week
      let diaSem = '';
      if (colMap['DIA_SEM'] !== undefined) {
        diaSem = String(row[colMap['DIA_SEM']] || '').trim().toLowerCase();
      }

      // Hour
      let horaCita = '09:00';
      if (colMap['HORA_CITA'] !== undefined) {
        const rawHora = String(row[colMap['HORA_CITA']] || '').trim();
        const hourMatch = rawHora.match(/(\d{1,2}:\d{2})/);
        if (hourMatch) horaCita = hourMatch[1];
      }

      // Medico
      let medico = 'SALCEDO VALLE OSCAR JAVIER';
      if (colMap['MEDICO'] !== undefined && row[colMap['MEDICO']]) {
        medico = String(row[colMap['MEDICO']]).trim();
      }

      // CUPS & Description
      let cups = '881202';
      let descCups = 'ECOCARDIOGRAMA TRANSTORACICO';

      if (colMap['CUPS'] !== undefined && row[colMap['CUPS']]) {
        cups = String(row[colMap['CUPS']]).trim();
      }
      if (colMap['DESCRIPCION_CUPS'] !== undefined && row[colMap['DESCRIPCION_CUPS']]) {
        descCups = String(row[colMap['DESCRIPCION_CUPS']]).trim();
      }

      // Names
      let primerApellido = '';
      let segundoApellido = '';
      let primerNombre = '';
      let segundoNombre = '';

      if (colMap['PRIMER_APELLIDO'] !== undefined) primerApellido = String(row[colMap['PRIMER_APELLIDO']] || '').trim();
      if (colMap['SEGUNDO_APELLIDO'] !== undefined) segundoApellido = String(row[colMap['SEGUNDO_APELLIDO']] || '').trim();
      if (colMap['PRIMER_NOMBRE'] !== undefined) primerNombre = String(row[colMap['PRIMER_NOMBRE']] || '').trim();
      if (colMap['SEGUNDO_NOMBRE'] !== undefined) segundoNombre = String(row[colMap['SEGUNDO_NOMBRE']] || '').trim();

      if (!primerApellido && colMap['PACIENTE_COMPLETO'] !== undefined && row[colMap['PACIENTE_COMPLETO']]) {
        const full = String(row[colMap['PACIENTE_COMPLETO']]).trim().split(/\s+/);
        if (full.length >= 2) {
          primerApellido = full[0];
          primerNombre = full.slice(1).join(' ');
        } else {
          primerApellido = full[0] || 'PACIENTE';
        }
      }

      // Sex
      let sex: 'M' | 'F' = 'F';
      if (colMap['SEXO_PACIENTE'] !== undefined) {
        const rawSex = String(row[colMap['SEXO_PACIENTE']] || '').trim().toUpperCase();
        if (rawSex.startsWith('M')) sex = 'M';
      }

      // ID
      let idPac = `${10000000 + rawAppointments.length}`;
      if (colMap['IDENTIFICACION_PACIENTE'] !== undefined && row[colMap['IDENTIFICACION_PACIENTE']]) {
        idPac = String(row[colMap['IDENTIFICACION_PACIENTE']]).trim().replace(/\D/g, '');
      }

      // Telefono
      let tel = '3100000000';
      if (colMap['TELEFONO'] !== undefined && row[colMap['TELEFONO']]) {
        tel = String(row[colMap['TELEFONO']]).trim();
      }
      let tel2 = '';
      if (colMap['TELEFONO_2'] !== undefined && row[colMap['TELEFONO_2']]) {
        tel2 = String(row[colMap['TELEFONO_2']]).trim();
      }

      // Direccion / Municipio
      let dir = 'VILLAVICENCIO';
      if (colMap['DIRECCION_PACIENTE'] !== undefined && row[colMap['DIRECCION_PACIENTE']]) {
        dir = String(row[colMap['DIRECCION_PACIENTE']]).trim();
      }
      if (colMap['MUNICIPIO'] !== undefined && row[colMap['MUNICIPIO']]) {
        dir = `${dir} ${String(row[colMap['MUNICIPIO']]).trim()}`.trim();
      }

      // EPS / Asegurador: Columna determinante NOMBRE ENTIDAD FACT
      let nomFact = '';
      if (colMap['NOMBRE_ENTIDAD_FACT'] !== undefined && row[colMap['NOMBRE_ENTIDAD_FACT']] !== undefined && row[colMap['NOMBRE_ENTIDAD_FACT']] !== null) {
        nomFact = String(row[colMap['NOMBRE_ENTIDAD_FACT']]).trim().replace(/\s+/g, ' ');
      }
      
      let nomEntidad = nomFact;
      if (colMap['NOMBRE_ENTIDAD'] !== undefined && row[colMap['NOMBRE_ENTIDAD']] !== undefined && row[colMap['NOMBRE_ENTIDAD']] !== null) {
        nomEntidad = String(row[colMap['NOMBRE_ENTIDAD']]).trim().replace(/\s+/g, ' ');
        if (!nomFact) {
          nomFact = nomEntidad;
        }
      }

      let epsCod = 'EPSS34';
      if (colMap['EPS_PACI'] !== undefined && row[colMap['EPS_PACI']]) {
        epsCod = String(row[colMap['EPS_PACI']]).trim();
        if (!nomFact) {
          nomFact = epsCod;
        }
      }

      if (!nomFact) {
        nomFact = 'PARTICULAR / SIN DETERMINAR';
      }

      nomFact = nomFact.toUpperCase();
      if (!nomEntidad) nomEntidad = nomFact;

      // Age
      let edad = 'A055';
      if (colMap['EDAD_PACIENTE'] !== undefined && row[colMap['EDAD_PACIENTE']]) {
        const rawEdad = String(row[colMap['EDAD_PACIENTE']]).trim();
        edad = rawEdad.startsWith('A') ? rawEdad : `A${rawEdad.padStart(3, '0')}`;
      }

      // Comprobante (Columna determinante de asistencia en CCICOL)
      let comp = '';
      if (colMap['COMPROBANTE'] !== undefined && row[colMap['COMPROBANTE']] !== undefined && row[colMap['COMPROBANTE']] !== null) {
        comp = String(row[colMap['COMPROBANTE']]).trim();
      }

      // Regla de Negocio CCICOL:
      // "Los que no tengan número de comprobante en la columna del excel correspondiente, se cuenta como inasistencia"
      const compUpper = comp.toUpperCase();
      const hasValidComprobante =
        comp !== '' &&
        comp !== '0' &&
        comp !== 'null' &&
        comp !== 'undefined' &&
        compUpper !== 'N/A' &&
        compUpper !== 'SIN COMPROBANTE' &&
        compUpper !== 'NO TIENE' &&
        compUpper !== 'PENDIENTE' &&
        compUpper !== 'NO';

      let asistio: 'SI' | 'NO' = 'NO';
      if (hasValidComprobante) {
        if (colMap['ASISTIO'] !== undefined && row[colMap['ASISTIO']] !== undefined && row[colMap['ASISTIO']] !== null) {
          const rawAsist = String(row[colMap['ASISTIO']]).trim().toUpperCase();
          if (rawAsist === 'NO' || rawAsist.startsWith('INASIST') || rawAsist === 'FALSE' || rawAsist === '0') {
            asistio = 'NO';
          } else {
            asistio = 'SI';
          }
        } else {
          asistio = 'SI';
        }
      } else {
        // Sin comprobante válido => Inasistencia automática según regla de negocio
        asistio = 'NO';
        comp = '';
      }

      // Creation date
      let fechaCreacion = fechaCita;
      if (colMap['FECHA_CREACION'] !== undefined && row[colMap['FECHA_CREACION']]) {
        const fc = formatDateVal(row[colMap['FECHA_CREACION']]);
        if (fc) fechaCreacion = fc;
      }

      // Observations - Regla CCICOL:
      // "La fecha de agendamiento de cada cita se encuentra en la columna de OBSERVACIONES, los número finales corresponden a XX/YY/WW"
      // "XX: día, YY: Mes, WW: Año comprimido '26' para '2026'. En observaciones está siempre procedimiento/entidadfact/XX/YY/WW"
      let obs = '';
      if (colMap['OBSERVACIONES'] !== undefined && row[colMap['OBSERVACIONES']] !== undefined && row[colMap['OBSERVACIONES']] !== null) {
        obs = String(row[colMap['OBSERVACIONES']]).trim();
      }

      // Si la columna OBSERVACIONES no fue mapeada o la celda no tiene fecha, escanear otras celdas de la fila
      if (!obs || !extractAgendamientoDateFromObs(obs)) {
        for (let colIdx = 0; colIdx < row.length; colIdx++) {
          if (row[colIdx] !== undefined && row[colIdx] !== null) {
            const cellVal = String(row[colIdx]).trim();
            if (extractAgendamientoDateFromObs(cellVal)) {
              obs = cellVal;
              break;
            }
          }
        }
      }

      rawAppointments.push({
        FECHA_CITA: fechaCita,
        DIA_SEM: diaSem,
        HORA_CITA: horaCita,
        MEDICO: medico,
        CUPS: cups,
        DESCRIPCION_CUPS: descCups,
        PRIMER_APELLIDO: primerApellido || 'PACIENTE',
        SEGUNDO_APELLIDO: segundoApellido,
        PRIMER_NOMBRE: primerNombre || 'CITADO',
        SEGUNDO_NOMBRE: segundoNombre,
        SEXO_PACIENTE: sex,
        TELEFONO: tel,
        TELEFONO_2: tel2,
        IDENTIFICACION_PACIENTE: idPac,
        TIPO_ID_PACIENTE: 'CC',
        DIRECCION_PACIENTE: dir,
        EPS_PACI: epsCod,
        NOMBRE_ENTIDAD: nomEntidad,
        NIT_FACT: '900298372',
        NOMBRE_ENTIDAD_FACT: nomFact,
        FECHA_NACIMIENTO: '1970-01-01',
        EDAD_PACIENTE: edad,
        FECHA_CREACION: fechaCreacion,
        ASISTIO: asistio,
        COMPROBANTE: comp,
        ESTADO_CITA: asistio === 'SI' ? 'VIGENTE' : 'INASISTENCIA',
        OBSERVACIONES: obs || `Importado desde Excel (${file.name})`
      });
    }

    if (rawAppointments.length === 0) {
      return {
        success: false,
        totalParsed: 0,
        warnings: ['No se detectaron filas válidas de citas en el archivo Excel.'],
        error: 'No se encontraron citas válidas. Verifica que el archivo contenga columnas con fechas de cita y datos de pacientes.'
      };
    }

    // Determine month based on the most frequent year-month among all records
    const monthFreq: Record<string, number> = {};
    datesFound.forEach(d => {
      if (d.length >= 6) {
        const ym = `${d.substring(0, 4)}-${d.substring(4, 6)}`;
        monthFreq[ym] = (monthFreq[ym] || 0) + 1;
      }
    });

    const sortedFreq = Object.entries(monthFreq).sort((a, b) => b[1] - a[1]);
    const mesId = sortedFreq.length > 0 ? sortedFreq[0][0] : '2026-09';
    const [y, m] = mesId.split('-');

    datesFound.sort();
    const firstDate = datesFound[0];
    const lastDate = datesFound[datesFound.length - 1];

    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const monthIdx = parseInt(m, 10) - 1;
    const nombreMes = `${monthNames[monthIdx] || 'Mes'} ${y}`;

    const citas: Appointment[] = rawAppointments.map((raw, idx) => normalizeRawAppointment(raw, idx, mesId));

    return {
      success: true,
      totalParsed: citas.length,
      warnings: [],
      rawTextPreview: `Excel procesado: Hoja "${sheetName}", ${citas.length} registros identificados.`,
      dataset: {
        mesId,
        nombreMes,
        fechaInicio: `${firstDate.substring(0, 4)}-${firstDate.substring(4, 6)}-${firstDate.substring(6, 8)}`,
        fechaFin: `${lastDate.substring(0, 4)}-${lastDate.substring(4, 6)}-${lastDate.substring(6, 8)}`,
        profesional: rawAppointments[0]?.MEDICO || 'SALCEDO VALLE OSCAR JAVIER',
        empresa: 'CCICOL S.A.S',
        citas,
        cargadoEn: new Date().toISOString(),
        origen: 'excel',
        archivoNombre: file.name
      }
    };
  } catch (err: any) {
    console.error('Error parsing Excel file:', err);
    return {
      success: false,
      totalParsed: 0,
      warnings: [],
      error: `Error al leer el archivo Excel: ${err?.message || 'Formato no soportado o archivo dañado.'}`
    };
  }
}
