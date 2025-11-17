/**
 * 🔄 Types para gestión de base de datos y migraciones
 * Siguiendo principios SOLID para separación de responsabilidades
 */

/**
 * Función de migración que se ejecuta durante upgrade de DB
 */
export type Migration = (db: IDBDatabase, oldVersion: number, newVersion: number) => void;

/**
 * Configuración de un Object Store
 */
export interface IObjectStoreConfig {
  name: string;
  options?: IDBObjectStoreParameters;
  indexes?: IIndexConfig[];
}

/**
 * Configuración de un índice
 */
export interface IIndexConfig {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

/**
 * Configuración de la base de datos
 */
export interface IDbConfig {
  name: string;
  version: number;
  objectStores: IObjectStoreConfig[];
  migrations?: Migration[];
}

/**
 * Resultado de operación en la base de datos
 */
export interface IDbOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  timestamp: Date;
}

/**
 * Opciones para queries
 */
export interface IQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  direction?: 'next' | 'prev';
}

/**
 * Filtro para consultas
 */
export interface IQueryFilter {
  field: string;
  operator: 'equals' | 'greater' | 'less' | 'between' | 'includes';
  value: any;
}

/**
 * Estados posibles de una transacción
 */
export enum TransactionState {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABORTED = 'aborted',
  ERROR = 'error'
}

/**
 * Contexto de una transacción
 */
export interface ITransactionContext {
  id: string;
  storeName: string;
  mode: IDBTransactionMode;
  state: TransactionState;
  startTime: Date;
  endTime?: Date;
}