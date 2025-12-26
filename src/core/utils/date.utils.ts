export function getCurrentTimestamp(): number {
  return Date.now();
}

export function addTimestamp(filename: string): string {
  return `${filename}-${Date.now()}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function isDateOlderThan(date: Date, days: number): boolean {
  const cutoff = subtractDays(new Date(), days);
  return date < cutoff;
}

export async function waitWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timeout'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
}