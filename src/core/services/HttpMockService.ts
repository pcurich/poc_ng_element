import { Injectable, computed, signal } from '@angular/core';
import { HttpMockRepository, IHttpMockStatistics } from '../repositories/HttpMockRepository';
import { ServiceCodeWithStats } from '../types/service-code-stats.types';
import { HttpMockEntity, HttpMethod, IHttpMockData } from '../entities/HttpMockEntity';
import { ITransactionStats } from '../types/database.types';
import { IQueryOptions } from '../types/repository.types';
import {
  IHttpMockServiceState,
  IHttpInterceptionConfig,
  IHttpInterceptionResult,
  IHttpMockResponse,
  ICleanupOptions
} from '../types/service.types';

@Injectable({ providedIn: 'root' })
export class HttpMockService {

  private httpMockRepository!: HttpMockRepository;

  private readonly _state = signal<IHttpMockServiceState>({
    mocks: [],
    statistics: null,
    selectedServiceCode: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  private readonly _interceptionConfig = signal<IHttpInterceptionConfig>({
    enabled: false,
    defaultDelay: 100,
    fallbackToReal: true,
    logRequests: true,
    serviceCodes: []
  });

  public readonly mocks = computed(() => this._state().mocks);
  public readonly statistics = computed(() => this._state().statistics);
  public readonly loading = computed(() => this._state().loading);
  public readonly error = computed(() => this._state().error);
  public readonly selectedServiceCode = computed(() => this._state().selectedServiceCode);
  public readonly lastUpdated = computed(() => this._state().lastUpdated);

  public readonly totalMocks = computed(() => this.mocks().length);

  public readonly serviceCodes = computed(() =>
    [...new Set(this.mocks().map(mock => mock.serviceCode))].sort()
  );

  public readonly httpMethods = computed(() =>
    [...new Set(this.mocks().map(mock => mock.method))].sort()
  );

  public readonly averageDelay = computed(() => {
    const mocks = this.mocks();
    return mocks.length === 0 ? 0 :
      mocks.reduce((sum, mock) => sum + mock.delayMs, 0) / mocks.length;
  });

  public readonly filteredMocks = computed(() => {
    const selectedCode = this.selectedServiceCode();
    return selectedCode ?
      this.mocks().filter(mock => mock.serviceCode === selectedCode) :
      this.mocks();
  });

  public readonly errorMocks = computed(() =>
    this.mocks().filter(mock => 
      mock.httpCodeResponseValue >= 400
    )
  );

  public readonly successMocks = computed(() =>
    this.mocks().filter(mock =>
      mock.httpCodeResponseValue >= 200 && mock.httpCodeResponseValue < 300
    )
  );

  public readonly interceptionConfig = computed(() => this._interceptionConfig());
  public readonly isInterceptionEnabled = computed(() => this._interceptionConfig().enabled);

  async initialize(httpMockRepository: HttpMockRepository): Promise<void> {
    this.httpMockRepository = httpMockRepository;
    await this.loadAllMocks();
    await this.updateStatistics();
  }

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

  async loadAllMocks(): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        const mocks = await this.httpMockRepository.findAll();
        this.updateState(state => ({
          ...state,
          mocks,
          lastUpdated: new Date(),
          error: null
        }));
      },
      'Failed to load mocks'
    );
  }

  async createMock(mockData: Omit<IHttpMockData, 'id'>): Promise<HttpMockEntity | null> {
    return await this.executeWithErrorHandling(
      async () => {
        const mockEntity = new HttpMockEntity(mockData);
        const newMock = await this.httpMockRepository.create(mockEntity);

        this.updateState(state => ({
          ...state,
          mocks: [...state.mocks, newMock],
          lastUpdated: new Date(),
          error: null
        }));

        await this.updateStatistics();
        return newMock;
      },
      'Failed to create mock',
      null
    );
  }

  async updateMock(mockId: string, changes: Partial<IHttpMockData>): Promise<HttpMockEntity | null> {
    return await this.executeWithErrorHandling(
      async () => {
        const updatedMock = await this.httpMockRepository.update(mockId, changes);
        if (updatedMock) {
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
      },
      'Failed to update mock',
      null
    );
  }

  async deleteMock(mockId: string): Promise<boolean> {
    return await this.executeWithErrorHandling(
      async () => {
        const deleted = await this.httpMockRepository.delete(mockId);
        if (deleted) {
          this.updateState(state => ({
            ...state,
            mocks: state.mocks.filter(mock => mock.id !== mockId),
            lastUpdated: new Date(),
            error: null
          }));

          await this.updateStatistics();
        }
        return deleted;
      },
      'Failed to delete mock',
      false
    );
  }


  async loadMocksByServiceCode(serviceCode: string): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        const mocks = await this.httpMockRepository.findByServiceCode(serviceCode);
        this.updateState(state => ({
          ...state,
          mocks,
          selectedServiceCode: serviceCode,
          lastUpdated: new Date(),
          error: null
        }));
      },
      `Failed to load mocks for service: ${serviceCode}`
    );
  }

  async findMatchingMock(url: string, method: HttpMethod | string): Promise<HttpMockEntity | null> {
    try {
      return await this.httpMockRepository.findByUrlAndMethod(url, method);
    } catch (error) {
      this.handleError('Failed to find matching mock', error);
      return null;
    }
  }

  async searchMocks(options: IQueryOptions): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        const mocks = await this.httpMockRepository.findWithFilters(options);
        const serviceCode = 'filter' in options && options.filter && typeof options.filter !== 'function'
          ? (options.filter as Partial<HttpMockEntity>).serviceCode
          : null;

        this.updateState(state => ({
          ...state,
          mocks,
          selectedServiceCode: serviceCode || null,
          lastUpdated: new Date(),
          error: null
        }));
      },
      'Failed to search mocks'
    );
  }


  async getUniqueServiceCodes(): Promise<string[]> {
    try {
      return await this.httpMockRepository.getUniqueServiceCodes();
    } catch (error) {
      this.handleError('Failed to get service codes', error);
      return [];
    }
  }


  async getServiceCodesWithStats(): Promise<ServiceCodeWithStats[]> {
    try {
      return await this.httpMockRepository.getServiceCodesWithStats();
    } catch (error) {
      this.handleError('Failed to get service codes with statistics', error);
      return [];
    }
  }

  selectServiceCode(serviceCode: string | null): void {
    this.updateState(state => ({
      ...state,
      selectedServiceCode: serviceCode
    }));
  }

  clearFilters(): void {
    this.updateState(state => ({
      ...state,
      selectedServiceCode: null
    }));
  }


  async interceptRequest(url: string, method: HttpMethod | string): Promise<IHttpInterceptionResult> {
    const config = this.interceptionConfig();

    if (!config.enabled) {
      return { intercepted: false, reason: 'HTTP interception is disabled' };
    }

    try {
      const matchingMock = await this.findMatchingMock(url, method);

      if (!matchingMock) {
        return { intercepted: false, reason: 'No matching mock found for request' };
      }

      if (config.serviceCodes.length > 0 && !config.serviceCodes.includes(matchingMock.serviceCode)) {
        return {
          intercepted: false,
          reason: `Service code '${matchingMock.serviceCode}' not enabled for interception`
        };
      }

      const response = matchingMock.getResponse();

      if (config.logRequests) {
        console.log(`🌐 HTTP Mock intercepted: ${method} ${url}`, {
          mock: matchingMock.toPlainObject(),
          response
        });
      }

      return { intercepted: true, mock: matchingMock, response };

    } catch (error) {
      return {
        intercepted: false,
        reason: `Interception error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  updateInterceptionConfig(config: Partial<IHttpInterceptionConfig>): void {
    this._interceptionConfig.update(current => ({
      ...current,
      ...config
    }));
  }

  toggleInterception(): void {
    this._interceptionConfig.update(config => ({
      ...config,
      enabled: !config.enabled
    }));
  }

  async updateStatistics(): Promise<void> {
    try {
      const statistics = await this.httpMockRepository.getStatistics();
      this.updateState(state => ({
        ...state,
        statistics
      }));
    } catch (error) {
      console.warn('Failed to update statistics:', error);
    }
  }

  async exportMocks(serviceCode?: string): Promise<IHttpMockData[]> {
    try {
      if (serviceCode) {
        return await this.httpMockRepository.exportByServiceCode(serviceCode);
      } else {
        const allMocks = await this.httpMockRepository.findAll();
        return allMocks.map(mock => mock.toPlainObject());
      }
    } catch (error) {
      this.handleError('Failed to export mocks', error);
      return [];
    }
  }

  async importMocks(mocksData: Omit<IHttpMockData, 'id'>[]): Promise<number> {
    return await this.executeWithErrorHandling(
      async () => {
        const importedMocks = await this.httpMockRepository.importMocks(mocksData);

        await this.loadAllMocks();
        await this.updateStatistics();

        return importedMocks.length;
      },
      'Failed to import mocks',
      0
    );
  }

  async cleanup(options: ICleanupOptions = {}): Promise<number> {
    return await this.executeWithErrorHandling(
      async () => {
        let deletedCount = 0;

        if (options.serviceCode) {
          deletedCount = await this.httpMockRepository.deleteByServiceCode(options.serviceCode);
        } else if (options.olderThanDays) {
          deletedCount = await this.cleanupOldMocks(options.olderThanDays);
        }

        await this.loadAllMocks();
        await this.updateStatistics();

        return deletedCount;
      },
      'Cleanup operation failed',
      0
    );
  }

  async clearAllMocks(): Promise<void> {
    return await this.executeWithErrorHandling(
      async () => {
        await this.httpMockRepository.clearAllMocks();

        // Reset state after clearing
        this.updateState(state => ({
          ...state,
          mocks: [],
          statistics: null,
          selectedServiceCode: null,
          lastUpdated: new Date(),
          error: null
        }));

        // Update statistics to reflect empty state
        await this.updateStatistics();
      },
      'Failed to clear all mocks',
      undefined
    );
  }


  private updateState(updater: (state: IHttpMockServiceState) => IHttpMockServiceState): void {
    this._state.update(updater);
  }

  private setLoading(loading: boolean): void {
    this.updateState(state => ({ ...state, loading }));
  }

  private handleError(message: string, error: unknown): void {
    const errorMessage = `${message}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    this.updateState(state => ({ ...state, error: errorMessage }));
    console.error(errorMessage, error);
  }


  private async executeWithErrorHandling<T>(
    operation: () => Promise<T>,
    errorMessage: string,
    defaultValue?: T
  ): Promise<T> {
    this.setLoading(true);
    try {
      return await operation();
    } catch (error) {
      this.handleError(errorMessage, error);
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw error;
    } finally {
      this.setLoading(false);
    }
  }


  private async cleanupOldMocks(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const allMocks = await this.httpMockRepository.findAll();
    let deletedCount = 0;

    for (const mock of allMocks) {
      if (mock.createdAt && mock.createdAt < cutoffDate && mock.id) {
        if (await this.httpMockRepository.delete(mock.id)) {
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }

  async getDatabaseHealth(): Promise<{
    isConnected: boolean;
    databaseName: string;
    version: number;
    transactions: ITransactionStats;
  }> {

    if (!this.httpMockRepository) {
      const { ORMFactory } = await import('../factories/ORMFactory');
      const repository = await ORMFactory.getHttpMockRepository();
      await this.initialize(repository);
    }
    const dbContext = this.httpMockRepository.getDbContext();

    return {
      isConnected: dbContext.isOpen(),
      databaseName: dbContext.getDatabaseName(),
      version: dbContext.getVersion(),
      transactions: dbContext.getTransactionStats()
    };
  }
}