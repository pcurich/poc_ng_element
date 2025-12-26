export function generateUUID(): string {
  return crypto.randomUUID();
}

export function generateTransactionId(): string {
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export function generateShortId(prefix?: string): string {
  const id = Math.random().toString(36).substring(2, 11);
  return prefix ? `${prefix}_${id}` : id;
}