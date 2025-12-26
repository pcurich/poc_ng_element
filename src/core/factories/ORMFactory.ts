
import { IDbContext } from '../context/IDbContext';
import { DbContext } from '../context/DbContext';
import { IDbConfig, ITransactionStats } from '../types/database.types';
import { BaseEntity } from '../entities/base/BaseEntity';
import { BaseRepository } from '../repositories/BaseRepository';
import { HttpMockRepository } from '../repositories/HttpMockRepository';
import { IHttpMockData } from '../entities/HttpMockEntity';
import { HttpMockService } from '../services/HttpMockService';

export class ORMFactory {
  private static dbContextInstance: IDbContext | null = null;
  private static httpMockRepositoryInstance: HttpMockRepository | null = null;
  private static httpMockServiceInstance: HttpMockService | null = null;

  static createDbContext(config: IDbConfig): IDbContext {
    return new DbContext(config);
  }


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

  static async getDbContext(): Promise<IDbContext> {
    if (!this.dbContextInstance) {
      const config = this.getDefaultHttpMocksConfig();
      this.dbContextInstance = this.createDbContext(config);
      await this.dbContextInstance.open();
    }
    return this.dbContextInstance;
  }

  static async getHttpMockRepository(): Promise<HttpMockRepository> {
    if (!this.httpMockRepositoryInstance) {
      const dbContext = await this.getDbContext();
      this.httpMockRepositoryInstance = this.createHttpMockRepository(dbContext);
    }
    return this.httpMockRepositoryInstance;
  }

  /**
   * Obtiene una instancia singleton del HttpMockService
   * Inicializa automáticamente el repositorio si es necesario
   */
  static async getHttpMockService(): Promise<HttpMockService> {
    if (!this.httpMockServiceInstance) {
      const repository = await this.getHttpMockRepository();
      this.httpMockServiceInstance = new HttpMockService();
      await this.httpMockServiceInstance.initialize(repository);
    }
    return this.httpMockServiceInstance;
  }

  static async findMocksByServiceCode(serviceCode: string): Promise<IHttpMockData[]> {
    try {
      const repository = await this.getHttpMockRepository();
      const entities = await repository.findByServiceCode(serviceCode);
      return entities.map(entity => entity.toPlainObject());
    } catch (error) {
      console.error(`Error finding mocks by serviceCode "${serviceCode}":`, error);
      throw error;
    }
  }

  static async findMocksByUrl(url: string): Promise<IHttpMockData[]> {
    try {
      const repository = await this.getHttpMockRepository();
      const entities = await repository.findByUrl(url);
      return entities.map(entity => entity.toPlainObject());
    } catch (error) {
      console.error(`Error finding mocks by url "${url}":`, error);
      throw error;
    }
  }

  static async getDatabaseHealth(): Promise<{
    isOpen: boolean;
    name: string;
    version: number;
    transactions: ITransactionStats;
  }> {
    const dbContext = await this.getDbContext();
    return {
      isOpen: dbContext.isOpen(),
      name: dbContext.getDatabaseName(),
      version: dbContext.getVersion(),
      transactions: dbContext.getTransactionStats()
    };
  }

  /**
   * Cierra la conexión y libera recursos
   */
  static async closeDbContext(): Promise<void> {
    if (this.dbContextInstance) {
      await this.dbContextInstance.close();
      this.dbContextInstance = null;
      this.httpMockRepositoryInstance = null;
      this.httpMockServiceInstance = null;
    }
  }
}