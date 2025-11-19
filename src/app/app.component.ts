import { Component } from '@angular/core';
import { CustomElementComponent, HttpMockManagerComponent } from './components/index';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ HttpMockManagerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'poc-ng-element-zoneless-signals';

  // Método para manejar cuando se guarda un mock schema
  onMockSchemaSaved(mockSchema: any): void {
    console.log('🌐 Mock Schema guardado:', mockSchema);
  }

  // Método para manejar cambios de contexto
  onContextChanged(context: any): void {
    console.log('🌐 Contexto cambiado:', context);
  }
}