import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IDbConfig } from '../../../../../core';
import { StatusBadgeComponent } from "../../shared/status-badge/status-badge.component";

export interface DatabaseStats {
  totalMocks: number;
  mostUsedServiceCodes: Array<{ serviceCode: string; count: number }>;
  averageDelayMs: number;
}

export interface DatabaseStatus {
  exists: boolean;
  isInitialized?: boolean;
}

/**
 * Database Statistics Component
 * Panel de estadísticas y métricas de base de datos
 */
@Component({
  selector: 'app-database-statistics',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent],
  templateUrl: './database-statistics.component.html',
  styleUrl: './database-statistics.component.scss'
})
export class DatabaseStatisticsComponent {
  /**
   * Configuración de la base de datos
   */
  @Input() databaseConfig = signal<IDbConfig | null>(null);

  /**
   * Estadísticas de la base de datos
   */
  @Input() statistics = signal<DatabaseStats | null>(null);

  /**
   * Estado de la base de datos
   */
  @Input() databaseStatus = signal<DatabaseStatus>({ exists: false });

  /**
   * Computed: Nombres de Object Stores
   */
  objectStoreNames = computed(() => {
    const config = this.databaseConfig();
    if (!config || !config.objectStores || config.objectStores.length === 0) {
      return 'Ninguno';
    }
    return config.objectStores.map(store => store.name).join(', ');
  });

  /**
   * Computed: Total de servicios activos
   */
  totalServices = computed(() => {
    const stats = this.statistics();
    return stats?.mostUsedServiceCodes?.length || 0;
  });
}
