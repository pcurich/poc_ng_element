import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseRepository } from '../../../../core/repositories/BaseRepository';
import { HttpMockEntity } from '../../../../core/entities/HttpMockEntity';
import { HttpMockRepository } from '../../../../core/repositories/HttpMockRepository';
import { ORMFactory } from '../../../../core/factories/ORMFactory';
import { IQueryOptions } from '../../../../core/types/repository.types';

interface TestResult {
    method: string;
    success: boolean;
    duration: number;
    data?: any;
    error?: string;
    timestamp: Date;
}

interface TabItem {
    id: string;
    label: string;
    icon: string;
}

@Component({
    selector: 'app-repository-tester',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './repository-tester.component.html',
    styleUrls: ['./repository-tester.component.scss']
})
export class RepositoryTesterComponent implements OnInit {

    // ==========================================================================
    // STATE MANAGEMENT
    // ==========================================================================

    private repository!: HttpMockRepository;

    readonly activeTab = signal<string>('create');
    readonly isInitialized = signal<boolean>(false);
    readonly isLoading = signal<boolean>(false);
    readonly testResults = signal<TestResult[]>([]);
    readonly showResults = signal<boolean>(false);


    // Tab configuration
    readonly tabs: TabItem[] = [
        { id: 'create', label: 'Create', icon: '➕' },
        { id: 'read', label: 'Read', icon: '🔍' },
        { id: 'update', label: 'Update', icon: '✏️' },
        { id: 'delete', label: 'Delete', icon: '🗑️' },
        { id: 'batch', label: 'Batch', icon: '📦' },
        { id: 'query', label: 'Query', icon: '🔎' },
        { id: 'transaction', label: 'Transaction', icon: '⚡' }
    ];

    // ==========================================================================
    // FORM DATA
    // ==========================================================================

    // CREATE forms
    createForm = {
        serviceCode: 'TEST_SERVICE',
        url: '/api/test',
        method: 'GET',
        httpCodeResponseValue: 200,
        delayMs: 100,
        responseBody: '{"message": "Test response"}'
    };

    batchCreateCount = 5;

    // READ forms
    searchId = '';
    searchServiceCode = '';

    // UPDATE forms
    updateId = '';
    updateDelay = 200;

    // QUERY forms
    queryLimit = 10;
    queryOffset = 0;
    queryServiceCode = '';
    querySortBy: 'serviceCode' | 'delayMs' | 'createdAt' = 'serviceCode';
    querySortDirection: 'asc' | 'desc' = 'asc';

    // PAGINATION
    currentPage = 1;
    pageSize = 5;

    // ==========================================================================
    // COMPUTED PROPERTIES
    // ==========================================================================

    readonly recentResults = computed(() => {
        return this.testResults().slice(-5).reverse();
    });

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

    // ==========================================================================
    // LIFECYCLE
    // ==========================================================================

    async ngOnInit() {
        await this.initializeRepository();
    }

    private async initializeRepository() {
        try {
            this.isLoading.set(true);
            const config = ORMFactory.getDefaultHttpMocksConfig();
            const dbContext = ORMFactory.createDbContext(config);
            await dbContext.open();

            this.repository = ORMFactory.createHttpMockRepository(dbContext);
            this.isInitialized.set(true);

            this.addResult({
                method: 'Initialize',
                success: true,
                duration: 0,
                data: 'Repository initialized successfully'
            });
        } catch (error) {
            this.addResult({
                method: 'Initialize',
                success: false,
                duration: 0,
                error: (error as Error).message
            });
        } finally {
            this.isLoading.set(false);
        }
    }

    // ==========================================================================
    // TAB NAVIGATION
    // ==========================================================================

    selectTab(tabId: string) {
        this.activeTab.set(tabId);
    }

    // ==========================================================================
    // CREATE OPERATIONS
    // ==========================================================================

    async testCreate() {
        await this.executeTest('create', async () => {
            const mockEntity = new HttpMockEntity({
                serviceCode: this.createForm.serviceCode,
                url: this.createForm.url,
                method: this.createForm.method as any,
                httpCodeResponseValue: this.createForm.httpCodeResponseValue,
                delayMs: this.createForm.delayMs,
                responseBody: this.createForm.responseBody,
                headers: { 'Content-Type': 'application/json' }
            });
            const entity = await this.repository.create(mockEntity);
            return { id: entity.id, serviceCode: entity.serviceCode };
        });
    }

    async testCreateMany() {
        await this.executeTest('createMany', async () => {
            const entities = Array.from({ length: this.batchCreateCount }, (_, i) =>
                new HttpMockEntity({
                    serviceCode: `BATCH_${i}`,
                    url: `/api/batch/${i}`,
                    method: 'GET' as any,
                    httpCodeResponseValue: 200,
                    delayMs: 100,
                    responseBody: `{"batch": ${i}}`,
                    headers: {}
                })
            );

            const created = await this.repository.createMany(entities);
            return { count: created.length, ids: created.map(e => e.id) };
        });
    }

    // ==========================================================================
    // READ OPERATIONS
    // ==========================================================================

    async testFindById() {
        if (!this.searchId) {
            alert('Please enter an ID');
            return;
        }

        await this.executeTest('findById', async () => {
            const entity = await this.repository.findById(this.searchId);
            return entity ? entity.toPlainObject() : null;
        });
    }

    async testFindAll() {
        await this.executeTest('findAll', async () => {
            const entities = await this.repository.findAll();
            return { count: entities.length, data: entities.slice(0, 3).map(e => e.toPlainObject()) };
        });
    }

    async testFindByIndex() {
        if (!this.searchServiceCode) {
            alert('Please enter a service code');
            return;
        }

        await this.executeTest('findByIndex', async () => {
            const entities = await this.repository.findByIndex('serviceCode', this.searchServiceCode);
            return { count: entities.length, data: entities.map(e => e.toPlainObject()) };
        });
    }

    async testExists() {
        if (!this.searchId) {
            alert('Please enter an ID');
            return;
        }

        await this.executeTest('exists', async () => {
            const exists = await this.repository.exists(this.searchId);
            return { exists, id: this.searchId };
        });
    }

    async testCount() {
        await this.executeTest('count', async () => {
            const total = await this.repository.count();
            const withFilter = await this.repository.count({
                filter: (mock) => mock.delayMs > 100
            });
            return { total, withFilter };
        });
    }

    // ==========================================================================
    // UPDATE OPERATIONS
    // ==========================================================================

    async testUpdate() {
        if (!this.updateId) {
            alert('Please enter an ID');
            return;
        }

        await this.executeTest('update', async () => {
            const updated = await this.repository.update(this.updateId, {
                delayMs: this.updateDelay
            });
            return updated ? updated.toPlainObject() : null;
        });
    }

    async testUpdateMany() {
        await this.executeTest('updateMany', async () => {
            const count = await this.repository.updateMany(
                { delayMs: 500 },
                { filter: (mock) => mock.serviceCode.startsWith('BATCH_') }
            );
            return { updatedCount: count };
        });
    }

    // ==========================================================================
    // DELETE OPERATIONS
    // ==========================================================================

    async testDelete() {
        if (!this.updateId) {
            alert('Please enter an ID');
            return;
        }

        await this.executeTest('delete', async () => {
            const deleted = await this.repository.delete(this.updateId);
            return { deleted, id: this.updateId };
        });
    }

    async testDeleteMany() {
        await this.executeTest('deleteMany', async () => {
            const count = await this.repository.deleteMany({
                filter: (mock) => mock.serviceCode.startsWith('BATCH_')
            });
            return { deletedCount: count };
        });
    }

    async testClearAll() {
        if (!confirm('This will delete ALL data. Continue?')) {
            return;
        }

        await this.executeTest('clearAll', async () => {
            await this.repository.clearAll();
            return { message: 'All data cleared' };
        });
    }

    // ==========================================================================
    // QUERY OPERATIONS
    // ==========================================================================

    async testFindMany() {
        await this.executeTest('findMany', async () => {
            const options: IQueryOptions<HttpMockEntity> = {
                limit: this.queryLimit,
                offset: this.queryOffset,
                sortBy: this.querySortBy,
                sortDirection: this.querySortDirection
            };

            if (this.queryServiceCode) {
                options.filter = { serviceCode: this.queryServiceCode };
            }

            const entities = await this.repository.findMany(options);
            return { count: entities.length, data: entities.map(e => e.toPlainObject()) };
        });
    }

    async testFindPaginated() {
        await this.executeTest('findPaginated', async () => {
            const result = await this.repository.findPaginated(this.currentPage, this.pageSize);
            return {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: result.totalPages,
                hasNext: result.hasNext,
                hasPrevious: result.hasPrevious,
                items: result.items.slice(0, 2).map(e => e.toPlainObject())
            };
        });
    }

    async testComplexQuery() {
        await this.executeTest('complexQuery', async () => {
            const entities = await this.repository.findMany({
                filter: (mock) => mock.delayMs >= 100 && mock.httpCodeResponseValue === 200,
                sortBy: 'delayMs',
                sortDirection: 'desc',
                limit: 10
            });
            return { count: entities.length, data: entities.map(e => e.toPlainObject()) };
        });
    }

    // ==========================================================================
    // SAVE OPERATIONS
    // ==========================================================================

    async testSave() {
        await this.executeTest('save', async () => {
            const entity = new HttpMockEntity({
                serviceCode: 'SAVE_TEST',
                url: '/api/save',
                method: 'POST',
                httpCodeResponseValue: 201,
                delayMs: 150,
                responseBody: '{"saved": true}'
            });

            const saved = await this.repository.save(entity);
            return { id: saved.id, serviceCode: saved.serviceCode };
        });
    }

    async testSaveMany() {
        await this.executeTest('saveMany', async () => {
            const entities = [
                new HttpMockEntity({
                    serviceCode: 'SAVE_MANY_1',
                    url: '/api/1',
                    method: 'GET',
                    httpCodeResponseValue: 200,
                    delayMs: 100,
                    responseBody: '{}'
                }),
                new HttpMockEntity({
                    serviceCode: 'SAVE_MANY_2',
                    url: '/api/2',
                    method: 'POST',
                    httpCodeResponseValue: 201,
                    delayMs: 200,
                    responseBody: '{}'
                })
            ];

            const saved = await this.repository.saveMany(entities);
            return { count: saved.length, ids: saved.map(e => e.id) };
        });
    }

    // ==========================================================================
    // TRANSACTION OPERATIONS
    // ==========================================================================

    async testTransaction() {
        await this.executeTest('transaction', async () => {
            const result = await this.repository.executeInTransaction(async (tx) => {
                // Crear 3 entidades en una transacción
                const e1 = await this.repository.create(new HttpMockEntity({
                    serviceCode: 'TX_1',
                    url: '/tx/1',
                    method: 'GET',
                    httpCodeResponseValue: 200,
                    delayMs: 100,
                    responseBody: '{}'
                }));

                const e2 = await this.repository.create(new HttpMockEntity({
                    serviceCode: 'TX_2',
                    url: '/tx/2',
                    method: 'POST',
                    httpCodeResponseValue: 201,
                    delayMs: 150,
                    responseBody: '{}'
                }));

                const e3 = await this.repository.create(new HttpMockEntity({
                    serviceCode: 'TX_3',
                    url: '/tx/3',
                    method: 'PUT',
                    httpCodeResponseValue: 200,
                    delayMs: 200,
                    responseBody: '{}'
                }));

                return {
                    transactionId: tx.id,
                    created: [e1.id, e2.id, e3.id],
                    state: tx.state
                };
            });

            return result;
        });
    }

    async testTransactionRollback() {
        await this.executeTest('transactionRollback', async () => {
            try {
                await this.repository.executeInTransaction(async (tx) => {
                    await this.repository.create(new HttpMockEntity({
                        serviceCode: 'ROLLBACK_1',
                        url: '/rollback/1',
                        method: 'GET',
                        httpCodeResponseValue: 200,
                        delayMs: 100,
                        responseBody: '{}'
                    }));

                    // Forzar error
                    throw new Error('Intentional error to test rollback');
                });

                return { rollbackSuccess: false, error: 'No error was thrown' };
            } catch (error) {
                // Verificar que no se creó nada
                const entities = await this.repository.findByIndex('serviceCode', 'ROLLBACK_1');
                return {
                    rollbackSuccess: entities.length === 0,
                    error: (error as Error).message
                };
            }
        });
    }

    // ==========================================================================
    // UTILITIES
    // ==========================================================================

    private async executeTest(method: string, testFn: () => Promise<any>) {
        this.isLoading.set(true);
        const startTime = performance.now();

        try {
            const data = await testFn();
            const duration = Math.round(performance.now() - startTime);

            this.addResult({
                method,
                success: true,
                duration,
                data
            });
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);

            this.addResult({
                method,
                success: false,
                duration,
                error: (error as Error).message
            });
        } finally {
            this.isLoading.set(false);
        }
    }

    private addResult(result: Omit<TestResult, 'timestamp'>) {
        this.testResults.update(results => [
            ...results,
            { ...result, timestamp: new Date() }
        ]);
    }

    clearResults() {
        this.testResults.set([]);
    }

    toggleResults(): void {
        this.showResults.update(v => !v);
    }

    exportResults() {
        const data = JSON.stringify(this.testResults(), null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `repository-test-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}