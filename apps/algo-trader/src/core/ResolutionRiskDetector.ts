/**
 * ResolutionRiskDetector - Event resolution risk detection
 * Monitors positions approaching resolution, flags time-based risk
 */

export interface ResolutionRiskAlert {
  symbol: string;
  eventId: string;
  resolutionTime: number;
  hoursUntilResolution: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  positionSize?: number;
  side?: 'long' | 'short';
  recommendedAction: string;
  timestamp: number;
}

export interface PositionInfo {
  symbol: string;
  eventId: string;
  size?: number;
  side?: 'long' | 'short';
  entryPrice?: number;
}

export interface ResolutionRiskConfig {
  warningHours: number[]; // [72, 48, 24] - thresholds for alerts
  autoReduceLimit: number; // Position limit % when < 24h
  criticalThreshold: number; // Hours for critical alert
}

const DEFAULT_CONFIG: ResolutionRiskConfig = {
  warningHours: [72, 48, 24],
  autoReduceLimit: 50, // Reduce to 50% of normal limit
  criticalThreshold: 24,
};

export class ResolutionRiskDetector {
  private config: ResolutionRiskConfig;
  private trackedPositions: Map<string, PositionInfo & { resolutionTime: number }> = new Map();
  private alerts: ResolutionRiskAlert[] = [];

  constructor(config?: Partial<ResolutionRiskConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a position to track for resolution risk
   */
  trackPosition(position: PositionInfo, resolutionTime: number): void {
    this.trackedPositions.set(position.symbol, {
      ...position,
      resolutionTime,
    });
  }

  /**
   * Stop tracking a position
   */
  untrackPosition(symbol: string): void {
    this.trackedPositions.delete(symbol);
    this.alerts = this.alerts.filter(a => a.symbol !== symbol);
  }

  /**
   * Check all positions for resolution risk and generate alerts
   */
  checkResolutionRisk(): ResolutionRiskAlert[] {
    const now = Date.now();
    this.alerts = [];

    for (const [symbol, pos] of this.trackedPositions.entries()) {
      const hoursUntil = (pos.resolutionTime - now) / (1000 * 60 * 60);

      if (hoursUntil <= 0) {
        // Already resolved
        this.alerts.push({
          symbol,
          eventId: pos.eventId,
          resolutionTime: pos.resolutionTime,
          hoursUntilResolution: 0,
          riskLevel: 'critical',
          positionSize: pos.size,
          side: pos.side,
          recommendedAction: 'Position resolving now - prepare for settlement',
          timestamp: now,
        });
        continue;
      }

      const riskLevel = this.getRiskLevel(hoursUntil);
      if (riskLevel !== 'low') {
        this.alerts.push({
          symbol,
          eventId: pos.eventId,
          resolutionTime: pos.resolutionTime,
          hoursUntilResolution: Math.round(hoursUntil * 10) / 10,
          riskLevel,
          positionSize: pos.size,
          side: pos.side,
          recommendedAction: this.getRecommendedAction(hoursUntil),
          timestamp: now,
        });
      }
    }

    return this.alerts;
  }

  /**
   * Get positions resolving within specified hours
   */
  getPositionsResolvingWithin(hours: number): Array<
    PositionInfo & { resolutionTime: number; hoursUntil: number }
  > {
    const now = Date.now();
    const threshold = now + hours * 60 * 60 * 1000;

    return Array.from(this.trackedPositions.entries())
      .filter(([, pos]) => pos.resolutionTime <= threshold)
      .map(([symbol, pos]) => ({
        ...pos,
        symbol,
        hoursUntil: (pos.resolutionTime - now) / (1000 * 60 * 60),
      }));
  }

  /**
   * Get current alerts
   */
  getAlerts(): ResolutionRiskAlert[] {
    return [...this.alerts];
  }

  /**
   * Get recommended position limit based on time to resolution
   */
  getPositionLimit(symbol: string, normalLimit: number): number {
    const pos = this.trackedPositions.get(symbol);
    if (!pos) return normalLimit;

    const hoursUntil = (pos.resolutionTime - Date.now()) / (1000 * 60 * 60);

    if (hoursUntil < this.config.criticalThreshold) {
      return normalLimit * (this.config.autoReduceLimit / 100);
    }

    return normalLimit;
  }

  /**
   * Check if a position is in the critical resolution window
   */
  isCriticalResolution(symbol: string): boolean {
    const pos = this.trackedPositions.get(symbol);
    if (!pos) return false;

    const hoursUntil = (pos.resolutionTime - Date.now()) / (1000 * 60 * 60);
    return hoursUntil <= this.config.criticalThreshold && hoursUntil > 0;
  }

  /**
   * Get all tracked positions
   */
  getTrackedPositions(): Array<
    PositionInfo & { resolutionTime: number; hoursUntil: number }
  > {
    const now = Date.now();
    return Array.from(this.trackedPositions.entries()).map(([symbol, pos]) => ({
      ...pos,
      symbol,
      hoursUntil: (pos.resolutionTime - now) / (1000 * 60 * 60),
    }));
  }

  /**
   * Clear all tracked positions and alerts
   */
  reset(): void {
    this.trackedPositions.clear();
    this.alerts = [];
  }

  private getRiskLevel(hoursUntil: number): 'low' | 'medium' | 'high' | 'critical' {
    if (hoursUntil <= 0) return 'critical';
    if (hoursUntil <= 24) return 'critical';
    if (hoursUntil <= 48) return 'high';
    if (hoursUntil <= 72) return 'medium';
    return 'low';
  }

  private getRecommendedAction(hoursUntil: number): string {
    if (hoursUntil <= 0) {
      return 'Position resolving - no action possible';
    }
    if (hoursUntil <= 12) {
      return 'URGENT: Consider closing position before resolution';
    }
    if (hoursUntil <= 24) {
      return 'Reduce position size by at least 50%';
    }
    if (hoursUntil <= 48) {
      return 'Review position - consider reducing exposure';
    }
    if (hoursUntil <= 72) {
      return 'Monitor position closely';
    }
    return 'No immediate action required';
  }
}
