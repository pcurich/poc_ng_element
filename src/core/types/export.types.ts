/**
 * 📋 Export Types
 * 
 * Interfaces y tipos para la exportación/importación de datos.
 * Define la estructura de los archivos JSON exportados por el sistema.
 */

import { IHttpMockData } from '../types/http-mock.types';
import { IDbConfig } from '../types/database.types';

/**
 * Tipo de exportación
 */
export type ExportType = 'mocks' | 'complete-database' | 'manual-config' | 'unknown';

/**
 * Estructura base para datos exportados con firma digital
 */
export interface ExportDataBase {
  /** Tipo de exportación */
  type: ExportType;
  /** Fecha de exportación en formato ISO */
  exportDate: string;
  /** Hash SHA-256 para validación de integridad */
  _hash?: string;
}

/**
 * Estructura de exportación de mocks
 * 
 * @description
 * Exporta solo los mocks HTTP sin configuración de base de datos.
 * Útil para compartir colecciones de mocks entre entornos.
 * 
 * @example
 * ```json
 * {
 *   "type": "mocks",
 *   "exportDate": "2024-11-24T10:30:00.000Z",
 *   "totalMocks": 10,
 *   "mocks": [...],
 *   "_hash": "a1b2c3d4..."
 * }
 * ```
 */
export interface ExportMocksData extends ExportDataBase {
  type: 'mocks';
  /** Número total de mocks exportados */
  totalMocks: number;
  /** Array de mocks HTTP */
  mocks: IHttpMockData[];
}

/**
 * Estructura de exportación completa de base de datos
 * 
 * @description
 * Exporta mocks junto con la configuración de base de datos.
 * Permite restaurar completamente el estado de la aplicación.
 * 
 * @example
 * ```json
 * {
 *   "type": "complete-database",
 *   "exportDate": "2024-11-24T10:30:00.000Z",
 *   "databaseConfig": {
 *     "name": "HttpMocksDB",
 *     "version": 1,
 *     "objectStoreName": "mocks",
 *     "keyPath": "id",
 *     "indexes": [...]
 *   },
 *   "totalMocks": 10,
 *   "mocks": [...],
 *   "_hash": "a1b2c3d4..."
 * }
 * ```
 */
export interface ExportDatabaseData extends ExportDataBase {
  type: 'complete-database';
  /** Configuración de la base de datos */
  databaseConfig: IDbConfig;
  /** Número total de mocks exportados */
  totalMocks: number;
  /** Array de mocks HTTP */
  mocks: IHttpMockData[];
}

/**
 * Union type para cualquier tipo de exportación
 */
export type ExportData = ExportMocksData | ExportDatabaseData;

/**
 * Estructura de configuración manual (sin firma digital)
 * 
 * @description
 * Archivo de configuración cargado manualmente por el usuario.
 * No incluye hash porque puede ser editado directamente.
 */
export interface ManualConfigData {
  /** Contexto seleccionado */
  selectedContext?: any;
  /** Headers HTTP personalizados */
  headers?: Record<string, string>;
  /** Nombre del mock */
  nameMock?: string;
  /** Código de servicio */
  serviceCode?: string;
  /** URL del endpoint */
  url?: string;
  /** Método HTTP */
  httpMethod?: string;
  /** Código de respuesta HTTP */
  httpCodeResponseValue?: number;
  /** Delay en milisegundos */
  delayMs?: number;
  /** Body de respuesta */
  responseBody?: string | any;
}

/**
 * Opciones para crear datos de exportación
 */
export interface CreateExportOptions {
  /** Mocks a exportar */
  mocks: IHttpMockData[];
  /** Configuración de base de datos (solo para complete-database) */
  databaseConfig?: IDbConfig;
}

/**
 * Resultado de operación de importación
 */
export interface ImportResult {
  /** Indica si la importación fue exitosa */
  success: boolean;
  /** Tipo de archivo importado */
  type: ExportType;
  /** Número de mocks importados */
  mocksImported: number;
  /** Mensaje de resultado */
  message: string;
  /** Indica si la firma digital fue validada */
  signatureVerified: boolean;
}

/**
 * Crea estructura de exportación de mocks
 * 
 * @param options - Opciones con los mocks a exportar
 * @returns Objeto con estructura ExportMocksData
 * 
 * @example
 * ```typescript
 * const exportData = createMocksExport({ mocks: allMocks });
 * // exportData listo para agregar hash y descargar
 * ```
 */
export function createMocksExport(options: CreateExportOptions): Omit<ExportMocksData, '_hash'> {
  return {
    type: 'mocks',
    exportDate: new Date().toISOString(),
    totalMocks: options.mocks.length,
    mocks: options.mocks
  };
}

/**
 * Crea estructura de exportación completa de base de datos
 * 
 * @param options - Opciones con mocks y configuración de BD
 * @returns Objeto con estructura ExportDatabaseData
 * @throws Error si no se proporciona databaseConfig
 * 
 * @example
 * ```typescript
 * const exportData = createDatabaseExport({ 
 *   mocks: allMocks,
 *   databaseConfig: config 
 * });
 * // exportData listo para agregar hash y descargar
 * ```
 */
export function createDatabaseExport(options: CreateExportOptions): Omit<ExportDatabaseData, '_hash'> {
  if (!options.databaseConfig) {
    throw new Error('databaseConfig is required for complete-database export');
  }

  return {
    type: 'complete-database',
    exportDate: new Date().toISOString(),
    databaseConfig: options.databaseConfig,
    totalMocks: options.mocks.length,
    mocks: options.mocks
  };
}

/**
 * Type guard para verificar si es exportación de mocks
 */
export function isExportMocksData(data: any): data is ExportMocksData {
  return data && data.type === 'mocks' && Array.isArray(data.mocks);
}

/**
 * Type guard para verificar si es exportación completa
 */
export function isExportDatabaseData(data: any): data is ExportDatabaseData {
  return (
    data &&
    data.type === 'complete-database' &&
    data.databaseConfig &&
    Array.isArray(data.mocks)
  );
}

/**
 * Type guard para verificar si es configuración manual
 */
export function isManualConfigData(data: any): data is ManualConfigData {
  return (
    data &&
    !data.type &&
    (data.selectedContext || data.headers || data.nameMock || data.serviceCode)
  );
}
