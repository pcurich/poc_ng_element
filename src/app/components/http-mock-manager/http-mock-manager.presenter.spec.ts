import { TestBed } from '@angular/core/testing';
import { HttpMockManagerPresenter } from './http-mock-manager.presenter';
import { HttpMockService } from '../../../core/services/HttpMockService';
import { HttpMockRepository } from '../../../core/repositories/HttpMockRepository';
import { ORMFactory, ServiceCodeWithStats } from '../../../core';
import { HttpMockEntity, IHttpMockData } from '../../../core/models/HttpMockEntity';
import { signal, WritableSignal } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { ContextOption } from 'index';
import { MockSchema } from '../interfaces/http-mock-manager-component.interface';

describe('HttpMockManagerPresenter', () => {
  let presenter: HttpMockManagerPresenter;
  let mockHttpMockService: jasmine.SpyObj<HttpMockService>;
  let mockHttpMockRepository: jasmine.SpyObj<HttpMockRepository>;

  beforeEach(() => {
    mockHttpMockService = jasmine.createSpyObj('HttpMockService', [
      'initialize',
      'createMock',
      'updateMock',
      'deleteMock',
      'loadMocksByServiceCode',
      'exportMocks',
      'getServiceCodesWithStats',
      'clearAllMocks'
    ], {
      mocks: signal([]) as WritableSignal<HttpMockEntity[]>,
      statistics: signal(null) as WritableSignal<any>
    });

    mockHttpMockRepository = jasmine.createSpyObj('HttpMockRepository', [
      'findByServiceCode',
      'getAll',
      'create',
      'update',
      'delete'
    ]);

    TestBed.configureTestingModule({
      providers: [
        HttpMockManagerPresenter,
        provideZonelessChangeDetection()
      ]
    });

    presenter = TestBed.inject(HttpMockManagerPresenter);
    (presenter as any).httpMockService = mockHttpMockService;
    (presenter as any).httpMockRepository = mockHttpMockRepository;
  });

  describe('Component Initialization', () => {
    it('#Should-create-presenter-instance', () => {
      expect(presenter).toBeTruthy();
    });

    it('#Should-initialize-with-default-state', () => {
      expect(presenter.isInitialized()).toBe(false);
    });

    it('#Should-initialize-loading-as-false', () => {
      expect(presenter.isLoading()).toBe(false);
    });

    it('#Should-initialize-error-as-null', () => {
      expect(presenter.error()).toBeNull();
    });

    it('#Should-initialize-currentMocks-as-empty-array', () => {
      expect(presenter.currentMocks()).toEqual([]);
    });

    it('#Should-initialize-statistics-as-null', () => {
      expect(presenter.statistics()).toBeNull();
    });

    it('#Should-initialize-selectedServiceCode-as-null', () => {
      expect(presenter.selectedServiceCode()).toBeNull();
    });

    it('#Should-initialize-lastOperation-as-null', () => {
      expect(presenter.lastOperation()).toBeNull();
    });

    it('#Should-initialize-availableServiceCodes-as-empty-array', () => {
      expect(presenter.availableServiceCodes()).toEqual([]);
    });

    it('#Should-initialize-databaseStatus-with-default-values', () => {
      const status = presenter.databaseStatus();
      expect(status.exists).toBe(false);
    });

    it('#Should-initialize-databaseConfig-as-null', () => {
      expect(presenter.databaseConfig()).toBeNull();
    });
  });

  describe('Database Status Computed Properties', () => {
    it('#Should-return-true-for-shouldShowDatabaseSetup-when-database-not-exists', () => {
      expect(presenter.shouldShowDatabaseSetup()).toBe(true);
    });

    it('#Should-return-false-for-shouldShowManagementTabs-when-database-not-initialized', () => {
      expect(presenter.shouldShowManagementTabs()).toBe(false);
    });

    it('#Should-return-false-for-shouldShowDatabaseSetup-when-database-exists', () => {
      (presenter as any)._databaseStatus.set({ exists: true, isInitialized: true });
      expect(presenter.shouldShowDatabaseSetup()).toBe(false);
    });

    it('#Should-return-true-for-shouldShowManagementTabs-when-database-exists-and-initialized', () => {
      (presenter as any)._databaseStatus.set({ exists: true, isInitialized: true });
      expect(presenter.shouldShowManagementTabs()).toBe(true);
    });
  });

  describe('Initialize', () => {
    it('#Should-set-loading-to-true-during-initialization', async () => {
      spyOn<any>(presenter, 'checkDatabaseExists').and.returnValue(Promise.resolve({ exists: false, isInitialized: false }));
      spyOn<any>(presenter, 'loadDefaultDatabaseConfig').and.returnValue(Promise.resolve());
      const initPromise = presenter.initialize();
      expect(presenter.isLoading()).toBe(true);
      await initPromise;
    });

    it('#Should-set-isInitialized-to-true-after-successful-initialization', async () => {
      spyOn<any>(presenter, 'checkDatabaseExists').and.returnValue(Promise.resolve({ exists: false, isInitialized: false }));
      spyOn<any>(presenter, 'loadDefaultDatabaseConfig').and.returnValue(Promise.resolve());
      await presenter.initialize();
      expect(presenter.isInitialized()).toBe(true);
    });

    it('#Should-load-default-config-when-database-not-exists', async () => {
      spyOn<any>(presenter, 'checkDatabaseExists').and.returnValue(Promise.resolve({ exists: false, isInitialized: false }));
      const loadConfigSpy = spyOn<any>(presenter, 'loadDefaultDatabaseConfig').and.returnValue(Promise.resolve());
      await presenter.initialize();
      expect(loadConfigSpy).toHaveBeenCalled();
    });

    it('#Should-initialize-services-when-database-exists', async () => {
      spyOn<any>(presenter, 'checkDatabaseExists').and.returnValue(Promise.resolve({ exists: true, isInitialized: true }));
      const initServicesSpy = spyOn<any>(presenter, 'initializeServices').and.returnValue(Promise.resolve());
      await presenter.initialize();
      expect(initServicesSpy).toHaveBeenCalled();
    });

    it('#Should-set-error-when-initialization-fails', async () => {
      spyOn<any>(presenter, 'checkDatabaseExists').and.returnValue(Promise.reject(new Error('Init failed')));
      try {
        await presenter.initialize();
      } catch (e) { }
      expect(presenter.error()).toContain('Init failed');
    });

    it('#Should-set-loading-to-false-after-initialization-completes', async () => {
      spyOn<any>(presenter, 'checkDatabaseExists').and.returnValue(Promise.resolve({ exists: false, isInitialized: false }));
      spyOn<any>(presenter, 'loadDefaultDatabaseConfig').and.returnValue(Promise.resolve());
      await presenter.initialize();
      expect(presenter.isLoading()).toBe(false);
    });

    it('#Should-initialize-empty-statistics-when-database-not-exists', async () => {
      spyOn<any>(presenter, 'checkDatabaseExists').and.returnValue(Promise.resolve({ exists: false, isInitialized: false }));
      spyOn<any>(presenter, 'loadDefaultDatabaseConfig').and.returnValue(Promise.resolve());
      await presenter.initialize();
      expect(presenter.statistics()?.totalMocks).toBe(0);
    });

    it('#Should-update-databaseStatus-when-database-exists', async () => {
      spyOn<any>(presenter, 'checkDatabaseExists').and.returnValue(Promise.resolve({ exists: true, isInitialized: true }));
      spyOn<any>(presenter, 'initializeServices').and.returnValue(Promise.resolve());
      await presenter.initialize();
      expect(presenter.databaseStatus().exists).toBe(true);
    });
  });

  describe('Context Management', () => {
    it('#Should-save-useMock-to-localStorage', async () => {
      spyOn(window.localStorage, 'setItem');
      const contextOption = { value: 'mock', id: 1, useMock: true } as ContextOption;
      await presenter.handleContextTypeChange(contextOption);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('useMock', JSON.stringify(true));
    });

    it('#Should-save-selectedContext-to-localStorage', async () => {
      spyOn(window.localStorage, 'setItem');
      const contextOption = { value: 'mock', id: 1, useMock: true } as ContextOption;
      await presenter.handleContextTypeChange(contextOption);
      expect(window.localStorage.setItem).toHaveBeenCalledWith('selectedContext', JSON.stringify(contextOption));
    });

    it('#Should-refresh-statistics-when-context-uses-mock', async () => {
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      const contextOption = { value: 'mock', id: 1, useMock: true } as ContextOption;
      await presenter.handleContextTypeChange(contextOption);
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('#Should-set-lastOperation-after-context-change', async () => {
      const contextOption = { value: 'mock', id: 1, useMock: true } as ContextOption;
      await presenter.handleContextTypeChange(contextOption);
      expect(presenter.lastOperation()).toBe('Context changed successfully');
    });

    it('#Should-set-error-when-context-change-fails', async () => {
      spyOn(window.localStorage, 'setItem').and.throwError('Storage error');
      const contextOption = { value: 'mock', id: 1, useMock: true } as ContextOption;
      await presenter.handleContextTypeChange(contextOption);
      expect(presenter.error()).toContain('Storage error');
    });
  });

  describe('Create Mock Schema', () => {
    it('#Should-call-createMock-on-service', async () => {
      const mockSchema = {
        nameMock: 'Test Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 0,
        headers: {}
      } as MockSchema;
      mockHttpMockService.createMock.and.returnValue(Promise.resolve({ id: '1', ...mockSchema, responseBody: '{}' } as any as HttpMockEntity));
      await presenter.handleSaveMockSchema(mockSchema);
      expect(mockHttpMockService.createMock).toHaveBeenCalled();
    });

    it('#Should-add-created-mock-to-currentMocks', async () => {
      const mockSchema = {
        nameMock: 'Test Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 0,
        headers: {}
      } as MockSchema;
      const createdMock = { id: '1', ...mockSchema, responseBody: '{}' } as unknown as HttpMockEntity;
      mockHttpMockService.createMock.and.returnValue(Promise.resolve(createdMock));
      await presenter.handleSaveMockSchema(mockSchema);
      expect(presenter.currentMocks()).toContain(createdMock);
    });

    it('#Should-refresh-statistics-after-creating-mock', async () => {
      const mockSchema = {
        nameMock: 'Test Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 0,
        headers: {}
      } as MockSchema;
      mockHttpMockService.createMock.and.returnValue(Promise.resolve({ id: '1', ...mockSchema, responseBody: '{}' } as any as HttpMockEntity));
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleSaveMockSchema(mockSchema);
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('#Should-return-created-mock-entity', async () => {
      const mockSchema = {
        nameMock: 'Test Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 0,
        headers: {}
      } as MockSchema;
      const createdMock = { id: '1', ...mockSchema, responseBody: '{}' } as any as HttpMockEntity;
      mockHttpMockService.createMock.and.returnValue(Promise.resolve(createdMock));
      const result = await presenter.handleSaveMockSchema(mockSchema);
      expect(result).toEqual(createdMock);
    });

    it('#Should-return-null-when-create-fails', async () => {
      const mockSchema = {
        nameMock: 'Test Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 0,
        headers: {}
      };
      mockHttpMockService.createMock.and.returnValue(Promise.reject(new Error('Create failed')));
      const result = await presenter.handleSaveMockSchema(mockSchema as MockSchema);
      expect(result).toBeNull();
      expect(presenter.error()).toContain('Create failed');
    });

    it('#Should-set-error-when-create-mock-fails', async () => {
      const mockSchema = {
        nameMock: 'Test Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 0,
        headers: {}
      };
      mockHttpMockService.createMock.and.returnValue(Promise.reject(new Error('Create failed')));
      await presenter.handleSaveMockSchema(mockSchema as MockSchema);
      expect(presenter.error()).toContain('Create failed');
    });
  });

  describe('Update Mock Schema', () => {
    it('#Should-call-updateMock-on-service', async () => {
      const mockSchema = {
        nameMock: 'Updated Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 100,
        headers: {}
      };
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve({ id: '1', ...mockSchema, responseBody: '{}' } as any as HttpMockEntity));
      await presenter.handleUpdateMockSchema('1', mockSchema as MockSchema);
      expect(mockHttpMockService.updateMock).toHaveBeenCalled();
    });

    it('#Should-update-mock-in-currentMocks-array', async () => {
      const existingMock = { id: '1', name: 'Old', serviceCode: 'TEST', url: '/old', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' } as HttpMockEntity;
      (presenter as any)._currentMocks.set([existingMock]);
      const mockSchema = {
        nameMock: 'Updated Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 100,
        headers: {}
      };
      const updatedMock = { id: '1', name: 'Updated Mock', serviceCode: 'TEST', url: '/api/test', method: 'POST', httpCodeResponseValue: 201, delayMs: 100, headers: {}, responseBody: '{}' } as HttpMockEntity;
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(updatedMock));
      await presenter.handleUpdateMockSchema('1', mockSchema as MockSchema);
      expect(presenter.currentMocks()[0].name).toBe('Updated Mock');
    });

    it('#Should-refresh-statistics-after-updating-mock', async () => {
      const mockSchema = {
        nameMock: 'Updated Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 100,
        headers: {}
      };
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve({ id: '1', ...mockSchema, responseBody: '{}' } as any as HttpMockEntity));
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleUpdateMockSchema('1', mockSchema as MockSchema);
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('#Should-return-updated-mock-entity', async () => {
      const mockSchema = {
        nameMock: 'Updated Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 100,
        headers: {}
      };
      const updatedMock = { id: '1', ...mockSchema, responseBody: '{}' } as any as HttpMockEntity;
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(updatedMock));
      const result = await presenter.handleUpdateMockSchema('1', mockSchema as MockSchema);
      expect(result).toEqual(updatedMock);
    });

    it('#Should-return-null-when-update-fails', async () => {
      const mockSchema = {
        nameMock: 'Updated Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 100,
        headers: {}
      };
      mockHttpMockService.updateMock.and.returnValue(Promise.reject(new Error('Update failed')));
      const result = await presenter.handleUpdateMockSchema('1', mockSchema as MockSchema);
      expect(result).toBeNull();
    });

    it('#Should-set-error-when-update-mock-fails', async () => {
      const mockSchema = {
        nameMock: 'Updated Mock',
        serviceCode: 'TEST',
        url: '/api/test',
        httpMethod: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 100,
        headers: {}
      };
      mockHttpMockService.updateMock.and.returnValue(Promise.reject(new Error('Update failed')));
      await presenter.handleUpdateMockSchema('1', mockSchema as MockSchema);
      expect(presenter.error()).toBeTruthy();
    });
  });

  describe('Save Mock Body', () => {
    it('#Should-update-mock-with-response-body', async () => {
      const existingMock = { id: '1', name: 'Test', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' } as any as HttpMockEntity;
      (presenter as any)._currentMocks.set([existingMock]);
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(null));
      await presenter.handleSaveMockBody({ responseBody: '{"key":"value"}' }, '1');
      expect(mockHttpMockService.updateMock).toHaveBeenCalledWith('1', { responseBody: '{"key":"value"}' });
    });

    it('#Should-update-currentMocks-with-new-body', async () => {
      const existingMock = { id: '1', name: 'Test', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' } as HttpMockEntity;
      (presenter as any)._currentMocks.set([existingMock]);
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(null));
      await presenter.handleSaveMockBody({ responseBody: '{"updated":true}' }, '1');
      expect(presenter.currentMocks()[0].responseBody).toBe('{"updated":true}');
    });

    it('#Should-throw-error-when-no-mock-available', async () => {
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(null));
      await presenter.handleSaveMockBody({ responseBody: '{}' });
      expect(presenter.error()).toBeTruthy();
    });

    it('#Should-set-lastOperation-after-saving-body', async () => {
      const existingMock = { id: '1', name: 'Test', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' } as HttpMockEntity;
      (presenter as any)._currentMocks.set([existingMock]);
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(null));
      await presenter.handleSaveMockBody({ responseBody: '{"key":"value"}' }, '1');
      expect(presenter.lastOperation()).toBe('Mock body saved successfully');
    });
  });

  describe('Save Headers', () => {
    it('#Should-update-mock-with-headers', async () => {
      const existingMock = { id: '1', name: 'Test', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' } as HttpMockEntity;
      (presenter as any)._currentMocks.set([existingMock]);
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(null));
      const headers = { 'Content-Type': 'application/json' };
      await presenter.handleSaveHeaders(headers, '1');
      expect(mockHttpMockService.updateMock).toHaveBeenCalledWith('1', { headers });
    });

    it('#Should-update-currentMocks-with-new-headers', async () => {
      const existingMock = { id: '1', name: 'Test', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' } as HttpMockEntity;
      (presenter as any)._currentMocks.set([existingMock]);
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(null));
      const headers = { 'Authorization': 'Bearer token' };
      await presenter.handleSaveHeaders(headers, '1');
      expect(presenter.currentMocks()[0].headers).toEqual(headers);
    });

    it('#Should-use-latest-mock-when-no-mockId-provided-for-headers', async () => {
      const mock1 = { id: '1', name: 'Test1', serviceCode: 'TEST', url: '/test1', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' } as HttpMockEntity;
      const mock2 = { id: '2', name: 'Test2', serviceCode: 'TEST', url: '/test2', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' } as HttpMockEntity;
      (presenter as any)._currentMocks.set([mock1, mock2]);
      mockHttpMockService.updateMock.and.returnValue(Promise.resolve(null));
      const headers = { 'X-Custom': 'value' };
      await presenter.handleSaveHeaders(headers);
      expect(mockHttpMockService.updateMock).toHaveBeenCalledWith('2', { headers });
    });

    it('#Should-set-lastOperation-when-no-mock-to-associate', async () => {
      const headers = { 'Content-Type': 'application/json' };
      await presenter.handleSaveHeaders(headers);
      expect(presenter.lastOperation()).toBe('Headers saved locally (no mock to associate)');
    });
  });

  describe('Load Mocks By Service Code', () => {
    it('#Should-call-loadMocksByServiceCode-on-service', async () => {
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      await presenter.handleLoadMocksByServiceCode('TEST');
      expect(mockHttpMockService.loadMocksByServiceCode).toHaveBeenCalledWith('TEST');
    });

    it('#Should-update-currentMocks-with-loaded-mocks', async () => {
      const mocks = [{ id: '1', name: 'Mock1' } as HttpMockEntity];
      (mockHttpMockService.mocks as unknown as WritableSignal<HttpMockEntity[]>).set(mocks);
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleLoadMocksByServiceCode('TEST');
      expect(presenter.currentMocks()).toEqual(mocks);
    });

    it('#Should-set-selectedServiceCode', async () => {
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleLoadMocksByServiceCode('TEST');
      expect(presenter.selectedServiceCode()).toBe('TEST');
    });

    it('#Should-refresh-statistics-after-loading-mocks', async () => {
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleLoadMocksByServiceCode('TEST');
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('#Should-set-error-when-load-fails', async () => {
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.reject(new Error('Load failed')));
      await presenter.handleLoadMocksByServiceCode('TEST');
      expect(presenter.error()).toBeTruthy();
    });
  });

  describe('Load Mocks With Auto Population', () => {
    it('#Should-return-first-mock-for-auto-population', async () => {
      const mocks = [
        { id: '1', name: 'Mock1' } as HttpMockEntity,
        { id: '2', name: 'Mock2' } as HttpMockEntity
      ];
      (mockHttpMockService.mocks as unknown as WritableSignal<HttpMockEntity[]>).set(mocks);
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      const result = await presenter.handleLoadMocksByServiceCodeWithAutoPopulation('TEST');
      expect(result).toEqual(mocks[0]);
    });

    it('#Should-return-null-when-no-mocks-found', async () => {
      (mockHttpMockService.mocks as unknown as WritableSignal<HttpMockEntity[]>).set([]);
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      const result = await presenter.handleLoadMocksByServiceCodeWithAutoPopulation('TEST');
      expect(result).toBeNull();
    });

    it('#Should-update-currentMocks-with-auto-population', async () => {
      const mocks = [{ id: '1', name: 'Mock1' } as HttpMockEntity];
      (mockHttpMockService.mocks as unknown as WritableSignal<HttpMockEntity[]>).set(mocks);
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleLoadMocksByServiceCodeWithAutoPopulation('TEST');
      expect(presenter.currentMocks()).toEqual(mocks);
    });

    it('#Should-return-null-on-error-with-auto-population', async () => {
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.reject(new Error('Load failed')));
      const result = await presenter.handleLoadMocksByServiceCodeWithAutoPopulation('TEST');
      expect(result).toBeNull();
    });
  });

  describe('Delete Mock', () => {
    it('#Should-call-deleteMock-on-service', async () => {
      mockHttpMockService.deleteMock.and.returnValue(Promise.resolve(true));
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleDeleteMock('1');
      expect(mockHttpMockService.deleteMock).toHaveBeenCalledWith('1');
    });

    it('#Should-remove-mock-from-currentMocks', async () => {
      const mock1 = { id: '1', name: 'Mock1' } as HttpMockEntity;
      const mock2 = { id: '2', name: 'Mock2' } as HttpMockEntity;
      (presenter as any)._currentMocks.set([mock1, mock2]);
      mockHttpMockService.deleteMock.and.returnValue(Promise.resolve(true));
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleDeleteMock('1');
      expect(presenter.currentMocks()).toEqual([mock2]);
    });

    it('#Should-refresh-statistics-after-deleting', async () => {
      mockHttpMockService.deleteMock.and.returnValue(Promise.resolve(true));
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleDeleteMock('1');
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('#Should-set-error-when-delete-fails', async () => {
      mockHttpMockService.deleteMock.and.returnValue(Promise.resolve(false));
      await presenter.handleDeleteMock('1');
      expect(presenter.error()).toBeTruthy();
    });
  });

  describe('Export Mocks', () => {
    it('#Should-call-exportMocks-with-serviceCode', async () => {
      mockHttpMockService.exportMocks.and.returnValue(Promise.resolve([]));
      await presenter.handleExportMocks('TEST');
      expect(mockHttpMockService.exportMocks).toHaveBeenCalledWith('TEST');
    });

    it('#Should-use-selectedServiceCode-when-no-parameter-provided', async () => {
      (presenter as any)._selectedServiceCode.set('SELECTED');
      mockHttpMockService.exportMocks.and.returnValue(Promise.resolve([]));
      await presenter.handleExportMocks();
      expect(mockHttpMockService.exportMocks).toHaveBeenCalledWith('SELECTED');
    });

    it('#Should-return-exported-mocks', async () => {
      const exportedMocks = [{ id: '1', name: 'Mock1' } as IHttpMockData];
      mockHttpMockService.exportMocks.and.returnValue(Promise.resolve(exportedMocks as any));
      const result = await presenter.handleExportMocks('TEST');
      expect(result).toEqual(exportedMocks);
    });

    it('#Should-return-empty-array-on-export-error', async () => {
      mockHttpMockService.exportMocks.and.returnValue(Promise.reject(new Error('Export failed')));
      const result = await presenter.handleExportMocks('TEST');
      expect(result).toEqual([]);
    });
  });

  describe('Export All Mocks', () => {
    it('#Should-call-exportMocks-without-filter', async () => {
      mockHttpMockService.exportMocks.and.returnValue(Promise.resolve([]));
      await presenter.handleExportAllMocks();
      expect(mockHttpMockService.exportMocks).toHaveBeenCalledWith();
    });

    it('#Should-return-all-mocks', async () => {
      const allMocks = [{ id: '1', name: 'Mock1' } as IHttpMockData, { id: '2', name: 'Mock2' } as IHttpMockData];
      mockHttpMockService.exportMocks.and.returnValue(Promise.resolve(allMocks as any));
      const result = await presenter.handleExportAllMocks();
      expect(result).toEqual(allMocks);
    });

    it('#Should-set-lastOperation-with-count', async () => {
      const allMocks = [{ id: '1', name: 'Mock1' }, { id: '2', name: 'Mock2' }];
      mockHttpMockService.exportMocks.and.returnValue(Promise.resolve(allMocks as any));
      await presenter.handleExportAllMocks();
      expect(presenter.lastOperation()).toBe('Exported 2 total mocks');
    });

    it('#Should-return-empty-array-on-error', async () => {
      mockHttpMockService.exportMocks.and.returnValue(Promise.reject(new Error('Export failed')));
      const result = await presenter.handleExportAllMocks();
      expect(result).toEqual([]);
    });
  });

  describe('Import Mocks', () => {
    it('#Should-call-createMock-for-each-valid-mock', async () => {
      const mocksData = [
        { name: 'Mock1', url: '/test1', method: 'GET', serviceCode: 'TEST' },
        { name: 'Mock2', url: '/test2', method: 'POST', serviceCode: 'TEST' }
      ];
      mockHttpMockService.createMock.and.returnValue(Promise.resolve({} as HttpMockEntity));
      await presenter.handleImportMocks(mocksData);
      expect(mockHttpMockService.createMock).toHaveBeenCalledTimes(2);
    });

    it('#Should-filter-invalid-mocks', async () => {
      const mocksData = [
        { name: 'Valid', url: '/test', method: 'GET', serviceCode: 'TEST' },
        { name: 'Invalid' }
      ];
      mockHttpMockService.createMock.and.returnValue(Promise.resolve({} as HttpMockEntity));
      await presenter.handleImportMocks(mocksData);
      expect(mockHttpMockService.createMock).toHaveBeenCalledTimes(1);
    });

    it('#Should-reload-mocks-when-service-selected', async () => {
      (presenter as any)._selectedServiceCode.set('TEST');
      mockHttpMockService.createMock.and.returnValue(Promise.resolve({} as HttpMockEntity));
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      const mocksData = [{ name: 'Mock1', url: '/test', method: 'GET', serviceCode: 'TEST' }];
      await presenter.handleImportMocks(mocksData);
      expect(mockHttpMockService.loadMocksByServiceCode).toHaveBeenCalledWith('TEST');
    });

    it('#Should-set-error-when-import-fails', async () => {
      const mocksData = [{ name: 'Mock1', url: '/test', method: 'GET', serviceCode: 'TEST' }];
      mockHttpMockService.createMock.and.returnValue(Promise.reject(new Error('Import failed')));
      await presenter.handleImportMocks(mocksData);
      expect(presenter.error()).toBeTruthy();
    });
  });

  describe('Reload', () => {
    it('#Should-refresh-statistics-on-reload', async () => {
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleReload();
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('#Should-reload-mocks-when-service-selected', async () => {
      (presenter as any)._selectedServiceCode.set('TEST');
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      const refreshStatsSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleReload();
      expect(mockHttpMockService.loadMocksByServiceCode).toHaveBeenCalledWith('TEST');
    });

    it('#Should-set-lastOperation-after-reload', async () => {
      const refreshSpy = spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      await presenter.handleReload();
      expect(presenter.lastOperation()).toBe('Reload completed');
    });

    it('#Should-set-error-when-reload-fails', async () => {
      spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.reject(new Error('Reload failed')));
      await presenter.handleReload();
      expect(presenter.error()).toBeTruthy();
    });
  });

  describe('Refresh Statistics', () => {
    it('#Should-update-statistics-signal', async () => {
      const stats = { totalMocks: 5, averageDelayMs: 100, mostUsedServiceCodes: [], methodDistribution: {}, statusCodeDistribution: {} };
      (mockHttpMockService.statistics as unknown as WritableSignal<any>).set(stats);
      const refreshServiceCodesSpy = spyOn(presenter, 'refreshAvailableServiceCodes').and.returnValue(Promise.resolve());
      await presenter.refreshStatistics();
      expect(presenter.statistics()).toEqual(stats);
    });

    it('#Should-refresh-available-service-codes', async () => {
      const refreshServiceCodesSpy = spyOn(presenter, 'refreshAvailableServiceCodes').and.returnValue(Promise.resolve());
      await presenter.refreshStatistics();
      expect(refreshServiceCodesSpy).toHaveBeenCalled();
    });

    it('#Should-set-empty-statistics-when-no-service', async () => {
      (presenter as any).httpMockService = null;
      await presenter.refreshStatistics();
      expect(presenter.statistics()?.totalMocks).toBe(0);
    });

    it('#Should-set-empty-statistics-on-error', async () => {
      (presenter as any).httpMockService = {
        statistics: () => { throw new Error('Stats error'); }
      };
      await presenter.refreshStatistics();
      expect(presenter.statistics()?.totalMocks).toBe(0);
    });
  });

  describe('Refresh Available Service Codes', () => {
    it('#Should-call-getServiceCodesWithStats', async () => {
      mockHttpMockService.getServiceCodesWithStats.and.returnValue(Promise.resolve([]));
      await presenter.refreshAvailableServiceCodes();
      expect(mockHttpMockService.getServiceCodesWithStats).toHaveBeenCalled();
    });

    it('#Should-update-availableServiceCodes-signal', async () => {
      const serviceCodes = [{ serviceCode: 'TEST', count: 5, totalMocks: 5, id: 'TEST', mockCount: 5, methods: ['GET'] } as ServiceCodeWithStats];
      mockHttpMockService.getServiceCodesWithStats.and.returnValue(Promise.resolve(serviceCodes));
      await presenter.refreshAvailableServiceCodes();
      expect(presenter.availableServiceCodes()).toEqual(serviceCodes);
    });

    it('#Should-set-empty-array-when-no-service', async () => {
      (presenter as any).httpMockService = null;
      await presenter.refreshAvailableServiceCodes();
      expect(presenter.availableServiceCodes()).toEqual([]);
    });

    it('#Should-set-empty-array-on-error', async () => {
      mockHttpMockService.getServiceCodesWithStats.and.returnValue(Promise.reject(new Error('Failed')));
      await presenter.refreshAvailableServiceCodes();
      expect(presenter.availableServiceCodes()).toEqual([]);
    });
  });

  describe('Load Available Service Codes', () => {
    it('#Should-call-refreshAvailableServiceCodes', async () => {
      const refreshSpy = spyOn(presenter, 'refreshAvailableServiceCodes').and.returnValue(Promise.resolve());
      await presenter.loadAvailableServiceCodes();
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe('Create Database', () => {
    it('#Should-create-database-with-config', async () => {
      const config = {
        name: 'TestDB',
        version: 1,
        objectStoreName: 'mocks',
        keyPath: 'id',
        indexes: []
      };
      spyOn(ORMFactory, 'createDbContext').and.returnValue({
        open: jasmine.createSpy('open').and.returnValue(Promise.resolve()),
        close: jasmine.createSpy('close').and.returnValue(Promise.resolve())
      } as any);
      spyOn<any>(presenter, 'initializeServices').and.returnValue(Promise.resolve());
      await presenter.handleCreateDatabase(config);
      expect(presenter.databaseStatus().exists).toBe(true);
    });

    it('#Should-initialize-services-after-creating-database', async () => {
      const config = {
        name: 'TestDB',
        version: 1,
        objectStoreName: 'mocks',
        keyPath: 'id',
        indexes: []
      };
      spyOn(ORMFactory, 'createDbContext').and.returnValue({
        open: jasmine.createSpy('open').and.returnValue(Promise.resolve()),
        close: jasmine.createSpy('close').and.returnValue(Promise.resolve())
      } as any);
      const initServicesSpy = spyOn<any>(presenter, 'initializeServices').and.returnValue(Promise.resolve());
      await presenter.handleCreateDatabase(config);
      expect(initServicesSpy).toHaveBeenCalled();
    });

    it('#Should-set-lastOperation-after-database-creation', async () => {
      const config = {
        name: 'TestDB',
        version: 1,
        objectStoreName: 'mocks',
        keyPath: 'id',
        indexes: []
      };
      spyOn(ORMFactory, 'createDbContext').and.returnValue({
        open: jasmine.createSpy('open').and.returnValue(Promise.resolve()),
        close: jasmine.createSpy('close').and.returnValue(Promise.resolve())
      } as any);
      spyOn<any>(presenter, 'initializeServices').and.returnValue(Promise.resolve());
      await presenter.handleCreateDatabase(config);
      expect(presenter.lastOperation()).toBe('Database created successfully');
    });

    it('#Should-throw-error-when-database-creation-fails', async () => {
      const config = {
        name: 'TestDB',
        version: 1,
        objectStoreName: 'mocks',
        keyPath: 'id',
        indexes: []
      };
      spyOn(ORMFactory, 'createDbContext').and.throwError('DB creation failed');
      try {
        await presenter.handleCreateDatabase(config);
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('Failed to create database');
      }
    });
  });

  describe('Delete Database', () => {
    it('#Should-call-indexedDB-deleteDatabase', async () => {
      const deleteSpy = jasmine.createSpy('deleteDatabase').and.returnValue({
        onsuccess: null,
        onerror: null,
        onblocked: null
      } as any);
      spyOn(indexedDB, 'deleteDatabase').and.callFake((dbName) => {
        const request = deleteSpy(dbName);
        setTimeout(() => request.onsuccess?.(), 0);
        return request;
      });
      await presenter.deleteDatabase('TestDB');
      expect(indexedDB.deleteDatabase).toHaveBeenCalledWith('TestDB');
    });

    it('#Should-update-databaseStatus-after-deletion', async () => {
      spyOn(indexedDB, 'deleteDatabase').and.returnValue({
        onsuccess: null,
        onerror: null,
        onblocked: null
      } as any);
      const deletePromise = presenter.deleteDatabase('TestDB');
      const request = (indexedDB.deleteDatabase as jasmine.Spy).calls.mostRecent().returnValue;
      request.onsuccess();
      await deletePromise;
      expect(presenter.databaseStatus().exists).toBe(false);
    });

    it('#Should-set-databaseConfig-to-null-after-deletion', async () => {
      spyOn(indexedDB, 'deleteDatabase').and.returnValue({
        onsuccess: null,
        onerror: null,
        onblocked: null
      } as any);
      const deletePromise = presenter.deleteDatabase('TestDB');
      const request = (indexedDB.deleteDatabase as jasmine.Spy).calls.mostRecent().returnValue;
      request.onsuccess();
      await deletePromise;
      expect(presenter.databaseConfig()).toBeNull();
    });

    it('#Should-reject-on-delete-error', async () => {
      spyOn(indexedDB, 'deleteDatabase').and.returnValue({
        onsuccess: null,
        onerror: null,
        onblocked: null,
        error: { message: 'Delete error' }
      } as any);
      const deletePromise = presenter.deleteDatabase('TestDB');
      const request = (indexedDB.deleteDatabase as jasmine.Spy).calls.mostRecent().returnValue;
      request.onerror();
      try {
        await deletePromise;
        fail('Should have rejected');
      } catch (e: any) {
        expect(e.message).toContain('Failed to delete database');
      }
    });
  });

  describe('Clear All Mocks', () => {
    it('#Should-call-clearAllMocks-on-service', async () => {
      mockHttpMockService.clearAllMocks.and.returnValue(Promise.resolve());
      await presenter.clearAllMocks();
      expect(mockHttpMockService.clearAllMocks).toHaveBeenCalled();
    });

    it('#Should-reset-currentMocks-to-empty', async () => {
      (presenter as any)._currentMocks.set([{ id: '1' } as HttpMockEntity]);
      mockHttpMockService.clearAllMocks.and.returnValue(Promise.resolve());
      await presenter.clearAllMocks();
      expect(presenter.currentMocks()).toEqual([]);
    });

    it('#Should-reset-statistics-to-empty', async () => {
      mockHttpMockService.clearAllMocks.and.returnValue(Promise.resolve());
      await presenter.clearAllMocks();
      expect(presenter.statistics()?.totalMocks).toBe(0);
    });

    it('#Should-reset-availableServiceCodes-to-empty', async () => {
      mockHttpMockService.clearAllMocks.and.returnValue(Promise.resolve());
      await presenter.clearAllMocks();
      expect(presenter.availableServiceCodes()).toEqual([]);
    });

    it('#Should-throw-error-when-service-not-initialized', async () => {
      (presenter as any).httpMockService = null;
      try {
        await presenter.clearAllMocks();
        fail('Should have thrown');
      } catch (e: any) {
        expect(e.message).toBe('HTTP Mock Service not initialized');
      }
    });
  });

  describe('Find Mock By Service Code', () => {
    it('#Should-call-findByServiceCode-on-repository', async () => {
      mockHttpMockRepository.findByServiceCode.and.returnValue(Promise.resolve([]));
      await presenter.findMockByServiceCode('TEST');
      expect(mockHttpMockRepository.findByServiceCode).toHaveBeenCalledWith('TEST');
    });

    it('#Should-return-first-mock-when-found', async () => {
      const mocks = [{ id: '1', name: 'Mock1' } as HttpMockEntity];
      mockHttpMockRepository.findByServiceCode.and.returnValue(Promise.resolve(mocks));
      const result = await presenter.findMockByServiceCode('TEST');
      expect(result).toEqual(mocks[0]);
    });

    it('#Should-return-null-when-no-mocks-found', async () => {
      mockHttpMockRepository.findByServiceCode.and.returnValue(Promise.resolve([]));
      const result = await presenter.findMockByServiceCode('TEST');
      expect(result).toBeNull();
    });

    it('#Should-return-null-on-error', async () => {
      mockHttpMockRepository.findByServiceCode.and.returnValue(Promise.reject(new Error('Find failed')));
      const result = await presenter.findMockByServiceCode('TEST');
      expect(result).toBeNull();
    });
  });

  describe('State Computed Property', () => {
    it('#Should-combine-all-state-properties', () => {
      const state = presenter.state();
      expect(state.isInitialized).toBe(false);
    });

    it('#Should-reflect-currentMocks-in-state', () => {
      const mocks = [{ id: '1' } as HttpMockEntity];
      (presenter as any)._currentMocks.set(mocks);
      expect(presenter.state().currentMocks).toEqual(mocks);
    });

    it('#Should-reflect-isLoading-in-state', () => {
      (presenter as any)._isLoading.set(true);
      expect(presenter.state().isLoading).toBe(true);
    });

    it('#Should-reflect-error-in-state', () => {
      (presenter as any)._error.set('Test error');
      expect(presenter.state().error).toBe('Test error');
    });

    it('#Should-reflect-selectedServiceCode-in-state', () => {
      (presenter as any)._selectedServiceCode.set('TEST');
      expect(presenter.state().selectedServiceCode).toBe('TEST');
    });

    it('#Should-reflect-lastOperation-in-state', () => {
      (presenter as any)._lastOperation.set('Test operation');
      expect(presenter.state().lastOperation).toBe('Test operation');
    });
  });

  describe('Events', () => {
    it('#Should-expose-onMockCreated-observable', () => {
      expect(presenter.events.onMockCreated).toBeDefined();
    });

    it('#Should-expose-onMockDeleted-observable', () => {
      expect(presenter.events.onMockDeleted).toBeDefined();
    });

    it('#Should-expose-onMocksLoaded-observable', () => {
      expect(presenter.events.onMocksLoaded).toBeDefined();
    });

    it('#Should-expose-onError-observable', () => {
      expect(presenter.events.onError).toBeDefined();
    });

    it('#Should-expose-onStateChanged-observable', () => {
      expect(presenter.events.onStateChanged).toBeDefined();
    });

    it('#Should-emit-mockCreated-event-on-creation', async () => {
      const mockSchema = {
        nameMock: 'Test',
        serviceCode: 'TEST',
        url: '/test',
        httpMethod: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 0,
        headers: {}
      } as MockSchema;
      const createdMock = { id: '1', ...mockSchema, responseBody: '{}' } as any as HttpMockEntity;
      mockHttpMockService.createMock.and.returnValue(Promise.resolve(createdMock));
      spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      let emittedMock: HttpMockEntity | undefined;
      presenter.events.onMockCreated.subscribe(mock => emittedMock = mock);
      await presenter.handleSaveMockSchema(mockSchema);
      expect(emittedMock).toEqual(createdMock);
    });

    it('#Should-emit-mockDeleted-event-on-deletion', async () => {
      mockHttpMockService.deleteMock.and.returnValue(Promise.resolve(true));
      spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      let emittedId: string | undefined;
      presenter.events.onMockDeleted.subscribe(id => emittedId = id);
      await presenter.handleDeleteMock('1');
      expect(emittedId).toBe('1');
    });

    it('#Should-emit-mocksLoaded-event-on-load', async () => {
      const mocks = [{ id: '1', name: 'Mock1' } as HttpMockEntity];
      (mockHttpMockService.mocks as unknown as WritableSignal<HttpMockEntity[]>).set(mocks);
      mockHttpMockService.loadMocksByServiceCode.and.returnValue(Promise.resolve());
      spyOn(presenter, 'refreshStatistics').and.returnValue(Promise.resolve());
      let emittedMocks: HttpMockEntity[] | undefined;
      presenter.events.onMocksLoaded.subscribe(m => emittedMocks = m);
      await presenter.handleLoadMocksByServiceCode('TEST');
      expect(emittedMocks).toEqual(mocks);
    });

    it('#Should-emit-error-event-on-failure', async () => {
      mockHttpMockService.deleteMock.and.returnValue(Promise.resolve(false));
      let emittedError: string | undefined;
      presenter.events.onError.subscribe(err => emittedError = err);
      await presenter.handleDeleteMock('1');
      expect(emittedError).toBeTruthy();
    });
  });

  describe('Component Cleanup', () => {
    it('#Should-complete-destroy-subject-on-ngOnDestroy', () => {
      const destroySpy = spyOn((presenter as any).destroy$, 'complete');
      presenter.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('#Should-complete-mockCreated-subject-on-ngOnDestroy', () => {
      const spy = spyOn((presenter as any).mockCreated$, 'complete');
      presenter.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('#Should-complete-mockDeleted-subject-on-ngOnDestroy', () => {
      const spy = spyOn((presenter as any).mockDeleted$, 'complete');
      presenter.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('#Should-complete-mocksLoaded-subject-on-ngOnDestroy', () => {
      const spy = spyOn((presenter as any).mocksLoaded$, 'complete');
      presenter.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('#Should-complete-error-subject-on-ngOnDestroy', () => {
      const spy = spyOn((presenter as any).error$, 'complete');
      presenter.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });

    it('#Should-complete-stateChanged-subject-on-ngOnDestroy', () => {
      const spy = spyOn((presenter as any).stateChanged$, 'complete');
      presenter.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Load Default Database Config', () => {
    it('#Should-call-ORMFactory-getDefaultHttpMocksConfig', async () => {
      spyOn(ORMFactory, 'getDefaultHttpMocksConfig').and.returnValue({
        name: 'TestDB',
        version: 1,
        objectStores: [{
          name: 'mocks',
          options: { keyPath: 'id' },
          indexes: []
        }]
      });
      await presenter.loadDefaultDatabaseConfig();
      expect(ORMFactory.getDefaultHttpMocksConfig).toHaveBeenCalled();
    });

    it('#Should-update-databaseConfig-signal', async () => {
      spyOn(ORMFactory, 'getDefaultHttpMocksConfig').and.returnValue({
        name: 'TestDB',
        version: 1,
        objectStores: [{
          name: 'mocks',
          options: { keyPath: 'id' },
          indexes: []
        }]
      });
      await presenter.loadDefaultDatabaseConfig();
      expect(presenter.databaseConfig()?.name).toBe('TestDB');
    });

    it('#Should-set-lastOperation-after-loading-config', async () => {
      spyOn(ORMFactory, 'getDefaultHttpMocksConfig').and.returnValue({
        name: 'TestDB',
        version: 1,
        objectStores: [{
          name: 'mocks',
          options: { keyPath: 'id' },
          indexes: []
        }]
      });
      await presenter.loadDefaultDatabaseConfig();
      expect(presenter.lastOperation()).toBe('Default database configuration loaded');
    });

    it('#Should-set-error-when-loading-config-fails', async () => {
      spyOn(ORMFactory, 'getDefaultHttpMocksConfig').and.throwError('Config error');
      await presenter.loadDefaultDatabaseConfig();
      expect(presenter.error()).toBeTruthy();
    });
  });

  describe('checkDatabaseExists', () => {
    let defaultConfig: any;
    let mockDbContext: any;

    beforeEach(() => {
      defaultConfig = { name: 'TestDB', version: 1, objectStoreName: 'mocks', keyPath: 'id', indexes: [] };
      spyOn(ORMFactory, 'getDefaultHttpMocksConfig').and.returnValue(defaultConfig);
    });

    it('should return exists: false, isInitialized: false if DB does not exist', async () => {
      // Arrange
      spyOn<any>(presenter, 'isDatabasePresent').and.returnValue(Promise.resolve(false));

      // Act
      const result = await presenter.checkDatabaseExists();

      // Assert
      expect(result).toEqual({ exists: false, isInitialized: false });
    });

    it('should return exists: true, isInitialized: true if DB exists and initializes', async () => {
      // Arrange
      spyOn<any>(presenter, 'isDatabasePresent').and.returnValue(Promise.resolve(true));
      mockDbContext = {
        open: jasmine.createSpy('open').and.returnValue(Promise.resolve()),
        close: jasmine.createSpy('close').and.returnValue(Promise.resolve())
      };
      spyOn(ORMFactory, 'createDbContext').and.returnValue(mockDbContext);

      // Act
      const result = await presenter.checkDatabaseExists();

      // Assert
      expect(result).toEqual({ exists: true, isInitialized: true, config: defaultConfig });
    });

    it('should return exists: true, isInitialized: false and error if DB exists but fails to initialize', async () => {
      // Arrange
      spyOn<any>(presenter, 'isDatabasePresent').and.returnValue(Promise.resolve(true));
      mockDbContext = {
        open: jasmine.createSpy('open').and.returnValue(Promise.reject('open error')),
        close: jasmine.createSpy('close').and.returnValue(Promise.resolve())
      };
      spyOn(ORMFactory, 'createDbContext').and.returnValue(mockDbContext);

      // Act
      const result = await presenter.checkDatabaseExists();

      // Assert
      expect(result.exists).toBe(true);
      // Only one expect per it: check isInitialized is false
      // (error property is checked in next it)
      expect(result.isInitialized).toBe(false);
    });

    it('should return error property if DB exists but fails to initialize', async () => {
      // Arrange
      spyOn<any>(presenter, 'isDatabasePresent').and.returnValue(Promise.resolve(true));
      mockDbContext = {
        open: jasmine.createSpy('open').and.returnValue(Promise.reject('open error')),
        close: jasmine.createSpy('close').and.returnValue(Promise.resolve())
      };
      spyOn(ORMFactory, 'createDbContext').and.returnValue(mockDbContext);

      // Act
      const result = await presenter.checkDatabaseExists();

      // Assert
      expect(result.error).toContain('Database exists but failed to initialize');
    });

    it('should return exists: false, isInitialized: false and error if general error occurs', async () => {
      // Arrange
      spyOn<any>(presenter, 'isDatabasePresent').and.throwError('unexpected');

      // Act
      const result = await presenter.checkDatabaseExists();

      // Assert
      expect(result.exists).toBe(false);
    });

    it('should return error property if general error occurs', async () => {
      // Arrange
      spyOn<any>(presenter, 'isDatabasePresent').and.throwError('unexpected');

      // Act
      const result = await presenter.checkDatabaseExists();

      // Assert
      expect(result.error).toContain('Error checking database');
    });
  });

  describe('isDatabasePresent', () => {
    const dbName = 'TestDB';
    beforeEach(() => {
      presenter = TestBed.inject(HttpMockManagerPresenter);
    });

    it('should return false if window.indexedDB is not available', async () => {
      const spy = spyOnProperty(window, 'indexedDB', 'get').and.returnValue(undefined as unknown as IDBFactory);
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
      spy.and.callThrough();
    });

    it('should return false if indexedDB.databases returns empty array', async () => {
      (window as any).indexedDB.databases = jasmine.createSpy().and.returnValue(Promise.resolve([]));
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });

    it('should return false if targetDb is not found', async () => {
      (window as any).indexedDB.databases = jasmine.createSpy().and.returnValue(Promise.resolve([{ name: 'OtherDB', version: 1 }]));
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });

    it('should return false if openRequest.onerror is called (databases API)', async () => {
      (window as any).indexedDB.databases = jasmine.createSpy().and.returnValue(Promise.resolve([{ name: dbName, version: 1 }]));
      spyOn(window.indexedDB, 'open').and.callFake(() => {
        const req = {
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
          onblocked: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          readyState: 'done',
          result: undefined,
          error: null,
          source: undefined,
          transaction: null
        } as unknown as IDBOpenDBRequest;
        setTimeout(() => { if (typeof req.onerror === 'function') req.onerror(new Event('error')); }, 0);
        Object.defineProperty(req, 'onerror', {
          set(fn) { setTimeout(fn, 0); }
        });
        return req as IDBOpenDBRequest;
      });
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });

    it('should return true if db has object stores (databases API)', async () => {
      (window as any).indexedDB.databases = jasmine.createSpy().and.returnValue(Promise.resolve([{ name: dbName, version: 1 }]));
      spyOn(window.indexedDB, 'open').and.callFake(() => {
        let onsuccess: ((ev: any) => void) | undefined;
        const req = {
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
          onblocked: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          readyState: 'done',
          result: undefined,
          error: null,
          source: undefined,
          transaction: null
        } as unknown as IDBOpenDBRequest;
        const fakeDb = { objectStoreNames: { length: 1 }, close: () => { } };
        setTimeout(() => { if (typeof onsuccess === 'function') onsuccess({ target: { result: fakeDb } }); }, 0);
        Object.defineProperty(req, 'onsuccess', {
          set(fn) { onsuccess = fn; }
        });
        return req as IDBOpenDBRequest;
      });
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(true);
    });

    it('should return false if db has no object stores (databases API)', async () => {
      (window as any).indexedDB.databases = jasmine.createSpy().and.returnValue(Promise.resolve([{ name: dbName, version: 1 }]));
      spyOn(window.indexedDB, 'open').and.callFake(() => {
        let onsuccess: ((ev: any) => void) | undefined;
        const req = {
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
          onblocked: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          readyState: 'done',
          result: undefined,
          error: null,
          source: undefined,
          transaction: null
        } as unknown as IDBOpenDBRequest;
        const fakeDb = { objectStoreNames: { length: 0 }, close: () => { } };
        setTimeout(() => { if (typeof onsuccess === 'function') onsuccess({ target: { result: fakeDb } }); }, 0);
        Object.defineProperty(req, 'onsuccess', {
          set(fn) { onsuccess = fn; }
        });
        return req as IDBOpenDBRequest;
      });
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });

    it('should return false if openRequest.onupgradeneeded is called (databases API)', async () => {
      Object.defineProperty(window.indexedDB, 'databases', {
        value: jasmine.createSpy().and.returnValue(Promise.resolve([{ name: dbName, version: 1 }])),
        writable: true,
        configurable: true
      });
      spyOn(window.indexedDB, 'open').and.callFake(() => {
        let onupgradeneeded: (() => void) | undefined;
        const req = {
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
          onblocked: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          readyState: 'done',
          result: {
            name: dbName,
            version: 1,
            objectStoreNames: { length: 0, contains: () => false, item: () => null },
            close: () => { },
            onabort: null,
            onclose: null,
            onerror: null,
            onversionchange: null,
            createObjectStore: () => { throw new Error('not implemented'); },
            deleteObjectStore: () => { throw new Error('not implemented'); },
            transaction: () => { throw new Error('not implemented'); },
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => false
          } as unknown as IDBDatabase,
          error: null,
          source: undefined,
          transaction: null
        } as unknown as IDBOpenDBRequest;
        setTimeout(() => { if (typeof onupgradeneeded === 'function') onupgradeneeded(); }, 0);
        Object.defineProperty(req, 'onupgradeneeded', {
          set(fn) { onupgradeneeded = fn; }
        });
        return req as IDBOpenDBRequest;
      });
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });

    it('should return true if db has object stores (fallback)', async () => {
      Object.defineProperty(window.indexedDB, 'databases', {
        value: undefined,
        configurable: true
      });
      spyOn(window.indexedDB, 'open').and.callFake(() => {
        let onsuccess: ((ev: any) => void) | undefined;
        const fakeDb = {
          objectStoreNames: ['store1'],
          close: () => { }
        };
        const req = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          readyState: 'done',
          result: fakeDb,
          error: null,
          source: undefined,
          transaction: null,
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
          onblocked: null
        } as unknown as IDBOpenDBRequest;
        setTimeout(() => {
          if (req.onsuccess) req.onsuccess({ target: req } as any);
        }, 0);
        return req as IDBOpenDBRequest;
      });
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(true);
    });

    it('should return false if db has no object stores (fallback)', async () => {
      delete (window as any).indexedDB.databases;
      spyOn(window.indexedDB, 'open').and.callFake(() => {
        let onsuccess: ((ev: any) => void) | undefined;
        const req = {
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
          onblocked: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          readyState: 'done',
          result: undefined,
          error: null,
          source: undefined,
          transaction: null
        } as unknown as IDBOpenDBRequest;
        // Usar un array real vacío, sin métodos extra
        const fakeDb = {
          objectStoreNames: [],
          close: () => { }
        };
        setTimeout(() => {
          if (typeof onsuccess === 'function') onsuccess({ target: { result: fakeDb } });
        }, 0);
        Object.defineProperty(req, 'onsuccess', {
          set(fn) { onsuccess = fn; }
        });
        return req as IDBOpenDBRequest;
      });
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });

    it('should return false if openRequest.onerror is called (fallback)', async () => {
      delete (window as any).indexedDB.databases;
      spyOn(window.indexedDB, 'open').and.callFake(() => {
        const req = {
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
          onblocked: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          readyState: 'done',
          result: undefined,
          error: null,
          source: undefined,
          transaction: null
        } as unknown as IDBOpenDBRequest;
        setTimeout(() => { if (typeof req.onerror === 'function') req.onerror(new Event('error')); }, 0);
        Object.defineProperty(req, 'onerror', {
          set(fn) { setTimeout(fn, 0); }
        });
        return req as IDBOpenDBRequest;
      });
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });

    it('should return false if openRequest.onupgradeneeded is called (fallback)', async () => {
      delete (window as any).indexedDB.databases;
      spyOn(window.indexedDB, 'open').and.callFake(() => {
        let onupgradeneeded: (() => void) | undefined;
        const req = {
          addEventListener: () => { },
          removeEventListener: () => { },
          dispatchEvent: () => false,
          onblocked: null,
          onerror: null,
          onsuccess: null,
          onupgradeneeded: null,
          readyState: 'done',
          result: undefined,
          error: null,
          source: undefined,
          transaction: null
        } as unknown as IDBOpenDBRequest;
        setTimeout(() => { if (typeof onupgradeneeded === 'function') onupgradeneeded(); }, 0);
        Object.defineProperty(req, 'onupgradeneeded', {
          set(fn) { onupgradeneeded = fn; }
        });
        return req as IDBOpenDBRequest;
      });
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });

    it('should return false if an exception is thrown', async () => {
      spyOnProperty(window, 'indexedDB', 'get').and.throwError('fail');
      const result = await presenter.isDatabasePresent(dbName);
      expect(result).toBe(false);
    });
  });

  describe('emitValidationMessage', () => {
    it('should emit success message with text', async () => {
      const emittedValues: any[] = [];
      presenter.events.onValidationMessage.subscribe(value => emittedValues.push(value));
      presenter.emitValidationMessage('success', 'Test message');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(emittedValues).toEqual([{ type: 'success', text: 'Test message', durationMs: undefined }]);
    });

    it('should emit error message with text', async () => {
      const emittedValues: any[] = [];
      presenter.events.onValidationMessage.subscribe(value => emittedValues.push(value));
      presenter.emitValidationMessage('error', 'Error message');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(emittedValues).toEqual([{ type: 'error', text: 'Error message', durationMs: undefined }]);
    });

    it('should emit warning message with text', async () => {
      const emittedValues: any[] = [];
      presenter.events.onValidationMessage.subscribe(value => emittedValues.push(value));
      presenter.emitValidationMessage('warning', 'Warning message');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(emittedValues).toEqual([{ type: 'warning', text: 'Warning message', durationMs: undefined }]);
    });

    it('should emit info message with text', async () => {
      const emittedValues: any[] = [];
      presenter.events.onValidationMessage.subscribe(value => emittedValues.push(value));
      presenter.emitValidationMessage('info', 'Info message');
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(emittedValues).toEqual([{ type: 'info', text: 'Info message', durationMs: undefined }]);
    });

    it('should emit message with durationMs', async () => {
      const emittedValues: any[] = [];
      presenter.events.onValidationMessage.subscribe(value => emittedValues.push(value));
      presenter.emitValidationMessage('success', 'Test message', 5000);
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(emittedValues).toEqual([{ type: 'success', text: 'Test message', durationMs: 5000 }]);
    });
  });

  describe('initializeServices', () => {
    let mockDbContext: jasmine.SpyObj<any>;
    let mockRepository: jasmine.SpyObj<HttpMockRepository>;

    beforeEach(() => {
      mockDbContext = jasmine.createSpyObj('DbContext', ['open']);
      mockRepository = jasmine.createSpyObj('HttpMockRepository', ['findByServiceCode', 'getAll', 'create', 'update', 'delete', 'findAll', 'getStatistics']);

      (window as any).HttpMockService = HttpMockService;
      spyOn(presenter as any, 'loadDefaultDatabaseConfig');
      spyOn(presenter as any, 'refreshStatistics');
      spyOn(presenter as any, 'setLastOperation');
      spyOn(ORMFactory, 'getDefaultHttpMocksConfig').and.returnValue({ name: 'TestDB', version: 1, objectStores: [] });
      spyOn(ORMFactory, 'createDbContext').and.returnValue(mockDbContext);
      spyOn(ORMFactory, 'createHttpMockRepository').and.returnValue(mockRepository);
      spyOn(presenter['_databaseStatus'], 'update');
      spyOn(window as any, 'HttpMockService').and.callFake(() => mockHttpMockService);
    });

    it('should initialize services successfully', async () => {
      mockDbContext.open.and.resolveTo();
      await (presenter as any).initializeServices();
      expect((presenter as any).loadDefaultDatabaseConfig).toHaveBeenCalled();
    });

    it('should create db context and open it', async () => {
      mockDbContext.open.and.resolveTo();
      await (presenter as any).initializeServices();
      expect(ORMFactory.createDbContext).toHaveBeenCalled();
    });

    it('should create repository and service', async () => {
      mockDbContext.open.and.resolveTo();
      await (presenter as any).initializeServices();
      expect(ORMFactory.createHttpMockRepository).toHaveBeenCalledWith(mockDbContext);
    });

    it('should update database status', async () => {
      mockDbContext.open.and.resolveTo();
      await (presenter as any).initializeServices();
      expect(presenter['_databaseStatus'].update).toHaveBeenCalled();
    });

    it('should set last operation on success', async () => {
      mockDbContext.open.and.resolveTo();
      await (presenter as any).initializeServices();
      expect((presenter as any).setLastOperation).toHaveBeenCalledWith('Services initialized successfully');
    });

    it('should throw error when loadDefaultDatabaseConfig fails', async () => {
      (presenter as any).loadDefaultDatabaseConfig.and.throwError(new Error('Config error'));
      await expectAsync((presenter as any).initializeServices()).toBeRejectedWith(new Error('Failed to initialize services: Error: Config error'));
    });

    it('should throw error when dbContext.open fails', async () => {
      mockDbContext.open.and.rejectWith(new Error('DB open error'));
      await expectAsync((presenter as any).initializeServices()).toBeRejectedWith(new Error('Failed to initialize services: Error: DB open error'));
    });

    it('should throw error when refreshStatistics fails', async () => {
      mockDbContext.open.and.resolveTo();
      (presenter as any).refreshStatistics.and.throwError(new Error('Stats error'));
      await expectAsync((presenter as any).initializeServices()).toBeRejectedWith(new Error('Failed to initialize services: Error: Stats error'));
    });
  });

});
