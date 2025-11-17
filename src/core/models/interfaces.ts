/**
 * 🏗️ Interfaces base para entidades del ORM
 * Siguiendo principios SOLID para arquitectura limpia
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
 * Metadatos completos de una entidad (versión simplificada para modelos)
 */
export interface IEntityMetadata {
  tableName: string;
  primaryKey: string;
  properties: IPropertyMetadata[];
  indexes?: string[]; // Simplificado para compatibilidad
  version?: number;
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
  validate(): { isValid: boolean; errors: string[] };
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

/**
 * Resultado de validación
 */
export interface IValidationResult {
  isValid: boolean;
  errors: string[];
}