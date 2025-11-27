import { detectExportType, hasDigitalSignature, validateMocksExport, validateDatabaseExport, validateDatabaseConfig, validateImportedFile, ExportFileType, ValidationResult } from './json-validator.utils';
import { DatabaseConfig } from '../../app/components/interfaces';

describe('JsonValidatorUtils', () => {
  describe('detectExportType', () => {
    it('should return unknown for null', () => {
      expect(detectExportType(null)).toBe('unknown');
    });

    it('should return unknown for undefined', () => {
      expect(detectExportType(undefined)).toBe('unknown');
    });

    it('should return unknown for non-object', () => {
      expect(detectExportType('string')).toBe('unknown');
    });

    it('should return unknown for empty object', () => {
      expect(detectExportType({})).toBe('unknown');
    });

    it('should return mocks for valid mocks export', () => {
      const data = { type: 'mocks', mocks: [] };
      expect(detectExportType(data)).toBe('mocks');
    });

    it('should return complete-database for valid database export', () => {
      const data = { type: 'complete-database', databaseConfig: {}, mocks: [] };
      expect(detectExportType(data)).toBe('complete-database');
    });

    it('should return manual-config for object with selectedContext', () => {
      const data = { selectedContext: 'test' };
      expect(detectExportType(data)).toBe('manual-config');
    });

    it('should return manual-config for object with headers', () => {
      const data = { headers: {} };
      expect(detectExportType(data)).toBe('manual-config');
    });

    it('should return manual-config for object with nameMock', () => {
      const data = { nameMock: 'test' };
      expect(detectExportType(data)).toBe('manual-config');
    });

    it('should return manual-config for object with serviceCode', () => {
      const data = { serviceCode: 'test' };
      expect(detectExportType(data)).toBe('manual-config');
    });

    it('should return unknown for invalid mocks export', () => {
      const data = { type: 'mocks' };
      expect(detectExportType(data)).toBe('unknown');
    });

    it('should return unknown for invalid database export', () => {
      const data = { type: 'complete-database' };
      expect(detectExportType(data)).toBe('unknown');
    });
  });

  describe('hasDigitalSignature', () => {
    it('should return false for null', () => {
      expect(hasDigitalSignature(null)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(hasDigitalSignature('string')).toBe(false);
    });

    it('should return false for object without _hash', () => {
      expect(hasDigitalSignature({})).toBe(false);
    });

    it('should return false for object with non-string _hash', () => {
      expect(hasDigitalSignature({ _hash: 123 })).toBe(false);
    });

    it('should return false for object with short _hash', () => {
      expect(hasDigitalSignature({ _hash: 'short' })).toBe(false);
    });

    it('should return false for object with long _hash', () => {
      expect(hasDigitalSignature({ _hash: 'a'.repeat(65) })).toBe(false);
    });

    it('should return true for object with valid _hash', () => {
      expect(hasDigitalSignature({ _hash: 'a'.repeat(64) })).toBe(true);
    });
  });

  describe('validateMocksExport', () => {
    it('should return invalid for null', () => {
      const result = validateMocksExport(null);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-object', () => {
      const result = validateMocksExport('string');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for wrong type', () => {
      const data = { type: 'wrong', mocks: [] };
      const result = validateMocksExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-array mocks', () => {
      const data = { type: 'mocks', mocks: 'not-array' };
      const result = validateMocksExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return valid for empty mocks array', () => {
      const data = { type: 'mocks', mocks: [] };
      const result = validateMocksExport(data);
      expect(result.isValid).toBe(true);
    });

    it('should return warning for empty mocks array', () => {
      const data = { type: 'mocks', mocks: [] };
      const result = validateMocksExport(data);
      expect(result.warnings).toContain('El array de mocks está vacío');
    });

    it('should return warning for invalid exportDate', () => {
      const data = { type: 'mocks', mocks: [], exportDate: 123 };
      const result = validateMocksExport(data);
      expect(result.warnings).toContain('El campo "exportDate" debe ser una cadena ISO');
    });

    it('should return warning for invalid totalMocks', () => {
      const data = { type: 'mocks', mocks: [], totalMocks: 'not-number' };
      const result = validateMocksExport(data);
      expect(result.warnings).toContain('El campo "totalMocks" debe ser un número');
    });

    it('should return valid for complete valid data', () => {
      const data = { type: 'mocks', mocks: [{}], exportDate: '2023-01-01', totalMocks: 1 };
      const result = validateMocksExport(data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateDatabaseExport', () => {
    it('should return invalid for null', () => {
      const result = validateDatabaseExport(null);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-object', () => {
      const result = validateDatabaseExport('string');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for wrong type', () => {
      const data = { type: 'wrong', databaseConfig: {}, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for missing databaseConfig', () => {
      const data = { type: 'complete-database', mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-object databaseConfig', () => {
      const data = { type: 'complete-database', databaseConfig: 'not-object', mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for missing config name', () => {
      const data = { type: 'complete-database', databaseConfig: { version: 1, objectStoreName: 'test', keyPath: 'id' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-string config name', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 123, version: 1, objectStoreName: 'test', keyPath: 'id' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for missing config version', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', objectStoreName: 'test', keyPath: 'id' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-number config version', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 'not-number', objectStoreName: 'test', keyPath: 'id' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for missing config objectStoreName', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, keyPath: 'id' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-string config objectStoreName', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, objectStoreName: 123, keyPath: 'id' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for missing config keyPath', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, objectStoreName: 'test' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-string config keyPath', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, objectStoreName: 'test', keyPath: 123 }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return warning for non-array config indexes', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: 'not-array' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.warnings).toContain('databaseConfig.indexes debe ser un array');
    });

    it('should return invalid for non-array mocks', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id' }, mocks: 'not-array' };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(false);
    });

    it('should return warning for empty mocks array', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id' }, mocks: [] };
      const result = validateDatabaseExport(data);
      expect(result.warnings).toContain('El array de mocks está vacío');
    });

    it('should return valid for complete valid data', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [] }, mocks: [{}] };
      const result = validateDatabaseExport(data);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateDatabaseConfig', () => {
    it('should return invalid for missing name', () => {
      const config: DatabaseConfig = { name: '', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for empty name', () => {
      const config: DatabaseConfig = { name: '', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for version less than 1', () => {
      const config: DatabaseConfig = { name: 'test', version: 0, objectStoreName: 'test', keyPath: 'id', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for undefined version', () => {
      const config: DatabaseConfig = { name: 'test', version: 0, objectStoreName: 'test', keyPath: 'id', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for missing objectStoreName', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: '', keyPath: 'id', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for empty objectStoreName', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: '', keyPath: 'id', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for missing keyPath', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: '', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for empty keyPath', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: '', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for non-array indexes', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: 'not-array' as any };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for index without name', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [{ name: '', keyPath: 'test' }] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for index with empty name', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [{ name: '', keyPath: 'test' }] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for index without keyPath', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [{ name: 'test', keyPath: '' }] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for index with empty keyPath', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [{ name: 'test', keyPath: '' }] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(false);
    });

    it('should return warning for index without unique', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [{ name: 'test', keyPath: 'test' }] };
      const result = validateDatabaseConfig(config);
      expect(result.warnings).toContain('Índice 0: unique no definido (default: false)');
    });

    it('should return valid for minimal config', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for config with valid indexes', () => {
      const config: DatabaseConfig = { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id', indexes: [{ name: 'test', keyPath: 'test', unique: true }] };
      const result = validateDatabaseConfig(config);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateImportedFile', () => {
    it('should validate mocks export', () => {
      const data = { type: 'mocks', mocks: [] };
      const result = validateImportedFile(data);
      expect(result.type).toBe('mocks');
    });

    it('should validate database export', () => {
      const data = { type: 'complete-database', databaseConfig: { name: 'test', version: 1, objectStoreName: 'test', keyPath: 'id' }, mocks: [] };
      const result = validateImportedFile(data);
      expect(result.type).toBe('complete-database');
    });

    it('should validate manual config', () => {
      const data = { selectedContext: 'test' };
      const result = validateImportedFile(data);
      expect(result.type).toBe('manual-config');
    });

    it('should return invalid for unknown type', () => {
      const data = { unknown: 'field' };
      const result = validateImportedFile(data);
      expect(result.isValid).toBe(false);
    });

    it('should return manual config as valid', () => {
      const data = { selectedContext: 'test' };
      const result = validateImportedFile(data);
      expect(result.isValid).toBe(true);
    });

    it('should return warning for manual config', () => {
      const data = { selectedContext: 'test' };
      const result = validateImportedFile(data);
      expect(result.warnings).toContain('Configuración manual sin firma digital');
    });
  });
});
