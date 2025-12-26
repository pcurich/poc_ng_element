/**
 * 🏗️ IndexedDB ORM - Punto de entrada principal
 * 
 * Sistema de gestión de base de datos siguiendo principios SOLID:
 * - Single Responsibility: Cada clase tiene una responsabilidad específica
 * - Open/Closed: Extensible sin modificar código existente
 * - Liskov Substitution: Las clases derivadas pueden sustituir a las base
 * - Interface Segregation: Interfaces específicas para cada funcionalidad
 * - Dependency Inversion: Dependencias de abstracciones, no concreciones
 */

// 🏗️ Core Context & Database
export { IDbContext } from './context/IDbContext';
export { DbContext } from './context/DbContext';

// 📊 Types & Configuration
export {
  IDbConfig,
  IObjectStoreConfig,
  IIndexConfig,
  Migration,
  TransactionState,
  ITransactionStats,
  ITransactionContext,
  IDbOperationResult
} from './types/database.types';
export { ServiceCodeWithStats } from './types/service-code-stats.types';
export { IQueryOptions, IPaginatedResult } from './types/repository.types';


// 🏷️ Interfaces & Metadata
export {
  IEntityMetadata,
  IPropertyMetadata,
  IIndexMetadata,
  IValidationResult,
  IEntityValidator,
  IPropertyDecorator,
  IValidatorFactory,
  IEntity,
  ISoftDeletableEntity,
  IVersionedEntity,
  IAuditableEntity
} from './types/entity.types';

// 🗃️ Base Models
export { BaseEntity } from './entities/base/BaseEntity';
export { SoftDeletableEntity } from './entities/base/SoftDeletableEntity';
export { AuditableEntity } from './entities/base/AuditableEntity';

// 📋 Repository Pattern
export {
  IRepository,
  ISoftDeletableRepository,
  IAuditableRepository,
  IRepositoryFactory,
} from './repositories/IRepository';
export { BaseRepository } from './repositories/BaseRepository';



// 🌐 HTTP Mock Domain (New Implementation)
export { HttpMockEntity } from './entities/HttpMockEntity';
export { HttpMethod, IHttpMockData } from './types/http-mock.types';
export { HttpMockRepository, IHttpMockStatistics } from './repositories/HttpMockRepository';
export { HttpMockService } from './services/HttpMockService';
export { IHttpMockServiceState, IHttpInterceptionConfig, IHttpInterceptionResult, IHttpMockResponse, ICleanupOptions } from './types/service.types';

// 🏭 Factories
export { ORMFactory } from './factories/ORMFactory';

// 📦 Standalone Providers (Modern Angular Pattern)
export {
  provideHttpMockService,
  provideHttpMockORM,
  provideHttpMockORMConfig,
  HttpMockORMConfig
} from './providers';

// 🛠️ Utilities - Hash
export {
  generateHash,
  validateHash,
  extractDataWithoutHash
} from './utils/hash.utils';

// 📚 Constants & Dictionaries
export { ValidationMessages, ValidationMessage, createValidationMessage } from './constants/validation-messages';

// 🛠️ Utilities - File Export
export {
  downloadAsJson,
  createJsonBlob,
  readFileAsText,
  readJsonFile,
  generateFilenameWithTimestamp,
  addTimestampToFilename
} from './utils/file-export.utils';

// 🛠️ Utilities - JSON Validation
export {
  detectExportType,
  hasDigitalSignature,
  validateMocksExport,
  validateDatabaseExport,
  validateDatabaseConfig,
  validateImportedFile,
} from './utils/json-validator.utils';


// 🛠️ Utilities - Async Operations
export {
  promiseFromRequest,
  retry,
  delay
} from './utils/async.utils';

// 🛠️ Utilities - ID Generation
export {
  generateTransactionId,
  generateUUID,
  generateShortId
} from './utils/id.utils';

// 🛠️ Utilities - Date/Time
export {
  getCurrentTimestamp,
  addDays,
  isDateOlderThan
} from './utils/date.utils';

export { ValidationResult } from './types/validation.types';

// 📋 Export Types
export {
  ExportType,
  ExportDataBase,
  ExportMocksData,
  ExportDatabaseData,
  ExportData,
  ManualConfigData,
  CreateExportOptions,
  ImportResult,
  createMocksExport,
  createDatabaseExport,
  isExportMocksData,
  isExportDatabaseData,
  isManualConfigData
} from './types/export.types';

export { DownloadOptions } from './types/file-download.types';



