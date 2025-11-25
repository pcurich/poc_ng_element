import { Injectable, signal, computed, OnDestroy, effect } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { HttpMockService } from '../../../core/services/HttpMockService';
import { HttpMockRepository } from '../../../core/repositories/HttpMockRepository';
import { HttpMockEntity, IHttpMockData } from '../../../core/models/HttpMockEntity';
import { ORMFactory } from '../../../core';
import { 
  ContextOption, 
  MockSchema, 
  MockBody,
  IHttpMockManagerPresenterState,
  IHttpMockManagerPresenterEvents,
  DatabaseConfig,
  DatabaseStatus,
  ServiceCodeWithStats 
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
  private readonly _availableServiceCodes = signal<ServiceCodeWithStats[]>([]);
  
  // === Estado de la base de datos ===
  private readonly _databaseStatus = signal<DatabaseStatus>({
    exists: false,
    isInitialized: false
  });
  private readonly _databaseConfig = signal<DatabaseConfig | null>(null);

  // === Computed properties públicas ===
  public readonly isInitialized = this._isInitialized.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly currentMocks = this._currentMocks.asReadonly();
  public readonly statistics = this._statistics.asReadonly();
  public readonly selectedServiceCode = this._selectedServiceCode.asReadonly();
  public readonly lastOperation = this._lastOperation.asReadonly();
  public readonly availableServiceCodes = this._availableServiceCodes.asReadonly();
  
  // === Estado de la base de datos ===
  public readonly databaseStatus = this._databaseStatus.asReadonly();
  public readonly databaseConfig = this._databaseConfig.asReadonly();
  
  // === Computed para mostrar tabs o configuración ===
  public readonly shouldShowDatabaseSetup = computed(() => !this._databaseStatus().exists);
  public readonly shouldShowManagementTabs = computed(() => 
    this._databaseStatus().exists && this._databaseStatus().isInitialized
  );

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
   * Inicializa el presenter y valida la existencia de la base de datos
   */
  async initialize(): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);
      this.setLastOperation('Initializing presenter...');

      // Primero verificar si la base de datos existe
      const dbStatus = await this.checkDatabaseExists();
      this._databaseStatus.set(dbStatus);
      
      if (!dbStatus.exists) {
        // Si no existe, cargar la configuración por defecto automáticamente
        await this.loadDefaultDatabaseConfig();
        
        // Inicializar estadísticas vacías para que no aparezcan como undefined
        this._statistics.set({
          totalMocks: 0,
          averageDelayMs: 0,
          mostUsedServiceCodes: [],
          methodDistribution: {},
          statusCodeDistribution: {}
        });
        
        // Inicializar lista de service codes vacía
        this._availableServiceCodes.set([]);
        
        this.setLastOperation('Database not found - default configuration loaded');
        this._isInitialized.set(true);
        return;
      }

      // Si existe, proceder con la inicialización normal
      await this.initializeServices();
      
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
      window.localStorage.setItem('useMock', JSON.stringify(contextOption.useMock));
      window.localStorage.setItem('selectedContext', JSON.stringify(contextOption));

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
   * Carga mocks por código de servicio y retorna el primer mock para auto-población
   */
  async handleLoadMocksByServiceCodeWithAutoPopulation(serviceCode: string): Promise<HttpMockEntity | null> {
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
      
      // Retornar el primer mock para auto-población (o el más reciente)
      return mocks.length > 0 ? mocks[0] : null;
    } catch (error) {
      const errorMessage = `Failed to load mocks: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
      return null;
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
   * Exporta TODOS los mocks de la base de datos sin filtros
   * Este método siempre devuelve todos los mocks independientemente del serviceCode seleccionado
   */
  async handleExportAllMocks(): Promise<IHttpMockData[]> {
    try {
      this.setLoading(true);
      this.setLastOperation('Exporting all mocks from database...');

      // Exportar sin filtro (sin serviceCode)
      const allMocks = await this.httpMockService.exportMocks();
      this.setLastOperation(`Exported ${allMocks.length} total mocks`);
      
      return allMocks;
    } catch (error) {
      const errorMessage = `Failed to export all mocks: ${error instanceof Error ? error.message : 'Unknown error'}`;
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

  public async refreshStatistics(): Promise<void> {
    try {
      if (this.httpMockService) {
        const stats = this.httpMockService.statistics();
        this._statistics.set(stats);
        
        console.log('📊 Statistics refreshed:', {
          totalMocks: stats?.totalMocks || 0,
          averageDelayMs: stats?.averageDelayMs || 0,
          serviceCodesCount: stats?.mostUsedServiceCodes?.length || 0
        });
        
        // También actualizar la lista de service codes disponibles
        await this.refreshAvailableServiceCodes();
      } else {
        // Si no hay servicio, inicializar con estadísticas vacías
        this._statistics.set({
          totalMocks: 0,
          averageDelayMs: 0,
          mostUsedServiceCodes: [],
          methodDistribution: {},
          statusCodeDistribution: {}
        });
        
        console.log('📊 Statistics initialized with empty values (no service available)');
      }
    } catch (error) {
      console.warn('Failed to refresh statistics:', error);
      // En caso de error, establecer estadísticas vacías para evitar undefined
      this._statistics.set({
        totalMocks: 0,
        averageDelayMs: 0,
        mostUsedServiceCodes: [],
        methodDistribution: {},
        statusCodeDistribution: {}
      });
    }
  }

  /**
   * Refresca la lista de códigos de servicio disponibles
   */
  public async refreshAvailableServiceCodes(): Promise<void> {
    try {
      if (this.httpMockService) {
        const serviceCodes = await this.httpMockService.getServiceCodesWithStats();
        this._availableServiceCodes.set(serviceCodes);
      }
    } catch (error) {
      console.warn('Failed to refresh available service codes:', error);
      this._availableServiceCodes.set([]);
    }
  }

  /**
   * Método público para cargar códigos de servicio disponibles
   */
  async loadAvailableServiceCodes(): Promise<void> {
    await this.refreshAvailableServiceCodes();
  }

  /**
   * Verifica si la base de datos existe en IndexedDB
   */
  private async checkDatabaseExists(): Promise<DatabaseStatus> {
    try {
      const config = ORMFactory.getDefaultHttpMocksConfig();
      
      // Verificar si la base de datos existe sin crearla
      const dbExists = await this.isDatabasePresent(config.name);
      
      if (!dbExists) {
        return {
          exists: false,
          isInitialized: false
        };
      }

      // Si existe, verificar que esté correctamente configurada
      try {
        const dbContext = ORMFactory.createDbContext(config);
        await dbContext.open();
        await dbContext.close();
        
        return {
          exists: true,
          isInitialized: true,
          config: config
        };
      } catch (error) {
        return {
          exists: true,
          isInitialized: false,
          error: `Database exists but failed to initialize: ${error}`
        };
      }
    } catch (error) {
      return {
        exists: false,
        isInitialized: false,
        error: `Error checking database: ${error}`
      };
    }
  }

  /**
   * Verifica si una base de datos existe en IndexedDB sin crearla
   * Utiliza la API databases() para consultar sin crear accidentalmente una DB vacía
   */
  private async isDatabasePresent(dbName: string): Promise<boolean> {
    try {
      if (!window.indexedDB) {
        return false;
      }

      // Usar la API databases() si está disponible (navegadores modernos)
      if (typeof indexedDB.databases === 'function') {
        const databases = await indexedDB.databases();
        const targetDb = databases.find(db => db.name === dbName);
        
        if (!targetDb) {
          return false;
        }

        // Verificar que la DB tenga object stores (no esté vacía)
        return new Promise((resolve) => {
          const openRequest = indexedDB.open(dbName, targetDb.version);
          
          openRequest.onerror = () => resolve(false);
          
          openRequest.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            try {
              const hasObjectStores = db.objectStoreNames.length > 0;
              db.close();
              resolve(hasObjectStores);
            } catch (error) {
              db.close();
              resolve(false);
            }
          };

          // Si se dispara onupgradeneeded, no debería pasar con versión específica
          openRequest.onupgradeneeded = () => {
            const db = openRequest.result;
            db.close();
            resolve(false);
          };
        });
      }

      // Fallback para navegadores que no soportan databases()
      // Este método puede crear una DB vacía, pero es necesario como fallback
      return new Promise((resolve) => {
        const openRequest = indexedDB.open(dbName);
        
        openRequest.onerror = () => resolve(false);
        
        openRequest.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          try {
            const hasObjectStores = db.objectStoreNames.length > 0;
            db.close();
            resolve(hasObjectStores);
          } catch (error) {
            db.close();
            resolve(false);
          }
        };
        
        openRequest.onupgradeneeded = () => {
          // DB no existía, se está creando - la cerramos inmediatamente
          const db = openRequest.result;
          db.close();
          resolve(false);
        };
      });
    } catch (error) {
      console.error('Error checking database presence:', error);
      return false;
    }
  }

  /**
   * Carga la configuración por defecto de la base de datos para el formulario
   */
  public async loadDefaultDatabaseConfig(): Promise<void> {
    try {
      const defaultConfig = ORMFactory.getDefaultHttpMocksConfig();
      
      const objectStore = defaultConfig.objectStores[0];
      const databaseConfig: DatabaseConfig = {
        name: defaultConfig.name,
        version: defaultConfig.version,
        objectStoreName: objectStore.name,
        keyPath: (objectStore.options?.keyPath as string) || 'id',
        indexes: objectStore.indexes?.map(index => ({
          name: index.name,
          keyPath: index.keyPath as string,
          unique: index.options?.unique || false
        })) || []
      };
      
      this._databaseConfig.set(databaseConfig);
      this.setLastOperation('Default database configuration loaded');
      
      console.log('📄 Database configuration loaded:', {
        name: databaseConfig.name,
        version: databaseConfig.version,
        objectStoreName: databaseConfig.objectStoreName,
        keyPath: databaseConfig.keyPath,
        indexesCount: databaseConfig.indexes?.length || 0
      });
      
    } catch (error) {
      this.setError(`Failed to load default database configuration: ${error}`);
    }
  }

  /**
   * Inicializa los servicios una vez que la base de datos existe
   */
  private async initializeServices(): Promise<void> {
    try {
      // Cargar configuración de la base de datos
      await this.loadDefaultDatabaseConfig();
      
      // Crear configuración y contexto de base de datos
      const config = ORMFactory.getDefaultHttpMocksConfig();
      const dbContext = ORMFactory.createDbContext(config);
      await dbContext.open();

      // Crear repository y servicio
      this.httpMockRepository = ORMFactory.createHttpMockRepository(dbContext);
      this.httpMockService = new HttpMockService();
      await this.httpMockService.initialize(this.httpMockRepository);

      
      // Actualizar estadísticas después de inicializar los servicios
      await this.refreshStatistics();
      
      // Actualizar estado de la base de datos
      this._databaseStatus.update(status => ({
        ...status,
        isInitialized: true
      }));

      this.setLastOperation('Services initialized successfully');
      
    } catch (error) {
      const errorMessage = `Failed to initialize services: ${error}`;
      this.setError(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Crea la base de datos con la configuración proporcionada
   */
  async handleCreateDatabase(config: DatabaseConfig): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation('Creating database...');

      // Convertir DatabaseConfig a IDbConfig
      const dbConfig = {
        name: config.name,
        version: config.version,
        objectStores: [
          {
            name: config.objectStoreName,
            options: { keyPath: config.keyPath },
            indexes: config.indexes.map(index => ({
              name: index.name,
              keyPath: index.keyPath,
              options: { unique: index.unique }
            }))
          }
        ]
      };

      // Crear la base de datos
      const dbContext = ORMFactory.createDbContext(dbConfig);
      await dbContext.open();
      await dbContext.close();

      // Actualizar estado
      this._databaseStatus.set({
        exists: true,
        isInitialized: false,
        config: dbConfig
      });

      // Inicializar servicios
      await this.initializeServices();

      this.setLastOperation('Database created successfully');
      console.log('🗃️ Database created and initialized successfully');

    } catch (error) {
      const errorMessage = `Failed to create database: ${error}`;
      this.setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      this.setLoading(false);
    }
  }


  private setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  private setError(error: string | null): void {
    this._error.set(error);
  }

  // === Gestión avanzada de base de datos ===

  /**
   * Elimina completamente una base de datos IndexedDB
   */
  async deleteDatabase(dbName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const deleteRequest = indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onerror = () => {
        reject(new Error(`Failed to delete database: ${deleteRequest.error?.message || 'Unknown error'}`));
      };
      
      deleteRequest.onsuccess = () => {
        // Actualizar el estado interno
        this._databaseStatus.set({
          exists: false,
          isInitialized: false
        });
        this._databaseConfig.set(null);
        
        console.log(`🗑️ Database '${dbName}' deleted successfully`);
        resolve();
      };
      
      deleteRequest.onblocked = () => {
        console.warn(`⚠️ Database deletion blocked. Close all other tabs using this database.`);
        // En una implementación real, podrías mostrar un mensaje al usuario
        // Por ahora, seguimos intentando
      };
    });
  }

  /**
   * Limpia todos los mocks de la base de datos
   */
  async clearAllMocks(): Promise<void> {
    try {
      this.setLoading(true);
      this.setLastOperation('Clearing all mocks from database...');

      if (!this.httpMockService) {
        throw new Error('HTTP Mock Service not initialized');
      }

      await this.httpMockService.clearAllMocks();
      
      // Resetear estado local
      this._currentMocks.set([]);
      this._statistics.set({
        totalMocks: 0,
        averageDelayMs: 0,
        mostUsedServiceCodes: [],
        methodDistribution: {},
        statusCodeDistribution: {}
      });
      this._availableServiceCodes.set([]);

      this.setLastOperation('All mocks cleared successfully');
    } catch (error) {
      const errorMessage = `Failed to clear mocks: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      throw error;
    } finally {
      this.setLoading(false);
    }
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

  /**
   * Busca un mock por serviceCode
   */
  async findMockByServiceCode(serviceCode: string): Promise<HttpMockEntity | null> {
    try {
      this.setLoading(true);
      // Usar el repositorio directamente para buscar
      const mocks = await this.httpMockRepository.findByServiceCode(serviceCode);
      // Retornar el primero si existe
      return mocks.length > 0 ? mocks[0] : null;
    } catch (error) {
      console.error('Error finding mock by service code:', error);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Actualiza un mock existente con un nuevo schema
   */
  async handleUpdateMockSchema(mockId: string, mockSchema: MockSchema): Promise<HttpMockEntity | null> {
    try {
      this.setLoading(true);
      this.setLastOperation(`Updating mock: ${mockSchema.nameMock}`);

      const updateData: Partial<IHttpMockData> = {
        name: mockSchema.nameMock,
        serviceCode: mockSchema.serviceCode,
        url: mockSchema.url,
        method: mockSchema.httpMethod,
        httpCodeResponseValue: mockSchema.httpCodeResponseValue,
        delayMs: mockSchema.delayMs,
        headers: mockSchema.headers
      };

      const updatedMock = await this.httpMockService.updateMock(mockId, updateData);
      
      if (updatedMock) {
        // Actualizar el estado local si el mock está en la lista actual
        this._currentMocks.update(mocks => 
          mocks.map(mock => mock.id === mockId ? updatedMock : mock)
        );
        
        await this.refreshStatistics();
        this.setLastOperation(`Mock "${mockSchema.nameMock}" updated successfully`);
        return updatedMock;
      }
      
      return null;
    } catch (error) {
      const errorMessage = `Failed to update mock: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.setError(errorMessage);
      this.error$.next(errorMessage);
      return null;
    } finally {
      this.setLoading(false);
    }
  }
}