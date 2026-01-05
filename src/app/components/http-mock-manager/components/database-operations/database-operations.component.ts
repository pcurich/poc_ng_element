import { Component, input, output, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type DatabaseStatus = 'not-initialized' | 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-database-operations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './database-operations.component.html',
  styleUrl: './database-operations.component.scss'
})
export class DatabaseOperationsComponent {
  // Inputs
  databaseStatus = input.required<Signal<DatabaseStatus>>();
  isLoading = input.required<Signal<boolean>>();

  // Outputs
  refreshStats = output<void>();
  reinitializeDatabase = output<void>();
  deleteDatabase = output<void>();

  // Methods (sin implementación)
  onRefreshStats(): void {
    // Implementación pendiente
  }

  onReinitializeDatabase(): void {
    // Implementación pendiente
  }

  onDeleteDatabase(): void {
    // Implementación pendiente
  }
}
