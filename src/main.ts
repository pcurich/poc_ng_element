import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';


// Bootstrap zoneless de la aplicación principal usando standalone components
bootstrapApplication(AppComponent, {
  providers: [
    // ⚡ Configuración Zoneless de Angular 20
    provideZonelessChangeDetection(),
    // 🔀 Router configuration
    provideRouter(routes)
  ]
}).catch(err => console.error('❌ Error bootstrapping application:', err));