import { MonthlyDataset } from '../types/clinical';
import { defaultDatasets } from '../data/mockHistoricalMonths';
import { calculateOportunidad } from '../utils/normalizer';

const STORAGE_KEY = 'ccicol_clinical_datasets_v3';
const LEGACY_STORAGE_KEYS = ['ccicol_clinical_datasets_v2', 'ccicol_clinical_datasets_v1'];

export function loadAllDatasets(): Record<string, MonthlyDataset> {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const legacyKey of LEGACY_STORAGE_KEYS) {
        const found = localStorage.getItem(legacyKey);
        if (found) {
          raw = found;
          break;
        }
      }
    }
    if (raw) {
      const parsed: Record<string, MonthlyDataset> = JSON.parse(raw);
      if (Object.keys(parsed).length > 0) {
        // Enforce CCICOL business rules across all datasets:
        // 1. Aseguradores: repetición de la EPS en la columna NOMBRE ENTIDAD FACT
        // 2. Sin número de comprobante válido => inasistencia
        // 3. Oportunidad: diferencia entre FECHA CITA (WWWWYYXX) y agendamiento en OBSERVACIONES (XX/YY/WW)
        Object.values(parsed).forEach((ds) => {
          if (Array.isArray(ds.citas)) {
            ds.citas = ds.citas.map((cita) => {
              const factClean = (cita.NOMBRE_ENTIDAD_FACT || cita.NOMBRE_ENTIDAD || cita.epsNormalizada || 'PARTICULAR')
                .trim()
                .replace(/\s+/g, ' ')
                .toUpperCase();

              const compClean = (cita.COMPROBANTE || '').trim();
              const compUpper = compClean.toUpperCase();
              const hasComp =
                compClean !== '' &&
                compClean !== '0' &&
                compClean !== 'null' &&
                compClean !== 'undefined' &&
                compUpper !== 'N/A' &&
                compUpper !== 'SIN COMPROBANTE' &&
                compUpper !== 'NO TIENE' &&
                compUpper !== 'PENDIENTE' &&
                compUpper !== 'NO';

              const asistio: 'SI' | 'NO' = hasComp ? (cita.ASISTIO === 'SI' ? 'SI' : 'NO') : 'NO';

              const opInfo = calculateOportunidad(cita.FECHA_CITA, cita.OBSERVACIONES, cita.FECHA_CREACION);

              return {
                ...cita,
                NOMBRE_ENTIDAD_FACT: factClean,
                epsNormalizada: factClean,
                ASISTIO: asistio,
                COMPROBANTE: hasComp ? compClean : '',
                ESTADO_CITA: asistio === 'SI' ? (cita.ESTADO_CITA || 'VIGENTE') : 'INASISTENCIA',
                oportunidadDias: opInfo.oportunidadDias,
                FECHA_CREACION: opInfo.fechaAgendamientoIso || cita.FECHA_CREACION,
              };
            });
          }
        });
        saveAllDatasets(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load datasets from localStorage:', err);
  }
  // Initialize with defaults if empty
  saveAllDatasets(defaultDatasets);
  return defaultDatasets;
}

export function saveAllDatasets(datasets: Record<string, MonthlyDataset>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datasets));
  } catch (err) {
    console.error('Failed to save datasets to localStorage:', err);
  }
}

export function saveMonthDataset(dataset: MonthlyDataset): Record<string, MonthlyDataset> {
  const current = loadAllDatasets();
  current[dataset.mesId] = dataset;
  saveAllDatasets(current);
  return current;
}

export function deleteMonthDataset(mesId: string): Record<string, MonthlyDataset> {
  const current = loadAllDatasets();
  delete current[mesId];
  saveAllDatasets(current);
  return current;
}

export function resetToDefaults(): Record<string, MonthlyDataset> {
  saveAllDatasets(defaultDatasets);
  return defaultDatasets;
}
