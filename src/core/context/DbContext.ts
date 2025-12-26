import { IDbContext } from './IDbContext';
import { IDbConfig, TransactionState, ITransactionContext, ITransactionStats } from '../types/database.types';
import { generateTransactionId } from '../utils/id.utils';
import { getCurrentTimestamp } from '../utils/date.utils';
import { delay, promiseFromRequest } from '../utils/async.utils';

/**
 * 🗄️ DbContext - Implementación concreta de IDbContext
 * 
 * Principios SOLID aplicados:
 * - S: Una sola responsabilidad - Gestión de conexión y transacciones IndexedDB
 * - O: Abierto/Cerrado - Extensible mediante herencia y configuración
 * - L: Sustitución de Liskov - Implementa completamente IDbContext
 * - I: Segregación de interfaces - Implementa solo la interface necesaria
 * - D: Inversión de dependencias - Acepta configuración externa
 */

export class DbContext implements IDbContext {
  private dbPromise: Promise<void> | null = null;
  private dbInstance: IDBDatabase | null = null;
  private config: IDbConfig;
  private isConnectionOpen = false;
  private activeTransactions = new Map<string, ITransactionContext>();

  constructor(config: IDbConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.name || this.config.name.trim().length === 0) {
      throw new Error('Database name is required');
    }
    if (this.config.version < 1) {
      throw new Error('Database version must be >= 1');
    }
    if (!this.config.objectStores || this.config.objectStores.length === 0) {
      throw new Error('At least one object store must be defined');
    }
  }

  async open(): Promise<void> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || this.config.version;

        try {
          this.handleUpgrade(db, oldVersion, newVersion);

          // Ejecutar migraciones personalizadas
          if (this.config.migrations) {
            for (const migration of this.config.migrations) {
              migration(db, oldVersion, newVersion);
            }
          }
        } catch (error) {
          console.error('❌ Error during database upgrade:', error);
          reject(error);
        }
      };

      request.onsuccess = () => {
        this.dbInstance = request.result;
        this.isConnectionOpen = true;

        // Manejar cambios de versión cuando la DB está abierta
        this.dbInstance.onversionchange = () => {
          console.warn('⚠️ Database version changed, closing connection');
          this.safeClose();
        };

        // Manejar errores no controlados
        this.dbInstance.onerror = (event) => {
          console.error('❌ Database error:', event);
        };

        console.log(`✅ Database "${this.config.name}" opened successfully (v${this.config.version})`);
        resolve();
      };

      request.onerror = () => {
        const error = request.error || new Error('Failed to open IndexedDB');
        console.error('❌ Failed to open database:', error);
        reject(error);
      };

      request.onblocked = () => {
        console.warn('⚠️ Database opening blocked. Close other tabs/windows.');
      };
    });

    return this.dbPromise;
  }

  private handleUpgrade(db: IDBDatabase, oldVersion: number, newVersion: number): void {
    console.log(`🔄 Upgrading database from v${oldVersion} to v${newVersion}`);

    // Crear object stores definidos en la configuración
    for (const storeConfig of this.config.objectStores) {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        const store = db.createObjectStore(storeConfig.name, storeConfig.options);

        // Crear índices si están definidos
        if (storeConfig.indexes) {
          for (const indexConfig of storeConfig.indexes) {
            store.createIndex(indexConfig.name, indexConfig.keyPath, indexConfig.options);
          }
        }

        console.log(`📁 Created object store: ${storeConfig.name}`);
      }
    }
  }

  async getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      try {
        await this.open();
      } catch (error) {
        throw new Error('Database instance not available');
      }
    }
    if (this.dbInstance && this.isConnectionOpen) return this.dbInstance;

    // Caso edge - debería ser muy raro
    throw new Error('Database instance not available');
  }

  async runTransaction<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest | Promise<any> | void): Promise<T> {
    const db = await this.getDB();

    // Verificar que el store existe
    if (!db.objectStoreNames.contains(storeName)) {
      throw new Error(`Object store "${storeName}" does not exist`);
    }

    const transactionId = generateTransactionId();
    const transactionContext: ITransactionContext = {
      id: transactionId,
      storeName,
      mode,
      state: TransactionState.PENDING,
      startTime: new Date()
    };

    this.activeTransactions.set(transactionId, transactionContext);

    try {
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);

      transactionContext.state = TransactionState.ACTIVE;

      // Configurar event listeners para la transacción
      const transactionPromise = new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => {
          transactionContext.state = TransactionState.COMPLETED;
          transactionContext.endTime = new Date();
          resolve();
        };

        transaction.onabort = () => {
          transactionContext.state = TransactionState.ABORTED;
          transactionContext.endTime = new Date();
          reject(transaction.error || new Error('Transaction aborted'));
        };

        transaction.onerror = () => {
          transactionContext.state = TransactionState.ERROR;
          transactionContext.endTime = new Date();
          reject(transaction.error || new Error('Transaction error'));
        };
      });

      // Ejecutar la función del usuario
      const operationResult = fn(store);

      // Manejar diferentes tipos de resultado
      if (operationResult instanceof IDBRequest || (operationResult && typeof (operationResult as any).onsuccess === 'function')) {
        // Es un IDBRequest
        const requestPromise = promiseFromRequest(operationResult as IDBRequest);
        const [result] = await Promise.all([requestPromise, transactionPromise]);
        return result as T;
      }

      if (operationResult instanceof Promise) {
        // Es una Promise
        const [result] = await Promise.all([operationResult, transactionPromise]);
        return result as T;
      }

      // No retorna nada específico, esperar solo la transacción
      await transactionPromise;
      return operationResult as T;

    } catch (error) {
      transactionContext.state = TransactionState.ERROR;
      transactionContext.endTime = new Date();
      console.error(`❌ Transaction failed for store "${storeName}":`, error);
      throw error;
    } finally {
      this.activeTransactions.delete(transactionId);
    }
  }




  getDatabaseName(): string {
    return this.config.name;
  }

  getVersion(): number {
    return this.config.version;
  }

  async close(): Promise<void> {

    if (this.dbInstance && this.isConnectionOpen) {
      // Esperar que terminen las transacciones activas
      if (this.activeTransactions.size > 0) {
        console.warn(`⚠️ Closing database with ${this.activeTransactions.size} active transactions`);
      }

      this.dbInstance.close();
      this.dbInstance = null;
      this.isConnectionOpen = false;
      this.dbPromise = null;
      this.activeTransactions.clear();

      console.log(`🔒 Database "${this.config.name}" closed`);
    }
  }

  async safeClose(): Promise<void> {
    const stats = this.getTransactionStats();

    if (stats.active > 0) {
      console.warn(`⚠️ Waiting for ${stats.active} active transactions...`);

      // Esperar hasta que terminen
      await this.waitForTransactions();
    }

    await this.close();
  }

  private async waitForTransactions(maxWaitMs = 5000): Promise<void> {
    const start = getCurrentTimestamp();
    while (this.getTransactionStats().active > 0) {
      if (getCurrentTimestamp() - start > maxWaitMs) {
        throw new Error('Timeout waiting for transactions');
      }
      await delay(100);
    }
  }

  isOpen(): boolean {
    return this.isConnectionOpen && this.dbInstance !== null;
  }

  /**
   * Obtiene estadísticas de transacciones activas (útil para debugging)
   */
  getTransactionStats(): ITransactionStats {
    const states = {
      [TransactionState.PENDING]: 0,
      [TransactionState.ACTIVE]: 0,
      [TransactionState.COMPLETED]: 0,
      [TransactionState.ABORTED]: 0,
      [TransactionState.ERROR]: 0
    };

    for (const tx of this.activeTransactions.values()) {
      states[tx.state]++;
    }

    return {
      active: this.activeTransactions.size,
      states
    };
  }
}