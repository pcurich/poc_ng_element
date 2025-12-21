# 🔄 Guía de Migración - Actualización a versión limpia

## ⚠️ Cambios Importantes

Si estabas usando una versión anterior de esta librería, revisa esta guía para actualizar correctamente.

---

## 📌 Cambio Principal

### ANTES (versiones anteriores)

❌ Posiblemente intentabas usar:
```html
<app-root #customElement></app-root>
```

### AHORA (versión actual)

✅ **DEBES** usar:
```html
<http-mock-manager #customElement></http-mock-manager>
```

---

## 🔧 Pasos de Migración

### 1. Actualizar Referencias en Templates

**Buscar y reemplazar** en todos tus archivos `.html` o `.ts`:

```bash
# Buscar
<app-root

# Reemplazar por
<http-mock-manager
```

```bash
# Buscar
</app-root>

# Reemplazar por
</http-mock-manager>
```

### 2. Actualizar ViewChild References

**ANTES:**
```typescript
@ViewChild('customElement') element!: ElementRef;

// En el template
<app-root #customElement></app-root>
```

**AHORA:**
```typescript
@ViewChild('mockManager') mockManager!: ElementRef;

// En el template
<http-mock-manager #mockManager></http-mock-manager>
```

### 3. Actualizar Selectores Dinámicos

**ANTES:**
```typescript
const element = document.querySelector('app-root');
```

**AHORA:**
```typescript
const element = document.querySelector('http-mock-manager');
```

### 4. Actualizar Custom Elements Checks

**ANTES:**
```typescript
if (customElements.get('app-root')) {
  // ...
}
```

**AHORA:**
```typescript
if (customElements.get('http-mock-manager')) {
  // ...
}
```

---

## 📋 Checklist de Migración

- [ ] Actualizar script imports (el nombre del archivo sigue siendo `http-mock-manager.js`)
- [ ] Buscar y reemplazar todas las referencias a `<app-root>` por `<http-mock-manager>`
- [ ] Actualizar `@ViewChild` y `@ViewChildren` references
- [ ] Actualizar `querySelector` y `querySelectorAll` calls
- [ ] Actualizar event listeners
- [ ] Actualizar tests unitarios
- [ ] Actualizar tests e2e
- [ ] Verificar que `CUSTOM_ELEMENTS_SCHEMA` esté presente

---

## 💡 Ejemplos de Migración

### Caso 1: Componente Simple

**ANTES:**
```typescript
@Component({
  selector: 'my-component',
  template: `
    <div>
      <app-root serviceCode="test"></app-root>
    </div>
  `
})
export class MyComponent {}
```

**AHORA:**
```typescript
@Component({
  selector: 'my-component',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ← Agregar si no existe
  template: `
    <div>
      <http-mock-manager serviceCode="test"></http-mock-manager>
    </div>
  `
})
export class MyComponent {}
```

---

### Caso 2: Con ViewChild

**ANTES:**
```typescript
@Component({
  selector: 'my-component',
  template: `<app-root #mockRef></app-root>`
})
export class MyComponent implements AfterViewInit {
  @ViewChild('mockRef') mockRef!: ElementRef;
  
  ngAfterViewInit() {
    const el = this.mockRef.nativeElement;
    // configuración...
  }
}
```

**AHORA:**
```typescript
@Component({
  selector: 'my-component',
  schemas: [CUSTOM_ELEMENTS_SCHEMA], // ← Agregar
  template: `<http-mock-manager #mockRef></http-mock-manager>`
})
export class MyComponent implements AfterViewInit {
  @ViewChild('mockRef') mockRef!: ElementRef;
  
  ngAfterViewInit() {
    const el = this.mockRef.nativeElement;
    // configuración... (sin cambios)
  }
}
```

---

### Caso 3: Creación Dinámica

**ANTES:**
```typescript
createMockManager() {
  const element = document.createElement('app-root');
  element.setAttribute('serviceCode', 'dynamic');
  document.body.appendChild(element);
}
```

**AHORA:**
```typescript
createMockManager() {
  const element = document.createElement('http-mock-manager');
  element.setAttribute('serviceCode', 'dynamic');
  document.body.appendChild(element);
}
```

---

### Caso 4: Event Listeners

**ANTES:**
```typescript
ngAfterViewInit() {
  const element = document.querySelector('app-root');
  element?.addEventListener('saveMockSchemaEvent', (e: any) => {
    console.log(e.detail);
  });
}
```

**AHORA:**
```typescript
ngAfterViewInit() {
  const element = document.querySelector('http-mock-manager');
  element?.addEventListener('saveMockSchemaEvent', (e: any) => {
    console.log(e.detail);
  });
}
```

---

## 🧪 Testing de Migración

### 1. Tests Unitarios

Busca en tus archivos `.spec.ts`:

```typescript
// ANTES
const element = fixture.debugElement.query(By.css('app-root'));

// AHORA
const element = fixture.debugElement.query(By.css('http-mock-manager'));
```

### 2. Tests E2E

Busca en tus archivos `.e2e.ts` o `.spec.ts`:

```typescript
// ANTES
await page.waitForSelector('app-root');

// AHORA
await page.waitForSelector('http-mock-manager');
```

---

## ⚡ Script de Migración Automática (Opcional)

Si tienes muchos archivos, puedes usar este script para ayudar:

```powershell
# PowerShell - Windows
# Buscar todos los archivos que usan app-root
Get-ChildItem -Recurse -Include *.ts,*.html | 
  Select-String -Pattern "app-root" | 
  Select-Object -Unique Path
```

```bash
# Bash - Linux/Mac
# Buscar archivos que usan app-root
grep -r "app-root" --include="*.ts" --include="*.html" src/
```

**⚠️ IMPORTANTE:** Revisa cada cambio manualmente. No hagas find/replace masivo sin revisar.

---

## ✅ Verificación Post-Migración

Después de migrar, verifica:

1. **Compilación exitosa**
   ```bash
   npm run build
   ```

2. **No hay errores de template**
   ```
   ✓ No debe haber errores sobre "app-root is not a known element"
   ```

3. **Tests pasan**
   ```bash
   npm test
   ```

4. **Aplicación funciona en desarrollo**
   ```bash
   npm start
   ```

5. **Custom element se carga correctamente**
   - Abre DevTools
   - Verifica que `customElements.get('http-mock-manager')` retorna el elemento
   - Verifica que `customElements.get('app-root')` retorna `undefined`

---

## 🆘 Problemas Comunes

### Problema 1: "app-root is not a known element"

**Causa:** Olvidaste cambiar una referencia a `app-root`

**Solución:** Busca en tu código todas las referencias a `app-root` y cámbialas por `http-mock-manager`

---

### Problema 2: "http-mock-manager is not a known element"

**Causa:** Falta `CUSTOM_ELEMENTS_SCHEMA`

**Solución:**
```typescript
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
```

---

### Problema 3: El custom element no se carga

**Causa:** No se cargó el script

**Solución:** Verifica que `http-mock-manager.js` se cargue antes de usar el tag:
```html
<script src="http-mock-manager.js"></script>
<!-- Ahora puedes usar el custom element -->
<http-mock-manager></http-mock-manager>
```

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. Revisa [LIBRARY_USAGE.md](LIBRARY_USAGE.md) para ejemplos de uso correcto
2. Revisa [TECHNICAL_ANALYSIS.md](TECHNICAL_ANALYSIS.md) para detalles técnicos
3. Ejecuta `npm run verify:bundle` para verificar que el bundle es correcto

---

## 📊 Tiempo Estimado de Migración

| Tamaño del Proyecto | Tiempo Estimado |
|---------------------|-----------------|
| Pequeño (1-5 usos) | 5-10 minutos |
| Mediano (6-20 usos) | 15-30 minutos |
| Grande (20+ usos) | 30-60 minutos |

**Tip:** Usa el find/replace de tu IDE para acelerar el proceso.
