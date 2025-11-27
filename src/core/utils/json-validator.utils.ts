/**
 * ✅ JSON Validation Utilities
 * 
 * Utilidades para validación de estructuras JSON de exportación.
 * Valida que los archivos importados tengan la estructura correcta
 * para mocks, configuraciones de base de datos, etc.
 */

import { DatabaseConfig } from '../../app/components/interfaces';

/**
 * Tipo de archivo de exportación soportado
 */
export type ExportFileType = 'mocks' | 'complete-database' | 'manual-config' | 'unknown';

/**
 * Resultado de validación de estructura
 */
export interface ValidationResult {
  /** Indica si la estructura es válida */
  isValid: boolean;
  /** Tipo de archivo detectado */
  type: ExportFileType;
  /** Errores encontrados durante la validación */
  errors: string[];
  /** Advertencias (estructura válida pero con campos opcionales faltantes) */
  warnings: string[];
}

/**
 * Detecta el tipo de archivo de exportación
 * 
 * @param data - Objeto parseado del JSON
 * @returns Tipo de archivo detectado
 * 
 * @example
 * ```typescript
 * const data = { type: 'mocks', mocks: [...] };
 * const type = detectExportType(data);
 * // type = 'mocks'
 * ```
 */
export function detectExportType(data: any): ExportFileType {
  if (!data || typeof data !== 'object') {
    return 'unknown';
  }

  // Verificar si es exportación de mocks
  if (data.type === 'mocks' && Array.isArray(data.mocks)) {
    return 'mocks';
  }

  // Verificar si es exportación completa de base de datos
  if (data.type === 'complete-database' && data.databaseConfig && Array.isArray(data.mocks)) {
    return 'complete-database';
  }

  // Verificar si es configuración manual (campos sueltos)
  if (data.selectedContext || data.headers || data.nameMock || data.serviceCode) {
    return 'manual-config';
  }

  return 'unknown';
}

/**
 * Valida si un objeto tiene hash de firma digital
 * 
 * @param data - Objeto a validar
 * @returns true si tiene hash válido
 * 
 * @example
 * ```typescript
 * const hasHash = hasDigitalSignature({ _hash: "abc123...", data: {...} });
 * // true
 * ```
 */
export function hasDigitalSignature(data: any): boolean {
  return !!(data && typeof data === 'object' && typeof data._hash === 'string' && data._hash.length === 64);
}

/**
 * Valida estructura de exportación de mocks
 * 
 * @param data - Objeto a validar
 * @returns Resultado de validación
 * 
 * @example
 * ```typescript
 * const result = validateMocksExport(data);
 * if (result.isValid) {
 *   // Procesar mocks
 * }
 * ```
 */
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

  // Validar campos opcionales
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

/**
 * Valida estructura de exportación completa de base de datos
 * 
 * @param data - Objeto a validar
 * @returns Resultado de validación
 * 
 * @example
 * ```typescript
 * const result = validateDatabaseExport(data);
 * if (result.isValid) {
 *   // Restaurar base de datos
 * }
 * ```
 */
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

  // Validar databaseConfig
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
    
    if (!config.objectStoreName || typeof config.objectStoreName !== 'string') {
      errors.push('databaseConfig.objectStoreName es requerido y debe ser string');
    }
    
    if (!config.keyPath || typeof config.keyPath !== 'string') {
      errors.push('databaseConfig.keyPath es requerido y debe ser string');
    }

    if (config.indexes && !Array.isArray(config.indexes)) {
      warnings.push('databaseConfig.indexes debe ser un array');
    }
  }

  // Validar mocks
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

/**
 * Valida configuración de base de datos
 * 
 * @param config - Configuración a validar
 * @returns Resultado de validación
 * 
 * @example
 * ```typescript
 * const result = validateDatabaseConfig(config);
 * if (!result.isValid) {
 *   console.error(result.errors);
 * }
 * ```
 */
export function validateDatabaseConfig(config: DatabaseConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.name || config.name.trim() === '') {
    errors.push('El nombre de la base de datos es requerido');
  }

  if (config.version === undefined || config.version < 1) {
    errors.push('La versión debe ser >= 1');
  }

  if (!config.objectStoreName || config.objectStoreName.trim() === '') {
    errors.push('El nombre del object store es requerido');
  }

  if (!config.keyPath || config.keyPath.trim() === '') {
    errors.push('El keyPath es requerido');
  }

  if (config.indexes && !Array.isArray(config.indexes)) {
    errors.push('Los índices deben ser un array');
  } else if (config.indexes) {
    config.indexes.forEach((index, i) => {
      if (!index.name || index.name.trim() === '') {
        errors.push(`Índice ${i}: el nombre es requerido`);
      }
      if (!index.keyPath || index.keyPath.trim() === '') {
        errors.push(`Índice ${i}: el keyPath es requerido`);
      }
      if (index.unique === undefined) {
        warnings.push(`Índice ${i}: unique no definido (default: false)`);
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

/**
 * Valida estructura completa de archivo importado
 * 
 * @description
 * Función principal que detecta el tipo y valida según corresponda
 * 
 * @param data - Objeto parseado del JSON
 * @returns Resultado de validación con tipo detectado
 * 
 * @example
 * ```typescript
 * const result = validateImportedFile(data);
 * if (result.isValid) {
 *   switch(result.type) {
 *     case 'mocks':
 *       // Importar mocks
 *       break;
 *     case 'complete-database':
 *       // Restaurar base de datos
 *       break;
 *   }
 * }
 * ```
 */
export function validateImportedFile(data: any): ValidationResult {
  const type = detectExportType(data);

  switch (type) {
    case 'mocks':
      return validateMocksExport(data);
    
    case 'complete-database':
      return validateDatabaseExport(data);
    
    case 'manual-config':
      // Configuración manual no requiere validación estricta
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
