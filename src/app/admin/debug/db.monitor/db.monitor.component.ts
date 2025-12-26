import { Component, signal } from '@angular/core';
import { HttpMockService } from 'src/core/services/HttpMockService';

@Component({
  selector: 'app-db-monitor',
  standalone: true,
  imports: [],
  templateUrl: './db.monitor.component.html',
  styleUrl: './db.monitor.component.scss',
})
export class DbMonitorComponent {
  health = signal<any>(null);

  constructor(private mockService: HttpMockService) {
    setInterval(() => this.updateHealth(), 1000);
  }

  async updateHealth() {
    try {
      const dbHealth = await this.mockService.getDatabaseHealth();
      console.log('DB Health:', dbHealth);
      this.health.set(dbHealth);
    } catch (error) {
      console.error('Error updating health:', error);
    }
  }
}
