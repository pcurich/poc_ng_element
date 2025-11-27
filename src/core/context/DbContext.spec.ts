import { DbContext } from './DbContext';
import { IDbConfig, TransactionState } from '../types/database.types';

describe('DbContext', () => {
  let config: IDbConfig;
  let dbContext: DbContext;
  let mockIndexedDB: any;
  let mockDB: any;
  let mockRequest: any;
  let mockTransaction: any;
  let mockStore: any;

  beforeEach(() => {
    config = {
      name: 'TestDB',
      version: 1,
      objectStores: [{
        name: 'testStore',
        options: { keyPath: 'id' },
        indexes: []
      }]
    };

    mockIndexedDB = {
      open: jasmine.createSpy('open')
    };

    mockDB = {
      objectStoreNames: {
        contains: jasmine.createSpy('contains').and.returnValue(true)
      },
      transaction: jasmine.createSpy('transaction'),
      close: jasmine.createSpy('close'),
      createObjectStore: jasmine.createSpy('createObjectStore'),
      onversionchange: jasmine.createSpy('onversionchange'),
      onerror: jasmine.createSpy('onerror')
    };

    mockRequest = {
      result: mockDB,
      error: null,
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      onblocked: null
    };

    mockTransaction = {
      objectStore: jasmine.createSpy('objectStore').and.returnValue(mockStore),
      error: null
    };

    mockStore = {};

    spyOnProperty(window, 'indexedDB', 'get').and.returnValue(mockIndexedDB);
  });

  afterEach(() => {
    // No need to delete since we're using spyOnProperty
  });

  describe('constructor', () => {
    it('should create instance with valid config', () => {
      const instance = new DbContext(config);
      expect(instance).toBeDefined();
    });

    it('should throw error for empty database name', () => {
      const invalidConfig = { ...config, name: '' };
      expect(() => new DbContext(invalidConfig)).toThrowError('Database name is required');
    });

    it('should throw error for version less than 1', () => {
      const invalidConfig = { ...config, version: 0 };
      expect(() => new DbContext(invalidConfig)).toThrowError('Database version must be >= 1');
    });

    it('should throw error for empty object stores', () => {
      const invalidConfig = { ...config, objectStores: [] };
      expect(() => new DbContext(invalidConfig)).toThrowError('At least one object store must be defined');
    });
  });

  describe('open', () => {
    beforeEach(() => {
      mockIndexedDB.open.and.returnValue(mockRequest);
    });

    it('should open database successfully', async () => {
      mockRequest.onsuccess = jasmine.createSpy('onsuccess');
      const instance = new DbContext(config);
      const openPromise = instance.open();
      // Trigger the success event synchronously
      mockRequest.onsuccess();
      await openPromise;
      expect(instance.isOpen()).toBe(true);
    });

    it('should handle database upgrade', async () => {
      mockDB.objectStoreNames.contains.and.returnValue(false); // Store doesn't exist yet
      mockRequest.onupgradeneeded = jasmine.createSpy('onupgradeneeded');
      mockRequest.onsuccess = jasmine.createSpy('onsuccess');
      const instance = new DbContext(config);
      const openPromise = instance.open();
      // Trigger upgrade event
      const event = { target: mockRequest, oldVersion: 0, newVersion: 1 };
      mockRequest.onupgradeneeded(event);
      // Trigger success event
      mockRequest.onsuccess();
      await openPromise;
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('testStore', { keyPath: 'id' });
    });

    it('should reject on database open error', async () => {
      mockRequest.error = new Error('Open failed');
      mockRequest.onerror = jasmine.createSpy('onerror');
      const instance = new DbContext(config);
      const openPromise = instance.open();
      // Trigger error event
      mockRequest.onerror();
      await expectAsync(openPromise).toBeRejectedWith(mockRequest.error);
    });

    it('should handle blocked event', async () => {
      mockRequest.onblocked = jasmine.createSpy('onblocked');
      mockRequest.onsuccess = jasmine.createSpy('onsuccess');
      const instance = new DbContext(config);
      const openPromise = instance.open();
      // Trigger blocked event
      mockRequest.onblocked();
      // Trigger success event
      mockRequest.onsuccess();
      await openPromise;
      expect(instance.isOpen()).toBe(true);
    });
  });

  describe('getDB', () => {
    it('should return database instance when open', async () => {
      mockIndexedDB.open.and.returnValue(mockRequest);
      mockRequest.onsuccess = jasmine.createSpy('onsuccess');
      const instance = new DbContext(config);
      const openPromise = instance.open();
      mockRequest.onsuccess();
      await openPromise;
      const db = await instance.getDB();
      expect(db).toBe(mockDB);
    });

    it('should throw error when database not available', async () => {
      const instance = new DbContext(config);
      mockIndexedDB.open.and.throwError(new Error('Mock error'));
      await expectAsync(instance.getDB()).toBeRejectedWith(jasmine.objectContaining({message: 'Database instance not available'}));
    });
  });

  describe('runTransaction', () => {
    beforeEach(async () => {
      mockIndexedDB.open.and.returnValue(mockRequest);
      mockRequest.onsuccess = jasmine.createSpy('onsuccess');
      mockDB.transaction.and.returnValue(mockTransaction);
      dbContext = new DbContext(config);
      const openPromise = dbContext.open();
      mockRequest.onsuccess();
      await openPromise;
    });

    it('should execute transaction with IDBRequest result', async () => {
      const mockIDBRequest = jasmine.createSpyObj('IDBRequest', [], {
        result: 'testResult'
      });
      mockIDBRequest.onsuccess = jasmine.createSpy('onsuccess');

      const resultPromise = dbContext.runTransaction('testStore', 'readonly', () => mockIDBRequest as any);
      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 0));
      // Trigger request success and transaction complete synchronously
      mockIDBRequest.onsuccess();
      mockTransaction.oncomplete();
      const result = await resultPromise;
      expect(result).toBe('testResult');
    });

    it('should execute transaction with Promise result', async () => {
      const promiseResult = Promise.resolve('promiseResult');

      const resultPromise = dbContext.runTransaction('testStore', 'readonly', () => promiseResult);
      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 0));
      mockTransaction.oncomplete();
      const result = await resultPromise;
      expect(result).toBe('promiseResult');
    });

    it('should execute transaction with void result', async () => {

      const resultPromise = dbContext.runTransaction('testStore', 'readonly', () => {});
      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 0));
      mockTransaction.oncomplete();
      const result = await resultPromise;
      expect(result).toBeUndefined();
    });

    it('should throw error for non-existent store', async () => {
      mockDB.objectStoreNames.contains.and.returnValue(false);
      const error = new Error('Object store "nonExistentStore" does not exist');
      await expectAsync(dbContext.runTransaction('nonExistentStore', 'readonly', () => {})).toBeRejectedWith(error);
    });

    it('should handle transaction abort', async () => {
      const promise = dbContext.runTransaction('testStore', 'readonly', () => {});
      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 0));
      mockTransaction.onabort();
      await expectAsync(promise).toBeRejectedWith(new Error('Transaction aborted'));
    });

    it('should handle transaction error', async () => {
      mockTransaction.error = new Error('Transaction error');
      const promise = dbContext.runTransaction('testStore', 'readonly', () => {});
      // Wait for setup
      await new Promise(resolve => setTimeout(resolve, 0));
      mockTransaction.onerror();
      await expectAsync(promise).toBeRejectedWith(mockTransaction.error);
    });
  });

  describe('getDatabaseName', () => {
    it('should return database name', () => {
      const instance = new DbContext(config);
      expect(instance.getDatabaseName()).toBe('TestDB');
    });
  });

  describe('getVersion', () => {
    it('should return database version', () => {
      const instance = new DbContext(config);
      expect(instance.getVersion()).toBe(1);
    });
  });

  describe('close', () => {
    it('should close database connection', async () => {
      mockIndexedDB.open.and.returnValue(mockRequest);
      mockRequest.onsuccess = jasmine.createSpy('onsuccess');
      const instance = new DbContext(config);
      const openPromise = instance.open();
      mockRequest.onsuccess();
      await openPromise;
      await instance.close();
      expect(instance.isOpen()).toBe(false);
    });
  });

  describe('isOpen', () => {
    it('should return false when not open', () => {
      const instance = new DbContext(config);
      expect(instance.isOpen()).toBe(false);
    });

    it('should return true when open', async () => {
      mockIndexedDB.open.and.returnValue(mockRequest);
      mockRequest.onsuccess = jasmine.createSpy('onsuccess');
      const instance = new DbContext(config);
      const openPromise = instance.open();
      mockRequest.onsuccess();
      await openPromise;
      expect(instance.isOpen()).toBe(true);
    });
  });

  describe('getTransactionStats', () => {
    it('should return transaction statistics', () => {
      const instance = new DbContext(config);
      const stats = instance.getTransactionStats();
      expect(stats).toEqual({
        active: 0,
        states: {
          [TransactionState.PENDING]: 0,
          [TransactionState.ACTIVE]: 0,
          [TransactionState.COMPLETED]: 0,
          [TransactionState.ABORTED]: 0,
          [TransactionState.ERROR]: 0
        }
      });
    });
  });
});
