import { describe, test, expect, beforeEach } from '@jest/globals';
import { ExchangeConnectionPool, ExchangeConfig } from './exchange-connection-pool';
import { LicenseService } from '../lib/raas-gate';

describe('ExchangeConnectionPool', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
    ExchangeConnectionPool.getInstance().reset();
  });

  test('should connect to binance with FREE tier', async () => {
    await LicenseService.getInstance().validate();
    const pool = ExchangeConnectionPool.getInstance();
    const config: ExchangeConfig = { id: 'binance', name: 'Binance' };
    const conn = await pool.connect(config);
    expect(conn.connected).toBe(true);
    expect(conn.id).toBe('binance');
  });

  test('should reject non-binance exchange with FREE tier', async () => {
    await LicenseService.getInstance().validate();
    const pool = ExchangeConnectionPool.getInstance();
    const config: ExchangeConfig = { id: 'okx', name: 'OKX' };
    await expect(pool.connect(config)).rejects.toThrow('requires PRO license');
  });

  test('should connect to multiple exchanges with PRO tier', async () => {
    await LicenseService.getInstance().validate('raas-pro-test');
    const pool = ExchangeConnectionPool.getInstance();
    await pool.connect({ id: 'binance', name: 'Binance' });
    await pool.connect({ id: 'okx', name: 'OKX' });
    await pool.connect({ id: 'bybit', name: 'Bybit' });
    expect(pool.getConnections().length).toBe(3);
  });

  test('should return health check status', async () => {
    await LicenseService.getInstance().validate('raas-pro-test');
    const pool = ExchangeConnectionPool.getInstance();
    await pool.connect({ id: 'binance', name: 'Binance' });
    const health = pool.healthCheck();
    expect(health.binance).toBe(true);
  });
});
