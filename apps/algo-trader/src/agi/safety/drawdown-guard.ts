export interface DrawdownGuardOptions {
  maxDrawdown: number; // e.g., 0.05 for 5%
  warningThreshold?: number; // e.g., 0.03 for 3% warning
}

export class DrawdownError extends Error {
  constructor(
    message: string,
    public currentDrawdown: number,
    public maxDrawdown: number
  ) {
    super(message);
    this.name = 'DrawdownError';
  }
}

export class DrawdownGuard {
  private peakEquity: number = 0;
  private options: DrawdownGuardOptions;
  private onWarningTriggered?: (drawdown: number) => void;

  constructor(options: DrawdownGuardOptions) {
    this.options = options;
  }

  /**
   * Set warning callback
   */
  onWarning(callback: (drawdown: number) => void): void {
    this.onWarningTriggered = callback;
  }

  /**
   * Update peak equity
   */
  updatePeak(equity: number): void {
    if (equity > this.peakEquity) {
      this.peakEquity = equity;
    }
  }

  /**
   * Check if drawdown limit exceeded
   * Throws DrawdownError if limit exceeded
   */
  check(currentEquity: number): void {
    if (this.peakEquity === 0) {
      // No peak set yet, initialize
      this.peakEquity = currentEquity;
      return;
    }

    const drawdown = (this.peakEquity - currentEquity) / this.peakEquity;

    // Check warning threshold
    const warningThreshold = this.options.warningThreshold || this.options.maxDrawdown * 0.6;
    if (drawdown >= warningThreshold && drawdown < this.options.maxDrawdown) {
      console.warn(`[DrawdownGuard] WARNING: Drawdown at ${(drawdown * 100).toFixed(2)}%`);
      this.onWarningTriggered?.(drawdown);
    }

    // Check hard limit
    if (drawdown >= this.options.maxDrawdown) {
      const msg = `Drawdown limit exceeded: ${(drawdown * 100).toFixed(2)}% >= ${(this.options.maxDrawdown * 100).toFixed(2)}%`;
      console.error(`[DrawdownGuard] ${msg}`);
      throw new DrawdownError(msg, drawdown, this.options.maxDrawdown);
    }
  }

  /**
   * Get current drawdown percentage
   */
  getCurrentDrawdown(currentEquity: number): number {
    if (this.peakEquity === 0) return 0;
    return (this.peakEquity - currentEquity) / this.peakEquity;
  }

  /**
   * Get guard status
   */
  getStatus(currentEquity: number): {
    peakEquity: number;
    currentEquity: number;
    drawdown: number;
    maxDrawdown: number;
    isSafe: boolean;
  } {
    const drawdown = this.getCurrentDrawdown(currentEquity);
    return {
      peakEquity: this.peakEquity,
      currentEquity,
      drawdown,
      maxDrawdown: this.options.maxDrawdown,
      isSafe: drawdown < this.options.maxDrawdown,
    };
  }

  /**
   * Reset guard
   */
  reset(newPeak?: number): void {
    this.peakEquity = newPeak || 0;
  }
}
