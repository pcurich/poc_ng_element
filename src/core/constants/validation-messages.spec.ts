import { ValidationMessages, createValidationMessage, ValidationMessageType } from './validation-messages';

describe('ValidationMessages', () => {
  describe('MOCK_CREATED', () => {
    it('should return success message for mock creation', () => {
      const result = ValidationMessages.MOCK_CREATED('TestMock');
      expect(result).toEqual({
        type: 'success',
        text: '✅ Mock "TestMock" creado exitosamente',
        durationMs: 3000
      });
    });
  });

  describe('MOCK_UPDATED', () => {
    it('should return success message for mock update', () => {
      const result = ValidationMessages.MOCK_UPDATED('TestMock');
      expect(result).toEqual({
        type: 'success',
        text: '✅ Mock "TestMock" actualizado exitosamente',
        durationMs: 3000
      });
    });
  });

  describe('MOCK_DELETED', () => {
    it('should return success message for mock deletion', () => {
      const result = ValidationMessages.MOCK_DELETED();
      expect(result).toEqual({
        type: 'success',
        text: '🗑️ Mock eliminado exitosamente',
        durationMs: 3000
      });
    });
  });

  describe('MOCKS_LOADED', () => {
    it('should return info message for singular mock loaded', () => {
      const result = ValidationMessages.MOCKS_LOADED(1);
      expect(result).toEqual({
        type: 'info',
        text: '📦 1 mock cargado',
        durationMs: 2000
      });
    });

    it('should return info message for plural mocks loaded', () => {
      const result = ValidationMessages.MOCKS_LOADED(2);
      expect(result).toEqual({
        type: 'info',
        text: '📦 2 mocks cargados',
        durationMs: 2000
      });
    });
  });

  describe('MOCKS_EXPORTED', () => {
    it('should return success message for singular mock exported', () => {
      const result = ValidationMessages.MOCKS_EXPORTED(1);
      expect(result).toEqual({
        type: 'success',
        text: '✅ 1 mock exportado exitosamente con firma digital',
        durationMs: 3000
      });
    });

    it('should return success message for plural mocks exported', () => {
      const result = ValidationMessages.MOCKS_EXPORTED(2);
      expect(result).toEqual({
        type: 'success',
        text: '✅ 2 mocks exportados exitosamente con firma digital',
        durationMs: 3000
      });
    });
  });

  describe('NO_MOCKS_TO_EXPORT', () => {
    it('should return error message for no mocks to export', () => {
      const result = ValidationMessages.NO_MOCKS_TO_EXPORT();
      expect(result).toEqual({
        type: 'error',
        text: '❌ No hay mocks para exportar. La base de datos está vacía',
        durationMs: 3000
      });
    });
  });

  describe('JSON_VALID', () => {
    it('should return success message for valid JSON', () => {
      const result = ValidationMessages.JSON_VALID();
      expect(result).toEqual({
        type: 'success',
        text: '✅ JSON válido - La estructura es correcta',
        durationMs: 3000
      });
    });
  });

  describe('JSON_INVALID', () => {
    it('should return error message for invalid JSON', () => {
      const result = ValidationMessages.JSON_INVALID('Syntax error');
      expect(result).toEqual({
        type: 'error',
        text: '❌ JSON inválido: Syntax error',
        durationMs: 5000
      });
    });
  });

  describe('JSON_FORMATTED', () => {
    it('should return success message for formatted JSON', () => {
      const result = ValidationMessages.JSON_FORMATTED();
      expect(result).toEqual({
        type: 'success',
        text: '🎨 JSON formateado correctamente',
        durationMs: 2000
      });
    });
  });

  describe('JSON_FORMAT_ERROR', () => {
    it('should return error message for JSON format error', () => {
      const result = ValidationMessages.JSON_FORMAT_ERROR('Invalid structure');
      expect(result).toEqual({
        type: 'error',
        text: '❌ No se puede formatear: JSON inválido - Invalid structure',
        durationMs: 5000
      });
    });
  });

  describe('HEADER_ADDED', () => {
    it('should return success message for header added', () => {
      const result = ValidationMessages.HEADER_ADDED('Content-Type');
      expect(result).toEqual({
        type: 'success',
        text: '✅ Cabecera "Content-Type" agregada exitosamente',
        durationMs: 2000
      });
    });
  });

  describe('IMPORT_SUCCESS_WITH_SIGNATURE', () => {
    it('should return success message for singular mock imported', () => {
      const result = ValidationMessages.IMPORT_SUCCESS_WITH_SIGNATURE(1);
      expect(result).toEqual({
        type: 'success',
        text: '✅ 1 mock importado correctamente. Firma verificada ✓',
        durationMs: 3000
      });
    });

    it('should return success message for plural mocks imported', () => {
      const result = ValidationMessages.IMPORT_SUCCESS_WITH_SIGNATURE(2);
      expect(result).toEqual({
        type: 'success',
        text: '✅ 2 mocks importados correctamente. Firma verificada ✓',
        durationMs: 3000
      });
    });
  });

  describe('DATABASE_RESTORED', () => {
    it('should return success message for database restored', () => {
      const result = ValidationMessages.DATABASE_RESTORED(5);
      expect(result).toEqual({
        type: 'success',
        text: '✅ Base de datos completa restaurada: 5 mocks importados. Firma verificada ✓',
        durationMs: 3000
      });
    });
  });

  describe('NO_HASH_SIGNATURE', () => {
    it('should return error message for missing hash signature', () => {
      const result = ValidationMessages.NO_HASH_SIGNATURE();
      expect(result).toEqual({
        type: 'error',
        text: 'El archivo adjuntado no es válido: falta la firma digital (hash) requerida para la validación.',
        durationMs: 4000
      });
    });
  });

  describe('INVALID_SIGNATURE', () => {
    it('should return error message for invalid signature', () => {
      const result = ValidationMessages.INVALID_SIGNATURE();
      expect(result).toEqual({
        type: 'error',
        text: '❌ Firma digital inválida. El archivo ha sido modificado o está corrupto',
        durationMs: 5000
      });
    });
  });

  describe('IMPORT_ERROR', () => {
    it('should return error message for import error', () => {
      const result = ValidationMessages.IMPORT_ERROR();
      expect(result).toEqual({
        type: 'error',
        text: '❌ Error al importar el archivo. Verifique que sea un JSON válido',
        durationMs: 5000
      });
    });
  });

  describe('INVALID_FILE_FORMAT', () => {
    it('should return error message for invalid file format', () => {
      const result = ValidationMessages.INVALID_FILE_FORMAT();
      expect(result).toEqual({
        type: 'error',
        text: '❌ Formato de archivo no reconocido',
        durationMs: 5000
      });
    });
  });

  describe('VALIDATION_ERRORS', () => {
    it('should return error message for validation errors', () => {
      const result = ValidationMessages.VALIDATION_ERRORS(['Field required', 'Invalid format']);
      expect(result).toEqual({
        type: 'error',
        text: '❌ Field required, Invalid format',
        durationMs: 5000
      });
    });
  });

  describe('PRESENTER_ERROR', () => {
    it('should return error message for presenter error', () => {
      const result = ValidationMessages.PRESENTER_ERROR('Connection failed');
      expect(result).toEqual({
        type: 'error',
        text: '❌ Error: Connection failed',
        durationMs: 5000
      });
    });
  });

  describe('SAVE_ERROR', () => {
    it('should return error message for save error', () => {
      const result = ValidationMessages.SAVE_ERROR('Database timeout');
      expect(result).toEqual({
        type: 'error',
        text: '❌ Error al guardar: Database timeout',
        durationMs: 5000
      });
    });
  });

  describe('DATABASE_CREATED', () => {
    it('should return success message for database created', () => {
      const result = ValidationMessages.DATABASE_CREATED();
      expect(result).toEqual({
        type: 'success',
        text: '✅ Base de datos creada exitosamente',
        durationMs: 3000
      });
    });
  });

  describe('DATABASE_DELETED', () => {
    it('should return success message for database deleted', () => {
      const result = ValidationMessages.DATABASE_DELETED();
      expect(result).toEqual({
        type: 'success',
        text: '✅ Base de datos eliminada exitosamente',
        durationMs: 3000
      });
    });
  });

  describe('DATABASE_REINITIALIZED', () => {
    it('should return success message for database reinitialized', () => {
      const result = ValidationMessages.DATABASE_REINITIALIZED();
      expect(result).toEqual({
        type: 'success',
        text: '✅ Base de datos reinicializada con estado vacío',
        durationMs: 3000
      });
    });
  });

  describe('MISSING_REQUIRED_FIELDS', () => {
    it('should return error message for missing required fields', () => {
      const result = ValidationMessages.MISSING_REQUIRED_FIELDS();
      expect(result).toEqual({
        type: 'error',
        text: '❌ Campos requeridos faltantes: nameMock, url, serviceCode, httpMethod, httpCodeResponseValue, delayMs o body son obligatorios',
        durationMs: 5000
      });
    });
  });

  describe('OPERATION_SUCCESS', () => {
    it('should return success message for operation success', () => {
      const result = ValidationMessages.OPERATION_SUCCESS('Upload');
      expect(result).toEqual({
        type: 'success',
        text: '✅ Upload completado exitosamente',
        durationMs: 3000
      });
    });
  });

  describe('OPERATION_ERROR', () => {
    it('should return error message for operation error', () => {
      const result = ValidationMessages.OPERATION_ERROR('Upload', 'Network error');
      expect(result).toEqual({
        type: 'error',
        text: '❌ Error en Upload: Network error',
        durationMs: 5000
      });
    });
  });

  describe('LOADING', () => {
    it('should return info message for loading', () => {
      const result = ValidationMessages.LOADING('data');
      expect(result).toEqual({
        type: 'info',
        text: '⏳ Cargando data...',
        durationMs: 2000
      });
    });
  });

  describe('PROCESSING', () => {
    it('should return info message for processing', () => {
      const result = ValidationMessages.PROCESSING();
      expect(result).toEqual({
        type: 'info',
        text: '⏳ Procesando...',
        durationMs: 2000
      });
    });
  });

  describe('WARNING', () => {
    it('should return warning message', () => {
      const result = ValidationMessages.WARNING('Caution needed');
      expect(result).toEqual({
        type: 'warning',
        text: '⚠️ Caution needed',
        durationMs: 4000
      });
    });
  });
});

describe('createValidationMessage', () => {
  it('should create success message with default duration', () => {
    const result = createValidationMessage('success', 'Test message');
    expect(result).toEqual({
      type: 'success',
      text: 'Test message',
      durationMs: 3000
    });
  });

  it('should create error message with custom duration', () => {
    const result = createValidationMessage('error', 'Error occurred', 5000);
    expect(result).toEqual({
      type: 'error',
      text: 'Error occurred',
      durationMs: 5000
    });
  });

  it('should create warning message', () => {
    const result = createValidationMessage('warning', 'Warning message', 4000);
    expect(result).toEqual({
      type: 'warning',
      text: 'Warning message',
      durationMs: 4000
    });
  });

  it('should create info message', () => {
    const result = createValidationMessage('info', 'Info message', 2000);
    expect(result).toEqual({
      type: 'info',
      text: 'Info message',
      durationMs: 2000
    });
  });
});
