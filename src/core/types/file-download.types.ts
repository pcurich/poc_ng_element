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
