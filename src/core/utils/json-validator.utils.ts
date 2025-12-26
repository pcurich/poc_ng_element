import { IDbConfig } from "../types/database.types";
import { ExportType } from "../types/export.types";
import { ValidationResult } from "../types/validation.types";

export function detectExportType(data: any): ExportType {
  if (!data || typeof data !== 'object') {
    return 'unknown';
  }

  if (data.type === 'mocks' && Array.isArray(data.mocks)) {
    return 'mocks';
  }

  if (data.type === 'complete-database' && data.databaseConfig && Array.isArray(data.mocks)) {
    return 'complete-database';
  }

  if (data.selectedContext || data.headers || data.nameMock || data.serviceCode) {
    return 'manual-config';
  }

  return 'unknown';
}

export function hasDigitalSignature(data: any): boolean {
  return !!(data && typeof data === 'object' && typeof data._hash === 'string' && data._hash.length === 64);
}

export function validateMocksExport(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('El archivo no contiene un objeto JSON válido');
    return { isValid: false, type: 'unknown', errors, warnings };
  }

  if (data.type !== 'mocks') {
    errors.push(`Tipo esperado: "mocks", recibido: "${data.type}"`);
  }

  if (!Array.isArray(data.mocks)) {
    errors.push('El campo "mocks" debe ser un array');
  } else if (data.mocks.length === 0) {
    warnings.push('El array de mocks está vacío');
  }

  if (data.exportDate && typeof data.exportDate !== 'string') {
    warnings.push('El campo "exportDate" debe ser una cadena ISO');
  }

  if (data.totalMocks !== undefined && typeof data.totalMocks !== 'number') {
    warnings.push('El campo "totalMocks" debe ser un número');
  }

  return {
    isValid: errors.length === 0,
    type: 'mocks',
    errors,
    warnings
  };
}

export function validateDatabaseExport(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('El archivo no contiene un objeto JSON válido');
    return { isValid: false, type: 'unknown', errors, warnings };
  }

  if (data.type !== 'complete-database') {
    errors.push(`Tipo esperado: "complete-database", recibido: "${data.type}"`);
  }

  if (!data.databaseConfig || typeof data.databaseConfig !== 'object') {
    errors.push('Falta el campo "databaseConfig" o no es un objeto');
  } else {
    const config = data.databaseConfig;

    if (!config.name || typeof config.name !== 'string') {
      errors.push('databaseConfig.name es requerido y debe ser string');
    }

    if (config.version === undefined || typeof config.version !== 'number') {
      errors.push('databaseConfig.version es requerido y debe ser number');
    }

    if (!Array.isArray(config.objectStores)) {
      errors.push('databaseConfig.objectStores es requerido y debe ser un array');
    } else if (config.objectStores.length === 0) {
      errors.push('databaseConfig.objectStores no puede estar vacío');
    }
  }

  if (!Array.isArray(data.mocks)) {
    errors.push('El campo "mocks" debe ser un array');
  } else if (data.mocks.length === 0) {
    warnings.push('El array de mocks está vacío');
  }

  return {
    isValid: errors.length === 0,
    type: 'complete-database',
    errors,
    warnings
  };
}

export function validateDatabaseConfig(config: IDbConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.name || config.name.trim() === '') {
    errors.push('El nombre de la base de datos es requerido');
  }

  if (config.version === undefined || config.version < 1) {
    errors.push('La versión debe ser >= 1');
  }

  if (!Array.isArray(config.objectStores)) {
    errors.push('objectStores es requerido y debe ser un array');
  } else if (config.objectStores.length === 0) {
    errors.push('Debe haber al menos un object store');
  } else {
    config.objectStores.forEach((store, i) => {
      if (!store.name || store.name.trim() === '') {
        errors.push(`Object store ${i}: el nombre es requerido`);
      }
      if (store.indexes && !Array.isArray(store.indexes)) {
        errors.push(`Object store ${i}: los índices deben ser un array`);
      } else if (store.indexes) {
        store.indexes.forEach((index, j) => {
          if (!index.name || index.name.trim() === '') {
            errors.push(`Object store ${i}, índice ${j}: el nombre es requerido`);
          }
          if (!index.keyPath || (typeof index.keyPath === 'string' && index.keyPath.trim() === '') || (Array.isArray(index.keyPath) && index.keyPath.length === 0)) {
            errors.push(`Object store ${i}, índice ${j}: el keyPath es requerido`);
          }
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    type: 'complete-database',
    errors,
    warnings
  };
}

export function validateImportedFile(data: any): ValidationResult {
  const type = detectExportType(data);

  switch (type) {
    case 'mocks':
      return validateMocksExport(data);

    case 'complete-database':
      return validateDatabaseExport(data);

    case 'manual-config':
      return {
        isValid: true,
        type: 'manual-config',
        errors: [],
        warnings: ['Configuración manual sin firma digital']
      };

    default:
      return {
        isValid: false,
        type: 'unknown',
        errors: ['Formato de archivo no reconocido'],
        warnings: []
      };
  }
}
