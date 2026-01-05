import { Component, input, output, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ServiceCodeStats {
  serviceCode: string;
  count: number;
  lastUpdated?: Date;
}

@Component({
  selector: 'app-service-code-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './service-code-selector.component.html',
  styleUrl: './service-code-selector.component.scss'
})
export class ServiceCodeSelectorComponent {
  // Inputs
  availableServiceCodes = input.required<Signal<ServiceCodeStats[]>>();
  selectedServiceCode = input<string>('');
  autoLoad = input<boolean>(true);

  // Outputs
  serviceCodeChange = output<string>();
  loadMocks = output<string>();

  // Methods (sin implementación)
  onServiceCodeChange(serviceCode: string): void {
    // Implementación pendiente
  }

  onLoadMocks(): void {
    // Implementación pendiente
  }

  getServiceStats(serviceCode: string): ServiceCodeStats | undefined {
    // Implementación pendiente
    return undefined;
  }

  formatLastUpdated(date: Date | undefined): string {
    // Implementación pendiente
    return '';
  }
}
