/**
 * Phase 11 Module 3: QuantumChannel — simulated quantum transmission channel.
 *
 * Tracks transmissions, simulates eavesdropping detection.
 * When eavesdropping is detected, transmission fails and key rotation is required.
 *
 * Default: dryRun = true, eavesdroppingDetection = true.
 */

import { randomBytes } from 'crypto';

export interface QuantumChannelConfig {
  /** Dry-run mode. Default: true. */
  dryRun: boolean;
  /** Enable eavesdropping detection. Default: true. */
  eavesdroppingDetection: boolean;
}

export interface TransmissionResult {
  channelId: string;
  keyId: string;
  transmitted: boolean;
  eavesdroppingDetected: boolean;
  timestamp: number;
}

const DEFAULT_CONFIG: QuantumChannelConfig = {
  dryRun: true,
  eavesdroppingDetection: true,
};

export class QuantumChannel {
  private readonly cfg: QuantumChannelConfig;
  private readonly channelId: string;
  private readonly log: TransmissionResult[] = [];
  private _nextEavesdropping = false;

  constructor(config: Partial<QuantumChannelConfig> = {}) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.channelId = randomBytes(8).toString('hex');
  }

  /**
   * Transmit an encrypted payload over the quantum channel.
   * If eavesdropping is flagged for this transmission, it fails.
   */
  send(encryptedPayload: Buffer, keyId: string): TransmissionResult {
    const eavesdroppingDetected =
      this.cfg.eavesdroppingDetection && this._nextEavesdropping;

    // Reset flag after consumption
    this._nextEavesdropping = false;

    // Transmission fails when eavesdropping is detected
    const transmitted = !eavesdroppingDetected;

    const result: TransmissionResult = {
      channelId: this.channelId,
      keyId,
      transmitted,
      eavesdroppingDetected,
      timestamp: Date.now(),
    };

    this.log.push(result);

    // Validate payload is non-empty (basic sanity check)
    if (encryptedPayload.length === 0 && !eavesdroppingDetected) {
      throw new Error('QuantumChannel: cannot transmit empty payload');
    }

    return result;
  }

  /**
   * Toggle eavesdropping flag — next call to send() will detect eavesdropping.
   * Resets automatically after one transmission.
   */
  simulateEavesdropping(): void {
    this._nextEavesdropping = true;
  }

  /** Returns a copy of the full transmission log. */
  getTransmissionLog(): TransmissionResult[] {
    return [...this.log];
  }

  /** The stable channel ID for this instance. */
  getChannelId(): string {
    return this.channelId;
  }

  getConfig(): QuantumChannelConfig {
    return { ...this.cfg };
  }
}
