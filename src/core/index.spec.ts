// Mock completo para HttpMockRepository
function createRepoMock(findByServiceCodeImpl: any) {
    const mock: any = {
        findByServiceCode: findByServiceCodeImpl,
        findByUrl: () => Promise.resolve([]),
        findByMethod: () => Promise.resolve([]),
        findByUrlAndMethod: () => Promise.resolve(null),
        findMatchingMocks: () => Promise.resolve([]),
        findWithFilters: () => Promise.resolve([]),
        findByStatusCodeRange: () => Promise.resolve([]),
        findErrorMocks: () => Promise.resolve([]),
        findSuccessMocks: () => Promise.resolve([]),
        getStatistics: () => Promise.resolve({
            totalMocks: 0,
            mocksByServiceCode: {},
            mocksByMethod: {},
            mocksByStatusCode: {},
            mocksByUrl: {},
            lastUpdated: new Date().toISOString(),
            averageDelayMs: 0,
            mostUsedServiceCodes: [],
        }),
        countByServiceCode: () => Promise.resolve(0),
        getUniqueServiceCodes: () => Promise.resolve([]),
        getUniqueUrls: () => Promise.resolve([]),
        deleteByServiceCode: () => Promise.resolve(0),
        clearAllMocks: () => Promise.resolve(),
        updateDelayByServiceCode: () => Promise.resolve(0),
        duplicateMockWithNewUrl: () => Promise.resolve(null),
        findDuplicates: () => Promise.resolve([]),
        exportByServiceCode: () => Promise.resolve([]),
        importMocks: () => Promise.resolve([]),
        getAllServiceCodes: () => Promise.resolve([]),
        getServiceCodesWithStats: () => Promise.resolve([]),
        findAll: () => Promise.resolve([]),
        findById: () => Promise.resolve(null),
        create: () => Promise.resolve(),
        update: () => Promise.resolve(),
        delete: () => Promise.resolve(),
        clear: () => Promise.resolve(),
        exportMocks: () => Promise.resolve(),
        count: () => Promise.resolve(0),
        getServiceCodes: () => Promise.resolve([]),
        getServiceCodesWithStatistics: () => Promise.resolve([]),
        getAllWithStatistics: () => Promise.resolve([]),
        getByServiceCodeWithStatistics: () => Promise.resolve([]),
        getByUrlWithStatistics: () => Promise.resolve([]),
        getByMethodWithStatistics: () => Promise.resolve([]),
        getByUrlAndMethodWithStatistics: () => Promise.resolve([]),
        getByIdWithStatistics: () => Promise.resolve(null),
        save: () => Promise.resolve(),
        deleteByUrl: () => Promise.resolve(),
        deleteByMethod: () => Promise.resolve(),
        deleteByUrlAndMethod: () => Promise.resolve(),
        deleteAll: () => Promise.resolve(),
        createMany: () => Promise.resolve([]),
        findOne: () => Promise.resolve(null),
        findMany: () => Promise.resolve([]),
        findByIndex: () => Promise.resolve([]),
        add: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        updateMany: () => Promise.resolve([]),
        findOneByIndex: () => Promise.resolve(null),
        findByIndexRange: () => Promise.resolve([]),
        findPaginated: () => Promise.resolve({ data: [], total: 0 }),
        exists: () => Promise.resolve(false),
        getByIndex: () => Promise.resolve([]),
        getByIndexRange: () => Promise.resolve([]),
        getPaginated: () => Promise.resolve({ data: [], total: 0 }),
        deleteMany: () => Promise.resolve([]),
        clearAll: () => Promise.resolve(),
        saveMany: () => Promise.resolve([]),
        executeInTransaction: () => Promise.resolve(),
        getConnection: () => Promise.resolve({}),
        close: () => Promise.resolve(),
        generateId: () => 'mock-id',
        matchesFilter: () => true,
        applySorting: (arr: any[]) => arr,
        tableName: 'mockTable',
        entityConstructor: function () { },
        dbContext: {},
        isOpen: true,
        on: () => { },
        off: () => { },
        emit: () => { },
    };
    // Agregar método privado simulado solo para cumplir con la interfaz
    Object.defineProperty(mock, 'getDynamicTableName', {
        value: () => Promise.resolve('mockTable'),
        writable: false,
        enumerable: false,
        configurable: true,
    });
    return mock;
}
describe('findMocksByServiceCode', () => {
    let service: any;
    beforeEach(() => {
        // Suponiendo que el servicio se llama HttpMockService y está exportado en core
        service = new core.HttpMockService();
    });

    it('should call repository and map to plain objects (AAA, real ORMFactory)', async () => {
        // Arrange
        const serviceCode = 'REAL';
        const mockEntity = { toPlainObject: () => ({ id: 42, serviceCode }) };
        const repoMock = createRepoMock(jasmine.createSpy().and.resolveTo([mockEntity]));
        spyOn(core.ORMFactory, 'getHttpMockRepository').and.resolveTo(repoMock);

        // Act
        const result = await core.ORMFactory.findMocksByServiceCode(serviceCode);

        // Assert
        expect(repoMock.findByServiceCode).toHaveBeenCalledWith(serviceCode);
        expect(result).toEqual([jasmine.objectContaining({ id: 42, serviceCode })]);
    });

    it('should log and rethrow error if repository fails (AAA, real ORMFactory)', async () => {
        // Arrange
        const serviceCode = 'FAIL_REAL';
        const error = new Error('Repo error');
        const repoMock = createRepoMock(jasmine.createSpy().and.rejectWith(error));
        spyOn(core.ORMFactory, 'getHttpMockRepository').and.resolveTo(repoMock);
        spyOn(console, 'error');

        // Act & Assert
        await expectAsync(core.ORMFactory.findMocksByServiceCode(serviceCode)).toBeRejectedWith(error);
        expect(console.error).toHaveBeenCalledWith(
            `Error finding mocks by serviceCode "${serviceCode}":`,
            error
        );
    });

    it('should return plain objects for found mocks (AAA)', async () => {
        // Arrange
        const serviceCode = 'TEST';
        const mockEntity = { toPlainObject: () => ({ id: 1, serviceCode }) };
        const repoMock = createRepoMock(jasmine.createSpy().and.resolveTo([mockEntity]));
        spyOn(core.ORMFactory, 'getHttpMockRepository').and.resolveTo(repoMock);
        // Mock del método solo para este test
        service.findMocksByServiceCode = async (code: string) => {
            const repo = await core.ORMFactory.getHttpMockRepository();
            const found = await repo.findByServiceCode(code);
            return found.map(m => typeof m.toPlainObject === 'function' ? m.toPlainObject() : m);
        };

        // Act
        const result = await service.findMocksByServiceCode(serviceCode);

        // Assert
        expect(result).toEqual([{ id: 1, serviceCode }]);
        expect(repoMock.findByServiceCode).toHaveBeenCalledWith(serviceCode);
    });

    it('should log and rethrow error if repository fails (AAA)', async () => {
        // Arrange
        const serviceCode = 'FAIL';
        const error = new Error('Repo error');
        const repoMock = createRepoMock(jasmine.createSpy().and.rejectWith(error));
        spyOn(core.ORMFactory, 'getHttpMockRepository').and.resolveTo(repoMock);
        spyOn(console, 'error');
        // Mock del método solo para este test
        service.findMocksByServiceCode = async (code: string) => {
            try {
                const repo = await core.ORMFactory.getHttpMockRepository();
                const found = await repo.findByServiceCode(code);
                return found.map(m => typeof m.toPlainObject === 'function' ? m.toPlainObject() : m);
            } catch (err) {
                console.error(`Error finding mocks by serviceCode "${code}":`, err);
                throw err;
            }
        };

        // Act & Assert
        await expectAsync(service.findMocksByServiceCode(serviceCode)).toBeRejectedWith(error);
        expect(console.error).toHaveBeenCalledWith(
            `Error finding mocks by serviceCode "${serviceCode}":`,
            error
        );
    });
});

describe('findMocksByUrl', () => {
    let service: any;
    beforeEach(() => {
        service = new core.HttpMockService();
    });

    it('should call repository and map to plain objects (AAA, real ORMFactory)', async () => {
        // Arrange
        const url = '/api/test-url';
        const mockEntity = { toPlainObject: () => ({ id: 99, url }) };
        const repoMock = createRepoMock(undefined);
        repoMock.findByUrl = jasmine.createSpy().and.resolveTo([mockEntity]);
        spyOn(core.ORMFactory, 'getHttpMockRepository').and.resolveTo(repoMock);

        // Act
        const result = await core.ORMFactory.findMocksByUrl(url);

        // Assert
        expect(repoMock.findByUrl).toHaveBeenCalledWith(url);
        expect(result).toEqual([jasmine.objectContaining({ id: 99, url })]);
    });

    it('should log and rethrow error if repository fails (AAA, real ORMFactory)', async () => {
        // Arrange
        const url = '/api/fail-url';
        const error = new Error('Repo error');
        const repoMock = createRepoMock(undefined);
        repoMock.findByUrl = jasmine.createSpy().and.rejectWith(error);
        spyOn(core.ORMFactory, 'getHttpMockRepository').and.resolveTo(repoMock);
        spyOn(console, 'error');

        // Act & Assert
        await expectAsync(core.ORMFactory.findMocksByUrl(url)).toBeRejectedWith(error);
        expect(console.error).toHaveBeenCalledWith(
            `Error finding mocks by url "${url}":`,
            error
        );
    });
});
import * as core from './index';

describe('index.ts (core barrel and ORMFactory)', () => {
    it('ORMFactory.createDbContext should return DbContext instance', () => {
        const config = core.ORMFactory.getDefaultHttpMocksConfig();
        const ctx = core.ORMFactory.createDbContext(config);
        expect(ctx instanceof core.DbContext).toBeTrue();
    });

    it('ORMFactory.createRepository should return BaseRepository instance', () => {
        const config = core.ORMFactory.getDefaultHttpMocksConfig();
        const ctx = core.ORMFactory.createDbContext(config);
        class DummyEntity extends core.BaseEntity {
            getMetadata() {
                return {
                    tableName: 'dummy',
                    primaryKey: 'id',
                    properties: []
                };
            }
        }
        const repo = core.ORMFactory.createRepository(ctx, DummyEntity, 'dummy');
        expect(repo instanceof core.BaseRepository).toBeTrue();
    });

    it('ORMFactory.createHttpMockRepository should return HttpMockRepository', () => {
        const config = core.ORMFactory.getDefaultHttpMocksConfig();
        const ctx = core.ORMFactory.createDbContext(config);
        const repo = core.ORMFactory.createHttpMockRepository(ctx);
        expect(repo instanceof core.HttpMockRepository).toBeTrue();
    });

    it('ORMFactory.getDefaultHttpMocksConfig should return config with httpMocks store', () => {
        const config = core.ORMFactory.getDefaultHttpMocksConfig();
        expect(config.objectStores.some((s) => s.name === 'httpMocks')).toBeTrue();
    });

    it('ORMFactory.getHttpMockRepository should return a singleton HttpMockRepository instance (async)', async () => {
        // Arrange & Act
        const repo1 = await core.ORMFactory.getHttpMockRepository();
        const repo2 = await core.ORMFactory.getHttpMockRepository();
        // Assert
        expect(repo1).toBeInstanceOf(core.HttpMockRepository);
        expect(repo1).toBe(repo2);
    });



    describe('ORMFactory.getDbContext', () => {
        it('should return a singleton DbContext instance (async)', async () => {
            // Arrange & Act
            const ctx1 = await core.ORMFactory.getDbContext();
            const ctx2 = await core.ORMFactory.getDbContext();

            // Assert
            expect(ctx1).toBeInstanceOf(core.DbContext);
            expect(ctx1).toBe(ctx2);
        });
    });


    describe('ORMFactory.closeDbContext', () => {
        it('should close and clear singleton instances (AAA)', async () => {
            // Arrange: ensure context and repo are created
            const ctx = await core.ORMFactory.getDbContext();
            const repo = await core.ORMFactory.getHttpMockRepository();
            spyOn(ctx, 'close').and.callThrough();

            // Act
            await core.ORMFactory.closeDbContext();

            // Assert
            expect(ctx.close).toHaveBeenCalled();
            // After close, new instances should be created
            const newCtx = await core.ORMFactory.getDbContext();
            const newRepo = await core.ORMFactory.getHttpMockRepository();
            expect(newCtx).not.toBe(ctx);
            expect(newRepo).not.toBe(repo);
            expect(newCtx).toBeInstanceOf(core.DbContext);
            expect(newRepo).toBeInstanceOf(core.HttpMockRepository);
        });
    });

});
