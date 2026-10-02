import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Trash2, FileSpreadsheet, Download, Table, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { MonthlyDataset } from '../types/clinical';
import { extractTextFromPDF, parseCCicolReportText, ParseResult } from '../services/pdfParser';
import { parseExcelReportFile } from '../services/excelParser';

interface PdfUploaderModalProps {
  datasets: Record<string, MonthlyDataset>;
  onSaveDataset: (dataset: MonthlyDataset) => void;
  onDeleteDataset: (mesId: string) => void;
  onClose?: () => void;
}

export const PdfUploaderModal: React.FC<PdfUploaderModalProps> = ({
  datasets,
  onSaveDataset,
  onDeleteDataset,
}) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileTypeDetected, setFileTypeDetected] = useState<'excel' | 'pdf' | 'text' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setFileName(file.name);
    setIsProcessing(true);

    const lowerName = file.name.toLowerCase();

    try {
      if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
        setFileTypeDetected('excel');
        const result = await parseExcelReportFile(file);
        setParseResult(result);
        if (!result.success) {
          setErrorMsg(result.error || 'No se pudieron extraer citas válidas del archivo Excel.');
        }
      } else if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
        setFileTypeDetected('pdf');
        const text = await extractTextFromPDF(file);
        const result = parseCCicolReportText(text, file.name);
        setParseResult(result);
        if (!result.success) {
          setErrorMsg(result.error || 'No se pudieron extraer citas del PDF.');
        }
      } else {
        // Text / CSV
        setFileTypeDetected('text');
        const text = await file.text();
        const result = parseCCicolReportText(text, file.name);
        setParseResult(result);
        if (!result.success) {
          setErrorMsg(result.error || 'No se detectó el formato de citas.');
        }
      }
    } catch (err: any) {
      console.error('Error processing file:', err);
      setErrorMsg(`Error al procesar el archivo: ${err?.message || 'Archivo no legible o dañado.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim()) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsProcessing(true);
    setFileTypeDetected('text');
    setFileName('Texto_Pegado.txt');

    try {
      const result = parseCCicolReportText(pastedText, 'Citas_Pegadas.txt');
      setParseResult(result);
      if (!result.success) {
        setErrorMsg('No se detectaron registros con el formato de CCicol en el texto.');
      }
    } catch (err: any) {
      setErrorMsg('Error al analizar el texto pegado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToDatabase = () => {
    if (!parseResult?.dataset) return;
    onSaveDataset(parseResult.dataset);
    setSuccessMsg(`¡Base de datos del mes "${parseResult.dataset.nombreMes}" guardada exitosamente con ${parseResult.dataset.citas.length} citas!`);
    setParseResult(null);
    setPastedText('');
  };

  // Download template Excel file for CCICOL
  const handleDownloadExcelTemplate = () => {
    const templateData = [
      {
        FECHA_CITA: '20261001',
        DIA_SEM: 'jueves',
        HORA_CITA: '08:30',
        MEDICO: 'SALCEDO VALLE OSCAR JAVIER',
        CUPS: '881202',
        DESCRIPCION_CUPS: 'ECOCARDIOGRAMA TRANSTORACICO',
        PACIENTE: 'RODRIGUEZ PEREZ CARLOS ARTURO',
        SEXO: 'M',
        IDENTIFICACION: '17320000',
        TELEFONO: '3101234567',
        DIRECCION: 'VILLAVICENCIO',
        EPS_PACI: 'EPSS34',
        NOMBRE_ENTIDAD: 'CAPITAL SALUD EPS S',
        NOMBRE_ENTIDAD_FACT: 'CAPITAL SALUD EPS-SUBSIDIADO',
        EDAD: '65',
        FECHA_CREACION: '20260920',
        ASISTIO: 'SI',
        COMPROBANTE: '126001',
        ESTADO: 'VIGENTE',
        OBSERVACIONES: 'ECO/CAPITAL/20/09/26'
      },
      {
        FECHA_CITA: '20261001',
        DIA_SEM: 'jueves',
        HORA_CITA: '09:00',
        MEDICO: 'SALCEDO VALLE OSCAR JAVIER',
        CUPS: '894102',
        DESCRIPCION_CUPS: 'PRUEBA DE ESFUERZO',
        PACIENTE: 'GOMEZ BARRERA MARIA DEL CARMEN',
        SEXO: 'F',
        IDENTIFICACION: '40430000',
        TELEFONO: '3119876543',
        DIRECCION: 'ACACIAS META',
        EPS_PACI: 'EPS017',
        NOMBRE_ENTIDAD: 'FAMISANAR LTDA E.P.S.',
        NOMBRE_ENTIDAD_FACT: 'FAMISANAR EPS',
        EDAD: '58',
        FECHA_CREACION: '20260922',
        ASISTIO: 'SI',
        COMPROBANTE: '126002',
        ESTADO: 'VIGENTE',
        OBSERVACIONES: 'PDE/FAMI/22/09/26'
      },
      {
        FECHA_CITA: '20261001',
        DIA_SEM: 'jueves',
        HORA_CITA: '09:30',
        MEDICO: 'SALCEDO VALLE OSCAR JAVIER',
        CUPS: '895003',
        DESCRIPCION_CUPS: 'PRUEBA DE MESA BASCULANTE',
        PACIENTE: 'PARRA PUERTA ZORAIDA',
        SEXO: 'F',
        IDENTIFICACION: '35260000',
        TELEFONO: '3123456789',
        DIRECCION: 'SAN MARTIN META',
        EPS_PACI: 'EPSS34',
        NOMBRE_ENTIDAD: 'CAPITAL SALUD EPS S',
        NOMBRE_ENTIDAD_FACT: 'CAPITAL SALUD CONTRIBUTIVO',
        EDAD: '46',
        FECHA_CREACION: '20260918',
        ASISTIO: 'NO',
        COMPROBANTE: '',
        ESTADO: 'INASISTENCIA',
        OBSERVACIONES: 'MESA/CAPITAL/18/09/26'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Citas_CCICOL');
    XLSX.writeFile(wb, 'Plantilla_Citas_CCICOL.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UploadCloud className="w-5 h-5 text-[#d21d1f]" />
              <h2 className="text-base font-extrabold text-[#162b6f]">
                Cargar Base de Datos Mensual (Excel o PDF)
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Sube reportes en formato <strong>Excel (.xlsx, .xls)</strong> o <strong>PDF (.pdf)</strong> para incorporar nuevos meses a la base de datos histórica y comparativa.
            </p>
          </div>

          <button
            onClick={handleDownloadExcelTemplate}
            className="px-3 py-1.5 text-xs font-semibold text-[#162b6f] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
            title="Descargar archivo modelo con encabezados estándar para CCICOL"
          >
            <Download className="w-3.5 h-3.5 text-[#162b6f]" />
            <span>Descargar Plantilla Excel (.xlsx)</span>
          </button>
        </div>

        {/* Business Rules Notice */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <div className="bg-[#fff1f2] border border-red-200 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-[#d21d1f] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#d21d1f] block font-bold mb-0.5">Participación Asegurador (EPS):</strong>
              Conteo por repetición directa de la columna <code className="font-mono bg-white px-1 py-0.2 rounded border border-red-200 text-[#d21d1f] font-bold">NOMBRE ENTIDAD FACT</code>.
            </div>
          </div>

          <div className="bg-[#f0f4fc] border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-[#162b6f] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#162b6f] block font-bold mb-0.5">Regla de Inasistencias (No-Show):</strong>
              Fila sin número en <code className="font-mono bg-white px-1 py-0.2 rounded border border-blue-200 text-[#162b6f] font-bold">COMPROBANTE</code> se computa como <strong>inasistencia</strong>.
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2 text-xs text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-800 block font-bold mb-0.5">Oportunidad de Cita:</strong>
              Fecha de agendamiento desde <code className="font-mono bg-white px-1 py-0.2 rounded border border-emerald-200 text-emerald-800 font-bold">OBSERVACIONES</code> (.../XX/YY/WW) vs <code className="font-mono bg-white px-1 py-0.2 rounded border border-emerald-200 text-emerald-800 font-bold">FECHA CITA</code>.
            </div>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div className="border-2 border-dashed border-slate-300 hover:border-[#d21d1f] rounded-xl p-8 text-center bg-slate-50/60 hover:bg-[#fff1f2]/30 transition-all cursor-pointer relative group">
          <input
            type="file"
            accept=".xlsx,.xls,.pdf,.csv,.txt"
            onChange={handleFileDrop}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shadow-xs border border-emerald-200">
                <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#fff1f2] text-[#d21d1f] flex items-center justify-center shadow-xs border border-red-200">
                <FileText className="w-6 h-6 text-[#d21d1f]" />
              </div>
            </div>

            <div className="text-sm font-bold text-[#162b6f]">
              {isProcessing ? 'Procesando archivo...' : 'Haz clic o arrastra aquí tu archivo Excel o PDF'}
            </div>

            <div className="text-xs text-slate-500 mt-1 max-w-md">
              Formatos soportados: <strong>Excel (.xlsx, .xls)</strong>, <strong>PDF nativo (.pdf)</strong> y <strong>CSV</strong>.
            </div>

            {fileName && (
              <div className="mt-3 flex items-center gap-2 text-xs font-mono font-bold px-3 py-1 rounded-md bg-white border border-slate-200 shadow-2xs">
                {fileTypeDetected === 'excel' && (
                  <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    EXCEL
                  </span>
                )}
                {fileTypeDetected === 'pdf' && (
                  <span className="text-[#d21d1f] bg-[#fff1f2] px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    PDF
                  </span>
                )}
                <span className="text-slate-800">{fileName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Text Area Fallback */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">
              O pegar texto tabulado / copiado de citas:
            </span>
            {pastedText && (
              <button
                onClick={handleParsePastedText}
                className="text-xs font-bold text-white px-3 py-1 rounded-md transition-colors"
                style={{ backgroundColor: '#162b6f' }}
              >
                Procesar Texto
              </button>
            )}
          </div>
          <textarea
            rows={3}
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="Si prefieres, copia y pega las filas de citas directamente aquí..."
            className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#d21d1f] focus:bg-white"
          />
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Parsed Preview Card & Table */}
        {parseResult?.dataset && (
          <div className="mt-6 p-4 bg-[#f0f4fc] border border-blue-200 rounded-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#d21d1f] uppercase tracking-wider block">
                    Base de Datos Reconocida con Éxito
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                    Origen: {parseResult.dataset.origen?.toUpperCase()}
                  </span>
                </div>
                <h4 className="text-base font-extrabold text-[#162b6f] mt-0.5">
                  {parseResult.dataset.nombreMes} · {parseResult.dataset.citas.length} citas identificadas
                </h4>
              </div>

              <button
                onClick={handleSaveToDatabase}
                className="px-4 py-2 text-white rounded-lg text-xs font-bold shadow-xs hover:brightness-95 transition-all flex items-center gap-1.5 shrink-0"
                style={{ backgroundColor: '#d21d1f' }}
              >
                <Check className="w-4 h-4" />
                <span>Incorporar a Base de Datos</span>
              </button>
            </div>

            {/* Metrics Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-slate-400 block text-[11px]">Profesional:</span>
                <strong className="text-slate-800 truncate block">{parseResult.dataset.profesional}</strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-slate-400 block text-[11px]">Período de Fechas:</span>
                <strong className="text-slate-800 font-mono text-[11px]">
                  {parseResult.dataset.fechaInicio} al {parseResult.dataset.fechaFin}
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-slate-400 block text-[11px]">Procedimientos:</span>
                <strong className="text-slate-800">
                  {new Set(parseResult.dataset.citas.map((c) => c.tipoProcedimientoCorto)).size} modalidades
                </strong>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-blue-100">
                <span className="text-slate-400 block text-[11px]">Tasa de Asistencia:</span>
                <strong className="text-emerald-700 font-mono">
                  {((parseResult.dataset.citas.filter((c) => c.ASISTIO === 'SI').length / parseResult.dataset.citas.length) * 100).toFixed(1)}%
                </strong>
              </div>
            </div>

            {/* Quick Preview Table of First 5 rows */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5 text-[#162b6f]" />
                  Vista previa de registros detectados (primeras 5 filas):
                </span>
                <span className="text-slate-400 text-[11px]">
                  Mostrando 5 de {parseResult.dataset.citas.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="p-2 font-semibold">Fecha / Hora</th>
                      <th className="p-2 font-semibold">Día</th>
                      <th className="p-2 font-semibold">Paciente</th>
                      <th className="p-2 font-semibold">Procedimiento</th>
                      <th className="p-2 font-semibold">EPS</th>
                      <th className="p-2 font-semibold text-center">Comprobante</th>
                      <th className="p-2 font-semibold text-center">Asistió</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {parseResult.dataset.citas.slice(0, 5).map((cita, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 whitespace-nowrap">{cita.FECHA_CITA} {cita.HORA_CITA}</td>
                        <td className="p-2 capitalize font-sans">{cita.DIA_SEM}</td>
                        <td className="p-2 font-sans font-medium text-slate-800">{cita.pacienteNombreCompleto}</td>
                        <td className="p-2 font-sans truncate max-w-[150px]">{cita.tipoProcedimientoCorto}</td>
                        <td className="p-2 font-sans truncate max-w-[130px]">{cita.epsNormalizada}</td>
                        <td className="p-2 text-center">
                          {cita.COMPROBANTE ? (
                            <span className="text-slate-800 font-semibold">{cita.COMPROBANTE}</span>
                          ) : (
                            <span className="text-[#d21d1f] text-[10px] font-sans font-medium bg-[#fff1f2] px-1 py-0.5 rounded border border-red-200">
                              Sin comprobante
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          {cita.ASISTIO === 'SI' ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">SI</span>
                          ) : (
                            <span className="text-[#d21d1f] font-bold bg-[#fff1f2] px-1.5 py-0.5 rounded" title="Inasistencia automática por ausencia de comprobante">
                              NO
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Database Month Management Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#162b6f]">Bases de Datos Almacenadas en la Plataforma</h3>
          <p className="text-xs text-slate-500">Histórico de meses listos para análisis, cruces multivariables y comparativas.</p>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
          {Object.values(datasets).map((ds) => (
            <div key={ds.mesId} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  ds.origen === 'excel'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-[#f0f4fc] text-[#162b6f] border border-blue-200'
                }`}>
                  {ds.origen === 'excel' ? (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-[#162b6f]" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-[#162b6f] flex items-center gap-1.5">
                    <span>{ds.nombreMes}</span>
                    {ds.origen && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                        {ds.origen}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    <span className="font-mono font-semibold text-slate-700">{ds.citas.length} citas</span>
                    <span aria-hidden="true"> · </span>
                    <span>{ds.archivoNombre || 'Dataset mensual'}</span>
                    <span aria-hidden="true"> · </span>
                    <span className="text-slate-400">Rango: {ds.fechaInicio} a {ds.fechaFin}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {Object.keys(datasets).length > 1 && (
                  <button
                    onClick={() => onDeleteDataset(ds.mesId)}
                    title="Eliminar este mes de la base de datos"
                    className="p-1.5 text-slate-400 hover:text-[#d21d1f] hover:bg-[#fff1f2] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
