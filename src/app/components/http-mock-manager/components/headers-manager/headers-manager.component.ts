import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Header {
  key: string;
  value: string;
}

@Component({
  selector: 'app-headers-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './headers-manager.component.html',
  styleUrl: './headers-manager.component.scss'
})
export class HeadersManagerComponent {
  // Inputs
  headers = input<Record<string, string>>({});

  // Outputs
  headersChange = output<Record<string, string>>();
  saveHeaders = output<Record<string, string>>();

  // Signals
  newHeaderKey = signal('');
  newHeaderValue = signal('');
  editingHeaderKey = signal<string | null>(null);

  // Common headers
  commonHeaders = [
    { key: 'Content-Type', value: 'application/json' },
    { key: 'Authorization', value: 'Bearer <token>' },
    { key: 'Accept', value: 'application/json' },
    { key: 'Cache-Control', value: 'no-cache' }
  ];

  // Methods (sin implementación)
  addHeader(): void {
    // Implementación pendiente
  }

  editHeader(key: string): void {
    // Implementación pendiente
  }

  updateHeader(oldKey: string, newKey: string, newValue: string): void {
    // Implementación pendiente
  }

  removeHeader(key: string): void {
    // Implementación pendiente
  }

  addCommonHeader(header: Header): void {
    // Implementación pendiente
  }

  getHeadersArray(): Array<{ key: string; value: string }> {
    // Implementación pendiente
    return [];
  }

  onSave(): void {
    // Implementación pendiente
  }
}
