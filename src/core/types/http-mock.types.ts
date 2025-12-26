/**
 * 🌐 HTTP Mock Types - Domain-specific types for HTTP mocking
 */

/**
 * Métodos HTTP soportados
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Estructura de datos para HttpMockEntity
 */
export interface IHttpMockData {
  id: string;
  name: string;
  serviceCode: string;
  url: string;
  method: HttpMethod | string;
  httpCodeResponseValue: number;
  delayMs: number;
  headers?: Record<string, string>;
  responseBody: string;
}