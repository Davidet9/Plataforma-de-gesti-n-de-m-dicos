import React, { useState } from 'react';
import { Appointment } from '../types/clinical';
import { Eye, X, Phone, MapPin, Calendar, Clock, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface DataExplorerProps {
  citas: Appointment[];
}

export const DataExplorer: React.FC<DataExplorerProps> = ({ citas }) => {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [sortField, setSortField] = useState<keyof Appointment>('FECHA_CITA');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25;

  const handleSort = (field: keyof Appointment) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedCitas = [...citas].sort((a, b) => {
    const valA = String(a[sortField] || '');
    const valB = String(b[sortField] || '');
    return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  const totalPages = Math.ceil(sortedCitas.length / pageSize) || 1;
  const paginatedCitas = sortedCitas.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <th
                  onClick={() => handleSort('FECHA_CITA')}
                  className="p-3 font-semibold cursor-pointer hover:bg-slate-200/60"
                >
                  Fecha / Hora
                </th>
                <th
                  onClick={() => handleSort('pacienteNombreCompleto')}
                  className="p-3 font-semibold cursor-pointer hover:bg-slate-200/60"
                >
                  Paciente & Cédula
                </th>
                <th
                  onClick={() => handleSort('edadNum')}
                  className="p-3 font-semibold cursor-pointer hover:bg-slate-200/60 text-center"
                >
                  Edad / Sexo
                </th>
                <th
                  onClick={() => handleSort('tipoProcedimientoCorto')}
                  className="p-3 font-semibold cursor-pointer hover:bg-slate-200/60"
                >
                  Procedimiento (CUPS)
                </th>
                <th
                  onClick={() => handleSort('epsNormalizada')}
                  className="p-3 font-semibold cursor-pointer hover:bg-slate-200/60"
                >
                  EPS / Asegurador
                </th>
                <th
                  onClick={() => handleSort('municipio')}
                  className="p-3 font-semibold cursor-pointer hover:bg-slate-200/60"
                >
                  Municipio
                </th>
                <th
                  onClick={() => handleSort('oportunidadDias')}
                  className="p-3 font-semibold cursor-pointer hover:bg-slate-200/60 text-center"
                >
                  Oportunidad
                </th>
                <th
                  onClick={() => handleSort('ASISTIO')}
                  className="p-3 font-semibold cursor-pointer hover:bg-slate-200/60 text-center"
                >
                  Asistencia
                </th>
                <th className="p-3 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCitas.map((cita) => (
                <tr key={cita.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 whitespace-nowrap">
                    <div className="font-semibold text-slate-900 font-mono">
                      {cita.FECHA_CITA.substring(0, 4)}-{cita.FECHA_CITA.substring(4, 6)}-{cita.FECHA_CITA.substring(6, 8)}
                    </div>
                    <div className="text-[11px] text-slate-500 capitalize">
                      {cita.DIA_SEM} · {cita.HORA_CITA}
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="font-semibold text-slate-900">{cita.pacienteNombreCompleto}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {cita.TIPO_ID_PACIENTE}: {cita.IDENTIFICACION_PACIENTE}
                    </div>
                  </td>

                  <td className="p-3 text-center whitespace-nowrap">
                    <span className="font-bold text-slate-800">{cita.edadNum}a</span>
                    <span className="text-slate-400 font-medium ml-1">({cita.SEXO_PACIENTE})</span>
                  </td>

                  <td className="p-3">
                    <div className="font-medium text-slate-900">{cita.tipoProcedimientoCorto}</div>
                    <div className="text-[11px] text-slate-400 font-mono">CUPS {cita.CUPS}</div>
                  </td>

                  <td className="p-3">
                    <div className="font-medium text-slate-900 truncate max-w-[160px]" title={cita.epsNormalizada}>
                      {cita.epsNormalizada}
                    </div>
                    <div className="text-[11px] text-slate-500">{cita.regimen}</div>
                  </td>

                  <td className="p-3 text-slate-700 whitespace-nowrap">
                    {cita.municipio}
                  </td>

                  <td className="p-3 text-center whitespace-nowrap font-mono">
                    <span className="font-semibold text-slate-800">{cita.oportunidadDias}</span>
                    <span className="text-slate-400 text-[11px]"> d</span>
                  </td>

                  <td className="p-3 text-center whitespace-nowrap">
                    {cita.ASISTIO === 'SI' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Asistió
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                        <XCircle className="w-3 h-3 text-rose-600" />
                        Inasistencia
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <button
                      onClick={() => setSelectedAppointment(cita)}
                      className="p-1.5 text-slate-500 hover:text-[#d21d1f] hover:bg-[#fff1f2] rounded-lg transition-colors"
                      title="Ver detalle de cita"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Página <strong className="font-bold text-[#162b6f]">{currentPage}</strong> de {totalPages} ({citas.length} registros)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md font-semibold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 relative">
            <button
              onClick={() => setSelectedAppointment(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4 pb-3 border-b border-slate-100">
              <span className="text-[11px] font-bold text-[#d21d1f] uppercase tracking-wider block mb-1">
                Ficha de Procedimiento Cardiovascular · CCICOL
              </span>
              <h3 className="text-lg font-extrabold text-[#162b6f]">
                {selectedAppointment.pacienteNombreCompleto}
              </h3>
              <div className="text-xs text-slate-500 font-mono mt-0.5">
                {selectedAppointment.TIPO_ID_PACIENTE}: {selectedAppointment.IDENTIFICACION_PACIENTE} · {selectedAppointment.edadNum} años ({selectedAppointment.SEXO_PACIENTE})
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-1 flex items-center gap-1 font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-[#162b6f]" /> Fecha & Horario:
                  </span>
                  <div className="font-bold text-[#162b6f]">
                    {selectedAppointment.FECHA_CITA} ({selectedAppointment.DIA_SEM})
                  </div>
                  <div className="text-slate-600 font-medium">{selectedAppointment.HORA_CITA}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-1 flex items-center gap-1 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#d21d1f]" /> Oportunidad:
                  </span>
                  <div className="font-bold text-slate-900">
                    {selectedAppointment.oportunidadDias} días de espera
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Agendada: {selectedAppointment.FECHA_CREACION && selectedAppointment.FECHA_CREACION.length === 8 
                      ? `${selectedAppointment.FECHA_CREACION.substring(6, 8)}/${selectedAppointment.FECHA_CREACION.substring(4, 6)}/${selectedAppointment.FECHA_CREACION.substring(0, 4)}` 
                      : selectedAppointment.FECHA_CREACION}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-1 font-semibold">Procedimiento Clínico (CUPS):</span>
                <div className="font-bold text-[#162b6f] text-sm">
                  {selectedAppointment.DESCRIPCION_CUPS}
                </div>
                <div className="text-[#d21d1f] font-mono mt-0.5 font-semibold">Código CUPS: {selectedAppointment.CUPS}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-1 font-semibold">Asegurador / Entidad:</span>
                  <div className="font-bold text-slate-900">{selectedAppointment.NOMBRE_ENTIDAD}</div>
                  <div className="text-slate-500">{selectedAppointment.NOMBRE_ENTIDAD_FACT}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block mb-1 font-semibold">Estado / Comprobante:</span>
                  <div className="font-semibold text-slate-900 flex items-center gap-1">
                    {selectedAppointment.ASISTIO === 'SI' ? (
                      <span className="text-emerald-700 font-bold">ASISTIÓ</span>
                    ) : (
                      <span className="text-[#d21d1f] font-bold">NO ASISTIÓ</span>
                    )}
                    <span className="text-slate-400 font-normal">· {selectedAppointment.ESTADO_CITA}</span>
                  </div>
                  <div className="text-slate-500 font-mono">Comp: {selectedAppointment.COMPROBANTE || 'N/A'}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-1 flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#162b6f]" /> Ubicación & Contacto:
                </span>
                <div className="text-slate-800 font-medium">{selectedAppointment.DIRECCION_PACIENTE}</div>
                <div className="text-slate-500 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {selectedAppointment.TELEFONO}
                  </span>
                  {selectedAppointment.TELEFONO_2 && (
                    <span>/ {selectedAppointment.TELEFONO_2}</span>
                  )}
                </div>
              </div>

              {selectedAppointment.OBSERVACIONES && (
                <div className="bg-[#f0f4fc] p-3 rounded-lg border border-blue-100">
                  <span className="text-[#162b6f] block mb-0.5 font-bold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> Observaciones Registradas en Sistema:
                  </span>
                  <div className="text-slate-800 font-mono text-[11px]">{selectedAppointment.OBSERVACIONES}</div>
                </div>
              )}
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-2 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                style={{ backgroundColor: '#162b6f' }}
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
