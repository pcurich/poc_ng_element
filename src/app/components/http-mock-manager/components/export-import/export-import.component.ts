import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-export-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-import.component.html',
  styleUrl: './export-import.component.scss'
})
export class ExportImportComponent {
  // Outputs
  exportMocks = output<'json' | 'csv'>();
  importFile = output<File>();

  // Signals
  selectedFile = signal<File | null>(null);
  importError = signal<string>('');

  // Methods (sin implementación)
  onExportJSON(): void {
    // Implementación pendiente
  }

  onExportCSV(): void {
    // Implementación pendiente
  }

  onFileSelected(event: Event): void {
    // Implementación pendiente
  }

  onImportFile(): void {
    // Implementación pendiente
  }

  selectFile(): void {
    // Implementación pendiente
  }

  clearSelectedFile(): void {
    // Implementación pendiente
  }

  validateFile(file: File): boolean {
    // Implementación pendiente
    return true;
  }

  getFileSize(bytes: number): string {
    // Implementación pendiente
    return '';
  }
}
