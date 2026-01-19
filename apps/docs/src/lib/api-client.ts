/**
 * API client with retry logic and error handling
 */

interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exponential backoff with jitter
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number => {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay;
  return Math.min(exponentialDelay + jitter, maxDelay);
};

/**
 * Fetch with exponential backoff retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: RetryOptions = {}
): Promise<Response> {
  const {
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
  } = { ...DEFAULT_RETRY_OPTIONS, ...retryOptions };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Don't retry client errors (4xx except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry server errors (5xx) and rate limits (429)
      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxRetries) {
          const delay = calculateDelay(
            attempt,
            initialDelay,
            maxDelay,
            backoffMultiplier
          );
          console.warn(
            `Request failed with status ${response.status}. Retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`
          );
          await sleep(delay);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = calculateDelay(
          attempt,
          initialDelay,
          maxDelay,
          backoffMultiplier
        );
        console.warn(
          `Request failed: ${lastError.message}. Retrying in ${delay}ms... (${attempt + 1}/${maxRetries})`
        );
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
}

/**
 * POST request with retry and type safety
 */
export async function apiPost<TRequest, TResponse>(
  url: string,
  body: TRequest,
  retryOptions?: RetryOptions
): Promise<ApiResponse<TResponse>> {
  try {
    const response = await fetchWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      retryOptions
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'Request failed',
        details: data.details,
      };
    }

    return { data };
  } catch (error) {
    return {
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
