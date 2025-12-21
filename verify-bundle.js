const fs = require('fs-extra');
const path = require('path');

/**
 * 🔍 Script de Verificación - Valida que el bundle NO exponga tags no deseados
 * 
 * Verifica que:
 * 1. No se registre 'app-root' como custom element
 * 2. Solo se exponga 'http-mock-manager'
 * 3. No haya referencias activas a componentes internos
 */

async function verifyBundle() {
  const bundlePath = path.join(__dirname, 'dist', 'http-mock-manager.js');
  
  console.log('🔍 Verificando bundle generado...\n');
  
  // Verificar que el archivo existe
  if (!await fs.pathExists(bundlePath)) {
    console.error('❌ Bundle no encontrado:', bundlePath);
    console.error('   Ejecuta primero: npm run export:standalone');
    process.exit(1);
  }
  
  // Leer contenido del bundle
  const content = await fs.readFile(bundlePath, 'utf8');
  
  const issues = [];
  const warnings = [];
  
  // 1. Verificar que NO se registre app-root como custom element
  const appRootRegistration = content.match(/customElements\.define\(\s*['"`]app-root['"`]/g);
  if (appRootRegistration && appRootRegistration.length > 0) {
    issues.push(`❌ Se encontró registro de custom element 'app-root' (${appRootRegistration.length} ocurrencias)`);
  } else {
    console.log('✅ No se registra custom element "app-root"');
  }
  
  // 2. Verificar que SÍ se registre http-mock-manager
  const httpMockRegistration = content.match(/customElements\.define\(\s*['"`]http-mock-manager['"`]/g);
  if (!httpMockRegistration || httpMockRegistration.length === 0) {
    issues.push('❌ NO se encontró registro de custom element "http-mock-manager"');
  } else {
    console.log(`✅ Custom element "http-mock-manager" registrado correctamente (${httpMockRegistration.length} ocurrencias)`);
  }
  
  // 3. Verificar referencias a selectores app-root (advertencias)
  const appRootSelectors = content.match(/selector:\s*['"`]app-root['"`]/g);
  if (appRootSelectors && appRootSelectors.length > 0) {
    warnings.push(`⚠️  Se encontraron ${appRootSelectors.length} referencias a selector "app-root" (metadata Angular)`);
    console.log('   Nota: Esto es normal si están en metadata, pero no deben estar activas');
  }
  
  // 4. Verificar tags HTML <app-root>
  const appRootTags = content.match(/<app-root>/g);
  if (appRootTags && appRootTags.length > 0) {
    issues.push(`❌ Se encontraron ${appRootTags.length} tags <app-root> en el bundle`);
  } else {
    console.log('✅ No se encontraron tags <app-root> en el bundle');
  }
  
  // 5. Verificar que no hay console.log (advertencia)
  const consoleLogs = content.match(/console\.log\(/g);
  if (consoleLogs && consoleLogs.length > 0) {
    warnings.push(`⚠️  Se encontraron ${consoleLogs.length} console.log() en el bundle`);
    console.log(`   Nota: Los console.log deberían eliminarse en producción`);
  } else {
    console.log('✅ No se encontraron console.log() en el bundle');
  }
  
  // 6. Estadísticas del bundle
  const bundleSize = await fs.stat(bundlePath);
  const sizeKB = (bundleSize.size / 1024).toFixed(2);
  console.log(`\n📊 Estadísticas del Bundle:`);
  console.log(`   Tamaño: ${sizeKB} KB`);
  console.log(`   Ubicación: ${bundlePath}`);
  
  // 7. Verificar que existe documentación
  const usageFile = path.join(__dirname, 'LIBRARY_USAGE.md');
  if (await fs.pathExists(usageFile)) {
    console.log(`\n📚 Documentación de uso: LIBRARY_USAGE.md`);
  }
  
  // Resumen
  console.log('\n' + '='.repeat(60));
  
  if (issues.length > 0) {
    console.log('\n🚨 PROBLEMAS ENCONTRADOS:\n');
    issues.forEach(issue => console.log(issue));
    console.log('\n⚠️  El bundle tiene problemas que deben corregirse.');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS:\n');
    warnings.forEach(warning => console.log(warning));
  }
  
  console.log('\n✅ VERIFICACIÓN EXITOSA');
  console.log('\n🎯 El bundle expone correctamente:');
  console.log('   • Custom element: <http-mock-manager>');
  console.log('   • NO expone: app-root ni otros componentes internos');
  console.log('\n💡 Uso recomendado:');
  console.log('   <script src="http-mock-manager.js"></script>');
  console.log('   <http-mock-manager></http-mock-manager>');
  console.log('\n' + '='.repeat(60));
}

// Ejecutar verificación
if (require.main === module) {
  verifyBundle().catch(err => {
    console.error('\n❌ Error durante la verificación:', err);
    process.exit(1);
  });
}

module.exports = { verifyBundle };
