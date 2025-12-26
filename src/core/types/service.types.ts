/**
 * 🔧 Service Types - Service layer interfaces and types
 */

import { HttpMockEntity } from '../entities/HttpMockEntity';
import { IHttpMockStatistics } from '../repositories/HttpMockRepository';

// ============================================================================
// SERVICE STATE INTERFACES
// ============================================================================

/**
 * State interface for HttpMockService
 * Represents the complete reactive state of the service
 */
export interface IHttpMockServiceState {
  readonly mocks: HttpMockEntity[];
  readonly statistics: IHttpMockStatistics | null;
  readonly selectedServiceCode: string | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly lastUpdated: Date | null;
}

// ============================================================================
// HTTP INTERCEPTION INTERFACES
// ============================================================================

/**
 * HTTP interception configuration options
 */
export interface IHttpInterceptionConfig {
  readonly enabled: boolean;
  readonly defaultDelay: number;
  readonly fallbackToReal: boolean;
  readonly logRequests: boolean;
  readonly serviceCodes: readonly string[];
}

/**
 * Result structure for HTTP request interception attempts
 */
export interface IHttpInterceptionResult {
  readonly intercepted: boolean;
  readonly mock?: HttpMockEntity;
  readonly response?: IHttpMockResponse;
  readonly reason?: string;
}

/**
 * HTTP mock response data structure
 */
export interface IHttpMockResponse {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly body: string;
  readonly delay: number;
}

// ============================================================================
// OPERATION OPTIONS INTERFACES
// ============================================================================

/**
 * Options for cleanup operations
 */
export interface ICleanupOptions {
  readonly olderThanDays?: number;
  readonly serviceCode?: string;
}