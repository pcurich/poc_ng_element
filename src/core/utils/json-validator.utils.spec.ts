import {
  detectExportType,
  hasDigitalSignature,
  validateMocksExport,
  validateDatabaseExport,
  validateDatabaseConfig,
  validateImportedFile
} from './json-validator.utils';
import { IDbConfig } from '../types/database.types';

describe('json-validator.utils', () => {

  describe('detectExportType', () => {
    it('#Should return unknown when data is null', () => {
      const result = detectExportType(null);

      expect(result).toBe('unknown');
    });

    it('#Should return unknown when data is undefined', () => {
      const result = detectExportType(undefined);

      expect(result).toBe('unknown');
    });

    it('#Should return unknown when data is not an object', () => {
      const result = detectExportType('string');

      expect(result).toBe('unknown');
    });

    it('#Should return mocks when type is mocks and mocks array exists', () => {
      const data = { type: 'mocks', mocks: [] };

      const result = detectExportType(data);

      expect(result).toBe('mocks');
    });

    it('#Should return unknown when type is mocks but mocks is not array', () => {
      const data = { type: 'mocks', mocks: 'not-array' };

      const result = detectExportType(data);

      expect(result).toBe('unknown');
    });

    it('#Should return complete-database when all required fields exist', () => {
      const data = { type: 'complete-database', databaseConfig: {}, mocks: [] };

      const result = detectExportType(data);

      expect(result).toBe('complete-database');
    });

    it('#Should return unknown when type is complete-database but databaseConfig missing', () => {
      const data = { type: 'complete-database', mocks: [] };

      const result = detectExportType(data);

      expect(result).toBe('unknown');
    });

    it('#Should return unknown when type is complete-database but mocks missing', () => {
      const data = { type: 'complete-database', databaseConfig: {} };

      const result = detectExportType(data);

      expect(result).toBe('unknown');
    });

    it('#Should return manual-config when selectedContext exists', () => {
      const data = { selectedContext: 'context' };

      const result = detectExportType(data);

      expect(result).toBe('manual-config');
    });

    it('#Should return manual-config when headers exists', () => {
      const data = { headers: {} };

      const result = detectExportType(data);

      expect(result).toBe('manual-config');
    });

    it('#Should return manual-config when nameMock exists', () => {
      const data = { nameMock: 'mock-name' };

      const result = detectExportType(data);

      expect(result).toBe('manual-config');
    });

    it('#Should return manual-config when serviceCode exists', () => {
      const data = { serviceCode: 'code' };

      const result = detectExportType(data);

      expect(result).toBe('manual-config');
    });

    it('#Should return unknown when no matching pattern found', () => {
      const data = { randomField: 'value' };

      const result = detectExportType(data);

      expect(result).toBe('unknown');
    });
  });

  describe('hasDigitalSignature', () => {
    it('#Should return true when valid hash exists', () => {
      const data = { _hash: 'a'.repeat(64) };

      const result = hasDigitalSignature(data);

      expect(result).toBe(true);
    });

    it('#Should return false when data is null', () => {
      const result = hasDigitalSignature(null);

      expect(result).toBe(false);
    });

    it('#Should return false when data is undefined', () => {
      const result = hasDigitalSignature(undefined);

      expect(result).toBe(false);
    });

    it('#Should return false when data is not an object', () => {
      const result = hasDigitalSignature('string');

      expect(result).toBe(false);
    });

    it('#Should return false when _hash is not a string', () => {
      const data = { _hash: 123 };

      const result = hasDigitalSignature(data);

      expect(result).toBe(false);
    });

    it('#Should return false when _hash length is not 64', () => {
      const data = { _hash: 'short' };

      const result = hasDigitalSignature(data);

      expect(result).toBe(false);
    });

    it('#Should return false when _hash is missing', () => {
      const data = { other: 'field' };

      const result = hasDigitalSignature(data);

      expect(result).toBe(false);
    });

    it('#Should return false when _hash is empty string', () => {
      const data = { _hash: '' };

      const result = hasDigitalSignature(data);

      expect(result).toBe(false);
    });

    it('#Should return false when _hash length is greater than 64', () => {
      const data = { _hash: 'a'.repeat(65) };

      const result = hasDigitalSignature(data);

      expect(result).toBe(false);
    });

    it('#Should return false when _hash length is less than 64', () => {
      const data = { _hash: 'a'.repeat(63) };

      const result = hasDigitalSignature(data);

      expect(result).toBe(false);
    });
  });

  describe('validateMocksExport', () => {
    it('#Should return valid result for correct mocks export', () => {
      const data = { type: 'mocks', mocks: [{ id: 1 }] };

      const result = validateMocksExport(data);

      expect(result.isValid).toBe(true);
    });

    it('#Should return invalid when data is null', () => {
      const result = validateMocksExport(null);

      expect(result.isValid).toBe(false);
    });

    it('#Should return unknown type when data is null', () => {
      const result = validateMocksExport(null);

      expect(result.type).toBe('unknown');
    });

    it('#Should add error when data is not object', () => {
      const result = validateMocksExport('string');

      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('#Should add error when type is not mocks', () => {
      const data = { type: 'other', mocks: [] };

      const result = validateMocksExport(data);

      expect(result.errors).toContain('Tipo esperado: "mocks", recibido: "other"');
    });

    it('#Should add error when mocks is not array', () => {
      const data = { type: 'mocks', mocks: 'not-array' };

      const result = validateMocksExport(data);

      expect(result.errors).toContain('El campo "mocks" debe ser un array');
    });

    it('#Should add warning when mocks array is empty', () => {
      const data = { type: 'mocks', mocks: [] };

      const result = validateMocksExport(data);

      expect(result.warnings).toContain('El array de mocks está vacío');
    });

    it('#Should add warning when exportDate is not string', () => {
      const data = { type: 'mocks', mocks: [], exportDate: 123 };

      const result = validateMocksExport(data);

      expect(result.warnings).toContain('El campo "exportDate" debe ser una cadena ISO');
    });

    it('#Should not add warning when exportDate is valid string', () => {
      const data = { type: 'mocks', mocks: [], exportDate: '2025-12-24' };

      const result = validateMocksExport(data);

      expect(result.warnings.some(w => w.includes('exportDate'))).toBe(false);
    });

    it('#Should add warning when totalMocks is not number', () => {
      const data = { type: 'mocks', mocks: [], totalMocks: 'not-number' };

      const result = validateMocksExport(data);

      expect(result.warnings).toContain('El campo "totalMocks" debe ser un número');
    });

    it('#Should not add warning when totalMocks is valid number', () => {
      const data = { type: 'mocks', mocks: [], totalMocks: 5 };

      const result = validateMocksExport(data);

      expect(result.warnings.some(w => w.includes('totalMocks'))).toBe(false);
    });

    it('#Should return mocks type', () => {
      const data = { type: 'mocks', mocks: [] };

      const result = validateMocksExport(data);

      expect(result.type).toBe('mocks');
    });
  });

  describe('validateDatabaseExport', () => {
    it('#Should return valid result for correct database export', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: {
          name: 'testDB',
          version: 1,
          objectStores: [{ name: 'store1' }]
        },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.isValid).toBe(true);
    });

    it('#Should return invalid when data is null', () => {
      const result = validateDatabaseExport(null);

      expect(result.isValid).toBe(false);
    });

    it('#Should return unknown type when data is invalid', () => {
      const result = validateDatabaseExport(null);

      expect(result.type).toBe('unknown');
    });

    it('#Should add error when type is not complete-database', () => {
      const data = { type: 'other' };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('Tipo esperado: "complete-database", recibido: "other"');
    });

    it('#Should add error when databaseConfig is missing', () => {
      const data = { type: 'complete-database' };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('Falta el campo "databaseConfig" o no es un objeto');
    });

    it('#Should add error when databaseConfig is not object', () => {
      const data = { type: 'complete-database', databaseConfig: 'not-object' };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('Falta el campo "databaseConfig" o no es un objeto');
    });

    it('#Should add error when databaseConfig name is missing', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { version: 1, objectStores: [] },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('databaseConfig.name es requerido y debe ser string');
    });

    it('#Should add error when databaseConfig name is not string', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 123, version: 1, objectStores: [] },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('databaseConfig.name es requerido y debe ser string');
    });

    it('#Should add error when databaseConfig version is missing', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 'db', objectStores: [] },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('databaseConfig.version es requerido y debe ser number');
    });

    it('#Should add error when databaseConfig version is not number', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 'db', version: 'not-number', objectStores: [] },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('databaseConfig.version es requerido y debe ser number');
    });

    it('#Should add error when objectStores is not array', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 'db', version: 1, objectStores: 'not-array' },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('databaseConfig.objectStores es requerido y debe ser un array');
    });

    it('#Should add error when objectStores is empty', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 'db', version: 1, objectStores: [] },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('databaseConfig.objectStores no puede estar vacío');
    });

    it('#Should add error when mocks is not array', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 'db', version: 1, objectStores: [{}] },
        mocks: 'not-array'
      };

      const result = validateDatabaseExport(data);

      expect(result.errors).toContain('El campo "mocks" debe ser un array');
    });

    it('#Should add warning when mocks array is empty', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 'db', version: 1, objectStores: [{ name: 'store' }] },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.warnings).toContain('El array de mocks está vacío');
    });

    it('#Should return complete-database type', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 'db', version: 1, objectStores: [{}] },
        mocks: []
      };

      const result = validateDatabaseExport(data);

      expect(result.type).toBe('complete-database');
    });
  });

  describe('validateDatabaseConfig', () => {
    it('#Should return valid result for correct config', () => {
      const config: IDbConfig = {
        name: 'testDB',
        version: 1,
        objectStores: [{ name: 'store1' }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.isValid).toBe(true);
    });

    it('#Should add error when name is empty', () => {
      const config: IDbConfig = {
        name: '',
        version: 1,
        objectStores: []
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('El nombre de la base de datos es requerido');
    });

    it('#Should add error when name is whitespace', () => {
      const config: IDbConfig = {
        name: '   ',
        version: 1,
        objectStores: []
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('El nombre de la base de datos es requerido');
    });

    it('#Should add error when version is undefined', () => {
      const config: any = {
        name: 'db',
        objectStores: []
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('La versión debe ser >= 1');
    });

    it('#Should add error when version is less than 1', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 0,
        objectStores: []
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('La versión debe ser >= 1');
    });

    it('#Should add error when objectStores is not array', () => {
      const config: any = {
        name: 'db',
        version: 1,
        objectStores: 'not-array'
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('objectStores es requerido y debe ser un array');
    });

    it('#Should add error when objectStores is empty', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 1,
        objectStores: []
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('Debe haber al menos un object store');
    });

    it('#Should add error when object store name is empty', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 1,
        objectStores: [{ name: '' }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('Object store 0: el nombre es requerido');
    });

    it('#Should add error when object store name is whitespace', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 1,
        objectStores: [{ name: '  ' }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('Object store 0: el nombre es requerido');
    });

    it('#Should add error when indexes is not array', () => {
      const config: any = {
        name: 'db',
        version: 1,
        objectStores: [{ name: 'store', indexes: 'not-array' }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('Object store 0: los índices deben ser un array');
    });

    it('#Should add error when index name is empty', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 1,
        objectStores: [{
          name: 'store',
          indexes: [{ name: '', keyPath: 'field' }]
        }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('Object store 0, índice 0: el nombre es requerido');
    });

    it('#Should add error when index keyPath is empty string', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 1,
        objectStores: [{
          name: 'store',
          indexes: [{ name: 'idx', keyPath: '' }]
        }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('Object store 0, índice 0: el keyPath es requerido');
    });

    it('#Should add error when index keyPath is empty array', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 1,
        objectStores: [{
          name: 'store',
          indexes: [{ name: 'idx', keyPath: [] }]
        }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.errors).toContain('Object store 0, índice 0: el keyPath es requerido');
    });

    it('#Should return complete-database type', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 1,
        objectStores: [{ name: 'store' }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.type).toBe('complete-database');
    });

    it('#Should return empty warnings array', () => {
      const config: IDbConfig = {
        name: 'db',
        version: 1,
        objectStores: [{ name: 'store' }]
      };

      const result = validateDatabaseConfig(config);

      expect(result.warnings.length).toBe(0);
    });
  });

  describe('validateImportedFile', () => {
    it('#Should validate mocks export correctly', () => {
      const data = { type: 'mocks', mocks: [{ id: 1 }] };

      const result = validateImportedFile(data);

      expect(result.type).toBe('mocks');
    });

    it('#Should validate complete-database export correctly', () => {
      const data = {
        type: 'complete-database',
        databaseConfig: { name: 'db', version: 1, objectStores: [{ name: 'store' }] },
        mocks: []
      };

      const result = validateImportedFile(data);

      expect(result.type).toBe('complete-database');
    });

    it('#Should validate manual-config as valid', () => {
      const data = { selectedContext: 'context' };

      const result = validateImportedFile(data);

      expect(result.isValid).toBe(true);
    });

    it('#Should return manual-config type', () => {
      const data = { headers: {} };

      const result = validateImportedFile(data);

      expect(result.type).toBe('manual-config');
    });

    it('#Should add warning for manual-config', () => {
      const data = { nameMock: 'name' };

      const result = validateImportedFile(data);

      expect(result.warnings).toContain('Configuración manual sin firma digital');
    });

    it('#Should return empty errors for manual-config', () => {
      const data = { serviceCode: 'code' };

      const result = validateImportedFile(data);

      expect(result.errors.length).toBe(0);
    });

    it('#Should return invalid for unknown type', () => {
      const data = { random: 'field' };

      const result = validateImportedFile(data);

      expect(result.isValid).toBe(false);
    });

    it('#Should return unknown type for unrecognized data', () => {
      const data = { random: 'field' };

      const result = validateImportedFile(data);

      expect(result.type).toBe('unknown');
    });

    it('#Should add error for unknown format', () => {
      const data = { random: 'field' };

      const result = validateImportedFile(data);

      expect(result.errors).toContain('Formato de archivo no reconocido');
    });

    it('#Should return empty warnings for unknown type', () => {
      const data = { random: 'field' };

      const result = validateImportedFile(data);

      expect(result.warnings.length).toBe(0);
    });
  });
});