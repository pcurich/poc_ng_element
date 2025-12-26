import { BaseEntity } from './BaseEntity';
import { IEntityMetadata } from '../../types/entity.types';

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


describe('BaseEntity', () => {
  let entity: TestBaseEntity;

  beforeEach(() => {
    entity = new TestBaseEntity();
  });

  it('#Should initialize with auto-assigned timestamps', () => {
    expect(entity.createdAt).toBeDefined();
    expect(entity.updatedAt).toBeDefined();
    expect(entity.createdAt).toEqual(entity.updatedAt);
  });

  it('#Should assign data in constructor', () => {
    const data = { id: 'test-id', name: 'test-name' };
    const entityWithData = new TestBaseEntity(data);

    expect(entityWithData.id).toBe('test-id');
    expect(entityWithData.name).toBe('test-name');
  });

  it('#Should preserve existing timestamps', () => {
    const existingDate = new Date('2023-01-01');
    const data = { createdAt: existingDate, updatedAt: existingDate };
    const entityWithData = new TestBaseEntity(data);

    expect(entityWithData.createdAt).toBe(existingDate);
    expect(entityWithData.updatedAt).toBe(existingDate);
  });

  it('#Should update updatedAt on touch', () => {
    const originalUpdatedAt = entity.updatedAt;
    entity.touch();

    expect(entity.updatedAt).not.toBe(originalUpdatedAt);
    expect(entity.updatedAt).toBeDefined();
    expect(entity.updatedAt instanceof Date).toBe(true);
  });

  it('#Should convert to plain object', () => {
    entity.id = 'test-id';
    entity.name = 'test-name';
    const plain = entity.toPlainObject();

    expect(plain['id']).toBe('test-id');
    expect(plain['name']).toBe('test-name');
    expect(plain['createdAt']).toBeDefined();
    expect(plain['updatedAt']).toBeDefined();
  });

  it('#Should return metadata', () => {
    const metadata = entity.getMetadata();

    expect(metadata.tableName).toBe('test_entities');
    expect(metadata.primaryKey).toBe('id');
    expect(metadata.properties).toBeDefined();
  });

  it('#Should validate successfully with valid data', () => {
    const result = entity.validate();

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('#Should validate with error when createdAt is after updatedAt', () => {
    entity.createdAt = new Date('2023-01-02');
    entity.updatedAt = new Date('2023-01-01');
    const result = entity.validate();

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('createdAt cannot be greater than updatedAt');
  });

  it('#Should clone entity', () => {
    entity.id = 'test-id';
    entity.name = 'test-name';
    const cloned = entity.clone();

    expect(cloned.id).toBe('test-id');
    expect(cloned.name).toBe('test-name');
    expect(cloned).not.toBe(entity);
  });

  it('#Should return true when entities are equal by id', () => {
    const entity1 = new TestBaseEntity({ id: 'test-id' });
    const entity2 = new TestBaseEntity({ id: 'test-id' });

    expect(entity1.equals(entity2)).toBe(true);
  });

  it('#Should return false when entities have different ids', () => {
    const entity1 = new TestBaseEntity({ id: 'test-id-1' });
    const entity2 = new TestBaseEntity({ id: 'test-id-2' });

    expect(entity1.equals(entity2)).toBe(false);
  });

  it('#Should return false when entity has no id', () => {
    const entity1 = new TestBaseEntity();
    const entity2 = new TestBaseEntity({ id: 'test-id' });

    expect(entity1.equals(entity2)).toBe(false);
  });
});




