/**
 * Simulated compliance checks: market hours and geographic restrictions.
 */

import { EventEmitter } from 'events';
import type { ComplianceResult } from '../expansion-config-types';

// Assets restricted by simulated jurisdiction rules
const GEO_RESTRICTED: Record<string, string[]> = {
  TSLA: ['CN', 'IR'],
  AAPL: ['IR', 'KP'],
  GOLD: [],
  SILVER: [],
  OIL: ['KP'],
};

// Market hours in UTC: [openHour, closeHour]
const MARKET_HOURS: Record<string, [number, number]> = {
  TSLA: [13, 20],
  AAPL: [13, 20],
  GOLD: [0, 24],
  SILVER: [0, 24],
  OIL: [0, 24],
};

export interface ComplianceCheckerConfig {
  jurisdiction?: string; // ISO country code, default 'US'
}

export class ComplianceChecker extends EventEmitter {
  private readonly jurisdiction: string;

  constructor(config: ComplianceCheckerConfig = {}) {
    super();
    this.jurisdiction = config.jurisdiction ?? 'US';
  }

  /** Check if trading an asset is allowed for the configured jurisdiction and current time. */
  check(asset: string, utcHour?: number): ComplianceResult {
    const hour = utcHour ?? new Date().getUTCHours();
    const restricted = GEO_RESTRICTED[asset] ?? [];

    if (restricted.includes(this.jurisdiction)) {
      const result: ComplianceResult = {
        asset,
        allowed: false,
        reason: `${asset} restricted in jurisdiction ${this.jurisdiction}`,
      };
      this.emit('blocked', result);
      return result;
    }

    const hours = MARKET_HOURS[asset] ?? [0, 24];
    const inHours = hour >= hours[0] && hour < hours[1];

    if (!inHours) {
      const result: ComplianceResult = {
        asset,
        allowed: false,
        reason: `${asset} market closed (UTC hour ${hour}, open ${hours[0]}-${hours[1]})`,
      };
      this.emit('blocked', result);
      return result;
    }

    const result: ComplianceResult = { asset, allowed: true, reason: 'OK' };
    this.emit('allowed', result);
    return result;
  }

  /** Batch-check a list of assets. */
  checkAll(assets: string[], utcHour?: number): ComplianceResult[] {
    return assets.map((a) => this.check(a, utcHour));
  }
}
