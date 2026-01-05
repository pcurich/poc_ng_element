import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

/**
 * Tab Navigation Component
 * Componente genérico para sistemas de navegación por tabs
 */
@Component({
  selector: 'app-tab-navigation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-navigation.component.html',
  styleUrl: './tab-navigation.component.scss'
})
export class TabNavigationComponent {
  /**
   * Lista de tabs a mostrar
   */
  @Input() tabs: Tab[] = [];

  /**
   * ID del tab activo
   */
  @Input() activeTab = signal<string>('');

  /**
   * Tipo de navegación (group o sub)
   */
  @Input() type: 'group' | 'sub' = 'group';

  /**
   * Evento emitido al cambiar de tab
   */
  @Output() tabChange = new EventEmitter<string>();

  /**
   * Método para cambiar de tab
   */
  selectTab(tabId: string): void {
    // Actualizar tab activo y emitir evento
  }
}
