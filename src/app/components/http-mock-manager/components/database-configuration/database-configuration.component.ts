import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IDbConfig, IIndexConfig } from '../../../../../core';

/**
 * Database Configuration Component
 * Panel de configuración inicial de base de datos IndexedDB
 */
@Component({
  selector: 'app-database-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './database-configuration.component.html',
  styleUrl: './database-configuration.component.scss'
})
export class DatabaseConfigurationComponent {
  /**
   * Nombre de la base de datos
   */
  @Input() dbName: string = '';

  /**
   * Versión de la base de datos
   */
  @Input() dbVersion: number = 1;

  /**
   * Nombre del Object Store
   */
  @Input() dbObjectStoreName: string = '';

  /**
   * Key Path del Object Store
   */
  @Input() dbKeyPath: string = '';

  /**
   * Lista de índices configurados
   */
  @Input() dbIndexes: IIndexConfig[] = [];

  /**
   * Estado de carga
   */
  @Input() isLoading = signal<boolean>(false);

  /**
   * Último mensaje de operación
   */
  @Input() lastOperation = signal<string | null>(null);

  /**
   * Error del presenter
   */
  @Input() presenterError = signal<string | null>(null);

  /**
   * Evento emitido al crear la base de datos
   */
  @Output() createDatabase = new EventEmitter<IDbConfig>();

  /**
   * Evento emitido al cargar configuración por defecto
   */
  @Output() loadDefaultConfig = new EventEmitter<void>();

  /**
   * Señal para el nuevo nombre de índice
   */
  newIndexName = signal<string>('');

  /**
   * Señal para el nuevo key path de índice
   */
  newIndexKeyPath = signal<string>('');

  /**
   * Agregar un nuevo índice
   */
  addIndex(): void {
    // Lógica para agregar índice
  }

  /**
   * Eliminar un índice
   */
  removeIndex(indexName: string): void {
    // Lógica para eliminar índice
  }

  /**
   * Obtener cantidad de índices
   */
  getIndexCount(): number {
    return this.dbIndexes.length;
  }

  /**
   * Método para crear la base de datos
   */
  onCreate(): void {
    // Emitir configuración de base de datos
  }

  /**
   * Método para cargar configuración por defecto
   */
  onLoadDefault(): void {
    // Emitir evento de carga por defecto
  }
}
