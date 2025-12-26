export async function generateHash(data: any): Promise<string> {
  const encoder = new TextEncoder();
  const jsonString = JSON.stringify(data, Object.keys(data).sort());
  const dataBuffer = encoder.encode(jsonString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function validateHash(exportedData: any, dataToHash: any): Promise<boolean> {
  const receivedHash = exportedData._hash;

  if (!receivedHash) {
    return false;
  }

  const calculatedHash = await generateHash(dataToHash);
  return calculatedHash === receivedHash;
}

export function extractDataWithoutHash<T extends Record<string, any>>(exportedData: T): Omit<T, '_hash'> {
  const { _hash, ...dataWithoutHash } = exportedData;
  return dataWithoutHash;
}
