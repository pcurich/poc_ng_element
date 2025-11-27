import { Provider, EnvironmentProviders } from '@angular/core';
import { provideHttpMockService, provideHttpMockORM, provideHttpMockORMConfig, HttpMockORMConfig } from './providers';
import { HttpMockService } from './services/HttpMockService';
import { HttpMockRepository } from './repositories/HttpMockRepository';

describe('providers', () => {
  it('provideHttpMockService should return HttpMockService', () => {
    // Arrange & Act
    const provider = provideHttpMockService();
    // Assert
    expect(provider).toBe(HttpMockService);
  });

  it('provideHttpMockORM should return EnvironmentProviders', () => {
    // Arrange & Act
    const envProviders = provideHttpMockORM();
    // Assert
    expect(envProviders).toBeTruthy();
    expect(typeof envProviders).toBe('object');
  });

  it('provideHttpMockORMConfig should return EnvironmentProviders with config', () => {
    // Arrange
    const config: HttpMockORMConfig = { enableLogging: true, dbName: 'TestDB', version: 2 };
    // Act
    const envProviders = provideHttpMockORMConfig(config);
    // Assert
    expect(envProviders).toBeTruthy();
    expect(typeof envProviders).toBe('object');
  });

  it('provideHttpMockORMConfig should use default config if none provided', () => {
    // Arrange & Act
    const envProviders = provideHttpMockORMConfig();
    // Assert
    expect(envProviders).toBeTruthy();
    expect(typeof envProviders).toBe('object');
  });
});
