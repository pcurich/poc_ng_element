# ❓ FAQ - Preguntas Frecuentes

## 🎯 Uso del Custom Element

### ❓ ¿Qué tag debo usar?

**Respuesta:** Usa `<http-mock-manager>`, NO `<app-root>`.

```html
<!-- ✅ CORRECTO -->
<http-mock-manager></http-mock-manager>

<!-- ❌ INCORRECTO -->
<app-root></app-root>
```

---

### ❓ ¿Por qué antes veía referencias a `app-root`?

**Respuesta:** En versiones anteriores, el bundle incluía accidentalmente el componente de desarrollo `AppComponent` (selector: `app-root`). Esto se ha corregido. Ahora el bundle solo expone `http-mock-manager`.

Ver [TECHNICAL_ANALYSIS.md](TECHNICAL_ANALYSIS.md) para detalles técnicos.

---

### ❓ ¿Qué pasa si mi proyecto ya tiene un `app-root`?

**Respuesta:** No hay problema. El custom element de esta librería es `http-mock-manager`, no interferirá con tu `app-root`.

```typescript
// Tu app.component.ts
@Component({
  selector: 'app-root',  // ← Tu componente raíz
  template: `
    <h1>Mi App</h1>
    
    <!-- ✅ Custom element de la librería -->
    <http-mock-manager></http-mock-manager>
  `
})
export class AppComponent {}
```

---

## 🔧 Integración en Angular

### ❓ ¿Necesito CUSTOM_ELEMENTS_SCHEMA?

**Respuesta:** Sí, para evitar errores de compilación.

```typescript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // ← Necesario
})
```

Sin esto, Angular reportará: `"http-mock-manager is not a known element"`

---

### ❓ ¿Property binding o attribute binding?

**Respuesta:** Para custom elements, **attribute binding** es más confiable:

```typescript
// ✅ RECOMENDADO - Attribute binding
<http-mock-manager 
  [attr.serviceCode]="myService"
  [attr.url]="myUrl">
</http-mock-manager>

// ⚠️ Puede no funcionar en todos los casos
<http-mock-manager 
  [serviceCode]="myService"
  [url]="myUrl">
</http-mock-manager>
```

Ver [LIBRARY_USAGE.md](LIBRARY_USAGE.md#property-binding-vs-attribute-binding) para más detalles.

---

### ❓ ¿Cómo capturo eventos del custom element?

**Respuesta:** Los eventos vienen en `event.detail`:

```typescript
// En el template
<http-mock-manager (saveMockSchemaEvent)="onSave($event)">
</http-mock-manager>

// En el componente
onSave(event: any) {
  const mockSchema = event.detail;  // ← Los datos están aquí
  console.log(mockSchema);
}
```

---

## 📦 Build y Deployment

### ❓ ¿Cómo genero el bundle?

**Respuesta:**

```bash
# Build + verificación automática (RECOMENDADO)
npm run export:verified

# Solo build
npm run export:standalone

# Solo verificación
npm run verify:bundle
```

---

### ❓ ¿Qué archivos se generan?

**Respuesta:**

```
export-standalone/
├── http-mock-manager.js    ← Bundle autocontenido (323 KB)
├── index.html              ← Demo funcional
└── README.md               ← Guía de uso
```

También en `dist/`:
```
dist/
├── http-mock-manager.js
├── demo.html
└── USAGE.md
```

---

### ❓ ¿El bundle incluye Angular?

**Respuesta:** Sí, todo está incluido. No necesitas instalar Angular en el proyecto consumidor.

```
http-mock-manager.js contiene:
✅ Angular 20 core
✅ Angular Elements
✅ Signals
✅ Todos los componentes y servicios
✅ Estilos encapsulados

→ NO necesitas:
❌ @angular/core
❌ @angular/elements
❌ Ninguna dependencia externa
```

---

## 🐛 Troubleshooting

### ❓ Error: "http-mock-manager is not a known element"

**Soluciones:**

1. **Asegurar que el script se cargó:**
   ```html
   <script src="http-mock-manager.js"></script>
   ```

2. **Agregar CUSTOM_ELEMENTS_SCHEMA:**
   ```typescript
   @Component({
     schemas: [CUSTOM_ELEMENTS_SCHEMA]
   })
   ```

3. **Verificar en consola:**
   ```javascript
   console.log(customElements.get('http-mock-manager'));
   // Debe retornar el constructor del elemento
   ```

---

### ❓ Error: "app-root is not a known element"

**Solución:** Esto significa que aún tienes referencias a `app-root` en tu código. Debes cambiarlas por `http-mock-manager`.

Ver [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) para ayuda con la migración.

---

### ❓ El custom element no muestra nada

**Posibles causas:**

1. **Script no cargado:** Verifica en DevTools → Network
2. **Error en consola:** Abre DevTools → Console
3. **Shadow DOM:** Los estilos globales no afectan al contenido

**Debug:**
```javascript
// En la consola del navegador
const el = document.querySelector('http-mock-manager');
console.log(el);  // Debe existir
console.log(el.shadowRoot);  // Debe tener contenido
```

---

### ❓ Los estilos no se aplican

**Respuesta:** El componente usa **Shadow DOM**, por lo que los estilos globales no afectan su interior.

```css
/* ❌ NO funciona */
http-mock-manager button {
  color: red;
}

/* ✅ Solo puedes estilizar el host */
http-mock-manager {
  display: block;
  width: 100%;
  max-width: 800px;
}
```

---

## 🔄 Migración

### ❓ ¿Cómo migro de app-root a http-mock-manager?

**Respuesta:** Ver la guía completa en [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md).

**Resumen rápido:**
1. Buscar todas las ocurrencias de `app-root`
2. Reemplazar por `http-mock-manager`
3. Actualizar ViewChild references
4. Actualizar event listeners
5. Probar la aplicación

---

### ❓ ¿Es compatible con versiones anteriores?

**Respuesta:** NO. Si usabas `app-root`, debes migrar a `http-mock-manager`.

El tag `app-root` ya no se exporta en el bundle.

---

## 📚 Documentación

### ❓ ¿Dónde encuentro ejemplos de uso?

**Respuesta:** Tenemos documentación extensa:

- **[LIBRARY_USAGE.md](LIBRARY_USAGE.md)** - Guía completa con ejemplos
- **[TECHNICAL_ANALYSIS.md](TECHNICAL_ANALYSIS.md)** - Análisis técnico
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Migración paso a paso
- **[VISUAL_DIAGRAM.md](VISUAL_DIAGRAM.md)** - Diagramas visuales
- **`export-standalone/index.html`** - Demo funcional

---

### ❓ ¿Qué propiedades y eventos están disponibles?

**Respuesta:** Ver el archivo de tipos [`index.d.ts`](index.d.ts) para la definición completa.

**Propiedades principales:**
```typescript
serviceCode: string;
nameMock: string;
url: string;
httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
delayMs: number;
responseBody: string;
```

**Eventos principales:**
```typescript
saveMockSchemaEvent: CustomEvent<MockSchema>
contextTypeChangeEvent: CustomEvent<ContextOption>
databaseConfigChangeEvent: CustomEvent<DatabaseConfig>
```

---

## 🚀 Performance

### ❓ ¿Por qué el bundle es tan grande (323 KB)?

**Respuesta:** Porque incluye **todo** Angular 20:

```
Desglose aproximado:
- Angular Core: ~200 KB
- Angular Elements: ~40 KB
- Componente y lógica: ~60 KB
- Estilos: ~20 KB
- Otros: ~2 KB
─────────────────────
Total: ~322 KB
```

**Ventaja:** No necesitas instalar NADA más. Es completamente autocontenido.

**Optimizaciones aplicadas:**
- ✅ Minificación
- ✅ Tree-shaking
- ✅ console.log eliminados
- ✅ Código muerto removido

---

### ❓ ¿Es más pequeño que versiones anteriores?

**Respuesta:** Sí, ligeramente:

```
Antes:  ~330 KB (incluía AppComponent + console.log)
Ahora:  ~322 KB (solo http-mock-manager, sin console.log)
Ahorro: ~8 KB (-2.5%)
```

Más importante que el tamaño, ahora el bundle es **limpio** y solo expone lo necesario.

---

### ❓ ¿Puedo hacer el bundle más pequeño?

**Respuesta:** No significativamente, porque:

1. Angular 20 es el 90% del tamaño
2. Ya está minificado y optimizado
3. Tree-shaking ya aplicado
4. console.log eliminados automáticamente

**Alternativas:**
- Usar lazy loading si solo lo necesitas en ciertas páginas
- Servir el bundle comprimido (gzip reduce ~70%)

---

## 🔐 Seguridad

### ❓ ¿Es seguro usar este custom element?

**Respuesta:** Sí, pero:

- ✅ El código es TypeScript compilado con Angular
- ✅ Usa Shadow DOM para encapsulación
- ✅ No accede a APIs peligrosas por defecto
- ⚠️ Guarda datos en IndexedDB local (no se envían al servidor)
- ⚠️ Revisa el código fuente si tienes dudas

---

### ❓ ¿Qué datos se guardan?

**Respuesta:** Solo en **IndexedDB del navegador**:

- Configuraciones de mocks HTTP
- Respuestas mock
- Headers personalizados
- Contextos

**NO se envía** ningún dato a servidores externos.

---

## 🧪 Testing

### ❓ ¿Cómo escribo tests?

**Respuesta:**

```typescript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

describe('MyComponent with http-mock-manager', () => {
  let fixture: ComponentFixture<MyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA]  // ← Importante
    });
    
    fixture = TestBed.createComponent(MyComponent);
  });

  it('should render http-mock-manager', () => {
    const element = fixture.nativeElement.querySelector('http-mock-manager');
    expect(element).toBeTruthy();
  });
});
```

---

## 💼 Casos de Uso

### ❓ ¿Para qué sirve este componente?

**Respuesta:** Para gestionar mocks HTTP durante desarrollo:

1. **Desarrollo frontend** sin backend listo
2. **Testing manual** con datos controlados
3. **Demos** con datos predecibles
4. **Prototipos** sin API real

---

### ❓ ¿Se debe usar en producción?

**Respuesta:** **NO recomendado** para producción real, pero puedes:

1. Usarlo en **staging/QA** para testing
2. Cargarlo **condicionalmente** en modo desarrollo
3. Incluirlo en **demos** para clientes

```typescript
// Cargar solo en desarrollo
if (!environment.production) {
  const script = document.createElement('script');
  script.src = 'http-mock-manager.js';
  document.head.appendChild(script);
}
```

---

## 🆘 Obtener Ayuda

### ❓ ¿Dónde reporto problemas?

**Respuesta:**

1. Revisa esta FAQ
2. Lee [LIBRARY_USAGE.md](LIBRARY_USAGE.md)
3. Ejecuta `npm run verify:bundle` para validar el bundle
4. Revisa la consola del navegador para errores
5. Reporta issues en el repositorio con:
   - Versión de Angular del proyecto consumidor
   - Código de ejemplo que reproduce el problema
   - Errores de consola

---

### ❓ ¿Puedo contribuir?

**Respuesta:** Sí! 

- Reporta bugs
- Sugiere mejoras
- Comparte casos de uso
- Mejora la documentación

---

## 📊 Comparación

### ❓ ¿En qué se diferencia de otras soluciones de mocking?

| Característica | http-mock-manager | Otros |
|----------------|-------------------|-------|
| **UI Visual** | ✅ Componente visual completo | ❌ Mayormente código |
| **Standalone** | ✅ Autocontenido | ⚠️ Requieren instalación |
| **Persistencia** | ✅ IndexedDB | ⚠️ Varía |
| **Framework** | ✅ Funciona en cualquiera | ⚠️ Específico del framework |
| **Tamaño** | ⚠️ 323 KB | ✅ Típicamente menor |
| **Facilidad de uso** | ✅ Solo agregar tag | ⚠️ Configuración compleja |

---

## 🎓 Conceptos

### ❓ ¿Qué es Shadow DOM?

**Respuesta:** Encapsulación de estilos y DOM.

```
http-mock-manager (host)
└── #shadow-root (encapsulado)
    ├── estilos (no afectan al exterior)
    └── estructura HTML (aislada)
```

**Ventajas:**
- ✅ No hay conflictos de estilos
- ✅ No contamina el DOM global
- ✅ Predecible y aislado

**Desventajas:**
- ⚠️ No puedes estilizar su interior desde fuera
- ⚠️ querySelector global no funciona

---

### ❓ ¿Qué es un Custom Element?

**Respuesta:** Un tag HTML personalizado:

```html
<!-- Tags HTML nativos -->
<div>, <button>, <input>

<!-- Custom Element (definido por ti) -->
<http-mock-manager>
```

Se registra así:
```javascript
customElements.define('http-mock-manager', HttpMockManagerElement);
```

---

## 📝 Más Información

Ver:
- [LIBRARY_USAGE.md](LIBRARY_USAGE.md) - Guía completa
- [TECHNICAL_ANALYSIS.md](TECHNICAL_ANALYSIS.md) - Detalles técnicos
- [VISUAL_DIAGRAM.md](VISUAL_DIAGRAM.md) - Diagramas
- [index.d.ts](index.d.ts) - Definiciones de tipos
