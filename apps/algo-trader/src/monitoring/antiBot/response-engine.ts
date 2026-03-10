/**
 * ResponseEngine — Maps detected threats to defensive actions
 * Handles cooldown periods to prevent action flapping
 * All actions are idempotent and logged
 */

import { EventEmitter } from 'events';
import {
  ActionRecord,
  AntiBotConfig,
  DefensiveAction,
  DetectionResult,
} from './antibot-config-types';

/**
 * ResponseEngine — Executes defensive actions based on detections
 */
export class ResponseEngine extends EventEmitter {
  private readonly actionHistory: ActionRecord[] = [];
  private readonly lastActionTime: Map<string, number> = new Map();
  private readonly maxHistorySize = 500;

  constructor(private readonly config: AntiBotConfig) {
    super();
  }

  /** Execute defensive response for a detection */
  respond(detection: DetectionResult): ActionRecord[] {
    const exchangeActions = this.config.actions[detection.exchange];
    if (!exchangeActions) return [];

    const actionsForSeverity = exchangeActions[detection.severity] || [];
    const executed: ActionRecord[] = [];

    for (const action of actionsForSeverity) {
      if (this.isOnCooldown(action, detection.exchange)) continue;

      const record = this.executeAction(action, detection);
      executed.push(record);
      this.actionHistory.push(record);
      this.lastActionTime.set(
        this.cooldownKey(action, detection.exchange),
        record.timestamp
      );
      this.emit('action', record);
    }

    // Prune history if needed
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.splice(
        0,
        this.actionHistory.length - this.maxHistorySize
      );
    }

    return executed;
  }

  /** Check if an action is on cooldown for an exchange */
  isOnCooldown(action: DefensiveAction, exchange: string): boolean {
    const key = this.cooldownKey(action, exchange);
    const lastTime = this.lastActionTime.get(key);
    if (!lastTime) return false;

    const cooldownSeconds = this.config.cooldownPeriods[action] || 60;
    return Date.now() - lastTime < cooldownSeconds * 1000;
  }

  /** Get remaining cooldown time in seconds */
  getCooldownRemaining(action: DefensiveAction, exchange: string): number {
    const key = this.cooldownKey(action, exchange);
    const lastTime = this.lastActionTime.get(key);
    if (!lastTime) return 0;

    const cooldownSeconds = this.config.cooldownPeriods[action] || 60;
    const elapsed = (Date.now() - lastTime) / 1000;
    return Math.max(0, cooldownSeconds - elapsed);
  }

  /** Get recent action history */
  getHistory(limit: number = 50): ActionRecord[] {
    return this.actionHistory.slice(-limit);
  }

  /** Get active defenses (actions within their cooldown period) */
  getActiveDefenses(exchange?: string): ActionRecord[] {
    const now = Date.now();
    return this.actionHistory.filter((record) => {
      if (exchange && record.exchange !== exchange) return false;
      const cooldownMs =
        (this.config.cooldownPeriods[record.action] || 60) * 1000;
      return now - record.timestamp < cooldownMs;
    });
  }

  /** Clear action history and cooldowns */
  clear(): void {
    this.actionHistory.length = 0;
    this.lastActionTime.clear();
  }

  /** Execute a single defensive action (simulated) */
  private executeAction(
    action: DefensiveAction,
    detection: DetectionResult
  ): ActionRecord {
    const record: ActionRecord = {
      action,
      exchange: detection.exchange,
      timestamp: Date.now(),
      trigger: detection,
      success: true,
      details: this.getActionDescription(action, detection),
    };

    // In production, each action would call real subsystems
    // For now, emit events that integrators can listen to
    this.emit(`action:${action}`, {
      exchange: detection.exchange,
      detection,
    });

    return record;
  }

  /** Human-readable action description */
  private getActionDescription(
    action: DefensiveAction,
    detection: DetectionResult
  ): string {
    const descriptions: Record<DefensiveAction, string> = {
      rotateProxy: `Proxy rotated for ${detection.exchange}`,
      increaseJitter: `Jitter increased for ${detection.exchange}`,
      rebalanceShards: `WebSocket shards rebalanced for ${detection.exchange}`,
      switchAccount: `Switched to backup account on ${detection.exchange}`,
      pauseSymbol: `Paused trading ${detection.affectedSymbols?.join(', ') || 'affected symbols'} on ${detection.exchange}`,
      pauseGlobal: `Emergency halt all trading on ${detection.exchange}`,
      alert: `Alert sent for ${detection.type} on ${detection.exchange}`,
    };
    return descriptions[action] || `${action} executed on ${detection.exchange}`;
  }

  /** Generate cooldown map key */
  private cooldownKey(action: DefensiveAction, exchange: string): string {
    return `${exchange}:${action}`;
  }
}
