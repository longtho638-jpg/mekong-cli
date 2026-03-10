/**
 * PatternDetector — Analyzes exchange events for anti-bot patterns
 * Uses statistical methods: moving averages, spike detection, slippage analysis
 */

import {
  DetectionConfig,
  DetectionResult,
  DetectionType,
  ExchangeEvent,
  ThreatSeverity,
} from './antibot-config-types';

/** Known rate limits per exchange (requests/minute) */
const EXCHANGE_RATE_LIMITS: Record<string, number> = {
  binance: 1200,
  bybit: 600,
  okx: 300,
};

/**
 * PatternDetector — Stateless detection engine
 * Analyzes event arrays and returns detected threats
 */
export class PatternDetector {
  constructor(private readonly config: DetectionConfig) {}

  /** Run all detection checks on recent events */
  analyze(exchange: string, events: ExchangeEvent[]): DetectionResult[] {
    if (events.length === 0) return [];

    const results: DetectionResult[] = [];
    const now = Date.now();

    const rateLimitResult = this.detectRateLimit(exchange, events, now);
    if (rateLimitResult) results.push(rateLimitResult);

    const errorResult = this.detectErrorSpike(exchange, events, now);
    if (errorResult) results.push(errorResult);

    const rejectionResult = this.detectOrderRejections(exchange, events, now);
    if (rejectionResult) results.push(rejectionResult);

    const slippageResult = this.detectSlippageAnomaly(exchange, events, now);
    if (slippageResult) results.push(slippageResult);

    const latencyResult = this.detectLatencyShift(exchange, events, now);
    if (latencyResult) results.push(latencyResult);

    return results;
  }

  /** Detect if approaching exchange rate limits */
  detectRateLimit(
    exchange: string,
    events: ExchangeEvent[],
    now: number
  ): DetectionResult | null {
    const windowMs = 60_000; // 1 minute
    const recentHttp = events.filter(
      (e) => e.type === 'http_response' && e.timestamp >= now - windowMs
    );

    const knownLimit = EXCHANGE_RATE_LIMITS[exchange] || 600;
    const usage = recentHttp.length / knownLimit;

    if (usage >= this.config.rateLimitThreshold) {
      const severity: ThreatSeverity = usage >= 0.95 ? 'CRITICAL' : 'WARNING';
      return {
        type: 'RATE_LIMIT',
        exchange,
        severity,
        confidence: Math.min(usage, 1),
        timestamp: now,
        details: `Rate usage ${(usage * 100).toFixed(1)}% of ${knownLimit}/min limit`,
        metrics: { usage, requestCount: recentHttp.length, limit: knownLimit },
      };
    }
    return null;
  }

  /** Detect spike in HTTP error responses */
  detectErrorSpike(
    exchange: string,
    events: ExchangeEvent[],
    now: number
  ): DetectionResult | null {
    const windowMs = 60_000;
    const recentHttp = events.filter(
      (e) => e.type === 'http_response' && e.timestamp >= now - windowMs
    );
    if (recentHttp.length < 5) return null;

    const errors = recentHttp.filter(
      (e) => e.statusCode && e.statusCode >= 400
    );
    const errorRate = errors.length / recentHttp.length;

    if (errorRate > this.config.errorRateThreshold) {
      const severity: ThreatSeverity =
        errorRate > this.config.errorRateThreshold * 2 ? 'CRITICAL' : 'WARNING';
      return {
        type: 'ERROR_SPIKE',
        exchange,
        severity,
        confidence: Math.min(errorRate / this.config.errorRateThreshold, 1),
        timestamp: now,
        details: `Error rate ${(errorRate * 100).toFixed(1)}% (${errors.length}/${recentHttp.length})`,
        metrics: { errorRate, errorCount: errors.length, totalCount: recentHttp.length },
      };
    }
    return null;
  }

  /** Detect spike in order rejections */
  detectOrderRejections(
    exchange: string,
    events: ExchangeEvent[],
    now: number
  ): DetectionResult | null {
    const windowMs = 60_000;
    const recentOrders = events.filter(
      (e) => e.type === 'order_result' && e.timestamp >= now - windowMs
    );

    const rejections = recentOrders.filter((e) => e.orderResult === 'rejected');
    const rejectionCount = rejections.length;

    if (rejectionCount > this.config.rejectionSpikeThreshold) {
      const severity: ThreatSeverity =
        rejectionCount > this.config.rejectionSpikeThreshold * 2
          ? 'CRITICAL'
          : 'WARNING';

      // Identify affected symbols
      const affectedSymbols = [
        ...new Set(rejections.map((e) => e.symbol).filter(Boolean) as string[]),
      ];

      return {
        type: 'ORDER_REJECTION',
        exchange,
        severity,
        confidence: Math.min(
          rejectionCount / this.config.rejectionSpikeThreshold / 2,
          1
        ),
        timestamp: now,
        details: `${rejectionCount} rejections in last minute`,
        affectedSymbols,
        metrics: { rejectionCount, totalOrders: recentOrders.length },
      };
    }
    return null;
  }

  /** Detect abnormal slippage indicating toxic flow */
  detectSlippageAnomaly(
    exchange: string,
    events: ExchangeEvent[],
    now: number
  ): DetectionResult | null {
    const windowMs = 300_000; // 5 minutes
    const slippageEvents = events.filter(
      (e) =>
        e.timestamp >= now - windowMs &&
        e.slippageActualBps !== undefined &&
        e.slippageExpectedBps !== undefined &&
        e.slippageExpectedBps > 0
    );

    if (slippageEvents.length < 3) return null;

    const ratios = slippageEvents.map(
      (e) => e.slippageActualBps! / e.slippageExpectedBps!
    );
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;

    if (avgRatio > this.config.slippageMultiplier) {
      const severity: ThreatSeverity =
        avgRatio > this.config.slippageMultiplier * 1.5 ? 'CRITICAL' : 'WARNING';

      const affectedSymbols = [
        ...new Set(
          slippageEvents.map((e) => e.symbol).filter(Boolean) as string[]
        ),
      ];

      return {
        type: 'SLIPPAGE_ANOMALY',
        exchange,
        severity,
        confidence: Math.min(avgRatio / this.config.slippageMultiplier / 2, 1),
        timestamp: now,
        details: `Avg slippage ratio ${avgRatio.toFixed(2)}x expected`,
        affectedSymbols,
        metrics: { avgRatio, sampleCount: slippageEvents.length },
      };
    }
    return null;
  }

  /** Detect sudden latency increases (network throttling) */
  detectLatencyShift(
    exchange: string,
    events: ExchangeEvent[],
    now: number
  ): DetectionResult | null {
    const httpEvents = events.filter(
      (e) =>
        e.type === 'http_response' &&
        e.responseTimeMs !== undefined &&
        e.timestamp >= now - 300_000
    );

    if (httpEvents.length < 10) return null;

    // Split into older half and recent half
    const midpoint = Math.floor(httpEvents.length / 2);
    const older = httpEvents.slice(0, midpoint);
    const recent = httpEvents.slice(midpoint);

    const avgOlder =
      older.reduce((s, e) => s + e.responseTimeMs!, 0) / older.length;
    const avgRecent =
      recent.reduce((s, e) => s + e.responseTimeMs!, 0) / recent.length;

    const shift = avgRecent - avgOlder;

    if (shift > this.config.latencyShiftThresholdMs) {
      const severity: ThreatSeverity =
        shift > this.config.latencyShiftThresholdMs * 2 ? 'CRITICAL' : 'WARNING';

      return {
        type: 'LATENCY_SHIFT',
        exchange,
        severity,
        confidence: Math.min(
          shift / this.config.latencyShiftThresholdMs / 2,
          1
        ),
        timestamp: now,
        details: `Latency increased by ${shift.toFixed(0)}ms (${avgOlder.toFixed(0)}→${avgRecent.toFixed(0)}ms)`,
        metrics: { shift, avgOlder, avgRecent },
      };
    }
    return null;
  }
}
