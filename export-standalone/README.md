# HTTP Mock Manager - Usage Guide

## 🎯 Overview

This is a self-contained Angular 20 custom element that provides a complete HTTP mock management interface. No external dependencies required!

## 📦 Installation & Usage

### Direct Script Include
```html
<script src="http-mock-manager.js"></script>
<http-mock-manager></http-mock-manager>
```

## 🚀 Features

- ✅ **Self-contained**: All Angular dependencies included
- ⚡ **Zoneless**: Optimized performance with Angular Signals  
- 🔒 **Shadow DOM**: Completely encapsulated styles
- 📊 **Full-featured**: Complete HTTP mock management
- 🎯 **Standalone**: No external Angular installation needed
- 🌐 **Universal**: Works in any HTML page or framework

## 🔧 Integration Examples

### React
```jsx
function App() {
  return (
    <div>
      <h1>My React App</h1>
      <http-mock-manager></http-mock-manager>
    </div>
  );
}
```

### Vue
```vue
<template>
  <div>
    <h1>My Vue App</h1>
    <http-mock-manager></http-mock-manager>
  </div>
</template>
```

### Plain HTML
```html
<!DOCTYPE html>
<html>
<head>
    <script src="http-mock-manager.js"></script>
</head>
<body>
    <h1>My Website</h1>
    <http-mock-manager></http-mock-manager>
</body>
</html>
```

## 📊 Bundle Information

- **Size**: ~310KB minified (all dependencies included)
- **Angular**: 20.3.12 (embedded)  
- **Performance**: Zoneless change detection
- **Compatibility**: Modern browsers with Custom Elements support

## 🐛 Troubleshooting

### Custom Elements Not Supported
Add this polyfill for older browsers:
```html
<script src="https://unpkg.com/@webcomponents/custom-elements@1.4.3/custom-elements.min.js"></script>
```
