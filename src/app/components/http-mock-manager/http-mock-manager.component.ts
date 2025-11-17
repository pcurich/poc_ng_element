import { Component, OnInit, Input, Output, EventEmitter, signal, computed, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpMethod } from '../../../core/models/HttpMockEntity';
import { HttpMockManagerPresenter } from './http-mock-manager.presenter';
import { ContextOption, MockSchema, MockBody } from '../interfaces';

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

  // === Eventos de salida (equivalentes a @Event en Stencil) ===
  
  @Output() saveMockSchemaEvent = new EventEmitter<MockSchema>();
  @Output() saveMockBodyEvent = new EventEmitter<MockBody>();
  @Output() saveHeadersEvent = new EventEmitter<Record<string, string>>();
  @Output() loadContextEvent = new EventEmitter<number>();
  @Output() deleteContextEvent = new EventEmitter<number>();
  @Output() contextTypeChangeEvent = new EventEmitter<ContextOption>();
  @Output() reloadEvent = new EventEmitter<void>();

  // === Estado del componente con Angular Signals ===
  
  public showForm = signal<boolean>(true);
  public position = signal<{ bottom: number; right: number }>({ bottom: 32, right: 32 });
  public activeTab = signal<number>(0);
  public contextOptionsState = signal<ContextOption[]>([]);
  public newContextValue = signal<string>('');
  public newContextUseMock = signal<boolean>(false);
  public newContextId = signal<number | ''>('');
  public newHeaderKey = signal<string>('');
  public newHeaderValue = signal<string>('');

  // === Variables para drag & drop ===
  
  private dragging = false;
  private dragStart = { x: 0, y: 0, bottom: 32, right: 32 };


  // === Presenter (Capa de presentación) ===
  
  private presenter: HttpMockManagerPresenter = new HttpMockManagerPresenter();

  // === Computed properties usando el presenter ===
  
  public currentMocks = computed(() => this.presenter.currentMocks());
  public isLoading = computed(() => this.presenter.isLoading());
  public statistics = computed(() => this.presenter.statistics());
  public presenterError = computed(() => this.presenter.error());
  public lastOperation = computed(() => this.presenter.lastOperation());

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
    this.dragging = true;
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      bottom: this.position().bottom,
      right: this.position().right,
    };
    
    document.addEventListener('mousemove', this.onDrag);
    document.addEventListener('mouseup', this.stopDrag);
  }

  private onDrag = (event: MouseEvent): void => {
    if (!this.dragging) return;
    
    const deltaY = event.clientY - this.dragStart.y;
    const deltaX = event.clientX - this.dragStart.x;
    
    this.position.set({
      bottom: Math.max(0, this.dragStart.bottom - deltaY),
      right: Math.max(0, this.dragStart.right - deltaX),
    });
  };

  private stopDrag = (): void => {
    this.dragging = false;
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
  };

  // === Métodos de gestión de contexto usando presenter ===

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

  // === Métodos de archivo (import/export) ===

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
      
      // Limpiar input y cambiar a pestaña Mock
      input.value = '';
      this.activeTab.set(2);
      
    } catch (e) {
      console.error('Failed to load config file', e);
    }
  }

  // === Métodos de guardado usando presenter ===

  async saveContext(): Promise<void> {
    const currentTab = this.activeTab();
    
    if (currentTab === 2) { // Mock tab
      await this.saveMockSchema();
    } else if (currentTab === 4) { // Body tab
      await this.saveMockBody();
    }
  }

  private async saveMockSchema(): Promise<void> {
    try {
      const schema: MockSchema = {
        nameMock: this.nameMock,
        url: this.url,
        httpMethod: this.httpMethod,
        httpCodeResponseValue: this.httpCodeResponseValue,
        serviceCode: this.serviceCode,
        delayMs: this.delayMs,
        headers: Object.keys(this.headers).length > 0 ? this.headers : undefined,
      };

      // Usar presenter para crear el mock
      const createdMock = await this.presenter.handleSaveMockSchema(schema);
      
      if (createdMock) {
        console.log('✅ Mock HTTP creado exitosamente:', createdMock);
        
        // Emitir evento para compatibilidad
        this.saveMockSchemaEvent.emit(schema);
        
        // Limpiar formulario después de guardar exitosamente
        this.resetForm();
      }
    } catch (error) {
      console.error('Error al guardar mock schema:', error);
    }
  }

  private async saveMockBody(): Promise<void> {
    try {
      let bodyPayload: MockBody;
      try {
        bodyPayload = { responseBody: JSON.stringify(JSON.parse(this.responseBody)) };
      } catch (e) {
        bodyPayload = { responseBody: this.responseBody };
      }
      
      // Usar presenter para guardar el body
      await this.presenter.handleSaveMockBody(bodyPayload);
      
      // Emitir evento para compatibilidad
      this.saveMockBodyEvent.emit(bodyPayload);
      console.log('✅ Mock body guardado exitosamente');
    } catch (error) {
      console.error('Error al guardar mock body:', error);
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

  // === Métodos de gestión de headers usando presenter ===

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

  setActiveTab(tabIndex: number): void {
    this.activeTab.set(tabIndex);
  }

  // === Métodos de integración usando presenter ===

  async loadMocksByServiceCode(serviceCode: string): Promise<void> {
    await this.presenter.handleLoadMocksByServiceCode(serviceCode);
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

  // === Limpieza de recursos ===

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onDrag);
    document.removeEventListener('mouseup', this.stopDrag);
    
    // Limpiar presenter
    this.presenter.ngOnDestroy();
  }
}
