import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-json-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './json-editor.component.html',
  styleUrl: './json-editor.component.scss'
})
export class JsonEditorComponent {
  // Inputs
  value = input<string>('{}');
  label = input<string>('JSON Editor');
  placeholder = input<string>('{ "key": "value" }');
  rows = input<number>(10);
  readonly = input<boolean>(false);

  // Outputs
  valueChange = output<string>();
  save = output<string>();

  // Signals
  validationMessage = signal<string>('');
  isValid = signal<boolean>(true);

  // Methods (sin implementación)
  onValueChange(newValue: string): void {
    // Implementación pendiente
  }

  formatJson(): void {
    // Implementación pendiente
  }

  validateJson(): boolean {
    // Implementación pendiente
    return true;
  }

  onSave(): void {
    // Implementación pendiente
  }

  copyToClipboard(): void {
    // Implementación pendiente
  }

  clearEditor(): void {
    // Implementación pendiente
  }
}
