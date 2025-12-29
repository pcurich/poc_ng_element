const esbuild = require('esbuild');
const fs = require('fs-extra');
const path = require('path');

/**
 * 🎯 Bundle HTTP Mock Manager as a true single-file custom element
 * 
 * Este script usa esbuild para crear un bundle real sin code splitting,
 * resolviendo todos los imports internos en un solo archivo autocontenido.
 */

const args = process.argv.slice(2);
const keepLogs = args.includes('--keep-logs');

async function bundleElements() {
  const distPath = path.join(__dirname, 'dist', 'browser');
  const outputPath = path.join(__dirname, 'dist');
  const tempEntryFile = path.join(__dirname, '.temp-bundle-entry.js');
  const outputFile = path.join(outputPath, 'http-mock-manager.js');

  try {
    console.log('📦 Starting true single-file bundling...');

    // Verificar que existe el directorio dist/browser
    if (!await fs.pathExists(distPath)) {
      console.error('❌ dist/browser not found. Run "npm run build:elements" first.');
      process.exit(1);
    }

    // Leer archivos JS generados por Angular
    const files = await fs.readdir(distPath);
    const jsFiles = files.filter(file => 
      file.endsWith('.js') && 
      !file.includes('.map')
    );

    if (jsFiles.length === 0) {
      console.error('❌ No JS files found. Build the project first.');
      process.exit(1);
    }

    console.log('📄 Found files:', jsFiles);

    // Encontrar el archivo main.js (punto de entrada principal)
    const mainFile = jsFiles.find(f => f.startsWith('main')) || jsFiles[jsFiles.length - 1];
    const mainPath = path.join(distPath, mainFile);

    console.log(`🎯 Using entry point: ${mainFile}`);

    // Crear archivo de entrada temporal que importa todo
    const entryContent = `
// Temporary entry point for bundling
import './${mainFile.replace('.js', '')}';
`;

    await fs.writeFile(tempEntryFile, entryContent);

    // Configurar esbuild para bundle verdadero sin code splitting
    const buildOptions = {
      entryPoints: [mainPath],
      bundle: true,
      minify: !keepLogs,
      sourcemap: false,
      target: 'es2020',
      format: 'iife',
      globalName: '__HttpMockManager',
      splitting: false,
      outfile: outputFile,
      platform: 'browser',
      treeShaking: true,
      legalComments: 'none',
      drop: keepLogs ? [] : ['console', 'debugger'],
      banner: {
        js: `/**
 * 🌐 HTTP Mock Manager - Self-Contained Custom Element
 * 
 * Version: 1.0.0
 * Built with: Angular 20.3.12 + Signals + Zoneless
 * Bundle: All dependencies included (no external imports)
 * 
 * Usage:
 *   <script src="http-mock-manager.js"></script>
 *   <http-mock-manager></http-mock-manager>
 * 
 * No external dependencies required!
 */
`
      },
      footer: {
        js: `
/* End of http-mock-manager.js - Self-contained bundle */`
      }
    };

    console.log('🔨 Running esbuild to create single bundle...');
    
    const result = await esbuild.build(buildOptions);

    // Limpiar archivo temporal
    await fs.remove(tempEntryFile);

    // Verificar que el archivo se generó correctamente
    if (await fs.pathExists(outputFile)) {
      const stats = await fs.stat(outputFile);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      console.log(`✅ Self-contained bundle created successfully!`);
      console.log(`📊 Bundle size: ${sizeKB} KB`);
      console.log(`📁 Output: ${outputFile}`);
      
      // Verificar que no tiene imports externos
      const content = await fs.readFile(outputFile, 'utf8');
      const hasImports = /import\s+.*\s+from\s+['"]/.test(content);
      
      if (hasImports) {
        console.warn('⚠️  WARNING: Bundle still contains import statements!');
      } else {
        console.log('✅ Verified: No external imports found');
      }

      // Generar archivos de documentación
      await generateDemoHTML(outputPath);
      await generateUsageGuide(outputPath);
      
    } else {
      console.error('❌ Bundle file was not created');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error during bundling:', error);
    
    // Limpiar archivo temporal si existe
    try {
      await fs.remove(tempEntryFile);
    } catch {}
    
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
        }
        
        .subtitle {
            font-size: 1.2rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .code {
            background: rgba(0, 0, 0, 0.3);
            padding: 1rem;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            margin: 1rem 0;
        }
        
        .demo-area {
            margin: 3rem 0;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1 class="title">🌐 HTTP Mock Manager</h1>
        <p class="subtitle">Self-Contained Custom Element • No External Dependencies</p>
        
        <div class="code">
            &lt;script src="http-mock-manager.js"&gt;&lt;/script&gt;<br>
            &lt;http-mock-manager&gt;&lt;/http-mock-manager&gt;
        </div>
        
        <div class="demo-area">
            <h3>🚀 Live Demo</h3>
            <http-mock-manager data-floating="true"></http-mock-manager>
        </div>
    </div>

    <script src="http-mock-manager.js"></script>
</body>
</html>`;

  await fs.writeFile(path.join(outputPath, 'demo.html'), demoContent);
  console.log(`📄 Demo HTML created`);
}

async function generateUsageGuide(outputPath) {
  const usageContent = `# HTTP Mock Manager - Usage Guide

## 🎯 Overview

Self-contained Angular 20 custom element with NO external dependencies.

## 📦 Installation

\`\`\`html
<script src="http-mock-manager.js"></script>
<http-mock-manager></http-mock-manager>
\`\`\`

## ✅ Features

- **True single-file bundle**: No external imports
- **Self-contained**: All Angular code included
- **Zoneless**: Optimized with Signals
- **Universal**: Works anywhere

## 🔧 Integration

Works in any HTML page, React, Vue, or other framework.

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <script src="http-mock-manager.js"></script>
</head>
<body>
    <http-mock-manager></http-mock-manager>
</body>
</html>
\`\`\`
`;

  await fs.writeFile(path.join(outputPath, 'USAGE.md'), usageContent);
  console.log(`📚 Usage guide created`);
}

// Ejecutar
bundleElements().catch(console.error);
