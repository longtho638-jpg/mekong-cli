import { describe, test, expect, beforeEach } from '@jest/globals';
import { PositionManager, Position } from './position-manager';
import { LicenseService } from '../lib/raas-gate';

describe('PositionManager', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
    PositionManager.getInstance().reset();
  });

  test('should open and close position', () => {
    const pm = PositionManager.getInstance();
    const position: Position = {
      id: 'pos-1',
      symbol: 'BTC/USDT',
      exchangeId: 'binance',
      side: 'long',
      quantity: 0.1,
      entryPrice: 50000,
      currentPrice: 50000,
      unrealizedPnl: 0,
      realizedPnl: 0,
      openedAt: Date.now(),
    };
    pm.openPosition(position);
    expect(pm.getPositions().length).toBe(1);
    pm.closePosition('pos-1', 51000);
    expect(pm.getPositions().length).toBe(0);
    const summary = pm.getSummary();
    expect(summary.totalRealizedPnl).toBe(100);
  });

  test('should update unrealized PnL on price change', () => {
    const pm = PositionManager.getInstance();
    pm.openPosition({
      id: 'pos-2',
      symbol: 'ETH/USDT',
      exchangeId: 'binance',
      side: 'long',
      quantity: 1,
      entryPrice: 3000,
      currentPrice: 3000,
      unrealizedPnl: 0,
      realizedPnl: 0,
      openedAt: Date.now(),
    });
    pm.updatePrice('pos-2', 3100);
    const positions = pm.getPositions();
    expect(positions[0].unrealizedPnl).toBe(100);
  });

  test('should throw for advanced analytics without PRO', () => {
    LicenseService.getInstance().validateSync();
    const pm = PositionManager.getInstance();
    expect(() => pm.getAdvancedAnalytics()).toThrow('PRO');
  });

  test('should return advanced analytics with PRO', async () => {
    LicenseService.getInstance().validateSync('raas-pro-test');
    const pm = PositionManager.getInstance();
    pm.openPosition({
      id: 'pos-3',
      symbol: 'BTC/USDT',
      exchangeId: 'binance',
      side: 'long',
      quantity: 0.1,
      entryPrice: 50000,
      currentPrice: 50000,
      unrealizedPnl: 0,
      realizedPnl: 0,
      openedAt: Date.now(),
    });
    const analytics = pm.getAdvancedAnalytics();
    expect(analytics).toBeDefined();
  });
});
