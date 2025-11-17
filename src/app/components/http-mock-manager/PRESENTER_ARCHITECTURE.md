# 🎭 HttpMockManagerPresenter - Arquitectura MVP

## 📋 Descripción General

La capa **HttpMockManagerPresenter** implementa el patrón **MVP (Model-View-Presenter)** para separar la lógica de presentación del componente visual `HttpMockManagerComponent`. Esta arquitectura proporciona:

- **Separación de responsabilidades** clara entre UI y lógica de negocio
- **Testabilidad mejorada** al aislar la lógica en una clase independiente
- **Reutilización** de la lógica en diferentes contextos
- **Mantenibilidad** a través de código más organizado y modular

## 🏗️ Arquitectura MVP

```bash
┌─────────────────────────────────────────────────────────┐
│                    VIEW (Component)                     │
│  ┌─────────────────────────────────────────────────────┐│
│  │         HttpMockManagerComponent                    ││
│  │  • UI Events (click, input, etc.)                  ││
│  │  • Angular Signals para estado visual              ││
│  │  • Template bindings                               ││
│  │  • Drag & Drop logic                               ││
│  └─────────────────────────────────────────────────────┘│
│                           │                             │
│                           ▼                             │
│  ┌─────────────────────────────────────────────────────┐│
│  │              PRESENTER                              ││
│  │  ┌─────────────────────────────────────────────────┐││
│  │  │        HttpMockManagerPresenter                 │││
│  │  │  • Business Logic                               │││
│  │  │  • State Management con Signals                │││
│  │  │  • Event Handling                               │││
│  │  │  • Service Orchestration                       │││
│  │  └─────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
│                           │                             │
│                           ▼                             │
│  ┌─────────────────────────────────────────────────────┐│
│  │                MODEL (Services)                     ││
│  │  ┌─────────────────┐  ┌─────────────────────────────┐││
│  │  │  HttpMockService│  │   HttpMockRepository        │││
│  │  │  • CRUD Ops     │  │   • Data Persistence        │││
│  │  │  • Interception │  │   • IndexedDB Operations    │││
│  │  │  • Signals      │  │   • Query Optimization     │││
│  │  └─────────────────┘  └─────────────────────────────┘││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

## 🔧 Implementación del Presenter

### 📦 Clase HttpMockManagerPresenter

```typescript
@Injectable()
export class HttpMockManagerPresenter implements OnDestroy {
  
  // === Estado Reactivo con Angular Signals ===
  private readonly _isInitialized = signal<boolean>(false);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  private readonly _currentMocks = signal<HttpMockEntity[]>([]);
  private readonly _statistics = signal<any | null>(null);
  
  // === Computed Properties Públicas ===
  public readonly isInitialized = this._isInitialized.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();
  public readonly error = this._error.asReadonly();
  public readonly currentMocks = this._currentMocks.asReadonly();
  public readonly statistics = this._statistics.asReadonly();
  
  // === Eventos Reactivos ===
  public readonly events: IHttpMockManagerPresenterEvents;
}
```

### 🎯 Responsabilidades del Presenter

#### 1. **Gestión de Estado**

- Mantiene el estado de la aplicación usando Angular Signals
- Proporciona computed properties reactivas
- Emite eventos para comunicación con el componente

#### 2. **Orquestación de Servicios**

- Inicializa y gestiona HttpMockService y HttpMockRepository
- Coordina operaciones entre múltiples servicios
- Maneja errores y estados de carga

#### 3. **Lógica de Negocio**

- Procesa eventos del componente
- Aplica reglas de negocio
- Transforma datos entre capas

#### 4. **Event Handling**

- `handleContextTypeChange()`
- `handleLoadContext()`
- `handleSaveMockSchema()`
- `handleSaveMockBody()`
- `handleSaveHeaders()`
- `handleLoadMocksByServiceCode()`
- `handleDeleteMock()`
- `handleExportMocks()`
- `handleImportMocks()`
- `handleReload()`

## 🔄 Flujo de Datos

### 📥 Entrada (Component → Presenter)

```typescript
// En el componente
async onContextTypeChange(selectedId: string): Promise<void> {
  const selectedOption = this.contextOptionsState().find(o => o.id === id);
  if (selectedOption) {
    // Delegar al presenter
    await this.presenter.handleContextTypeChange(selectedOption);
    
    // Emitir eventos para compatibilidad
    this.contextTypeChangeEvent.emit(selectedOption);
  }
}
```

### 📤 Salida (Presenter → Component)

```typescript
// En el presenter
async handleSaveMockSchema(mockSchema: MockSchema): Promise<HttpMockEntity | null> {
  try {
    const createdMock = await this.httpMockService.createMock(mockData);
    
    if (createdMock) {
      this._currentMocks.update(mocks => [...mocks, createdMock]);
      this.mockCreated$.next(createdMock); // Evento reactivo
      await this.refreshStatistics();
      return createdMock;
    }
  } catch (error) {
    this.setError(errorMessage);
    this.error$.next(errorMessage);
  }
}
```

## 🎪 Eventos Reactivos

### 📡 Interface de Eventos

```typescript
export interface IHttpMockManagerPresenterEvents {
  onMockCreated: Observable<HttpMockEntity>;
  onMockDeleted: Observable<string>;
  onMocksLoaded: Observable<HttpMockEntity[]>;
  onError: Observable<string>;
  onStateChanged: Observable<IHttpMockManagerPresenterState>;
}
```

### 🔔 Suscripción a Eventos

```typescript
private subscribeToPresenterEvents(): void {
  this.presenter.events.onMockCreated.subscribe(mock => {
    console.log('🎭 Presenter: Mock created', mock);
  });

  this.presenter.events.onError.subscribe(error => {
    console.error('🎭 Presenter Error:', error);
  });
}
```

## 📊 Estado del Presenter

### 🎯 Interface de Estado

```typescript
export interface IHttpMockManagerPresenterState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  currentMocks: HttpMockEntity[];
  statistics: any | null;
  selectedServiceCode: string | null;
  lastOperation: string | null;
}
```

### 🔄 Estado Reactivo

```typescript
// Estado combinado como computed property
public readonly state = computed<IHttpMockManagerPresenterState>(() => ({
  isInitialized: this._isInitialized(),
  isLoading: this._isLoading(),
  error: this._error(),
  currentMocks: this._currentMocks(),
  statistics: this._statistics(),
  selectedServiceCode: this._selectedServiceCode(),
  lastOperation: this._lastOperation()
}));
```

## 💡 Ventajas de la Arquitectura MVP

### ✅ **Separación de Responsabilidades**

- **View (Component)**: Solo maneja UI y eventos visuales
- **Presenter**: Lógica de presentación y coordinación
- **Model (Services)**: Lógica de negocio y persistencia

### ✅ **Testabilidad Mejorada**

```typescript
describe('HttpMockManagerPresenter', () => {
  let presenter: HttpMockManagerPresenter;
  let mockService: jasmine.SpyObj<HttpMockService>;

  beforeEach(() => {
    presenter = new HttpMockManagerPresenter();
    // Mock del servicio para testing aislado
  });

  it('should handle mock creation', async () => {
    const mockSchema = { /* test data */ };
    const result = await presenter.handleSaveMockSchema(mockSchema);
    expect(result).toBeDefined();
  });
});
```

### ✅ **Reutilización**

```typescript
// El presenter puede reutilizarse en diferentes contexts
export class HttpMockManagerDialogComponent {
  private presenter = new HttpMockManagerPresenter();
  
  // Misma lógica, diferente UI
}
```

### ✅ **Mantenibilidad**

- Código más organizado y modular
- Fácil localización de bugs
- Evolución independiente de capas
- Principios SOLID aplicados

## 🔧 Integración en el Componente

### 🚀 Inicialización

```typescript
export class HttpMockManagerComponent implements OnInit, OnDestroy {
  
  // === Presenter como dependencia ===
  private presenter: HttpMockManagerPresenter = new HttpMockManagerPresenter();
  
  // === Computed properties usando el presenter ===
  public currentMocks = computed(() => this.presenter.currentMocks());
  public isLoading = computed(() => this.presenter.isLoading());
  public statistics = computed(() => this.presenter.statistics());
  
  async ngOnInit() {
    await this.initializePresenter();
    this.subscribeToPresenterEvents();
  }
}
```

### 🎭 Delegación de Métodos

```typescript
// Antes (sin presenter)
async saveContext(): Promise<void> {
  const mockData = { /* ... */ };
  const createdMock = await this.httpMockService.createMock(mockData);
  // Lógica mezclada en el componente
}

// Después (con presenter)
async saveContext(): Promise<void> {
  const schema: MockSchema = { /* ... */ };
  const createdMock = await this.presenter.handleSaveMockSchema(schema);
  // Solo delegación, lógica en el presenter
}
```

## 📈 Beneficios de Performance

### ⚡ **Angular Signals Optimizadas**

- Estado reactivo sin Zone.js overhead
- Computed properties con memoización automática
- Change detection optimizada

### 🎯 **Lazy Loading del Presenter**

- Inicialización bajo demanda
- Gestión eficiente de recursos
- Cleanup automático en ngOnDestroy

### 🔄 **Event-Driven Architecture**

- Comunicación asíncrona eficiente
- Desacoplamiento de operaciones
- Mejor UX con feedback en tiempo real

## 🧪 Testing Strategy

### 🎯 **Unit Testing del Presenter**

```typescript
describe('HttpMockManagerPresenter', () => {
  // Test aislado de la lógica de presentación
  // Mock de dependencias externas
  // Verificación de estado y eventos
});
```

### 🎪 **Integration Testing del Component**

```typescript
describe('HttpMockManagerComponent', () => {
  // Test de integración View-Presenter
  // Verificación de delegación correcta
  // Testing de UI events
});
```

### 🔄 **E2E Testing**

```typescript
describe('HTTP Mock Manager E2E', () => {
  // Test de flujo completo
  // Verificación de persistencia
  // Testing de escenarios reales
});
```

## 📚 Conclusión

La implementación del **HttpMockManagerPresenter** proporciona una arquitectura robusta y mantenible que:

1. **Separa claramente** las responsabilidades entre UI y lógica
2. **Mejora la testabilidad** al aislar la lógica de presentación
3. **Facilita la reutilización** en diferentes contextos
4. **Optimiza el rendimiento** con Angular Signals
5. **Simplifica el mantenimiento** con código más organizado

Esta arquitectura MVP es especialmente valiosa para componentes complejos como el HTTP Mock Manager, donde la coordinación entre múltiples servicios y el manejo de estado complejo requieren una organización clara y robusta.

---

**🎭 La capa Presenter actúa como el director de orquesta, coordinando todas las operaciones y manteniendo la armonía entre la vista y el modelo.**
