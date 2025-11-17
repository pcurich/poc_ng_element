import { IEntity, IAuditableEntity, IEntityMetadata, IPropertyMetadata } from './interfaces';

/**
 * 🏗️ Clase base abstracta para todas las entidades
 * 
 * Principios SOLID aplicados:
 * - S: Responsabilidad única - Comportamiento común de entidades
 * - O: Abierto/Cerrado - Extensible para entidades específicas
 * - L: Sustitución de Liskov - Puede ser sustituida por subclases
 */

export abstract class BaseEntity<TKey = string> implements IEntity<TKey> {
  public id?: TKey;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data?: Partial<BaseEntity<TKey>>) {
    if (data) {
      Object.assign(this, data);
    }
    
    // Auto-assign timestamps si no existen
    const now = new Date();
    if (!this.createdAt) this.createdAt = now;
    if (!this.updatedAt) this.updatedAt = now;
  }

  /**
   * Actualiza el timestamp de modificación
   */
  public touch(): void {
    this.updatedAt = new Date();
  }

  /**
   * Convierte la entidad a un objeto plano para IndexedDB
   */
  public toPlainObject(): Record<string, any> {
    return { ...this };
  }

  /**
   * Crea una entidad desde un objeto plano
   */
  public static createFromPlainObject<T extends BaseEntity>(
    entityClass: new (data?: any) => T, 
    data: Record<string, any>
  ): T {
    const entity = new entityClass(data);
    
    // Convertir strings de fecha a objetos Date
    if (data['createdAt'] && typeof data['createdAt'] === 'string') {
      entity.createdAt = new Date(data['createdAt']);
    }
    if (data['updatedAt'] && typeof data['updatedAt'] === 'string') {
      entity.updatedAt = new Date(data['updatedAt']);
    }
    
    return entity;
  }

  /**
   * Obtiene los metadatos de la entidad (debe ser implementado por subclases)
   */
  public abstract getMetadata(): IEntityMetadata;

  /**
   * Valida la entidad (puede ser sobrescrito por subclases)
   */
  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validaciones básicas
    if (this.createdAt && this.updatedAt && this.createdAt > this.updatedAt) {
      errors.push('createdAt cannot be greater than updatedAt');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clona la entidad
   */
  public clone(): this {
    const Constructor = this.constructor as new (data?: any) => this;
    return new Constructor(this.toPlainObject());
  }

  /**
   * Compara si dos entidades son iguales (por ID)
   */
  public equals(other: BaseEntity<TKey>): boolean {
    return this.id !== undefined && this.id === other.id;
  }
}

/**
 * 🗑️ Entidad con soporte para soft delete
 */
export abstract class SoftDeletableEntity<TKey = string> extends BaseEntity<TKey> {
  public deletedAt?: Date;
  public isDeleted?: boolean = false;

  constructor(data?: Partial<SoftDeletableEntity<TKey>>) {
    super(data);
  }

  /**
   * Marca la entidad como eliminada (soft delete)
   */
  public softDelete(): void {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.touch();
  }

  /**
   * Restaura una entidad eliminada
   */
  public restore(): void {
    this.isDeleted = false;
    this.deletedAt = undefined;
    this.touch();
  }

  /**
   * Verifica si la entidad está eliminada
   */
  public isEntityDeleted(): boolean {
    return this.isDeleted === true;
  }

  public override validate(): { isValid: boolean; errors: string[] } {
    const baseValidation = super.validate();
    const errors = [...baseValidation.errors];

    // Validaciones adicionales para soft delete
    if (this.isDeleted && !this.deletedAt) {
      errors.push('deletedAt is required when isDeleted is true');
    }

    if (!this.isDeleted && this.deletedAt) {
      errors.push('deletedAt should not be set when isDeleted is false');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  public override toPlainObject(): Record<string, any> {
    const obj = super.toPlainObject();
    return {
      ...obj,
      isDeleted: this.isDeleted || false
    };
  }
}

/**
 * 📋 Entidad auditable completa
 */
export abstract class AuditableEntity<TKey = string> extends SoftDeletableEntity<TKey> implements IAuditableEntity<TKey> {
  public version?: number = 1;
  public createdBy?: string;
  public updatedBy?: string;
  public deletedBy?: string;

  constructor(data?: Partial<AuditableEntity<TKey>>) {
    super(data);
  }

  /**
   * Actualiza la entidad con información de auditoría
   */
  public updateWithAudit(updatedBy: string): void {
    this.updatedBy = updatedBy;
    this.version = (this.version || 1) + 1;
    this.touch();
  }

  /**
   * Elimina la entidad con información de auditoría
   */
  public softDeleteWithAudit(deletedBy: string): void {
    this.deletedBy = deletedBy;
    this.softDelete();
  }

  public override validate(): { isValid: boolean; errors: string[] } {
    const baseValidation = super.validate();
    const errors = [...baseValidation.errors];

    // Validaciones de auditoría
    if (this.version !== undefined && this.version < 1) {
      errors.push('version must be >= 1');
    }

    if (this.isDeleted && !this.deletedBy) {
      errors.push('deletedBy is required when entity is soft deleted');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}