import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Confirmation Dialog Component
 * Componente genérico para diálogos de confirmación reutilizables
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss'
})
export class ConfirmationDialogComponent {
  /**
   * Título del diálogo
   */
  @Input() title: string = '';

  /**
   * Mensaje principal del diálogo
   */
  @Input() message: string = '';

  /**
   * Mensaje de advertencia adicional
   */
  @Input() warningMessage?: string;

  /**
   * Texto del botón de confirmación
   */
  @Input() confirmText: string = 'Confirmar';

  /**
   * Texto del botón de cancelación
   */
  @Input() cancelText: string = 'Cancelar';

  /**
   * Tipo de diálogo (afecta estilos)
   */
  @Input() type: 'warning' | 'danger' | 'info' = 'warning';

  /**
   * Visibilidad del diálogo
   */
  @Input() visible: boolean = false;

  /**
   * Evento emitido al confirmar
   */
  @Output() confirm = new EventEmitter<void>();

  /**
   * Evento emitido al cancelar
   */
  @Output() cancel = new EventEmitter<void>();

  /**
   * Método para confirmar acción
   */
  onConfirm(): void {
    // Emitir evento de confirmación
  }

  /**
   * Método para cancelar acción
   */
  onCancel(): void {
    // Emitir evento de cancelación
  }
}
