import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { AppComponent } from './app/app.component';
import { HttpMockManagerComponent } from './app/components/http-mock-manager/http-mock-manager.component';


// Bootstrap zoneless de la aplicación principal usando standalone components
bootstrapApplication(AppComponent, {
  providers: [
    // ⚡ Configuración Zoneless de Angular 20
    provideZonelessChangeDetection()
  ]
}).then((appRef) => {
  // Crear el custom element para HttpMockManagerComponent
  const httpMockManagerElement = createCustomElement(HttpMockManagerComponent, {
    injector: appRef.injector
  });
  
  // Registrar el custom element en el DOM
  customElements.define('http-mock-manager', httpMockManagerElement);
  
  console.log('✅ Custom element "http-mock-manager" registered successfully!');
  console.log('🚀 Running standalone HttpMockManagerComponent with Angular Signals (Zoneless)');
  console.log('📊 Bundle size optimized without Zone.js');
}).catch(err => console.error('❌ Error bootstrapping application:', err));