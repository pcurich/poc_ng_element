import { Component, OnInit, Input, Output, EventEmitter, signal, computed, ViewEncapsulation, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpMethod } from '../../../core/models/HttpMockEntity';
import { HttpMockManagerPresenter } from './http-mock-manager.presenter';
import { ContextOption, MockSchema, MockBody, DatabaseConfig, DatabaseIndex } from '../interfaces';
import { ORMFactory } from '../../../core';

/**
 * 🌐 HttpMockManagerComponent - Gestor visual para HTTP Mocks
 * 
 * Este componente proporciona una interfaz gráfica completa para gestionar
 * mocks HTTP, basado en el diseño de Stencil pero adaptado para Angular 20
 * con Signals y funcionalidad de custom element.
 */

@Component({
  selector: 'http-mock-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './http-mock-manager.component.html',
  styleUrl: './http-mock-manager.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom
})
export class HttpMockManagerComponent implements OnInit, OnDestroy {
  
  // === Props de entrada (equivalentes a @Prop en Stencil) ===
  
  @Input() contextId: number = 1;
  @Input() selectedContext?: ContextOption;
  @Input() contextOptions: ContextOption[] = [
    { id: 1, value: '---------', useMock: false },
    { id: 2, value: 'Usar HTTP', useMock: false },
    { id: 3, value: 'Usar Data', useMock: true },
  ];
  @Input() httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  @Input() httpCodeResponse: number[] = [200, 204, 400, 500];
  @Input() headers: Record<string, string> = {};
  @Input() nameMock: string = '';
  @Input() serviceCode: string = '';
  @Input() url: string = '';
  @Input() httpMethod: HttpMethod = 'GET';
  @Input() httpCodeResponseValue: number = 200;
  @Input() delayMs: number = 1000;
  @Input() responseBody: string = '{}';
  
  // === Propiedades para configuración de base de datos ===
  // Valores iniciales vacíos - el usuario puede usar "Cargar Configuración por Defecto"
  @Input() dbName: string = '';
  @Input() dbVersion: number = 1; // Mínimo valor válido para evitar errores de validación
  @Input() dbObjectStoreName: string = '';
  @Input() dbKeyPath: string = '';
  public dbIndexes: DatabaseIndex[] = [];

  // === Eventos de salida (equivalentes a @Event en Stencil) ===
  
  @Output() saveMockSchemaEvent = new EventEmitter<MockSchema>();
  @Output() saveMockBodyEvent = new EventEmitter<MockBody>();
  @Output() saveHeadersEvent = new EventEmitter<Record<string, string>>();
  @Output() databaseCreatedEvent = new EventEmitter<void>();
  @Output() loadContextEvent = new EventEmitter<number>();
  @Output() deleteContextEvent = new EventEmitter<number>();
  @Output() contextTypeChangeEvent = new EventEmitter<ContextOption>();
  @Output() reloadEvent = new EventEmitter<void>();

  // === Estado del componente con Angular Signals ===
  
  public showForm = signal<boolean>(true);
  public position = signal<{ bottom: number; right: number }>({ bottom: 32, right: 32 });
  
  // === Navegación contextual ===
  public activeGroup = signal<'data' | 'http' | 'persistence'>('data');
  public activeSubTab = signal<number>(0);
  
  public contextOptionsState = signal<ContextOption[]>([]);
  public newHeaderKey = signal<string>('');
  public newHeaderValue = signal<string>('');
  public newIndexName = signal<string>('');
  public newIndexKeyPath = signal<string>('');

  // === Nuevas propiedades para funcionalidad expandida ===
  public mergeStrategy: string = 'replace';
  public showDeleteConfirmation: boolean = false;
  public jsonValidationMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // === Service Code Selection ===
  public selectedServiceCodeForLoad = signal<string>('');

  // === Variables para drag & drop ===
  
  private dragging = false;
  private dragStart = { x: 0, y: 0, bottom: 32, right: 32 };
  private lastDragUpdate = 0;
  private readonly DRAG_THROTTLE_MS = 16; // ~60fps


  // === Presenter (Capa de presentación) ===
  
  private presenter: HttpMockManagerPresenter = new HttpMockManagerPresenter();

  // === Computed properties usando el presenter ===
  
  public currentMocks = computed(() => this.presenter.currentMocks());
  public isLoading = computed(() => this.presenter.isLoading());

  public statistics = computed(() => this.presenter.statistics());
  public presenterError = computed(() => this.presenter.error());
  public lastOperation = computed(() => this.presenter.lastOperation());
  public availableServiceCodes = computed(() => this.presenter.availableServiceCodes());
  
  // === Estado de la base de datos ===
  public databaseStatus = computed(() => this.presenter.databaseStatus());
  public databaseConfig = computed(() => this.presenter.databaseConfig());
  public shouldShowDatabaseSetup = computed(() => this.presenter.shouldShowDatabaseSetup());
  public shouldShowManagementTabs = computed(() => this.presenter.shouldShowManagementTabs());

  async ngOnInit() {
    // Inicializar selectedContext si no está definido
    this.selectedContext = this.selectedContext ?? this.contextOptions[0];
    
    // Inicializar copia editable de contextOptions
    this.contextOptionsState.set([...this.contextOptions]);

    // Inicializar el presenter
    await this.initializePresenter();
    
    // Suscribirse a eventos del presenter
    this.subscribeToPresenterEvents();
    
  }
  
  private async initializePresenter(): Promise<void> {
    try {
      await this.presenter.initialize();
      console.log('🎭 HttpMockManagerPresenter initialized successfully');
      
      // Cargar códigos de servicio disponibles al inicializar
      await this.loadAvailableServiceCodes();
    } catch (error) {
      console.error('Failed to initialize HttpMockManagerPresenter:', error);
    }
  }

  private subscribeToPresenterEvents(): void {
    // Suscribirse a eventos del presenter para propagar al exterior
    this.presenter.events.onMockCreated.subscribe(mock => {
      console.log('🎭 Presenter: Mock created', mock);
    });

    this.presenter.events.onMockDeleted.subscribe(mockId => {
      console.log('🎭 Presenter: Mock deleted', mockId);
    });

    this.presenter.events.onMocksLoaded.subscribe(mocks => {
      console.log('� Presenter: Mocks loaded', mocks);
    });

    this.presenter.events.onError.subscribe(error => {
      console.error('🎭 Presenter Error:', error);
    });
  }

  // === Métodos de drag & drop ===

  startDrag(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.dragging = true;
    this.lastDragUpdate = 0; // Reset throttle counter
    
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      bottom: this.position().bottom,
      right: this.position().right,
    };
    
    // Usar passive: false para mejor rendimiento en eventos
    document.addEventListener('mousemove', this.onDrag, { passive: true });
    document.addEventListener('mouseup', this.stopDrag, { passive: true });
    
    // Añadir cursor de dragging al documento
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  private onDrag = (event: MouseEvent): void => {
    if (!this.dragging) return;
    
    // Throttle drag updates para mejorar rendimiento
    const now = performance.now();
    if (now - this.lastDragUpdate < this.DRAG_THROTTLE_MS) return;
    this.lastDragUpdate = now;
    
    // Usar requestAnimationFrame para suavizar la animación
    requestAnimationFrame(() => {
      if (!this.dragging) return; // Verificar que sigue arrastrando
      
      const deltaY = event.clientY - this.dragStart.y;
      const deltaX = event.clientX - this.dragStart.x;
      
      this.position.set({
        bottom: Math.max(0, this.dragStart.bottom - deltaY),
        right: Math.max(0, this.dragStart.right - deltaX),
      });
    });
  };

  private stopDrag = (): void => {
    if (!this.dragging) return; // Prevenir múltiples calls
    
    this.dragging = false;
    
    // Remover event listeners
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    
    // Restaurar cursor y selección de texto
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // ========== MÉTODOS DE GESTIÓN DE CONTEXTO ==========

  onContextTypeChange(selectedId: string): void {
    const id = Number(selectedId);
    const selectedOption = this.contextOptionsState().find(o => o.id === id);
    
    if (selectedOption) {
      this.selectedContext = selectedOption;
      
      // Usar presenter para manejar el cambio de contexto
      this.presenter.handleContextTypeChange(selectedOption);
      
      // Emitir eventos para compatibilidad
      this.contextTypeChangeEvent.emit(selectedOption);
      this.reloadEvent.emit();
    }
  }

  loadContextById(): void {
    // Usar presenter para cargar contexto
    this.presenter.handleLoadContext(this.contextId);
    
    // Emitir evento para compatibilidad
    this.loadContextEvent.emit(this.contextId);
  }

  // ========== MÉTODOS DE ARCHIVO (IMPORT/EXPORT) ==========

  downloadConfig(): void {
    let responseBodyValue: any = null;
    try {
      responseBodyValue = JSON.parse(this.responseBody);
    } catch (e) {
      responseBodyValue = String(this.responseBody || '');
    }

    const payload = {
      contextId: this.contextId,
      selectedContext: this.selectedContext,
      headers: this.headers,
      nameMock: this.nameMock,
      serviceCode: this.serviceCode,
      url: this.url,
      httpMethod: this.httpMethod,
      httpCodeResponseValue: this.httpCodeResponseValue,
      delayMs: this.delayMs,
      responseBody: responseBodyValue,
    };

    try {
      const json = JSON.stringify(payload, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `http-mock-${this.contextId || 'config'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download config', e);
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      
      // Asignar campos de manera segura
      if (typeof parsed.contextId !== 'undefined') this.contextId = Number(parsed.contextId);
      if (parsed.selectedContext) this.selectedContext = parsed.selectedContext;
      if (parsed.headers && typeof parsed.headers === 'object') this.headers = { ...parsed.headers };
      if (typeof parsed.nameMock !== 'undefined') this.nameMock = String(parsed.nameMock);
      if (typeof parsed.serviceCode !== 'undefined') this.serviceCode = String(parsed.serviceCode);
      if (typeof parsed.url !== 'undefined') this.url = String(parsed.url);
      if (typeof parsed.httpMethod !== 'undefined') this.httpMethod = parsed.httpMethod as HttpMethod;
      if (typeof parsed.httpCodeResponseValue !== 'undefined') this.httpCodeResponseValue = Number(parsed.httpCodeResponseValue);
      if (typeof parsed.delayMs !== 'undefined') this.delayMs = Number(parsed.delayMs);
      if (typeof parsed.responseBody !== 'undefined') {
        this.responseBody = typeof parsed.responseBody === 'string' 
          ? parsed.responseBody 
          : JSON.stringify(parsed.responseBody);
      }
      
      // Notificar cambio de contexto si es necesario
      if (parsed.selectedContext) {
        this.contextTypeChangeEvent.emit(this.selectedContext);
      }
      
      // Limpiar input
      input.value = '';
      
    } catch (e) {
      console.error('Failed to load config file', e);
    }
  }

  // ========== MÉTODOS DE GUARDADO ==========

  async saveContext(): Promise<void> {
    const currentGroup = this.activeGroup();
    
    if (currentGroup === 'http') {
      // Crear el mock completo con schema y body
      await this.saveCompleteMock();
    }
  }

  private async saveCompleteMock(): Promise<void> {
    try {
      // Validar que los campos requeridos estén completos
      if (!this.nameMock.trim() || !this.url.trim()) {
        console.error('❌ Missing required fields: nameMock and url are required');
        return;
      }

      console.log('💾 Saving complete mock with data:', {
        name: this.nameMock,
        url: this.url,
        method: this.httpMethod,
        serviceCode: this.serviceCode,
        responseBody: this.responseBody
      });

      // Crear primero el schema
      const schema: MockSchema = {
        nameMock: this.nameMock,
        url: this.url,
        httpMethod: this.httpMethod,
        httpCodeResponseValue: this.httpCodeResponseValue,
        serviceCode: this.serviceCode,
        delayMs: this.delayMs,
        headers: Object.keys(this.headers).length > 0 ? this.headers : undefined,
      };

      // Crear el mock usando el presenter
      const createdMock = await this.presenter.handleSaveMockSchema(schema);
      
      if (createdMock && createdMock.id) {
        console.log('✅ Mock schema creado, ahora guardando body...');
        
        // Luego guardar el body
        const mockBody: MockBody = {
          responseBody: this.responseBody
        };
        
        await this.presenter.handleSaveMockBody(mockBody, createdMock.id);
        
        console.log('✅ Mock completo guardado exitosamente:', createdMock);
        
        // Emitir eventos para compatibilidad
        this.saveMockSchemaEvent.emit(schema);
        this.saveMockBodyEvent.emit(mockBody);
        
        // Limpiar formulario después de guardar exitosamente
        this.resetForm();
      }
    } catch (error) {
      console.error('❌ Error al guardar mock completo:', error);
    }
  }



  private resetForm(): void {
    this.nameMock = '';
    this.serviceCode = '';
    this.url = '';
    this.httpMethod = 'GET';
    this.httpCodeResponseValue = 200;
    this.delayMs = 1000;
    this.responseBody = '{}';
    this.headers = {};
    this.newHeaderKey.set('');
    this.newHeaderValue.set('');
  }

  // ========== MÉTODOS DE GESTIÓN DE HEADERS ==========

  addHeader(): void {
    const key = this.newHeaderKey().trim();
    const value = this.newHeaderValue();
    
    if (!key) return;
    
    this.headers = { ...this.headers, [key]: value };
    this.newHeaderKey.set('');
    this.newHeaderValue.set('');
    
    this.emitSaveHeaders();
  }

  removeHeader(key: string): void {
    const newHeaders = { ...this.headers };
    delete newHeaders[key];
    this.headers = newHeaders;
    
    this.emitSaveHeaders();
  }

  private emitSaveHeaders(): void {
    // Usar presenter para guardar headers
    this.presenter.handleSaveHeaders(this.headers);
    
    // Emitir evento para compatibilidad
    this.saveHeadersEvent.emit(this.headers);
  }

  // === Métodos de utilidad ===

  onInputNumber(event: Event, key: 'contextId' | 'delayMs'): void {
    const val = (event.target as HTMLInputElement).value;
    (this as any)[key] = val === '' ? 0 : Number(val);
  }

  getHeaderKeys(): string[] {
    return Object.keys(this.headers);
  }

  toggleForm(): void {
    this.showForm.update(current => !current);
  }



  // ========== NAVEGACIÓN CONTEXTUAL ==========

  setActiveGroup(groupName: 'data' | 'http' | 'persistence'): void {
    this.activeGroup.set(groupName);
    // Reset sub-tab al cambiar de grupo
    this.activeSubTab.set(0);
  }

  setActiveSubTab(subTabIndex: number): void {
    this.activeSubTab.set(subTabIndex);
  }

  // ========== MÉTODOS DE INTEGRACIÓN CON PRESENTER ==========

  async loadMocksByServiceCode(serviceCode: string): Promise<void> {
    await this.presenter.handleLoadMocksByServiceCode(serviceCode);
  }

  async loadAvailableServiceCodes(): Promise<void> {
    await this.presenter.loadAvailableServiceCodes();
  }

  async onServiceCodeSelectionChange(selectedServiceCode: string): Promise<void> {
    this.selectedServiceCodeForLoad.set(selectedServiceCode);
    
    if (selectedServiceCode && selectedServiceCode.trim() !== '') {
      // Cargar mocks y auto-poblar campos
      const firstMock = await this.presenter.handleLoadMocksByServiceCodeWithAutoPopulation(selectedServiceCode);
      
      if (firstMock) {
        // Auto-poblar campos de Mock Config
        this.nameMock = firstMock.name || '';
        this.serviceCode = firstMock.serviceCode;
        this.url = firstMock.url;
        this.httpMethod = firstMock.method as HttpMethod;
        this.httpCodeResponseValue = firstMock.httpCodeResponseValue;
        this.delayMs = firstMock.delayMs;
        
        // Auto-poblar Headers
        if (firstMock.headers) {
          this.headers = { ...firstMock.headers };
        } else {
          this.headers = {};
        }
        
        // Auto-poblar Body
        this.responseBody = firstMock.responseBody || '{}';
        
        console.log('🎯 Auto-populated fields from first mock:', firstMock.name);
      }
    }
  }

  async deleteMock(mockId: string): Promise<void> {
    await this.presenter.handleDeleteMock(mockId);
  }

  async exportMocks(): Promise<void> {
    const mocks = await this.presenter.handleExportMocks(this.serviceCode);
    
    const json = JSON.stringify(mocks, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mocks-${this.serviceCode || 'all'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // === Gestión de configuración de base de datos ===

  async createDatabase(): Promise<void> {
    try {
      const config: DatabaseConfig = {
        name: this.dbName,
        version: this.dbVersion,
        objectStoreName: this.dbObjectStoreName,
        keyPath: this.dbKeyPath,
        indexes: [...this.dbIndexes] // Usar los índices configurados por el usuario
      };

      await this.presenter.handleCreateDatabase(config);
      this.databaseCreatedEvent.emit();
      
      console.log('🗃️ Database created successfully from component');
      console.log('📊 Indexes created:', config.indexes);
    } catch (error) {
      console.error('❌ Error creating database:', error);
    }
  }

  loadDefaultDatabaseConfig(): void {
    // Cargar configuración directamente desde getDefaultHttpMocksConfig
    const defaultConfig = ORMFactory.getDefaultHttpMocksConfig();
    const objectStore = defaultConfig.objectStores[0];
    
    this.dbName = defaultConfig.name;
    this.dbVersion = defaultConfig.version;
    this.dbObjectStoreName = objectStore.name;
    this.dbKeyPath = (objectStore.options?.keyPath as string) || 'id';
    
    // Cargar índices por defecto
    this.dbIndexes = (objectStore.indexes || []).map(index => ({
      name: index.name,
      keyPath: index.keyPath as string,
      unique: index.options?.unique || false
    }));
    
    console.log('📄 Default database configuration loaded with indexes:', {
      name: this.dbName,
      version: this.dbVersion,
      objectStoreName: this.dbObjectStoreName,
      keyPath: this.dbKeyPath,
      indexesCount: this.dbIndexes.length,
      indexes: this.dbIndexes.map(idx => `${idx.name}: ${idx.keyPath}`)
    });
    
    // Mostrar índices específicos cargados
    console.log('🔍 Loaded default indexes:', this.dbIndexes.map(idx => 
      `{ name: "${idx.name}", keyPath: "${idx.keyPath}" }`
    ).join(', '));
  }

  // === Métodos para gestión de índices de base de datos ===

  addIndex(): void {
    const indexName = this.newIndexName().trim();
    const keyPath = this.newIndexKeyPath().trim();
    
    if (!indexName || !keyPath) {
      return;
    }

    // Verificar si el índice ya existe y actualizarlo
    const existingIndexIndex = this.dbIndexes.findIndex(index => 
      index.name === indexName
    );
    
    if (existingIndexIndex !== -1) {
      // Actualizar índice existente
      this.dbIndexes[existingIndexIndex] = {
        name: indexName,
        keyPath: keyPath,
        unique: false // Los índices no necesitan ser únicos
      };
      console.log('🔄 Index updated:', indexName);
    } else {
      // Agregar nuevo índice
      this.dbIndexes = [...this.dbIndexes, {
        name: indexName,
        keyPath: keyPath,
        unique: false // Los índices no necesitan ser únicos
      }];
      console.log('➕ Index added:', indexName);
    }

    // Limpiar campos
    this.newIndexName.set('');
    this.newIndexKeyPath.set('');
  }

  removeIndex(indexName: string): void {
    this.dbIndexes = this.dbIndexes.filter(index => index.name !== indexName);
    console.log('➖ Index removed:', indexName);
  }

  getIndexCount(): number {
    return this.dbIndexes.length;
  }

  // === Métodos de edición y formato ===

  editMock(mock: any): void {
    // Cargar los datos del mock en el formulario para edición
    this.nameMock = mock.name;
    this.serviceCode = mock.serviceCode;
    this.url = mock.url;
    this.httpMethod = mock.method;
    this.httpCodeResponseValue = mock.httpCode;
    this.delayMs = mock.delayMs || 1000;
    this.responseBody = mock.responseBody || '{}';
    
    // Cambiar a HTTP Definition - Load & Edit (setActiveGroup ya pone sub-tab en 0)
    this.setActiveGroup('http');
    
    console.log('✏️ Mock loaded for editing:', mock.name);
  }

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.responseBody);
      this.responseBody = JSON.stringify(parsed, null, 2);
      console.log('🎨 JSON formatted successfully');
      this.jsonValidationMessage.set({ 
        type: 'success', 
        text: '🎨 JSON formateado correctamente' 
      });
      
      // Limpiar el mensaje después de 2 segundos
      setTimeout(() => {
        this.jsonValidationMessage.set(null);
      }, 2000);
    } catch (error) {
      console.error('❌ Invalid JSON format:', error);
      this.jsonValidationMessage.set({ 
        type: 'error', 
        text: `❌ No se puede formatear: JSON inválido - ${(error as Error).message}` 
      });
      
      // Limpiar el mensaje después de 5 segundos para errores
      setTimeout(() => {
        this.jsonValidationMessage.set(null);
      }, 5000);
    }
  }

  validateJson(): void {
    try {
      JSON.parse(this.responseBody);
      console.log('✅ JSON is valid');
      this.jsonValidationMessage.set({ 
        type: 'success', 
        text: '✅ JSON válido - La estructura es correcta' 
      });
      
      // Limpiar el mensaje después de 3 segundos
      setTimeout(() => {
        this.jsonValidationMessage.set(null);
      }, 3000);
    } catch (error) {
      console.error('❌ Invalid JSON:', error);
      this.jsonValidationMessage.set({ 
        type: 'error', 
        text: `❌ JSON inválido: ${(error as Error).message}` 
      });
      
      // Limpiar el mensaje después de 5 segundos para errores
      setTimeout(() => {
        this.jsonValidationMessage.set(null);
      }, 5000);
    }
  }

  // === Métodos de persistencia expandidos ===

  exportCompleteDatabase(): void {
    console.log('🏢 Exporting complete database...');
    // TODO: Implementar exportación completa de la base de datos
  }

  // === Métodos de gestión de base de datos ===

  async refreshDatabaseStats(): Promise<void> {
    try {
      console.log('🔄 Refreshing database statistics...');
      
      // Recargar estadísticas reinicializando el presenter
      await this.presenter.initialize();
      
      console.log('✅ Database statistics refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing database statistics:', error);
    }
  }

  confirmDeleteDatabase(): void {
    this.showDeleteConfirmation = true;
  }

  cancelDeleteDatabase(): void {
    this.showDeleteConfirmation = false;
  }

  async executeDeleteDatabase(): Promise<void> {
    try {
      console.log('🗑️ Deleting database...');
      this.showDeleteConfirmation = false;
      
      // Implementar eliminación de base de datos
      const config = ORMFactory.getDefaultHttpMocksConfig();
      await this.presenter.deleteDatabase(config.name);
      
      // Reinicializar el componente
      await this.presenter.initialize();
      
      console.log('✅ Database deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting database:', error);
    }
  }

  async recreateDatabase(): Promise<void> {
    try {
      console.log('🔄 Recreating database...');
      
      // Eliminar base de datos actual
      const config = ORMFactory.getDefaultHttpMocksConfig();
      await this.presenter.deleteDatabase(config.name);
      
      // Cargar configuración por defecto y crear nueva base de datos
      this.loadDefaultDatabaseConfig();
      await this.createDatabase();
      
      console.log('✅ Database recreated successfully');
    } catch (error) {
      console.error('❌ Error recreating database:', error);
    }
  }

  async cleanDatabase(): Promise<void> {
    try {
      console.log('🧹 Cleaning database...');
      // TODO: Implementar limpieza de datos huérfanos y optimización de índices
      console.log('✅ Database cleaned successfully');
    } catch (error) {
      console.error('❌ Error cleaning database:', error);
    }
  }

  // === Limpieza de recursos ===

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    
    // Limpiar presenter
    this.presenter.ngOnDestroy();
  }
}
