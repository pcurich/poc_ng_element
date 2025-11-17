# Angular Elements Project - POC (Standalone + Signals + Zoneless)

Este proyecto es una prueba de concepto (POC) para crear **Custom Elements** usando **Angular Elements** con las últimas características de Angular: **Standalone Components**, **Signals** y **configuración Zoneless**.

## 🎯 Objetivo

Demostrar cómo crear componentes Angular modernos que pueden ser utilizados como Custom Elements (Web Components) en cualquier aplicación web, independientemente del framework utilizado, aprovechando las mejoras de performance y desarrollo de Angular 19.

## 🚀 Características

- ✅ **Standalone Components**: Sin NgModules, arquitectura moderna
- ✅ **Angular Signals**: Reactividad mejorada sin Zone.js
- ✅ **Zoneless Configuration**: Mejor performance y bundle más pequeño
- ✅ **Custom Elements**: Componente convertible a Web Component
- ✅ **Propiedades reactivas**: `@Input` con detección de cambios
- ✅ **Eventos personalizados**: Comunicación bidireccional
- ✅ **Estilos encapsulados**: CSS aislado del resto de la aplicación
- ✅ **Bundle optimizado**: Sin Zone.js = menos tamaño y mejor performance

## 📋 Requisitos Previos

- Node.js (v18 o superior)
- npm (v9 o superior)
- Angular CLI (v19 o superior)

## 🛠️ Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   git clone <repository-url>
   cd poc_ng_element
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

## 🎮 Uso

### Desarrollo

1. **Servir la aplicación en modo desarrollo**
   ```bash
   npm start
   ```
   - Abre tu navegador en `http://localhost:4200`
   - Verás la aplicación con ejemplos del custom element

### Construcción para Producción

1. **Compilar el custom element**
   ```bash
   npm run build:elements
   ```

2. **Servir los archivos compilados**
   ```bash
   npm run serve:elements
   ```

## 📁 Estructura del Proyecto

```
poc_ng_element/
├── src/
│   ├── app/
│   │   ├── custom-element/           # Componente que se convertirá a Custom Element
│   │   │   └── custom-element.component.ts
│   │   └── app.component.ts          # Componente principal de la app
│   ├── main.ts                      # Configuración de Angular Elements
│   ├── index.html                   # HTML principal con ejemplos
│   └── styles.css                   # Estilos globales
├── dist/
│   └── elements/
│       ├── my-custom-element.js     # Custom element compilado
│       └── example.html             # Ejemplo de uso
├── concat.js                        # Script para concatenar archivos JS
├── package.json
├── angular.json
└── tsconfig.json
```

## 🧩 Uso del Custom Element

### En HTML puro

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi App</title>
    <!-- Cargar el custom element -->
    <script src="path/to/my-custom-element.js"></script>
</head>
<body>
    <!-- Usar el custom element -->
    <my-custom-element 
        name="Pedro" 
        message="¡Hola desde Angular Elements!">
    </my-custom-element>
</body>
</html>
```

### Creación dinámica con JavaScript

```javascript
// Crear elemento
const element = document.createElement('my-custom-element');

// Configurar propiedades
element.setAttribute('name', 'Usuario');
element.setAttribute('message', 'Mensaje dinámico');

// Escuchar eventos
element.addEventListener('elementClicked', (event) => {
    console.log('Elemento clickeado:', event.detail);
});

// Agregar al DOM
document.body.appendChild(element);
```

## 🎨 Propiedades y Eventos

### Propiedades de Entrada

| Propiedad | Tipo   | Descripción           | Valor por defecto |
|-----------|--------|-----------------------|-------------------|
| `name`    | string | Nombre a mostrar      | "Mundo"           |
| `message` | string | Mensaje personalizado | "¡Este es un custom element de Angular!" |

### Eventos

| Evento           | Descripción                    | Datos del evento |
|------------------|--------------------------------|------------------|
| `elementClicked` | Se dispara al hacer click      | `{ name, message, clickCount, timestamp }` |

## 🔧 Comandos Disponibles

| Comando                    | Descripción                                    |
|----------------------------|------------------------------------------------|
| `npm start`                | Servidor de desarrollo                         |
| `npm run build`            | Compilar para producción                       |
| `npm run build:elements`   | Compilar y crear custom element                |
| `npm run serve:elements`   | Servir archivos del custom element            |
| `npm test`                 | Ejecutar tests                                 |

## 🌟 Características del Custom Element

### Interactividad
- Contador de clicks
- Eventos personalizados
- Actualización reactiva de la UI

### Estilos
- Diseño moderno y responsivo
- Animaciones suaves
- Estilos encapsulados (no afectan el resto de la página)

### Compatibilidad
- Funciona en navegadores modernos
- Soporte para IE11 con polyfills
- Compatible con cualquier framework o vanilla JS

## 🐛 Troubleshooting

### Error: "Custom element not defined"
- Asegúrate de que el script `my-custom-element.js` se haya cargado completamente
- Verifica que no hay errores en la consola del navegador

### El elemento no se muestra
- Verifica que las propiedades se están pasando correctamente
- Revisa que el elemento tenga contenido o estilos visibles

### Problemas de compilación
```bash
# Limpiar y reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build:elements
```

## 📚 Recursos Adicionales

- [Angular Elements Documentation](https://angular.io/guide/elements)
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama para nueva feature (`git checkout -b feature/nueva-feature`)
3. Commit de cambios (`git commit -am 'Agregar nueva feature'`)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

**¡Disfruta creando Custom Elements con Angular! 🎉**