/**
 * 🔐 Hash Utilities
 * 
 * Utilidades para generación y validación de hashes SHA-256.
 * Proporciona funciones consistentes para crear firmas digitales
 * de objetos JavaScript con ordenamiento alfabético de claves.
 */

/**
 * Genera un hash SHA-256 consistente para cualquier objeto
 * 
 * @description
 * - Ordena las claves alfabéticamente para garantizar consistencia
 * - Utiliza Web Crypto API para cálculo seguro del hash
 * - Retorna hash en formato hexadecimal de 64 caracteres
 * 
 * @param data - Objeto a hashear (será serializado a JSON)
 * @returns Hash SHA-256 en formato hexadecimal
 * 
 * @example
 * ```typescript
 * const data = { name: 'test', id: 123 };
 * const hash = await generateHash(data);
 * // hash = "a1b2c3d4e5f6..."
 * ```
 */
export async function generateHash(data: any): Promise<string> {
  const encoder = new TextEncoder();
  
  // Ordenar claves alfabéticamente para garantizar consistencia
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  
  const dataBuffer = encoder.encode(jsonString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida el hash SHA-256 de un objeto exportado
 * 
 * @description
 * - Recalcula el hash del objeto sin el campo _hash
 * - Compara con el hash recibido para verificar integridad
 * - Útil para validar que un archivo no ha sido modificado
 * 
 * @param exportedData - Objeto que contiene el campo _hash a validar
 * @param dataToHash - Objeto original sin el campo _hash
 * @returns true si el hash es válido, false en caso contrario
 * 
 * @example
 * ```typescript
 * const exported = { _hash: "abc123...", data: {...} };
 * const { _hash, ...original } = exported;
 * const isValid = await validateHash(exported, original);
 * ```
 */
export async function validateHash(exportedData: any, dataToHash: any): Promise<boolean> {
  const receivedHash = exportedData._hash;
  
  if (!receivedHash) {
    return false;
  }
  
  const calculatedHash = await generateHash(dataToHash);
  return calculatedHash === receivedHash;
}

/**
 * Extrae el contenido sin hash de un objeto exportado
 * 
 * @description
 * - Crea una copia del objeto sin el campo _hash
 * - Útil para preparar datos antes de validar el hash
 * 
 * @param exportedData - Objeto que contiene el campo _hash
 * @returns Objeto sin el campo _hash
 * 
 * @example
 * ```typescript
 * const exported = { _hash: "abc123...", name: "test" };
 * const clean = extractDataWithoutHash(exported);
 * // clean = { name: "test" }
 * ```
 */
export function extractDataWithoutHash<T extends Record<string, any>>(exportedData: T): Omit<T, '_hash'> {
  const { _hash, ...dataWithoutHash } = exportedData;
  return dataWithoutHash;
}
