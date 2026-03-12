/**
 * PortfolioManager tests
 */

import { PortfolioManager } from './PortfolioManager';

// Mock the Prisma client
jest.mock('../db/client', () => ({
  getPrisma: () => ({
    polymarketPosition: {
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
    },
  }),
}));

describe('PortfolioManager', () => {
  let manager: PortfolioManager;

  beforeEach(() => {
    manager = PortfolioManager.getInstance();
    manager.reset();
  });

  describe('trackPosition', () => {
    it('should create and track a new position', async () => {
      const position = await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-yes',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.45,
        currentPrice: 0.45,
        openedAt: Date.now(),
      });

      expect(position.id).toBeDefined();
      expect(position.side).toBe('YES');
      expect(position.size).toBe(100);
      expect(position.avgPrice).toBe(0.45);
    });

    it('should track NO positions correctly', async () => {
      const position = await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-no',
        marketId: 'market-1',
        side: 'NO',
        size: 50,
        avgPrice: 0.60,
        currentPrice: 0.60,
        openedAt: Date.now(),
      });

      expect(position.side).toBe('NO');
      expect(position.size).toBe(50);
    });
  });

  describe('updatePnL', () => {
    it('should calculate positive PnL for YES position when price increases', async () => {
      const position = await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-yes',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.40,
        currentPrice: 0.40,
        openedAt: Date.now(),
      });

      const updated = manager.updatePnL('token-yes', 0.55);

      expect(updated).toBeDefined();
      expect(updated?.unrealizedPnl).toBeCloseTo((0.55 - 0.40) * 100, 4); // 15.00
    });

    it('should calculate negative PnL for YES position when price decreases', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-yes',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.50,
        currentPrice: 0.50,
        openedAt: Date.now(),
      });

      const updated = manager.updatePnL('token-yes', 0.35);

      expect(updated?.unrealizedPnl).toBeCloseTo((0.35 - 0.50) * 100, 4); // -15.00
    });

    it('should calculate positive PnL for NO position when price decreases', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-no',
        marketId: 'market-1',
        side: 'NO',
        size: 100,
        avgPrice: 0.60,
        currentPrice: 0.60,
        openedAt: Date.now(),
      });

      // NO position profits when price goes DOWN
      const updated = manager.updatePnL('token-no', 0.40);

      expect(updated?.unrealizedPnl).toBeCloseTo(-(0.40 - 0.60) * 100, 4); // 20.00
    });

    it('should calculate negative PnL for NO position when price increases', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-no',
        marketId: 'market-1',
        side: 'NO',
        size: 100,
        avgPrice: 0.30,
        currentPrice: 0.30,
        openedAt: Date.now(),
      });

      const updated = manager.updatePnL('token-no', 0.50);

      expect(updated?.unrealizedPnl).toBeCloseTo(-(0.50 - 0.30) * 100, 4); // -20.00
    });
  });

  describe('getPositions', () => {
    it('should return all positions', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 50,
        avgPrice: 0.40,
        currentPrice: 0.40,
        openedAt: Date.now(),
      });

      await manager.trackPosition({
        tenantId: 'tenant-2',
        tokenId: 'token-2',
        marketId: 'market-2',
        side: 'NO',
        size: 75,
        avgPrice: 0.55,
        currentPrice: 0.55,
        openedAt: Date.now(),
      });

      expect(manager.getPositions()).toHaveLength(2);
      expect(manager.getPositions('tenant-1')).toHaveLength(1);
      expect(manager.getPositions('tenant-2')).toHaveLength(1);
    });

    it('should filter open positions', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 50,
        avgPrice: 0.40,
        currentPrice: 0.40,
        openedAt: Date.now(),
      });

      const openPositions = manager.getOpenPositions('tenant-1');
      expect(openPositions).toHaveLength(1);
      expect(openPositions[0].closedAt).toBeUndefined();
    });
  });

  describe('getTotalPnL', () => {
    it('should calculate total PnL across all positions', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.40,
        currentPrice: 0.40,
        openedAt: Date.now(),
      });

      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-2',
        marketId: 'market-2',
        side: 'NO',
        size: 100,
        avgPrice: 0.50,
        currentPrice: 0.50,
        openedAt: Date.now(),
      });

      manager.updatePnL('token-1', 0.50); // +10.00
      manager.updatePnL('token-2', 0.40); // +10.00

      expect(manager.getTotalPnL('tenant-1')).toBeCloseTo(20, 4);
    });
  });

  describe('getExposure', () => {
    it('should calculate total exposure', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.45,
        currentPrice: 0.45,
        openedAt: Date.now(),
      });

      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-2',
        marketId: 'market-2',
        side: 'NO',
        size: 50,
        avgPrice: 0.60,
        currentPrice: 0.60,
        openedAt: Date.now(),
      });

      // Exposure = sum of (size * currentPrice) for open positions
      expect(manager.getExposure('tenant-1')).toBeCloseTo(
        100 * 0.45 + 50 * 0.60, // 45 + 30 = 75
        4
      );
    });

    it('should only count open positions', async () => {
      const pos = await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.50,
        currentPrice: 0.50,
        openedAt: Date.now(),
      });

      manager.updatePnL('token-1', 0.55);
      await manager.closePosition(pos.id, 0.55);

      expect(manager.getExposure('tenant-1')).toBe(0);
    });
  });

  describe('getMarketExposure', () => {
    it('should break down exposure by market', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-yes-1',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.45,
        currentPrice: 0.45,
        openedAt: Date.now(),
      });

      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-no-1',
        marketId: 'market-1',
        side: 'NO',
        size: 100,
        avgPrice: 0.55,
        currentPrice: 0.55,
        openedAt: Date.now(),
      });

      const exposures = manager.getMarketExposure('tenant-1');

      expect(exposures).toHaveLength(1);
      expect(exposures[0].marketId).toBe('market-1');
      expect(exposures[0].yesExposure).toBeCloseTo(100 * 0.45, 4);
      expect(exposures[0].noExposure).toBeCloseTo(100 * 0.55, 4);
      expect(exposures[0].totalPositions).toBe(2);
    });
  });

  describe('closePosition', () => {
    it('should close a position and finalize PnL', async () => {
      const position = await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.40,
        currentPrice: 0.40,
        openedAt: Date.now(),
      });

      manager.updatePnL('token-1', 0.50);

      const closed = await manager.closePosition(position.id, 0.50);

      expect(closed).toBeDefined();
      expect(closed?.realizedPnl).toBeCloseTo((0.50 - 0.40) * 100, 4); // 10.00
      expect(closed?.closedAt).toBeDefined();
    });

    it('should remove closed position from active tracking', async () => {
      const position = await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.40,
        currentPrice: 0.40,
        openedAt: Date.now(),
      });

      await manager.closePosition(position.id, 0.45);

      const openPositions = manager.getOpenPositions('tenant-1');
      expect(openPositions).toHaveLength(0);
    });
  });

  describe('getPortfolioSummary', () => {
    it('should return complete portfolio summary', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.40,
        currentPrice: 0.40,
        openedAt: Date.now(),
      });

      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-2',
        marketId: 'market-2',
        side: 'NO',
        size: 50,
        avgPrice: 0.60,
        currentPrice: 0.60,
        openedAt: Date.now(),
      });

      manager.updatePnL('token-1', 0.50); // +10.00
      manager.updatePnL('token-2', 0.50); // +5.00

      const summary = manager.getPortfolioSummary('tenant-1');

      expect(summary.totalPositions).toBe(2);
      expect(summary.totalPnl).toBeCloseTo(15, 4);
      expect(summary.totalExposure).toBeCloseTo(100 * 0.50 + 50 * 0.50, 4); // 75
      expect(summary.marketExposures).toHaveLength(2);
    });
  });

  describe('reset', () => {
    it('should clear all tracked positions', async () => {
      await manager.trackPosition({
        tenantId: 'tenant-1',
        tokenId: 'token-1',
        marketId: 'market-1',
        side: 'YES',
        size: 100,
        avgPrice: 0.40,
        currentPrice: 0.40,
        openedAt: Date.now(),
      });

      expect(manager.getPositions()).toHaveLength(1);

      manager.reset();

      expect(manager.getPositions()).toHaveLength(0);
    });
  });
});
