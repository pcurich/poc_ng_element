# 🌐 HTTP Mock Manager - Guía de Integración en Proyectos Angular

## 📦 Instalación

```bash
npm install poc-ng-element
```

## ✅ Uso Correcto como Custom Element

### ⚠️ IMPORTANTE: NO usar `<app-root>`

El custom element exportado es **`http-mock-manager`**, NO `app-root`.

### ❌ USO INCORRECTO

```html
<!-- ❌ NUNCA hacer esto -->
<app-root #customElement></app-root>
```

### ✅ USO CORRECTO

```html
<!-- ✅ Usar directamente el custom element -->
<http-mock-manager #customElement></http-mock-manager>
```

---

## 🎯 Integración en Angular 16+

### Opción 1: Uso Directo en Template (Recomendado)

```typescript
// app.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ⚡ Importante para custom elements
  template: `
    <h1>Mi Aplicación</h1>
    
    <!-- ✅ Uso directo del custom element -->
    <http-mock-manager
      #mockManager
      serviceCode="my-service"
      nameMock="Test Mock"
      url="https://api.example.com/data"
      httpMethod="GET"
      [delayMs]="500"
      responseBody='{"status": "ok"}'
      (saveMockSchemaEvent)="onMockSaved($event)"
      (contextTypeChangeEvent)="onContextChanged($event)">
    </http-mock-manager>
  `
})
export class AppComponent {
  onMockSaved(mockSchema: any) {
    console.log('Mock guardado:', mockSchema);
  }
  
  onContextChanged(context: any) {
    console.log('Contexto cambiado:', context);
  }
}
```

### Opción 2: Carga Dinámica con ViewChild

```typescript
import { Component, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div>
      <!-- ✅ Referencia al custom element -->
      <http-mock-manager #mockManager></http-mock-manager>
    </div>
  `
})
export class AppComponent implements AfterViewInit {
  @ViewChild('mockManager') mockManagerRef!: ElementRef<HTMLElement>;

  ngAfterViewInit() {
    const element = this.mockManagerRef.nativeElement;
    
    // ✅ Configurar propiedades programáticamente
    (element as any).serviceCode = 'dynamic-service';
    (element as any).url = 'https://api.example.com/users';
    (element as any).httpMethod = 'POST';
    (element as any).responseBody = JSON.stringify({ id: 1, name: 'Test' });
    
    // ✅ Escuchar eventos
    element.addEventListener('saveMockSchemaEvent', (event: any) => {
      console.log('Mock guardado:', event.detail);
    });
  }
}
```

---

## 🔧 Integración en Angular 18+

```typescript
// app.config.ts o main.ts
import { ApplicationConfig } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... otros providers
  ]
};

// app.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ⚡ Necesario para custom elements
  template: `
    <http-mock-manager
      serviceCode="test-service"
      url="/api/test"
      httpMethod="GET">
    </http-mock-manager>
  `
})
export class AppComponent {}
```

---

## 📊 Propiedades Disponibles (Inputs)

```typescript
interface HttpMockManagerProps {
  // Configuración básica
  serviceCode?: string;
  nameMock?: string;
  url?: string;
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  
  // Configuración de respuesta
  delayMs?: number;
  responseBody?: string; // JSON como string
  returnCode?: number;
  
  // Contexto
  selectedContext?: ContextOption;
  contextOptions?: ContextOption[];
  
  // Datos precargados
  preloadedData?: any;
}
```

---

## 🎪 Eventos Disponibles (Outputs)

```typescript
// Evento cuando se guarda un mock
element.addEventListener('saveMockSchemaEvent', (event: CustomEvent) => {
  const mockSchema = event.detail;
  console.log('Mock guardado:', mockSchema);
});

// Evento cuando cambia el contexto
element.addEventListener('contextTypeChangeEvent', (event: CustomEvent) => {
  const context = event.detail;
  console.log('Contexto cambiado:', context);
});

// Evento cuando cambia la configuración de la BD
element.addEventListener('databaseConfigChangeEvent', (event: CustomEvent) => {
  const dbConfig = event.detail;
  console.log('Config BD:', dbConfig);
});
```

---

## 🚀 Ejemplo Completo

```typescript
// app.component.ts
import { Component, ViewChild, ElementRef, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="container">
      <h1>HTTP Mock Manager Demo</h1>
      
      <button (click)="toggleMockManager()">
        {{ showMockManager ? 'Ocultar' : 'Mostrar' }} Mock Manager
      </button>
      
      <!-- ✅ Custom element con binding -->
      <http-mock-manager
        *ngIf="showMockManager"
        #mockManager
        [attr.serviceCode]="currentService"
        [attr.url]="apiUrl"
        [attr.httpMethod]="method"
        [attr.delayMs]="delay"
        [attr.responseBody]="mockResponse"
        (saveMockSchemaEvent)="handleMockSaved($event)"
        (contextTypeChangeEvent)="handleContextChange($event)">
      </http-mock-manager>
      
      <div *ngIf="lastSavedMock" class="result">
        <h3>Último Mock Guardado:</h3>
        <pre>{{ lastSavedMock | json }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 20px; }
    .result { margin-top: 20px; padding: 15px; background: #f5f5f5; }
    pre { white-space: pre-wrap; }
  `]
})
export class AppComponent implements AfterViewInit {
  showMockManager = true;
  currentService = 'user-service';
  apiUrl = 'https://api.example.com/users';
  method = 'GET';
  delay = 1000;
  mockResponse = JSON.stringify({ 
    users: [
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ]
  });
  
  lastSavedMock: any = null;

  @ViewChild('mockManager') mockManagerRef?: ElementRef<HTMLElement>;

  ngAfterViewInit() {
    // Configuración adicional si es necesaria
    if (this.mockManagerRef) {
      const element = this.mockManagerRef.nativeElement;
      console.log('✅ Mock Manager element ready:', element);
    }
  }

  toggleMockManager() {
    this.showMockManager = !this.showMockManager;
  }

  handleMockSaved(event: any) {
    // El evento de custom element viene en event.detail
    this.lastSavedMock = event.detail || event;
    console.log('🎯 Mock guardado:', this.lastSavedMock);
  }

  handleContextChange(event: any) {
    const context = event.detail || event;
    console.log('🔄 Contexto cambiado:', context);
  }
}
```

---

## 📝 Notas Importantes

### 1. **CUSTOM_ELEMENTS_SCHEMA es obligatorio**

```typescript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA] // ⚡ Necesario
})
```

### 2. **Property Binding vs Attribute Binding**

Para custom elements, a veces es necesario usar attribute binding:

```html
<!-- ✅ Attribute binding (más compatible) -->
<http-mock-manager 
  [attr.serviceCode]="myService"
  [attr.url]="myUrl">
</http-mock-manager>

<!-- ⚠️ Property binding (puede no funcionar en todos los casos) -->
<http-mock-manager 
  [serviceCode]="myService"
  [url]="myUrl">
</http-mock-manager>
```

### 3. **Eventos Custom**

Los eventos de custom elements se capturan así:

```typescript
// En el template
(saveMockSchemaEvent)="handleEvent($event)"

// En el componente
handleEvent(event: any) {
  const data = event.detail; // ⚡ Los datos están en event.detail
}
```

---

## 🐛 Troubleshooting

### Problema: "app-root is not a known element"

**Solución:** No usar `<app-root>`, usar `<http-mock-manager>`

### Problema: "http-mock-manager is not a known element"

**Solución:** Agregar `CUSTOM_ELEMENTS_SCHEMA` al componente:

```typescript
@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
```

### Problema: Las propiedades no se actualizan

**Solución:** Usar attribute binding con `[attr.propertyName]`:

```html
<http-mock-manager [attr.url]="myUrl"></http-mock-manager>
```

---

## 📚 Referencias

- [Angular Elements Documentation](https://angular.io/guide/elements)
- [Custom Elements API](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)
- [Angular Signals](https://angular.io/guide/signals)
