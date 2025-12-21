import { createApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { createCustomElement } from '@angular/elements';

/**
 * 🌐 main-elements-clean.ts - Bootstrap LIMPIO para Custom Elements
 * 
 * Este archivo está completamente aislado de AppComponent.
 * Solo importa directamente el componente que se quiere exportar como custom element.
 * 
 * ⚠️ IMPORTANTE: NO importar AppComponent ni ningún wrapper innecesario
 */

// Import directo del componente HTTP Mock Manager
import { HttpMockManagerComponent } from './app/components/http-mock-manager/http-mock-manager.component';

/**
 * Bootstrap headless (sin componente raíz en el DOM)
 * Solo registramos custom elements, no montamos una aplicación Angular tradicional
 */
createApplication({
  providers: [
    // ⚡ Zoneless para máximo rendimiento
    provideZonelessChangeDetection()
  ]
}).then((appRef) => {
  // Verificar entorno de navegador
  if (typeof customElements !== 'undefined' && typeof document !== 'undefined') {
    
    // 🎯 ÚNICO custom element exportado: http-mock-manager
    const httpMockManagerElement = createCustomElement(HttpMockManagerComponent, {
      injector: appRef.injector
    });
    
    // 📋 Registrar SOLAMENTE http-mock-manager
    // NO registramos app-root ni ningún otro componente
    customElements.define('http-mock-manager', httpMockManagerElement);
    
    // 🎨 Estilos globales mínimos
    if (!document.querySelector('#http-mock-manager-global-styles')) {
      const globalStyles = document.createElement('style');
      globalStyles.id = 'http-mock-manager-global-styles';
      globalStyles.textContent = `
        /* Estilos globales para http-mock-manager custom element */
        http-mock-manager {
          display: block;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Para uso en modo flotante */
        http-mock-manager[data-floating] {
          position: fixed !important;
          z-index: 999999 !important;
        }
      `;
      document.head.appendChild(globalStyles);
    }
    
    console.log('✅ http-mock-manager custom element registered successfully');
    console.log('🎯 Usage: <http-mock-manager></http-mock-manager>');
  }
}).catch(err => {
  console.error('❌ Error bootstrapping http-mock-manager custom element:', err);
});
