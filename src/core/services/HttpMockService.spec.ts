import { HttpMockService } from './HttpMockService';
import { HttpMockRepository, IHttpMockStatistics } from '../repositories/HttpMockRepository';
import { HttpMockEntity, IHttpMockData } from '../entities/HttpMockEntity';
import { ServiceCodeWithStats } from '../types/service-code-stats.types';
import { getCurrentTimestamp } from '../utils/date.utils';

class TestHttpMockService extends HttpMockService {
  constructor(repository: HttpMockRepository) {
    super();
    (this as any).httpMockRepository = repository;
  }
}

describe('HttpMockService', () => {
  let service: HttpMockService;
  let mockRepository: HttpMockRepository;

  const createMockStatistics = (totalMocks: number, averageDelayMs: number): IHttpMockStatistics => ({
    totalMocks,
    averageDelayMs,
    mocksByServiceCode: {},
    mocksByMethod: {},
    mocksByStatusCode: {},
    mostUsedServiceCodes: []
  });

  const mockData: IHttpMockData = {
    id: 'test-id',
    name: 'Test Mock',
    url: '/api/test',
    method: 'GET',
    serviceCode: 'TEST',
    httpCodeResponseValue: 200,
    delayMs: 100,
    responseBody: '{"message": "success"}',
    headers: { 'Content-Type': 'application/json' }
  };

  const mockEntity = new HttpMockEntity(mockData);

  beforeEach(() => {
    mockRepository = jasmine.createSpyObj('HttpMockRepository', [
      'findAll',
      'create',
      'update',
      'delete',
      'findByServiceCode',
      'findByUrlAndMethod',
      'findWithFilters',
      'getAllServiceCodes',
      'getServiceCodesWithStats',
      'getStatistics',
      'exportByServiceCode',
      'importMocks',
      'deleteByServiceCode',
      'clearAllMocks'
    ]);

    service = new TestHttpMockService(mockRepository);
  });

  describe('initial state', () => {
    it('should have empty mocks array initially', () => {
      expect(service.mocks()).toEqual([]);
    });

    it('should have null statistics initially', () => {
      expect(service.statistics()).toBeNull();
    });

    it('should have loading false initially', () => {
      expect(service.loading()).toBe(false);
    });

    it('should have null error initially', () => {
      expect(service.error()).toBeNull();
    });

    it('should have null selectedServiceCode initially', () => {
      expect(service.selectedServiceCode()).toBeNull();
    });

    it('should have null lastUpdated initially', () => {
      expect(service.lastUpdated()).toBeNull();
    });
  });

  describe('computed properties - derived statistics', () => {
    beforeEach(() => {
      const mockEntities = [
        new HttpMockEntity({ ...mockData, id: '1', serviceCode: 'A', method: 'GET', delayMs: 100 }),
        new HttpMockEntity({ ...mockData, id: '2', serviceCode: 'A', method: 'POST', delayMs: 200 }),
        new HttpMockEntity({ ...mockData, id: '3', serviceCode: 'B', method: 'GET', delayMs: 300 })
      ];
      service['_state'].set({
        mocks: mockEntities,
        statistics: null,
        selectedServiceCode: null,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
    });

    it('should compute totalMocks correctly', () => {
      expect(service.totalMocks()).toBe(3);
    });

    it('should compute serviceCodes correctly', () => {
      expect(service.serviceCodes()).toEqual(['A', 'B']);
    });

    it('should compute httpMethods correctly', () => {
      expect(service.httpMethods()).toEqual(['GET', 'POST']);
    });

    it('should compute averageDelay correctly', () => {
      expect(service.averageDelay()).toBe(200);
    });

    it('should compute filteredMocks correctly when no filter', () => {
      expect(service.filteredMocks()).toEqual(service.mocks());
    });

    it('should compute errorMocks correctly', () => {
      const errorMock = new HttpMockEntity({ ...mockData, id: '4', httpCodeResponseValue: 500 });
      service['_state'].update(state => ({ ...state, mocks: [...state.mocks, errorMock] }));
      expect(service.errorMocks()).toEqual([errorMock]);
    });

    it('should compute successMocks correctly', () => {
      expect(service.successMocks().length).toBe(3);
    });

    it('should compute interceptionConfig correctly', () => {
      expect(service.interceptionConfig()).toEqual({
        enabled: false,
        defaultDelay: 100,
        fallbackToReal: true,
        logRequests: true,
        serviceCodes: []
      });
    });

    it('should compute isInterceptionEnabled correctly', () => {
      expect(service.isInterceptionEnabled()).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should initialize service successfully', async () => {
      const mockEntities = [mockEntity];
      (mockRepository.findAll as jasmine.Spy).and.returnValue(Promise.resolve(mockEntities));
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(createMockStatistics(1, 100)));

      await service.initialize(mockRepository);

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(mockRepository.getStatistics).toHaveBeenCalled();
      expect(service.mocks()).toEqual(mockEntities);
    });

    it('should handle initialize error', async () => {
      (mockRepository.findAll as jasmine.Spy).and.returnValue(Promise.reject(new Error('Init error')));
      await expectAsync(service.initialize(mockRepository)).toBeRejected();
      expect(service.error()).toContain('Init error');
    });
  });

  describe('reset', () => {
    it('should reset service state', () => {
      service['_state'].set({
        mocks: [mockEntity],
        statistics: createMockStatistics(1, 100),
        selectedServiceCode: 'TEST',
        loading: true,
        error: 'Test error',
        lastUpdated: new Date()
      });

      service.reset();

      expect(service.mocks()).toEqual([]);
      expect(service.statistics()).toBeNull();
      expect(service.selectedServiceCode()).toBeNull();
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
      expect(service.lastUpdated()).toBeNull();
    });
  });

  describe('loadAllMocks', () => {
    it('should load all mocks successfully', async () => {
      const mockEntities = [mockEntity];
      (mockRepository.findAll as jasmine.Spy).and.returnValue(Promise.resolve(mockEntities));

      await service.loadAllMocks();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(service.mocks()).toEqual(mockEntities);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should handle load error', async () => {
      (mockRepository.findAll as jasmine.Spy).and.returnValue(Promise.reject(new Error('Load failed')));
      await expectAsync(service.loadAllMocks()).toBeRejectedWithError('Load failed');
      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(service.error()).toContain('Load failed');
    });
  });

  describe('createMock', () => {
    it('should create mock successfully', async () => {
      const newMockData = { ...mockData, id: 'new-id' };
      const newEntity = new HttpMockEntity(newMockData);
      (mockRepository.create as jasmine.Spy).and.returnValue(Promise.resolve(newEntity));
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(createMockStatistics(2, 100)));

      const result = await service.createMock(mockData);

      expect(result).toBe(newEntity);
      expect(service.mocks().some(mock => mock.id === newEntity.id)).toBeTrue();
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should handle create error', async () => {
      (mockRepository.create as jasmine.Spy).and.returnValue(Promise.reject(new Error('Create failed')));

      const result = await service.createMock(mockData);

      expect(result).toBeNull();
      expect(service.loading()).toBe(false);
      expect(service.error()).toContain('Failed to create mock');
    });
  });

  describe('updateMock', () => {
    it('should update mock successfully', async () => {
      const updatedEntity = new HttpMockEntity({ ...mockData, name: 'Updated' });
      (mockRepository.update as jasmine.Spy).and.returnValue(Promise.resolve(updatedEntity));
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(createMockStatistics(1, 100)));

      const result = await service.updateMock('test-id', { name: 'Updated' });

      expect(mockRepository.update).toHaveBeenCalledWith('test-id', { name: 'Updated' });
      expect(result).toBe(updatedEntity);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should return null when update fails', async () => {
      (mockRepository.update as jasmine.Spy).and.returnValue(Promise.resolve(null));

      const result = await service.updateMock('test-id', { name: 'Updated' });

      expect(result).toBeNull();
    });

    it('should handle update error', async () => {
      (mockRepository.update as jasmine.Spy).and.returnValue(Promise.reject(new Error('Update failed')));
      const result = await service.updateMock('test-id', { name: 'Updated' });
      expect(result).toBeNull();
      expect(service.error()).toContain('Update failed');
    });
  });

  describe('deleteMock', () => {
    it('should delete mock successfully', async () => {
      service['_state'].set({
        mocks: [mockEntity],
        statistics: createMockStatistics(1, 100),
        selectedServiceCode: null,
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      (mockRepository.delete as jasmine.Spy).and.returnValue(Promise.resolve(true));
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(createMockStatistics(0, 0)));

      const result = await service.deleteMock('test-id');

      expect(mockRepository.delete).toHaveBeenCalledWith('test-id');
      expect(result).toBe(true);
      expect(service.mocks()).toEqual([]);
      expect(service.loading()).toBe(false);
      expect(service.error()).toBeNull();
    });

    it('should return false when mock not found', async () => {
      (mockRepository.delete as jasmine.Spy).and.returnValue(Promise.resolve(false));

      const result = await service.deleteMock('non-existent');

      expect(result).toBe(false);
    });

    it('should return false on delete error', async () => {
      (mockRepository.delete as jasmine.Spy).and.returnValue(Promise.reject(new Error('Delete error')));
      const result = await service.deleteMock('test-id');
      expect(result).toBe(false);
      expect(service.error()).toContain('Delete error');
    });
  });

  describe('loadMocksByServiceCode', () => {
    it('should load mocks by service code successfully', async () => {
      const filteredMocks = [mockEntity];
      (mockRepository.findByServiceCode as jasmine.Spy).and.returnValue(Promise.resolve(filteredMocks));

      await service.loadMocksByServiceCode('TEST');

      expect(mockRepository.findByServiceCode).toHaveBeenCalledWith('TEST');
      expect(service.mocks()).toEqual(filteredMocks);
      expect(service.selectedServiceCode()).toBe('TEST');
      expect(service.error()).toBeNull();
    });

    it('should handle load by service code error', async () => {
      (mockRepository.findByServiceCode as jasmine.Spy).and.returnValue(Promise.reject(new Error('Service code error')));
      await expectAsync(service.loadMocksByServiceCode('TEST')).toBeRejected();
      expect(service.error()).toContain('Service code error');
    });
  });

  describe('findMatchingMock', () => {
    it('should find matching mock successfully', async () => {
      (mockRepository.findByUrlAndMethod as jasmine.Spy).and.returnValue(Promise.resolve(mockEntity));

      const result = await service.findMatchingMock('/api/test', 'GET');

      expect(mockRepository.findByUrlAndMethod).toHaveBeenCalledWith('/api/test', 'GET');
      expect(result).toBe(mockEntity);
    });

    it('should return null when no match found', async () => {
      (mockRepository.findByUrlAndMethod as jasmine.Spy).and.returnValue(Promise.resolve(null));

      const result = await service.findMatchingMock('/api/missing', 'GET');

      expect(result).toBeNull();
    });

    it('should return null on find error', async () => {
      (mockRepository.findByUrlAndMethod as jasmine.Spy).and.returnValue(Promise.reject(new Error('Find error')));
      const result = await service.findMatchingMock('/api/test', 'GET');
      expect(result).toBeNull();
      expect(service.error()).toContain('Find error');
    });
  });

  describe('searchMocks', () => {
    it('should search mocks successfully', async () => {
      const searchOptions = { serviceCode: 'TEST' };
      const searchResults = [mockEntity];
      (mockRepository.findWithFilters as jasmine.Spy).and.returnValue(Promise.resolve(searchResults));

      await service.searchMocks(searchOptions);

      expect(mockRepository.findWithFilters).toHaveBeenCalledWith(searchOptions);
      expect(service.mocks()).toEqual(searchResults);
      expect(service.selectedServiceCode()).toBe('TEST');
      expect(service.error()).toBeNull();
    });

    it('should handle search error', async () => {
      const searchOptions = { serviceCode: 'TEST' };
      (mockRepository.findWithFilters as jasmine.Spy).and.returnValue(Promise.reject(new Error('Search error')));
      await expectAsync(service.searchMocks(searchOptions)).toBeRejected();
      expect(service.error()).toContain('Search error');
    });
  });

  describe('getAllServiceCodes', () => {
    it('should get all service codes successfully', async () => {
      const serviceCodes = ['TEST', 'OTHER'];
      (mockRepository.getAllServiceCodes as jasmine.Spy).and.returnValue(Promise.resolve(serviceCodes));

      const result = await service.getAllServiceCodes();

      expect(mockRepository.getAllServiceCodes).toHaveBeenCalled();
      expect(result).toEqual(serviceCodes);
    });

    it('should return empty array on error', async () => {
      (mockRepository.getAllServiceCodes as jasmine.Spy).and.returnValue(Promise.reject(new Error('Service codes error')));

      const result = await service.getAllServiceCodes();

      expect(result).toEqual([]);
      expect(service.error()).toContain('Failed to get service codes');
    });
  });

  describe('getServiceCodesWithStats', () => {
    it('should get service codes with stats successfully', async () => {
      const serviceCodesWithStats: ServiceCodeWithStats[] = [{ id: 'hash1', serviceCode: 'TEST', mockCount: 1, methods: ['GET'] }];
      (mockRepository.getServiceCodesWithStats as jasmine.Spy).and.returnValue(Promise.resolve(serviceCodesWithStats));

      const result = await service.getServiceCodesWithStats();

      expect(mockRepository.getServiceCodesWithStats).toHaveBeenCalled();
      expect(result).toEqual(serviceCodesWithStats);
    });

    it('should return empty array on error', async () => {
      (mockRepository.getServiceCodesWithStats as jasmine.Spy).and.returnValue(Promise.reject(new Error('Stats error')));

      const result = await service.getServiceCodesWithStats();

      expect(result).toEqual([]);
      expect(service.error()).toContain('Failed to get service codes with statistics');
    });
  });

  describe('selectServiceCode', () => {
    it('should select service code', () => {
      service.selectServiceCode('TEST');

      expect(service.selectedServiceCode()).toBe('TEST');
    });

    it('should clear service code selection', () => {
      service.selectServiceCode('TEST');
      service.selectServiceCode(null);

      expect(service.selectedServiceCode()).toBeNull();
    });
  });

  describe('clearFilters', () => {
    it('should clear filters', () => {
      service.selectServiceCode('TEST');

      service.clearFilters();

      expect(service.selectedServiceCode()).toBeNull();
    });
  });

  describe('interceptRequest', () => {
    it('should return not intercepted when disabled', async () => {
      const result = await service.interceptRequest('/api/test', 'GET');

      expect(result.intercepted).toBe(false);
      expect(result.reason).toContain('HTTP interception is disabled');
    });

    it('should intercept request successfully', async () => {
      service.updateInterceptionConfig({ enabled: true });
      (mockRepository.findByUrlAndMethod as jasmine.Spy).and.returnValue(Promise.resolve(mockEntity));

      const result = await service.interceptRequest('/api/test', 'GET');

      expect(result.intercepted).toBe(true);
      expect(result.mock).toBe(mockEntity);
    });

    it('should not intercept when no matching mock', async () => {
      service.updateInterceptionConfig({ enabled: true });
      (mockRepository.findByUrlAndMethod as jasmine.Spy).and.returnValue(Promise.resolve(null));

      const result = await service.interceptRequest('/api/test', 'GET');

      expect(result.intercepted).toBe(false);
      expect(result.reason).toContain('No matching mock found');
    });

    it('should not intercept when service code not enabled', async () => {
      service.updateInterceptionConfig({ enabled: true, serviceCodes: ['OTHER'] });
      (mockRepository.findByUrlAndMethod as jasmine.Spy).and.returnValue(Promise.resolve(mockEntity));

      const result = await service.interceptRequest('/api/test', 'GET');

      expect(result.intercepted).toBe(false);
      expect(result.reason).toContain('not enabled for interception');
    });

    it('should handle interception error', async () => {
      service.updateInterceptionConfig({ enabled: true });
      (mockRepository.findByUrlAndMethod as jasmine.Spy).and.returnValue(Promise.reject(new Error('Interception error')));

      const result = await service.interceptRequest('/api/test', 'GET');

      expect(result.intercepted).toBe(false);
      expect(result.reason).toContain('No matching mock found for request');
    });
  });

  describe('updateInterceptionConfig', () => {
    it('should update interception config', () => {
      service.updateInterceptionConfig({ enabled: true, defaultDelay: 200 });

      const config = service.interceptionConfig();
      expect(config.enabled).toBe(true);
      expect(config.defaultDelay).toBe(200);
    });
  });

  describe('toggleInterception', () => {
    it('should toggle interception on', () => {
      service.toggleInterception();

      expect(service.isInterceptionEnabled()).toBe(true);
    });

    it('should toggle interception off', () => {
      service.updateInterceptionConfig({ enabled: true });
      service.toggleInterception();

      expect(service.isInterceptionEnabled()).toBe(false);
    });
  });

  describe('updateStatistics', () => {
    it('should update statistics successfully', async () => {
      const stats = createMockStatistics(5, 150);
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(stats));

      await service.updateStatistics();

      expect(mockRepository.getStatistics).toHaveBeenCalled();
      expect(service.statistics()).toEqual(stats);
    });

    it('should handle statistics update error gracefully', async () => {
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.reject(new Error('Stats error')));

      await service.updateStatistics();

      expect(service.statistics()).toBeNull();
    });
  });

  describe('exportMocks', () => {
    it('should export all mocks', async () => {
      const allMocks = [mockEntity];
      (mockRepository.findAll as jasmine.Spy).and.returnValue(Promise.resolve(allMocks));

      const result = await service.exportMocks();

      expect(mockRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockEntity.toPlainObject()]);
    });

    it('should export mocks by service code', async () => {
      const exportedMocks = [mockEntity.toPlainObject()];
      (mockRepository.exportByServiceCode as jasmine.Spy).and.returnValue(Promise.resolve(exportedMocks));

      const result = await service.exportMocks('TEST');

      expect(mockRepository.exportByServiceCode).toHaveBeenCalledWith('TEST');
      expect(result).toEqual(exportedMocks);
    });

    it('should return empty array on export error', async () => {
      (mockRepository.findAll as jasmine.Spy).and.returnValue(Promise.reject(new Error('Export error')));

      const result = await service.exportMocks();

      expect(result).toEqual([]);
      expect(service.error()).toContain('Failed to export mocks');
    });
  });

  describe('importMocks', () => {
    it('should import mocks successfully', async () => {
      const importData = [mockData];
      const importedMocks = [mockEntity];
      (mockRepository.importMocks as jasmine.Spy).and.returnValue(Promise.resolve(importedMocks));
      (mockRepository.findAll as jasmine.Spy).and.returnValue(Promise.resolve(importedMocks));
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(createMockStatistics(1, 100)));

      const result = await service.importMocks(importData);

      expect(mockRepository.importMocks).toHaveBeenCalledWith(importData);
      expect(result).toBe(1);
      expect(service.mocks()).toEqual(importedMocks);
    });

    it('should return 0 on import error', async () => {
      const importData = [mockData];
      (mockRepository.importMocks as jasmine.Spy).and.returnValue(Promise.reject(new Error('Import error')));
      const result = await service.importMocks(importData);
      expect(result).toBe(0);
      expect(service.error()).toContain('Import error');
    });
  });

  describe('cleanup', () => {
    it('should cleanup by service code', async () => {
      (mockRepository.deleteByServiceCode as jasmine.Spy).and.returnValue(Promise.resolve(2));
      (mockRepository.findAll as jasmine.Spy).and.returnValue(Promise.resolve([]));
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(createMockStatistics(0, 0)));

      const result = await service.cleanup({ serviceCode: 'TEST' });

      expect(mockRepository.deleteByServiceCode).toHaveBeenCalledWith('TEST');
      expect(result).toBe(2);
    });

    it('should cleanup old mocks', async () => {
      const oldMock = new HttpMockEntity({ ...mockData, id: 'old' });
      (oldMock as any).createdAt = new Date(getCurrentTimestamp() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      (mockRepository.findAll as jasmine.Spy).and.returnValues(
        Promise.resolve([oldMock]), // First call returns the old mock
        Promise.resolve([]) // Second call returns empty array
      );
      (mockRepository.delete as jasmine.Spy).and.returnValue(Promise.resolve(true));
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(createMockStatistics(0, 0)));

      const result = await service.cleanup({ olderThanDays: 7 });

      expect(result).toBe(1);
    });

    it('should return 0 on cleanup error', async () => {
      (mockRepository.deleteByServiceCode as jasmine.Spy).and.returnValue(Promise.reject(new Error('Cleanup error')));
      const result = await service.cleanup({ serviceCode: 'TEST' });
      expect(result).toBe(0);
      expect(service.error()).toContain('Cleanup error');
    });
  });

  describe('clearAllMocks', () => {
    it('should clear all mocks successfully', async () => {
      service['_state'].set({
        mocks: [mockEntity],
        statistics: createMockStatistics(1, 100),
        selectedServiceCode: 'TEST',
        loading: false,
        error: null,
        lastUpdated: new Date()
      });
      (mockRepository.clearAllMocks as jasmine.Spy).and.returnValue(Promise.resolve());
      (mockRepository.getStatistics as jasmine.Spy).and.returnValue(Promise.resolve(createMockStatistics(0, 0)));

      await service.clearAllMocks();

      expect(mockRepository.clearAllMocks).toHaveBeenCalled();
      expect(service.mocks()).toEqual([]);
      expect(service.statistics()).toEqual(createMockStatistics(0, 0));
      expect(service.selectedServiceCode()).toBeNull();
      expect(service.error()).toBeNull();
    });

    it('should handle clear error', async () => {
      (mockRepository.clearAllMocks as jasmine.Spy).and.returnValue(Promise.reject(new Error('Clear error')));
      await expectAsync(service.clearAllMocks()).toBeRejected();
      expect(service.error()).toContain('Clear error');
    });
  });
});
