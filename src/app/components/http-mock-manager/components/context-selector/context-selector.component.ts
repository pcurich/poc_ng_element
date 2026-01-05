import { Component, input, output, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextType, ContextOption } from '../../interfaces';
import { CONTEXT_OPTIONS, DEFAULT_CONTEXT } from '../../constants';

@Component({
  selector: 'app-context-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './context-selector.component.html',
  styleUrl: './context-selector.component.scss'
})
export class ContextSelectorComponent {
  // Inputs
  selectedContext = input<ContextType>(DEFAULT_CONTEXT);
  disabled = input<boolean>(false);

  // Internal signal to track current selection
  private currentContext = signal<ContextType>(DEFAULT_CONTEXT);

  constructor() {
    effect(() => {
      this.currentContext.set(this.selectedContext());
    });
  }

  // Outputs
  contextChange = output<ContextOption>(); // Emitir la opción completa, no solo el tipo

  // Context Options - Usar constantes globales
  readonly contextOptions: readonly ContextOption[] = CONTEXT_OPTIONS;

  onContextChange(context: ContextType): void {
    const selectedOption = this.contextOptions.find(o => o.value === context);

    if (selectedOption) {
      this.currentContext.set(context);
      this.contextChange.emit(selectedOption);
    }
  }

  getSelectedOption(): ContextOption | undefined {
    return this.contextOptions.find(o => o.value === this.currentContext());
  }
}
