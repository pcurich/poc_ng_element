import { Component, input, output, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface HttpMockEntity {
  id?: number;
  nameMock: string;
  serviceCode: string;
  url: string;
  httpMethod: string;
  httpCodeResponseValue: number;
  delayMs: number;
  responseBody: string;
  headers?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

@Component({
  selector: 'app-mock-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mock-list.component.html',
  styleUrl: './mock-list.component.scss'
})
export class MockListComponent {
  // Inputs
  mocks = input.required<Signal<HttpMockEntity[]>>();
  isLoading = input.required<Signal<boolean>>();
  selectedMockId = input<number | null>(null);

  // Outputs
  editMock = output<HttpMockEntity>();
  deleteMock = output<number>();
  exportMocks = output<void>();
  selectMock = output<HttpMockEntity>();

    // Helper methods
  getHeadersCount(headers?: Record<string, string>): number {
    return headers ? Object.keys(headers).length : 0;
  }
  
  // Methods (sin implementación)
  onEditMock(mock: HttpMockEntity): void {
    // Implementación pendiente
  }

  onDeleteMock(mockId: number): void {
    // Implementación pendiente
  }

  onExportMocks(): void {
    // Implementación pendiente
  }

  onSelectMock(mock: HttpMockEntity): void {
    // Implementación pendiente
  }

  getMethodClass(method: string): string {
    // Implementación pendiente
    return '';
  }

  getStatusCodeClass(code: number): string {
    // Implementación pendiente
    return '';
  }

  formatDate(date: Date | undefined): string {
    // Implementación pendiente
    return '';
  }
}
