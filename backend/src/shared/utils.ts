export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Exponential backoff with full jitter (AWS-recommended pattern).
 * Base: 500ms, Cap: 30s
 */
export function calculateBackoff(attempt: number): number {
  const base = 500;
  const cap = 30_000;
  const exponential = Math.min(cap, base * Math.pow(2, attempt - 1));
  return Math.floor(Math.random() * exponential);
}
