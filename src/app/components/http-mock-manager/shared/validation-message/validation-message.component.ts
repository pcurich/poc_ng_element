import { Component, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ValidationMessage } from '../../../../../core';

/**
 * Validation Message Component
 * Componente genérico para mostrar mensajes de validación flotantes con auto-dismiss
 */
@Component({
  selector: 'app-validation-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './validation-message.component.html',
  styleUrl: './validation-message.component.scss'
})
export class ValidationMessageComponent {
  /**
   * Mensaje de validación a mostrar
   */
  @Input() message = signal<ValidationMessage | null>(null);

  /**
   * Posición del mensaje (global o local)
   */
  @Input() position: 'global' | 'local' = 'local';

  constructor() {
    // Effect para auto-dismiss del mensaje
    effect(() => {
      const currentMessage = this.message();
      if (currentMessage) {
        const duration = currentMessage.durationMs || 3000;
        setTimeout(() => {
          this.message.set(null);
        }, duration);
      }
    });
  }
}
