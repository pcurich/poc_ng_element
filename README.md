# 🌐 HTTP Mock Manager - Angular 20 Custom Element

> Self-contained Web Component + ORM Library para gestión de HTTP Mocks con IndexedDB

## ⚠️ IMPORTANTE: Custom Element Tag

### ✅ Tag Correcto: `<http-mock-manager>`

Este proyecto exporta el custom element **`http-mock-manager`**, NO `app-root`.

```html
<!-- ✅ CORRECTO -->
<http-mock-manager></http-mock-manager>

<!-- ❌ INCORRECTO - No usar -->
<app-root></app-root>
```

**Nota:** El tag `app-root` es solo para desarrollo interno del proyecto. La librería exporta únicamente `http-mock-manager` como custom element público.

---

## 🎯 Propósito del Proyecto

**HTTP Mock Manager** es una solución dual que proporciona:

1. **Web Component Standalone** (`<http-mock-manager>`) - Componente Angular 20 autocontenido para gestionar mocks HTTP visualmente
2. **ORM Library** (`poc-ng-element/core`) - Sistema ORM para acceder a mocks desde IndexedDB en cualquier proyecto Angular

### ✨ Características Principales

- ✅ **Angular 20** con Signals y arquitectura Zoneless
- ✅ **Standalone Architecture** - Sin módulos `@NgModule`
- ✅ **IndexedDB ORM** - Persistencia local en el navegador
- ✅ **Shadow DOM** - Encapsulación CSS completa
- ✅ **298 KB** - Bundle único con todas las dependencias incluidas
- ✅ **Tree-shakeable** - Solo incluye código usado
- ✅ **TypeScript** - Tipado completo y seguro
- ✅ **Clean Export** - Sin tags adicionales ni contaminación del DOM

---

## 📦 Tres Formas de Uso

### 1️⃣ **Export Standalone** (⚡ RECOMENDADO - Más Eficiente)

Exporta solo el web component como archivo JavaScript único, listo para usar en cualquier proyecto HTML/JS.

#### Generar:

```bash
npm run export:standalone
```

#### Resultado:

```
export-standalone/
├── http-mock-manager.js  (298 KB) - Web component autocontenido
├── index.html                     - Demo completo funcional
└── README.md                      - Guía de uso
```

#### Uso:

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Mi Aplicación</title>
</head>
<body>
    <!-- ✅ Solo cargar el script -->
    <script src="http-mock-manager.js"></script>
    
    <!-- ✅ Usar el custom element -->
    <http-mock-manager></http-mock-manager>
</body>
</html>
```

#### ✨ Ventajas:

- 🚀 **Sin instalación NPM** - Copia y usa
- 🎯 **Plug & Play** - Funciona en cualquier HTML
- 💾 **Portable** - Un solo archivo JS
- ⚡ **Rápido** - Sin build process en el proyecto destino
- 🌐 **Universal** - Compatible con React, Vue, Vanilla JS, etc.

#### Casos de Uso:

- Agregar UI de mocks a proyectos existentes sin modificar estructura
- Distribuir como CDN (`<script src="https://cdn.com/http-mock-manager.js">`)
- Testing manual en HTML estático
- Demos y prototipos rápidos

---

### 2️⃣ **Package NPM (TGZ)**

Paquete completo que incluye **web component + ORM library** para integración completa en proyectos Angular.

#### Generar:

```bash
npm run package:tgz
```

#### Resultado:

```
poc-ng-element-1.0.0.tgz (118 KB comprimido)
├── dist/
│   ├── http-mock-manager.js  (298 KB) - Web component
│   └── demo.html
├── src/core/                 - ORM Library
│   ├── providers.ts          - Funciones provide*() standalone
│   ├── services/             - HttpMockService con Signals
│   ├── repositories/         - HttpMockRepository
│   ├── models/               - HttpMockEntity
│   └── context/              - DbContext IndexedDB
├── index.d.ts                - Type definitions
└── package.json
```

#### Instalar:

```bash
npm install ../../poc-ng-element-1.0.0.tgz
```

#### Uso - Web Component:

```typescript
// app.component.ts (Angular)
import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `<http-mock-manager></http-mock-manager>`
})
export class AppComponent {}

// main.ts
import 'poc-ng-element'; // Registra el custom element
```

#### Uso - ORM Library:

```typescript
// Opción A: Uso directo con ORMFactory (sin DI)
import { ORMFactory, IHttpMockData } from 'poc-ng-element/core';

async function loadMocks() {
  const mocks: IHttpMockData[] = await ORMFactory.findMocksByServiceCode('userService');
  console.log(`Found ${mocks.length} mocks`);
}

// Opción B: Dependency Injection con Providers
import { Component, inject } from '@angular/core';
import { provideHttpMockService, HttpMockService } from 'poc-ng-element/core';

@Component({
  standalone: true,
  providers: [provideHttpMockService()],
  template: `<div>Total: {{ stats().totalMocks }}</div>`
})
export class StatsComponent {
  private mockService = inject(HttpMockService);
  stats = this.mockService.statistics;
}

// Opción C: Global en app.config.ts
import { provideHttpMockORM } from 'poc-ng-element/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpMockORM() // ✅ Provee Service + Repository
  ]
};
```

#### ✨ Ventajas:

- 🎯 **Integración completa** - Web Component + ORM
- 🔧 **Dependency Injection** - Funciones `provide*()` modernas
- 📊 **Signals reactivos** - Estado reactivo con Angular Signals
- 🔍 **TypeScript** - IntelliSense y type safety
- 🧪 **Testeable** - Fácil de mockear en tests

#### Casos de Uso:

- Proyectos Angular que necesitan UI + acceso programático a mocks
- HTTP Interceptors que leen mocks desde IndexedDB
- Aplicaciones que requieren gestión reactiva de estado
- Testing E2E con datos persistentes

---

### 3️⃣ **Build Elements (Solo Development)**

Genera el bundle en `dist/` para desarrollo local.

#### Generar:

```bash
npm run package:elements
```

#### Resultado:

```
dist/
├── http-mock-manager.js  (298 KB)
├── demo.html             - Demo local
└── USAGE.md              - Documentación
```

#### Servir localmente:

```bash
npm run serve:elements
# Abre http://localhost:4200
```

#### Casos de Uso:

- Desarrollo y testing local
- Preview de cambios antes de exportar
- Debug del web component

---

## 🚀 ORM Core API

### ORMFactory (Uso Directo)

```typescript
import { ORMFactory, IHttpMockData } from 'poc-ng-element/core';

// Buscar por serviceCode
const mocks = await ORMFactory.findMocksByServiceCode('userService');

// Buscar por URL
const urlMocks = await ORMFactory.findMocksByUrl('/api/users/:id');

// Cerrar conexión
await ORMFactory.closeDbContext();
```

### Providers (Dependency Injection)

```typescript
import { 
  provideHttpMockService,     // Solo servicio
  provideHttpMockORM,         // Servicio + Repositorio
  provideHttpMockORMConfig    // Con configuración custom
} from 'poc-ng-element/core';

// En componente standalone
@Component({
  standalone: true,
  providers: [provideHttpMockService()]
})
export class MyComponent {
  private service = inject(HttpMockService);
}

// En app.config.ts (global)
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpMockORM()
  ]
};
```

### HttpMockService (Reactive)

```typescript
import { HttpMockService } from 'poc-ng-element/core';

@Component({
  template: `
    <div>Total: {{ stats().totalMocks }}</div>
    <div>Active: {{ stats().activeMocks }}</div>
  `
})
export class StatsComponent {
  private mockService = inject(HttpMockService);
  
  // Signals reactivos
  stats = this.mockService.statistics;
  mocks = this.mockService.mocks;
  
  async ngOnInit() {
    await this.mockService.loadMocks();
  }
}
```

---

## 🔧 Scripts NPM Disponibles

### 📦 Producción y Exports

| Comando | Descripción | Output |
|---------|-------------|--------|
| `npm run export:clean` | 🧹 **RECOMENDADO** - Limpia + Construye + Exporta standalone | `export-standalone/` |
| `npm run export:standalone` | ⚡ Exporta web component portable | `export-standalone/` |
| `npm run package:tgz` | 📦 Genera paquete NPM completo (Web Component + ORM) | `poc-ng-element-1.0.0.tgz` |
| `npm run package:elements` | 🔨 Build del web component | `dist/http-mock-manager.js` |

### 🛠️ Desarrollo

| Comando | Descripción | Output |
|---------|-------------|--------|
| `npm start` | 🚀 Servidor desarrollo Angular | `http://localhost:4200` |
| `npm run build` | 🏗️ Build producción Angular | `dist/` |
| `npm run build:dev` | 🏗️ Build development Angular | `dist/` |
| `npm run build:elements` | 🔨 Build custom element | `dist/browser/` |
| `npm run serve:elements` | 🌐 Servir demo local | `http://localhost:4200` |
| `npm run demo:elements` | 🎬 Build + Serve demo | Build → Server |
| `npm run watch` | 👀 Build con watch mode | Auto-rebuild |
| `npm test` | 🧪 Ejecutar tests unitarios | Karma + Jasmine |

### 🧹 Limpieza

| Comando | Descripción |
|---------|-------------|
| `npm run clean` | 🧹 Limpia dist + cache completo |
| `npm run clean:dist` | 🧹 Limpia solo carpeta dist |
| `npm run clean:cache` | 🧹 Limpia cache de Angular |
| `npm run clean:install` | 🧹 Limpia + reinstala node_modules |
| `npm run clean:build` | 🧹 Limpia dist + build dev |
| `npm run clean:build:prod` | 🧹 Limpia dist + build prod |
| `npm run rebuild` | 🔄 Limpia + reinstala + build dev |
| `npm run fresh-start` | 🆕 Limpia + reinstala + build + serve |

---

## 🏗️ Arquitectura

### Estructura del Proyecto

```
poc_ng_element/
├── src/
│   ├── app/                      # Angular App (Development UI)
│   │   └── components/
│   │       └── http-mock-manager/   # Componente principal
│   │
│   ├── core/                     # 🎯 ORM Library (Exportable)
│   │   ├── context/              # DbContext IndexedDB
│   │   ├── models/               # Entidades (HttpMockEntity)
│   │   ├── repositories/         # Patrón Repository
│   │   ├── services/             # HttpMockService (Signals)
│   │   ├── types/                # TypeScript definitions
│   │   ├── providers.ts          # Funciones provide*()
│   │   └── index.ts              # Barrel exports
│   │
│   ├── main.ts                   # Angular bootstrap normal
│   └── main-elements.ts          # Bootstrap para custom element
│
├── dist/                         # Output del build
├── export-standalone/            # Output de export:standalone
└── sandbox/                      # Proyectos de prueba
    ├── ng_test_16/               # Angular 16
    └── ng_test_18/               # Angular 18
```

### Patrones Implementados

- ✅ **Standalone Components** - Sin `@NgModule`
- ✅ **Repository Pattern** - Abstracción de acceso a datos
- ✅ **Singleton Pattern** - DbContext único compartido
- ✅ **Signals** - Estado reactivo moderno
- ✅ **Shadow DOM** - Encapsulación CSS
- ✅ **SOLID Principles** - Código mantenible y extensible

---

## 🌐 Ejemplo: HTTP Interceptor con Mocks

```typescript
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpResponse } from '@angular/common/http';
import { from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ORMFactory } from 'poc-ng-element/core';

@Injectable()
export class MockInterceptor implements HttpInterceptor {
  
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const serviceCode = req.headers.get('X-Service-Code');
    
    if (!serviceCode) {
      return next.handle(req);
    }
    
    return from(this.tryMock(req, serviceCode)).pipe(
      switchMap(res => res ? from([res]) : next.handle(req))
    );
  }
  
  private async tryMock(req: HttpRequest<any>, serviceCode: string) {
    const mocks = await ORMFactory.findMocksByServiceCode(serviceCode);
    const match = mocks.find(m => 
      m.url === req.url && m.method === req.method
    );
    
    if (match) {
      await new Promise(r => setTimeout(r, match.delayMs));
      return new HttpResponse({
        status: match.httpCodeResponseValue,
        body: JSON.parse(match.responseBody)
      });
    }
    
    return null;
  }
}
```

---

## 🧪 Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { provideHttpMockService, ORMFactory } from 'poc-ng-element/core';

describe('MyComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MyComponent],
      providers: [provideHttpMockService()]
    });
  });

  afterEach(async () => {
    await ORMFactory.closeDbContext();
  });

  it('should load mocks', async () => {
    const mocks = await ORMFactory.findMocksByServiceCode('test');
    expect(mocks).toBeInstanceOf(Array);
  });
});
```

---

## 📊 Comparación de Métodos

| Aspecto | Export Standalone | Package NPM (TGZ) | Build Elements |
|---------|-------------------|-------------------|----------------|
| **Tamaño** | 298 KB (1 archivo) | 118 KB comprimido | 298 KB |
| **Instalación** | Copy-paste | `npm install` | Local dev |
| **ORM incluido** | ❌ Solo UI | ✅ UI + ORM | ❌ Solo UI |
| **TypeScript** | ❌ No | ✅ Sí (.d.ts) | ❌ No |
| **DI Angular** | ❌ No | ✅ Sí (providers) | ❌ No |
| **Uso en HTML** | ✅ Directo | ⚠️ Requiere build | ✅ Local |
| **Portabilidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **Integración Angular** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

### 🎯 Recomendaciones

- **Solo necesitas UI visual** → `npm run export:standalone` ⚡
- **Proyecto Angular con acceso programático** → `npm run package:tgz`
- **Desarrollo y testing local** → `npm run package:elements`

---

## 📦 Package.json Exports

```json
{
  "name": "poc-ng-element",
  "version": "1.0.0",
  "main": "dist/http-mock-manager.js",
  "types": "index.d.ts",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "default": "./dist/http-mock-manager.js"
    },
    "./core": "./src/core/index.ts"
  },
  "files": [
    "dist/http-mock-manager.js",
    "dist/demo.html",
    "dist/USAGE.md",
    "src/core",
    "README.md",
    "index.d.ts"
  ]
}
```

### Importaciones disponibles:

```typescript
// Web Component (default export)
import 'poc-ng-element';

// ORM Library
import { ORMFactory, HttpMockService, provideHttpMockORM } from 'poc-ng-element/core';
```

---

## � Documentación Completa

Este proyecto incluye documentación exhaustiva para diferentes necesidades:

### 🚀 Para Empezar
- **[DOCS_INDEX.md](DOCS_INDEX.md)** - Índice completo de documentación (¡EMPIEZA AQUÍ!)
- **[LIBRARY_USAGE.md](LIBRARY_USAGE.md)** - Guía completa de integración en Angular 16, 18+
- **[FAQ.md](FAQ.md)** - Preguntas y respuestas frecuentes

### 🔧 Documentación Técnica
- **[TECHNICAL_ANALYSIS.md](TECHNICAL_ANALYSIS.md)** - Análisis del problema app-root y soluciones
- **[VISUAL_DIAGRAM.md](VISUAL_DIAGRAM.md)** - Diagramas visuales del problema y solución
- **[SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md)** - Resumen ejecutivo

### 🔄 Migración
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Guía para migrar de versiones anteriores

### 📖 Referencia
- **[index.d.ts](index.d.ts)** - Definiciones TypeScript completas

**👉 Si es tu primera vez, comienza con [DOCS_INDEX.md](DOCS_INDEX.md)**

---

## �🔑 Tecnologías

- **Angular**: 20.3.12
- **TypeScript**: 5.9.3
- **RxJS**: 7.8.0
- **IndexedDB**: Native API
- **Shadow DOM**: Encapsulación CSS
- **Signals**: Angular Signals API

---

## 📄 Licencia

MIT

---

## 👤 Autor

Pedro Curich

---

**Versión**: 1.0.0  
**Build**: Angular 20 + Signals + Zoneless  
**Storage**: IndexedDB  
**Pattern**: Standalone + Repository + ORM
