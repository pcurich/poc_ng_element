/**
 * 🏗️ BaseRepository - Implementación base del patrón Repository
 * 
 * Principios SOLID aplicados:
 * - S: Responsabilidad única - Gestión de operaciones CRUD genéricas
 * - O: Abierto/Cerrado - Extensible para repositorios específicos
 * - L: Sustitución de Liskov - Puede ser sustituido por implementaciones específicas
 * - I: Interface Segregation - Implementa interfaces específicas
 * - D: Dependency Inversion - Depende de IDbContext (abstracción)
 */

import { BaseEntity } from '../models/BaseEntity';
import { IRepository, IQueryOptions, IPaginatedResult } from './IRepository';
import { IDbContext } from '../context/IDbContext';
import { ITransactionContext, TransactionState } from '../types/database.types';

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

  // ✨ CREATE Operations
  async create(entityData: Omit<TEntity, 'id'>): Promise<TEntity> {
    const entity = new this.entityConstructor(entityData);
    
    // Generar ID si no existe
    if (!entity.id) {
      entity.id = this.generateId() as TKey;
    }

    const now = new Date();
    entity.createdAt = now;
    entity.updatedAt = now;

    // Validar antes de guardar
    const validation = entity.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.dbContext.runTransaction(this.tableName, 'readwrite', (store: IDBObjectStore) => {
      const request = store.add(entity.toPlainObject());
      return new Promise<TEntity>((resolve, reject) => {
        request.onsuccess = () => resolve(entity);
        request.onerror = () => reject(new Error(`Failed to create entity: ${request.error?.message}`));
      });
    });
  }

  async createMany(entitiesData: Omit<TEntity, 'id'>[]): Promise<TEntity[]> {
    return this.executeInTransaction(async (transaction) => {
      const entities: TEntity[] = [];
      
      for (const entityData of entitiesData) {
        const entity = await this.create(entityData);
        entities.push(entity);
      }
      
      return entities;
    });
  }

  // 🔍 READ Operations
  async findById(id: TKey): Promise<TEntity | null> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', (store: IDBObjectStore) => {
      const request = store.get(id);
      return new Promise<TEntity | null>((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            const entity = new this.entityConstructor(result);
            resolve(entity);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => reject(new Error(`Failed to find entity: ${request.error?.message}`));
      });
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
            
            // Aplicar filtros
            if (!options?.filter || this.matchesFilter(entity, options.filter)) {
              entities.push(entity);
            }
            
            cursor.continue();
          } else {
            // Aplicar ordenamiento
            let results = entities;
            if (options?.sortBy) {
              results = this.applySorting(entities, options.sortBy, options.sortDirection);
            }
            
            // Aplicar paginación
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

  // 📇 INDEX-based search operations (optimized for performance)
  async findByIndex(indexName: string, value: any): Promise<TEntity[]> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', (store: IDBObjectStore) => {
      return new Promise<TEntity[]>((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const request = index.getAll(value);
          
          request.onsuccess = () => {
            const results = request.result.map((data: any) => 
              new this.entityConstructor(data)
            );
            resolve(results);
          };

          request.onerror = () => reject(new Error(`Failed to find by index ${indexName}: ${request.error?.message}`));
        } catch (error) {
          reject(new Error(`Index ${indexName} not found in ${this.tableName}`));
        }
      });
    });
  }

  async findOneByIndex(indexName: string, value: any): Promise<TEntity | null> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', (store: IDBObjectStore) => {
      return new Promise<TEntity | null>((resolve, reject) => {
        try {
          const index = store.index(indexName);
          const request = index.get(value);
          
          request.onsuccess = () => {
            if (request.result) {
              resolve(new this.entityConstructor(request.result));
            } else {
              resolve(null);
            }
          };

          request.onerror = () => reject(new Error(`Failed to find by index ${indexName}: ${request.error?.message}`));
        } catch (error) {
          reject(new Error(`Index ${indexName} not found in ${this.tableName}`));
        }
      });
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

  // 🔢 COUNT Operations
  async count(options?: IQueryOptions<TEntity>): Promise<number> {
    return this.dbContext.runTransaction(this.tableName, 'readonly', (store: IDBObjectStore) => {
      return new Promise<number>((resolve, reject) => {
        let count = 0;
        const request = store.openCursor();

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            const entity = new this.entityConstructor(cursor.value);
            
            if (!options?.filter || this.matchesFilter(entity, options.filter)) {
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
    const entity = await this.findById(id);
    return entity !== null;
  }

  // 📝 UPDATE Operations
  async update(id: TKey, changes: Partial<TEntity>): Promise<TEntity | null> {
    const existing = await this.findById(id);
    if (!existing) {
      return null;
    }

    // Aplicar cambios
    Object.assign(existing, changes);
    existing.touch();

    // Validar
    const validation = existing.validate();
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    return this.dbContext.runTransaction(this.tableName, 'readwrite', (store: IDBObjectStore) => {
      const request = store.put(existing.toPlainObject());
      return new Promise<TEntity>((resolve, reject) => {
        request.onsuccess = () => resolve(existing);
        request.onerror = () => reject(new Error(`Failed to update entity: ${request.error?.message}`));
      });
    });
  }

  async updateMany(changes: Partial<TEntity>, options?: IQueryOptions<TEntity>): Promise<number> {
    const entities = await this.findMany(options);
    let updatedCount = 0;

    return this.executeInTransaction(async () => {
      for (const entity of entities) {
        await this.update(entity.id!, changes);
        updatedCount++;
      }
      return updatedCount;
    });
  }

  // 🗑️ DELETE Operations
  async delete(id: TKey): Promise<boolean> {
    return this.dbContext.runTransaction(this.tableName, 'readwrite', (store: IDBObjectStore) => {
      const request = store.delete(id);
      return new Promise<boolean>((resolve, reject) => {
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(new Error(`Failed to delete entity: ${request.error?.message}`));
      });
    });
  }

  async deleteMany(options?: IQueryOptions<TEntity>): Promise<number> {
    const entities = await this.findMany(options);
    let deletedCount = 0;

    return this.executeInTransaction(async () => {
      for (const entity of entities) {
        if (entity.id && await this.delete(entity.id)) {
          deletedCount++;
        }
      }
      return deletedCount;
    });
  }

  // 💾 SAVE Operations
  async save(entity: TEntity): Promise<TEntity> {
    if (entity.id && await this.exists(entity.id)) {
      return (await this.update(entity.id, entity))!;
    } else {
      return await this.create(entity);
    }
  }

  async saveMany(entities: TEntity[]): Promise<TEntity[]> {
    return this.executeInTransaction(async () => {
      const results: TEntity[] = [];
      for (const entity of entities) {
        results.push(await this.save(entity));
      }
      return results;
    });
  }

  // 🔄 TRANSACTION Operations
  async executeInTransaction<TResult>(
    operation: (transaction: ITransactionContext) => Promise<TResult>
  ): Promise<TResult> {
    // Implementación básica - en una implementación real, usarías el contexto de transacción
    // Por ahora, ejecutamos la operación directamente
    const fakeTransaction: ITransactionContext = {
      id: crypto.randomUUID(),
      storeName: this.tableName,
      mode: 'readwrite',
      state: TransactionState.ACTIVE,
      startTime: new Date()
    };
    
    return operation(fakeTransaction);
  }

  // 🛠️ UTILITY Methods
  protected generateId(): string {
    return crypto.randomUUID();
  }

  protected matchesFilter(entity: TEntity, filter: Partial<TEntity> | ((item: TEntity) => boolean)): boolean {
    if (typeof filter === 'function') {
      return filter(entity);
    }

    // Filtro por propiedades
    for (const [key, value] of Object.entries(filter)) {
      if ((entity as any)[key] !== value) {
        return false;
      }
    }

    return true;
  }

  protected applySorting(
    entities: TEntity[], 
    sortBy: keyof TEntity, 
    direction: 'asc' | 'desc' = 'asc'
  ): TEntity[] {
    return entities.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
}