/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { NavTabs, DashboardTab } from './components/NavTabs';
import { FilterToolbar } from './components/FilterToolbar';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { CrossVariableMatrix } from './components/CrossVariableMatrix';
import { MonthComparison } from './components/MonthComparison';
import { DataExplorer } from './components/DataExplorer';
import { PdfUploaderModal } from './components/PdfUploaderModal';
import { FilterState, MonthlyDataset, Appointment } from './types/clinical';
import { loadAllDatasets, saveMonthDataset, deleteMonthDataset, resetToDefaults } from './services/storageService';

const initialFilters: FilterState = {
  search: '',
  procedimientos: [],
  eps: [],
  regimenes: [],
  asistencia: 'ALL',
  sexo: 'ALL',
  gruposEtarios: [],
  diasSemana: [],
  municipios: [],
  estadoCita: 'ALL',
};

export default function App() {
  const [datasets, setDatasets] = useState<Record<string, MonthlyDataset>>(() => loadAllDatasets());
  const [selectedMonthId, setSelectedMonthId] = useState<string>('2026-08');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  // Current dataset
  const currentDataset = datasets[selectedMonthId] || datasets[Object.keys(datasets)[0]];

  // Derived filter options
  const availableProcedures = useMemo(() => {
    if (!currentDataset) return [];
    return Array.from(new Set(currentDataset.citas.map((c) => c.tipoProcedimientoCorto))).sort();
  }, [currentDataset]);

  const availableEps = useMemo(() => {
    if (!currentDataset) return [];
    return Array.from(new Set(currentDataset.citas.map((c) => (c.NOMBRE_ENTIDAD_FACT || c.epsNormalizada).trim()))).filter(Boolean).sort();
  }, [currentDataset]);

  const availableMunicipalities = useMemo(() => {
    if (!currentDataset) return [];
    return Array.from(new Set(currentDataset.citas.map((c) => c.municipio))).sort();
  }, [currentDataset]);

  // Apply filters to current dataset
  const filteredCitas = useMemo(() => {
    if (!currentDataset) return [];
    return currentDataset.citas.filter((c: Appointment) => {
      // Search
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matches =
          c.pacienteNombreCompleto.toLowerCase().includes(query) ||
          c.IDENTIFICACION_PACIENTE.includes(query) ||
          c.TELEFONO.includes(query) ||
          (c.TELEFONO_2 && c.TELEFONO_2.includes(query)) ||
          c.DIRECCION_PACIENTE.toLowerCase().includes(query) ||
          c.DESCRIPCION_CUPS.toLowerCase().includes(query) ||
          c.OBSERVACIONES.toLowerCase().includes(query) ||
          (c.COMPROBANTE && c.COMPROBANTE.includes(query));
        if (!matches) return false;
      }

      // Procedure
      if (filters.procedimientos.length > 0 && !filters.procedimientos.includes(c.tipoProcedimientoCorto)) {
        return false;
      }

      // EPS
      if (filters.eps.length > 0) {
        const citaEps = (c.NOMBRE_ENTIDAD_FACT || c.epsNormalizada || '').trim();
        if (!filters.eps.includes(citaEps) && !filters.eps.includes(c.epsNormalizada)) {
          return false;
        }
      }

      // Attendance
      if (filters.asistencia !== 'ALL' && c.ASISTIO !== filters.asistencia) {
        return false;
      }

      // Sex
      if (filters.sexo !== 'ALL' && c.SEXO_PACIENTE !== filters.sexo) {
        return false;
      }

      // Age groups
      if (filters.gruposEtarios.length > 0 && !filters.gruposEtarios.includes(c.grupoEtario)) {
        return false;
      }

      return true;
    });
  }, [currentDataset, filters]);

  // Handlers
  const handleUpdateFilters = (partial: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const handleSaveDataset = (dataset: MonthlyDataset) => {
    const updated = saveMonthDataset(dataset);
    setDatasets(updated);
    setSelectedMonthId(dataset.mesId);
    setActiveTab('overview');
  };

  const handleDeleteDataset = (mesId: string) => {
    if (Object.keys(datasets).length <= 1) return;
    const updated = deleteMonthDataset(mesId);
    setDatasets(updated);
    if (selectedMonthId === mesId) {
      setSelectedMonthId(Object.keys(updated)[0]);
    }
  };

  const handleResetAllData = () => {
    if (window.confirm('¿Deseas restablecer todos los datos iniciales de CCicol?')) {
      const reset = resetToDefaults();
      setDatasets(reset);
      setSelectedMonthId('2026-08');
      handleResetFilters();
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!filteredCitas.length) return;
    const headers = [
      'FECHA_CITA',
      'DIA_SEM',
      'HORA_CITA',
      'PACIENTE',
      'TIPO_ID',
      'IDENTIFICACION',
      'SEXO',
      'EDAD',
      'GRUPO_ETARIO',
      'CUPS',
      'DESCRIPCION_PROCEDIMIENTO',
      'EPS',
      'REGIMEN',
      'MUNICIPIO',
      'DIRECCION',
      'TELEFONO',
      'ASISTIO',
      'OPORTUNIDAD_DIAS',
      'COMPROBANTE',
      'ESTADO',
      'OBSERVACIONES',
    ];

    const lines = [headers.join(',')];
    filteredCitas.forEach((c) => {
      const row = [
        `"${c.FECHA_CITA}"`,
        `"${c.DIA_SEM}"`,
        `"${c.HORA_CITA}"`,
        `"${c.pacienteNombreCompleto}"`,
        `"${c.TIPO_ID_PACIENTE}"`,
        `"${c.IDENTIFICACION_PACIENTE}"`,
        `"${c.SEXO_PACIENTE}"`,
        `"${c.edadNum}"`,
        `"${c.grupoEtario}"`,
        `"${c.CUPS}"`,
        `"${c.DESCRIPCION_CUPS}"`,
        `"${c.epsNormalizada}"`,
        `"${c.regimen}"`,
        `"${c.municipio}"`,
        `"${c.DIRECCION_PACIENTE.replace(/"/g, '""')}"`,
        `"${c.TELEFONO}"`,
        `"${c.ASISTIO}"`,
        `"${c.oportunidadDias}"`,
        `"${c.COMPROBANTE || ''}"`,
        `"${c.ESTADO_CITA}"`,
        `"${(c.OBSERVACIONES || '').replace(/"/g, '""')}"`,
      ];
      lines.push(row.join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CCICOL_Citas_${currentDataset?.nombreMes || 'Datos'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        datasets={datasets}
        selectedMonthId={selectedMonthId}
        onSelectMonth={(id) => setSelectedMonthId(id)}
        isComparisonMode={activeTab === 'comparison'}
        onToggleComparison={() => setActiveTab(activeTab === 'comparison' ? 'overview' : 'comparison')}
        onOpenUpload={() => setActiveTab('uploader')}
        onExportCsv={handleExportCsv}
        onResetData={handleResetAllData}
      />

      {/* Nav Tabs */}
      <NavTabs
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        recordsCount={filteredCitas.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Multidimensional Filter Toolbar (shown on analytical & data tabs) */}
        {activeTab !== 'comparison' && activeTab !== 'uploader' && (
          <FilterToolbar
            filters={filters}
            onUpdateFilters={handleUpdateFilters}
            onResetFilters={handleResetFilters}
            availableProcedures={availableProcedures}
            availableEps={availableEps}
            availableMunicipalities={availableMunicipalities}
            totalRecords={currentDataset?.citas.length || 0}
            filteredCount={filteredCitas.length}
          />
        )}

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <ExecutiveSummary
            citas={filteredCitas}
            nombreMes={currentDataset?.nombreMes || 'Período'}
          />
        )}

        {activeTab === 'cross' && (
          <CrossVariableMatrix
            citas={filteredCitas}
          />
        )}

        {activeTab === 'comparison' && (
          <MonthComparison
            datasets={datasets}
            defaultMonthA={selectedMonthId}
          />
        )}

        {activeTab === 'explorer' && (
          <DataExplorer
            citas={filteredCitas}
          />
        )}

        {activeTab === 'uploader' && (
          <PdfUploaderModal
            datasets={datasets}
            onSaveDataset={handleSaveDataset}
            onDeleteDataset={handleDeleteDataset}
          />
        )}
      </main>

      {/* Clean Footer adhering to anti-slop rules */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>CCICOL S.A.S</strong> · Centro Cardiovascular de los Llanos
          </div>
          <div className="text-[11px] text-slate-400">
            Médico Especialista: Dr. Oscar Javier Salcedo Valle · Métodos Diagnósticos No Invasivos
          </div>
        </div>
      </footer>
    </div>
  );
}
