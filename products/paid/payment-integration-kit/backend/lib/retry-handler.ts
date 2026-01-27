/**
 * Retry Handler for Webhook Processing
 *
 * Implements exponential backoff retry logic for failed webhook processing.
 * Helps ensure transient failures (DB connection, external API) don't cause permanent data loss.
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,      // 1 second
  maxDelayMs: 8000,          // 8 seconds
  backoffMultiplier: 2       // Exponential: 1s, 2s, 4s, 8s...
};

interface RetryMetadata {
  attemptNumber: number;
  lastError?: string;
  totalDelayMs: number;
}

/**
 * Sleep helper function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate next delay with exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Execute function with retry logic
 *
 * Usage:
 * ```typescript
 * const result = await withRetry(
 *   async () => await savePaymentToDatabase(payment),
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const fullConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | undefined;
  let totalDelay = 0;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const result = await fn();

      // Success - log if this wasn't the first attempt
      if (attempt > 1) {
        console.log(`✅ Retry succeeded on attempt ${attempt}/${fullConfig.maxAttempts}`);
      }

      return result;
    } catch (error) {
      lastError = error as Error;

      // Log the failure
      console.warn(
        `⚠️  Attempt ${attempt}/${fullConfig.maxAttempts} failed:`,
        lastError.message
      );

      // Don't retry on the last attempt
      if (attempt === fullConfig.maxAttempts) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, fullConfig);
      totalDelay += delay;

      console.log(`⏳ Retrying in ${delay}ms... (total delay: ${totalDelay}ms)`);
      await sleep(delay);
    }
  }

  // All retries exhausted
  const metadata: RetryMetadata = {
    attemptNumber: fullConfig.maxAttempts,
    lastError: lastError?.message,
    totalDelayMs: totalDelay
  };

  console.error(
    `❌ All ${fullConfig.maxAttempts} retry attempts failed. Metadata:`,
    metadata
  );

  throw new Error(
    `Retry failed after ${fullConfig.maxAttempts} attempts: ${lastError?.message}`,
    { cause: lastError }
  );
}

/**
 * Determine if an error is retryable
 *
 * Some errors (like validation errors) should NOT be retried.
 * Others (like network timeouts) should be.
 */
export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Database errors (transient)
  if (error.code === 'ECONNRESET' || error.message?.includes('connection')) {
    return true;
  }

  // HTTP 5xx errors (server errors)
  if (error.status >= 500 && error.status < 600) {
    return true;
  }

  // HTTP 429 (rate limit)
  if (error.status === 429) {
    return true;
  }

  // Default: don't retry
  return false;
}

/**
 * Conditional retry wrapper
 *
 * Only retries if the error is deemed retryable.
 */
export async function withConditionalRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  return withRetry(async () => {
    try {
      return await fn();
    } catch (error) {
      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.log(`🚫 Error is not retryable: ${(error as Error).message}`);
        throw error;
      }
      // Re-throw to trigger retry
      throw error;
    }
  }, config);
}
