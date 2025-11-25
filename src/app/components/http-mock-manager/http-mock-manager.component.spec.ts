import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpMockManagerComponent } from './http-mock-manager.component';
import { signal, provideZonelessChangeDetection, WritableSignal } from '@angular/core';
import { ContextOption } from '../interfaces';
import { HttpMockEntity, ServiceCodeWithStats } from 'src/core';

describe('HttpMockManagerComponent', () => {
  let component: HttpMockManagerComponent;
  let fixture: ComponentFixture<HttpMockManagerComponent>;
  let mockPresenter: any;

  beforeEach(async () => {
    const presenterSpy = jasmine.createSpyObj('HttpMockManagerPresenter', [
      'initialize',
      'loadAvailableServiceCodes',
      'handleContextTypeChange',
      'handleSaveMockSchema',
      'handleUpdateMockSchema',
      'handleSaveMockBody',
      'handleSaveHeaders',
      'handleLoadMocksByServiceCode',
      'handleLoadMocksByServiceCodeWithAutoPopulation',
      'handleDeleteMock',
      'handleExportAllMocks',
      'handleCreateDatabase',
      'handleImportMocks',
      'deleteDatabase',
      'clearAllMocks',
      'refreshStatistics',
      'loadDefaultDatabaseConfig',
      'findMockByServiceCode',
      'shouldShowDatabaseSetup',
      'shouldShowManagementTabs',
      'ngOnDestroy'
    ]);

    presenterSpy.currentMocks = signal([]) as WritableSignal<HttpMockEntity[]>;
    presenterSpy.isLoading = signal(false) as WritableSignal<boolean>;
    presenterSpy.statistics = signal(null) as WritableSignal<any>;
    presenterSpy.error = signal(null) as WritableSignal<string | null>;
    presenterSpy.lastOperation = signal(null) as WritableSignal<string | null>;
    presenterSpy.availableServiceCodes = signal([]) as WritableSignal<ServiceCodeWithStats[]>;
    presenterSpy.databaseStatus = signal({ exists: true, isInitialized: true }) as WritableSignal<any>;
    presenterSpy.databaseConfig = signal({ name: 'TestDB', version: 1, objectStoreName: 'mocks', keyPath: 'id', indexes: [] }) as WritableSignal<any>;
    presenterSpy.events = {
      onMockCreated: { subscribe: jasmine.createSpy('subscribe') },
      onMockDeleted: { subscribe: jasmine.createSpy('subscribe') },
      onMocksLoaded: { subscribe: jasmine.createSpy('subscribe') },
      onError: { subscribe: jasmine.createSpy('subscribe') }
    };

    presenterSpy.initialize.and.returnValue(Promise.resolve());
    presenterSpy.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
    presenterSpy.shouldShowDatabaseSetup.and.returnValue(false);
    presenterSpy.shouldShowManagementTabs.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [HttpMockManagerComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(HttpMockManagerComponent);
    component = fixture.componentInstance;
    mockPresenter = presenterSpy;
    (component as any).presenter = mockPresenter;
  });

  describe('Component Initialization', () => {
    it('#Should-initialize-component-with-default-values', () => {
      expect(component.showForm()).toBe(true);
    });

    it('#Should-set-default-context-options', () => {
      expect(component.contextOptions.length).toBe(3);
    });

    it('#Should-initialize-http-methods-array', () => {
      expect(component.httpMethods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);
    });

    it('#Should-initialize-http-code-response-array', () => {
      expect(component.httpCodeResponse).toEqual([200, 204, 400, 500]);
    });

    it('#Should-set-default-position', () => {
      expect(component.position()).toEqual({ bottom: 32, right: 32 });
    });

    it('#Should-initialize-activeGroup-as-data', () => {
      expect(component.activeGroup()).toBe('data');
    });

    it('#Should-initialize-activeSubTab-as-zero', () => {
      expect(component.activeSubTab()).toBe(0);
    });

    it('#Should-initialize-headers-as-empty-object', () => {
      expect(component.headers).toEqual({});
    });

    it('#Should-set-default-delayMs-to-1000', () => {
      expect(component.delayMs).toBe(1000);
    });

    it('#Should-set-default-httpMethod-to-GET', () => {
      expect(component.httpMethod).toBe('GET');
    });

    it('#Should-set-default-httpCodeResponseValue-to-200', () => {
      expect(component.httpCodeResponseValue).toBe(200);
    });

    it('#Should-initialize-dbVersion-to-1', () => {
      expect(component.dbVersion).toBe(1);
    });

    it('#Should-initialize-dbIndexes-as-empty-array', () => {
      expect(component.dbIndexes).toEqual([]);
    });

    it('#Should-initialize-showDeleteConfirmation-as-false', () => {
      expect(component.showDeleteConfirmation).toBe(false);
    });

    it('#Should-initialize-showSaveConfirmation-signal-as-false', () => {
      expect(component.showSaveConfirmation()).toBe(false);
    });

    it('#Should-initialize-jsonValidationMessage-as-null', () => {
      expect(component.jsonValidationMessage()).toBeNull();
    });

    it('#Should-initialize-selectedServiceCodeForLoad-as-empty-string', () => {
      expect(component.selectedServiceCodeForLoad).toBe('');
    });

    it('#Should-call-presenter-initialize-on-ngOnInit', async () => {
      await component.ngOnInit();
      
      expect(mockPresenter.initialize).toHaveBeenCalled();
    });

    it('#Should-load-available-service-codes-on-init', async () => {
      await component.ngOnInit();
      
      expect(mockPresenter.loadAvailableServiceCodes).toHaveBeenCalled();
    });

    it('#Should-initialize-selectedContext-if-undefined', async () => {
      component.selectedContext = undefined;
      
      await component.ngOnInit();
      
      expect(component.selectedContext!).toEqual(component.contextOptions[0]);
    });

    it('#Should-copy-contextOptions-to-state', async () => {
      await component.ngOnInit();
      
      expect(component.contextOptionsState().length).toBe(3);
    });
  });

  describe('Form Toggle', () => {
    it('#Should-toggle-showForm-from-true-to-false', () => {
      component.showForm.set(true);
      
      component.toggleForm();
      
      expect(component.showForm()).toBe(false);
    });

    it('#Should-toggle-showForm-from-false-to-true', () => {
      component.showForm.set(false);
      
      component.toggleForm();
      
      expect(component.showForm()).toBe(true);
    });
  });

  describe('Context Management', () => {
    it('#Should-change-selected-context', () => {
      const option: ContextOption = { id: 2, value: 'Usar HTTP', useMock: false };
      component.contextOptionsState.set([...component.contextOptions]);
      
      component.onContextTypeChange('2');
      
      expect(component.selectedContext).toEqual(option);
    });

    it('#Should-call-presenter-handleContextTypeChange', () => {
      component.contextOptionsState.set([...component.contextOptions]);
      
      component.onContextTypeChange('2');
      
      expect(mockPresenter.handleContextTypeChange).toHaveBeenCalled();
    });

    it('#Should-emit-contextTypeChangeEvent', (done) => {
      component.contextOptionsState.set([...component.contextOptions]);
      component.contextTypeChangeEvent.subscribe(context => {
        expect(context.id).toBe(2);
        done();
      });
      
      component.onContextTypeChange('2');
    });

    it('#Should-emit-reloadEvent-on-context-change', (done) => {
      component.contextOptionsState.set([...component.contextOptions]);
      component.reloadEvent.subscribe(() => {
        expect(true).toBe(true);
        done();
      });
      
      component.onContextTypeChange('2');
    });
  });

  describe('Navigation', () => {
    it('#Should-set-active-group-to-http', () => {
      component.setActiveGroup('http');
      
      expect(component.activeGroup()).toBe('http');
    });

    it('#Should-set-active-group-to-persistence', () => {
      component.setActiveGroup('persistence');
      
      expect(component.activeGroup()).toBe('persistence');
    });

    it('#Should-reset-sub-tab-when-changing-group', () => {
      component.activeSubTab.set(2);
      
      component.setActiveGroup('http');
      
      expect(component.activeSubTab()).toBe(0);
    });

    it('#Should-set-active-sub-tab', () => {
      component.setActiveSubTab(2);
      
      expect(component.activeSubTab()).toBe(2);
    });
  });

  describe('Headers Management', () => {
    it('#Should-add-new-header', () => {
      component.newHeaderKey.set('Content-Type');
      component.newHeaderValue.set('application/json');
      
      component.addHeader();
      
      expect(component.headers['Content-Type']).toBe('application/json');
    });

    it('#Should-clear-header-inputs-after-adding', () => {
      component.newHeaderKey.set('Authorization');
      component.newHeaderValue.set('Bearer token');
      
      component.addHeader();
      
      expect(component.newHeaderKey()).toBe('');
    });

    it('#Should-not-add-header-with-empty-key', () => {
      component.newHeaderKey.set('');
      component.newHeaderValue.set('value');
      const initialLength = Object.keys(component.headers).length;
      
      component.addHeader();
      
      expect(Object.keys(component.headers).length).toBe(initialLength);
    });

    it('#Should-trim-header-key-before-adding', () => {
      component.newHeaderKey.set('  Accept  ');
      component.newHeaderValue.set('*/*');
      
      component.addHeader();
      
      expect(component.headers['Accept']).toBe('*/*');
    });

    it('#Should-edit-existing-header', () => {
      component.headers = { 'Content-Type': 'text/plain' };
      
      component.editHeader('Content-Type');
      
      expect(component.newHeaderKey()).toBe('Content-Type');
    });

    it('#Should-set-editing-header-key', () => {
      component.headers = { 'Authorization': 'Bearer old' };
      
      component.editHeader('Authorization');
      
      expect(component.editingHeaderKey()).toBe('Authorization');
    });

    it('#Should-remove-header', () => {
      component.headers = { 'Accept': 'application/json' };
      
      component.removeHeader('Accept');
      
      expect(component.headers['Accept']).toBeUndefined();
    });

    it('#Should-cancel-edit-header', () => {
      component.newHeaderKey.set('Test');
      component.newHeaderValue.set('Value');
      component.editingHeaderKey.set('Test');
      
      component.cancelEditHeader();
      
      expect(component.editingHeaderKey()).toBeNull();
    });

    it('#Should-clear-inputs-when-canceling-edit', () => {
      component.newHeaderKey.set('Test');
      component.newHeaderValue.set('Value');
      
      component.cancelEditHeader();
      
      expect(component.newHeaderKey()).toBe('');
    });

    it('#Should-get-header-keys', () => {
      component.headers = { 'Accept': '*/*', 'Content-Type': 'application/json' };
      
      const keys = component.getHeaderKeys();
      
      expect(keys.length).toBe(2);
    });

    it('#Should-add-common-header-Content-Type', () => {
      component.addCommonHeader('Content-Type', 'application/json');
      
      expect(component.headers['Content-Type']).toBe('application/json');
    });

    it('#Should-not-add-duplicate-common-header', () => {
      component.headers = { 'Accept': 'text/html' };
      
      component.addCommonHeader('Accept', 'application/json');
      
      expect(component.headers['Accept']).toBe('text/html');
    });

    it('#Should-emit-saveHeadersEvent', (done) => {
      component.saveHeadersEvent.subscribe(headers => {
        expect(headers).toBeDefined();
        done();
      });
      component.newHeaderKey.set('Test-Header');
      component.newHeaderValue.set('test-value');
      
      component.addHeader();
    });

    it('#Should-cancel-edit-when-removing-edited-header', () => {
      component.headers = { 'Authorization': 'Bearer token' };
      component.editingHeaderKey.set('Authorization');
      
      component.removeHeader('Authorization');
      
      expect(component.editingHeaderKey()).toBeNull();
    });

    it('#Should-update-header-when-editing-with-same-key', () => {
      component.headers = { 'Accept': 'text/plain' };
      component.newHeaderKey.set('Accept');
      component.newHeaderValue.set('application/json');
      component.editingHeaderKey.set('Accept');
      
      component.addHeader();
      
      expect(component.headers['Accept']).toBe('application/json');
    });

    it('#Should-remove-old-key-when-editing-with-different-key', () => {
      component.headers = { 'OldKey': 'value' };
      component.newHeaderKey.set('NewKey');
      component.newHeaderValue.set('value');
      component.editingHeaderKey.set('OldKey');
      
      component.addHeader();
      
      expect(component.headers['OldKey']).toBeUndefined();
    });
  });

  describe('Database Indexes Management', () => {
    it('#Should-add-new-index', () => {
      component.newIndexName.set('serviceCode');
      component.newIndexKeyPath.set('serviceCode');
      
      component.addIndex();
      
      expect(component.dbIndexes.length).toBe(1);
    });

    it('#Should-not-add-index-with-empty-name', () => {
      component.newIndexName.set('');
      component.newIndexKeyPath.set('url');
      
      component.addIndex();
      
      expect(component.dbIndexes.length).toBe(0);
    });

    it('#Should-not-add-index-with-empty-keyPath', () => {
      component.newIndexName.set('method');
      component.newIndexKeyPath.set('');
      
      component.addIndex();
      
      expect(component.dbIndexes.length).toBe(0);
    });

    it('#Should-clear-index-inputs-after-adding', () => {
      component.newIndexName.set('url');
      component.newIndexKeyPath.set('url');
      
      component.addIndex();
      
      expect(component.newIndexName()).toBe('');
    });

    it('#Should-remove-index-by-name', () => {
      component.dbIndexes = [{ name: 'method', keyPath: 'method', unique: false }];
      
      component.removeIndex('method');
      
      expect(component.dbIndexes.length).toBe(0);
    });

    it('#Should-get-index-count', () => {
      component.dbIndexes = [
        { name: 'idx1', keyPath: 'field1', unique: false },
        { name: 'idx2', keyPath: 'field2', unique: false }
      ];
      
      const count = component.getIndexCount();
      
      expect(count).toBe(2);
    });

    it('#Should-update-existing-index', () => {
      component.dbIndexes = [{ name: 'url', keyPath: 'url', unique: false }];
      component.newIndexName.set('url');
      component.newIndexKeyPath.set('endpoint');
      
      component.addIndex();
      
      expect(component.dbIndexes[0].keyPath).toBe('endpoint');
    });

    it('#Should-trim-index-name-before-adding', () => {
      component.newIndexName.set('  method  ');
      component.newIndexKeyPath.set('method');
      
      component.addIndex();
      
      expect(component.dbIndexes[0].name).toBe('method');
    });
  });

  describe('JSON Validation', () => {
    it('#Should-validate-valid-json', () => {
      component.responseBody = '{"valid": true}';
      
      component.validateJson();
      
      expect(component.jsonValidationMessage()?.type).toBe('success');
    });

    it('#Should-reject-invalid-json', () => {
      component.responseBody = '{invalid json}';
      
      component.validateJson();
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
    });

    it('#Should-format-valid-json', () => {
      component.responseBody = '{"a":1,"b":2}';
      
      component.formatJson();
      
      expect(component.responseBody).toContain('\n');
    });

    it('#Should-not-format-invalid-json', () => {
      component.responseBody = '{invalid}';
      
      component.formatJson();
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
    });

    it('#Should-clear-validation-message-after-timeout', (done) => {
      component.responseBody = '{"test": true}';
      
      component.validateJson();
      
      setTimeout(() => {
        expect(component.jsonValidationMessage()).toBeNull();
        done();
      }, 3100);
    });
  });

  describe('Form Input Handling', () => {
    it('#Should-handle-number-input-for-delayMs', () => {
      const event = { target: { value: '2000' } } as any;
      
      component.onInputNumber(event, 'delayMs');
      
      expect(component.delayMs).toBe(2000);
    });

    it('#Should-set-zero-for-empty-number-input', () => {
      const event = { target: { value: '' } } as any;
      
      component.onInputNumber(event, 'delayMs');
      
      expect(component.delayMs).toBe(0);
    });
  });

  describe('Mock Operations', () => {
    it('#Should-load-mocks-by-service-code', async () => {
      mockPresenter.handleLoadMocksByServiceCode.and.returnValue(Promise.resolve());
      
      await component.loadMocksByServiceCode('testService');
      
      expect(mockPresenter.handleLoadMocksByServiceCode).toHaveBeenCalledWith('testService');
    });

    it('#Should-delete-mock-by-id', async () => {
      mockPresenter.handleDeleteMock.and.returnValue(Promise.resolve());
      
      await component.deleteMock('mock-123');
      
      expect(mockPresenter.handleDeleteMock).toHaveBeenCalledWith('mock-123');
    });

    it('#Should-edit-mock-and-populate-form', () => {
      const mock = {
        id: '1',
        name: 'Test Mock',
        serviceCode: 'test',
        url: '/api/test',
        method: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 500,
        responseBody: '{"test": true}'
      };
      
      component.editMock(mock);
      
      expect(component.nameMock).toBe('Test Mock');
    });

    it('#Should-change-to-http-group-when-editing-mock', () => {
      const mock = {
        name: 'Test',
        serviceCode: 'test',
        url: '/test',
        method: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 100,
        responseBody: '{}'
      };
      
      component.editMock(mock);
      
      expect(component.activeGroup()).toBe('http');
    });

    it('#Should-set-sub-tab-to-1-when-editing-mock', () => {
      const mock = {
        name: 'Test',
        serviceCode: 'test',
        url: '/test',
        method: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 1000,
        responseBody: '{}'
      };
      
      component.editMock(mock);
      
      expect(component.activeSubTab()).toBe(1);
    });
  });

  describe('Service Code Selection', () => {
    it('#Should-update-selectedServiceCodeForLoad', async () => {
      mockPresenter.handleLoadMocksByServiceCodeWithAutoPopulation.and.returnValue(Promise.resolve(null));
      
      await component.onServiceCodeSelectionChange('testService');
      
      expect(component.selectedServiceCodeForLoad).toBe('testService');
    });

    it('#Should-auto-populate-form-fields', async () => {
      const mockData = {
        name: 'Auto Mock',
        serviceCode: 'auto',
        url: '/auto',
        method: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 2000,
        headers: { 'Content-Type': 'application/json' },
        responseBody: '{"auto": true}'
      } as any as HttpMockEntity;
      mockPresenter.handleLoadMocksByServiceCodeWithAutoPopulation.and.returnValue(Promise.resolve(mockData));
      
      await component.onServiceCodeSelectionChange('auto');
      
      expect(component.nameMock).toBe('Auto Mock');
    });

    it('#Should-not-populate-if-no-mock-found', async () => {
      mockPresenter.handleLoadMocksByServiceCodeWithAutoPopulation.and.returnValue(Promise.resolve(null));
      component.nameMock = 'Original';
      
      await component.onServiceCodeSelectionChange('nonexistent');
      
      expect(component.nameMock).toBe('Original');
    });

    it('#Should-reset-headers-when-mock-has-no-headers', async () => {
      const mockData = {
        name: 'No Headers',
        serviceCode: 'test',
        url: '/test',
        method: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 1000,
        responseBody: '{}'
      } as any as HttpMockEntity;
      component.headers = { 'Old': 'header' };
      mockPresenter.handleLoadMocksByServiceCodeWithAutoPopulation.and.returnValue(Promise.resolve(mockData));
      
      await component.onServiceCodeSelectionChange('test');
      
      expect(Object.keys(component.headers).length).toBe(0);
    });
  });

  describe('Export Functionality', () => {
    it('#Should-export-mocks-successfully', async () => {
      const mocks = [{ id: '1', name: 'Mock1', serviceCode: 'test', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 1000, responseBody: '{}' }];
      mockPresenter.handleExportAllMocks.and.returnValue(Promise.resolve(mocks));
      
      await component.exportMocks();
      
      expect(mockPresenter.handleExportAllMocks).toHaveBeenCalled();
    });

    it('#Should-show-error-when-no-mocks-to-export', async () => {
      mockPresenter.handleExportAllMocks.and.returnValue(Promise.resolve([]));
      
      await component.exportMocks();
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
    });

    it('#Should-show-success-message-after-export', async () => {
      const mocks = [{ id: '1', name: 'M1', serviceCode: 's1', url: '/u1', method: 'GET', httpCodeResponseValue: 200, delayMs: 1000, responseBody: '{}' }];
      mockPresenter.handleExportAllMocks.and.returnValue(Promise.resolve(mocks));
      
      await component.exportMocks();
      
      expect(component.jsonValidationMessage()?.type).toBe('success');
    });
  });

  describe('Database Configuration', () => {
    it('#Should-create-database-with-config', async () => {
      component.dbName = 'TestDB';
      component.dbVersion = 1;
      component.dbObjectStoreName = 'mocks';
      component.dbKeyPath = 'id';
      mockPresenter.handleCreateDatabase.and.returnValue(Promise.resolve());
      
      await component.createDatabase();
      
      expect(mockPresenter.handleCreateDatabase).toHaveBeenCalled();
    });

    it('#Should-emit-databaseCreatedEvent', (done) => {
      component.dbName = 'TestDB';
      component.dbVersion = 1;
      component.dbObjectStoreName = 'mocks';
      component.dbKeyPath = 'id';
      mockPresenter.handleCreateDatabase.and.returnValue(Promise.resolve());
      component.databaseCreatedEvent.subscribe(() => {
        expect(true).toBe(true);
        done();
      });
      
      component.createDatabase();
    });

    it('#Should-load-default-database-config', () => {
      component.loadDefaultDatabaseConfig();
      
      expect(component.dbName).toBe('HttpMocksDB');
    });

    it('#Should-set-default-version', () => {
      component.loadDefaultDatabaseConfig();
      
      expect(component.dbVersion).toBe(1);
    });

    it('#Should-set-default-object-store-name', () => {
      component.loadDefaultDatabaseConfig();
      
      expect(component.dbObjectStoreName).toBe('httpMocks');
    });

    it('#Should-set-default-key-path', () => {
      component.loadDefaultDatabaseConfig();
      
      expect(component.dbKeyPath).toBe('id');
    });

    it('#Should-load-default-indexes', () => {
      component.loadDefaultDatabaseConfig();
      
      expect(component.dbIndexes.length).toBeGreaterThan(0);
    });
  });

  describe('Database Operations', () => {
    it('#Should-show-delete-confirmation-dialog', () => {
      component.confirmDeleteDatabase();
      
      expect(component.showDeleteConfirmation).toBe(true);
    });

    it('#Should-cancel-delete-confirmation', () => {
      component.showDeleteConfirmation = true;
      
      component.cancelDeleteDatabase();
      
      expect(component.showDeleteConfirmation).toBe(false);
    });

    it('#Should-execute-database-deletion', async () => {
      mockPresenter.deleteDatabase.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      component.showDeleteConfirmation = true;
      
      await component.executeDeleteDatabase();
      
      expect(mockPresenter.deleteDatabase).toHaveBeenCalled();
    });

    it('#Should-close-confirmation-after-deletion', async () => {
      mockPresenter.deleteDatabase.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      component.showDeleteConfirmation = true;
      
      await component.executeDeleteDatabase();
      
      expect(component.showDeleteConfirmation).toBe(false);
    });

    it('#Should-reinitialize-after-deletion', async () => {
      mockPresenter.deleteDatabase.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      
      await component.executeDeleteDatabase();
      
      expect(mockPresenter.initialize).toHaveBeenCalled();
    });

    it('#Should-reinitialize-database-system', async () => {
      mockPresenter.clearAllMocks.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      mockPresenter.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
      mockPresenter.loadDefaultDatabaseConfig.and.returnValue(Promise.resolve());
      
      await component.reinitializeDatabase();
      
      expect(mockPresenter.clearAllMocks).toHaveBeenCalled();
    });

    it('#Should-refresh-database-stats', async () => {
      mockPresenter.loadDefaultDatabaseConfig.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      mockPresenter.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
      
      await component.refreshDatabaseStats();
      
      expect(mockPresenter.refreshStatistics).toHaveBeenCalled();
    });
  });

  describe('Save Confirmation Dialog', () => {
    it('#Should-continue-editing', () => {
      component.showSaveConfirmation.set(true);
      
      component.continueEditing();
      
      expect(component.showSaveConfirmation()).toBe(false);
    });

    it('#Should-reset-form-on-create-new-record', () => {
      component.nameMock = 'Test';
      component.serviceCode = 'test';
      
      component.createNewRecord();
      
      expect(component.nameMock).toBe('');
    });

    it('#Should-close-confirmation-on-create-new', () => {
      component.showSaveConfirmation.set(true);
      
      component.createNewRecord();
      
      expect(component.showSaveConfirmation()).toBe(false);
    });

    it('#Should-reset-url-on-create-new-record', () => {
      component.url = '/old-url';
      
      component.createNewRecord();
      
      expect(component.url).toBe('');
    });

    it('#Should-reset-httpMethod-on-create-new-record', () => {
      component.httpMethod = 'POST';
      
      component.createNewRecord();
      
      expect(component.httpMethod).toBe('GET');
    });

    it('#Should-reset-responseBody-on-create-new-record', () => {
      component.responseBody = '{"old": true}';
      
      component.createNewRecord();
      
      expect(component.responseBody).toBe('{}');
    });

    it('#Should-reset-headers-on-create-new-record', () => {
      component.headers = { 'Content-Type': 'application/json' };
      
      component.createNewRecord();
      
      expect(Object.keys(component.headers).length).toBe(0);
    });
  });

  describe('Save Context', () => {
    it('#Should-save-context-for-http-group', async () => {
      component.activeGroup.set('http');
      component.nameMock = 'Test Mock';
      component.url = '/test';
      component.serviceCode = 'test';
      mockPresenter.findMockByServiceCode.and.returnValue(Promise.resolve(null));
      mockPresenter.handleSaveMockSchema.and.returnValue(Promise.resolve({ id: '1'  } as any as HttpMockEntity));
      mockPresenter.handleSaveMockBody.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      mockPresenter.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
      mockPresenter.loadDefaultDatabaseConfig.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      
      await component.saveContext();
      
      expect(mockPresenter.handleSaveMockSchema).toHaveBeenCalled();
    });

    it('#Should-not-save-with-empty-nameMock', async () => {
      component.activeGroup.set('http');
      component.nameMock = '';
      component.url = '/test';
      mockPresenter.handleSaveMockSchema.and.returnValue(Promise.resolve({ id: '1' } as any as HttpMockEntity));
      
      await component.saveContext();
      
      expect(mockPresenter.handleSaveMockSchema).not.toHaveBeenCalled();
    });

    it('#Should-not-save-with-empty-url', async () => {
      component.activeGroup.set('http');
      component.nameMock = 'Test';
      component.url = '';
      mockPresenter.handleSaveMockSchema.and.returnValue(Promise.resolve({ id: '1' } as any as HttpMockEntity));
      
      await component.saveContext();
      
      expect(mockPresenter.handleSaveMockSchema).not.toHaveBeenCalled();
    });

    it('#Should-update-existing-mock', async () => {
      component.activeGroup.set('http');
      component.nameMock = 'Test';
      component.url = '/test';
      component.serviceCode = 'existing';
      const existingMock = { id: 'existing-id', name: 'Old', serviceCode: 'existing', url: '/old', method: 'GET', httpCodeResponseValue: 200, delayMs: 1000, responseBody: '{}' } as any as HttpMockEntity;
      mockPresenter.findMockByServiceCode.and.returnValue(Promise.resolve(existingMock));
      mockPresenter.handleUpdateMockSchema.and.returnValue(Promise.resolve({ id: 'existing-id' } as any as HttpMockEntity));
      mockPresenter.handleSaveMockBody.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      mockPresenter.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
      mockPresenter.loadDefaultDatabaseConfig.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      
      await component.saveContext();
      
      expect(mockPresenter.handleUpdateMockSchema).toHaveBeenCalled();
    });

    it('#Should-show-success-message-after-save', async () => {
      component.activeGroup.set('http');
      component.nameMock = 'Success Test';
      component.url = '/success';
      mockPresenter.findMockByServiceCode.and.returnValue(Promise.resolve(null));
      mockPresenter.handleSaveMockSchema.and.returnValue(Promise.resolve({ id: 'new-id' } as any as HttpMockEntity));
      mockPresenter.handleSaveMockBody.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      mockPresenter.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
      mockPresenter.loadDefaultDatabaseConfig.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      
      await component.saveContext();
      
      expect(component.jsonValidationMessage()?.type).toBe('success');
    });

    it('#Should-show-save-confirmation-after-successful-save', async () => {
      component.activeGroup.set('http');
      component.nameMock = 'Confirm Test';
      component.url = '/confirm';
      mockPresenter.findMockByServiceCode.and.returnValue(Promise.resolve(null));
      mockPresenter.handleSaveMockSchema.and.returnValue(Promise.resolve({ id: 'confirm-id' } as any as HttpMockEntity));
      mockPresenter.handleSaveMockBody.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      mockPresenter.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
      mockPresenter.loadDefaultDatabaseConfig.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      
      await component.saveContext();
      
      expect(component.showSaveConfirmation()).toBe(true);
    });

    it('#Should-emit-saveMockSchemaEvent', async () => {
      component.activeGroup.set('http');
      component.nameMock = 'Event Test';
      component.url = '/event';
      mockPresenter.findMockByServiceCode.and.returnValue(Promise.resolve(null));
      mockPresenter.handleSaveMockSchema.and.returnValue(Promise.resolve({ id: 'event-id' } as any as HttpMockEntity));
      mockPresenter.handleSaveMockBody.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      mockPresenter.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
      mockPresenter.loadDefaultDatabaseConfig.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      let emittedSchema: any = null;
      component.saveMockSchemaEvent.subscribe(schema => {
        emittedSchema = schema;
      });
      
      await component.saveContext();
      
      expect(emittedSchema.nameMock).toBe('Event Test');
    });

    it('#Should-save-mock-body-after-schema', async () => {
      component.activeGroup.set('http');
      component.nameMock = 'Body Test';
      component.url = '/body';
      component.responseBody = '{"body": true}';
      mockPresenter.findMockByServiceCode.and.returnValue(Promise.resolve(null));
      mockPresenter.handleSaveMockSchema.and.returnValue(Promise.resolve({ id: 'body-id' } as any as HttpMockEntity));
      mockPresenter.handleSaveMockBody.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      mockPresenter.loadAvailableServiceCodes.and.returnValue(Promise.resolve());
      mockPresenter.loadDefaultDatabaseConfig.and.returnValue(Promise.resolve());
      mockPresenter.initialize.and.returnValue(Promise.resolve());
      
      await component.saveContext();
      
      expect(mockPresenter.handleSaveMockBody).toHaveBeenCalled();
    });
  });

  describe('Import Functionality', () => {
    it('#Should-not-process-if-no-file-selected', async () => {
      const event = { target: { files: [] } } as any;
      const initialMessage = component.jsonValidationMessage();
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()).toBe(initialMessage);
    });

    it('#Should-not-process-if-files-is-undefined', async () => {
      const event = { target: {} } as any;
      const initialMessage = component.jsonValidationMessage();
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()).toBe(initialMessage);
    });

    it('#Should-load-manual-configuration-when-no-hash', async () => {
      const manualConfig = {
        selectedContext: { id: 2, value: 'Usar HTTP', useMock: false },
        headers: { 'Content-Type': 'application/json' },
        nameMock: 'Test Mock',
        serviceCode: 'TEST_SERVICE',
        url: '/api/test',
        httpMethod: 'POST'
      };
      const file = new File([JSON.stringify(manualConfig)], 'config.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      await component.onFileSelected(event);
      
      expect(component.nameMock).toBe('Test Mock');
      expect(component.serviceCode).toBe('TEST_SERVICE');
      expect(component.url).toBe('/api/test');
      expect(event.target.value).toBe('');
    });

    it('#Should-show-error-for-invalid-hash', async () => {
      const invalidData = { _hash: 'invalid', type: 'mocks', mocks: [] };
      const file = new File([JSON.stringify(invalidData)], 'invalid.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
      expect(component.jsonValidationMessage()?.text).toContain('inválida');
      expect(event.target.value).toBe('');
    });

    it('#Should-set-error-message-for-invalid-hash', async () => {
      const invalidData = { _hash: 'invalid', type: 'mocks', mocks: [] };
      const file = new File([JSON.stringify(invalidData)], 'invalid.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
    })

    it('#Should-show-error-for-invalid-structure', async () => {
      const { generateHash } = await import('../../../core');
      const invalidStructure = { type: 'mocks', mocks: 'not-an-array' };
      const hash = await generateHash(invalidStructure);
      const dataWithHash = { ...invalidStructure, _hash: hash };
      const file = new File([JSON.stringify(dataWithHash)], 'invalid.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
      expect(event.target.value).toBe('');
    });

    it('#Should-import-database-with-valid-hash', async () => {
      const { generateHash, createDatabaseExport } = await import('../../../core');
      const dbConfig = { name: 'TestDB', version: 1, objectStoreName: 'mocks', keyPath: 'id', indexes: [] };
      const mocks = [{ id: '1', name: 'Mock 1', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' }] as any;
      const exportDataWithoutHash = createDatabaseExport({ mocks, databaseConfig: dbConfig });
      const hash = await generateHash(exportDataWithoutHash);
      const exportData = { ...exportDataWithoutHash, _hash: hash };
      const file = new File([JSON.stringify(exportData)], 'db.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      mockPresenter.deleteDatabase.and.returnValue(Promise.resolve());
      mockPresenter.handleCreateDatabase.and.returnValue(Promise.resolve());
      mockPresenter.handleImportMocks.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      
      await component.onFileSelected(event);
      
      expect(mockPresenter.deleteDatabase).toHaveBeenCalledWith('TestDB');
      expect(mockPresenter.handleCreateDatabase).toHaveBeenCalledWith(dbConfig);
      expect(mockPresenter.handleImportMocks).toHaveBeenCalled();
      expect(component.jsonValidationMessage()?.type).toBe('success');
      expect(event.target.value).toBe('');
    });

    it('#Should-show-success-message-for-database-import', async () => {
      const { createDatabaseExport, generateHash } = await import('../../../core');
      const dbConfig = { name: 'TestDB', version: 1, objectStoreName: 'mocks', keyPath: 'id', indexes: [] };
      const mocks = [{ id: '1', name: 'Mock 1', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' }] as any;
      const exportDataWithoutHash = createDatabaseExport({ mocks, databaseConfig: dbConfig });
      const hash = await generateHash(exportDataWithoutHash);
      const exportData = { ...exportDataWithoutHash, _hash: hash };
      const file = new File([JSON.stringify(exportData)], 'db.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      mockPresenter.deleteDatabase.and.returnValue(Promise.resolve());
      mockPresenter.handleCreateDatabase.and.returnValue(Promise.resolve());
      mockPresenter.handleImportMocks.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.text).toContain('restaurada');
      expect(component.jsonValidationMessage()?.text).toContain('Firma verificada');
    });

    it('#Should-import-mocks-only-with-valid-hash', async () => {
      const { createMocksExport, generateHash } = await import('../../../core');
      const mocks = [
        { id: '1', name: 'Mock 1', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' },
        { id: '2', name: 'Mock 2', serviceCode: 'TEST', url: '/test2', method: 'POST', httpCodeResponseValue: 201, delayMs: 0, headers: {}, responseBody: '{}' }
      ] as any;
      const exportDataWithoutHash = createMocksExport({ mocks });
      const hash = await generateHash(exportDataWithoutHash);
      const exportData = { ...exportDataWithoutHash, _hash: hash };
      const file = new File([JSON.stringify(exportData)], 'mocks.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      mockPresenter.clearAllMocks.and.returnValue(Promise.resolve());
      mockPresenter.handleImportMocks.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      
      await component.onFileSelected(event);
      
      expect(mockPresenter.clearAllMocks).toHaveBeenCalled();
      expect(mockPresenter.handleImportMocks).toHaveBeenCalled();
      expect(component.jsonValidationMessage()?.type).toBe('success');
    });

    it('#Should-show-success-message-for-mocks-import', async () => {
      const { createMocksExport, generateHash } = await import('../../../core');
      const mocks = [
        { id: '1', name: 'Mock 1', serviceCode: 'TEST', url: '/test', method: 'GET', httpCodeResponseValue: 200, delayMs: 0, headers: {}, responseBody: '{}' },
        { id: '2', name: 'Mock 2', serviceCode: 'TEST', url: '/test2', method: 'POST', httpCodeResponseValue: 201, delayMs: 0, headers: {}, responseBody: '{}' }
      ] as any;
      const exportDataWithoutHash = createMocksExport({ mocks });
      const hash = await generateHash(exportDataWithoutHash);
      const exportData = { ...exportDataWithoutHash, _hash: hash };
      const file = new File([JSON.stringify(exportData)], 'mocks.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      mockPresenter.clearAllMocks.and.returnValue(Promise.resolve());
      mockPresenter.handleImportMocks.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.text).toContain('2 mocks importados');
      expect(component.jsonValidationMessage()?.text).toContain('Firma verificada');
    });

    it('#Should-set-success-message-after-import', async () => {
      const { createMocksExport, generateHash } = await import('../../../core');
      const exportDataWithoutHash = createMocksExport({ mocks: [] });
      const hash = await generateHash(exportDataWithoutHash);
      const exportData = { ...exportDataWithoutHash, _hash: hash };
      const file = new File([JSON.stringify(exportData)], 'mocks.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      mockPresenter.clearAllMocks.and.returnValue(Promise.resolve());
      mockPresenter.handleImportMocks.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.type).toBe('success');
    });

    it('#Should-show-error-for-unrecognized-format', async () => {
      const { generateHash } = await import('../../../core');
      const exportData = { type: 'unknown', data: [] };
      const hash = await generateHash(exportData);
      const dataWithHash = { ...exportData, _hash: hash };
      const file = new File([JSON.stringify(dataWithHash)], 'unknown.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
      expect(component.jsonValidationMessage()?.text).toContain('no reconocido');
    });

    it('#Should-handle-read-file-error', async () => {
      const file = new File(['invalid json content'], 'invalid.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
      expect(component.jsonValidationMessage()?.text).toContain('Error al importar');
    });

    it('#Should-show-error-message-on-invalid-json', async () => {
      const file = new File(['invalid json'], 'invalid.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'some-value' } } as any;
      
      await component.onFileSelected(event);
      
      expect(component.jsonValidationMessage()?.type).toBe('error');
    });

    it('#Should-call-refreshDatabaseStats-after-database-import', async () => {
      const { createDatabaseExport, generateHash } = await import('../../../core');
      const dbConfig = { name: 'TestDB', version: 1, objectStoreName: 'mocks', keyPath: 'id', indexes: [] };
      const exportDataWithoutHash = createDatabaseExport({ mocks: [], databaseConfig: dbConfig });
      const hash = await generateHash(exportDataWithoutHash);
      const exportData = { ...exportDataWithoutHash, _hash: hash };
      const file = new File([JSON.stringify(exportData)], 'db.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      mockPresenter.deleteDatabase.and.returnValue(Promise.resolve());
      mockPresenter.handleCreateDatabase.and.returnValue(Promise.resolve());
      mockPresenter.handleImportMocks.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      spyOn(component as any, 'refreshDatabaseStats').and.returnValue(Promise.resolve());
      
      await component.onFileSelected(event);
      
      expect((component as any).refreshDatabaseStats).toHaveBeenCalled();
    });

    it('#Should-call-refreshDatabaseStats-after-mocks-import', async () => {
      const { createMocksExport, generateHash } = await import('../../../core');
      const exportDataWithoutHash = createMocksExport({ mocks: [] });
      const hash = await generateHash(exportDataWithoutHash);
      const exportData = { ...exportDataWithoutHash, _hash: hash };
      const file = new File([JSON.stringify(exportData)], 'mocks.json', { type: 'application/json' });
      const event = { target: { files: [file], value: 'test' } } as any;
      
      mockPresenter.clearAllMocks.and.returnValue(Promise.resolve());
      mockPresenter.handleImportMocks.and.returnValue(Promise.resolve());
      mockPresenter.refreshStatistics.and.returnValue(Promise.resolve());
      spyOn(component as any, 'refreshDatabaseStats').and.returnValue(Promise.resolve());
      
      await component.onFileSelected(event);
      
      expect((component as any).refreshDatabaseStats).toHaveBeenCalled();
    });
  });

  describe('Component Cleanup', () => {
    it('#Should-cleanup-on-destroy', () => {
      component.ngOnDestroy();
      
      expect(mockPresenter.ngOnDestroy).toHaveBeenCalled();
    });

    it('#Should-cancel-animation-frame-on-destroy', () => {
      (component as any).animationId = 123;
      spyOn(window, 'cancelAnimationFrame');
      
      component.ngOnDestroy();
      
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(123);
    });

    it('#Should-restore-body-cursor-on-destroy', () => {
      document.body.style.cursor = 'grabbing';
      
      component.ngOnDestroy();
      
      expect(document.body.style.cursor).toBe('');
    });

    it('#Should-restore-user-select-on-destroy', () => {
      document.body.style.userSelect = 'none';
      
      component.ngOnDestroy();
      
      expect(document.body.style.userSelect).toBe('');
    });
  });

  describe('Drag and Drop', () => {
    it('#Should-not-start-drag-on-button-click', () => {
      const button = document.createElement('button');
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      Object.defineProperty(event, 'target', { value: button, enumerable: true });
      
      component.startDrag(event as any);
      
      expect((component as any).dragging).toBe(false);
    });

    it('#Should-not-start-drag-on-input-click', () => {
      const input = document.createElement('input');
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      Object.defineProperty(event, 'target', { value: input, enumerable: true });
      
      component.startDrag(event as any);
      
      expect((component as any).dragging).toBe(false);
    });

    it('#Should-not-start-drag-on-select-click', () => {
      const select = document.createElement('select');
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      Object.defineProperty(event, 'target', { value: select, enumerable: true });
      
      component.startDrag(event as any);
      
      expect((component as any).dragging).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('#Should-compute-currentMocks-from-presenter', () => {
      const mocks = [{ id: '1', name: 'Test' } as any as HttpMockEntity];
      mockPresenter.currentMocks.set(mocks);
      
      const result = component.currentMocks();
      
      expect(result).toEqual(mocks);
    });

    it('#Should-compute-isLoading-from-presenter', () => {
      mockPresenter.isLoading.set(true);
      
      const result = component.isLoading();
      
      expect(result).toBe(true);
    });

    it('#Should-compute-statistics-from-presenter', () => {
      const stats = { totalMocks: 10, averageDelayMs: 500 };
      mockPresenter.statistics.set(stats as any);
      
      const result = component.statistics();
      
      expect(result).toEqual(stats);
    });

    it('#Should-compute-presenterError-from-presenter', () => {
      mockPresenter.error.set('Test error');
      
      const result = component.presenterError();
      
      expect(result).toBe('Test error');
    });

    it('#Should-compute-lastOperation-from-presenter', () => {
      mockPresenter.lastOperation.set('Saving...');
      
      const result = component.lastOperation();
      
      expect(result).toBe('Saving...');
    });

    it('#Should-compute-availableServiceCodes-from-presenter', () => {
      const codes = [{ serviceCode: 'test', mockCount: 5, methods: ['GET'] } as ServiceCodeWithStats ];
      mockPresenter.availableServiceCodes.set(codes as any);
      
      const result = component.availableServiceCodes();
      
      expect(result).toEqual(codes);
    });

    it('#Should-compute-databaseStatus-from-presenter', () => {
      const status = { exists: true, isInitialized: true };
      mockPresenter.databaseStatus.set(status);
      
      const result = component.databaseStatus();
      
      expect(result).toEqual(status);
    });

    it('#Should-compute-databaseConfig-from-presenter', () => {
      const config = { name: 'DB', version: 1, objectStoreName: 'store', keyPath: 'id', indexes: [] };
      mockPresenter.databaseConfig.set(config);
      
      const result = component.databaseConfig();
      
      expect(result).toEqual(config);
    });

    it('#Should-compute-shouldShowDatabaseSetup-from-presenter', () => {
      mockPresenter.shouldShowDatabaseSetup.and.returnValue(true);
      
      const result = component.shouldShowDatabaseSetup();
      
      expect(result).toBe(true);
    });

    it('#Should-compute-shouldShowManagementTabs-from-presenter', () => {
      mockPresenter.shouldShowManagementTabs.and.returnValue(false);
      
      const result = component.shouldShowManagementTabs();
      
      expect(result).toBe(false);
    });
  });
});
