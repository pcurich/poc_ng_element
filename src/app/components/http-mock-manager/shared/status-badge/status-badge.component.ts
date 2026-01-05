import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Status Badge Component
 * Componente genérico para mostrar badges de estado visuales
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  /**
   * Tipo de estado del badge
   */
  @Input() status: 'ok' | 'warning' | 'error' | 'info' = 'info';
  
  /**
   * Texto a mostrar en el badge
   */
  @Input() text: string = '';
}
