import { HttpMethod } from '../../../core/models/HttpMockEntity';

/**
 * 🔧 Interfaces para HttpMockManagerComponent
 * 
 * Contiene todas las interfaces relacionadas con la configuración
 * y datos del componente HttpMockManager.
 */

/**
 * Opción de contexto para el selector de contextos
 */
export interface ContextOption {
  id: number;
  value: string;
  useMock: boolean;
}

/**
 * Schema para definición de un mock HTTP
 */
export interface MockSchema {
  nameMock: string;
  url: string;
  httpMethod: HttpMethod;
  httpCodeResponseValue: number;
  serviceCode: string;
  delayMs: number;
  headers?: Record<string, string>;
}

/**
 * Cuerpo de respuesta del mock
 */
export interface MockBody {
  responseBody: string;
}