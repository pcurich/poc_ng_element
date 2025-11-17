import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { AppComponent } from './app/app.component';
import { CustomElementComponent } from './app/custom-element/custom-element.component';


// Bootstrap zoneless de la aplicación principal usando standalone components
bootstrapApplication(AppComponent, {
  providers: [
    // ⚡ Configuración Zoneless de Angular 20
    provideZonelessChangeDetection()
  ]
}).then((appRef) => {
  // Crear el custom element
  const customElement = createCustomElement(CustomElementComponent, {
    injector: appRef.injector
  });
  
  // Registrar el custom element en el DOM
  customElements.define('my-custom-element', customElement);
  
  console.log('✅ Custom element "my-custom-element" registered successfully!');
  console.log('🚀 Running standalone components with Angular Signals (Zoneless)');
  console.log('📊 Bundle size optimized without Zone.js');
}).catch(err => console.error('❌ Error bootstrapping application:', err));