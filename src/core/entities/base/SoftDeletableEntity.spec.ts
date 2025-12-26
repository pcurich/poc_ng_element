import { IEntityMetadata } from "../../types/entity.types";
import { SoftDeletableEntity } from "./SoftDeletableEntity";

class TestSoftDeletableEntity extends SoftDeletableEntity<string> {
  public name: string;

  constructor(data?: Partial<TestSoftDeletableEntity>) {
    super(data);
    this.name = data?.name || 'test';
  }

  public getMetadata(): IEntityMetadata {
    return {
      tableName: 'test_soft_deletable_entities',
      primaryKey: 'id',
      properties: [
        { name: 'id', type: 'string', required: false },
        { name: 'name', type: 'string', required: true },
        { name: 'isDeleted', type: 'boolean', required: false }
      ]
    };
  }
}

describe('SoftDeletableEntity', () => {
  let entity: TestSoftDeletableEntity;

  beforeEach(() => {
    entity = new TestSoftDeletableEntity();
  });

  it('#Should initialize with isDeleted false', () => {
    expect(entity.isDeleted).toBe(false);
  });

  it('#Should soft delete entity', () => {
    entity.softDelete();

    expect(entity.isDeleted).toBe(true);
    expect(entity.deletedAt).toBeDefined();
    expect(entity.updatedAt).toBeDefined();
  });

  it('#Should restore soft deleted entity', () => {
    entity.softDelete();
    entity.restore();

    expect(entity.isDeleted).toBe(false);
    expect(entity.deletedAt).toBeUndefined();
  });

  it('#Should return true when entity is deleted', () => {
    entity.softDelete();

    expect(entity.isEntityDeleted()).toBe(true);
  });

  it('#Should return false when entity is not deleted', () => {
    expect(entity.isEntityDeleted()).toBe(false);
  });

  it('#Should validate with error when isDeleted true but no deletedAt', () => {
    entity.isDeleted = true;
    entity.deletedAt = undefined;
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('deletedAt is required when isDeleted is true');
  });

  it('#Should validate with error when isDeleted false but deletedAt exists', () => {
    entity.isDeleted = false;
    entity.deletedAt = new Date();
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('deletedAt #Should not be set when isDeleted is false');
  });

  it('#Should include isDeleted in plain object', () => {
    entity.isDeleted = true;
    const plain = entity.toPlainObject();

    expect(plain['isDeleted']).toBe(true);
  });

  it('#Should default isDeleted to false in plain object when undefined', () => {
    entity.isDeleted = undefined;
    const plain = entity.toPlainObject();

    expect(plain['isDeleted']).toBe(false);
  });
});