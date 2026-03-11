export interface CircuitBreakerOptions {
  maxFailures: number;
  timeoutMs: number;
  resetTimeoutMs?: number;
}

export class CircuitBreaker {
  private failures: number = 0;
  private isOpen: boolean = false;
  private lastFailureTime: number = 0;
  private options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = options;
  }

  /**
   * Record a failure
   */
  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.options.maxFailures) {
      this.isOpen = true;
      console.warn(`[CircuitBreaker] Circuit OPEN after ${this.failures} failures`);
    }
  }

  /**
   * Record a success
   */
  recordSuccess(): void {
    this.failures = 0;
    this.isOpen = false;
  }

  /**
   * Check if circuit is open (should block trading)
   */
  isCircuitOpen(): boolean {
    // Check if timeout has passed and we can try half-open
    if (this.isOpen) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.options.timeoutMs) {
        // Transition to half-open (allow one test request)
        console.log('[CircuitBreaker] Half-open state - allowing test request');
        return false;
      }
      return true;
    }
    return false;
  }

  /**
   * Check if allowed to proceed with trading
   */
  canProceed(): boolean {
    return !this.isCircuitOpen();
  }

  /**
   * Get current state
   */
  getState(): {
    isOpen: boolean;
    failures: number;
    lastFailureTime: number | null;
  } {
    return {
      isOpen: this.isOpen,
      failures: this.failures,
      lastFailureTime: this.failures > 0 ? this.lastFailureTime : null,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.failures = 0;
    this.isOpen = false;
    this.lastFailureTime = 0;
    console.log('[CircuitBreaker] Reset');
  }
}
