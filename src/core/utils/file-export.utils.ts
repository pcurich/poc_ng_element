/**
 * 📦 File Export Utilities
 * 
 * Utilidades para exportación de archivos JSON y descarga en el navegador.
 * Proporciona funciones para crear blobs, descargar archivos y gestionar
 * el ciclo de vida de URLs de objetos.
 */

/**
 * Opciones para la descarga de archivos
 */
export interface DownloadOptions {
  /** Nombre del archivo a descargar (incluir extensión) */
  filename: string;
  /** Tipo MIME del archivo (default: 'application/json') */
  mimeType?: string;
  /** Si es true, agrega timestamp al nombre del archivo */
  addTimestamp?: boolean;
}

/**
 * Descarga un objeto como archivo JSON
 * 
 * @description
 * - Serializa el objeto a JSON con formato legible (2 espacios)
 * - Crea un Blob y genera URL temporal
 * - Simula click en elemento <a> para iniciar descarga
 * - Limpia recursos automáticamente
 * 
 * @param data - Objeto a exportar
 * @param options - Opciones de descarga
 * 
 * @example
 * ```typescript
 * const data = { name: 'test', items: [1, 2, 3] };
 * downloadAsJson(data, { 
 *   filename: 'export.json',
 *   addTimestamp: true 
 * });
 * // Descarga: export-1732462800000.json
 * ```
 */
export function downloadAsJson(data: any, options: DownloadOptions): void {
  const {
    filename,
    mimeType = 'application/json',
    addTimestamp = false
  } = options;

  // Generar nombre de archivo con timestamp opcional
  const finalFilename = addTimestamp
    ? filename.replace(/(\.[^.]+)$/, `-${Date.now()}$1`)
    : filename;

  // Serializar con formato legible
  const json = JSON.stringify(data, null, 2);
  
  // Crear blob y URL
  const blob = new Blob([json], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // Crear elemento <a> temporal y simular click
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFilename;
  document.body.appendChild(a);
  a.click();
  
  // Limpiar recursos
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Crea un Blob a partir de un objeto JSON
 * 
 * @description
 * Útil cuando necesitas el Blob sin iniciar la descarga inmediatamente
 * 
 * @param data - Objeto a convertir en Blob
 * @param mimeType - Tipo MIME del blob (default: 'application/json')
 * @returns Blob con el contenido JSON
 * 
 * @example
 * ```typescript
 * const blob = createJsonBlob({ name: 'test' });
 * // Usar blob para FormData, API requests, etc.
 * ```
 */
export function createJsonBlob(data: any, mimeType: string = 'application/json'): Blob {
  const json = JSON.stringify(data, null, 2);
  return new Blob([json], { type: mimeType });
}

/**
 * Lee el contenido de un archivo como texto
 * 
 * @description
 * Wrapper de FileReader.readAsText() con promesas
 * 
 * @param file - Archivo a leer
 * @returns Promise con el contenido del archivo como string
 * 
 * @example
 * ```typescript
 * const file = input.files[0];
 * const content = await readFileAsText(file);
 * const data = JSON.parse(content);
 * ```
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Lee y parsea un archivo JSON
 * 
 * @description
 * Lee el archivo y parsea el JSON automáticamente
 * 
 * @param file - Archivo JSON a leer
 * @returns Promise con el objeto parseado
 * 
 * @example
 * ```typescript
 * const file = input.files[0];
 * const data = await readJsonFile(file);
 * console.log(data.name); // Acceso directo al objeto
 * ```
 */
export async function readJsonFile<T = any>(file: File): Promise<T> {
  const text = await readFileAsText(file);
  return JSON.parse(text) as T;
}

/**
 * Genera un nombre de archivo con timestamp
 * 
 * @description
 * Útil para generar nombres únicos de archivos exportados
 * 
 * @param basename - Nombre base del archivo (sin extensión)
 * @param extension - Extensión del archivo (sin punto)
 * @returns Nombre de archivo con timestamp
 * 
 * @example
 * ```typescript
 * const filename = generateFilenameWithTimestamp('export', 'json');
 * // "export-1732462800000.json"
 * ```
 */
export function generateFilenameWithTimestamp(basename: string, extension: string): string {
  return `${basename}-${Date.now()}.${extension}`;
}
