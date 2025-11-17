/**
 * 🏷️ Interfaces para metadata de entidades
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
 * Validador de entidad
 */
export interface IEntityValidator<T = any> {
  validate(entity: T): IValidationResult;
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