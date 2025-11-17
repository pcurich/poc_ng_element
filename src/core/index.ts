/**
 * 🏗️ IndexedDB ORM - Punto de entrada principal
 * 
 * Sistema de gestión de base de datos siguiendo principios SOLID:
 * - Single Responsibility: Cada clase tiene una responsabilidad específica
 * - Open/Closed: Extensible sin modificar código existente
 * - Liskov Substitution: Las clases derivadas pueden sustituir a las base
 * - Interface Segregation: Interfaces específicas para cada funcionalidad
 * - Dependency Inversion: Dependencias de abstracciones, no concreciones
 */

// 🏗️ Core Context & Database
export { IDbContext } from './context/IDbContext';
export { DbContext } from './context/DbContext';

// 📊 Types & Configuration
export { 
  IDbConfig,
  IObjectStoreConfig,
  IIndexConfig,
  Migration,
  TransactionState,
  ITransactionContext,
  IDbOperationResult
} from './types/database.types';

// 🏷️ Interfaces & Metadata
export {
  IEntityMetadata,
  IPropertyMetadata,
  IIndexMetadata,
  IValidationResult,
  IEntityValidator,
  IPropertyDecorator,
  IValidatorFactory
} from './context/interfaces';

// 🗃️ Base Models
export { BaseEntity, SoftDeletableEntity, AuditableEntity } from './models/BaseEntity';

// 📋 Repository Pattern
export {
  IRepository,
  ISoftDeletableRepository,
  IAuditableRepository,
  IRepositoryFactory,
  IQueryOptions,
  IPaginatedResult
} from './repositories/IRepository';
export { BaseRepository } from './repositories/BaseRepository';

// 📝 Task Domain (Example Implementation)
export { Task, TaskStatus, ITaskData } from './models/Task.entity';
export { TaskRepository, ITaskQueryOptions, ITaskStatistics } from './repositories/TaskRepository';
export { TaskService, ITaskState } from './services/TaskService';

// 🌐 HTTP Mock Domain (New Implementation)
export { HttpMockEntity, HttpMethod, IHttpMockData } from './models/HttpMockEntity';
export { HttpMockRepository, IHttpMockStatistics, IHttpMockSearchOptions } from './repositories/HttpMockRepository';
export { HttpMockService, IHttpMockServiceState, IHttpInterceptionConfig, IHttpInterceptionResult } from './services/HttpMockService';

// Importar tipos para uso interno
import { IDbContext } from './context/IDbContext';
import { DbContext } from './context/DbContext';
import { IDbConfig } from './types/database.types';
import { BaseEntity } from './models/BaseEntity';
import { BaseRepository } from './repositories/BaseRepository';
import { TaskRepository } from './repositories/TaskRepository';
import { HttpMockRepository } from './repositories/HttpMockRepository';

/**
 * 🚀 ORM Factory - Punto de entrada principal para inicializar el sistema
 */
export class ORMFactory {
  /**
   * Crea una instancia del contexto de base de datos
   */
  static createDbContext(config: IDbConfig): IDbContext {
    return new DbContext(config);
  }

  /**
   * Crea un repositorio base para una entidad
   */
  static createRepository<TEntity extends BaseEntity<TKey>, TKey extends IDBValidKey = string>(
    dbContext: IDbContext,
    entityConstructor: new (data?: any) => TEntity,
    tableName: string
  ): BaseRepository<TEntity, TKey> {
    return new BaseRepository(dbContext, entityConstructor, tableName);
  }

  /**
   * Crea un repositorio específico para tareas
   */
  static createTaskRepository(dbContext: IDbContext): TaskRepository {
    return new TaskRepository(dbContext);
  }

  /**
   * Crea un repositorio específico para HTTP Mocks
   */
  static createHttpMockRepository(dbContext: IDbContext): HttpMockRepository {
    return new HttpMockRepository(dbContext);
  }

  /**
   * Configuración por defecto para una base de datos de tareas
   */
  static getDefaultTasksConfig(): IDbConfig {
    return {
      name: 'TasksDB',
      version: 1,
      objectStores: [
        {
          name: 'tasks',
          options: { keyPath: 'id' },
          indexes: [
            { name: 'status', keyPath: 'status' },
            { name: 'priority', keyPath: 'priority' },
            { name: 'assignedTo', keyPath: 'assignedTo' },
            { name: 'dueDate', keyPath: 'dueDate' },
            { name: 'createdAt', keyPath: 'createdAt' },
            { name: 'updatedAt', keyPath: 'updatedAt' }
          ]
        }
      ]
    };
  }

  /**
   * Configuración por defecto para HTTP Mocks
   */
  static getDefaultHttpMocksConfig(): IDbConfig {
    return {
      name: 'HttpMocksDB',
      version: 1,
      objectStores: [
        {
          name: 'httpMocks',
          options: { keyPath: 'id' },
          indexes: [
            { name: 'serviceCode', keyPath: 'serviceCode' },
            { name: 'url', keyPath: 'url' },
            { name: 'method', keyPath: 'method' },
            { name: 'httpCodeResponseValue', keyPath: 'httpCodeResponseValue' },
            { name: 'createdAt', keyPath: 'createdAt' },
            { name: 'updatedAt', keyPath: 'updatedAt' }
          ]
        }
      ]
    };
  }

  /**
   * Configuración completa con Tasks y HTTP Mocks
   */
  static getFullConfig(): IDbConfig {
    return {
      name: 'CompleteCoreDB',
      version: 1,
      objectStores: [
        {
          name: 'tasks',
          options: { keyPath: 'id' },
          indexes: [
            { name: 'status', keyPath: 'status' },
            { name: 'priority', keyPath: 'priority' },
            { name: 'assignedTo', keyPath: 'assignedTo' },
            { name: 'dueDate', keyPath: 'dueDate' },
            { name: 'createdAt', keyPath: 'createdAt' },
            { name: 'updatedAt', keyPath: 'updatedAt' }
          ]
        },
        {
          name: 'httpMocks',
          options: { keyPath: 'id' },
          indexes: [
            { name: 'serviceCode', keyPath: 'serviceCode' },
            { name: 'url', keyPath: 'url' },
            { name: 'method', keyPath: 'method' },
            { name: 'httpCodeResponseValue', keyPath: 'httpCodeResponseValue' },
            { name: 'createdAt', keyPath: 'createdAt' },
            { name: 'updatedAt', keyPath: 'updatedAt' }
          ]
        }
      ]
    };
  }
}

/**
 * 🎯 Ejemplos de uso del ORM:
 * 
 * === Tasks Example ===
 * ```typescript
 * // 1. Crear configuración para Tasks
 * const config = ORMFactory.getDefaultTasksConfig();
 * 
 * // 2. Crear contexto de DB
 * const dbContext = ORMFactory.createDbContext(config);
 * await dbContext.open();
 * 
 * // 3. Crear repositorio
 * const taskRepo = ORMFactory.createTaskRepository(dbContext);
 * 
 * // 4. Usar el repositorio
 * const task = await taskRepo.create({
 *   title: 'Mi primera tarea',
 *   description: 'Descripción de la tarea',
 *   status: TaskStatus.PENDING,
 *   priority: 1
 * });
 * 
 * // 5. O usar el servicio con Angular Signals
 * const taskService = new TaskService();
 * await taskService.initialize();
 * ```
 * 
 * === HTTP Mocks Example ===
 * ```typescript
 * // 1. Configuración para HTTP Mocks
 * const config = ORMFactory.getDefaultHttpMocksConfig();
 * const dbContext = ORMFactory.createDbContext(config);
 * await dbContext.open();
 * 
 * // 2. Crear repositorio y servicio
 * const mockRepo = ORMFactory.createHttpMockRepository(dbContext);
 * const mockService = new HttpMockService();
 * await mockService.initialize(mockRepo);
 * 
 * // 3. Crear mock HTTP
 * const newMock = await mockService.createMock({
 *   serviceCode: 'userService',
 *   url: '/api/users/:id',
 *   method: 'GET',
 *   httpCodeResponseValue: 200,
 *   delayMs: 100,
 *   responseBody: '{"id": 1, "name": "John Doe"}'
 * });
 * 
 * // 4. Usar búsquedas por índice (optimizadas)
 * const userServiceMocks = await mockRepo.findByServiceCode('userService');
 * const getMocks = await mockRepo.findByMethod('GET');
 * 
 * // 5. Interceptar peticiones HTTP
 * const result = await mockService.interceptRequest('/api/users/123', 'GET');
 * if (result.intercepted && result.response) {
 *   // Usar respuesta mockeada
 *   console.log('Response:', result.response.body);
 * }
 * ```
 * 
 * === Full Configuration Example ===
 * ```typescript
 * // Base de datos completa con Tasks y HTTP Mocks
 * const fullConfig = ORMFactory.getFullConfig();
 * const dbContext = ORMFactory.createDbContext(fullConfig);
 * await dbContext.open();
 * 
 * // Ambos repositorios en la misma DB
 * const taskRepo = ORMFactory.createTaskRepository(dbContext);
 * const mockRepo = ORMFactory.createHttpMockRepository(dbContext);
 * ```
 */

export default ORMFactory;