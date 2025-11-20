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
export { ServiceCodeWithStats } from './types/service-code-stats.types';

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

// 🌐 HTTP Mock Domain (New Implementation)
export { HttpMockEntity, HttpMethod, IHttpMockData } from './models/HttpMockEntity';
export { HttpMockRepository, IHttpMockStatistics, IHttpMockSearchOptions } from './repositories/HttpMockRepository';
export { HttpMockService, IHttpMockServiceState, IHttpInterceptionConfig, IHttpInterceptionResult, ICleanupOptions } from './services/HttpMockService';

// 📦 Standalone Providers (Modern Angular Pattern)
export { 
  provideHttpMockService,
  provideHttpMockORM,
  provideHttpMockORMConfig,
  HttpMockORMConfig
} from './providers';

// Importar tipos para uso interno
import { IDbContext } from './context/IDbContext';
import { DbContext } from './context/DbContext';
import { IDbConfig } from './types/database.types';
import { BaseEntity } from './models/BaseEntity';
import { BaseRepository } from './repositories/BaseRepository';
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
   * Crea un repositorio específico para HTTP Mocks
   */
  static createHttpMockRepository(dbContext: IDbContext): HttpMockRepository {
    return new HttpMockRepository(dbContext);
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

  // === Singleton instances for database context ===
  private static dbContextInstance: IDbContext | null = null;
  private static httpMockRepositoryInstance: HttpMockRepository | null = null;

  /**
   * Establece y obtiene la conexión a la base de datos (singleton)
   * Se conecta automáticamente a HttpMocksDB con la configuración por defecto
   */
  static async getDbContext(): Promise<IDbContext> {
    if (!this.dbContextInstance) {
      const config = this.getDefaultHttpMocksConfig();
      this.dbContextInstance = this.createDbContext(config);
      await this.dbContextInstance.open();
    }
    return this.dbContextInstance;
  }

  /**
   * Obtiene el repositorio de HTTP Mocks (singleton)
   * Establece automáticamente la conexión a la base de datos si no existe
   */
  static async getHttpMockRepository(): Promise<HttpMockRepository> {
    if (!this.httpMockRepositoryInstance) {
      const dbContext = await this.getDbContext();
      this.httpMockRepositoryInstance = this.createHttpMockRepository(dbContext);
    }
    return this.httpMockRepositoryInstance;
  }

  /**
   * Busca mocks HTTP por código de servicio (usando índice optimizado)
   * @param serviceCode Código del servicio a buscar
   * @returns Array de mocks que coinciden con el serviceCode
   * 
   * @example
   * ```typescript
   * const mocks = await ORMFactory.findMocksByServiceCode('userService');
   * console.log(`Found ${mocks.length} mocks for userService`);
   * ```
   */
  static async findMocksByServiceCode(serviceCode: string): Promise<import('./models/HttpMockEntity').IHttpMockData[]> {
    try {
      const repository = await this.getHttpMockRepository();
      const entities = await repository.findByServiceCode(serviceCode);
      return entities.map(entity => entity.toPlainObject());
    } catch (error) {
      console.error(`Error finding mocks by serviceCode "${serviceCode}":`, error);
      throw error;
    }
  }

  /**
   * Busca mocks HTTP por URL (usando índice optimizado)
   * @param url URL exacta a buscar
   * @returns Array de mocks que coinciden con la URL
   * 
   * @example
   * ```typescript
   * const mocks = await ORMFactory.findMocksByUrl('/api/users/:id');
   * console.log(`Found ${mocks.length} mocks for /api/users/:id`);
   * ```
   */
  static async findMocksByUrl(url: string): Promise<import('./models/HttpMockEntity').IHttpMockData[]> {
    try {
      const repository = await this.getHttpMockRepository();
      const entities = await repository.findByUrl(url);
      return entities.map(entity => entity.toPlainObject());
    } catch (error) {
      console.error(`Error finding mocks by url "${url}":`, error);
      throw error;
    }
  }

  /**
   * Cierra la conexión a la base de datos y libera recursos
   * Útil para limpieza en tests o cuando se termina de usar la librería
   */
  static async closeDbContext(): Promise<void> {
    if (this.dbContextInstance) {
      await this.dbContextInstance.close();
      this.dbContextInstance = null;
      this.httpMockRepositoryInstance = null;
    }
  }

}

/**
 * 🎯 Ejemplos de uso del ORM:
 * 
 * === Simple Library Usage (Recommended for Sandbox Projects) ===
 * ```typescript
 * import { ORMFactory, IHttpMockData } from '@your-package/core';
 * 
 * // 1. Buscar mocks por serviceCode (conexión automática)
 * const userMocks: IHttpMockData[] = await ORMFactory.findMocksByServiceCode('userService');
 * console.log('Found mocks:', userMocks);
 * 
 * // 2. Buscar mocks por URL (conexión automática)
 * const apiMocks: IHttpMockData[] = await ORMFactory.findMocksByUrl('/api/users/:id');
 * console.log('Found mocks for URL:', apiMocks);
 * 
 * // 3. Usar los mocks en tu aplicación
 * if (userMocks.length > 0) {
 *   const mock = userMocks[0];
 *   console.log('Mock response:', mock.responseBody);
 *   console.log('Status code:', mock.httpCodeResponseValue);
 * }
 * 
 * // 4. Limpiar conexión cuando termines (opcional)
 * await ORMFactory.closeDbContext();
 * ```
 * 
 * === Advanced Usage with Manual Context ===
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
 * === Integration with HTTP Interceptors ===
 * ```typescript
 * import { ORMFactory } from '@your-package/core';
 * 
 * // En tu interceptor HTTP
 * async intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
 *   const serviceCode = req.headers.get('X-Service-Code');
 *   
 *   if (serviceCode) {
 *     const mocks = await ORMFactory.findMocksByServiceCode(serviceCode);
 *     const matchingMock = mocks.find(m => m.url === req.url && m.method === req.method);
 *     
 *     if (matchingMock) {
 *       // Simular delay
 *       await new Promise(resolve => setTimeout(resolve, matchingMock.delayMs));
 *       
 *       // Retornar respuesta mockeada
 *       return of(new HttpResponse({
 *         status: matchingMock.httpCodeResponseValue,
 *         body: JSON.parse(matchingMock.responseBody),
 *         headers: new HttpHeaders(matchingMock.headers)
 *       }));
 *     }
 *   }
 *   
 *   return next.handle(req);
 * }
 * ```
 */

export default ORMFactory;