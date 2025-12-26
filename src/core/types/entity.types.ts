/**
 * 🏷️ Entity Types - Metadata and Entity Interfaces
 * 
 * Tipos y interfaces para definición de entidades, metadatos y validación.
 * 
 * Principios SOLID aplicados:
 * - Interface Segregation: Interfaces específicas para cada concepto
 * - Dependency Inversion: Contratos bien definidos para implementaciones
 */

/**
 * Metadatos de una propiedad de entidad
 */
export interface IPropertyMetadata {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
  required: boolean;
  primaryKey?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  enumValues?: readonly string[];
  pattern?: RegExp;
  description?: string;
}

/**
 * Configuración de un índice
 */
export interface IIndexMetadata {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
  multiEntry?: boolean;
}

/**
 * Metadatos completos de una entidad
 */
export interface IEntityMetadata {
  tableName: string;
  primaryKey: string;
  properties: IPropertyMetadata[];
  indexes?: IIndexMetadata[];
  version?: number;
}

/**
 * Resultado de validación
 */
export interface IValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validador de entidad
 */
export interface IEntityValidator<T = any> {
  validate(entity: T): IValidationResult;
}

/**
 * Decorador para propiedades de entidad
 */
export interface IPropertyDecorator {
  (target: any, propertyKey: string): void;
}

/**
 * Factory para crear validadores
 */
export interface IValidatorFactory {
  createValidator<T>(metadata: IEntityMetadata): IEntityValidator<T>;
}

/**
 * Interface base para todas las entidades
 * Principio S: Una sola responsabilidad - Define contrato básico de entidad
 */
export interface IEntity<TKey = string | number> {
  id?: TKey;
  createdAt?: Date;
  updatedAt?: Date;
  
  getMetadata(): IEntityMetadata;
  validate(): IValidationResult;
  toPlainObject(): Record<string, any>;
  touch(): void;
}

/**
 * Interface para entidades con soft delete
 */
export interface ISoftDeletableEntity<TKey = string | number> extends IEntity<TKey> {
  deletedAt?: Date;
  isDeleted?: boolean;
}

/**
 * Interface para entidades con versionado
 */
export interface IVersionedEntity<TKey = string | number> extends IEntity<TKey> {
  version?: number;
}

/**
 * Interface completa para entidades auditables
 */
export interface IAuditableEntity<TKey = string | number> 
  extends ISoftDeletableEntity<TKey>, IVersionedEntity<TKey> {
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string;
}