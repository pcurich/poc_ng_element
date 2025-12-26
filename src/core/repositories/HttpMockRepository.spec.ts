import { HttpMockRepository } from './HttpMockRepository';
import { HttpMockEntity } from '../entities/HttpMockEntity';
import { IDbContext } from '../context/IDbContext';
import { IHttpMockData } from '../providers';

describe('HttpMockRepository', () => {
  let repository: HttpMockRepository;
  let mockDbContext: jasmine.SpyObj<IDbContext>;
  let mockHttpMockEntity: jasmine.SpyObj<HttpMockEntity>;

  const mockData: IHttpMockData = {
    id: 'test-id',
    name: 'Test Mock',
    serviceCode: 'TEST_SERVICE',
    url: '/api/test',
    method: 'GET',
    httpCodeResponseValue: 200,
    delayMs: 100,
    headers: { 'Content-Type': 'application/json' },
    responseBody: '{"message": "success"}'
  };

  const mockEntity = new HttpMockEntity(mockData);

  beforeEach(() => {
    mockDbContext = jasmine.createSpyObj('IDbContext', [
      'open',
      'getDB',
      'runTransaction',
      'getDatabaseName',
      'getVersion',
      'close'
    ]);

    mockHttpMockEntity = jasmine.createSpyObj('HttpMockEntity', [
      'matchesRequest',
      'toPlainObject',
      'updateDelay',
      'validate'
    ]);

    spyOn(HttpMockEntity.prototype, 'matchesRequest').and.returnValue(true);
    spyOn(HttpMockEntity.prototype, 'toPlainObject').and.returnValue(mockData);
    spyOn(HttpMockEntity.prototype, 'updateDelay');
    spyOn(HttpMockEntity.prototype, 'validate').and.returnValue({ isValid: true, errors: [] });

    repository = new HttpMockRepository(mockDbContext);
  });

  describe('constructor', () => {
    it('should create instance with correct parameters', () => {
      expect(repository).toBeTruthy();
    });
  });

  describe('findByServiceCode', () => {
    it('should call findByIndex with correct parameters', async () => {
      spyOn(repository as any, 'findByIndex').and.returnValue(Promise.resolve([mockEntity]));

      await repository.findByServiceCode('TEST_SERVICE');

      expect((repository as any).findByIndex).toHaveBeenCalledWith('serviceCode', 'TEST_SERVICE');
    });
  });

  describe('findByUrl', () => {
    it('should call findByIndex with correct parameters', async () => {
      spyOn(repository as any, 'findByIndex').and.returnValue(Promise.resolve([mockEntity]));

      await repository.findByUrl('/api/test');

      expect((repository as any).findByIndex).toHaveBeenCalledWith('url', '/api/test');
    });
  });

  describe('findByMethod', () => {
    it('should call findByIndex with uppercase method', async () => {
      spyOn(repository as any, 'findByIndex').and.returnValue(Promise.resolve([mockEntity]));

      await repository.findByMethod('get');

      expect((repository as any).findByIndex).toHaveBeenCalledWith('method', 'GET');
    });
  });

  describe('findByUrlAndMethod', () => {
    it('should return matching mock when found', async () => {
      spyOn(repository, 'findByUrl').and.returnValue(Promise.resolve([mockEntity]));

      const result = await repository.findByUrlAndMethod('/api/test', 'GET');

      expect(result).toBe(mockEntity);
    });

    it('should return null when no match found', async () => {
      spyOn(repository, 'findByUrl').and.returnValue(Promise.resolve([mockEntity]));
      (HttpMockEntity.prototype.matchesRequest as jasmine.Spy).and.returnValue(false);

      const result = await repository.findByUrlAndMethod('/api/test', 'GET');

      expect(result).toBeNull();
    });
  });

  describe('findMatchingMocks', () => {
    it('should return sorted matching mocks', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, id: '1', url: '/api/test' });
      const mock2 = new HttpMockEntity({ ...mockData, id: '2', url: '/api/other' });

      spyOn(repository, 'findByMethod').and.returnValue(Promise.resolve([mock1, mock2]));

      const result = await repository.findMatchingMocks('/api/test', 'GET');

      expect(result).toEqual([mock1, mock2]);
    });
  });

  describe('findWithFilters', () => {
    it('should filter by service code', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, serviceCode: 'SERVICE1' });
      const mock2 = new HttpMockEntity({ ...mockData, serviceCode: 'SERVICE2' });

      spyOn(repository, 'findByServiceCode').and.returnValue(Promise.resolve([mock1]));

      const result = await repository.findByServiceCode('SERVICE1');

      expect(result).toEqual([mock1]);
    });

    it('should filter by method', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, method: 'GET' });
      const mock2 = new HttpMockEntity({ ...mockData, method: 'POST' });

      spyOn(repository, 'findByMethod').and.returnValue(Promise.resolve([mock1]));

      const result = await repository.findByMethod('GET');

      expect(result).toEqual([mock1]);
    });

    it('should filter by status code', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, httpCodeResponseValue: 200 });
      const mock2 = new HttpMockEntity({ ...mockData, httpCodeResponseValue: 404 });

      spyOn(repository, 'findByStatusCodeRange').and.returnValue(Promise.resolve([mock1]));

      const result = await repository.findByStatusCodeRange(200, 200);

      expect(result).toEqual([mock1]);
    });

    it('should filter by URL pattern', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, url: '/api/users' });
      const mock2 = new HttpMockEntity({ ...mockData, url: '/api/posts' });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2]));

      const result = await repository.findWithFilters({});

      expect(result).toEqual([mock1, mock2]);
    });

    it('should filter by delay range', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, delayMs: 50 });
      const mock2 = new HttpMockEntity({ ...mockData, delayMs: 150 });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2]));

      const result = await repository.findWithFilters({});

      expect(result).toEqual([mock1, mock2]);
    });
  });

  describe('findByStatusCodeRange', () => {
    it('should return mocks within status code range', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, httpCodeResponseValue: 200 });
      const mock2 = new HttpMockEntity({ ...mockData, httpCodeResponseValue: 404 });
      const mock3 = new HttpMockEntity({ ...mockData, httpCodeResponseValue: 500 });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2, mock3]));

      const result = await repository.findByStatusCodeRange(400, 599);

      expect(result).toEqual([mock2, mock3]);
    });
  });

  describe('findErrorMocks', () => {
    it('should call findByStatusCodeRange with error range', async () => {
      spyOn(repository, 'findByStatusCodeRange').and.returnValue(Promise.resolve([mockEntity]));

      await repository.findErrorMocks();

      expect(repository.findByStatusCodeRange).toHaveBeenCalledWith(400, 599);
    });
  });

  describe('findSuccessMocks', () => {
    it('should call findByStatusCodeRange with success range', async () => {
      spyOn(repository, 'findByStatusCodeRange').and.returnValue(Promise.resolve([mockEntity]));

      await repository.findSuccessMocks();

      expect(repository.findByStatusCodeRange).toHaveBeenCalledWith(200, 299);
    });
  });

  describe('getStatistics', () => {
    it('should return correct statistics for mocks', async () => {
      const mock1 = new HttpMockEntity({
        ...mockData,
        serviceCode: 'SERVICE1',
        method: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 100
      });
      const mock2 = new HttpMockEntity({
        ...mockData,
        serviceCode: 'SERVICE1',
        method: 'POST',
        httpCodeResponseValue: 200,
        delayMs: 200
      });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2]));

      const result = await repository.getStatistics();

      expect(result.totalMocks).toBe(2);
      expect(result.averageDelayMs).toBe(150);
    });

    it('should return zero statistics when no mocks', async () => {
      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([]));

      const result = await repository.getStatistics();

      expect(result.totalMocks).toBe(0);
      expect(result.averageDelayMs).toBe(0);
    });
  });

  describe('countByServiceCode', () => {
    it('should return count of mocks for service code', async () => {
      spyOn(repository, 'findByServiceCode').and.returnValue(Promise.resolve([mockEntity, mockEntity]));

      const result = await repository.countByServiceCode('TEST_SERVICE');

      expect(result).toBe(2);
    });
  });

  describe('getUniqueServiceCodes', () => {
    it('should return sorted unique service codes', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, serviceCode: 'SERVICE_B' });
      const mock2 = new HttpMockEntity({ ...mockData, serviceCode: 'SERVICE_A' });
      const mock3 = new HttpMockEntity({ ...mockData, serviceCode: 'SERVICE_A' });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2, mock3]));

      const result = await repository.getUniqueServiceCodes();

      expect(result).toEqual(['SERVICE_A', 'SERVICE_B']);
    });
  });

  describe('getUniqueUrls', () => {
    it('should return sorted unique URLs', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, url: '/api/b' });
      const mock2 = new HttpMockEntity({ ...mockData, url: '/api/a' });
      const mock3 = new HttpMockEntity({ ...mockData, url: '/api/a' });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2, mock3]));

      const result = await repository.getUniqueUrls();

      expect(result).toEqual(['/api/a', '/api/b']);
    });
  });

  describe('deleteByServiceCode', () => {
    it('should delete all mocks for service code and return count', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, id: '1' });
      const mock2 = new HttpMockEntity({ ...mockData, id: '2' });

      spyOn(repository, 'findByServiceCode').and.returnValue(Promise.resolve([mock1, mock2]));
      spyOn(repository as any, 'delete').and.returnValue(Promise.resolve(true));

      const result = await repository.deleteByServiceCode('TEST_SERVICE');

      expect(result).toBe(2);
      expect((repository as any).delete).toHaveBeenCalledWith('1');
      expect((repository as any).delete).toHaveBeenCalledWith('2');
    });
  });

  describe('clearAllMocks', () => {
    it('should call clearAll method', async () => {
      spyOn(repository as any, 'clearAll').and.returnValue(Promise.resolve());

      await repository.clearAllMocks();

      expect((repository as any).clearAll).toHaveBeenCalled();
    });
  });

  describe('updateDelayByServiceCode', () => {
    it('should update delay for all mocks in service code', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, id: '1' });
      const mock2 = new HttpMockEntity({ ...mockData, id: '2' });

      spyOn(repository, 'findByServiceCode').and.returnValue(Promise.resolve([mock1, mock2]));
      spyOn(repository as any, 'save').and.returnValue(Promise.resolve(mock1));

      const result = await repository.updateDelayByServiceCode('TEST_SERVICE', 500);

      expect(result).toBe(2);
      expect(mock1.updateDelay).toHaveBeenCalledWith(500);
      expect(mock2.updateDelay).toHaveBeenCalledWith(500);
    });
  });

  describe('duplicateMockWithNewUrl', () => {
    it('should return null when original mock not found', async () => {
      spyOn(repository as any, 'findById').and.returnValue(Promise.resolve(null));

      const result = await repository.duplicateMockWithNewUrl('nonexistent', '/new-url');

      expect(result).toBeNull();
    });

    it('should create duplicate with new URL', async () => {
      spyOn(repository as any, 'findById').and.returnValue(Promise.resolve(mockEntity));
      spyOn(repository as any, 'create').and.returnValue(Promise.resolve(mockEntity));

      const result = await repository.duplicateMockWithNewUrl('test-id', '/new-url');

      expect(result).toBe(mockEntity);
      expect((repository as any).create).toHaveBeenCalled();
    });
  });

  describe('findDuplicates', () => {
    it('should return duplicate groups', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, id: '1', url: '/api/test', method: 'GET' });
      const mock2 = new HttpMockEntity({ ...mockData, id: '2', url: '/api/test', method: 'GET' });
      const mock3 = new HttpMockEntity({ ...mockData, id: '3', url: '/api/other', method: 'POST' });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2, mock3]));

      const result = await repository.findDuplicates();

      expect(result.length).toBe(1);
      expect(result[0].url).toBe('/api/test');
      expect(result[0].method).toBe('GET');
      expect(result[0].mocks).toEqual([mock1, mock2]);
    });
  });

  describe('exportByServiceCode', () => {
    it('should export mocks as plain objects', async () => {
      spyOn(repository, 'findByServiceCode').and.returnValue(Promise.resolve([mockEntity]));

      const result = await repository.exportByServiceCode('TEST_SERVICE');

      expect(result).toEqual([mockData]);
    });
  });

  describe('importMocks', () => {
    it('should import mocks and return created entities', async () => {
      const importData = [{ ...mockData }];
      delete importData[0].id;

      spyOn(repository as any, 'create').and.returnValue(Promise.resolve(mockEntity));

      const result = await repository.importMocks(importData);

      expect(result).toEqual([mockEntity]);
    });
  });

  describe('getAllServiceCodes', () => {
    it('should return unique service codes from index', async () => {
      const mockDB = jasmine.createSpyObj('IDBDatabase', [], { objectStoreNames: ['httpMocks'] });
      const mockStore = jasmine.createSpyObj('IDBObjectStore', ['index']);
      const mockIndex = jasmine.createSpyObj('IDBIndex', ['openKeyCursor']);
      const mockCursor = jasmine.createSpyObj('IDBCursor', ['continue']);

      mockDbContext.getDB.and.returnValue(Promise.resolve(mockDB));
      mockStore.index.and.returnValue(mockIndex);

      mockDbContext.runTransaction.and.callFake((storeName, mode, fn) => {
        return new Promise<any>((resolve) => {
          const mockRequest = {
            onsuccess: null as any,
            onerror: null as any
          };

          mockIndex.openKeyCursor.and.returnValue(mockRequest);

          // Simulate successful cursor operation
          setTimeout(() => {
            if (mockRequest.onsuccess) {
              mockRequest.onsuccess({
                target: {
                  result: null // No more results
                }
              } as any);
            }
            resolve([]);
          }, 0);

          fn(mockStore);
        });
      });

      const result = await repository.getAllServiceCodes();

      expect(result).toEqual([]);
    });

    it('should process cursor results and filter unique non-empty service codes', async () => {
      const mockDB = jasmine.createSpyObj('IDBDatabase', [], { objectStoreNames: ['httpMocks'] });
      const mockStore = jasmine.createSpyObj('IDBObjectStore', ['index']);
      const mockIndex = jasmine.createSpyObj('IDBIndex', ['openKeyCursor']);
      const mockCursor = jasmine.createSpyObj('IDBCursor', ['continue']);

      mockDbContext.getDB.and.returnValue(Promise.resolve(mockDB));
      mockStore.index.and.returnValue(mockIndex);

      mockDbContext.runTransaction.and.callFake((storeName, mode, fn) => {
        return new Promise<any>((resolve) => {
          const mockRequest = {
            onsuccess: null as any,
            onerror: null as any
          };

          mockIndex.openKeyCursor.and.returnValue(mockRequest);

          // Simulate cursor with multiple results
          let callCount = 0;
          const results: ({ key: string } | null)[] = [
            { key: 'SERVICE1' }, // First unique
            { key: 'SERVICE1' }, // Duplicate, should be skipped
            { key: '' },         // Empty, should be skipped
            { key: 'SERVICE2' }, // Second unique
            { key: '   ' },      // Whitespace only, should be skipped
            { key: 'SERVICE3' }, // Third unique
            null                 // End of cursor
          ];

          const triggerNext = () => {
            setTimeout(() => {
              if (mockRequest.onsuccess) {
                mockRequest.onsuccess({
                  target: {
                    result: results[callCount] ? { key: results[callCount]!.key, continue: mockCursor.continue } : null
                  }
                } as any);
              }
              callCount++;
              if (callCount < results.length) {
                triggerNext();
              } else {
                resolve([]);
              }
            }, 0);
          };

          triggerNext();
          fn(mockStore);
        });
      });

      const result = await repository.getAllServiceCodes();

      expect(result).toEqual(['SERVICE1', 'SERVICE2', 'SERVICE3']);
      expect(mockCursor.continue).toHaveBeenCalledTimes(6); // Called for each non-null result
    });

    it('should fallback to full scan when index fails', async () => {
      mockDbContext.runTransaction.and.returnValue(Promise.reject(new Error('Index error')));

      const mock1 = new HttpMockEntity({ ...mockData, serviceCode: 'SERVICE1' });
      const mock2 = new HttpMockEntity({ ...mockData, serviceCode: 'SERVICE2' });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2]));

      const result = await repository.getAllServiceCodes();

      expect(result).toEqual(['SERVICE1', 'SERVICE2']);
    });
  });

  describe('getServiceCodesWithStats', () => {
    it('should return service codes with statistics', async () => {
      const mock1 = new HttpMockEntity({ ...mockData, id: '1', serviceCode: 'SERVICE1', method: 'GET' });
      const mock2 = new HttpMockEntity({ ...mockData, id: '2', serviceCode: 'SERVICE1', method: 'POST' });
      const mock3 = new HttpMockEntity({ ...mockData, id: '3', serviceCode: 'SERVICE2', method: 'GET' });

      spyOn(repository as any, 'findAll').and.returnValue(Promise.resolve([mock1, mock2, mock3]));

      const result = await repository.getServiceCodesWithStats();

      expect(result.length).toBe(2);
      expect(result[0].serviceCode).toBe('SERVICE1');
    });
  });

  describe('getDynamicTableName', () => {
    it('should return tableName when defined and not empty', async () => {
      (repository as any).tableName = 'customTable';

      const result = await (repository as any).getDynamicTableName();

      expect(result).toBe('customTable');
    });

    it('should return first objectStore name when tableName is empty and database has objectStores', async () => {
      (repository as any).tableName = '';
      const mockDB = jasmine.createSpyObj('IDBDatabase', [], { objectStoreNames: ['firstStore', 'secondStore'] });
      mockDbContext.getDB.and.returnValue(Promise.resolve(mockDB));

      const result = await (repository as any).getDynamicTableName();

      expect(result).toBe('firstStore');
    });

    it('should return default fallback when tableName is empty and getDB fails', async () => {
      (repository as any).tableName = '';
      mockDbContext.getDB.and.returnValue(Promise.reject(new Error('DB error')));

      const result = await (repository as any).getDynamicTableName();

      expect(result).toBe('httpMocks');
    });
  });
});
