import { Component, OnInit, Input, Output, EventEmitter, signal, computed, ViewEncapsulation, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpMethod } from '../../../core/models/HttpMockEntity';
import { HttpMockManagerPresenter } from './http-mock-manager.presenter';
import { ContextOption, MockSchema, MockBody, DatabaseConfig, DatabaseIndex } from '../interfaces';
import {
  ORMFactory,
  generateHash,
  validateHash,
  extractDataWithoutHash,
  downloadAsJson,
  readJsonFile,
  createMocksExport,
  validateImportedFile,
  isExportMocksData,
  isExportDatabaseData
} from '../../../core';

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
  @Output() deleteContextEvent = new EventEmitter<number>();
  @Output() contextTypeChangeEvent = new EventEmitter<ContextOption>();
  @Output() reloadEvent = new EventEmitter<void>();

  // === Estado del componente con Angular Signals ===

  public showForm = signal<boolean>(false);
  public position = signal<{ bottom: number; right: number }>({ bottom: 32, right: 32 });

  // === Navegación contextual ===
  public activeGroup = signal<'data' | 'http' | 'persistence'>('data');
  public activeSubTab = signal<number>(0);

  public contextOptionsState = signal<ContextOption[]>([]);
  public newHeaderKey = signal<string>('');
  public newHeaderValue = signal<string>('');
  public editingHeaderKey = signal<string | null>(null);
  public newIndexName = signal<string>('');
  public newIndexKeyPath = signal<string>('');

  // === Nuevas propiedades para funcionalidad expandida ===
  public showDeleteConfirmation: boolean = false;
  public showSaveConfirmation = signal<boolean>(false);
  public jsonValidationMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  // === Service Code Selection ===
  public selectedServiceCodeForLoad: string = '';

  // === Variables para drag & drop optimizado ===
  private dragging = false;
  private dragStart = { x: 0, y: 0, bottom: 32, right: 32 };
  private animationId = 0;
  private dragElement: HTMLElement | null = null;


  // === Presenter (Capa de presentación) ===
  private presenter: HttpMockManagerPresenter = new HttpMockManagerPresenter();

  constructor() {
    effect(() => {
      console.log('👀 showSaveConfirmation signal changed:', this.showSaveConfirmation());
    });
  }

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

  // ========== LIFECYCLE METHODS ==========

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

      // Cargar códigos de servicio disponibles al inicializar
      await this.presenter.loadAvailableServiceCodes();

      // Inicializar estadísticas de la base de datos
      await this.refreshDatabaseStats();
    } catch (error) {
      console.error('Failed to initialize HttpMockManagerPresenter:', error);
    }
  }

  private subscribeToPresenterEvents(): void {
    // Suscribirse a eventos del presenter para propagar al exterior
    this.presenter.events.onMockCreated.subscribe(mock => {
      // Mock created
    });

    this.presenter.events.onMockDeleted.subscribe(mockId => {
      // Mock deleted
    });

    this.presenter.events.onMocksLoaded.subscribe(mocks => {
      // Mocks loaded
    });

    this.presenter.events.onError.subscribe(error => {
      console.error('🎭 Presenter Error:', error);
    });
  }

  // === Métodos de drag & drop ===

  startDrag(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Lista de elementos y clases que no deben iniciar el drag
    const nonDraggableSelectors = [
      'button', 'input', 'select', 'textarea', 'a',
      '.btn', '.form-input', '.form-select', '.form-textarea',
      '.control-btn', '.sub-tab-btn', '.group-btn'
    ];

    // Verificar si el elemento clickeado o algún ancestro es no-draggable
    let element: HTMLElement | null = target;
    while (element && element !== event.currentTarget) {
      const tagName = element.tagName.toLowerCase();

      // Verificar tag names
      if (nonDraggableSelectors.includes(tagName)) {
        return; // No iniciar drag
      }

      // Verificar clases CSS
      const hasNonDraggableClass = nonDraggableSelectors.some(selector =>
        selector.startsWith('.') && element!.classList.contains(selector.substring(1))
      );

      if (hasNonDraggableClass) {
        return; // No iniciar drag
      }

      element = element.parentElement;
    }

    event.preventDefault();
    event.stopPropagation();

    this.dragging = true;

    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      bottom: this.position().bottom,
      right: this.position().right,
    };

    // Event listeners con passive: false para poder cancelar eventos si es necesario
    document.addEventListener('mousemove', this.onDrag, { passive: false });
    document.addEventListener('mouseup', this.stopDrag, { passive: true });

    // Añadir clase dragging para activar optimizaciones CSS
    this.dragElement = event.currentTarget as HTMLElement;
    this.dragElement.classList.add('dragging');

    // Añadir cursor de dragging al documento
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }

  private onDrag = (event: MouseEvent): void => {
    if (!this.dragging) return;

    event.preventDefault(); // Prevenir selección de texto durante drag

    // Cancelar animación anterior si existe
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Usar requestAnimationFrame para sincronizar con el refresh de pantalla
    this.animationId = requestAnimationFrame(() => {
      if (!this.dragging) return;

      const deltaY = event.clientY - this.dragStart.y;
      const deltaX = event.clientX - this.dragStart.x;

      // Calcular nueva posición propuesta
      const proposedBottom = this.dragStart.bottom - deltaY;
      const proposedRight = this.dragStart.right - deltaX;

      // Límites de la ventana con márgenes de seguridad
      const safeMargin = 20; // margen de seguridad en todos los lados
      const headerHeight = 48; // altura del header para que siempre sea visible

      // Para bottom positioning:
      // - bottom: 0 = pegado al fondo de la pantalla
      // - bottom: window.innerHeight-headerHeight = solo el header visible arriba
      const minBottom = 0; // puede tocar el fondo
      const maxBottom = window.innerHeight - headerHeight; // siempre mostrar al menos el header

      // Para right positioning:
      // - right: 0 = pegado al lado derecho
      // - right: window.innerWidth-width = pegado al lado izquierdo
      const minRight = 0; // puede tocar el lado derecho
      const maxRight = Math.max(0, window.innerWidth - 420); // no salirse por la izquierda

      // Aplicar límites
      const newBottom = Math.max(minBottom, Math.min(maxBottom, proposedBottom));
      const newRight = Math.max(minRight, Math.min(maxRight, proposedRight));

      this.position.set({
        bottom: newBottom,
        right: newRight,
      });
    });
  };

  private stopDrag = (): void => {
    if (!this.dragging) return; // Prevenir múltiples calls

    this.dragging = false;

    // Cancelar animación pendiente
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    // Remover clase dragging y restaurar transiciones CSS
    if (this.dragElement) {
      this.dragElement.classList.remove('dragging');
      this.dragElement = null;
    }

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

  // ========== MÉTODOS DE ARCHIVO (IMPORT/EXPORT) ==========

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      // Usar utilidad de core para leer archivo JSON
      const parsed = await readJsonFile(file);

      // Verificar si tiene hash (archivo exportado por el sistema)
      if (!parsed._hash) {
        // Archivo sin hash - probablemente configuración manual
        this.loadManualConfiguration(parsed);
        input.value = '';
        return;
      }

      // Usar utilidad de core para extraer datos sin hash
      const dataWithoutHash = extractDataWithoutHash(parsed);

      // Validar el hash usando utilidad de core
      const isValid = await validateHash(parsed, dataWithoutHash);

      if (!isValid) {
        this.jsonValidationMessage.set({
          type: 'error',
          text: '❌ Firma digital inválida. El archivo ha sido modificado o está corrupto.'
        });
        setTimeout(() => {
          this.jsonValidationMessage.set(null);
        }, 5000);
        input.value = '';
        return;
      }

      // Validar estructura usando utilidad de core
      const validationResult = validateImportedFile(dataWithoutHash);

      if (!validationResult.isValid) {
        this.jsonValidationMessage.set({
          type: 'error',
          text: `❌ ${validationResult.errors.join(', ')}`
        });
        setTimeout(() => {
          this.jsonValidationMessage.set(null);
        }, 5000);
        input.value = '';
        return;
      }

      // Hash y estructura válidos - procesar según el tipo
      if (isExportDatabaseData(parsed)) {
        // Importar base de datos completa
        await this.presenter.deleteDatabase(parsed.databaseConfig.name);
        await this.presenter.handleCreateDatabase(parsed.databaseConfig);
        await this.presenter.handleImportMocks(parsed.mocks);
        await this.refreshDatabaseStats();

        this.jsonValidationMessage.set({
          type: 'success',
          text: `✅ Base de datos completa restaurada: ${parsed.mocks.length} mocks importados. Firma verificada ✓`
        });
        setTimeout(() => {
          this.jsonValidationMessage.set(null);
        }, 3000);
      }
      else if (isExportMocksData(parsed)) {
        // Importar solo mocks
        await this.presenter.clearAllMocks();
        await this.presenter.handleImportMocks(parsed.mocks);
        await this.refreshDatabaseStats();

        this.jsonValidationMessage.set({
          type: 'success',
          text: `✅ ${parsed.mocks.length} mocks importados correctamente. Firma verificada ✓`
        });
        setTimeout(() => {
          this.jsonValidationMessage.set(null);
        }, 3000);
      }
      else {
        this.jsonValidationMessage.set({
          type: 'error',
          text: '❌ Formato de archivo no reconocido.'
        });
        setTimeout(() => {
          this.jsonValidationMessage.set(null);
        }, 5000);
      }

      // Limpiar input
      input.value = '';

    } catch (e) {
      console.error('Failed to load config file', e);
      this.jsonValidationMessage.set({
        type: 'error',
        text: '❌ Error al importar el archivo. Verifique que sea un JSON válido.'
      });
      setTimeout(() => {
        this.jsonValidationMessage.set(null);
      }, 5000);
    }
  }

  /**
   * Carga configuración manual (archivos sin firma digital)
   * @param parsed Objeto parseado del JSON
   */
  private loadManualConfiguration(parsed: any): void {
    // Asignar campos de manera segura (caso config/database)
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

    this.jsonValidationMessage.set({
      type: 'success',
      text: '✅ Configuración manual cargada (sin firma digital).'
    });
    setTimeout(() => {
      this.jsonValidationMessage.set(null);
    }, 3000);
  }

  // ========== MÉTODOS DE GUARDADO ==========

  async saveContext(): Promise<void> {
    const currentGroup = this.activeGroup();
    console.log('💾 saveContext called. Group:', currentGroup);

    if (currentGroup === 'http') {
      // Crear el mock completo con schema y body
      const success = await this.saveCompleteMock();
      console.log('💾 saveCompleteMock result:', success);

      if (success) {
        // Mostrar confirmación para siguiente acción
        console.log('✅ Showing save confirmation modal');
        this.showSaveConfirmation.set(true);
      }
    }
  }

  private async saveCompleteMock(): Promise<boolean> {
    try {
      // Validar que los campos requeridos estén completos
      if (!this.nameMock.trim() || !this.url.trim()) {
        console.error('❌ Missing required fields: nameMock and url are required');
        return false;
      }

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

      let savedMock: any = null;
      let isUpdate = false;

      // Validar si existe un mock con el mismo serviceCode
      if (this.serviceCode && this.serviceCode.trim() !== '') {
        const existingMock = await this.presenter.findMockByServiceCode(this.serviceCode);

        if (existingMock && existingMock.id) {
          console.log(`🔄 Mock with serviceCode "${this.serviceCode}" already exists. Updating...`);
          savedMock = await this.presenter.handleUpdateMockSchema(existingMock.id, schema);
          isUpdate = true;
        } else {
          // Si no existe, crear nuevo
          savedMock = await this.presenter.handleSaveMockSchema(schema);
        }
      } else {
        // Si no hay serviceCode, crear nuevo (o manejar según reglas de negocio)
        savedMock = await this.presenter.handleSaveMockSchema(schema);
      }

      if (savedMock && savedMock.id) {
        console.log('✅ Mock saved successfully with ID:', savedMock.id);

        // Luego guardar el body
        const mockBody: MockBody = {
          responseBody: this.responseBody
        };

        await this.presenter.handleSaveMockBody(mockBody, savedMock.id);


        // Actualizar estadísticas después de guardar el mock
        await this.refreshDatabaseStats();

        // Emitir eventos para compatibilidad
        this.saveMockSchemaEvent.emit(schema);
        this.saveMockBodyEvent.emit(mockBody);

        // Mostrar mensaje de éxito
        this.jsonValidationMessage.set({
          type: 'success',
          text: isUpdate
            ? `✅ Mock "${this.nameMock}" actualizado correctamente`
            : `✅ Mock "${this.nameMock}" creado correctamente`
        });

        setTimeout(() => {
          this.jsonValidationMessage.set(null);
        }, 3000);

        // NO hacer reset automático - se manejará en la confirmación
        return true;
      }

      console.warn('⚠️ Mock save operation completed but no valid mock returned');
      return false;
    } catch (error) {
      console.error('❌ Error al guardar mock completo:', error);
      this.jsonValidationMessage.set({
        type: 'error',
        text: `❌ Error al guardar: ${(error as Error).message}`
      });
      return false;
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

  /**
   * Agrega una cabecera común predefinida con su valor por defecto
   * @param headerName - Nombre de la cabecera HTTP
   * @param defaultValue - Valor por defecto para la cabecera
   */
  addCommonHeader(headerName: string, defaultValue: string): void {
    // Verificar si la cabecera ya existe (no debería pasar debido a los botones deshabilitados)
    if (this.headers[headerName]) {
      return;
    }

    // Agregar la cabecera con el valor por defecto
    this.headers[headerName] = defaultValue;

    // Mostrar confirmación de éxito
    this.jsonValidationMessage.set({
      type: 'success',
      text: `Cabecera "${headerName}" agregada exitosamente`
    });

    // Limpiar mensaje después de 2 segundos
    setTimeout(() => {
      this.jsonValidationMessage.set(null);
    }, 2000);

    // Emitir evento para notificar cambios en headers
    this.saveHeadersEvent.emit(this.headers);
  }

  addHeader(): void {
    const key = this.newHeaderKey().trim();
    const value = this.newHeaderValue();
    const editingKey = this.editingHeaderKey();

    if (!key) return;

    // Si estamos editando, removemos el header anterior si la key cambió
    if (editingKey && editingKey !== key) {
      const newHeaders = { ...this.headers };
      delete newHeaders[editingKey];
      this.headers = newHeaders;
    }

    // Agregamos o actualizamos el header
    this.headers = { ...this.headers, [key]: value };
    this.newHeaderKey.set('');
    this.newHeaderValue.set('');
    this.editingHeaderKey.set(null);

    this.emitSaveHeaders();
  }

  editHeader(key: string): void {
    this.newHeaderKey.set(key);
    this.newHeaderValue.set(this.headers[key]);
    this.editingHeaderKey.set(key);
  }

  cancelEditHeader(): void {
    this.newHeaderKey.set('');
    this.newHeaderValue.set('');
    this.editingHeaderKey.set(null);
  }

  removeHeader(key: string): void {
    const newHeaders = { ...this.headers };
    delete newHeaders[key];
    this.headers = newHeaders;

    // Si estábamos editando este header, cancelar la edición
    if (this.editingHeaderKey() === key) {
      this.cancelEditHeader();
    }

    this.emitSaveHeaders();
  }

  private emitSaveHeaders(): void {
    // Usar presenter para guardar headers
    this.presenter.handleSaveHeaders(this.headers);

    // Emitir evento para compatibilidad
    this.saveHeadersEvent.emit(this.headers);
  }

  // === Métodos de utilidad ===

  onInputNumber(event: Event, key: 'delayMs'): void {
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

    // Auto-refresh database statistics when entering data management group
    if (groupName === 'data') {
      setTimeout(() => {
        this.refreshDatabaseStats();
      }, 100);
    }
  }

  setActiveSubTab(subTabIndex: number): void {
    this.activeSubTab.set(subTabIndex);

    // Auto-refresh database statistics when entering Database Management tab
    if (this.activeGroup() === 'data' && subTabIndex === 1) {
      // Ejecutar refreshDatabaseStats asíncronamente para no bloquear el cambio de pestaña
      setTimeout(() => {
        this.refreshDatabaseStats();
      }, 100);
    }
  }

  // ========== MÉTODOS DE INTEGRACIÓN CON PRESENTER ==========

  async loadMocksByServiceCode(serviceCode: string): Promise<void> {
    await this.presenter.handleLoadMocksByServiceCode(serviceCode);
  }

  async onServiceCodeSelectionChange(selectedServiceCode: string): Promise<void> {
    this.selectedServiceCodeForLoad = selectedServiceCode;

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

      }
    }
  }

  async deleteMock(mockId: string): Promise<void> {
    await this.presenter.handleDeleteMock(mockId);
  }

  async exportMocks(): Promise<void> {
    const mocks = await this.presenter.handleExportAllMocks();

    if (mocks.length === 0) {
      this.jsonValidationMessage.set({
        type: 'error',
        text: '❌ No hay mocks para exportar. La base de datos está vacía.'
      });
      setTimeout(() => {
        this.jsonValidationMessage.set(null);
      }, 3000);
      return;
    }

    // Usar utilidad de core para crear estructura de exportación
    const exportData = createMocksExport({ mocks });

    // Generar hash usando utilidad de core
    const hash = await generateHash(exportData);

    const exportPayload = {
      ...exportData,
      _hash: hash
    };

    // Usar utilidad de core para descargar archivo
    downloadAsJson(exportPayload, {
      filename: 'mocks-export.json',
      addTimestamp: true
    });

    // Mostrar mensaje de éxito
    this.jsonValidationMessage.set({
      type: 'success',
      text: `✅ ${mocks.length} mocks exportados exitosamente con firma digital.`
    });
    setTimeout(() => {
      this.jsonValidationMessage.set(null);
    }, 3000);
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

      // Actualizar estadísticas después de crear la base de datos
      await this.refreshDatabaseStats();

      this.databaseCreatedEvent.emit();

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
    } else {
      // Agregar nuevo índice
      this.dbIndexes = [...this.dbIndexes, {
        name: indexName,
        keyPath: keyPath,
        unique: false // Los índices no necesitan ser únicos
      }];
    }

    // Limpiar campos
    this.newIndexName.set('');
    this.newIndexKeyPath.set('');
  }

  removeIndex(indexName: string): void {
    this.dbIndexes = this.dbIndexes.filter(index => index.name !== indexName);
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
    this.httpCodeResponseValue = mock.httpCodeResponseValue;
    this.delayMs = mock.delayMs || 1000;
    this.responseBody = mock.responseBody || '{}';

    // Cambiar a HTTP Definition y activar Mock Config (sub-tab 1)
    this.setActiveGroup('http');
    this.setActiveSubTab(1);

  }

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.responseBody);
      this.responseBody = JSON.stringify(parsed, null, 2);
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

  // === Métodos de gestión de base de datos ===

  async refreshDatabaseStats(): Promise<void> {
    try {

      // Cargar configuración de base de datos por defecto
      await this.presenter.loadDefaultDatabaseConfig();

      // Forzar actualización completa del presenter
      await this.presenter.initialize();

      // Actualizar estadísticas específicamente
      await this.presenter.refreshStatistics();

      // Recargar service codes disponibles para actualizar estadísticas
      await this.presenter.loadAvailableServiceCodes();

      // Simular un pequeño delay para asegurar que la UI se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

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

  async reinitializeDatabase(): Promise<void> {
    try {
      debugger;
      console.log('🔄 Reinitializing database system...');

      // Primero limpiar todos los registros de la base de datos
      await this.presenter.clearAllMocks();
      console.log('✅ All mock records cleared from database');

      // Luego reinicializar el presenter para limpiar cualquier cache
      await this.presenter.initialize();

      // Recargar todas las estadísticas después de la reinicialización
      await this.refreshDatabaseStats();

      console.log('✅ Database system reinitialized with empty state and statistics refreshed successfully');
    } catch (error) {
      console.error('❌ Error reinitializing database system:', error);
    }
  }

  // === Métodos para manejar confirmación de guardado ===

  continueEditing(): void {
    this.showSaveConfirmation.set(false);
    console.log('📝 Usuario decidió continuar editando el mock actual');
    // No hacer nada, mantener el formulario como está
  }

  createNewRecord(): void {
    this.showSaveConfirmation.set(false);
    console.log('➕ Usuario decidió crear un nuevo registro');
    // Limpiar formulario para nuevo registro
    this.resetForm();
  }

  // === Limpieza de recursos ===

  ngOnDestroy(): void {
    // Cancelar cualquier animación pendiente
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }

    // Limpiar clase dragging si está activa
    if (this.dragElement) {
      this.dragElement.classList.remove('dragging');
      this.dragElement = null;
    }

    // Limpiar event listeners de drag
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);

    // Restaurar estilos del documento si quedaron activos
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // Limpiar presenter
    this.presenter.ngOnDestroy();
  }

}
