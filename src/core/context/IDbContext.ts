/**
 * 🗄️ IDbContext - Abstracción principal para gestión de IndexedDB
 * 
 * Siguiendo principios SOLID:
 * - S: Responsabilidad única - Solo maneja conexión y transacciones DB
 * - I: Interface Segregation - Interface específica para operaciones de contexto DB
 * - D: Dependency Inversion - Permite inyección de implementaciones concretas
 */

import { ITransactionStats } from "../types/database.types";

export interface IDbContext {
  /**
   * Abre la conexión a la base de datos IndexedDB
   * @returns Promise que resuelve cuando la DB está lista
   */
  open(): Promise<void>;

  /**
   * Obtiene la instancia de la base de datos IndexedDB
   * @returns Promise que resuelve con la instancia IDBDatabase
   */
  getDB(): Promise<IDBDatabase>;

  /**
   * Ejecuta una transacción en un object store específico
   * @template T Tipo de resultado esperado
   * @param storeName Nombre del object store
   * @param mode Modo de transacción ('readonly' | 'readwrite')
   * @param fn Función que ejecuta operaciones en el store
   * @returns Promise que resuelve con el resultado de tipo T
   */
  runTransaction<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest | Promise<any> | void): Promise<T>;

  /**
   * Obtiene el nombre de la base de datos
   * @returns Nombre de la base de datos
   */
  getDatabaseName(): string;

  /**
   * Obtiene la versión actual de la base de datos
   * @returns Versión de la base de datos
   */
  getVersion(): number;

  /**
   * Cierra la conexión a la base de datos
   * @returns Promise que resuelve cuando se cierra correctamente
   */
  close(): Promise<void>;

  /**
   * Verifica si la base de datos está abierta
   * @returns true si la DB está abierta, false en caso contrario
   */
  isOpen(): boolean;

  /**
   * Obtiene estadísticas de transacciones activas (útil para debugging y monitoreo)
   * @returns Estadísticas con número de transacciones activas y su distribución por estado
   */
  getTransactionStats(): ITransactionStats;
}