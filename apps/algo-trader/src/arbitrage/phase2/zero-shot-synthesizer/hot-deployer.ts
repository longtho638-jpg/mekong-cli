/**
 * HotDeployer — Hot-swap strategy rules without engine restart.
 * Emits: 'rule:deployed', 'rule:undeployed', 'rule:triggered'
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';
import { StrategyRule } from './llm-client';

export class HotDeployer extends EventEmitter {
  private readonly activeRules: Map<string, StrategyRule> = new Map();

  /**
   * Deploy a validated rule (hot-swap — replaces existing rule of same name).
   */
  deploy(rule: StrategyRule): void {
    const isUpdate = this.activeRules.has(rule.name);
    this.activeRules.set(rule.name, rule);

    logger.info(
      `[HotDeployer] ${isUpdate ? 'Updated' : 'Deployed'} rule "${rule.name}" ` +
        `action=${rule.action} confidence=${rule.confidence.toFixed(2)}`,
    );

    this.emit('rule:deployed', rule);
  }

  /**
   * Remove a rule from the active set by name.
   * No-op if rule does not exist.
   */
  undeploy(ruleName: string): void {
    const rule = this.activeRules.get(ruleName);
    if (!rule) {
      logger.debug(`[HotDeployer] undeploy: rule "${ruleName}" not found — no-op`);
      return;
    }

    this.activeRules.delete(ruleName);
    logger.info(`[HotDeployer] Undeployed rule "${ruleName}"`);
    this.emit('rule:undeployed', rule);
  }

  /**
   * Return snapshot of all currently active rules.
   */
  getActiveRules(): StrategyRule[] {
    return Array.from(this.activeRules.values());
  }

  /**
   * Evaluate all active rules against current market data.
   * A rule triggers when:
   *   - confidence >= 0.5 (minimum signal strength)
   *   - regime matches rule condition string (partial match) OR condition has no regime token
   *
   * Returns list of rules that triggered (may be empty).
   * Emits 'rule:triggered' for each match.
   */
  evaluateRules(price: number, volume: number, regime: string): StrategyRule[] {
    const triggered: StrategyRule[] = [];

    for (const rule of this.activeRules.values()) {
      if (rule.confidence < 0.5) continue;

      // Regime check: if condition mentions a regime token, it must match
      const conditionLower = rule.condition.toLowerCase();
      const regimeLower = regime.toLowerCase();
      const hasRegimeToken = conditionLower.includes('regime=');

      if (hasRegimeToken && !conditionLower.includes(`regime=${regimeLower}`)) {
        continue;
      }

      // Volume filter: skip if rule specifies a minimum volume parameter
      const minVolume = rule.parameters['minVolume'] ?? 0;
      if (volume < minVolume) continue;

      triggered.push(rule);
      logger.debug(
        `[HotDeployer] Rule "${rule.name}" triggered — ` +
          `price=${price} volume=${volume} regime=${regime} action=${rule.action}`,
      );
      this.emit('rule:triggered', { rule, price, volume, regime });
    }

    return triggered;
  }

  /**
   * Count of currently active rules.
   */
  get size(): number {
    return this.activeRules.size;
  }
}
