export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  factor: number;
  jitter: boolean;
  retryableErrors?: string[];
}

export interface RetryMetrics {
  attempts: number;
  successfulRetries: number;
  failedRetries: number;
  totalRetryDelayMs: number;
}

export class RetryHandler {
  private metrics: RetryMetrics = {
    attempts: 0,
    successfulRetries: 0,
    failedRetries: 0,
    totalRetryDelayMs: 0
  };

  constructor(private config: RetryConfig) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      this.metrics.attempts++;

      try {
        const result = await operation();

        if (attempt > 0) {
          this.metrics.successfulRetries++;
        }

        return result;
      } catch (error) {
        lastError = error;

        if (attempt === this.config.maxRetries) {
          this.metrics.failedRetries++;
          break;
        }

        if (!this.shouldRetry(error)) {
          this.metrics.failedRetries++;
          break;
        }

        const delay = this.calculateDelay(attempt);
        this.metrics.totalRetryDelayMs += delay;

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  private calculateDelay(attempt: number): number {
    let delay = this.config.baseDelayMs * Math.pow(this.config.factor, attempt);
    delay = Math.min(delay, this.config.maxDelayMs);
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }
    return delay;
  }

  private shouldRetry(error: unknown): boolean {
    if (this.config.retryableErrors && this.config.retryableErrors.length > 0) {
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      return this.config.retryableErrors.some(retryableError =>
        errorMessage.includes(retryableError.toLowerCase())
      );
    }

    const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
    const retryableKeywords = [
      'network error',
      'timeout',
      'connection refused',
      'rate limit',
      'too many requests',
      '5xx',
      'internal server error',
      'gateway timeout',
      'service unavailable'
    ];

    return retryableKeywords.some(keyword => errorMessage.includes(keyword));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics(): RetryMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      attempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      totalRetryDelayMs: 0
    };
  }
}
