import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpMockService } from '../../../../core/services/HttpMockService';
import { IHttpMockData, HttpMethod } from '../../../../core/entities/HttpMockEntity';
import { IQueryOptions } from '../../../../core/types/repository.types';
import { ICleanupOptions } from '../../../../core/types/service.types';

interface TestResult {
  method: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  timestamp: Date;
}

interface TabDefinition {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-service-tester',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-tester.component.html',
  styleUrls: ['./service-tester.component.scss']
})
export class ServiceTesterComponent implements OnInit {

  // ==========================================================================
  // SIGNALS - STATE MANAGEMENT
  // ==========================================================================

  readonly isInitialized = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly activeTab = signal<string>('crud');
  readonly testResults = signal<TestResult[]>([]);
  readonly showResults = signal<boolean>(false);

  // Service state (exposed from HttpMockService)
  readonly mocks = computed(() => this.httpMockService.mocks());
  readonly statistics = computed(() => this.httpMockService.statistics());
  readonly totalMocks = computed(() => this.httpMockService.totalMocks());
  readonly serviceCodes = computed(() => this.httpMockService.serviceCodes());
  readonly loading = computed(() => this.httpMockService.loading());
  readonly error = computed(() => this.httpMockService.error());
  readonly interceptionConfig = computed(() => this.httpMockService.interceptionConfig());

  // Computed stats
  readonly successRate = computed(() => {
    const results = this.testResults();
    if (results.length === 0) return 0;
    const successful = results.filter(r => r.success).length;
    return Math.round((successful / results.length) * 100);
  });

  readonly averageDuration = computed(() => {
    const results = this.testResults();
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + r.duration, 0);
    return Math.round(total / results.length);
  });

  readonly recentResults = computed(() => {
    return this.testResults().slice(-10).reverse();
  });

  // ==========================================================================
  // TAB DEFINITIONS
  // ==========================================================================

  readonly tabs: TabDefinition[] = [
    { id: 'crud', label: 'CRUD', icon: '📝' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'servicecodes', label: 'Service Codes', icon: '🏷️' },
    { id: 'interception', label: 'Interception', icon: '🌐' },
    { id: 'importexport', label: 'Import/Export', icon: '📦' },
    { id: 'cleanup', label: 'Cleanup', icon: '🧹' },
    { id: 'health', label: 'Health', icon: '💚' }
  ];

  // ==========================================================================
  // FORM MODELS
  // ==========================================================================

  // CRUD Forms
  createForm: Omit<IHttpMockData, 'id'> = {
    name: 'Test Mock',
    serviceCode: 'TEST_SVC',
    url: '/api/test',
    method: 'GET' as HttpMethod,
    httpCodeResponseValue: 200,
    delayMs: 100,
    responseBody: '{"success": true}'
  };

  updateId = '';
  updateDelay = 200;

  deleteId = '';

  // Search Forms
  searchUrl = '/api/test';
  searchMethod: HttpMethod | string = 'GET';
  filterServiceCode = '';
  querySortBy = 'serviceCode';
  querySortDirection: 'asc' | 'desc' = 'asc';
  queryLimit = 10;
  queryOffset = 0;

  // Service Codes
  selectedServiceCodeForStats = '';

  // Interception
  interceptionEnabled = false;
  defaultDelay = 100;
  fallbackToReal = true;
  logRequests = true;
  interceptServiceCodes: string = '';
  testInterceptUrl = '/api/test';
  testInterceptMethod: HttpMethod | string = 'GET';

  // Import/Export
  exportServiceCode = '';
  importJson = '';

  // Cleanup
  cleanupServiceCode = '';
  cleanupOlderThanDays = 30;

  // Health
  healthData: any = null;

  constructor(public httpMockService: HttpMockService) {}

  async ngOnInit(): Promise<void> {
    await this.initialize();
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    this.isLoading.set(true);
    try {
      // Initialize service with repository if not already initialized
      // This uses lazy loading similar to getDatabaseHealth
      await this.httpMockService.getDatabaseHealth();
      
      // Now load all mocks
      await this.httpMockService.loadAllMocks();
      this.isInitialized.set(true);
    } catch (error) {
      this.addResult('initialize', false, undefined, error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // ==========================================================================
  // TAB NAVIGATION
  // ==========================================================================

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  toggleResults(): void {
    this.showResults.update(v => !v);
  }

  // ==========================================================================
  // CRUD OPERATIONS
  // ==========================================================================

  async testCreate(): Promise<void> {
    await this.runTest('createMock', async () => {
      const result = await this.httpMockService.createMock(this.createForm);
      return result;
    });
  }

  async testUpdate(): Promise<void> {
    if (!this.updateId) {
      alert('Please enter an entity ID');
      return;
    }

    await this.runTest('updateMock', async () => {
      const result = await this.httpMockService.updateMock(this.updateId, {
        delayMs: this.updateDelay
      });
      return result;
    });
  }

  async testDelete(): Promise<void> {
    if (!this.deleteId) {
      alert('Please enter an entity ID');
      return;
    }

    await this.runTest('deleteMock', async () => {
      const result = await this.httpMockService.deleteMock(this.deleteId);
      return { deleted: result };
    });
  }

  async testLoadAll(): Promise<void> {
    await this.runTest('loadAllMocks', async () => {
      await this.httpMockService.loadAllMocks();
      return { count: this.mocks().length };
    });
  }

  // ==========================================================================
  // SEARCH OPERATIONS
  // ==========================================================================

  async testFindMatchingMock(): Promise<void> {
    await this.runTest('findMatchingMock', async () => {
      const result = await this.httpMockService.findMatchingMock(
        this.searchUrl,
        this.searchMethod
      );
      return result;
    });
  }

  async testSearchMocks(): Promise<void> {
    await this.runTest('searchMocks', async () => {
      const options: IQueryOptions = {
        filter: this.filterServiceCode ? { serviceCode: this.filterServiceCode } : undefined,
        sortBy: this.querySortBy as any,
        sortDirection: this.querySortDirection,
        limit: this.queryLimit,
        offset: this.queryOffset
      };
      await this.httpMockService.searchMocks(options);
      return { count: this.mocks().length };
    });
  }

  async testLoadByServiceCode(): Promise<void> {
    if (!this.filterServiceCode) {
      alert('Please enter a service code');
      return;
    }

    await this.runTest('loadMocksByServiceCode', async () => {
      await this.httpMockService.loadMocksByServiceCode(this.filterServiceCode);
      return { count: this.mocks().length };
    });
  }

  // ==========================================================================
  // SERVICE CODE OPERATIONS
  // ==========================================================================

  async testGetUniqueServiceCodes(): Promise<void> {
    await this.runTest('getUniqueServiceCodes', async () => {
      const codes = await this.httpMockService.getUniqueServiceCodes();
      return { codes };
    });
  }

  async testGetServiceCodesWithStats(): Promise<void> {
    await this.runTest('getServiceCodesWithStats', async () => {
      const stats = await this.httpMockService.getServiceCodesWithStats();
      return { stats };
    });
  }

  selectServiceCodeFilter(serviceCode: string | null): void {
    this.httpMockService.selectServiceCode(serviceCode);
    this.addResult('selectServiceCode', true, { serviceCode });
  }

  clearFilters(): void {
    this.httpMockService.clearFilters();
    this.addResult('clearFilters', true, {});
  }

  // ==========================================================================
  // INTERCEPTION OPERATIONS
  // ==========================================================================

  async testInterceptRequest(): Promise<void> {
    await this.runTest('interceptRequest', async () => {
      const result = await this.httpMockService.interceptRequest(
        this.testInterceptUrl,
        this.testInterceptMethod
      );
      return result;
    });
  }

  updateInterceptionSettings(): void {
    const serviceCodes = this.interceptServiceCodes
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    this.httpMockService.updateInterceptionConfig({
      enabled: this.interceptionEnabled,
      defaultDelay: this.defaultDelay,
      fallbackToReal: this.fallbackToReal,
      logRequests: this.logRequests,
      serviceCodes
    });

    this.addResult('updateInterceptionConfig', true, this.interceptionConfig());
  }

  toggleInterception(): void {
    this.httpMockService.toggleInterception();
    this.interceptionEnabled = this.interceptionConfig().enabled;
    this.addResult('toggleInterception', true, { enabled: this.interceptionEnabled });
  }

  // ==========================================================================
  // IMPORT/EXPORT OPERATIONS
  // ==========================================================================

  async testExportMocks(): Promise<void> {
    await this.runTest('exportMocks', async () => {
      const serviceCode = this.exportServiceCode || undefined;
      const exported = await this.httpMockService.exportMocks(serviceCode);
      
      // Also download the file
      this.downloadJson(exported, `mocks-export-${serviceCode || 'all'}.json`);
      
      return { count: exported.length };
    });
  }

  async testImportMocks(): Promise<void> {
    if (!this.importJson) {
      alert('Please paste JSON data to import');
      return;
    }

    await this.runTest('importMocks', async () => {
      try {
        const mocksData = JSON.parse(this.importJson);
        const count = await this.httpMockService.importMocks(mocksData);
        return { imported: count };
      } catch (error) {
        throw new Error('Invalid JSON format');
      }
    });
  }

  private downloadJson(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ==========================================================================
  // CLEANUP OPERATIONS
  // ==========================================================================

  async testCleanupByServiceCode(): Promise<void> {
    if (!this.cleanupServiceCode) {
      alert('Please enter a service code');
      return;
    }

    await this.runTest('cleanup (by service code)', async () => {
      const options: ICleanupOptions = {
        serviceCode: this.cleanupServiceCode
      };
      const count = await this.httpMockService.cleanup(options);
      return { deletedCount: count };
    });
  }

  async testCleanupByAge(): Promise<void> {
    await this.runTest('cleanup (by age)', async () => {
      const options: ICleanupOptions = {
        olderThanDays: this.cleanupOlderThanDays
      };
      const count = await this.httpMockService.cleanup(options);
      return { deletedCount: count };
    });
  }

  async testClearAll(): Promise<void> {
    if (!confirm('Are you sure you want to delete ALL mocks?')) {
      return;
    }

    await this.runTest('clearAllMocks', async () => {
      await this.httpMockService.clearAllMocks();
      return { cleared: true };
    });
  }

  async testUpdateStatistics(): Promise<void> {
    await this.runTest('updateStatistics', async () => {
      await this.httpMockService.updateStatistics();
      return this.statistics();
    });
  }

  // ==========================================================================
  // HEALTH OPERATIONS
  // ==========================================================================

  async testGetDatabaseHealth(): Promise<void> {
    await this.runTest('getDatabaseHealth', async () => {
      const health = await this.httpMockService.getDatabaseHealth();
      this.healthData = health;
      return health;
    });
  }

  resetService(): void {
    this.httpMockService.reset();
    this.addResult('reset', true, { reset: true });
  }

  // ==========================================================================
  // MOCK DATA GENERATORS
  // ==========================================================================

  generateSampleMock(): void {
    const randomId = Math.floor(Math.random() * 1000);
    this.createForm = {
      name: `Sample Mock ${randomId}`,
      serviceCode: `SAMPLE_${randomId}`,
      url: `/api/sample/${randomId}`,
      method: 'GET' as HttpMethod,
      httpCodeResponseValue: 200,
      delayMs: 100,
      responseBody: JSON.stringify({ id: randomId, message: 'Sample response' }, null, 2)
    };
  }

  generateErrorMock(): void {
    const randomId = Math.floor(Math.random() * 1000);
    this.createForm = {
      name: `Error Mock ${randomId}`,
      serviceCode: `ERROR_${randomId}`,
      url: `/api/error/${randomId}`,
      method: 'POST' as HttpMethod,
      httpCodeResponseValue: 500,
      delayMs: 50,
      responseBody: JSON.stringify({ error: 'Internal Server Error', code: 'ERR_500' }, null, 2)
    };
  }

  loadSampleImportData(): void {
    const sampleMocks = [
      {
        name: 'Sample Import 1',
        serviceCode: 'IMPORT_TEST',
        url: '/api/import/1',
        method: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 100,
        responseBody: '{"imported": true, "id": 1}'
      },
      {
        name: 'Sample Import 2',
        serviceCode: 'IMPORT_TEST',
        url: '/api/import/2',
        method: 'POST',
        httpCodeResponseValue: 201,
        delayMs: 150,
        responseBody: '{"imported": true, "id": 2}'
      }
    ];
    this.importJson = JSON.stringify(sampleMocks, null, 2);
  }

  // ==========================================================================
  // RESULTS MANAGEMENT
  // ==========================================================================

  async runTest(methodName: string, testFn: () => Promise<any>): Promise<void> {
    this.isLoading.set(true);
    const startTime = performance.now();

    try {
      const result = await testFn();
      const duration = Math.round(performance.now() - startTime);
      this.addResult(methodName, true, result, undefined, duration);
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);
      this.addResult(methodName, false, undefined, error, duration);
    } finally {
      this.isLoading.set(false);
    }
  }

  private addResult(
    method: string,
    success: boolean,
    data?: any,
    error?: any,
    duration: number = 0
  ): void {
    const result: TestResult = {
      method,
      success,
      data: data !== undefined ? data : null,
      error: error ? (error instanceof Error ? error.message : String(error)) : undefined,
      duration,
      timestamp: new Date()
    };

    this.testResults.update(results => [...results, result]);
    
    // Auto-open results panel on new result
    if (!this.showResults()) {
      this.showResults.set(true);
    }
  }

  clearResults(): void {
    this.testResults.set([]);
  }

  exportResults(): void {
    const results = this.testResults();
    this.downloadJson(results, 'service-test-results.json');
  }
}
