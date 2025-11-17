# 🗂️ Components Interfaces

Esta carpeta contiene todas las interfaces organizadas de forma centralizada para los componentes de la aplicación.

## 📁 Estructura

```
src/app/components/interfaces/
├── index.ts                                    # Barrel export principal
├── http-mock-manager-component.interface.ts    # Interfaces del componente
└── http-mock-manager-presenter.interface.ts    # Interfaces del presenter
```

## 🎯 Interfaces por Archivo

### 📄 `http-mock-manager-component.interface.ts`

Contiene interfaces relacionadas con la configuración y datos del componente HttpMockManager:

```typescript
// Opción de contexto para el selector
interface ContextOption {
  id: number;
  value: string;
  useMock: boolean;
}

// Schema para definición de un mock HTTP
interface MockSchema {
  nameMock: string;
  url: string;
  httpMethod: HttpMethod;
  httpCodeResponseValue: number;
  serviceCode: string;
  delayMs: number;
  headers?: Record<string, string>;
}

// Cuerpo de respuesta del mock
interface MockBody {
  responseBody: string;
}
```

### 📄 `http-mock-manager-presenter.interface.ts`

Contiene interfaces del presenter para la arquitectura MVP:

```typescript
// Estado del presenter
interface IHttpMockManagerPresenterState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  currentMocks: HttpMockEntity[];
  statistics: any | null;
  selectedServiceCode: string | null;
  lastOperation: string | null;
}

// Eventos reactivos del presenter
interface IHttpMockManagerPresenterEvents {
  onMockCreated: Observable<HttpMockEntity>;
  onMockDeleted: Observable<string>;
  onMocksLoaded: Observable<HttpMockEntity[]>;
  onError: Observable<string>;
  onStateChanged: Observable<IHttpMockManagerPresenterState>;
}
```

## 📦 Uso de las Interfaces

### 🎯 Import Individual
```typescript
import { ContextOption, MockSchema } from './interfaces/http-mock-manager-component.interface';
import { IHttpMockManagerPresenterState } from './interfaces/http-mock-manager-presenter.interface';
```

### 🌟 Import desde Barrel (Recomendado)
```typescript
import { 
  ContextOption, 
  MockSchema, 
  MockBody,
  IHttpMockManagerPresenterState,
  IHttpMockManagerPresenterEvents 
} from '../interfaces';
```

### 🔄 Export desde Components
```typescript
// Todas las interfaces están disponibles desde el barrel principal
import { ContextOption, MockSchema } from '../components';
```

## ✅ Beneficios de la Organización

1. **📁 Centralización**: Todas las interfaces en un solo lugar
2. **🎯 Separación de responsabilidades**: Interfaces agrupadas por contexto
3. **🔄 Reutilización**: Fácil reutilización en diferentes archivos
4. **📚 Mantenibilidad**: Actualización centralizada de tipos
5. **🔍 Discoverability**: Fácil localización de interfaces
6. **📝 Documentación**: Interfaces auto-documentadas por contexto

## 🚀 Migración Completada

### ✅ Antes (Interfaces dispersas)
```typescript
// En component.ts
export interface ContextOption { ... }
export interface MockSchema { ... }

// En presenter.ts  
export interface IHttpMockManagerPresenterState { ... }
export interface IHttpMockManagerPresenterEvents { ... }
```

### ✅ Después (Interfaces centralizadas)
```typescript
// En interfaces/http-mock-manager-component.interface.ts
export interface ContextOption { ... }
export interface MockSchema { ... }

// En interfaces/http-mock-manager-presenter.interface.ts
export interface IHttpMockManagerPresenterState { ... }
export interface IHttpMockManagerPresenterEvents { ... }

// En interfaces/index.ts
export * from './http-mock-manager-component.interface';
export * from './http-mock-manager-presenter.interface';
```

## 🎭 Integración con MVP

Las interfaces están perfectamente integradas con el patrón MVP:

- **Model**: Interfaces de datos (`ContextOption`, `MockSchema`, `MockBody`)
- **View**: Interfaces del componente (eventos y propiedades)
- **Presenter**: Interfaces del presenter (`IHttpMockManagerPresenterState`, `IHttpMockManagerPresenterEvents`)

## 📊 Estado de Compilación

✅ **Compilación exitosa**: 272.65 kB bundle size  
✅ **TypeScript**: Sin errores de tipos  
✅ **Imports**: Todos los imports actualizados correctamente  
✅ **Exports**: Barrel exports funcionando correctamente  

## 🔄 Próximas Interfaces

Cuando se agreguen nuevos componentes, seguir esta estructura:

1. Crear archivo específico en `interfaces/`
2. Agregar export al `interfaces/index.ts`
3. Usar barrel import en los componentes
4. Documentar en este README

---

**🗂️ Organización completada - Todas las interfaces centralizadas y funcionando correctamente**