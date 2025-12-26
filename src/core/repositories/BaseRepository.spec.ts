/**
 * 🧪 BaseRepository Test Suite
 * 
 * Casos de prueba para verificar el funcionamiento completo del patrón Repository
 */

import { BaseRepository } from './BaseRepository';
import { BaseEntity } from '../entities/base/BaseEntity';
import { DbContext } from '../context/DbContext';
import { IDbContext } from '../context/IDbContext';
import { IDbConfig } from '../types/database.types';
import { delay } from '../utils/async.utils';

// ========== TEST ENTITY ==========

class TestUser extends BaseEntity<string> {
  name: string = '';
  email: string = '';
  age: number = 0;
  isActive: boolean = true;

  constructor(data?: Partial<TestUser>) {
    super();
    if (data) {
      Object.assign(this, data);
    }
  }

  override validate() {
    const errors: string[] = [];
    
    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }
    
    if (!this.email || !this.email.includes('@')) {
      errors.push('Valid email is required');
    }
    
    if (this.age < 0 || this.age > 150) {
      errors.push('Age must be between 0 and 150');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  getMetadata() {
    return {
      tableName: 'users',
      primaryKey: 'id',
      properties: [
        { name: 'id', type: 'string' as const, required: false, primaryKey: true },
        { name: 'name', type: 'string' as const, required: true },
        { name: 'email', type: 'string' as const, required: true },
        { name: 'age', type: 'number' as const, required: true },
        { name: 'isActive', type: 'boolean' as const, required: true }
      ]
    };
  }

  override toPlainObject(): any {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      age: this.age,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

// ========== TEST SUITE ==========

describe('BaseRepository', () => {
  let repository: BaseRepository<TestUser, string>;
  let dbContext: IDbContext;
  const testDbName = 'TestRepository_' + Date.now();
  const tableName = 'users';

  // ========== SETUP & TEARDOWN ==========

  beforeAll(async () => {
    // Configuración de base de datos de prueba
    const config: IDbConfig = {
      name: testDbName,
      version: 1,
      objectStores: [
        {
          name: tableName,
          options: { keyPath: 'id' },
          indexes: [
            { name: 'email', keyPath: 'email', options: { unique: true } },
            { name: 'name', keyPath: 'name', options: { unique: false } },
            { name: 'age', keyPath: 'age', options: { unique: false } },
            { name: 'isActive', keyPath: 'isActive', options: { unique: false } }
          ]
        }
      ]
    };

    dbContext = new DbContext(config);
    await dbContext.open();
    
    repository = new BaseRepository<TestUser, string>(
      dbContext,
      TestUser,
      tableName
    );
  });

  afterAll(async () => {
    // Limpiar base de datos de prueba
    await dbContext.close();
    // Eliminar la base de datos
    const deleteRequest = indexedDB.deleteDatabase(testDbName);
    await new Promise<void>((resolve, reject) => {
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  });

  beforeEach(async () => {
    // Limpiar datos antes de cada test
    await repository.clearAll();
  });

  // ========== CREATE OPERATIONS ==========

  describe('CREATE Operations', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        isActive: true
      };

      const user = await repository.create(userData as any);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.age).toBe(30);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should fail validation when creating user without required fields', async () => {
      const invalidData = {
        name: '',
        email: 'invalid-email',
        age: 30
      };

      await expectAsync(repository.create(invalidData as any))
        .toBeRejectedWithError(/Validation failed/);
    });

    it('should create multiple users', async () => {
      const usersData = [
        { name: 'Alice', email: 'alice@example.com', age: 25, isActive: true },
        { name: 'Bob', email: 'bob@example.com', age: 35, isActive: true },
        { name: 'Charlie', email: 'charlie@example.com', age: 28, isActive: false }
      ];

      const users = await repository.createMany(usersData as any);

      expect(users.length).toBe(3);
      expect(users[0].name).toBe('Alice');
      expect(users[1].name).toBe('Bob');
      expect(users[2].name).toBe('Charlie');
    });
  });

  // ========== READ OPERATIONS ==========

  describe('READ Operations', () => {
    beforeEach(async () => {
      // Crear datos de prueba
      await repository.createMany([
        { name: 'Alice', email: 'alice@example.com', age: 25, isActive: true },
        { name: 'Bob', email: 'bob@example.com', age: 35, isActive: true },
        { name: 'Charlie', email: 'charlie@example.com', age: 28, isActive: false },
        { name: 'David', email: 'david@example.com', age: 42, isActive: true },
        { name: 'Eve', email: 'eve@example.com', age: 31, isActive: false }
      ] as any);
    });

    it('should find user by ID', async () => {
      const users = await repository.findAll();
      const firstUserId = users[0].id!;

      const found = await repository.findById(firstUserId);

      expect(found).toBeDefined();
      expect(found?.id).toBe(firstUserId);
    });

    it('should return null when user not found', async () => {
      const found = await repository.findById('non-existent-id');

      expect(found).toBeNull();
    });

    it('should find all users', async () => {
      const users = await repository.findAll();

      expect(users.length).toBe(5);
    });

    it('should find one user with filter', async () => {
      const user = await repository.findOne({
        filter: { name: 'Alice' } as any
      });

      expect(user).toBeDefined();
      expect(user?.name).toBe('Alice');
    });

    it('should find many users with filter function', async () => {
      const activeUsers = await repository.findMany({
        filter: (user: TestUser) => user.isActive === true
      });

      expect(activeUsers.length).toBe(3);
      expect(activeUsers.every(u => u.isActive)).toBe(true);
    });

    it('should find users with sorting', async () => {
      const users = await repository.findMany({
        sortBy: 'age' as keyof TestUser,
        sortDirection: 'asc'
      });

      expect(users[0].age).toBe(25);
      expect(users[users.length - 1].age).toBe(42);
    });

    it('should find users with pagination', async () => {
      const users = await repository.findMany({
        offset: 1,
        limit: 2
      });

      expect(users.length).toBe(2);
    });

    it('should find paginated results', async () => {
      const page1 = await repository.findPaginated(1, 2);

      expect(page1.items.length).toBe(2);
      expect(page1.page).toBe(1);
      expect(page1.pageSize).toBe(2);
      expect(page1.total).toBe(5);
      expect(page1.totalPages).toBe(3);
      expect(page1.hasNext).toBe(true);
      expect(page1.hasPrevious).toBe(false);

      const page2 = await repository.findPaginated(2, 2);
      expect(page2.hasNext).toBe(true);
      expect(page2.hasPrevious).toBe(true);
    });
  });

  // ========== INDEX-BASED SEARCH ==========

  describe('INDEX-based Search', () => {
    beforeEach(async () => {
      await repository.createMany([
        { name: 'Alice', email: 'alice@example.com', age: 25, isActive: true },
        { name: 'Bob', email: 'bob@example.com', age: 30, isActive: true },
        { name: 'Alice', email: 'alice2@example.com', age: 35, isActive: false }
      ] as any);
    });

    it('should find users by index (name)', async () => {
      const users = await repository.findByIndex('name', 'Alice');

      expect(users.length).toBe(2);
      expect(users.every(u => u.name === 'Alice')).toBe(true);
    });

    it('should find one user by unique index (email)', async () => {
      const user = await repository.findOneByIndex('email', 'bob@example.com');

      expect(user).toBeDefined();
      expect(user?.name).toBe('Bob');
      expect(user?.email).toBe('bob@example.com');
    });

    it('should find users by index range (age)', async () => {
      const users = await repository.findByIndexRange('age', 25, 32);

      expect(users.length).toBe(2);
      expect(users.some(u => u.age === 25)).toBe(true);
      expect(users.some(u => u.age === 30)).toBe(true);
    });

    it('should throw error when index does not exist', async () => {
      await expectAsync(repository.findByIndex('nonExistentIndex', 'value'))
        .toBeRejectedWithError(/Index nonExistentIndex not found/);
    });
  });

  // ========== COUNT OPERATIONS ==========

  describe('COUNT Operations', () => {
    beforeEach(async () => {
      await repository.createMany([
        { name: 'Alice', email: 'alice@example.com', age: 25, isActive: true },
        { name: 'Bob', email: 'bob@example.com', age: 35, isActive: true },
        { name: 'Charlie', email: 'charlie@example.com', age: 28, isActive: false }
      ] as any);
    });

    it('should count all users', async () => {
      const count = await repository.count();

      expect(count).toBe(3);
    });

    it('should count users with filter', async () => {
      const count = await repository.count({
        filter: (user: TestUser) => user.isActive === true
      });

      expect(count).toBe(2);
    });

    it('should check if user exists', async () => {
      const users = await repository.findAll();
      const existingId = users[0].id!;

      const exists = await repository.exists(existingId);
      const notExists = await repository.exists('non-existent-id');

      expect(exists).toBe(true);
      expect(notExists).toBe(false);
    });
  });

  // ========== UPDATE OPERATIONS ==========

  describe('UPDATE Operations', () => {
    let userId: string;

    beforeEach(async () => {
      const user = await repository.create({
        name: 'John',
        email: 'john@example.com',
        age: 30,
        isActive: true
      } as any);
      userId = user.id!;
    });

    it('should update user', async () => {
      const updated = await repository.update(userId, {
        name: 'John Updated',
        age: 31
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('John Updated');
      expect(updated?.age).toBe(31);
      expect(updated?.email).toBe('john@example.com'); // Sin cambios
    });

    it('should return null when updating non-existent user', async () => {
      const updated = await repository.update('non-existent-id', { name: 'Test' });

      expect(updated).toBeNull();
    });

    it('should fail validation on invalid update', async () => {
      await expectAsync(repository.update(userId, { email: 'invalid-email' }))
        .toBeRejectedWithError(/Validation failed/);
    });

    it('should update multiple users', async () => {
      await repository.createMany([
        { name: 'Bob', email: 'bob@example.com', age: 25, isActive: false },
        { name: 'Alice', email: 'alice@example.com', age: 28, isActive: false }
      ] as any);

      const count = await repository.updateMany(
        { isActive: true },
        { filter: (u: TestUser) => u.isActive === false }
      );

      expect(count).toBe(2);

      const users = await repository.findAll();
      expect(users.every(u => u.isActive === true)).toBe(true);
    });
  });

  // ========== DELETE OPERATIONS ==========

  describe('DELETE Operations', () => {
    beforeEach(async () => {
      await repository.createMany([
        { name: 'Alice', email: 'alice@example.com', age: 25, isActive: true },
        { name: 'Bob', email: 'bob@example.com', age: 35, isActive: true },
        { name: 'Charlie', email: 'charlie@example.com', age: 28, isActive: false }
      ] as any);
    });

    it('should delete user by ID', async () => {
      const users = await repository.findAll();
      const userToDelete = users[0].id!;

      const deleted = await repository.delete(userToDelete);

      expect(deleted).toBe(true);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(2);
    });

    it('should delete multiple users with filter', async () => {
      const count = await repository.deleteMany({
        filter: (u: TestUser) => u.isActive === false
      });

      expect(count).toBe(1);

      const remaining = await repository.findAll();
      expect(remaining.length).toBe(2);
      expect(remaining.every(u => u.isActive === true)).toBe(true);
    });

    it('should clear all users', async () => {
      await repository.clearAll();

      const users = await repository.findAll();
      expect(users.length).toBe(0);
    });
  });

  // ========== SAVE OPERATIONS ==========

  describe('SAVE Operations', () => {
    it('should save new user (create)', async () => {
      const user = new TestUser({
        name: 'New User',
        email: 'new@example.com',
        age: 25,
        isActive: true
      });

      const saved = await repository.save(user);

      expect(saved.id).toBeDefined();
      expect(saved.name).toBe('New User');

      const found = await repository.findById(saved.id!);
      expect(found).toBeDefined();
    });

    it('should save existing user (update)', async () => {
      const created = await repository.create({
        name: 'Original',
        email: 'original@example.com',
        age: 30,
        isActive: true
      } as any);

      created.name = 'Modified';
      created.age = 31;

      const saved = await repository.save(created);

      expect(saved.id).toBe(created.id);
      expect(saved.name).toBe('Modified');
      expect(saved.age).toBe(31);
    });

    it('should save many users', async () => {
      const users = [
        new TestUser({ name: 'User1', email: 'user1@example.com', age: 20, isActive: true }),
        new TestUser({ name: 'User2', email: 'user2@example.com', age: 25, isActive: true }),
        new TestUser({ name: 'User3', email: 'user3@example.com', age: 30, isActive: true })
      ];

      const saved = await repository.saveMany(users);

      expect(saved.length).toBe(3);
      expect(saved.every(u => u.id !== undefined)).toBe(true);
    });
  });

  // ========== COMPLEX SCENARIOS ==========

  describe('Complex Scenarios', () => {
    it('should handle concurrent operations', async () => {
      const operations = [
        repository.create({ name: 'User1', email: 'user1@example.com', age: 20, isActive: true } as any),
        repository.create({ name: 'User2', email: 'user2@example.com', age: 25, isActive: true } as any),
        repository.create({ name: 'User3', email: 'user3@example.com', age: 30, isActive: true } as any)
      ];

      const results = await Promise.all(operations);

      expect(results.length).toBe(3);
      expect(results.every(u => u.id !== undefined)).toBe(true);
    });

    it('should filter, sort and paginate together', async () => {
      await repository.createMany([
        { name: 'Alice', email: 'alice@example.com', age: 25, isActive: true },
        { name: 'Bob', email: 'bob@example.com', age: 35, isActive: false },
        { name: 'Charlie', email: 'charlie@example.com', age: 28, isActive: true },
        { name: 'David', email: 'david@example.com', age: 42, isActive: true },
        { name: 'Eve', email: 'eve@example.com', age: 31, isActive: false }
      ] as any);

      const result = await repository.findMany({
        filter: (u: TestUser) => u.isActive === true,
        sortBy: 'age' as keyof TestUser,
        sortDirection: 'asc',
        limit: 2
      });

      expect(result.length).toBe(2);
      expect(result[0].age).toBe(25); // Alice
      expect(result[1].age).toBe(28); // Charlie
      expect(result.every(u => u.isActive === true)).toBe(true);
    });

    it('should update entity timestamps correctly', async () => {
      const user = await repository.create({
        name: 'Test User',
        email: 'test@example.com',
        age: 30,
        isActive: true
      } as any);

      const originalUpdatedAt = user.updatedAt;

      // Esperar un momento para asegurar diferencia de timestamp
      await delay(10);

      const updated = await repository.update(user.id!, { age: 31 });

      expect(updated?.updatedAt?.getTime()).toBeGreaterThan(originalUpdatedAt!.getTime());
      expect(updated?.createdAt).toEqual(user.createdAt);
    });
  });
});
