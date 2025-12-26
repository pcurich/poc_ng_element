/**
 * 📚 Diccionario de Mensajes de Validación
 * 
 * Centraliza todos los mensajes de validación y notificaciones del sistema
 * para mantener consistencia y facilitar mantenimiento/internacionalización.
 */

export type ValidationMessageType = 'success' | 'error' | 'warning' | 'info';
export type ValidationMessageIcon = '✅' | '❌' | '⚠️' | 'ℹ️';

export interface ValidationMessage {
  type: ValidationMessageType;
  icon: ValidationMessageIcon;
  text: string;
  durationMs?: number;
}

export const ValidationMessages = {
  // === Mensajes de Mocks ===
  MOCK_CREATED: (mockName: string): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: `Mock "${mockName}" creado exitosamente`,
    durationMs: 3000
  }),

  MOCK_UPDATED: (mockName: string): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: `Mock "${mockName}" actualizado exitosamente`,
    durationMs: 3000
  }),

  MOCK_DELETED: (): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: 'Mock eliminado exitosamente',
    durationMs: 3000
  }),

  MOCKS_LOADED: (count: number): ValidationMessage => ({
    type: 'info',
    icon: 'ℹ️',
    text: `${count} mock${count !== 1 ? 's' : ''} cargado${count !== 1 ? 's' : ''}`,
    durationMs: 2000
  }),

  MOCKS_EXPORTED: (count: number): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: `${count} mock${count !== 1 ? 's' : ''} exportado${count !== 1 ? 's' : ''} exitosamente con firma digital`,
    durationMs: 3000
  }),

  NO_MOCKS_TO_EXPORT: (): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: 'No hay mocks para exportar. La base de datos está vacía',
    durationMs: 3000
  }),

  // === Mensajes de JSON ===
  JSON_VALID: (): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: 'JSON válido - La estructura es correcta',
    durationMs: 3000
  }),

  JSON_INVALID: (error: string): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: `JSON inválido: ${error}`,
    durationMs: 5000
  }),

  JSON_FORMATTED: (): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: 'JSON formateado correctamente',
    durationMs: 2000
  }),

  JSON_FORMAT_ERROR: (error: string): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: `No se puede formatear: JSON inválido - ${error}`,
    durationMs: 5000
  }),

  // === Mensajes de Headers ===
  HEADER_ADDED: (headerName: string): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: `Cabecera "${headerName}" agregada exitosamente`,
    durationMs: 2000
  }),

  // === Mensajes de Import/Export ===
  IMPORT_SUCCESS_WITH_SIGNATURE: (count: number): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: `${count} mock${count !== 1 ? 's' : ''} importado${count !== 1 ? 's' : ''} correctamente. Firma verificada ✓`,
    durationMs: 3000
  }),

  DATABASE_RESTORED: (count: number): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: `Base de datos completa restaurada: ${count} mocks importados. Firma verificada ✓`,
    durationMs: 3000
  }),

  NO_HASH_SIGNATURE: (): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: 'El archivo adjuntado no es válido: falta la firma digital (hash) requerida para la validación.',
    durationMs: 4000
  }),

  INVALID_SIGNATURE: (): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: 'Firma digital inválida. El archivo ha sido modificado o está corrupto',
    durationMs: 5000
  }),

  IMPORT_ERROR: (): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: 'Error al importar el archivo. Verifique que sea un JSON válido',
    durationMs: 5000
  }),

  INVALID_FILE_FORMAT: (): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: 'Formato de archivo no reconocido',
    durationMs: 5000
  }),

  VALIDATION_ERRORS: (errors: string[]): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: errors.join(', '),
    durationMs: 5000
  }),

  // === Mensajes de Errores Generales ===
  PRESENTER_ERROR: (error: string): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: `Error: ${error}`,
    durationMs: 5000
  }),

  SAVE_ERROR: (error: string): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: `Error al guardar: ${error}`,
    durationMs: 5000
  }),

  // === Mensajes de Base de Datos ===
  DATABASE_CREATED: (): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: 'Base de datos creada exitosamente',
    durationMs: 3000
  }),

  DATABASE_DELETED: (): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: 'Base de datos eliminada exitosamente',
    durationMs: 3000
  }),

  DATABASE_REINITIALIZED: (): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: 'Base de datos reinicializada con estado vacío',
    durationMs: 3000
  }),

  // === Mensajes de Validación de Formulario ===
  MISSING_REQUIRED_FIELDS: (): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: 'Campos requeridos faltantes: nameMock, url, serviceCode, httpMethod, httpCodeResponseValue, delayMs o body son obligatorios',
    durationMs: 5000
  }),

  // === Mensajes de Operaciones ===
  OPERATION_SUCCESS: (operation: string): ValidationMessage => ({
    type: 'success',
    icon: '✅',
    text: `${operation} completado exitosamente`,
    durationMs: 3000
  }),

  OPERATION_ERROR: (operation: string, error: string): ValidationMessage => ({
    type: 'error',
    icon: '❌',
    text: `Error en ${operation}: ${error}`,
    durationMs: 5000
  }),

  // === Mensajes Informativos ===
  LOADING: (resource: string): ValidationMessage => ({
    type: 'info',
    icon: 'ℹ️',
    text: `Cargando ${resource}...`,
    durationMs: 2000
  }),

  PROCESSING: (): ValidationMessage => ({
    type: 'info',
    icon: 'ℹ️',
    text: 'Procesando...',
    durationMs: 2000
  }),

  // === Mensajes de Advertencia ===
  WARNING: (message: string): ValidationMessage => ({
    type: 'warning',
    icon: '⚠️',
    text: message,
    durationMs: 4000
  })
} as const;

/**
 * Helper para crear mensajes personalizados rápidamente
 */
export const createValidationMessage = (
  type: 'success' | 'error' | 'warning' | 'info',
  text: string,
  durationMs: number = 3000
): ValidationMessage => {
  const iconMap: Record<ValidationMessageType, ValidationMessageIcon> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  return {
    type,
    icon: iconMap[type],
    text,
    durationMs
  };
};
