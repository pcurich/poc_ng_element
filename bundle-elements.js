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


// Ejecutar
bundleElements().catch(console.error);
