/**
 * 🌐 HttpMockService - Servicio para gestión de HTTP Mocks con Angular Signals
 * 
 * Este servicio proporciona una capa de lógica de negocio reactiva
 * para la gestión de mocks HTTP utilizando Angular Signals para 
 * estado reactivo en tiempo real.
 * 
 * Principios SOLID aplicados:
 * - Single Responsibility: Lógica de negocio para HTTP mocking
 * - Open/Closed: Extensible para nuevas funcionalidades de interceptación
 * - Dependency Inversion: Depende de HttpMockRepository (abstracción)
 */

import { Injectable, computed, signal } from '@angular/core';
import { HttpMockRepository, IHttpMockStatistics, IHttpMockSearchOptions } from '../repositories/HttpMockRepository';
import { HttpMockEntity, HttpMethod, IHttpMockData } from '../models/HttpMockEntity';

/**
 * Estado del servicio HTTP Mock
 */
export interface IHttpMockServiceState {
  mocks: HttpMockEntity[];
  statistics: IHttpMockStatistics | null;
  selectedServiceCode: string | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

/**
 * Configuración para intercepción HTTP
 */
export interface IHttpInterceptionConfig {
  enabled: boolean;
  defaultDelay: number;
  fallbackToReal: boolean;
  logRequests: boolean;
  serviceCodes: string[];
}

/**
 * Resultado de intercepción de petición HTTP
 */
export interface IHttpInterceptionResult {
  intercepted: boolean;
  mock?: HttpMockEntity;
  response?: {
    status: number;
    headers: Record<string, string>;
    body: string;
    delay: number;
  };
  reason?: string;
}

/**
 * Servicio HTTP Mock con Angular Signals
 */
@Injectable({
  providedIn: 'root'
})
export class HttpMockService {
  private httpMockRepository!: HttpMockRepository;
  
  // 🎯 Signals de estado reactivo
  private readonly _state = signal<IHttpMockServiceState>({
    mocks: [],
    statistics: null,
    selectedServiceCode: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  // 📊 Computed signals para valores derivados
  public readonly mocks = computed(() => this._state().mocks);
  public readonly statistics = computed(() => this._state().statistics);
  public readonly loading = computed(() => this._state().loading);
  public readonly error = computed(() => this._state().error);
  public readonly selectedServiceCode = computed(() => this._state().selectedServiceCode);
  public readonly lastUpdated = computed(() => this._state().lastUpdated);
  
  // 📈 Computed signals para estadísticas específicas
  public readonly totalMocks = computed(() => this.mocks().length);
  public readonly serviceCodes = computed(() => 
    [...new Set(this.mocks().map(m => m.serviceCode))].sort()
  );
  public readonly methods = computed(() => 
    [...new Set(this.mocks().map(m => m.method))].sort()
  );
  public readonly averageDelay = computed(() => {
    const mocks = this.mocks();
    if (mocks.length === 0) return 0;
    return mocks.reduce((sum, m) => sum + m.delayMs, 0) / mocks.length;
  });

  // Filtros reactivos
  public readonly filteredMocks = computed(() => {
    const selectedCode = this.selectedServiceCode();
    if (!selectedCode) return this.mocks();
    return this.mocks().filter(mock => mock.serviceCode === selectedCode);
  });

  public readonly errorMocks = computed(() => 
    this.mocks().filter(mock => mock.httpCodeResponseValue >= 400)
  );

  public readonly successMocks = computed(() => 
    this.mocks().filter(mock => mock.httpCodeResponseValue >= 200 && mock.httpCodeResponseValue < 300)
  );

  // 🔧 Configuración de intercepción
  private readonly _interceptionConfig = signal<IHttpInterceptionConfig>({
    enabled: false,
    defaultDelay: 100,
    fallbackToReal: true,
    logRequests: true,
    serviceCodes: []
  });

  public readonly interceptionConfig = computed(() => this._interceptionConfig());
  public readonly isInterceptionEnabled = computed(() => this._interceptionConfig().enabled);

  /**
   * Inicializa el servicio con el repository
   */
  async initialize(httpMockRepository: HttpMockRepository): Promise<void> {
    this.httpMockRepository = httpMockRepository;
    await this.loadAllMocks();
    await this.updateStatistics();
  }

  // === Operaciones CRUD reactivas ===

  /**
   * Carga todos los mocks y actualiza el estado
   */
  async loadAllMocks(): Promise<void> {
    this.setLoading(true);
    try {
      const mocks = await this.httpMockRepository.findAll();
      this.updateState(state => ({
        ...state,
        mocks,
        lastUpdated: new Date(),
        error: null
      }));
    } catch (error) {
      this.setError(`Error loading mocks: ${error}`);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Crea un nuevo mock HTTP
   */
  async createMock(mockData: Omit<IHttpMockData, 'id'>): Promise<HttpMockEntity | null> {
    this.setLoading(true);
    try {
      const mockEntity = new HttpMockEntity(mockData);
      const newMock = await this.httpMockRepository.create(mockEntity);
      
      // Actualizar estado reactivo
      this.updateState(state => ({
        ...state,
        mocks: [...state.mocks, newMock],
        lastUpdated: new Date(),
        error: null
      }));

      await this.updateStatistics();
      return newMock;
    } catch (error) {
      this.setError(`Error creating mock: ${error}`);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Actualiza un mock existente
   */
  async updateMock(mockId: string, changes: Partial<IHttpMockData>): Promise<HttpMockEntity | null> {
    this.setLoading(true);
    try {
      const updatedMock = await this.httpMockRepository.update(mockId, changes);
      if (updatedMock) {
        // Actualizar en el estado local
        this.updateState(state => ({
          ...state,
          mocks: state.mocks.map(mock => 
            mock.id === mockId ? updatedMock : mock
          ),
          lastUpdated: new Date(),
          error: null
        }));
        
        await this.updateStatistics();
      }
      return updatedMock;
    } catch (error) {
      this.setError(`Error updating mock: ${error}`);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Elimina un mock
   */
  async deleteMock(mockId: string): Promise<boolean> {
    this.setLoading(true);
    try {
      const deleted = await this.httpMockRepository.delete(mockId);
      if (deleted) {
        // Remover del estado local
        this.updateState(state => ({
          ...state,
          mocks: state.mocks.filter(mock => mock.id !== mockId),
          lastUpdated: new Date(),
          error: null
        }));
        
        await this.updateStatistics();
      }
      return deleted;
    } catch (error) {
      this.setError(`Error deleting mock: ${error}`);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  // === Búsquedas especializadas ===

  /**
   * Busca mocks por service code
   */
  async loadMocksByServiceCode(serviceCode: string): Promise<void> {
    this.setLoading(true);
    try {
      const mocks = await this.httpMockRepository.findByServiceCode(serviceCode);
      this.updateState(state => ({
        ...state,
        mocks,
        selectedServiceCode: serviceCode,
        lastUpdated: new Date(),
        error: null
      }));
    } catch (error) {
      this.setError(`Error loading mocks for service ${serviceCode}: ${error}`);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Busca mock que coincida con una petición HTTP
   */
  async findMatchingMock(url: string, method: HttpMethod | string): Promise<HttpMockEntity | null> {
    try {
      return await this.httpMockRepository.findByUrlAndMethod(url, method);
    } catch (error) {
      this.setError(`Error finding matching mock: ${error}`);
      return null;
    }
  }

  /**
   * Busca con filtros avanzados
   */
  async searchMocks(options: IHttpMockSearchOptions): Promise<void> {
    this.setLoading(true);
    try {
      const mocks = await this.httpMockRepository.findWithFilters(options);
      this.updateState(state => ({
        ...state,
        mocks,
        selectedServiceCode: options.serviceCode || null,
        lastUpdated: new Date(),
        error: null
      }));
    } catch (error) {
      this.setError(`Error searching mocks: ${error}`);
    } finally {
      this.setLoading(false);
    }
  }

  // === Intercepción HTTP ===

  /**
   * Intenta interceptar una petición HTTP
   */
  async interceptRequest(url: string, method: HttpMethod | string): Promise<IHttpInterceptionResult> {
    const config = this.interceptionConfig();
    
    if (!config.enabled) {
      return {
        intercepted: false,
        reason: 'Interception disabled'
      };
    }

    try {
      const matchingMock = await this.findMatchingMock(url, method);
      
      if (!matchingMock) {
        return {
          intercepted: false,
          reason: 'No matching mock found'
        };
      }

      // Verificar si el service code está habilitado
      if (config.serviceCodes.length > 0 && !config.serviceCodes.includes(matchingMock.serviceCode)) {
        return {
          intercepted: false,
          reason: `Service code ${matchingMock.serviceCode} not enabled for interception`
        };
      }

      const response = matchingMock.getResponse();

      if (config.logRequests) {
        console.log(`🌐 HTTP Mock intercepted: ${method} ${url}`, {
          mock: matchingMock.toPlainObject(),
          response
        });
      }

      return {
        intercepted: true,
        mock: matchingMock,
        response
      };

    } catch (error) {
      return {
        intercepted: false,
        reason: `Interception error: ${error}`
      };
    }
  }

  /**
   * Configura la intercepción HTTP
   */
  updateInterceptionConfig(config: Partial<IHttpInterceptionConfig>): void {
    this._interceptionConfig.update(current => ({
      ...current,
      ...config
    }));
  }

  /**
   * Habilita/deshabilita intercepción
   */
  toggleInterception(): void {
    this._interceptionConfig.update(config => ({
      ...config,
      enabled: !config.enabled
    }));
  }

  // === Gestión de estadísticas ===

  /**
   * Actualiza las estadísticas
   */
  async updateStatistics(): Promise<void> {
    try {
      const statistics = await this.httpMockRepository.getStatistics();
      this.updateState(state => ({
        ...state,
        statistics
      }));
    } catch (error) {
      console.warn('Error updating statistics:', error);
    }
  }

  // === Operaciones de mantenimiento ===

  /**
   * Limpia mocks antiguos o no utilizados
   */
  async cleanup(options: { olderThanDays?: number; serviceCode?: string } = {}): Promise<number> {
    this.setLoading(true);
    try {
      let deletedCount = 0;

      if (options.serviceCode) {
        deletedCount = await this.httpMockRepository.deleteByServiceCode(options.serviceCode);
      } else if (options.olderThanDays) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.olderThanDays);
        
        const allMocks = await this.httpMockRepository.findAll();
        for (const mock of allMocks) {
          if (mock.createdAt && mock.createdAt < cutoffDate) {
            if (mock.id && await this.httpMockRepository.delete(mock.id)) {
              deletedCount++;
            }
          }
        }
      }

      // Recargar datos después de la limpieza
      await this.loadAllMocks();
      await this.updateStatistics();
      
      return deletedCount;
    } catch (error) {
      this.setError(`Error during cleanup: ${error}`);
      return 0;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Exporta mocks a JSON
   */
  async exportMocks(serviceCode?: string): Promise<IHttpMockData[]> {
    try {
      if (serviceCode) {
        return await this.httpMockRepository.exportByServiceCode(serviceCode);
      } else {
        const allMocks = await this.httpMockRepository.findAll();
        return allMocks.map(mock => mock.toPlainObject());
      }
    } catch (error) {
      this.setError(`Error exporting mocks: ${error}`);
      return [];
    }
  }

  /**
   * Importa mocks desde JSON
   */
  async importMocks(mocksData: Omit<IHttpMockData, 'id'>[]): Promise<number> {
    this.setLoading(true);
    try {
      const importedMocks = await this.httpMockRepository.importMocks(mocksData);
      
      // Recargar todos los datos
      await this.loadAllMocks();
      await this.updateStatistics();
      
      return importedMocks.length;
    } catch (error) {
      this.setError(`Error importing mocks: ${error}`);
      return 0;
    } finally {
      this.setLoading(false);
    }
  }

  // === Selecciones y filtros ===

  /**
   * Selecciona un service code para filtrar
   */
  selectServiceCode(serviceCode: string | null): void {
    this.updateState(state => ({
      ...state,
      selectedServiceCode: serviceCode
    }));
  }

  /**
   * Limpia todos los filtros
   */
  clearFilters(): void {
    this.updateState(state => ({
      ...state,
      selectedServiceCode: null
    }));
  }

  // === Métodos utilitarios privados ===

  private updateState(updater: (state: IHttpMockServiceState) => IHttpMockServiceState): void {
    this._state.update(updater);
  }

  private setLoading(loading: boolean): void {
    this.updateState(state => ({ ...state, loading }));
  }

  private setError(error: string): void {
    this.updateState(state => ({ ...state, error }));
    console.error('HttpMockService error:', error);
  }

  /**
   * Resetea el estado del servicio
   */
  reset(): void {
    this._state.set({
      mocks: [],
      statistics: null,
      selectedServiceCode: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
  }
}