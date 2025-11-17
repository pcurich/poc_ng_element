# 🎨 Guía de SCSS en Angular Elements

## ✨ Configuración SCSS Implementada

Este proyecto ha sido configurado para usar **SCSS** en lugar de CSS, proporcionando características avanzadas para el desarrollo de estilos.

### 🔧 Configuración Angular

```json
// angular.json
{
  "schematics": {
    "@schematics/angular:component": {
      "style": "scss",  // ✅ SCSS por defecto
      "standalone": true
    }
  }
}
```

### 📁 Estructura de Archivos

```
src/
├── styles.scss          # ✅ Estilos globales SCSS
├── app/
│   ├── app.component.ts # ✅ Estilos inline con variables CSS
│   └── custom-element/
│       └── custom-element.component.ts # ✅ Usa variables CSS
```

## 🎨 Características SCSS Implementadas

### 🔢 Variables SCSS
```scss
// Colores del tema
$primary-color: #1976d2;
$secondary-color: #424242;
$accent-color: #ff4081;
$background-color: #f5f5f5;

// Espaciado y tipografía
$spacing-unit: 8px;
$border-radius: 8px;
$font-stack: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
```

### 🧩 Mixins Reutilizables
```scss
// Mixin para botones
@mixin button-style($bg-color: $primary-color, $text-color: white) {
  background-color: $bg-color;
  color: $text-color;
  border: none;
  padding: $spacing-unit * 1.5 $spacing-unit * 3;
  border-radius: $border-radius;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: color.adjust($bg-color, $lightness: -10%);
    transform: translateY(-2px);
  }
}

// Mixin para cards
@mixin card-style {
  background: white;
  border-radius: $border-radius;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: $spacing-unit * 3;
  margin: $spacing-unit * 2 0;
}
```

### 🎯 Anidamiento y Estilos Estructurados
```scss
my-custom-element {
  display: block;
  margin: $spacing-unit * 1.25 0;
  
  .custom-element-card {
    @include card-style;
    
    .title {
      color: $primary-color;
      margin-bottom: $spacing-unit * 2;
    }
    
    .button-group {
      display: flex;
      gap: $spacing-unit * 1.5;
      
      button {
        @include button-style;
        
        &.secondary {
          @include button-style($secondary-color);
        }
      }
    }
  }
}
```

### 🌈 Variables CSS para Custom Elements
```scss
// Exposición de variables SCSS como variables CSS
:root {
  --primary-color: #{$primary-color};
  --secondary-color: #{$secondary-color};
  --accent-color: #{$accent-color};
  --background-color: #{$background-color};
  --text-color: #{$text-color};
}
```

## 🔄 Integración con Componentes

### En Componentes Standalone
Los componentes pueden usar las variables CSS expuestas:

```typescript
@Component({
  selector: 'my-custom-element',
  standalone: true,
  template: `<div class="element">Content</div>`,
  styles: [`
    .element {
      border: 2px solid var(--primary-color, #1976d2);
      color: var(--text-color, #333);
    }
  `]
})
```

## 🎯 Clases Utilitarias Incluidas

```scss
// Alineación de texto
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

// Márgenes superiores
.mt-1 { margin-top: $spacing-unit; }        // 8px
.mt-2 { margin-top: $spacing-unit * 2; }    // 16px
.mt-3 { margin-top: $spacing-unit * 3; }    // 24px

// Márgenes inferiores
.mb-1 { margin-bottom: $spacing-unit; }     // 8px
.mb-2 { margin-bottom: $spacing-unit * 2; } // 16px
.mb-3 { margin-bottom: $spacing-unit * 3; } // 24px
```

## 🛠️ Uso en Desarrollo

### Crear Nuevos Componentes con SCSS
```bash
# Los componentes nuevos usarán SCSS automáticamente
ng generate component mi-nuevo-componente

# Resultado:
# mi-nuevo-componente.component.scss ✅
```

### Variables Disponibles Globalmente
Todas las variables SCSS están disponibles en cualquier archivo `.scss`:

```scss
// En cualquier componente
.mi-elemento {
  color: $primary-color;      // ✅ Disponible globalmente
  margin: $spacing-unit;      // ✅ Disponible globalmente
  @include button-style;      // ✅ Mixin disponible globalmente
}
```

## 📊 Beneficios de SCSS vs CSS

| Característica | CSS | SCSS |
|----------------|-----|------|
| **Variables** | ⚠️ Limitadas (CSS custom properties) | ✅ Completas con scoping |
| **Mixins** | ❌ No disponibles | ✅ Reutilización de código |
| **Anidamiento** | ❌ No disponible | ✅ Estructura jerárquica |
| **Funciones** | ⚠️ Básicas | ✅ Avanzadas (color.adjust, etc.) |
| **Importación** | ⚠️ Solo @import | ✅ @use modular |
| **Condicionales** | ❌ No disponibles | ✅ @if, @for, @while |

## 🚀 Optimizaciones Implementadas

### 1. **Funciones SCSS Modernas**
```scss
@use 'sass:color';

// ❌ Función deprecada
background-color: darken($color, 10%);

// ✅ Función moderna
background-color: color.adjust($color, $lightness: -10%);
```

### 2. **Variables CSS Híbridas**
```scss
// Beneficia de ambos mundos:
// - Cálculos SCSS en tiempo de compilación
// - Reactividad CSS en runtime

:root {
  --computed-spacing: #{$spacing-unit * 2}; // 16px
  --dynamic-color: #{color.adjust($primary-color, $alpha: -0.1)};
}
```

### 3. **Tree-shaking Optimizado**
- Solo se incluyen los estilos SCSS utilizados
- Variables no utilizadas se eliminan automáticamente
- Mixins unused no se incluyen en el bundle final

## 🎯 Comandos de Build

```bash
# Development con SCSS watch
npm start

# Production build con SCSS optimizado
npm run build

# Custom elements con SCSS compilado
npm run build:elements
```

## 📈 Resultado Final

- **Bundle styles.css**: ~2.54 kB (compilado y optimizado)
- **Variables CSS**: Disponibles para runtime theming
- **Sin warnings**: Usando funciones SCSS modernas
- **Compatibilidad**: Funciona en todos los navegadores modernos

---

**🎉 ¡SCSS configurado y listo para desarrollo avanzado!**

### Próximos pasos recomendados:
1. **Theming**: Implementar múltiples temas usando variables CSS
2. **Responsive**: Crear mixins para breakpoints
3. **Animation**: Mixins para animaciones complejas
4. **Component Library**: Expandir el sistema de componentes con SCSS