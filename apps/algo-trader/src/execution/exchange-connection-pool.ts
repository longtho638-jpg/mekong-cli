/**
 * Exchange Connection Pool — Multi-exchange WebSocket management
 * License-gated: FREE (1 exchange), PRO (3 exchanges), ENTERPRISE (unlimited)
 */

import { LicenseService, LicenseTier, LicenseError } from '../lib/raas-gate';

export interface ExchangeConfig {
  id: string;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  wsUrl?: string;
}

export interface ExchangeConnection {
  id: string;
  name: string;
  connected: boolean;
  lastPing?: number;
  errorCount: number;
}

export const EXCHANGE_LIMITS: Record<LicenseTier, number> = {
  [LicenseTier.FREE]: 1,
  [LicenseTier.PRO]: 3,
  [LicenseTier.ENTERPRISE]: Infinity,
};

export class ExchangeConnectionPool {
  private static instance: ExchangeConnectionPool;
  private connections: Map<string, ExchangeConnection> = new Map();
  private licenseService: LicenseService;

  private constructor() {
    this.licenseService = LicenseService.getInstance();
  }

  static getInstance(): ExchangeConnectionPool {
    if (!ExchangeConnectionPool.instance) {
      ExchangeConnectionPool.instance = new ExchangeConnectionPool();
    }
    return ExchangeConnectionPool.instance;
  }

  private isExchangeAllowed(exchangeId: string): boolean {
    const tier = this.licenseService.getTier();
    const limit = EXCHANGE_LIMITS[tier];
    if (tier === LicenseTier.FREE && exchangeId !== 'binance') {
      return false;
    }
    return this.connections.size < limit;
  }

  async connect(config: ExchangeConfig): Promise<ExchangeConnection> {
    if (!this.isExchangeAllowed(config.id)) {
      throw new LicenseError(
        `Exchange "${config.name}" requires PRO license`,
        LicenseTier.PRO,
        'premium_exchanges'
      );
    }
    const connection: ExchangeConnection = {
      id: config.id,
      name: config.name,
      connected: false,
      errorCount: 0,
    };
    try {
      connection.connected = true;
      connection.lastPing = Date.now();
      this.connections.set(config.id, connection);
    } catch (error) {
      connection.errorCount += 1;
      throw error;
    }
    return connection;
  }

  disconnect(exchangeId: string): void {
    const connection = this.connections.get(exchangeId);
    if (connection) {
      connection.connected = false;
      this.connections.delete(exchangeId);
    }
  }

  getConnections(): ExchangeConnection[] {
    return Array.from(this.connections.values());
  }

  getConnection(exchangeId: string): ExchangeConnection | undefined {
    return this.connections.get(exchangeId);
  }

  healthCheck(): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [id, conn] of this.connections.entries()) {
      result[id] = conn.connected && (conn.lastPing !== undefined) && (Date.now() - conn.lastPing < 30000);
    }
    return result;
  }

  reset(): void {
    this.connections.clear();
  }
}
