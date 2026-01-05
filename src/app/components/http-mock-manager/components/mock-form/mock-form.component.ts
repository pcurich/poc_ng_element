import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

interface HttpMockFormData {
  nameMock: string;
  serviceCode: string;
  url: string;
  httpMethod: string;
  httpCodeResponseValue: number;
  delayMs: number;
  responseBody: string;
  headers?: Record<string, string>;
}

@Component({
  selector: 'app-mock-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './mock-form.component.html',
  styleUrl: './mock-form.component.scss'
})
export class MockFormComponent {
  // Inputs
  httpMethods = input<string[]>(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
  httpCodeResponse = input<number[]>([200, 201, 204, 400, 401, 403, 404, 500]);
  initialData = input<HttpMockFormData | null>(null);

  // Outputs
  saveMock = output<HttpMockFormData>();
  createNew = output<void>();

  // Form
  mockForm = new FormGroup({
    nameMock: new FormControl('', [Validators.required, Validators.minLength(3)]),
    serviceCode: new FormControl('', [Validators.required]),
    url: new FormControl('', [Validators.required, Validators.pattern(/^\/.*/)]),
    httpMethod: new FormControl('GET', [Validators.required]),
    httpCodeResponseValue: new FormControl(200, [Validators.required]),
    delayMs: new FormControl(0, [Validators.required, Validators.min(0)]),
    responseBody: new FormControl('{}', [Validators.required])
  });

  // Signals
  isEditing = signal(false);

  // Methods (sin implementación)
  onSubmit(): void {
    // Implementación pendiente
  }

  onReset(): void {
    // Implementación pendiente
  }

  onCreateNew(): void {
    // Implementación pendiente
  }

  isFieldInvalid(fieldName: string): boolean {
    // Implementación pendiente
    return false;
  }

  getFieldError(fieldName: string): string {
    // Implementación pendiente
    return '';
  }
}
