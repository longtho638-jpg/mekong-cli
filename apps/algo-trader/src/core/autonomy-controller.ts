/**
 * A2UI Autonomy Controller — 4-tier autonomy dial per strategy.
 * Controls agent decision-making freedom from OBSERVE to AUTONOMOUS.
 */

import { AutonomyLevel, AgentEventType, AutonomyChangeEvent } from '../a2ui/types';
import { AgentEventBus } from '../a2ui/agent-event-bus';

export interface AutonomyConfig {
  /** Default autonomy for all strategies */
  defaultLevel: AutonomyLevel;
  /** Per-strategy overrides */
  strategyOverrides: Record<string, AutonomyLevel>;
  /** Auto-escalate to lower autonomy on risk events */
  autoEscalateOnRisk: boolean;
  /** Revert to previous level after N successful trades */
  autoRestoreAfterTrades: number;
}

export const DEFAULT_AUTONOMY_CONFIG: AutonomyConfig = {
  defaultLevel: AutonomyLevel.ACT_CONFIRM,
  strategyOverrides: {},
  autoEscalateOnRisk: true,
  autoRestoreAfterTrades: 5,
};

export class AutonomyController {
  private config: AutonomyConfig;
  private eventBus: AgentEventBus;
  private currentLevels = new Map<string, AutonomyLevel>();
  private successCount = new Map<string, number>();
  private previousLevels = new Map<string, AutonomyLevel>();

  constructor(eventBus: AgentEventBus, config?: Partial<AutonomyConfig>) {
    this.eventBus = eventBus;
    this.config = { ...DEFAULT_AUTONOMY_CONFIG, ...config };
  }

  /** Get autonomy level for a strategy */
  getLevel(strategy: string): AutonomyLevel {
    return this.currentLevels.get(strategy)
      ?? this.config.strategyOverrides[strategy]
      ?? this.config.defaultLevel;
  }

  /** Set autonomy level for a strategy */
  setLevel(strategy: string, level: AutonomyLevel, reason: string): void {
    const previous = this.getLevel(strategy);
    if (previous === level) return;

    this.previousLevels.set(strategy, previous);
    this.currentLevels.set(strategy, level);

    const event: AutonomyChangeEvent = {
      type: AgentEventType.AUTONOMY_CHANGE,
      tenantId: 'default',
      timestamp: Date.now(),
      previousLevel: previous,
      newLevel: level,
      reason,
    };
    this.eventBus.emit(event);
  }

  /** Check if action requires user confirmation */
  requiresConfirmation(strategy: string): boolean {
    const level = this.getLevel(strategy);
    return level === AutonomyLevel.OBSERVE
      || level === AutonomyLevel.PLAN
      || level === AutonomyLevel.ACT_CONFIRM;
  }

  /** Check if agent can execute trades */
  canExecute(strategy: string): boolean {
    const level = this.getLevel(strategy);
    return level === AutonomyLevel.ACT_CONFIRM
      || level === AutonomyLevel.AUTONOMOUS;
  }

  /** Record a successful trade — may auto-restore autonomy */
  recordSuccess(strategy: string): void {
    const count = (this.successCount.get(strategy) ?? 0) + 1;
    this.successCount.set(strategy, count);

    if (
      this.config.autoRestoreAfterTrades > 0
      && count >= this.config.autoRestoreAfterTrades
      && this.previousLevels.has(strategy)
    ) {
      const previous = this.previousLevels.get(strategy)!;
      const current = this.getLevel(strategy);
      // Only restore if current is more restricted than previous
      if (this.levelValue(current) < this.levelValue(previous)) {
        this.setLevel(strategy, previous, `Auto-restored after ${count} successful trades`);
        this.successCount.set(strategy, 0);
      }
    }
  }

  /** Escalate to lower autonomy on risk event */
  escalate(strategy: string, reason: string): void {
    if (!this.config.autoEscalateOnRisk) return;

    const current = this.getLevel(strategy);
    // Step down one level
    const downgrade = this.stepDown(current);
    if (downgrade !== current) {
      this.setLevel(strategy, downgrade, `Risk escalation: ${reason}`);
      this.successCount.set(strategy, 0);
    }
  }

  private levelValue(level: AutonomyLevel): number {
    const order: Record<AutonomyLevel, number> = {
      [AutonomyLevel.OBSERVE]: 0,
      [AutonomyLevel.PLAN]: 1,
      [AutonomyLevel.ACT_CONFIRM]: 2,
      [AutonomyLevel.AUTONOMOUS]: 3,
    };
    return order[level];
  }

  private stepDown(level: AutonomyLevel): AutonomyLevel {
    switch (level) {
      case AutonomyLevel.AUTONOMOUS: return AutonomyLevel.ACT_CONFIRM;
      case AutonomyLevel.ACT_CONFIRM: return AutonomyLevel.PLAN;
      case AutonomyLevel.PLAN: return AutonomyLevel.OBSERVE;
      default: return AutonomyLevel.OBSERVE;
    }
  }
}
