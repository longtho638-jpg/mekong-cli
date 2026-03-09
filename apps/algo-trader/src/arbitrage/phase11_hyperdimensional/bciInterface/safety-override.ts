/**
 * Phase 11 Module 2: BCI Integration — Safety Override (Dead-Man Switch).
 *
 * Auto-pauses trading if no valid BCI heartbeat is received within
 * the configured deadManSeconds window. All state is in-memory.
 */

export interface SafetyOverrideConfig {
  /** Seconds without heartbeat before auto-pause. Default: 30 */
  deadManSeconds: number;
  /** Dry-run mode. Default: true */
  dryRun: boolean;
}

export interface SafetyStatus {
  lastSignalAt: number | null;
  /** Milliseconds remaining before timeout (0 if already timed out) */
  timeoutIn: number;
  isTimedOut: boolean;
  tradingPaused: boolean;
}

const DEFAULTS: SafetyOverrideConfig = {
  deadManSeconds: 30,
  dryRun: true,
};

export class SafetyOverride {
  private readonly cfg: SafetyOverrideConfig;
  private lastSignalAt: number | null = null;
  private timedOut = false;
  private tradingPaused = false;
  private heartbeatCount = 0;

  constructor(config: Partial<SafetyOverrideConfig> = {}) {
    this.cfg = { ...DEFAULTS, ...config };
  }

  /**
   * Record a valid BCI signal heartbeat.
   * Clears any existing timeout state if trading was paused by dead-man switch.
   */
  heartbeat(): void {
    this.lastSignalAt = Date.now();
    // If previously timed out, resume auto-recovery
    if (this.timedOut) {
      this.timedOut = false;
      this.tradingPaused = false;
    }
    this.heartbeatCount++;
  }

  /**
   * Check whether the dead-man window has elapsed.
   * Returns true (and pauses trading) if timed out.
   */
  checkTimeout(): boolean {
    if (this.lastSignalAt === null) {
      // No signal ever received — not timed out yet (system just started)
      return false;
    }

    const elapsedMs = Date.now() - this.lastSignalAt;
    const thresholdMs = this.cfg.deadManSeconds * 1000;

    if (elapsedMs >= thresholdMs) {
      this.timedOut = true;
      this.tradingPaused = true;
      return true;
    }

    return false;
  }

  getStatus(): SafetyStatus {
    const now = Date.now();
    const thresholdMs = this.cfg.deadManSeconds * 1000;

    let timeoutIn = 0;
    if (this.lastSignalAt !== null && !this.timedOut) {
      const elapsed = now - this.lastSignalAt;
      timeoutIn = Math.max(0, thresholdMs - elapsed);
    }

    return {
      lastSignalAt: this.lastSignalAt,
      timeoutIn,
      isTimedOut: this.timedOut,
      tradingPaused: this.tradingPaused,
    };
  }

  /** Manually reset timeout state (e.g. operator intervention). */
  reset(): void {
    this.lastSignalAt = null;
    this.timedOut = false;
    this.tradingPaused = false;
  }

  getHeartbeatCount(): number {
    return this.heartbeatCount;
  }

  getConfig(): SafetyOverrideConfig {
    return { ...this.cfg };
  }
}
