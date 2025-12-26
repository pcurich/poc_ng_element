import {
    downloadAsJson,
    createJsonBlob,
    readFileAsText,
    readJsonFile,
    addTimestampToFilename,
    generateFilenameWithTimestamp
} from './file-export.utils';
import { DownloadOptions } from '../types/file-download.types';

describe('file-export.utils', () => {

    describe('downloadAsJson', () => {
        let mockAnchor: jasmine.SpyObj<HTMLAnchorElement>;
        let createElementSpy: jasmine.Spy;
        let createObjectURLSpy: jasmine.Spy;
        let revokeObjectURLSpy: jasmine.Spy;
        let appendChildSpy: jasmine.Spy;

        beforeEach(() => {
            mockAnchor = jasmine.createSpyObj('a', ['click', 'remove']);
            createElementSpy = spyOn(document, 'createElement').and.returnValue(mockAnchor);
            createObjectURLSpy = spyOn(URL, 'createObjectURL').and.returnValue('blob:mock-url');
            revokeObjectURLSpy = spyOn(URL, 'revokeObjectURL');
            appendChildSpy = spyOn(document.body, 'appendChild');
        });

        it('#Should download JSON file with timestamp when addTimestamp is true', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'export.json', addTimestamp: true };
            spyOn(Date, 'now').and.returnValue(1234567890);

            downloadAsJson(testData, options);

            expect(mockAnchor.download).toBe('export-1234567890.json');
        });

        it('#Should download JSON file without timestamp when addTimestamp is false', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'export.json', addTimestamp: false };

            downloadAsJson(testData, options);

            expect(mockAnchor.download).toBe('export.json');
        });

        it('#Should create blob with correct JSON content', () => {
            const testData = { key: 'value', number: 42 };
            const options: DownloadOptions = { filename: 'test.json', addTimestamp: false };
            let capturedBlob: Blob | undefined;
            spyOn(window, 'Blob').and.callFake(function (this: any, parts?: BlobPart[], opts?: BlobPropertyBag): Blob {
                capturedBlob = new (Blob as any)(parts, opts);
                return capturedBlob!;
            });

            downloadAsJson(testData, options);

            expect(capturedBlob).toBeDefined();
        });

        it('#Should use custom mime type when provided', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'export.json', mimeType: 'text/plain', addTimestamp: false };
            let capturedMimeType: string = '';
            spyOn(window, 'Blob').and.callFake(function (parts?: any[], opts?: any) {
                capturedMimeType = opts?.type;
                return new Blob(parts, opts);
            });

            downloadAsJson(testData, options);

            expect(capturedMimeType).toBe('text/plain');
        });

        it('#Should use default mime type application/json when not provided', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'export.json', addTimestamp: false };
            let capturedMimeType: string = '';
            spyOn(window, 'Blob').and.callFake(function (parts?: any[], opts?: any) {
                capturedMimeType = opts?.type;
                return new Blob(parts, opts);
            });

            downloadAsJson(testData, options);

            expect(capturedMimeType).toBe('application/json');
        });

        it('#Should create object URL from blob', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'test.json', addTimestamp: false };

            downloadAsJson(testData, options);

            expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
        });

        it('#Should set anchor href to created URL', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'test.json', addTimestamp: false };

            downloadAsJson(testData, options);

            expect(mockAnchor.href).toBe('blob:mock-url');
        });

        it('#Should append anchor to document body', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'test.json', addTimestamp: false };

            downloadAsJson(testData, options);

            expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
        });

        it('#Should trigger anchor click', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'test.json', addTimestamp: false };

            downloadAsJson(testData, options);

            expect(mockAnchor.click).toHaveBeenCalledTimes(1);
        });

        it('#Should remove anchor from DOM after download', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'test.json', addTimestamp: false };

            downloadAsJson(testData, options);

            expect(mockAnchor.remove).toHaveBeenCalledTimes(1);
        });

        it('#Should revoke object URL after download', () => {
            const testData = { test: 'data' };
            const options: DownloadOptions = { filename: 'test.json', addTimestamp: false };

            downloadAsJson(testData, options);

            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
        });
    });

    describe('createJsonBlob', () => {
        it('#Should create blob with stringified JSON data', () => {
            const testData = { key: 'value', number: 123 };

            const result = createJsonBlob(testData);

            expect(result instanceof Blob).toBe(true);
        });

        it('#Should use default mime type application/json', () => {
            const testData = { test: 'data' };

            const result = createJsonBlob(testData);

            expect(result.type).toBe('application/json');
        });

        it('#Should use custom mime type when provided', () => {
            const testData = { test: 'data' };
            const customMimeType = 'text/plain';

            const result = createJsonBlob(testData, customMimeType);

            expect(result.type).toBe('text/plain');
        });

        it('#Should format JSON with 2 space indentation', async () => {
            const testData = { key: 'value' };
            const expectedJson = JSON.stringify(testData, null, 2);

            const result = createJsonBlob(testData);
            const text = await result.text();

            expect(text).toBe(expectedJson);
        });
    });

    describe('readFileAsText', () => {
        it('#Should resolve with file text content', async () => {
            const fileContent = 'test file content';
            const mockFile = new File([fileContent], 'test.txt', { type: 'text/plain' });

            const result = await readFileAsText(mockFile);

            expect(result).toBe(fileContent);
        });

        it('#Should reject with error when file read fails', async () => {
            const mockFile = new File(['content'], 'test.txt');
            spyOn(FileReader.prototype, 'readAsText').and.callFake(function (this: FileReader) {
                setTimeout(() => this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>), 0);
            });

            try {
                await readFileAsText(mockFile);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toEqual(new Error('Failed to read file'));
            }
        });

        it('#Should use FileReader readAsText method', async () => {
            const mockFile = new File(['content'], 'test.txt');
            const readAsTextSpy = spyOn(FileReader.prototype, 'readAsText');

            await readFileAsText(mockFile);

            expect(readAsTextSpy).toHaveBeenCalledWith(mockFile);
        });
    });

    describe('readJsonFile', () => {
        it('#Should parse and return JSON object from file', async () => {
            const jsonData = { key: 'value', number: 42 };
            const fileContent = JSON.stringify(jsonData);
            const mockFile = new File([fileContent], 'test.json', { type: 'application/json' });

            const result = await readJsonFile(mockFile);

            expect(result).toEqual(jsonData);
        });

        it('#Should handle typed JSON parsing', async () => {
            interface TestType { name: string; count: number; }
            const jsonData: TestType = { name: 'test', count: 5 };
            const fileContent = JSON.stringify(jsonData);
            const mockFile = new File([fileContent], 'test.json');

            const result = await readJsonFile<TestType>(mockFile);

            expect(result.name).toBe('test');
        });

        it('#Should reject when file contains invalid JSON', async () => {
            const invalidJson = '{ invalid json }';
            const mockFile = new File([invalidJson], 'test.json');

            try {
                await readJsonFile(mockFile);
                fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(SyntaxError);
            }
        });
    });

    describe('addTimestampToFilename', () => {
        beforeEach(() => {
            spyOn(Date, 'now').and.returnValue(1234567890);
        });

        it('#Should add timestamp before file extension', () => {
            const filename = 'export.json';

            const result = addTimestampToFilename(filename);

            expect(result).toBe('export-1234567890.json');
        });

        it('#Should handle files without extension', () => {
            const filename = 'export';

            const result = addTimestampToFilename(filename);

            expect(result).toBe('export-1234567890');
        });

        it('#Should handle double extensions correctly', () => {
            const filename = 'backup.tar.gz';

            const result = addTimestampToFilename(filename);

            expect(result).toBe('backup.tar-1234567890.gz');
        });

        it('#Should handle filenames starting with dot', () => {
            const filename = '.gitignore';

            const result = addTimestampToFilename(filename);

            expect(result).toBe('.gitignore-1234567890');
        });

        it('#Should handle empty string filename', () => {
            const filename = '';

            const result = addTimestampToFilename(filename);

            expect(result).toBe('-1234567890');
        });
    });

    describe('generateFilenameWithTimestamp', () => {
        beforeEach(() => {
            spyOn(Date, 'now').and.returnValue(9876543210);
        });

        it('#Should generate filename with timestamp format', () => {
            const basename = 'export';
            const extension = 'json';

            const result = generateFilenameWithTimestamp(basename, extension);

            expect(result).toBe('export-9876543210.json');
        });

        it('#Should handle empty basename', () => {
            const basename = '';
            const extension = 'txt';

            const result = generateFilenameWithTimestamp(basename, extension);

            expect(result).toBe('-9876543210.txt');
        });

        it('#Should handle empty extension', () => {
            const basename = 'file';
            const extension = '';

            const result = generateFilenameWithTimestamp(basename, extension);

            expect(result).toBe('file-9876543210.');
        });

        it('#Should use current timestamp from Date.now', () => {
            const basename = 'test';
            const extension = 'json';
            const dateNowSpy = Date.now as jasmine.Spy;

            generateFilenameWithTimestamp(basename, extension);

            expect(dateNowSpy).toHaveBeenCalled();
        });
    });
});
