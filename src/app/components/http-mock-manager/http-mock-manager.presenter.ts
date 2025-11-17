import { Injectable, signal, computed, OnDestroy, effect } from '@angular/core';
import { Subject, takeUntil, BehaviorSubject, Observable, from } from 'rxjs';
import { HttpMockService, IHttpMockServiceState, IHttpInterceptionConfig } from '../../../core/services/HttpMockService';
import { HttpMockRepository } from '../../../core/repositories/HttpMockRepository';
import { HttpMockEntity, HttpMethod, IHttpMockData } from '../../../core/models/HttpMockEntity';
import { ORMFactory } from '../../../core';
import { 
  ContextOption, 
  MockSchema, 
  MockBody,
  IHttpMockManagerPresenterState,
  IHttpMockManagerPresenterEvents 
} from '../interfaces';

/**
 * 🎭 HttpMockManagerPresenter - Capa de presentación MVP
 * 
 * Esta clase encapsula toda la lógica de presentación y maneja la comunicación
 * entre el componente HttpMockManagerComponent y los servicios de negocio.
 * Implementa el patrón MVP para separar responsabilidades y mejorar testabilidad.
 */

@Injectable()
export class HttpMockManagerPresenter implements OnDestroy {
  
  // === Subjects para comunicación reactiva ===
  private readonly destroy$ = new Subject<void>();
  private readonly mockCreated$ = new Subject<HttpMockEntity>();
  private readonly mockDeleted$ = new Subject<string>();
  private readonly mocksLoaded$ = new Subject<HttpMockEntity[]>();
  private readonly error$ = new Subject<string>();
  private readonly stateChanged$ = new BehaviorSubject<IHttpMockManagerPresenterState>(this.getInitialState());

  // === Estado interno con signals ===
  private readonly _isInitialized = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentMocks = signal<HttpMockEntity[]>([]);
  private readonly _statistics = signal<any | null>(null);
  private readonly _selectedServiceCode = signal<string | null>(null);
  private readonly _lastOperation = signal<string | null>(null);

  // === Computed properties públicas ===
  public readonly isInitialized = this._isInitialized.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly currentMocks = this._currentMocks.asReadonly();
  public readonly statistics = this._statistics.asReadonly();
  public readonly selectedServiceCode = this._selectedServiceCode.asReadonly();
  public readonly lastOperation = this._lastOperation.asReadonly();

  // === Estado combinado ===
  public readonly state = computed<IHttpMockManagerPresenterState>(() => ({
    isInitialized: this._isInitialized(),
    isLoading: this._isLoading(),
    error: this._error(),
    currentMocks: this._currentMocks(),
    statistics: this._statistics(),
    selectedServiceCode: this._selectedServiceCode(),
    lastOperation: this._lastOperation()
  }));

  // === Eventos públicos ===
  public readonly events: IHttpMockManagerPresenterEvents = {
    onMockCreated: this.mockCreated$.asObservable(),
    onMockDeleted: this.mockDeleted$.asObservable(),
    onMocksLoaded: this.mocksLoaded$.asObservable(),
    onError: this.error$.asObservable(),
    onStateChanged: this.stateChanged$.asObservable()
  };

  // === Servicios ===
  private httpMockService!: HttpMockService;
  private httpMockRepository!: HttpMockRepository;

  constructor() {
    // Usar effect para reaccionar a cambios de estado
    effect(() => {
      this.stateChanged$.next(this.state());
    });
  }

  // === Inicialización ===

  /**
   * Inicializa el presenter y los servicios necesarios
   */
  async initialize(): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);
      this.setLastOperation('Initializing presenter...');

      // Crear configuración y contexto de base de datos
      const config = ORMFactory.getDefaultHttpMocksConfig();
      const dbContext = ORMFactory.createDbContext(config);
      await dbContext.open();

      // Crear repository y servicio
      this.httpMockRepository = ORMFactory.createHttpMockRepository(dbContext);
      this.httpMockService = new HttpMockService();
      await this.httpMockService.initialize(this.httpMockRepository);

      // Suscribirse a cambios del servicio
      this.subscribeToServiceChanges();

      this._isInitialized.set(true);
      this.setLastOperation('Presenter initialized successfully');
      
      console.log('🎭 HttpMockManagerPresenter initialized successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize presenter';
      this.setError(errorMessage);
      console.error('❌ HttpMockManagerPresenter initialization failed:', error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  // === Gestión de Context ===

  /**
   * Maneja el cambio de tipo de contexto
   */
  async handleContextTypeChange(contextOption: ContextOption): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation(`Changing context to: ${contextOption.value}`);

      // Guardar en localStorage
      localStorage.setItem('useMock', JSON.stringify(contextOption.useMock));
      localStorage.setItem('selectedContext', JSON.stringify(contextOption));

      // Si el contexto usa mocks, cargar estadísticas
      if (contextOption.useMock) {
        await this.refreshStatistics();
      }

      this.setLastOperation('Context changed successfully');
    } catch (error) {
      const errorMessage = `Failed to change context: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Carga un contexto por ID
   */
  async handleLoadContext(contextId: number): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation(`Loading context with ID: ${contextId}`);

      // Lógica para cargar contexto específico (puede expandirse según necesidades)
      await this.refreshStatistics();
      
      this.setLastOperation('Context loaded successfully');
    } catch (error) {
      const errorMessage = `Failed to load context: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  // === Gestión de Mocks ===

  /**
   * Maneja la creación de un nuevo mock schema
   */
  async handleSaveMockSchema(mockSchema: MockSchema): Promise<HttpMockEntity | null> {
    try {
      this.setLoading(true);
      this.setLastOperation(`Creating mock: ${mockSchema.nameMock}`);

      const mockData: Omit<IHttpMockData, 'id'> = {
        name: mockSchema.nameMock,
        serviceCode: mockSchema.serviceCode,
        url: mockSchema.url,
        method: mockSchema.httpMethod,
        httpCodeResponseValue: mockSchema.httpCodeResponseValue,
        delayMs: mockSchema.delayMs,
        headers: mockSchema.headers,
        responseBody: '{}' // Default body, se actualizará después
      };

      const createdMock = await this.httpMockService.createMock(mockData);
      
      if (createdMock) {
        this._currentMocks.update(mocks => [...mocks, createdMock]);
        this.mockCreated$.next(createdMock);
        await this.refreshStatistics();
        this.setLastOperation(`Mock "${mockSchema.nameMock}" created successfully`);
        return createdMock;
      }
      
      return null;
    } catch (error) {
      const errorMessage = `Failed to create mock: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Maneja el guardado del body de un mock
   */
  async handleSaveMockBody(mockBody: MockBody, mockId?: string): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation('Saving mock body...');

      // Si no se proporciona mockId, buscar el mock más reciente
      if (!mockId && this._currentMocks().length > 0) {
        const latestMock = this._currentMocks().slice(-1)[0];
        mockId = latestMock.id;
      }

      if (mockId) {
        // Actualizar el mock existente con el nuevo body
        await this.httpMockService.updateMock(mockId, { responseBody: mockBody.responseBody });
        
        // Actualizar el estado local
        this._currentMocks.update(mocks => 
          mocks.map(mock => {
            if (mock.id === mockId) {
              mock.responseBody = mockBody.responseBody;
            }
            return mock;
          })
        );

        this.setLastOperation('Mock body saved successfully');
      } else {
        throw new Error('No mock available to save body');
      }
    } catch (error) {
      const errorMessage = `Failed to save mock body: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Maneja el guardado de headers
   */
  async handleSaveHeaders(headers: Record<string, string>, mockId?: string): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation('Saving headers...');

      // Si no se proporciona mockId, buscar el mock más reciente
      if (!mockId && this._currentMocks().length > 0) {
        const latestMock = this._currentMocks().slice(-1)[0];
        mockId = latestMock.id;
      }

      if (mockId) {
        // Actualizar el mock existente con los nuevos headers
        await this.httpMockService.updateMock(mockId, { headers });
        
        // Actualizar el estado local
        this._currentMocks.update(mocks => 
          mocks.map(mock => {
            if (mock.id === mockId) {
              mock.headers = headers;
            }
            return mock;
          })
        );

        this.setLastOperation('Headers saved successfully');
      } else {
        this.setLastOperation('Headers saved locally (no mock to associate)');
      }
    } catch (error) {
      const errorMessage = `Failed to save headers: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Carga mocks por código de servicio
   */
  async handleLoadMocksByServiceCode(serviceCode: string): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation(`Loading mocks for service: ${serviceCode}`);

      await this.httpMockService.loadMocksByServiceCode(serviceCode);
      
      // Obtener mocks del servicio
      const mocks = this.httpMockService.mocks();
      this._currentMocks.set(mocks);
      this._selectedServiceCode.set(serviceCode);
      
      this.mocksLoaded$.next(mocks);
      await this.refreshStatistics();
      
      this.setLastOperation(`Loaded ${mocks.length} mocks for service "${serviceCode}"`);
    } catch (error) {
      const errorMessage = `Failed to load mocks: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Elimina un mock
   */
  async handleDeleteMock(mockId: string): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation(`Deleting mock: ${mockId}`);

      const success = await this.httpMockService.deleteMock(mockId);
      
      if (success) {
        this._currentMocks.update(mocks => mocks.filter(mock => mock.id !== mockId));
        this.mockDeleted$.next(mockId);
        await this.refreshStatistics();
        this.setLastOperation('Mock deleted successfully');
      } else {
        throw new Error('Failed to delete mock');
      }
    } catch (error) {
      const errorMessage = `Failed to delete mock: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  // === Operaciones de Import/Export ===

  /**
   * Exporta mocks del servicio actual
   */
  async handleExportMocks(serviceCode?: string): Promise<IHttpMockData[]> {
    try {
      this.setLoading(true);
      const exportServiceCode = serviceCode || this._selectedServiceCode() || '';
      this.setLastOperation(`Exporting mocks for service: ${exportServiceCode}`);

      const mocks = await this.httpMockService.exportMocks(exportServiceCode);
      this.setLastOperation(`Exported ${mocks.length} mocks`);
      
      return mocks;
    } catch (error) {
      const errorMessage = `Failed to export mocks: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Importa mocks desde datos JSON
   */
  async handleImportMocks(mocksData: any[]): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation(`Importing ${mocksData.length} mocks...`);

      // Validar y convertir datos
      const validMocks = mocksData.filter(data => 
        data.name && data.url && data.method && data.serviceCode
      );

      // Importar mocks uno por uno
      for (const mockData of validMocks) {
        await this.httpMockService.createMock(mockData);
      }

      // Refrescar lista si hay servicio seleccionado
      if (this._selectedServiceCode()) {
        await this.handleLoadMocksByServiceCode(this._selectedServiceCode()!);
      }

      this.setLastOperation(`Successfully imported ${validMocks.length} mocks`);
    } catch (error) {
      const errorMessage = `Failed to import mocks: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  // === Operaciones de recarga ===

  /**
   * Maneja la recarga general
   */
  async handleReload(): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation('Reloading...');

      // Refrescar estadísticas
      await this.refreshStatistics();

      // Si hay servicio seleccionado, recargar sus mocks
      if (this._selectedServiceCode()) {
        await this.handleLoadMocksByServiceCode(this._selectedServiceCode()!);
      }

      this.setLastOperation('Reload completed');
    } catch (error) {
      const errorMessage = `Failed to reload: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }

  // === Métodos de utilidad privados ===

  private async refreshStatistics(): Promise<void> {
    try {
      if (this.httpMockService) {
        const stats = this.httpMockService.statistics();
        this._statistics.set(stats);
      }
    } catch (error) {
      console.warn('Failed to refresh statistics:', error);
    }
  }

  private subscribeToServiceChanges(): void {
    if (this.httpMockService) {
      // Suscribirse a cambios en el estado del servicio
      // (Esto dependería de la implementación específica del HttpMockService)
      // Por ahora, manejamos los cambios manualmente en cada operación
    }
  }

  private setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  private setError(error: string | null): void {
    this._error.set(error);
  }

  private setLastOperation(operation: string | null): void {
    this._lastOperation.set(operation);
  }

  private getInitialState(): IHttpMockManagerPresenterState {
    return {
      isInitialized: false,
      isLoading: false,
      error: null,
      currentMocks: [],
      statistics: null,
      selectedServiceCode: null,
      lastOperation: null
    };
  }

  // === Limpieza de recursos ===

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.mockCreated$.complete();
    this.mockDeleted$.complete();
    this.mocksLoaded$.complete();
    this.error$.complete();
    this.stateChanged$.complete();
  }
}