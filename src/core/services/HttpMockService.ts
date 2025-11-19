/**
 * 🌐 HttpMockService - Reactive HTTP Mock Management Service
 * 
 * Provides reactive business logic layer for HTTP mock management using Angular Signals.
 * Follows SOLID principles and clean code architecture for maintainable and extensible design.
 * 
 * @responsibilities
 * - HTTP Mock CRUD operations with reactive state management
 * - HTTP request interception and routing logic
 * - Mock statistics and analytics computation
 * - Service code management with comprehensive statistics
 * 
 * @author Development Team
 * @version 2.0.0
 */

import { Injectable, computed, signal } from '@angular/core';
import { HttpMockRepository, IHttpMockStatistics, IHttpMockSearchOptions } from '../repositories/HttpMockRepository';
import { ServiceCodeWithStats } from '../../app/components/interfaces';
import { HttpMockEntity, HttpMethod, IHttpMockData } from '../models/HttpMockEntity';

// ============================================================================
// TYPE DEFINITIONS & INTERFACES
// ============================================================================

/**
 * Core service state for reactive state management
 */
export interface IHttpMockServiceState {
  readonly mocks: HttpMockEntity[];
  readonly statistics: IHttpMockStatistics | null;
  readonly selectedServiceCode: string | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastUpdated: Date | null;
}

/**
 * HTTP interception configuration options
 */
export interface IHttpInterceptionConfig {
  readonly enabled: boolean;
  readonly defaultDelay: number;
  readonly fallbackToReal: boolean;
  readonly logRequests: boolean;
  readonly serviceCodes: readonly string[];
}

/**
 * Result structure for HTTP request interception attempts
 */
export interface IHttpInterceptionResult {
  readonly intercepted: boolean;
  readonly mock?: HttpMockEntity;
  readonly response?: IHttpMockResponse;
  readonly reason?: string;
}

/**
 * HTTP mock response data structure
 */
interface IHttpMockResponse {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly body: string;
  readonly delay: number;
}

/**
 * Options for cleanup operations
 */
export interface ICleanupOptions {
  readonly olderThanDays?: number;
  readonly serviceCode?: string;
}

// ============================================================================
// SERVICE IMPLEMENTATION
// ============================================================================

/**
 * HttpMockService - Main service class for HTTP mock management
 * 
 * Implements reactive state management using Angular Signals for clean,
 * predictable state updates and derived computations.
 */
@Injectable({
  providedIn: 'root'
})
export class HttpMockService {

  // ==========================================================================
  // PRIVATE PROPERTIES
  // ==========================================================================
  
  private httpMockRepository!: HttpMockRepository;
  
  /**
   * Core reactive state managed via Angular Signal
   */
  private readonly _state = signal<IHttpMockServiceState>({
    mocks: [],
    statistics: null,
    selectedServiceCode: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  /**
   * HTTP interception configuration state
   */
  private readonly _interceptionConfig = signal<IHttpInterceptionConfig>({
    enabled: false,
    defaultDelay: 100,
    fallbackToReal: true,
    logRequests: true,
    serviceCodes: []
  });

  // ==========================================================================
  // PUBLIC COMPUTED PROPERTIES - Core State Accessors
  // ==========================================================================
  
  /** All loaded HTTP mocks */
  public readonly mocks = computed(() => this._state().mocks);
  
  /** Current statistics data */
  public readonly statistics = computed(() => this._state().statistics);
  
  /** Loading state indicator */
  public readonly loading = computed(() => this._state().loading);
  
  /** Current error message if any */
  public readonly error = computed(() => this._state().error);
  
  /** Currently selected service code for filtering */
  public readonly selectedServiceCode = computed(() => this._state().selectedServiceCode);
  
  /** Last update timestamp */
  public readonly lastUpdated = computed(() => this._state().lastUpdated);

  // ==========================================================================
  // PUBLIC COMPUTED PROPERTIES - Derived Statistics
  // ==========================================================================
  
  /** Total number of mocks */
  public readonly totalMocks = computed(() => this.mocks().length);
  
  /** Unique service codes available */
  public readonly serviceCodes = computed(() => 
    [...new Set(this.mocks().map(mock => mock.serviceCode))].sort()
  );
  
  /** Unique HTTP methods used */
  public readonly httpMethods = computed(() => 
    [...new Set(this.mocks().map(mock => mock.method))].sort()
  );
  
  /** Average response delay across all mocks */
  public readonly averageDelay = computed(() => {
    const mocks = this.mocks();
    return mocks.length === 0 ? 0 : 
      mocks.reduce((sum, mock) => sum + mock.delayMs, 0) / mocks.length;
  });

  // ==========================================================================
  // PUBLIC COMPUTED PROPERTIES - Filtered Views
  // ==========================================================================
  
  /** Mocks filtered by selected service code */
  public readonly filteredMocks = computed(() => {
    const selectedCode = this.selectedServiceCode();
    return selectedCode ? 
      this.mocks().filter(mock => mock.serviceCode === selectedCode) : 
      this.mocks();
  });

  /** Mocks that return error status codes (4xx, 5xx) */
  public readonly errorMocks = computed(() => 
    this.mocks().filter(mock => mock.httpCodeResponseValue >= 400)
  );

  /** Mocks that return success status codes (2xx) */
  public readonly successMocks = computed(() => 
    this.mocks().filter(mock => 
      mock.httpCodeResponseValue >= 200 && mock.httpCodeResponseValue < 300
    )
  );

  // ==========================================================================
  // PUBLIC COMPUTED PROPERTIES - Interception Configuration
  // ==========================================================================
  
  /** Current interception configuration */
  public readonly interceptionConfig = computed(() => this._interceptionConfig());
  
  /** Whether HTTP interception is currently enabled */
  public readonly isInterceptionEnabled = computed(() => this._interceptionConfig().enabled);

  // ==========================================================================
  // PUBLIC METHODS - Lifecycle Management
  // ==========================================================================
  
  /**
   * Initializes the service with repository dependency injection
   * @param httpMockRepository Repository for data persistence operations
   */
  async initialize(httpMockRepository: HttpMockRepository): Promise<void> {
    this.httpMockRepository = httpMockRepository;
    await this.loadAllMocks();
    await this.updateStatistics();
  }

  /**
   * Resets service state to initial clean state
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

  // ==========================================================================
  // PUBLIC METHODS - CRUD Operations
  // ==========================================================================
  
  /**
   * Loads all HTTP mocks from repository and updates reactive state
   */
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

  /**
   * Creates a new HTTP mock and updates reactive state
   * @param mockData Mock data without ID (will be generated)
   * @returns Created mock entity or null if creation failed
   */
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

  /**
   * Updates an existing HTTP mock
   * @param mockId Unique identifier of the mock to update
   * @param changes Partial data with changes to apply
   * @returns Updated mock entity or null if update failed
   */
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

  /**
   * Deletes an HTTP mock by ID
   * @param mockId Unique identifier of the mock to delete
   * @returns True if deletion was successful, false otherwise
   */
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

  // ==========================================================================
  // PUBLIC METHODS - Search & Filter Operations
  // ==========================================================================

  /**
   * Loads mocks filtered by service code
   * @param serviceCode Service code to filter by
   */
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

  /**
   * Finds a mock that matches the given URL and HTTP method
   * @param url URL pattern to match
   * @param method HTTP method to match
   * @returns Matching mock entity or null if not found
   */
  async findMatchingMock(url: string, method: HttpMethod | string): Promise<HttpMockEntity | null> {
    try {
      return await this.httpMockRepository.findByUrlAndMethod(url, method);
    } catch (error) {
      this.handleError('Failed to find matching mock', error);
      return null;
    }
  }

  /**
   * Searches mocks with advanced filtering options
   * @param options Search and filter criteria
   */
  async searchMocks(options: IHttpMockSearchOptions): Promise<void> {
    await this.executeWithErrorHandling(
      async () => {
        const mocks = await this.httpMockRepository.findWithFilters(options);
        this.updateState(state => ({
          ...state,
          mocks,
          selectedServiceCode: options.serviceCode || null,
          lastUpdated: new Date(),
          error: null
        }));
      },
      'Failed to search mocks'
    );
  }

  // ==========================================================================
  // PUBLIC METHODS - Service Code Management
  // ==========================================================================

  /**
   * Retrieves all available service codes
   * @returns Array of unique service codes
   */
  async getAllServiceCodes(): Promise<string[]> {
    try {
      return await this.httpMockRepository.getAllServiceCodes();
    } catch (error) {
      this.handleError('Failed to get service codes', error);
      return [];
    }
  }

  /**
   * Retrieves service codes with associated statistics
   * @returns Array of service codes with mock counts and methods
   */
  async getServiceCodesWithStats(): Promise<ServiceCodeWithStats[]> {
    try {
      return await this.httpMockRepository.getServiceCodesWithStats();
    } catch (error) {
      this.handleError('Failed to get service codes with statistics', error);
      return [];
    }
  }

  // ==========================================================================
  // PUBLIC METHODS - Selection & Filtering
  // ==========================================================================

  /**
   * Selects a service code for filtering operations
   * @param serviceCode Service code to select (null to clear selection)
   */
  selectServiceCode(serviceCode: string | null): void {
    this.updateState(state => ({
      ...state,
      selectedServiceCode: serviceCode
    }));
  }

  /**
   * Clears all active filters and selections
   */
  clearFilters(): void {
    this.updateState(state => ({
      ...state,
      selectedServiceCode: null
    }));
  }

  // ==========================================================================
  // PUBLIC METHODS - HTTP Interception
  // ==========================================================================

  /**
   * Attempts to intercept an HTTP request with a matching mock
   * @param url Request URL to match
   * @param method HTTP method to match
   * @returns Interception result with mock response or reason for failure
   */
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

  /**
   * Updates HTTP interception configuration
   * @param config Partial configuration updates to apply
   */
  updateInterceptionConfig(config: Partial<IHttpInterceptionConfig>): void {
    this._interceptionConfig.update(current => ({
      ...current,
      ...config
    }));
  }

  /**
   * Toggles HTTP interception on/off
   */
  toggleInterception(): void {
    this._interceptionConfig.update(config => ({
      ...config,
      enabled: !config.enabled
    }));
  }

  // ==========================================================================
  // PUBLIC METHODS - Statistics & Analytics
  // ==========================================================================

  /**
   * Updates statistics from repository data
   */
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

  // ==========================================================================
  // PUBLIC METHODS - Data Import/Export
  // ==========================================================================

  /**
   * Exports mocks to JSON format
   * @param serviceCode Optional service code to filter exports
   * @returns Array of mock data objects
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
      this.handleError('Failed to export mocks', error);
      return [];
    }
  }

  /**
   * Imports mocks from JSON data
   * @param mocksData Array of mock data objects to import
   * @returns Number of successfully imported mocks
   */
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

  // ==========================================================================
  // PUBLIC METHODS - Maintenance Operations
  // ==========================================================================

  /**
   * Performs cleanup operations on mock data
   * @param options Cleanup configuration options
   * @returns Number of mocks that were deleted
   */
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

  /**
   * Clears all mocks from the database efficiently
   * Uses IndexedDB's clear() method to remove all records at once
   */
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

  // ==========================================================================
  // PRIVATE HELPER METHODS
  // ==========================================================================

  /**
   * Updates the reactive state using a state updater function
   * @param updater Function that receives current state and returns new state
   */
  private updateState(updater: (state: IHttpMockServiceState) => IHttpMockServiceState): void {
    this._state.update(updater);
  }

  /**
   * Sets loading state
   * @param loading Loading state to set
   */
  private setLoading(loading: boolean): void {
    this.updateState(state => ({ ...state, loading }));
  }

  /**
   * Handles and sets error state
   * @param message User-friendly error message
   * @param error Original error object for logging
   */
  private handleError(message: string, error: unknown): void {
    const errorMessage = `${message}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    this.updateState(state => ({ ...state, error: errorMessage }));
    console.error(errorMessage, error);
  }

  /**
   * Executes an async operation with automatic error handling and loading states
   * @param operation Async operation to execute
   * @param errorMessage Error message to display if operation fails
   * @param defaultValue Default value to return on error
   * @returns Result of operation or default value on error
   */
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

  /**
   * Cleans up mocks older than specified number of days
   * @param olderThanDays Number of days threshold
   * @returns Number of deleted mocks
   */
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
}