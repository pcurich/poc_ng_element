import { createApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { HttpMockManagerComponent } from './app/components/http-mock-manager/http-mock-manager.component';

/**
 * 🌐 main-elements.ts - Bootstrap específico para Custom Elements
 * 
 * Este archivo bootstrap está optimizado para generar un custom element
 * completamente autocontenido que puede ser usado en cualquier proyecto
 * sin dependencias externas de Angular.
 */

// Crear la aplicación sin bootstrap de componente raíz (headless)
createApplication({
  providers: [
    // ⚡ Configuración Zoneless para máximo rendimiento
    provideZonelessChangeDetection()
  ]
}).then((appRef) => {
  // Verificar si estamos en un entorno de navegador
  if (typeof customElements !== 'undefined' && typeof document !== 'undefined') {
    // 🎯 Crear el custom element HttpMockManagerComponent
    const httpMockManagerElement = createCustomElement(HttpMockManagerComponent, {
      injector: appRef.injector
    });
    
    // 📋 Registrar el custom element en el DOM global
    customElements.define('http-mock-manager', httpMockManagerElement);
    
    // 🎨 Agregar estilos globales si es necesario
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
        
        /* Asegurar z-index apropiado */
        http-mock-manager[data-floating] {
          position: fixed !important;
          z-index: 999999 !important;
        }
      `;
      document.head.appendChild(globalStyles);
    }
  }
}).catch(err => {
  console.error('❌ Error bootstrapping http-mock-manager custom element:', err);
});