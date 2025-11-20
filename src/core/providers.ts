/**
 * 🎯 Core Providers - Sistema de utilidades IndexedDB para arquitectura standalone
 * 
 * Este archivo proporciona funciones provider modernas para integrar
 * el sistema ORM de IndexedDB en aplicaciones Angular standalone.
 * 
 * Uso en componentes standalone:
 * ```typescript
 * import { provideHttpMockService } from './core/providers';
 * 
 * @Component({
 *   standalone: true,
 *   providers: [provideHttpMockService()]
 * })
 * export class MyComponent {
 *   constructor(private httpMockService: HttpMockService) {}
 * }
 * ```
 * 
 * Uso en app.config.ts:
 * ```typescript
 * import { provideHttpMockORM } from './core/providers';
 * 
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpMockORM()
 *   ]
 * };
 * ```
 */

import { Provider, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { HttpMockService } from './services/HttpMockService';
import { HttpMockRepository } from './repositories/HttpMockRepository';

// Re-exportar todo lo necesario
export { HttpMockService } from './services/HttpMockService';
export { HttpMockRepository } from './repositories/HttpMockRepository';
export { HttpMockEntity, HttpMethod, IHttpMockData } from './models/HttpMockEntity';
export { ORMFactory } from './index';

// Re-exportar interfaces
export type { 
  IHttpMockServiceState,
  IHttpInterceptionConfig,
  IHttpInterceptionResult,
  ICleanupOptions
} from './services/HttpMockService';

export type { 
  IHttpMockStatistics,
  IHttpMockSearchOptions
} from './repositories/HttpMockRepository';

export type {
  IDbContext
} from './context/IDbContext';

export type {
  IDbConfig,
  IObjectStoreConfig,
  IIndexConfig
} from './types/database.types';

export type {
  ServiceCodeWithStats
} from './types/service-code-stats.types';

// ============================================================================
// PROVIDER FUNCTIONS (Standalone Pattern)
// ============================================================================

/**
 * 🔌 Provee el servicio HttpMockService para componentes standalone
 * 
 * Úsalo en el array `providers` de un componente:
 * ```typescript
 * @Component({
 *   standalone: true,
 *   providers: [provideHttpMockService()]
 * })
 * ```
 */
export function provideHttpMockService(): Provider {
  return HttpMockService;
}

/**
 * 🔌 Provee todo el sistema ORM de HTTP Mocks (Service + Repository)
 * 
 * Úsalo en app.config.ts para configuración global:
 * ```typescript
 * export const appConfig: ApplicationConfig = {
 *   providers: [provideHttpMockORM()]
 * };
 * ```
 */
export function provideHttpMockORM(): EnvironmentProviders {
  return makeEnvironmentProviders([
    HttpMockService,
    HttpMockRepository
  ]);
}

/**
 * 🔌 Configuración ORM completa con opciones personalizadas
 * 
 * Permite configurar el sistema ORM con opciones avanzadas:
 * ```typescript
 * provideHttpMockORMConfig({
 *   enableLogging: true,
 *   dbName: 'CustomHttpMocksDB'
 * })
 * ```
 */
export interface HttpMockORMConfig {
  enableLogging?: boolean;
  dbName?: string;
  version?: number;
}

export function provideHttpMockORMConfig(config: HttpMockORMConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    HttpMockService,
    HttpMockRepository,
    { provide: 'HTTP_MOCK_ORM_CONFIG', useValue: config }
  ]);
}
