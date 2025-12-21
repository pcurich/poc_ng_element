const fs = require('fs-extra');
const path = require('path');

/**
 * 🎯 Script para generar custom element autocontenido
 * 
 * Este script:
 * 1. Concatena todos los archivos JS en un solo bundle
 * 2. Incluye todas las dependencias de Angular embebidas
 * 3. Genera un custom element completamente independiente
 * 4. Crea documentación de uso
 * 
 * Flags:
 * --keep-logs : Mantiene los console.log en el bundle (útil para desarrollo)
 */

// Leer argumentos de línea de comandos
const args = process.argv.slice(2);
const keepLogs = args.includes('--keep-logs');

if (keepLogs) {
  console.log('🔊 Console logs will be preserved in bundle');
} else {
  console.log('🔇 Console logs will be removed from bundle');
}

async function concatElements() {
  const distPath = path.join(__dirname, 'dist', 'browser');
  const outputPath = path.join(__dirname, 'dist');
  const outputFile = path.join(outputPath, 'http-mock-manager.js');

  try {
    // Leer todos los archivos JS del directorio dist
    const files = await fs.readdir(distPath);
    let jsFiles = files.filter(file => 
      file.endsWith('.js') && 
      !file.includes('.map') && 
      !file.includes('http-mock-manager.js') // Evitar incluirse a sí mismo
    );
    
    // Ordenar archivos para asegurar carga correcta: runtime -> polyfills -> main
    const priority = ['runtime', 'polyfills', 'main'];
    jsFiles.sort((a, b) => {
      const aIndex = priority.findIndex(p => a.startsWith(p));
      const bIndex = priority.findIndex(p => b.startsWith(p));
      
      // Si ambos están en la lista de prioridad
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      
      // Si solo a está en la lista, va primero
      if (aIndex !== -1) return -1;
      
      // Si solo b está en la lista, va primero
      if (bIndex !== -1) return 1;
      
      // Orden alfabético por defecto
      return a.localeCompare(b);
    });
    
    console.log('📦 Found JS files (ordered):', jsFiles);

    if (jsFiles.length === 0) {
      console.error('❌ No JS files found in dist directory. Run "npm run build:elements" first.');
      process.exit(1);
    }

    let concatenatedContent = '';
    
    // Banner del custom element autocontenido
    concatenatedContent += `/**
 * 🌐 HTTP Mock Manager - Self-Contained Custom Element
 * 
 * Version: 1.0.0
 * Built with: Angular 20.3.12 + Signals + Zoneless
 * Bundle: All dependencies included
 * 
 * Usage:
 *   <script src="http-mock-manager.js"></script>
 *   <http-mock-manager></http-mock-manager>
 * 
 * No external dependencies required!
 */

(function(global) {
  'use strict';
  
  // Polyfill para custom elements en navegadores antiguos
  if (!global.customElements) {
    console.warn('⚠️ Custom Elements not supported. Consider loading a polyfill.');
  }

`;

    // Concatenar archivos en orden específico (main.js al final)
    const orderedFiles = jsFiles.sort((a, b) => {
      if (a.includes('main')) return 1;
      if (b.includes('main')) return -1;
      if (a.includes('polyfills')) return -1;
      if (b.includes('polyfills')) return 1;
      return 0;
    });

    for (const file of orderedFiles) {
      const filePath = path.join(distPath, file);
      let content = await fs.readFile(filePath, 'utf8');
      
      // 🔧 Limpiar referencias a app-root que no se usan en el custom element
      // Solo queremos exponer http-mock-manager, no app-root
      content = content
        .replace(/selector:\s*['"`]app-root['"`]/g, 'selector: "app-root-unused"')
        .replace(/customElements\.define\(\s*['"`]app-root['"`]/g, 'customElements.define("app-root-unused"')
        .replace(/<app-root>/g, '<app-root-unused>')
        .replace(/<\/app-root>/g, '</app-root-unused>');
      
      // 🔇 Eliminar console.log para bundle de producción limpio (solo si no está el flag --keep-logs)
      // Mantener console.warn y console.error para debugging crítico
      if (!keepLogs) {
        content = content
          .replace(/console\.log\([^)]*\);?/g, '/* console.log removed */')
          .replace(/console\.debug\([^)]*\);?/g, '/* console.debug removed */')
          .replace(/console\.info\([^)]*\);?/g, '/* console.info removed */');
      }
      
      // Envolver cada archivo en su propio scope para evitar conflictos
      concatenatedContent += `
/* === ${file} === */
(function() {
${content}
})();
`;
    }

    // Footer del bundle
    concatenatedContent += `
  
})(typeof window !== 'undefined' ? window : this);

/* End of http-mock-manager.js bundle */`;

    // Escribir archivo concatenado
    await fs.writeFile(outputFile, concatenatedContent);
    
    const bundleStats = await fs.stat(outputFile);
    console.log(`✅ Self-contained bundle created: ${outputFile}`);
    console.log(`📊 Bundle size: ${(bundleStats.size / 1024).toFixed(2)} KB`);
    console.log(`🎯 Custom element: <http-mock-manager></http-mock-manager>`);

    // Generar archivos de documentación y demo
    await generateDemoHTML(outputPath);
    await generateUsageGuide(outputPath);

  } catch (error) {
    console.error('❌ Error creating bundle:', error);
    process.exit(1);
  }
}

async function generateDemoHTML(outputPath) {
  const demoContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HTTP Mock Manager - Demo</title>
    <style>
        body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .demo-container {
            max-width: 800px;
            text-align: center;
            padding: 2rem;
        }
        
        .title {
            font-size: 3rem;
            margin-bottom: 1rem;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .usage-box {
            background: rgba(255, 255, 255, 0.1);
            padding: 1.5rem;
            border-radius: 12px;
            margin: 2rem 0;
            backdrop-filter: blur(10px);
        }
        
        .code {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            margin: 1rem 0;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 1rem;
            border-radius: 8px;
            backdrop-filter: blur(10px);
        }
        
        .demo-area {
            margin: 3rem 0;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1 class="title">🌐 HTTP Mock Manager</h1>
        <p class="subtitle">Self-Contained Custom Element • Angular 20 + Signals + Zoneless</p>
        
        <div class="usage-box">
            <h3>📦 Installation</h3>
            <div class="code">
                &lt;script src="http-mock-manager.js"&gt;&lt;/script&gt;<br>
                &lt;http-mock-manager&gt;&lt;/http-mock-manager&gt;
            </div>
        </div>
        
        <div class="features">
            <div class="feature">
                <h4>🎯 Standalone</h4>
                <p>No external Angular dependencies required</p>
            </div>
            <div class="feature">
                <h4>⚡ Zoneless</h4>
                <p>Optimized performance with Angular Signals</p>
            </div>
            <div class="feature">
                <h4>🔒 Shadow DOM</h4>
                <p>Encapsulated styles and behavior</p>
            </div>
            <div class="feature">
                <h4>📊 Full Featured</h4>
                <p>Complete HTTP mock management interface</p>
            </div>
        </div>
        
        <div class="demo-area">
            <h3>🚀 Live Demo</h3>
            <p>The component will appear below:</p>
            <http-mock-manager data-floating="true"></http-mock-manager>
        </div>
    </div>

    <!-- Load the self-contained custom element -->
    <script src="http-mock-manager.js"></script>
    
    <script>
        // Demo initialization
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🎯 Demo page loaded');
            console.log('📦 Custom element should be available as <http-mock-manager>');
            
            // Add demo data after a short delay
            setTimeout(() => {
                const element = document.querySelector('http-mock-manager');
                if (element) {
                    console.log('✅ Custom element found and ready');
                }
            }, 1000);
        });
    </script>
</body>
</html>`;

  const demoFile = path.join(outputPath, 'demo.html');
  await fs.writeFile(demoFile, demoContent);
  console.log(`📄 Demo HTML created: ${demoFile}`);
}

async function generateUsageGuide(outputPath) {
  const usageContent = `# HTTP Mock Manager - Usage Guide

## 🎯 Overview

This is a self-contained Angular 20 custom element that provides a complete HTTP mock management interface. No external dependencies required!

## 📦 Installation & Usage

### Direct Script Include
\`\`\`html
<script src="http-mock-manager.js"></script>
<http-mock-manager></http-mock-manager>
\`\`\`

## 🚀 Features

- ✅ **Self-contained**: All Angular dependencies included
- ⚡ **Zoneless**: Optimized performance with Angular Signals  
- 🔒 **Shadow DOM**: Completely encapsulated styles
- 📊 **Full-featured**: Complete HTTP mock management
- 🎯 **Standalone**: No external Angular installation needed
- 🌐 **Universal**: Works in any HTML page or framework

## 🔧 Integration Examples

### React
\`\`\`jsx
function App() {
  return (
    <div>
      <h1>My React App</h1>
      <http-mock-manager></http-mock-manager>
    </div>
  );
}
\`\`\`

### Vue
\`\`\`vue
<template>
  <div>
    <h1>My Vue App</h1>
    <http-mock-manager></http-mock-manager>
  </div>
</template>
\`\`\`

### Plain HTML
\`\`\`html
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
\`\`\`

## 📊 Bundle Information

- **Size**: ~310KB minified (all dependencies included)
- **Angular**: 20.3.12 (embedded)  
- **Performance**: Zoneless change detection
- **Compatibility**: Modern browsers with Custom Elements support

## 🐛 Troubleshooting

### Custom Elements Not Supported
Add this polyfill for older browsers:
\`\`\`html
<script src="https://unpkg.com/@webcomponents/custom-elements@1.4.3/custom-elements.min.js"></script>
\`\`\`
`;

  const usageFile = path.join(outputPath, 'USAGE.md');
  await fs.writeFile(usageFile, usageContent);
  console.log(`📚 Usage guide created: ${usageFile}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
  concatElements().catch(console.error);
}

module.exports = { concatElements };