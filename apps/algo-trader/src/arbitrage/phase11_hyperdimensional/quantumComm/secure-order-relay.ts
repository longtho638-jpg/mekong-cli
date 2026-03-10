/**
 * Phase 11 Module 3: SecureOrderRelay — end-to-end encrypted order transmission.
 *
 * Serializes trading orders to JSON → Buffer → OTP encrypt → quantum channel send.
 * receiveOrder() decrypts and deserializes back to order object.
 *
 * Default: dryRun = true.
 */

import { OtpEncryptor } from './otp-encryptor';
import { QuantumChannel } from './quantum-channel';
import { randomBytes } from 'crypto';

export interface TradeOrder {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
}

export interface RelayResult {
  relayId: string;
  encrypted: boolean;
  transmitted: boolean;
  keyId: string;
  timestamp: number;
}

export interface SecureOrderRelayConfig {
  /** Dry-run mode. Default: true. */
  dryRun: boolean;
}

const DEFAULT_CONFIG: SecureOrderRelayConfig = {
  dryRun: true,
};

export class SecureOrderRelay {
  private readonly cfg: SecureOrderRelayConfig;
  private readonly encryptor: OtpEncryptor;
  private readonly channel: QuantumChannel;
  private readonly relayLog: RelayResult[] = [];

  constructor(
    config: Partial<SecureOrderRelayConfig> = {},
    encryptor?: OtpEncryptor,
    channel?: QuantumChannel,
  ) {
    this.cfg = { ...DEFAULT_CONFIG, ...config };
    this.encryptor = encryptor ?? new OtpEncryptor({ dryRun: this.cfg.dryRun });
    this.channel = channel ?? new QuantumChannel({ dryRun: this.cfg.dryRun });
  }

  /**
   * Relay an order: serialize → encrypt with OTP key → transmit via quantum channel.
   * @param order  Trade order to relay.
   * @param key    OTP key (must be >= serialized order length).
   * @param keyId  Active key ID from QKD simulator.
   */
  relayOrder(order: TradeOrder, key: Buffer, keyId: string): RelayResult {
    this._validateOrder(order);

    const plaintext = Buffer.from(JSON.stringify(order), 'utf8');
    const { ciphertext } = this.encryptor.encrypt(plaintext, key);

    const transmission = this.channel.send(ciphertext, keyId);

    const result: RelayResult = {
      relayId: randomBytes(8).toString('hex'),
      encrypted: true,
      transmitted: transmission.transmitted,
      keyId,
      timestamp: Date.now(),
    };

    this.relayLog.push(result);
    return result;
  }

  /**
   * Receive and decrypt an encrypted order payload.
   * @returns Deserialized TradeOrder.
   */
  receiveOrder(ciphertext: Buffer, key: Buffer, authTag: Buffer): TradeOrder {
    const plaintext = this.encryptor.decrypt(ciphertext, key, authTag);
    return JSON.parse(plaintext.toString('utf8')) as TradeOrder;
  }

  /** Returns a copy of the relay log. */
  getRelayLog(): RelayResult[] {
    return [...this.relayLog];
  }

  getConfig(): SecureOrderRelayConfig {
    return { ...this.cfg };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _validateOrder(order: TradeOrder): void {
    if (!order.symbol || order.symbol.trim() === '') {
      throw new Error('SecureOrderRelay: order.symbol is required');
    }
    if (order.side !== 'buy' && order.side !== 'sell') {
      throw new Error(`SecureOrderRelay: invalid side "${order.side}" — must be "buy" or "sell"`);
    }
    if (order.quantity <= 0) {
      throw new Error('SecureOrderRelay: order.quantity must be > 0');
    }
    if (order.price <= 0) {
      throw new Error('SecureOrderRelay: order.price must be > 0');
    }
  }
}
