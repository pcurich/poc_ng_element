/**
 * 🗃️ Repository Pattern Interface - SOLID Principles
 * 
 * Principios SOLID aplicados:
 * - Interface Segregation: Interfaces específicas para cada operación
 * - Dependency Inversion: Dependencia de abstracciones, no concreciones
 */

import { BaseEntity } from '../entities/base/BaseEntity';
import { ITransactionContext } from '../types/database.types';
import { IQueryOptions, IPaginatedResult } from '../types/repository.types';



/**
 * ⚡ Repository básico - Interface principal
 */
export interface IRepository<TEntity extends BaseEntity<TKey>, TKey = string> {
  // ✨ CRUD Básico
  create(entity: Omit<TEntity, 'id'>): Promise<TEntity>;
  createMany(entities: Omit<TEntity, 'id'>[]): Promise<TEntity[]>;
  
  // 🔍 Consultas
  findById(id: TKey): Promise<TEntity | null>;
  findOne(options?: IQueryOptions<TEntity>): Promise<TEntity | null>;
  findMany(options?: IQueryOptions<TEntity>): Promise<TEntity[]>;
  findAll(): Promise<TEntity[]>;
  
  // 📇 Búsquedas por índice (optimizadas)
  findByIndex(indexName: string, value: any): Promise<TEntity[]>;
  findOneByIndex(indexName: string, value: any): Promise<TEntity | null>;
  findByIndexRange(indexName: string, lowerBound: any, upperBound: any, options?: {
    lowerOpen?: boolean;
    upperOpen?: boolean;
    direction?: 'next' | 'prev';
  }): Promise<TEntity[]>;
  
  // 📊 Paginación
  findPaginated(page: number, pageSize: number, options?: IQueryOptions<TEntity>): Promise<IPaginatedResult<TEntity>>;
  
  // 🔢 Contadores
  count(options?: IQueryOptions<TEntity>): Promise<number>;
  exists(id: TKey): Promise<boolean>;
  
  // 📝 Actualizaciones
  update(id: TKey, changes: Partial<TEntity>): Promise<TEntity | null>;
  updateMany(changes: Partial<TEntity>, options?: IQueryOptions<TEntity>): Promise<number>;
  
  // 🗑️ Eliminación
  delete(id: TKey): Promise<boolean>;
  deleteMany(options?: IQueryOptions<TEntity>): Promise<number>;
  
  // 💾 Utilidades
  save(entity: TEntity): Promise<TEntity>;
  saveMany(entities: TEntity[]): Promise<TEntity[]>;
  
  // 🔄 Transacciones
  executeInTransaction<TResult>(
    operation: (transaction: ITransactionContext) => Promise<TResult>
  ): Promise<TResult>;
}

/**
 * 🗑️ Repository con Soft Delete
 */
export interface ISoftDeletableRepository<TEntity extends BaseEntity<TKey>, TKey = string> 
  extends IRepository<TEntity, TKey> {
  
  // Soft Delete operations
  softDelete(id: TKey): Promise<boolean>;
  softDeleteMany(options?: IQueryOptions<TEntity>): Promise<number>;
  restore(id: TKey): Promise<boolean>;
  restoreMany(options?: IQueryOptions<TEntity>): Promise<number>;
  
  // Queries que incluyen soft deleted
  findWithDeleted(options?: IQueryOptions<TEntity>): Promise<TEntity[]>;
  findDeletedOnly(options?: IQueryOptions<TEntity>): Promise<TEntity[]>;
  countWithDeleted(options?: IQueryOptions<TEntity>): Promise<number>;
  
  // Eliminación permanente
  forceDelete(id: TKey): Promise<boolean>;
  forceDeleteMany(options?: IQueryOptions<TEntity>): Promise<number>;
}

/**
 * 📋 Repository con Auditoría
 */
export interface IAuditableRepository<TEntity extends BaseEntity<TKey>, TKey = string>
  extends ISoftDeletableRepository<TEntity, TKey> {
  
  // Operaciones con contexto de usuario
  createWithAudit(entity: Omit<TEntity, 'id'>, userId: string): Promise<TEntity>;
  updateWithAudit(id: TKey, changes: Partial<TEntity>, userId: string): Promise<TEntity | null>;
  softDeleteWithAudit(id: TKey, userId: string): Promise<boolean>;
  
  // Historial de auditoría
  getHistory(id: TKey): Promise<any[]>; // Implementación futura
  getChangesByUser(userId: string): Promise<TEntity[]>;
}

/**
 * 🏗️ Factory para repositorios
 */
export interface IRepositoryFactory {
  create<TEntity extends BaseEntity<TKey>, TKey = string>(
    entityConstructor: new () => TEntity,
    tableName: string
  ): IRepository<TEntity, TKey>;
  
  createSoftDeletable<TEntity extends BaseEntity<TKey>, TKey = string>(
    entityConstructor: new () => TEntity,
    tableName: string
  ): ISoftDeletableRepository<TEntity, TKey>;
  
  createAuditable<TEntity extends BaseEntity<TKey>, TKey = string>(
    entityConstructor: new () => TEntity,
    tableName: string
  ): IAuditableRepository<TEntity, TKey>;
}