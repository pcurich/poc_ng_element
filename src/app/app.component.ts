import { Component } from '@angular/core';
import { HttpMockManagerComponent } from './components/index';

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
    // Handle mock schema saved
  }

  // Método para manejar cambios de contexto
  onContextChanged(context: any): void {
    // Handle context changed
  }
}