/**
 * Retry utility with exponential backoff
 * Used by RaaS cache client for rate limit handling
 */

export interface RetryOptions {
  maxRetries?: number;
  backoff?: 'linear' | 'exponential';
  initialDelay?: number;
  maxDelay?: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  backoff: 'exponential',
  initialDelay: 100,
  maxDelay: 5000,
};

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries, backoff, initialDelay, maxDelay } = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay based on backoff strategy
      const currentDelay =
        backoff === 'exponential'
          ? initialDelay * Math.pow(2, attempt)
          : initialDelay * (attempt + 1);

      // Wait with jitter
      const jitter = Math.random() * 0.1 * currentDelay;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(currentDelay + jitter, maxDelay))
      );
    }
  }

  throw lastError;
}
