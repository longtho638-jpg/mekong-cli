// Confidence Gate - validates decision confidence before execution

export interface ConfidenceGateOptions {
  minConfidence: number; // e.g., 0.6 for 60% minimum
  reviewThreshold?: number; // e.g., 0.7 - below this needs human review
}

export class ConfidenceGate {
  private options: ConfidenceGateOptions;

  constructor(options: ConfidenceGateOptions) {
    this.options = options;
  }

  /**
   * Check if confidence meets threshold
   * Returns: 'approved' | 'needs_review' | 'rejected'
   */
  check(confidence: number): 'approved' | 'needs_review' | 'rejected' {
    if (confidence < this.options.minConfidence) {
      return 'rejected';
    }

    const reviewThreshold = this.options.reviewThreshold || this.options.minConfidence + 0.1;
    if (confidence < reviewThreshold) {
      return 'needs_review';
    }

    return 'approved';
  }

  /**
   * Validate and get result
   */
  validate(confidence: number): {
    approved: boolean;
    needsReview: boolean;
    reason?: string;
  } {
    const result = this.check(confidence);

    return {
      approved: result === 'approved',
      needsReview: result === 'needs_review',
      reason: result === 'rejected'
        ? `Confidence ${confidence.toFixed(2)} below minimum ${this.options.minConfidence}`
        : result === 'needs_review'
          ? `Confidence ${confidence.toFixed(2)} below review threshold`
          : undefined,
    };
  }
}

// Kill Switch - immediate stop all trading

export type KillSwitchState = 'active' | 'triggered';

export class KillSwitch {
  private state: KillSwitchState = 'active';
  private triggeredAt: number | null = null;
  private triggeredBy: string | null = null;
  private reason: string | null = null;

  /**
   * Trigger kill switch
   */
  trigger(triggeredBy: string, reason: string): void {
    this.state = 'triggered';
    this.triggeredAt = Date.now();
    this.triggeredBy = triggeredBy;
    this.reason = reason;
    console.error(`[KillSwitch] TRIGGERED by ${triggeredBy}: ${reason}`);
  }

  /**
   * Reset kill switch
   */
  reset(): void {
    this.state = 'active';
    this.triggeredAt = null;
    this.triggeredBy = null;
    this.reason = null;
    console.log('[KillSwitch] Reset - trading can resume');
  }

  /**
   * Check if kill switch is active (trading allowed)
   */
  isActive(): boolean {
    return this.state === 'active';
  }

  /**
   * Check if kill switch is triggered (trading blocked)
   */
  isTriggered(): boolean {
    return this.state === 'triggered';
  }

  /**
   * Get current state
   */
  getState(): {
    state: KillSwitchState;
    triggeredAt: number | null;
    triggeredBy: string | null;
    reason: string | null;
  } {
    return {
      state: this.state,
      triggeredAt: this.triggeredAt,
      triggeredBy: this.triggeredBy,
      reason: this.reason,
    };
  }
}
