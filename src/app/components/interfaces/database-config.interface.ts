import { IDbConfig } from '../../../core';

/**
 * 🛠️ Interfaces para configuración de base de datos
 * 
 * Contiene las interfaces relacionadas con la configuración
 * inicial de la base de datos IndexedDB.
 */

/**
 * Configuración de base de datos para el formulario inicial
 */
export interface DatabaseConfig {
  name: string;
  version: number;
  objectStoreName: string;
  keyPath: string;
  indexes: DatabaseIndex[];
}

/**
 * Configuración de índice de base de datos
 */
export interface DatabaseIndex {
  name: string;
  keyPath: string;
  unique?: boolean;
}

/**
 * Estado de la base de datos
 */
export interface DatabaseStatus {
  exists: boolean;
  isInitialized: boolean;
  config?: IDbConfig;
  error?: string;
}