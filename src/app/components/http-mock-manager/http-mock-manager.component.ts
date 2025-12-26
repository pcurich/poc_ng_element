import { Component, OnInit, Input, Output, EventEmitter, signal, computed, ViewEncapsulation, OnDestroy, effect } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpMethod, HttpMockEntity } from '../../../core/entities/HttpMockEntity';
import { HttpMockManagerPresenter } from './http-mock-manager.presenter';
import { ContextOption } from '../interfaces';
import { IHttpMockData } from '../../../core';
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
  isExportDatabaseData,
  ValidationMessages,
  ValidationMessage,
  IDbConfig,
  IIndexConfig
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, NgFor, NgIf],
  templateUrl: './http-mock-manager.component.html',
  styleUrl: './http-mock-manager.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom
})
export class HttpMockManagerComponent implements OnInit, OnDestroy {
  // Reactive Form para el body JSON
  public bodyForm!: FormGroup;

  // === Reactive Form ===
  public mockForm!: FormGroup;
  private formInitialized = false;

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
  public dbIndexes: IIndexConfig[] = [];

  // === Eventos de salida (equivalentes a @Event en Stencil) ===

  @Output() saveMockSchemaEvent = new EventEmitter<IHttpMockData>();
  @Output() saveMockBodyEvent = new EventEmitter<string>();
  @Output() saveHeadersEvent = new EventEmitter<Record<string, string>>();
  @Output() databaseCreatedEvent = new EventEmitter<void>();
  @Output() deleteContextEvent = new EventEmitter<number>();
  @Output() contextTypeChangeEvent = new EventEmitter<ContextOption>();
  @Output() reloadEvent = new EventEmitter<void>();

  // === Estado del componente con Angular Signals ===

  public showForm = signal<boolean>(false);
  public isMinimized = signal<boolean>(false);
  public isComponentVisible = signal<boolean>(true);
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
  public jsonValidationMessage = signal<ValidationMessage | null>(null);

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

    // this.showSaveConfirmation();
    // Inicializar selectedContext si no está definido
    this.selectedContext = this.selectedContext ?? this.contextOptions[0];

    // Inicializar copia editable de contextOptions
    this.contextOptionsState.set([...this.contextOptions]);

    // Inicializar Reactive Form para Mock Config
    this.initMockForm();

    // Inicializar Reactive Form para Body
    this.initBodyForm();

    // Inicializar el presenter
    await this.initializePresenter();

    // Suscribirse a eventos del presenter
    this.subscribeToPresenterEvents();
  }
  public initBodyForm(): void {
    this.bodyForm = new FormGroup({
      responseBody: new FormControl(this.responseBody, [Validators.required, Validators.minLength(2)]),
    });
  }

  public initMockForm(): void {
    if (this.formInitialized) return;
    this.mockForm = new FormGroup({
      nameMock: new FormControl(this.nameMock, [Validators.required, Validators.maxLength(100)]),
      serviceCode: new FormControl(this.serviceCode, [Validators.required, Validators.maxLength(100)]),
      url: new FormControl(this.url, [Validators.required, Validators.maxLength(300)]),
      httpMethod: new FormControl(this.httpMethod, [Validators.required]),
      httpCodeResponseValue: new FormControl(this.httpCodeResponseValue, [Validators.required]),
      delayMs: new FormControl(this.delayMs, [Validators.required, Validators.min(0)]),
    });
    this.formInitialized = true;
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

  public subscribeToPresenterEvents(): void {
    // Suscribirse a eventos del presenter para propagar al exterior
    this.presenter.events.onMockCreated.subscribe(mock => {
      console.log('✅ Mock created:', mock);
      const message = ValidationMessages.MOCK_CREATED(mock.name || 'Sin nombre');
      this.jsonValidationMessage.set(message);
      setTimeout(() => this.jsonValidationMessage.set(null), message.durationMs);
    });

    this.presenter.events.onMockDeleted.subscribe(mockId => {
      console.log('🗑️ Mock deleted:', mockId);
      const message = ValidationMessages.MOCK_DELETED();
      this.jsonValidationMessage.set(message);
      setTimeout(() => this.jsonValidationMessage.set(null), message.durationMs);
    });

    this.presenter.events.onMocksLoaded.subscribe(mocks => {
      console.log('📦 Mocks loaded:', mocks.length);
      const message = ValidationMessages.MOCKS_LOADED(mocks.length);
      this.jsonValidationMessage.set(message);
      setTimeout(() => this.jsonValidationMessage.set(null), message.durationMs);
    });

    this.presenter.events.onError.subscribe(error => {
      console.error('🎭 Presenter Error:', error);
      const message = ValidationMessages.PRESENTER_ERROR(error);
      this.jsonValidationMessage.set(message);
      setTimeout(() => this.jsonValidationMessage.set(null), message.durationMs);
    });

    // Suscribirse a eventos de mensajes de validación
    this.presenter.events.onValidationMessage.subscribe(message => {
      this.jsonValidationMessage.set(message);

      // Auto-limpiar mensaje después del tiempo especificado
      const duration = message.durationMs || 3000;
      setTimeout(() => {
        this.jsonValidationMessage.set(null);
      }, duration);
    });
  }

  // === Métodos de drag & drop ===

  startDrag(event: MouseEvent): void {

    const target = event.target as HTMLElement;
    // Permitir override en tests
    const nonDraggableSelectors = (this as any).nonDraggableSelectors || [
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
      const hasNonDraggableClass = nonDraggableSelectors.some((selector: string) =>
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

  stopDrag = (): void => {
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
        // Archivo sin hash: mostrar mensaje de error y no cargar
        input.value = '';
        const message = ValidationMessages.NO_HASH_SIGNATURE();
        this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
        return;
      }

      // Usar utilidad de core para extraer datos sin hash
      const dataWithoutHash = extractDataWithoutHash(parsed);

      // Validar el hash usando utilidad de core
      const isValid = await validateHash(parsed, dataWithoutHash);

      if (!isValid) {
        const message = ValidationMessages.INVALID_SIGNATURE();
        this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
        input.value = '';
        return;
      }

      // Validar estructura usando utilidad de core
      const validationResult = validateImportedFile(dataWithoutHash);

      if (!validationResult.isValid) {
        const message = ValidationMessages.VALIDATION_ERRORS(validationResult.errors);
        this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
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

        const message = ValidationMessages.DATABASE_RESTORED(parsed.mocks.length);
        this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
      }
      else if (isExportMocksData(parsed)) {
        // Importar solo mocks
        await this.presenter.clearAllMocks();
        await this.presenter.handleImportMocks(parsed.mocks);
        await this.refreshDatabaseStats();

        const message = ValidationMessages.IMPORT_SUCCESS_WITH_SIGNATURE(parsed.mocks.length);
        this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
      }
      else {
        const message = ValidationMessages.INVALID_FILE_FORMAT();
        this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
      }

      // Limpiar input
      input.value = '';

    } catch (e) {
      console.error('Failed to load config file', e);
      const message = ValidationMessages.IMPORT_ERROR();
      this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
    }
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
      // Validar que TODOS los campos requeridos estén completos
      if (this.mockForm.invalid || this.bodyForm.invalid) {
        console.error('❌ Missing required fields: nameMock, url, serviceCode, httpMethod, httpCodeResponseValue and delayMs are required');
        const message = ValidationMessages.MISSING_REQUIRED_FIELDS();
        this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
        return false;
      }

      // Tomar valores del mockForm y bodyForm
      const mockFormValue = this.mockForm.value;
      const bodyFormValue = this.bodyForm.value;

      const schema: Partial<IHttpMockData> = {
        name: mockFormValue.nameMock,
        url: mockFormValue.url,
        method: mockFormValue.httpMethod,
        httpCodeResponseValue: mockFormValue.httpCodeResponseValue,
        serviceCode: mockFormValue.serviceCode,
        delayMs: mockFormValue.delayMs,
        headers: Object.keys(this.headers).length > 0 ? this.headers : undefined,
        responseBody: '{}' // Default, se actualizará después
      };

      let savedMock: any = null;

      // Validar si existe un mock con el mismo serviceCode
      const existingMockByServiceCode = await this.presenter.findMockByServiceCode(schema.serviceCode!);

      if (existingMockByServiceCode && existingMockByServiceCode.id) {
        console.log(`🔄 Mock with serviceCode "${mockFormValue.serviceCode}" already exists. Updating...`);
        savedMock = await this.presenter.handleUpdateMockSchema(existingMockByServiceCode.id, schema);
      } else {
        // Si no existe ninguno, crear nuevo
        savedMock = await this.presenter.handleSaveMockSchema(schema);
      }

      if (savedMock && savedMock.id) {
        console.log('✅ Mock saved successfully with ID:', savedMock.id);

        schema.responseBody = bodyFormValue.responseBody

        await this.presenter.handleSaveMockBody(bodyFormValue.responseBody, savedMock.id);

        // Actualizar estadísticas después de guardar el mock
        await this.refreshDatabaseStats();

        // Emitir eventos para compatibilidad
        this.saveMockSchemaEvent.emit(schema as IHttpMockData);
        this.saveMockBodyEvent.emit(bodyFormValue.responseBody);

        // NO hacer reset automático - se manejará en la confirmación
        // Los mensajes de éxito ya se emiten desde el presenter
        return true;
      }

      console.warn('⚠️ Mock save operation completed but no valid mock returned');
      return false;
    } catch (error) {
      console.error('❌ Error al guardar mock completo:', error);
      const message = ValidationMessages.SAVE_ERROR((error as Error).message);
      this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
      return false;
    }
  }

  private resetForm(): void {
    this.headers = {};
    this.newHeaderKey.set('');
    this.newHeaderValue.set('');
    // Resetear formularios reactivos si existen
    if (this.mockForm) {
      this.mockForm.reset({
        nameMock: '',
        serviceCode: '',
        url: '',
        httpMethod: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 1000
      });
    }

    if (this.bodyForm) {
      this.bodyForm.reset({
        responseBody: '{}'
      });
    }
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

    // Emitir mensaje de éxito usando presenter
    const message = ValidationMessages.HEADER_ADDED(headerName);
    this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);

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

  toggleMinimize(): void {
    this.isMinimized.update(current => !current);
  }

  closeComponent(): void {
    // Ocultar completamente el componente del DOM
    this.isComponentVisible.set(false);
    // Opcional: También resetear el estado
    this.showForm.set(false);
    this.isMinimized.set(false);
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
        // Auto-poblar campos de Mock Config usando Reactive Forms
        this.mockForm.patchValue({
          nameMock: firstMock.name || '',
          serviceCode: firstMock.serviceCode,
          url: firstMock.url,
          httpMethod: firstMock.method as HttpMethod,
          httpCodeResponseValue: firstMock.httpCodeResponseValue,
          delayMs: firstMock.delayMs,
        });

        // Auto-poblar Headers
        if (firstMock.headers) {
          this.headers = { ...firstMock.headers };
        } else {
          this.headers = {};
        }

        // Auto-poblar Body usando Reactive Form
        this.bodyForm.patchValue({
          responseBody: firstMock.responseBody || '{}',
        });
      }
    }
  }

  async deleteMock(mockId: string): Promise<void> {
    await this.presenter.handleDeleteMock(mockId);
  }

  async exportMocks(): Promise<void> {
    const mocks = await this.presenter.handleExportAllMocks();

    if (mocks.length === 0) {
      const message = ValidationMessages.NO_MOCKS_TO_EXPORT();
      this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
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
    const message = ValidationMessages.MOCKS_EXPORTED(mocks.length);
    this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
  }

  // === Gestión de configuración de base de datos ===

  async createDatabase(): Promise<void> {
    try {
      const config: IDbConfig = {
        name: this.dbName,
        version: this.dbVersion,
        objectStores: [{
          name: this.dbObjectStoreName,
          options: {
            keyPath: this.dbKeyPath
          },
          indexes: this.dbIndexes.map(index => ({
            name: index.name,
            keyPath: index.keyPath
          }))
        }]
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
        keyPath: keyPath
      };
    } else {
      // Agregar nuevo índice
      this.dbIndexes = [...this.dbIndexes, {
        name: indexName,
        keyPath: keyPath,
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

  getObjectStoreNames(): string {
    const config = this.databaseConfig();
    if (!config || !config.objectStores || config.objectStores.length === 0) {
      return 'Ninguno';
    }
    return config.objectStores.map(store => store.name).join(', ');
  }

  // === Métodos de edición y formato ===

  editMock(mock: HttpMockEntity): void {
    // Cargar los datos del mock en los formularios reactivos para edición
    this.mockForm.patchValue({
      nameMock: mock.name || '',
      serviceCode: mock.serviceCode,
      url: mock.url,
      httpMethod: mock.method,
      httpCodeResponseValue: mock.httpCodeResponseValue,
      delayMs: mock.delayMs || 1000,
    });

    this.bodyForm.patchValue({
      responseBody: mock.responseBody || '{}',
    });

    this.headers = mock.headers ? { ...mock.headers } : {};

    // Cambiar a HTTP Definition y activar Mock Config (sub-tab 1)
    this.setActiveGroup('http');
    this.setActiveSubTab(1);

  }

  formatJson(): void {
    try {
      const parsed = JSON.parse(this.bodyForm.value.responseBody);
      this.responseBody = JSON.stringify(parsed, null, 2);
      this.bodyForm.patchValue({ responseBody: this.responseBody });
      const message = ValidationMessages.JSON_FORMATTED();
      this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
    } catch (error) {
      console.error('❌ Invalid JSON format:', error);
      const message = ValidationMessages.JSON_FORMAT_ERROR((error as Error).message);
      this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
    }
  }

  validateJson(): void {
    try {
      JSON.parse(this.bodyForm.value.responseBody);
      console.log('✅ JSON is valid');
      const message = ValidationMessages.JSON_VALID();
      this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
    } catch (error) {
      console.error('❌ Invalid JSON:', error);
      const message = ValidationMessages.JSON_INVALID((error as Error).message);
      this.presenter.emitValidationMessage(message.type, message.text, message.durationMs);
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
  }

  createNewRecord(): void {
    this.showSaveConfirmation.set(false);
    console.log('➕ Usuario decidió crear un nuevo registro');
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
