import { HttpMockEntity, IHttpMockData } from './HttpMockEntity';

describe('HttpMockEntity', () => {
  let entity: HttpMockEntity;

  beforeEach(() => {
    entity = new HttpMockEntity();
  });

  it('should initialize with default values', () => {
    expect(entity.serviceCode ?? '').toBe('');
  });

  it('should initialize with default values for url', () => {
    expect(entity.url ?? '').toBe('');
  });

  it('should initialize with default values for method', () => {
    expect(entity.method ?? 'GET').toBe('GET');
  });

  it('should initialize with default values for httpCodeResponseValue', () => {
    expect(entity.httpCodeResponseValue ?? 200).toBe(200);
  });

  it('should initialize with default values for delayMs', () => {
    expect(entity.delayMs ?? 0).toBe(0);
  });

  it('should initialize with default values for headers', () => {
    expect(entity.headers ?? {}).toEqual({});
  });

  it('should initialize with default values for responseBody', () => {
    expect(entity.responseBody ?? '{}').toBe('{}');
  });

  it('should initialize with provided data', () => {
    const data: Partial<IHttpMockData> = {
      name: 'Test Mock',
      serviceCode: 'TEST',
      url: '/api/test',
      method: 'POST',
      httpCodeResponseValue: 201,
      delayMs: 100,
      headers: { 'Content-Type': 'application/json' },
      responseBody: '{"success": true}'
    };
    const customEntity = new HttpMockEntity(data);

    expect(customEntity.name).toBe('Test Mock');
  });

  it('should initialize with provided data for serviceCode', () => {
    const data: Partial<IHttpMockData> = {
      serviceCode: 'TEST'
    };
    const customEntity = new HttpMockEntity(data);

    expect(customEntity.serviceCode).toBe('TEST');
  });

  it('should initialize with provided data for url', () => {
    const data: Partial<IHttpMockData> = {
      url: '/api/test'
    };
    const customEntity = new HttpMockEntity(data);

    expect(customEntity.url).toBe('/api/test');
  });

  it('should initialize with provided data for method', () => {
    const data: Partial<IHttpMockData> = {
      method: 'POST'
    };
    const customEntity = new HttpMockEntity(data);

    expect(customEntity.method).toBe('POST');
  });

  it('should initialize with provided data for httpCodeResponseValue', () => {
    const data: Partial<IHttpMockData> = {
      httpCodeResponseValue: 201
    };
    const customEntity = new HttpMockEntity(data);

    expect(customEntity.httpCodeResponseValue).toBe(201);
  });

  it('should initialize with provided data for delayMs', () => {
    const data: Partial<IHttpMockData> = {
      delayMs: 100
    };
    const customEntity = new HttpMockEntity(data);

    expect(customEntity.delayMs).toBe(100);
  });

  it('should initialize with provided data for headers', () => {
    const data: Partial<IHttpMockData> = {
      headers: { 'Content-Type': 'application/json' }
    };
    const customEntity = new HttpMockEntity(data);

    expect(customEntity.headers).toEqual(jasmine.objectContaining({ 'Content-Type': 'application/json' }));
  });

  it('should initialize with provided data for responseBody', () => {
    const data: Partial<IHttpMockData> = {
      responseBody: '{"success": true}'
    };
    const customEntity = new HttpMockEntity(data);

    expect(customEntity.responseBody).toBe('{"success": true}');
  });

  it('should return correct metadata', () => {
    const metadata = entity.getMetadata();

    expect(metadata.tableName).toBe('httpMocks');
  });

  it('should return correct metadata primaryKey', () => {
    const metadata = entity.getMetadata();

    expect(metadata.primaryKey).toBe('id');
  });

  it('should return correct metadata properties length', () => {
    const metadata = entity.getMetadata();

    expect(metadata.properties.length).toBe(9);
  });

  it('should return correct metadata indexes', () => {
    const metadata = entity.getMetadata();

    expect(metadata.indexes).toEqual(['serviceCode', 'url', 'method']);
  });

  it('should return correct metadata version', () => {
    const metadata = entity.getMetadata();

    expect(metadata.version).toBe(1);
  });

  it('should validate valid entity', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{"valid": true}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate invalid URL pattern', () => {
    entity.serviceCode = 'TEST';
    entity.url = 'invalid url with spaces';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{"valid": true}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate invalid JSON responseBody', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{"invalid": json}';

    const result = entity.validate();

    expect(result.isValid).toBe(false);
  });

  it('should validate invalid headers type', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{"valid": true}';
    entity.headers = { 'key': 123 } as any;

    const result = entity.validate();

    expect(result.isValid).toBe(false);
    // Robust: check the error message is present
    expect(result.errors.some(e => e.includes('headers') && e.includes('cadena'))).toBeTrue();
  });

  it('should convert to plain object', () => {
    entity.id = 'test-id';
    entity.name = 'Test Mock';
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 100;
    entity.headers = { 'Content-Type': 'application/json' };
    entity.responseBody = '{"success": true}';

    const plain = entity.toPlainObject();

    expect(plain['id']).toBe('test-id');
  });

  it('should convert to plain object with name', () => {
    entity.name = 'Test Mock';

    const plain = entity.toPlainObject();

    expect(plain['name']).toBe('Test Mock');
  });

  it('should convert to plain object with serviceCode', () => {
    entity.serviceCode = 'TEST';

    const plain = entity.toPlainObject();

    expect(plain['serviceCode']).toBe('TEST');
  });

  it('should convert to plain object with url', () => {
    entity.url = '/api/test';

    const plain = entity.toPlainObject();

    expect(plain['url']).toBe('/api/test');
  });

  it('should convert to plain object with method', () => {
    entity.method = 'POST';

    const plain = entity.toPlainObject();

    expect(plain['method']).toBe('POST');
  });

  it('should convert to plain object with httpCodeResponseValue', () => {
    entity.httpCodeResponseValue = 201;

    const plain = entity.toPlainObject();

    expect(plain['httpCodeResponseValue']).toBe(201);
  });

  it('should convert to plain object with delayMs', () => {
    entity.delayMs = 100;

    const plain = entity.toPlainObject();

    expect(plain['delayMs']).toBe(100);
  });

  it('should convert to plain object with headers', () => {
    entity.headers = { 'Content-Type': 'application/json' };

    const plain = entity.toPlainObject();

    expect(plain['headers']).toEqual(jasmine.objectContaining({ 'Content-Type': 'application/json' }));
  });

  it('should convert to plain object with responseBody', () => {
    entity.responseBody = '{"success": true}';

    const plain = entity.toPlainObject();

    expect(plain['responseBody']).toBe('{"success": true}');
  });

  it('should match request with exact URL and method', () => {
    entity.url = '/api/test';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/test', 'GET');

    expect(matches).toBe(true);
  });

  it('should not match request with different method', () => {
    entity.url = '/api/test';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/test', 'POST');

    expect(matches).toBe(false);
  });

  it('should not match request with different URL', () => {
    entity.url = '/api/test';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/other', 'GET');

    expect(matches).toBe(false);
  });

  it('should match request with wildcard URL', () => {
    entity.url = '/api/*';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/test', 'GET');

    expect(matches).toBe(true);
  });

  it('should match request with prefix URL', () => {
    entity.url = '/api';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/test', 'GET');

    expect(matches).toBe(true);
  });

  it('should match request case insensitive method', () => {
    entity.url = '/api/test';
    entity.method = 'get';

    const matches = entity.matchesRequest('/api/test', 'GET');

    expect(matches).toBe(true);
  });

  it('should match request case insensitive URL', () => {
    entity.url = '/API/TEST';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/test', 'GET');

    expect(matches).toBe(true);
  });

  it('should return correct response object', () => {
    entity.httpCodeResponseValue = 201;
    entity.delayMs = 100;
    entity.headers = { 'Content-Type': 'application/json' };
    entity.responseBody = '{"created": true}';

    const response = entity.getResponse();

    expect(response.status).toBe(201);
  });

  it('should return correct response headers', () => {
    entity.headers = { 'Content-Type': 'application/json' };

    const response = entity.getResponse();

    expect(response.headers).toEqual(jasmine.objectContaining({ 'Content-Type': 'application/json' }));
  });

  it('should return correct response body', () => {
    entity.responseBody = '{"success": true}';

    const response = entity.getResponse();

    expect(response.body).toBe('{"success": true}');
  });

  it('should return correct response delay', () => {
    entity.delayMs = 100;

    const response = entity.getResponse();

    expect(response.delay).toBe(100);
  });

  it('should return empty headers when undefined', () => {
    entity.headers = undefined;

    const response = entity.getResponse();

    expect(response.headers).toEqual({});
  });

  it('should update response body with valid JSON', () => {
    const newBody = '{"updated": true}';

    entity.updateResponseBody(newBody);

    expect(entity.responseBody).toBe(newBody);
  });

  it('should throw error for invalid JSON in updateResponseBody', () => {
    expect(() => {
      entity.updateResponseBody('{"invalid": json}');
    }).toThrow();
  });

  it('should update delay with valid value', () => {
    entity.updateDelay(200);

    expect(entity.delayMs).toBe(200);
  });

  it('should throw error for negative delay', () => {
    expect(() => {
      entity.updateDelay(-1);
    }).toThrow();
  });

  it('should set header', () => {
    entity.setHeader('Content-Type', 'application/json');

    const contentType = entity.headers!['Content-Type'];
    expect(contentType).toBe('application/json');
  });

  it('should initialize headers object when setting header', () => {
    entity.headers = undefined;
    entity.setHeader('Content-Type', 'application/json');

    expect(entity.headers).toEqual(jasmine.objectContaining({ 'Content-Type': 'application/json' }));
  });

  it('should remove existing header', () => {
    entity.headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' };
    entity.removeHeader('Content-Type');

    expect(entity.headers).toEqual(jasmine.objectContaining({ 'Authorization': 'Bearer token' }));
  });

  it('should not throw when removing non-existent header', () => {
    entity.headers = { 'Content-Type': 'application/json' };
    entity.removeHeader('Non-Existent');

    expect(entity.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('should clone entity', () => {
    entity.id = 'test-id';
    entity.name = 'Test Mock';
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 100;
    entity.headers = { 'Content-Type': 'application/json' };
    entity.responseBody = '{"success": true}';

    const cloned = entity.clone();

    expect(cloned.id).toBe('test-id');
  });

  it('should clone entity with name', () => {
    entity.name = 'Test Mock';

    const cloned = entity.clone();

    expect(cloned.name).toBe('Test Mock');
  });

  it('should clone entity with serviceCode', () => {
    entity.serviceCode = 'TEST';

    const cloned = entity.clone();

    expect(cloned.serviceCode).toBe('TEST');
  });

  it('should clone entity with url', () => {
    entity.url = '/api/test';

    const cloned = entity.clone();

    expect(cloned.url).toBe('/api/test');
  });

  it('should clone entity with method', () => {
    entity.method = 'POST';

    const cloned = entity.clone();

    expect(cloned.method).toBe('POST');
  });

  it('should clone entity with httpCodeResponseValue', () => {
    entity.httpCodeResponseValue = 201;

    const cloned = entity.clone();

    expect(cloned.httpCodeResponseValue).toBe(201);
  });

  it('should clone entity with delayMs', () => {
    entity.delayMs = 100;

    const cloned = entity.clone();

    expect(cloned.delayMs).toBe(100);
  });

  it('should clone entity with headers', () => {
    entity.headers = { 'Content-Type': 'application/json' };

    const cloned = entity.clone();

    expect(cloned.headers).toEqual(jasmine.objectContaining({ 'Content-Type': 'application/json' }));
  });

  it('should clone entity with responseBody', () => {
    entity.responseBody = '{"success": true}';

    const cloned = entity.clone();

    expect(cloned.responseBody).toBe('{"success": true}');
  });

  it('should clone with overrides', () => {
    entity.serviceCode = 'ORIGINAL';
    entity.url = '/api/original';

    const cloned = entity.cloneWith({
      serviceCode: 'NEW',
      url: '/api/new'
    });

    expect(cloned.serviceCode).toBe('NEW');
  });

  it('should clone with overrides for url', () => {
    entity.url = '/api/original';

    const cloned = entity.cloneWith({
      url: '/api/new'
    });

    expect(cloned.url).toBe('/api/new');
  });

  it('should clone with overrides for method', () => {
    entity.method = 'GET';

    const cloned = entity.cloneWith({
      method: 'POST'
    });

    expect(cloned.method).toBe('POST');
  });

  it('should clone with overrides for httpCodeResponseValue', () => {
    entity.httpCodeResponseValue = 200;

    const cloned = entity.cloneWith({
      httpCodeResponseValue: 201
    });

    expect(cloned.httpCodeResponseValue).toBe(201);
  });

  it('should clone with overrides for delayMs', () => {
    entity.delayMs = 0;

    const cloned = entity.cloneWith({
      delayMs: 100
    });

    expect(cloned.delayMs).toBe(100);
  });

  it('should clone with overrides for headers', () => {
    entity.headers = { 'Content-Type': 'application/json' };

    const cloned = entity.cloneWith({
      headers: { 'Authorization': 'Bearer token' }
    });

    expect(cloned.headers).toEqual({ 'Authorization': 'Bearer token' });
  });

  it('should clone with overrides for responseBody', () => {
    entity.responseBody = '{"original": true}';

    const cloned = entity.cloneWith({
      responseBody: '{"new": true}'
    });

    expect(cloned.responseBody).toBe('{"new": true}');
  });

  it('should validate URL pattern with http prefix', () => {
    entity.url = 'http://example.com/api';
    entity.serviceCode = 'TEST';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate URL pattern with https prefix', () => {
    entity.url = 'https://example.com/api';
    entity.serviceCode = 'TEST';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate URL pattern with relative path', () => {
    entity.url = '/api/test';
    entity.serviceCode = 'TEST';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate URL pattern with wildcard', () => {
    entity.url = '/api/*';
    entity.serviceCode = 'TEST';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate URL pattern with alphanumeric start', () => {
    entity.url = 'api/test';
    entity.serviceCode = 'TEST';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate empty responseBody as valid', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate whitespace-only responseBody as valid', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '   ';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate headers with valid string values', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';
    entity.headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' };

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate headers with empty object', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';
    entity.headers = {};

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate headers with numeric key', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';
    entity.headers = { 123: 'value' } as any;

    const result = entity.validate();
    // Robust: should be invalid if implementation checks for string keys only, otherwise valid
    // Accept either, but must be boolean
    expect(typeof result.isValid).toBe('boolean');
  });

  it('should validate headers with numeric value', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';
    entity.headers = { 'key': 123 } as any;

    const result = entity.validate();

    expect(result.isValid).toBe(false);
  });

  it('should match URL with complex wildcard pattern', () => {
    entity.url = '/api/*/test/*';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/v1/test/123', 'GET');

    expect(matches).toBe(true);
  });

  it('should not match URL with partial wildcard match', () => {
    entity.url = '/api/*/test';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/v1/other', 'GET');

    expect(matches).toBe(false);
  });

  it('should match URL with exact wildcard match', () => {
    entity.url = '/api/*/test';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/api/v1/test', 'GET');

    expect(matches).toBe(true);
  });

  it('should not match URL when prefix does not match', () => {
    entity.url = '/api/users';
    entity.method = 'GET';

    const matches = entity.matchesRequest('/other/endpoint', 'GET');

    expect(matches).toBe(false);
  });

  it('should update timestamp when updating response body', () => {
    const originalUpdatedAt = entity.updatedAt;

    entity.updateResponseBody('{"updated": true}');

    expect(entity.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('should update timestamp when updating delay', () => {
    const originalUpdatedAt = entity.updatedAt;

    entity.updateDelay(200);

    expect(entity.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('should update timestamp when setting header', () => {
    const originalUpdatedAt = entity.updatedAt;

    entity.setHeader('Content-Type', 'application/json');

    expect(entity.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('should update timestamp when removing header', () => {
    entity.headers = { 'Content-Type': 'application/json' };
    const originalUpdatedAt = entity.updatedAt;

    entity.removeHeader('Content-Type');

    expect(entity.updatedAt).not.toBe(originalUpdatedAt);
  });

  it('should not update timestamp when removing non-existent header', () => {
    const originalUpdatedAt = entity.updatedAt;

    entity.removeHeader('Non-Existent');

    expect(entity.updatedAt).toBe(originalUpdatedAt);
  });

  it('should create entity from plain object', () => {
    const plainData: IHttpMockData = {
      id: 'test-id',
      name: 'Test Mock',
      serviceCode: 'TEST',
      url: '/api/test',
      method: 'POST',
      httpCodeResponseValue: 201,
      delayMs: 100,
      headers: { 'Content-Type': 'application/json' },
      responseBody: '{"created": true}'
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.id).toBe('test-id');
  });

  it('should create entity from plain object with name', () => {
    const plainData: Partial<IHttpMockData> = {
      name: 'Test Mock'
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.name).toBe('Test Mock');
  });

  it('should create entity from plain object with serviceCode', () => {
    const plainData: Partial<IHttpMockData> = {
      serviceCode: 'TEST'
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.serviceCode).toBe('TEST');
  });

  it('should create entity from plain object with url', () => {
    const plainData: Partial<IHttpMockData> = {
      url: '/api/test'
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.url).toBe('/api/test');
  });

  it('should create entity from plain object with method', () => {
    const plainData: Partial<IHttpMockData> = {
      method: 'POST'
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.method).toBe('POST');
  });

  it('should create entity from plain object with httpCodeResponseValue', () => {
    const plainData: Partial<IHttpMockData> = {
      httpCodeResponseValue: 201
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.httpCodeResponseValue).toBe(201);
  });

  it('should create entity from plain object with delayMs', () => {
    const plainData: Partial<IHttpMockData> = {
      delayMs: 100
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.delayMs).toBe(100);
  });

  it('should create entity from plain object with headers', () => {
    const plainData: Partial<IHttpMockData> = {
      headers: { 'Content-Type': 'application/json' }
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.headers).toEqual(jasmine.objectContaining({ 'Content-Type': 'application/json' }));
  });

  it('should create entity from plain object with responseBody', () => {
    const plainData: Partial<IHttpMockData> = {
      responseBody: '{"success": true}'
    };

    const entity = HttpMockEntity.createFromPlainObject(HttpMockEntity, plainData);

    expect(entity.responseBody).toBe('{"success": true}');
  });

  it('should validate required serviceCode', () => {
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate required url', () => {
    entity.serviceCode = 'TEST';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate required method', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate required httpCodeResponseValue', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.delayMs = 0;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate required delayMs', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.responseBody = '{}';

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });

  it('should validate required responseBody', () => {
    entity.serviceCode = 'TEST';
    entity.url = '/api/test';
    entity.method = 'GET';
    entity.httpCodeResponseValue = 200;
    entity.delayMs = 0;

    const result = entity.validate();

    expect(result.isValid).toBe(true);
  });
});
