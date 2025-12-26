import { BaseEntity } from '../entities/base/BaseEntity';
import { IRepository } from './IRepository';
import { IDbContext } from '../context/IDbContext';
import { ITransactionContext, TransactionState } from '../types/database.types';
import { IQueryOptions, IPaginatedResult } from '../types/repository.types';
import { generateUUID } from '../utils/id.utils';
import { filterByPredicate, sortBy } from '../utils/collection.utils';
import { promiseFromRequest } from '../utils/async.utils';

export class BaseRepository<TEntity extends BaseEntity<TKey>, TKey extends IDBValidKey = string>
  implements IRepository<TEntity, TKey> {

  protected readonly tableName: string;
  protected readonly entityConstructor: new (data?: any) => TEntity;

  constructor(
    protected readonly dbContext: IDbContext,
    entityConstructor: new (data?: any) => TEntity,
    tableName: string
  ) {
    this.entityConstructor = entityConstructor;
    this.tableName = tableName;
  }

  public getDbContext(): IDbContext {
    return this.dbContext;
  }

  // ==========================================================================
  // ✨ CREATE OPERATIONS - Public & Internal versions
  // ==========================================================================

  async create(entityData: Omit<TEntity, 'id'>): Promise<TEntity> {
    return this.dbContext.runTransaction(this.tableName, 'readwrite', (store: IDBObjectStore) => {
      return this._createInternal(entityData, store);
    });
  }

  private async _createInternal(entityData: Omit<TEntity, 'id'>, store: IDBObjectStore): Promise<TEntity> {
    const entity = new this.entityConstructor(entityData);

    if (!entity.id) {
      entity.id = generateUUID() as TKey;
    }

    entity.touch();

    const validation = entity.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const request = store.add(entity.toPlainObject());
    await promiseFromRequest(request);
    
    return entity;
  }

  async createMany(entitiesData: Omit<TEntity, 'id'>[]): Promise<TEntity[]> {
    return this.dbContext.runTransaction(this.tableName, 'readwrite', async (store: IDBObjectStore) => {
      const entities: TEntity[] = [];

      for (const entityData of entitiesData) {
        const entity = await this._createInternal(entityData, store);
        entities.push(entity);
      }

      return entities;
    });
  }

  // ==========================================================================
  // 🔍 READ OPERATIONS
  // ==========================================================================

  async findById(id: TKey): Promise<TEntity | null> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', async (store: IDBObjectStore) => {
      const request = store.get(id);
      const result = await promiseFromRequest<any>(request);
      
      if (result) {
        return new this.entityConstructor(result);
      }
      
      return null;
    });
  }

  async findOne(options?: IQueryOptions<TEntity>): Promise<TEntity | null> {
    const results = await this.findMany({ ...options, limit: 1 });
    return results.length > 0 ? results[0] : null;
  }

  async findMany(options?: IQueryOptions<TEntity>): Promise<TEntity[]> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', (store: IDBObjectStore) => {
      return new Promise<TEntity[]>((resolve, reject) => {
        const entities: TEntity[] = [];
        const request = store.openCursor();

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const entity = new this.entityConstructor(cursor.value);
            if (!options?.filter || filterByPredicate<TEntity>([entity], options.filter)) {
              entities.push(entity);
            }
            cursor.continue();
          } else {
            let results = entities;
            if (options?.sortBy) {
              results = sortBy<TEntity>(entities, options.sortBy, options.sortDirection);
            }

            if (options?.offset || options?.limit) {
              const offset = options.offset || 0;
              const limit = options.limit;
              results = results.slice(offset, limit ? offset + limit : undefined);
            }

            resolve(results);
          }
        };

        request.onerror = () => reject(new Error(`Failed to find entities: ${request.error?.message}`));
      });
    });
  }

  async findAll(): Promise<TEntity[]> {
    return this.findMany();
  }

  // ==========================================================================
  // 📇 INDEX-BASED SEARCH OPERATIONS
  // ==========================================================================

  async findByIndex(indexName: string, value: any): Promise<TEntity[]> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', async (store: IDBObjectStore) => {
      try {
        const index = store.index(indexName);
        const request = index.getAll(value);
        const results = await promiseFromRequest<any[]>(request);
        
        return results.map((data: any) => new this.entityConstructor(data));
      } catch (error) {
        throw new Error(`Index ${indexName} not found in ${this.tableName}`);
      }
    });
  }

  async findOneByIndex(indexName: string, value: any): Promise<TEntity | null> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', async (store: IDBObjectStore) => {
      try {
        const index = store.index(indexName);
        const request = index.get(value);
        const result = await promiseFromRequest<any>(request);
        
        return result ? new this.entityConstructor(result) : null;
      } catch (error) {
        throw new Error(`Index ${indexName} not found in ${this.tableName}`);
      }
    });
  }

  async findByIndexRange(
    indexName: string,
    lowerBound: any,
    upperBound: any,
    options?: {
      lowerOpen?: boolean;
      upperOpen?: boolean;
      direction?: 'next' | 'prev';
    }
  ): Promise<TEntity[]> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', (store: IDBObjectStore) => {
      return new Promise<TEntity[]>((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const range = IDBKeyRange.bound(
            lowerBound,
            upperBound,
            options?.lowerOpen || false,
            options?.upperOpen || false
          );

          const results: TEntity[] = [];
          const direction = options?.direction || 'next';
          const request = index.openCursor(range, direction);

          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              const entity = new this.entityConstructor(cursor.value);
              results.push(entity);
              cursor.continue();
            } else {
              resolve(results);
            }
          };

          request.onerror = () => reject(new Error(`Failed to find by index range ${indexName}: ${request.error?.message}`));
        } catch (error) {
          reject(new Error(`Index ${indexName} not found in ${this.tableName}`));
        }
      });
    });
  }

  // ==========================================================================
  // 📊 PAGINATION
  // ==========================================================================

  async findPaginated(
    page: number,
    pageSize: number,
    options?: IQueryOptions<TEntity>
  ): Promise<IPaginatedResult<TEntity>> {
    const offset = (page - 1) * pageSize;
    const total = await this.count(options);

    const items = await this.findMany({
      ...options,
      offset,
      limit: pageSize
    });

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  // ==========================================================================
  // 🔢 COUNT OPERATIONS
  // ==========================================================================

  async count(options?: IQueryOptions<TEntity>): Promise<number> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', (store: IDBObjectStore) => {
      return new Promise<number>((resolve, reject) => {
        // Si no hay filtros, usar count() optimizado
        if (!options?.filter) {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(new Error(`Failed to count entities: ${request.error?.message}`));
          return;
        }

        // Con filtros, iterar con cursor
        let count = 0;
        const request = store.openCursor();

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const entity = new this.entityConstructor(cursor.value);

            if (filterByPredicate<TEntity>([entity], options.filter!)) {
              count++;
            }

            cursor.continue();
          } else {
            resolve(count);
          }
        };

        request.onerror = () => reject(new Error(`Failed to count entities: ${request.error?.message}`));
      });
    });
  }

  async exists(id: TKey): Promise<boolean> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', async (store: IDBObjectStore) => {
      const request = store.count(id);
      const count = await promiseFromRequest<number>(request);
      return count > 0;
    });
  }

  // ==========================================================================
  // 📝 UPDATE OPERATIONS - Public & Internal versions
  // ==========================================================================

  async update(id: TKey, changes: Partial<TEntity>): Promise<TEntity | null> {
    return this.dbContext.runTransaction(this.tableName, 'readwrite', async (store: IDBObjectStore) => {
      return this._updateInternal(id, changes, store);
    });
  }

  private async _updateInternal(
    id: TKey, 
    changes: Partial<TEntity>, 
    store: IDBObjectStore
  ): Promise<TEntity | null> {

    const getRequest = store.get(id);
    const existingData = await promiseFromRequest<any>(getRequest);
    
    if (!existingData) {
      return null;
    }

    const existing = new this.entityConstructor(existingData);

    // Aplicar cambios
    Object.assign(existing, changes);
    existing.touch();

    // Validar
    const validation = existing.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const putRequest = store.put(existing.toPlainObject());
    await promiseFromRequest(putRequest);
    
    return existing;
  }

  async updateMany(changes: Partial<TEntity>, options?: IQueryOptions<TEntity>): Promise<number> {
    const entities = await this.findMany(options);
    
    return this.dbContext.runTransaction(this.tableName, 'readwrite', async (store: IDBObjectStore) => {
      let updatedCount = 0;

      for (const entity of entities) {
        if (entity.id) {
          await this._updateInternal(entity.id, changes, store);
          updatedCount++;
        }
      }

      return updatedCount;
    });
  }

  // ==========================================================================
  // 🗑️ DELETE OPERATIONS - Public & Internal versions
  // ==========================================================================

  async delete(id: TKey): Promise<boolean> {
    return this.dbContext.runTransaction(this.tableName, 'readwrite', async (store: IDBObjectStore) => {
      return this._deleteInternal(id, store);
    });
  }

  private async _deleteInternal(id: TKey, store: IDBObjectStore): Promise<boolean> {
    const request = store.delete(id);
    await promiseFromRequest(request);
    return true;
  }

  async deleteMany(options?: IQueryOptions<TEntity>): Promise<number> {
    const entities = await this.findMany(options);
    
    return this.dbContext.runTransaction(this.tableName, 'readwrite', async (store: IDBObjectStore) => {
      let deletedCount = 0;

      for (const entity of entities) {
        if (entity.id) {
          await this._deleteInternal(entity.id, store);
          deletedCount++;
        }
      }

      return deletedCount;
    });
  }

  async clearAll(): Promise<void> {
    return this.dbContext.runTransaction(this.tableName, 'readwrite', async (store: IDBObjectStore) => {
      const request = store.clear();
      await promiseFromRequest(request);
    });
  }

  // ==========================================================================
  // 💾 SAVE OPERATIONS
  // ==========================================================================

  async save(entity: TEntity): Promise<TEntity> {
    return this.dbContext.runTransaction(this.tableName, 'readwrite', async (store: IDBObjectStore) => {
      if (entity.id) {
        // Verificar si existe
        const countRequest = store.count(entity.id);
        const count = await promiseFromRequest<number>(countRequest);
        
        if (count > 0) {
          return (await this._updateInternal(entity.id, entity, store))!;
        }
      }

      return await this._createInternal(entity, store);
    });
  }

  async saveMany(entities: TEntity[]): Promise<TEntity[]> {
    return this.dbContext.runTransaction(this.tableName, 'readwrite', async (store: IDBObjectStore) => {
      const results: TEntity[] = [];
      
      for (const entity of entities) {
        if (entity.id) {
          const countRequest = store.count(entity.id);
          const count = await promiseFromRequest<number>(countRequest);
          
          if (count > 0) {
            const updated = await this._updateInternal(entity.id, entity, store);
            results.push(updated!);
          } else {
            const created = await this._createInternal(entity, store);
            results.push(created);
          }
        } else {
          const created = await this._createInternal(entity, store);
          results.push(created);
        }
      }
      
      return results;
    });
  }

  // ==========================================================================
  // 🔄 TRANSACTION OPERATIONS
  // ==========================================================================

  /**
   * Executes a custom operation within a transaction
   * Note: Use this for complex multi-step operations that need atomicity
   */
  async executeInTransaction<TResult>(
    operation: (transaction: ITransactionContext) => Promise<TResult>
  ): Promise<TResult> {
    return this.dbContext.runTransaction<TResult>(
      this.tableName,
      'readwrite',
      async (store: IDBObjectStore) => {
        const idbTransaction = store.transaction;

        const transactionContext: ITransactionContext = {
          id: generateUUID(),
          storeName: this.tableName,
          mode: 'readwrite',
          state: TransactionState.ACTIVE,
          startTime: new Date()
        };

        try {
          const result = await operation(transactionContext);
          transactionContext.state = TransactionState.COMPLETED;
          transactionContext.endTime = new Date();
          return result;
        } catch (error) {
          transactionContext.state = TransactionState.ERROR;
          transactionContext.endTime = new Date();
          throw error;
        }
      }
    );
  }
}