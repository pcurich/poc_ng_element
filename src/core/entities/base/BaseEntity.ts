import { IEntity, IAuditableEntity, IEntityMetadata } from '../../types/entity.types';
export abstract class BaseEntity<TKey = string> implements IEntity<TKey> {
  public id?: TKey;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(data?: Partial<BaseEntity<TKey>>) {
    if (data) {
      Object.assign(this, data);
    }
    
    const now = new Date();
    if (!this.createdAt) this.createdAt = now;
    if (!this.updatedAt) this.updatedAt = now;
  }

  public touch(): void {
    this.updatedAt = new Date();
  }

  public toPlainObject(): Record<string, any> {
    return { ...this };
  }

  public abstract getMetadata(): IEntityMetadata;

  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.createdAt && this.updatedAt && this.createdAt > this.updatedAt) {
      errors.push('createdAt cannot be greater than updatedAt');
    }

    return { isValid: errors.length === 0, errors };

  }

  public clone(): this {
    const Constructor = this.constructor as new (data?: any) => this;
    return new Constructor(this.toPlainObject());
  }

  public equals(other: BaseEntity<TKey>): boolean {
    return this.id !== undefined && this.id === other.id;
  }
}