/**
 * EmergencyProtocol — listens for CRITICAL_COLLAPSE events and executes
 * emergency shutdown + simulated withdrawal sequence.
 * SIMULATION MODE ONLY — no real funds moved.
 */

import { EventEmitter } from 'events';
import { logger } from '../../../utils/logger';

export interface EmergencyConfig {
  coldStorageAddresses: string[];
  emergencyWithdrawal: boolean;
}

export type EmergencyState = 'idle' | 'triggered' | 'withdrawing' | 'hibernating';

export class EmergencyProtocol extends EventEmitter {
  private state: EmergencyState = 'idle';
  private config: EmergencyConfig;
  private tradingPausedAt: string | null = null;

  constructor(config: EmergencyConfig) {
    super();
    this.config = config;
  }

  /**
   * Wire this protocol to an event source that emits 'CRITICAL_COLLAPSE'.
   * @param source - EventEmitter that may emit 'CRITICAL_COLLAPSE'
   */
  attachTo(source: EventEmitter): void {
    source.on('CRITICAL_COLLAPSE', (probability: number) => {
      void this.trigger(probability);
    });
  }

  /**
   * Trigger emergency sequence. Idempotent — ignores subsequent calls while active.
   * @param collapseProbability - Score that triggered this event [0,1]
   */
  async trigger(collapseProbability: number): Promise<void> {
    if (this.state !== 'idle') return;

    this.state = 'triggered';
    this.tradingPausedAt = new Date().toISOString();
    logger.warn(`[CapitalFortress] CRITICAL_COLLAPSE triggered (p=${collapseProbability.toFixed(4)}). Pausing trading.`);

    // Step 1: Pause all trading
    this.emit('trading:pause');

    if (this.config.emergencyWithdrawal && this.config.coldStorageAddresses.length > 0) {
      this.state = 'withdrawing';
      await this.executeEmergencyWithdrawal();
    }

    // Step 2: Hibernate
    this.state = 'hibernating';
    this.emit('system:hibernate', { reason: 'CRITICAL_COLLAPSE', at: this.tradingPausedAt });
    logger.warn('[CapitalFortress] System entering hibernation. Manual intervention required.');
  }

  private async executeEmergencyWithdrawal(): Promise<void> {
    // Simulation: log withdrawal intent to each cold storage address
    for (const address of this.config.coldStorageAddresses) {
      logger.warn(`[CapitalFortress] SIMULATION: Emergency withdrawal → ${address}`);
      this.emit('withdrawal:simulated', { address, at: new Date().toISOString() });
    }
    // Simulate async signing delay
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  getState(): EmergencyState { return this.state; }
  getTradingPausedAt(): string | null { return this.tradingPausedAt; }

  /** Reset to idle (for testing / manual recovery). */
  reset(): void {
    this.state = 'idle';
    this.tradingPausedAt = null;
  }
}
