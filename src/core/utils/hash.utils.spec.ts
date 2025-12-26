import { generateHash, validateHash, extractDataWithoutHash } from './hash.utils';

describe('hash.utils', () => {

    describe('generateHash', () => {
        let mockEncoder: jasmine.SpyObj<TextEncoder>;
        let mockCrypto: jasmine.SpyObj<SubtleCrypto>;

        beforeEach(() => {
            mockEncoder = jasmine.createSpyObj('TextEncoder', ['encode']);
            mockCrypto = jasmine.createSpyObj('SubtleCrypto', ['digest']);
        });

        it('#Should generate consistent hash for same data', async () => {
            const testData = { name: 'test', value: 123 };

            const hash1 = await generateHash(testData);
            const hash2 = await generateHash(testData);

            expect(hash1).toBe(hash2);
        });

        it('#Should generate different hashes for different data', async () => {
            const data1 = { name: 'test1' };
            const data2 = { name: 'test2' };

            const hash1 = await generateHash(data1);
            const hash2 = await generateHash(data2);

            expect(hash1).not.toBe(hash2);
        });

        it('#Should return hash as hexadecimal string', async () => {
            const testData = { test: 'data' };

            const result = await generateHash(testData);

            expect(result).toMatch(/^[0-9a-f]+$/);
        });

        it('#Should generate hash of length 64 characters for SHA-256', async () => {
            const testData = { test: 'data' };

            const result = await generateHash(testData);

            expect(result.length).toBe(64);
        });

        it('#Should sort object keys before hashing', async () => {
            const data1 = { b: 2, a: 1 };
            const data2 = { a: 1, b: 2 };

            const hash1 = await generateHash(data1);
            const hash2 = await generateHash(data2);

            expect(hash1).toBe(hash2);
        });

        it('#Should handle empty object', async () => {
            const testData = {};

            const result = await generateHash(testData);

            expect(result).toBeDefined();
        });

        it('#Should handle nested objects', async () => {
            const testData = { outer: { inner: { value: 'test' } } };

            const result = await generateHash(testData);

            expect(result).toMatch(/^[0-9a-f]{64}$/);
        });

        it('#Should handle arrays in data', async () => {
            const testData = { items: [1, 2, 3] };

            const result = await generateHash(testData);

            expect(result).toBeDefined();
        });

        it('#Should handle null values', async () => {
            const testData = { value: null };

            const result = await generateHash(testData);

            expect(result).toMatch(/^[0-9a-f]{64}$/);
        });

        it('#Should handle boolean values', async () => {
            const testData = { flag: true };

            const result = await generateHash(testData);

            expect(result).toBeDefined();
        });
    });

    describe('validateHash', () => {
        it('#Should return true when hashes match', async () => {
            const originalData = { name: 'test', value: 123 };
            const hash = await generateHash(originalData);
            const exportedData = { ...originalData, _hash: hash };

            const result = await validateHash(exportedData, originalData);

            expect(result).toBe(true);
        });

        it('#Should return false when hashes do not match', async () => {
            const originalData = { name: 'test', value: 123 };
            const modifiedData = { name: 'modified', value: 456 };
            const hash = await generateHash(originalData);
            const exportedData = { ...modifiedData, _hash: hash };

            const result = await validateHash(exportedData, modifiedData);

            expect(result).toBe(false);
        });

        it('#Should return false when _hash property is missing', async () => {
            const exportedData = { name: 'test', value: 123 };
            const dataToHash = { name: 'test', value: 123 };

            const result = await validateHash(exportedData, dataToHash);

            expect(result).toBe(false);
        });

        it('#Should return false when _hash is null', async () => {
            const exportedData = { name: 'test', _hash: null };
            const dataToHash = { name: 'test' };

            const result = await validateHash(exportedData, dataToHash);

            expect(result).toBe(false);
        });

        it('#Should return false when _hash is undefined', async () => {
            const exportedData = { name: 'test', _hash: undefined };
            const dataToHash = { name: 'test' };

            const result = await validateHash(exportedData, dataToHash);

            expect(result).toBe(false);
        });

        it('#Should return false when _hash is empty string', async () => {
            const exportedData = { name: 'test', _hash: '' };
            const dataToHash = { name: 'test' };

            const result = await validateHash(exportedData, dataToHash);

            expect(result).toBe(false);
        });

        it('#Should validate hash for complex nested objects', async () => {
            const originalData = { user: { name: 'John', roles: ['admin', 'user'] } };
            const hash = await generateHash(originalData);
            const exportedData = { ...originalData, _hash: hash };

            const result = await validateHash(exportedData, originalData);

            expect(result).toBe(true);
        });

        it('#Should detect tampering in nested data', async () => {
            const originalData = { user: { name: 'John', roles: ['admin'] } };
            const hash = await generateHash(originalData);
            const tamperedData = { user: { name: 'John', roles: ['admin', 'superadmin'] } };
            const exportedData = { ...tamperedData, _hash: hash };

            const result = await validateHash(exportedData, tamperedData);

            expect(result).toBe(false);
        });
    });

    describe('extractDataWithoutHash', () => {
        it('#Should remove _hash property from object', () => {
            const exportedData = { name: 'test', value: 123, _hash: 'abc123' };

            const result = extractDataWithoutHash(exportedData);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('#Should not modify original object', () => {
            const exportedData = { name: 'test', _hash: 'abc123' };

            extractDataWithoutHash(exportedData);

            expect(exportedData._hash).toBe('abc123');
        });

        it('#Should return all properties except _hash', () => {
            const exportedData = { prop1: 'a', prop2: 'b', prop3: 'c', _hash: 'hash' };

            const result = extractDataWithoutHash(exportedData);

            expect(Object.keys(result).length).toBe(3);
        });

        it('#Should handle object without _hash property', () => {
            const exportedData = { name: 'test', value: 123 };

            const result = extractDataWithoutHash(exportedData);

            expect(result).toEqual({ name: 'test', value: 123 });
        });

        it('#Should preserve nested objects structure', () => {
            const exportedData = { user: { name: 'John' }, _hash: 'hash123' };

            const result = extractDataWithoutHash(exportedData);

            expect(result).toEqual({ user: { name: 'John' } });
        });

        it('#Should preserve array properties', () => {
            const exportedData = { items: [1, 2, 3], _hash: 'hash123' };

            const result = extractDataWithoutHash(exportedData);

            expect(result).toEqual({ items: [1, 2, 3] });
        });

        it('#Should handle empty object with only _hash', () => {
            const exportedData = { _hash: 'hash123' };

            const result = extractDataWithoutHash(exportedData);

            expect(Object.keys(result).length).toBe(0);
        });

        it('#Should preserve null values', () => {
            const exportedData = { value: null, _hash: 'hash123' };

            const result = extractDataWithoutHash(exportedData);

            expect(result).toEqual({ value: null });
        });

        it('#Should preserve boolean values', () => {
            const exportedData = { flag: true, _hash: 'hash123' };

            const result = extractDataWithoutHash(exportedData);

            expect(result).toEqual({ flag: true });
        });

        it('#Should preserve number values', () => {
            const exportedData = { count: 0, _hash: 'hash123' };

            const result = extractDataWithoutHash(exportedData);

            expect(result).toEqual({ count: 0 });
        });
    });
});