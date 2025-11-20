/**
 * 🌐 HttpMockRepository - Repository especializado para HTTP Mocks
 * 
 * Este repository proporciona operaciones específicas para la gestión
 * de mocks HTTP, incluyendo búsquedas optimizadas por índices y 
 * funcionalidades específicas para interceptación HTTP.
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Gestión específica de HTTP mocks
 * - Open/Closed: Extendible para nuevas funcionalidades de mocking
 * - Liskov Substitution: Puede sustituir al BaseRepository
 * - Interface Segregation: Métodos específicos para HTTP mocks
 * - Dependency Inversion: Depende de abstracciones (IDbContext)
 */

import { BaseRepository } from './BaseRepository';
import { HttpMockEntity, HttpMethod, IHttpMockData } from '../models/HttpMockEntity';
import { IDbContext } from '../context/IDbContext';
import { ServiceCodeWithStats } from '../types/service-code-stats.types';

/**
 * Interface específica para estadísticas de HTTP Mocks
 */
export interface IHttpMockStatistics {
  totalMocks: number;
  mocksByServiceCode: Record<string, number>;
  mocksByMethod: Record<HttpMethod | string, number>;
  mocksByStatusCode: Record<number, number>;
  averageDelayMs: number;
  mostUsedServiceCodes: Array<{ serviceCode: string; count: number }>;
}

/**
 * Options para búsquedas específicas de HTTP Mocks
 */
export interface IHttpMockSearchOptions {
  serviceCode?: string;
  method?: HttpMethod | string;
  statusCode?: number;
  urlPattern?: string;
  minDelay?: number;
  maxDelay?: number;
}

/**
 * Repository especializado para HttpMockEntity
 */
export class HttpMockRepository extends BaseRepository<HttpMockEntity, string> {

  constructor(dbContext: IDbContext) {
    super(dbContext, HttpMockEntity, 'httpMocks');
  }

  // === Búsquedas optimizadas por índices ===

  /**
   * Busca mocks por código de servicio (usando índice)
   */
  async findByServiceCode(serviceCode: string): Promise<HttpMockEntity[]> {
    return this.findByIndex('serviceCode', serviceCode);
  }

  /**
   * Busca mocks por URL (usando índice)
   */
  async findByUrl(url: string): Promise<HttpMockEntity[]> {
    return this.findByIndex('url', url);
  }

  /**
   * Busca mocks por método HTTP (usando índice)
   */
  async findByMethod(method: HttpMethod | string): Promise<HttpMockEntity[]> {
    return this.findByIndex('method', method.toUpperCase());
  }

  /**
   * Busca un mock específico por URL y método (optimizado)
   */
  async findByUrlAndMethod(url: string, method: HttpMethod | string): Promise<HttpMockEntity | null> {
    const mocksByUrl = await this.findByUrl(url);
    
    // Buscar coincidencia exacta o patrón
    for (const mock of mocksByUrl) {
      if (mock.matchesRequest(url, method)) {
        return mock;
      }
    }
    
    return null;
  }

  /**
   * Busca mocks que coincidan con una petición HTTP
   */
  async findMatchingMocks(url: string, method: HttpMethod | string): Promise<HttpMockEntity[]> {
    // Primero buscar por método para reducir el dataset
    const mocksByMethod = await this.findByMethod(method);
    
    // Filtrar por coincidencia de URL
    const matchingMocks = mocksByMethod.filter(mock => 
      mock.matchesRequest(url, method)
    );

    // Ordenar por prioridad: coincidencia exacta primero, luego patrones
    return matchingMocks.sort((a, b) => {
      const aExact = a.url === url ? 1 : 0;
      const bExact = b.url === url ? 1 : 0;
      return bExact - aExact;
    });
  }

  // === Búsquedas por filtros avanzados ===

  /**
   * Busca mocks con opciones de filtrado avanzado
   */
  async findWithFilters(options: IHttpMockSearchOptions): Promise<HttpMockEntity[]> {
    let results = await this.findAll();

    if (options.serviceCode) {
      results = results.filter(mock => mock.serviceCode === options.serviceCode);
    }

    if (options.method) {
      results = results.filter(mock => 
        mock.method.toUpperCase() === options.method!.toUpperCase()
      );
    }

    if (options.statusCode) {
      results = results.filter(mock => mock.httpCodeResponseValue === options.statusCode);
    }

    if (options.urlPattern) {
      const regex = new RegExp(options.urlPattern, 'i');
      results = results.filter(mock => regex.test(mock.url));
    }

    if (options.minDelay !== undefined) {
      results = results.filter(mock => mock.delayMs >= options.minDelay!);
    }

    if (options.maxDelay !== undefined) {
      results = results.filter(mock => mock.delayMs <= options.maxDelay!);
    }

    return results;
  }

  /**
   * Busca mocks por rango de códigos de estado HTTP
   */
  async findByStatusCodeRange(minStatus: number, maxStatus: number): Promise<HttpMockEntity[]> {
    const allMocks = await this.findAll();
    return allMocks.filter(mock => 
      mock.httpCodeResponseValue >= minStatus && 
      mock.httpCodeResponseValue <= maxStatus
    );
  }

  /**
   * Busca mocks con errores HTTP (4xx, 5xx)
   */
  async findErrorMocks(): Promise<HttpMockEntity[]> {
    return this.findByStatusCodeRange(400, 599);
  }

  /**
   * Busca mocks de éxito (2xx)
   */
  async findSuccessMocks(): Promise<HttpMockEntity[]> {
    return this.findByStatusCodeRange(200, 299);
  }

  // === Operaciones de análisis y estadísticas ===

  /**
   * Obtiene estadísticas completas de los mocks
   */
  async getStatistics(): Promise<IHttpMockStatistics> {
    const allMocks = await this.findAll();
    
    const mocksByServiceCode: Record<string, number> = {};
    const mocksByMethod: Record<string, number> = {};
    const mocksByStatusCode: Record<number, number> = {};
    let totalDelay = 0;

    allMocks.forEach(mock => {
      // Por service code
      mocksByServiceCode[mock.serviceCode] = 
        (mocksByServiceCode[mock.serviceCode] || 0) + 1;
      
      // Por método
      const method = mock.method.toUpperCase();
      mocksByMethod[method] = (mocksByMethod[method] || 0) + 1;
      
      // Por status code
      mocksByStatusCode[mock.httpCodeResponseValue] = 
        (mocksByStatusCode[mock.httpCodeResponseValue] || 0) + 1;
      
      // Acumular delay
      totalDelay += mock.delayMs;
    });

    // Service codes más usados
    const mostUsedServiceCodes = Object.entries(mocksByServiceCode)
      .map(([serviceCode, count]) => ({ serviceCode, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalMocks: allMocks.length,
      mocksByServiceCode,
      mocksByMethod,
      mocksByStatusCode,
      averageDelayMs: allMocks.length > 0 ? totalDelay / allMocks.length : 0,
      mostUsedServiceCodes
    };
  }

  /**
   * Cuenta mocks por service code
   */
  async countByServiceCode(serviceCode: string): Promise<number> {
    const mocks = await this.findByServiceCode(serviceCode);
    return mocks.length;
  }

  /**
   * Lista todos los service codes únicos
   */
  async getUniqueServiceCodes(): Promise<string[]> {
    const allMocks = await this.findAll();
    const serviceCodes = new Set(allMocks.map(mock => mock.serviceCode));
    return Array.from(serviceCodes).sort();
  }

  /**
   * Lista todas las URLs únicas
   */
  async getUniqueUrls(): Promise<string[]> {
    const allMocks = await this.findAll();
    const urls = new Set(allMocks.map(mock => mock.url));
    return Array.from(urls).sort();
  }

  // === Operaciones de mantenimiento ===

  /**
   * Elimina todos los mocks de un service code
   */
  async deleteByServiceCode(serviceCode: string): Promise<number> {
    const mocks = await this.findByServiceCode(serviceCode);
    let deletedCount = 0;
    
    for (const mock of mocks) {
      if (mock.id && await this.delete(mock.id)) {
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * Limpia todos los mocks de la base de datos de manera eficiente
   * Utiliza el método clear() de IndexedDB para borrar todos los registros
   */
  async clearAllMocks(): Promise<void> {
    await this.clearAll();
  }

  /**
   * Actualiza el delay de todos los mocks de un service code
   */
  async updateDelayByServiceCode(serviceCode: string, newDelayMs: number): Promise<number> {
    const mocks = await this.findByServiceCode(serviceCode);
    let updatedCount = 0;
    
    for (const mock of mocks) {
      if (mock.id) {
        mock.updateDelay(newDelayMs);
        await this.save(mock);
        updatedCount++;
      }
    }
    
    return updatedCount;
  }

  /**
   * Duplica un mock con nueva URL
   */
  async duplicateMockWithNewUrl(mockId: string, newUrl: string): Promise<HttpMockEntity | null> {
    const originalMock = await this.findById(mockId);
    if (!originalMock) {
      return null;
    }

    const clonedData = originalMock.toPlainObject();
    delete clonedData.id; // Remover ID para crear uno nuevo
    clonedData.url = newUrl;

    // Crear nueva entidad con los datos clonados
    const newMock = new HttpMockEntity(clonedData);
    return this.create(newMock);
  }

  /**
   * Busca mocks duplicados por URL y método
   */
  async findDuplicates(): Promise<Array<{ url: string; method: string; mocks: HttpMockEntity[] }>> {
    const allMocks = await this.findAll();
    const groups = new Map<string, HttpMockEntity[]>();

    // Agrupar por URL + método
    allMocks.forEach(mock => {
      const key = `${mock.url}|${mock.method.toUpperCase()}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(mock);
    });

    // Filtrar solo grupos con más de un elemento
    const duplicates: Array<{ url: string; method: string; mocks: HttpMockEntity[] }> = [];
    
    groups.forEach((mocks, key) => {
      if (mocks.length > 1) {
        const [url, method] = key.split('|');
        duplicates.push({ url, method, mocks });
      }
    });

    return duplicates;
  }

  // === Operaciones de importación/exportación ===

  /**
   * Exporta mocks de un service code a formato JSON
   */
  async exportByServiceCode(serviceCode: string): Promise<IHttpMockData[]> {
    const mocks = await this.findByServiceCode(serviceCode);
    return mocks.map(mock => mock.toPlainObject());
  }

  /**
   * Importa mocks desde un array de datos
   */
  async importMocks(mocksData: Omit<IHttpMockData, 'id'>[]): Promise<HttpMockEntity[]> {
    const createdMocks: HttpMockEntity[] = [];
    
    for (const mockData of mocksData) {
      try {
        // Crear entidad desde los datos
        const mockEntity = new HttpMockEntity(mockData);
        const mock = await this.create(mockEntity);
        createdMocks.push(mock);
      } catch (error) {
        console.warn(`Failed to import mock for URL ${mockData.url}:`, error);
      }
    }
    
    return createdMocks;
  }

  /**
   * Obtiene el nombre de la tabla dinamicamente basado en la configuración
   * Si this.tableName no está disponible, obtiene el primer objectStore de la base de datos
   */
  private async getDynamicTableName(): Promise<string> {
    // Usar el tableName del BaseRepository si está disponible
    if (this.tableName && this.tableName.trim() !== '') {
      return this.tableName;
    }
    
    // Fallback: obtener el primer objectStore de la base de datos
    try {
      const db = await this.dbContext.getDB();
      if (db.objectStoreNames.length > 0) {
        return db.objectStoreNames[0];
      }
    } catch (error) {
      console.error('Error getting database object stores:', error);
    }
    
    // Último fallback: usar el nombre por defecto de la configuración
    console.warn('Using default table name fallback');
    return 'httpMocks'; // Último recurso
  }

  /**
   * Obtiene todos los códigos de servicio únicos disponibles en la base de datos
   * Optimizado usando el índice serviceCode para mejor rendimiento
   * Usa nombre de tabla dinámico basado en la configuración de la base de datos
   */
  async getAllServiceCodes(): Promise<string[]> {
    try {
      const serviceCodes = new Set<string>();
      const dynamicTableName = await this.getDynamicTableName();
      
      // Usar transacción para acceder al índice serviceCode
      await this.dbContext.runTransaction(dynamicTableName, 'readonly', (store: IDBObjectStore) => {
        return new Promise<void>((resolve, reject) => {
          // Obtener el índice serviceCode
          const index = store.index('serviceCode');
          
          // Abrir cursor en el índice para obtener solo las claves únicas
          const request = index.openKeyCursor();
          
          let currentServiceCode: string | null = null;
          
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursor | null>).result;
            
            if (cursor) {
              const serviceCode = cursor.key as string;
              
              // Solo agregar si es diferente al anterior (aprovechamos que el índice está ordenado)
              // y no es vacío o solo espacios
              if (serviceCode && 
                  serviceCode.trim() !== '' && 
                  serviceCode !== currentServiceCode) {
                serviceCodes.add(serviceCode);
                currentServiceCode = serviceCode;
              }
              
              // Avanzar al siguiente serviceCode único
              try {
                cursor.continue(serviceCode); // Esto saltará duplicados
              } catch (e) {
                // Si falla continue, usar continue() normal
                cursor.continue();
              }
            } else {
              // No hay más elementos
              resolve();
            }
          };
          
          request.onerror = () => {
            reject(new Error('Error reading serviceCode index'));
          };
        });
      });
      
      return Array.from(serviceCodes).sort();
    } catch (error) {
      console.error('Error getting service codes using index:', error);
      
      // Fallback al método anterior si el índice falla
      try {
        console.warn('Falling back to full scan method...');
        const allMocks = await this.findAll();
        const serviceCodes = new Set<string>();
        
        allMocks.forEach(mock => {
          if (mock.serviceCode && mock.serviceCode.trim() !== '') {
            serviceCodes.add(mock.serviceCode);
          }
        });
        
        return Array.from(serviceCodes).sort();
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Obtiene información de servicios con estadísticas básicas
   */
  async getServiceCodesWithStats(): Promise<ServiceCodeWithStats[]> {
    try {
      const allMocks = await this.findAll();
      const servicesMap = new Map<string, { id:string; count: number; methods: Set<string> }>();
      
      allMocks.forEach(mock => {
        if (mock.serviceCode && mock.serviceCode.trim() !== '') {
          const serviceCode = mock.serviceCode;
          if (!servicesMap.has(serviceCode)) {
            servicesMap.set(serviceCode, { id: mock.id! , count: 0, methods: new Set() });
          }
          
          const serviceInfo = servicesMap.get(serviceCode)!;
          serviceInfo.count++;
          serviceInfo.methods.add(mock.method);
        }
      });
      
      return Array.from(servicesMap.entries())
        .map(([serviceCode, info]) => ({
          id: info.id,
          serviceCode,
          mockCount: info.count,
          methods: Array.from(info.methods).sort()
        }))
        .sort((a, b) => a.serviceCode.localeCompare(b.serviceCode));
    } catch (error) {
      console.error('Error getting service codes with stats:', error);
      return [];
    }
  }
}