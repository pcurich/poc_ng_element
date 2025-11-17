# Proyecto Angular Elements - POC 🚀

¡Felicidades! Has creado exitosamente un proyecto de **Angular Elements** para crear **Custom Elements**.

## ✅ Lo que se ha creado:

### 🏗️ Estructura del Proyecto
- **Aplicación Angular** configurada con Angular Elements
- **Custom Component** (`CustomElementComponent`) que se convierte en Web Component
- **Scripts de build** automatizados para generar el custom element
- **Archivos de prueba** con ejemplos avanzados de uso

### 📦 Archivos Generados

1. **`src/app/custom-element/custom-element.component.ts`**
   - Componente Angular que se convierte en Custom Element
   - Soporte para propiedades de entrada (`@Input`)
   - Eventos personalizados
   - Estilos encapsulados

2. **`src/main.ts`**
   - Configuración de Angular Elements
   - Registro del Custom Element como `<my-custom-element>`

3. **`dist/elements/my-custom-element.js`**
   - Archivo JavaScript compilado que contiene el Custom Element
   - Listo para usar en cualquier aplicación web

4. **`dist/elements/example.html`**
   - Ejemplo básico de uso del Custom Element

5. **`dist/elements/advanced-test.html`**
   - Testing avanzado con múltiples casos de uso
   - Performance testing
   - Gestión de eventos
   - Casos edge

## 🎯 Cómo usar tu Custom Element:

### En cualquier página HTML:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi App</title>
    <script src="path/to/my-custom-element.js"></script>
</head>
<body>
    <my-custom-element 
        name="Pedro" 
        message="¡Hola desde Angular Elements!">
    </my-custom-element>
</body>
</html>
```

### Con JavaScript dinámico:
```javascript
const element = document.createElement('my-custom-element');
element.setAttribute('name', 'Usuario');
element.setAttribute('message', 'Creado dinámicamente');
document.body.appendChild(element);
```

## 🚦 Comandos Disponibles:

```bash
# Desarrollo
npm start                 # Servidor de desarrollo
npm run build            # Build de producción

# Custom Elements
npm run build:elements   # Crear custom element
npm run serve:elements   # Servir custom element

# Testing
npm test                 # Ejecutar tests
```

## 🌐 URLs de Prueba:

Después de ejecutar `npm run serve:elements`:
- **Ejemplo básico**: http://localhost:4200/example.html
- **Testing avanzado**: http://localhost:4200/advanced-test.html

Después de ejecutar `npm start`:
- **Aplicación Angular**: http://localhost:4200

## 🎨 Características del Custom Element:

- ✅ **Propiedades reactivas**: `name` y `message`
- ✅ **Eventos personalizados**: `elementClicked`
- ✅ **Estilos encapsulados**: No afectan el CSS global
- ✅ **Interactividad**: Contador de clicks y animaciones
- ✅ **Compatible**: Funciona en cualquier framework o vanilla JS

## 🔥 Próximos pasos:

1. **Personaliza el componente** en `src/app/custom-element/`
2. **Agrega más propiedades** con `@Input()`
3. **Crea más eventos** con `CustomEvent`
4. **Optimiza el bundle** ajustando la configuración de build
5. **Publica en NPM** para compartir tu Custom Element

## 📚 Recursos útiles:

- [Angular Elements Docs](https://angular.io/guide/elements)
- [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Custom Elements](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements)

---

**¡Tu Custom Element está listo para usar! 🎉**

Abre los archivos de ejemplo en el navegador o ejecuta `npm run serve:elements` para ver tu Custom Element en acción.