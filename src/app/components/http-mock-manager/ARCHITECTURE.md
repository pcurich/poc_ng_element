# HTTP Mock Manager - Arquitectura de Componentes

## 📋 Estructura Modular

El componente `http-mock-manager` ha sido refactorizado siguiendo los principios SOLID para mejorar la mantenibilidad y permitir la extensibilidad futura.

## 🏗️ Arquitectura

```
http-mock-manager/
├── components/              # Componentes UI reutilizables
│   ├── floating-bubble/     # Globo flotante (estado minimizado)
│   └── json-editor/         # Editor JSON con validación
│
├── features/                # Componentes de características
│   ├── data-management/     # Gestión de contexto y BD
│   ├── http-definition/     # Definición de mocks HTTP
│   └── persistence/         # Import/Export
│
├── http-mock-manager.component.*  # Componente principal (orquestador)
└── http-mock-manager.presenter.ts # Lógica de presentación
```

## 🧩 Componentes

### UI Components (Reutilizables)

#### `FloatingBubbleComponent`
- **Propósito**: Vista minimizada del gestor
- **Inputs**: `mockCount`
- **Outputs**: `expand`, `dragStart`
- **Reutilizable**: ✅ Puede usarse en otros contextos

#### `JsonEditorComponent`
- **Propósito**: Editor JSON con validación y formato
- **Inputs**: `formGroup`, `controlName`, `placeholder`, `rows`
- **Outputs**: `format`, `validate`
- **Reutilizable**: ✅ Genérico para cualquier edición JSON

### Feature Components (Específicos del dominio)

#### `DataManagementComponent`
- **Responsabilidad**: Gestión de contexto y base de datos
- **Sub-tabs**:
  - Configuración de Contexto
  - Gestión de Base de Datos
- **Inputs**: `selectedContext`, `contextOptions`, `databaseStatus`, `databaseConfig`, `statistics`
- **Outputs**: `contextChange`, `refreshStats`, `reinitializeDb`, `deleteDb`
- **Extensible**: ✅ Puede gestionar otros tipos de contextos en el futuro

#### `HttpDefinitionComponent`
- **Responsabilidad**: Definición y configuración de mocks HTTP
- **Sub-tabs**:
  - Cargar y Editar
  - Configurar
  - Cabeceras
  - Cuerpo
- **Inputs**: `mockForm`, `bodyForm`, `httpMethods`, `httpCodeResponse`, `headers`, `currentMocks`
- **Outputs**: `serviceCodeChange`, `editMock`, `deleteMock`, `saveContext`, `headerAdd`, `headerRemove`
- **Opcional**: ✅ Puede desactivarse para otros protocolos (gRPC, WebSocket, etc.)

#### `PersistenceComponent`
- **Responsabilidad**: Exportación e importación de datos
- **Inputs**: Ninguno
- **Outputs**: `export`, `fileSelected`
- **Reutilizable**: ✅ Genérico para cualquier sistema de persistencia

## 🎯 Principios SOLID Aplicados

### Single Responsibility Principle (SRP)
- Cada componente tiene una responsabilidad única y bien definida
- `FloatingBubbleComponent`: Solo maneja la vista minimizada
- `JsonEditorComponent`: Solo edita y valida JSON
- `DataManagementComponent`: Solo gestiona datos y contexto
- `HttpDefinitionComponent`: Solo define mocks HTTP
- `PersistenceComponent`: Solo maneja import/export

### Open/Closed Principle (OCP)
- Los componentes están abiertos a extensión pero cerrados a modificación
- `HttpDefinitionComponent` es opcional y puede ser reemplazado por otros protocolos
- `DataManagementComponent` puede extenderse para nuevos tipos de contexto

### Liskov Substitution Principle (LSP)
- Los componentes feature pueden ser intercambiados sin afectar el funcionamiento del sistema
- El componente principal solo interactúa a través de interfaces bien definidas (@Input/@Output)

### Interface Segregation Principle (ISP)
- Los componentes solo exponen las interfaces que necesitan
- No hay dependencias innecesarias entre componentes

### Dependency Inversion Principle (DIP)
- El componente principal depende de abstracciones (eventos) no de implementaciones concretas
- Los componentes se comunican a través de eventos (@Output) en lugar de referencias directas

## 🔄 Flujo de Datos

```
http-mock-manager (Container)
    ↓ [Props]
    ├── FloatingBubbleComponent
    │   └── [Events] → expand, dragStart
    │
    ├── DataManagementComponent
    │   └── [Events] → contextChange, refreshStats, reinitializeDb, deleteDb
    │
    ├── HttpDefinitionComponent (Opcional)
    │   ├── JsonEditorComponent
    │   └── [Events] → saveContext, editMock, deleteMock, headerAdd, headerRemove
    │
    └── PersistenceComponent
        └── [Events] → export, fileSelected
```

## 🚀 Extensibilidad Futura

### Agregar nuevos protocolos
Para agregar soporte para otros protocolos (gRPC, WebSocket, MQTT):

1. Crear nuevo feature component: `<protocol>-definition.component.ts`
2. Implementar la misma interfaz de eventos que `HttpDefinitionComponent`
3. Configurar en el componente principal qué protocol usar

```typescript
// Ejemplo futuro
<app-grpc-definition *ngIf="protocolType === 'grpc'" ...></app-grpc-definition>
<app-http-definition *ngIf="protocolType === 'http'" ...></app-http-definition>
<app-websocket-definition *ngIf="protocolType === 'websocket'" ...></app-websocket-definition>
```

### Agregar nuevos contextos
Para agregar nuevos tipos de contexto (Cloud, Edge, etc.):

1. Extender `DataManagementComponent` o crear sub-componentes
2. Agregar nuevas opciones en `ContextOption[]`
3. Implementar lógica específica sin modificar componentes existentes

## 📦 Uso

```typescript
import { 
  FloatingBubbleComponent,
  JsonEditorComponent,
  DataManagementComponent,
  HttpDefinitionComponent,
  PersistenceComponent 
} from './components/http-mock-manager/components';

// Los componentes están listos para usar standalone
```

## 🧪 Testing

Cada componente puede ser testeado de forma independiente:

```typescript
describe('FloatingBubbleComponent', () => {
  // Test unitario aislado
});

describe('DataManagementComponent', () => {
  // Test con mocks de servicios
});
```

## 📝 Notas

- Todos los componentes son **standalone** (no requieren módulos)
- Mantienen compatibilidad con la API existente del componente principal
- No se crearon nuevas interfaces ni tipos (se reutilizan los existentes)
- La refactorización es **retrocompatible**
