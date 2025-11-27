import { BaseEntity, SoftDeletableEntity, AuditableEntity } from './BaseEntity';
import { IEntityMetadata } from './interfaces';

class TestBaseEntity extends BaseEntity<string> {
  public name: string;

  constructor(data?: Partial<TestBaseEntity>) {
    super(data);
    this.name = data?.name || 'test';
  }

  public getMetadata(): IEntityMetadata {
    return {
      tableName: 'test_entities',
      primaryKey: 'id',
      properties: [
        { name: 'id', type: 'string', required: false },
        { name: 'name', type: 'string', required: true }
      ]
    };
  }
}

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

describe('BaseEntity', () => {
  let entity: TestBaseEntity;

  beforeEach(() => {
    entity = new TestBaseEntity();
  });

  it('should initialize with auto-assigned timestamps', () => {
    expect(entity.createdAt).toBeDefined();
    expect(entity.updatedAt).toBeDefined();
    expect(entity.createdAt).toEqual(entity.updatedAt);
  });

  it('should assign data in constructor', () => {
    const data = { id: 'test-id', name: 'test-name' };
    const entityWithData = new TestBaseEntity(data);

    expect(entityWithData.id).toBe('test-id');
    expect(entityWithData.name).toBe('test-name');
  });

  it('should preserve existing timestamps', () => {
    const existingDate = new Date('2023-01-01');
    const data = { createdAt: existingDate, updatedAt: existingDate };
    const entityWithData = new TestBaseEntity(data);

    expect(entityWithData.createdAt).toBe(existingDate);
    expect(entityWithData.updatedAt).toBe(existingDate);
  });

  it('should update updatedAt on touch', () => {
    const originalUpdatedAt = entity.updatedAt;
    entity.touch();

    expect(entity.updatedAt).not.toBe(originalUpdatedAt);
    expect(entity.updatedAt).toBeDefined();
    expect(entity.updatedAt instanceof Date).toBe(true);
  });

  it('should convert to plain object', () => {
    entity.id = 'test-id';
    entity.name = 'test-name';
    const plain = entity.toPlainObject();

    expect(plain['id']).toBe('test-id');
    expect(plain['name']).toBe('test-name');
    expect(plain['createdAt']).toBeDefined();
    expect(plain['updatedAt']).toBeDefined();
  });

  it('should create from plain object', () => {
    const plainData = {
      id: 'test-id',
      name: 'test-name',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-02T00:00:00.000Z'
    };
    const entityFromPlain = TestBaseEntity.createFromPlainObject(TestBaseEntity, plainData);

    expect(entityFromPlain.id).toBe('test-id');
    expect(entityFromPlain.name).toBe('test-name');
    expect(entityFromPlain.createdAt).toBeInstanceOf(Date);
    expect(entityFromPlain.updatedAt).toBeInstanceOf(Date);
  });

  it('should return metadata', () => {
    const metadata = entity.getMetadata();

    expect(metadata.tableName).toBe('test_entities');
    expect(metadata.primaryKey).toBe('id');
    expect(metadata.properties).toBeDefined();
  });

  it('should validate successfully with valid data', () => {
    const result = entity.validate();

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('should validate with error when createdAt is after updatedAt', () => {
    entity.createdAt = new Date('2023-01-02');
    entity.updatedAt = new Date('2023-01-01');
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('createdAt cannot be greater than updatedAt');
  });

  it('should clone entity', () => {
    entity.id = 'test-id';
    entity.name = 'test-name';
    const cloned = entity.clone();

    expect(cloned.id).toBe('test-id');
    expect(cloned.name).toBe('test-name');
    expect(cloned).not.toBe(entity);
  });

  it('should return true when entities are equal by id', () => {
    const entity1 = new TestBaseEntity({ id: 'test-id' });
    const entity2 = new TestBaseEntity({ id: 'test-id' });

    expect(entity1.equals(entity2)).toBe(true);
  });

  it('should return false when entities have different ids', () => {
    const entity1 = new TestBaseEntity({ id: 'test-id-1' });
    const entity2 = new TestBaseEntity({ id: 'test-id-2' });

    expect(entity1.equals(entity2)).toBe(false);
  });

  it('should return false when entity has no id', () => {
    const entity1 = new TestBaseEntity();
    const entity2 = new TestBaseEntity({ id: 'test-id' });

    expect(entity1.equals(entity2)).toBe(false);
  });
});

describe('SoftDeletableEntity', () => {
  let entity: TestSoftDeletableEntity;

  beforeEach(() => {
    entity = new TestSoftDeletableEntity();
  });

  it('should initialize with isDeleted false', () => {
    expect(entity.isDeleted).toBe(false);
  });

  it('should soft delete entity', () => {
    entity.softDelete();

    expect(entity.isDeleted).toBe(true);
    expect(entity.deletedAt).toBeDefined();
    expect(entity.updatedAt).toBeDefined();
  });

  it('should restore soft deleted entity', () => {
    entity.softDelete();
    entity.restore();

    expect(entity.isDeleted).toBe(false);
    expect(entity.deletedAt).toBeUndefined();
  });

  it('should return true when entity is deleted', () => {
    entity.softDelete();

    expect(entity.isEntityDeleted()).toBe(true);
  });

  it('should return false when entity is not deleted', () => {
    expect(entity.isEntityDeleted()).toBe(false);
  });

  it('should validate with error when isDeleted true but no deletedAt', () => {
    entity.isDeleted = true;
    entity.deletedAt = undefined;
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('deletedAt is required when isDeleted is true');
  });

  it('should validate with error when isDeleted false but deletedAt exists', () => {
    entity.isDeleted = false;
    entity.deletedAt = new Date();
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('deletedAt should not be set when isDeleted is false');
  });

  it('should include isDeleted in plain object', () => {
    entity.isDeleted = true;
    const plain = entity.toPlainObject();

    expect(plain['isDeleted']).toBe(true);
  });

  it('should default isDeleted to false in plain object when undefined', () => {
    entity.isDeleted = undefined;
    const plain = entity.toPlainObject();

    expect(plain['isDeleted']).toBe(false);
  });
});

describe('AuditableEntity', () => {
  let entity: TestAuditableEntity;

  beforeEach(() => {
    entity = new TestAuditableEntity();
  });

  it('should initialize with version 1', () => {
    expect(entity.version).toBe(1);
  });

  it('should update with audit information', () => {
    const originalVersion = entity.version;
    const originalUpdatedAt = entity.updatedAt;
    entity.updateWithAudit('user-123');

    expect(entity.updatedBy).toBe('user-123');
    expect(entity.version).toBe((originalVersion || 1) + 1);
    expect(entity.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('should soft delete with audit information', () => {
    entity.softDeleteWithAudit('user-123');

    expect(entity.isDeleted).toBe(true);
    expect(entity.deletedBy).toBe('user-123');
    expect(entity.deletedAt).toBeDefined();
  });

  it('should validate with error when version is less than 1', () => {
    entity.version = 0;
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('version must be >= 1');
  });

  it('should validate with error when soft deleted without deletedBy', () => {
    entity.isDeleted = true;
    entity.deletedBy = undefined;
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('deletedBy is required when entity is soft deleted');
  });

  it('should validate successfully with valid audit data', () => {
    entity.version = 2;
    entity.createdBy = 'creator';
    entity.updatedBy = 'updater';
    const result = entity.validate();

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
