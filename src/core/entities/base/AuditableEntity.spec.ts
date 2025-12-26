import { IEntityMetadata } from "../../types/entity.types";
import { AuditableEntity } from "./AuditableEntity";

class TestAuditableEntity extends AuditableEntity<string> {
  public name: string;

  constructor(data?: Partial<TestAuditableEntity>) {
    super(data);
    this.name = data?.name || 'test';
  }

  public getMetadata(): IEntityMetadata {
    return {
      tableName: 'test_auditable_entities',
      primaryKey: 'id',
      properties: [
        { name: 'id', type: 'string', required: false },
        { name: 'name', type: 'string', required: true },
        { name: 'version', type: 'number', required: false },
        { name: 'createdBy', type: 'string', required: false },
        { name: 'updatedBy', type: 'string', required: false },
        { name: 'deletedBy', type: 'string', required: false }
      ]
    };
  }
}

describe('AuditableEntity', () => {
  let entity: TestAuditableEntity;

  beforeEach(() => {
    entity = new TestAuditableEntity();
  });

  it('#Should initialize with version 1', () => {
    expect(entity.version).toBe(1);
  });

  it('#Should update with audit information', () => {
    const originalVersion = entity.version;
    const originalUpdatedAt = entity.updatedAt;
    entity.updateWithAudit('user-123');

    expect(entity.updatedBy).toBe('user-123');
    expect(entity.version).toBe((originalVersion || 1) + 1);
    expect(entity.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('#Should soft delete with audit information', () => {
    entity.softDeleteWithAudit('user-123');

    expect(entity.isDeleted).toBe(true);
    expect(entity.deletedBy).toBe('user-123');
    expect(entity.deletedAt).toBeDefined();
  });

  it('#Should validate with error when version is less than 1', () => {
    entity.version = 0;
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('version must be >= 1');
  });

  it('#Should validate with error when soft deleted without deletedBy', () => {
    entity.isDeleted = true;
    entity.deletedBy = undefined;
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('deletedBy is required when entity is soft deleted');
  });

  it('#Should validate successfully with valid audit data', () => {
    entity.version = 2;
    entity.createdBy = 'creator';
    entity.updatedBy = 'updater';
    const result = entity.validate();

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});