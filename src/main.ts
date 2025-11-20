import { bootstrapApplication } from '@angular/platform-browser';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';


// Bootstrap zoneless de la aplicación principal usando standalone components
bootstrapApplication(AppComponent, {
  providers: [
    // ⚡ Configuración Zoneless de Angular 20
    provideZonelessChangeDetection()
  ]
}).catch(err => console.error('❌ Error bootstrapping application:', err));