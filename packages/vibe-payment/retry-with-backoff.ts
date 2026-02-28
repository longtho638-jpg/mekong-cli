/**
 * Vibe Payment SDK — Retry with Exponential Backoff
 *
 * Provider-agnostic retry logic for transient payment failures.
 * Configurable delays, jitter, max attempts, and retry-able error detection.
 *
 * Usage:
 *   import { withRetry } from '@agencyos/vibe-payment';
 *   const result = await withRetry(() => provider.createPayment(req), { maxAttempts: 3 });
 */

// ─── Config ─────────────────────────────────────────────────────

export interface RetryConfig {
  /** Max retry attempts (default: 3) */
  maxAttempts: number;
  /** Initial delay in ms (default: 1000) */
  baseDelayMs: number;
  /** Max delay cap in ms (default: 30000) */
  maxDelayMs: number;
  /** Jitter factor 0-1 (default: 0.2) */
  jitterFactor: number;
  /** Custom predicate — should we retry this error? (default: transient errors only) */
  isRetryable?: (error: unknown) => boolean;
  /** Called before each retry (optional logging hook) */
  onRetry?: (attempt: number, error: unknown, nextDelayMs: number) => void;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  jitterFactor: 0.2,
};

// ─── Retry Logic ────────────────────────────────────────────────

/**
 * Execute an async operation with exponential backoff retry.
 * Retries on transient errors (network, 429, 5xx) by default.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
): Promise<T> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  if (cfg.maxAttempts <= 0) throw new Error('maxAttempts must be >= 1');
  let lastError: unknown;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === cfg.maxAttempts) break;

      const shouldRetry = cfg.isRetryable
        ? cfg.isRetryable(error)
        : isTransientError(error);

      if (!shouldRetry) break;

      const delay = computeDelay(attempt, cfg);
      cfg.onRetry?.(attempt, error, delay);
      await sleep(delay);
    }
  }

  throw lastError;
}

// ─── Helpers ────────────────────────────────────────────────────

/** Detect transient errors worth retrying */
function isTransientError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('fetch failed') || msg.includes('network')) return true;
    if (msg.includes('econnreset') || msg.includes('timeout')) return true;
    if (msg.includes('429') || msg.includes('rate limit')) return true;
    if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return true;
  }
  return false;
}

/** Exponential backoff with jitter */
function computeDelay(attempt: number, cfg: RetryConfig): number {
  const exponential = cfg.baseDelayMs * Math.pow(2, attempt - 1);
  const capped = Math.min(exponential, cfg.maxDelayMs);
  const jitter = capped * cfg.jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, Math.round(capped + jitter));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
