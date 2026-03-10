/**
 * Phase 2B Core Components Tests
 * Tests for: OrderRouter, PositionManager, LatencyOptimizer
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { OrderRouter, getOrderRouter } from './order-router';
import { PositionManager, getPositionManager } from './position-manager';
import { LatencyOptimizer, getLatencyOptimizer } from './latency-optimizer';
import { LicenseService, LicenseTier } from '../lib/raas-gate';

describe('Phase 2B Core Components', () => {
  beforeEach(() => {
    LicenseService.getInstance().reset();
    getOrderRouter().reset();
    getPositionManager().reset();
    getLatencyOptimizer().reset();
  });

  describe('OrderRouter', () => {
    test('should initialize with default exchanges', () => {
      const router = new OrderRouter();
      const quotes = router.getQuotes();
      expect(quotes.size).toBe(0);

      const latencies = router.getLatencies();
      expect(latencies.size).toBe(0);
    });

    test('should update price quotes', () => {
      const router = new OrderRouter();
      router.updateQuote('binance', 'BTC/USDT', 50000, 50010);

      const quotes = router.getQuotes('BTC');
      expect(quotes.size).toBe(1);
      const quote = quotes.get('binance:BTC/USDT');
      expect(quote?.bid).toBe(50000);
      expect(quote?.ask).toBe(50010);
    });

    test('should update latencies with smoothing', () => {
      const router = new OrderRouter();
      router.updateLatency('binance', 100);
      router.updateLatency('binance', 150);

      const latencies = router.getLatencies();
      expect(latencies.has('binance')).toBe(true);
    });

    test('should get best exchange for BUY order', () => {
      LicenseService.getInstance().activateLicense('test-pro', LicenseTier.PRO);

      const router = new OrderRouter();
      router.updateQuote('binance', 'BTC/USDT', 50000, 50010);
      router.updateQuote('okx', 'BTC/USDT', 49990, 50000);
      router.updateLatency('binance', 50);
      router.updateLatency('okx', 60);

      const best = router.getBestExchange('BTC/USDT', 'BUY');
      expect(best).toBeDefined();
      expect(best?.exchange).toBe('okx');
    });

    test('should get best exchange for SELL order', () => {
      LicenseService.getInstance().activateLicense('test-pro', LicenseTier.PRO);

      const router = new OrderRouter();
      router.updateQuote('binance', 'BTC/USDT', 50000, 50010);

      const best = router.getBestExchange('BTC/USDT', 'SELL');
      expect(best).toBeDefined();
      expect(best?.exchange).toBe('binance');
    });

    test('should estimate slippage based on size', () => {
      const router = new OrderRouter();

      const smallSlippage = router.estimateSlippage('BTC/USDT', 100);
      const largeSlippage = router.estimateSlippage('BTC/USDT', 10000);

      expect(largeSlippage).toBeGreaterThan(smallSlippage);
      expect(largeSlippage).toBeLessThanOrEqual(0.01);
    });

    test('should route order successfully when quotes available', async () => {
      LicenseService.getInstance().activateLicense('test-pro', LicenseTier.PRO);

      const router = new OrderRouter();
      router.updateQuote('binance', 'BTC/USDT', 50000, 50010);
      router.updateLatency('binance', 50);

      const result = await router.routeOrder({
        symbol: 'BTC/USDT',
        side: 'BUY',
        amount: 1000,
        timestamp: Date.now(),
      });

      expect(result.success).toBe(true);
      expect(result.exchange).toBe('binance');
      expect(result.price).toBeDefined();
      expect(result.fee).toBeDefined();
    });

    test('should fail routing when no quotes available', async () => {
      const router = new OrderRouter();

      const result = await router.routeOrder({
        symbol: 'BTC/USDT',
        side: 'BUY',
        amount: 1000,
        timestamp: Date.now(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('should require PRO license for multi-exchange routing', async () => {
      LicenseService.getInstance().reset();

      const router = new OrderRouter();
      router.updateQuote('binance', 'BTC/USDT', 50000, 50010);
      router.updateQuote('okx', 'BTC/USDT', 49990, 50000);

      const result = await router.routeOrder({
        symbol: 'BTC/USDT',
        side: 'BUY',
        amount: 1000,
        timestamp: Date.now(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('PRO');
    });
  });

  describe('PositionManager', () => {
    test('should open a new position', () => {
      const manager = new PositionManager();

      const position = manager.openPosition({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'LONG',
        size: 0.1,
        entryPrice: 50000,
        leverage: 1,
        metadata: {},
      });

      expect(position.symbol).toBe('BTC/USDT');
      expect(position.side).toBe('LONG');
      expect(position.unrealizedPnl).toBe(0);
    });

    test('should update position with current price', () => {
      const manager = new PositionManager();

      manager.openPosition({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'LONG',
        size: 0.1,
        entryPrice: 50000,
        leverage: 1,
      });

      const updated = manager.updatePosition({
        symbol: 'BTC/USDT',
        currentPrice: 51000,
        timestamp: Date.now(),
      });

      expect(updated).toBeDefined();
      expect(updated?.unrealizedPnl).toBe(100);
      expect(updated?.unrealizedPnlPct).toBe(2);
    });

    test('should calculate unrealized P&L for multiple positions', () => {
      const manager = new PositionManager();

      manager.openPosition({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'LONG',
        size: 0.1,
        entryPrice: 50000,
        leverage: 1,
      });

      manager.openPosition({
        symbol: 'ETH/USDT',
        exchange: 'binance',
        side: 'SHORT',
        size: 1,
        entryPrice: 3000,
        leverage: 1,
      });

      const prices = new Map([
        ['BTC/USDT', 51000],
        ['ETH/USDT', 2900],
      ]);

      const totalPnl = manager.calculateUnrealizedPnl(prices);
      expect(totalPnl).toBe(200);
    });

    test('should close a position', () => {
      const manager = new PositionManager();

      manager.openPosition({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'LONG',
        size: 0.1,
        entryPrice: 50000,
        leverage: 1,
      });

      const closed = manager.closePosition('binance', 'BTC/USDT', 51000);

      expect(closed).toBeDefined();
      expect(closed?.unrealizedPnl).toBe(100);
      expect(manager.getPositions().length).toBe(0);
    });

    test('should get risk metrics', () => {
      const manager = new PositionManager();

      manager.openPosition({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'LONG',
        size: 0.1,
        entryPrice: 50000,
        leverage: 1,
      });

      const metrics = manager.getRiskMetrics(100000);

      expect(metrics.positionCount).toBe(1);
      expect(metrics.longCount).toBe(1);
      expect(metrics.shortCount).toBe(0);
      expect(metrics.grossExposure).toBe(5000);
    });

    test('should check position size limits', () => {
      const manager = new PositionManager(10000, 50000);

      const canOpen = manager.canOpenPosition('BTC/USDT', 1, 15000);

      expect(canOpen.allowed).toBe(false);
      expect(canOpen.reason).toContain('exceeds max');
    });

    test('should check total exposure limits', () => {
      const manager = new PositionManager(10000, 50000);

      manager.openPosition({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'LONG',
        size: 0.5,
        entryPrice: 50000,
        leverage: 1,
      });

      const canOpen = manager.canOpenPosition('ETH/USDT', 10, 3000);

      expect(canOpen.allowed).toBe(false);
      expect(canOpen.reason).toContain('exceed');
    });

    test('should close all positions', () => {
      const manager = new PositionManager();

      manager.openPosition({
        symbol: 'BTC/USDT',
        exchange: 'binance',
        side: 'LONG',
        size: 0.1,
        entryPrice: 50000,
        leverage: 1,
      });

      manager.openPosition({
        symbol: 'ETH/USDT',
        exchange: 'binance',
        side: 'SHORT',
        size: 1,
        entryPrice: 3000,
        leverage: 1,
      });

      const prices = new Map([
        ['BTC/USDT', 51000],
        ['ETH/USDT', 2900],
      ]);

      const closed = manager.closeAllPositions(prices);
      expect(closed.length).toBe(2);
      expect(manager.getPositions().length).toBe(0);
    });
  });

  describe('LatencyOptimizer', () => {
    test('should record latency samples', () => {
      const optimizer = new LatencyOptimizer();

      optimizer.recordLatency('binance', 50, 'ping');
      optimizer.recordLatency('binance', 60, 'ping');

      const stats = optimizer.getStats('binance');
      expect(stats).toBeDefined();
      expect(stats?.sampleCount).toBe(2);
    });

    test('should record errors', () => {
      const optimizer = new LatencyOptimizer();

      optimizer.recordLatency('binance', 50, 'ping');
      optimizer.recordError('binance');
      optimizer.recordError('binance');
      optimizer.recordError('binance');

      const healthy = optimizer.isHealthy('binance');
      expect(healthy).toBe(true);
    });

    test('should mark exchange unhealthy after max errors', () => {
      const optimizer = new LatencyOptimizer();

      optimizer.recordLatency('binance', 50, 'ping');

      for (let i = 0; i < 5; i++) {
        optimizer.recordError('binance');
      }

      const healthy = optimizer.isHealthy('binance');
      expect(healthy).toBe(false);
    });

    test('should calculate percentiles (PRO feature)', () => {
      LicenseService.getInstance().activateLicense('test-pro', LicenseTier.PRO);

      const optimizer = new LatencyOptimizer();

      for (let i = 1; i <= 100; i++) {
        optimizer.recordLatency('binance', i, 'ping');
      }

      const stats = optimizer.getStats('binance');
      expect(stats).toBeDefined();
      expect(stats?.p50LatencyMs).toBeGreaterThanOrEqual(49);
      expect(stats?.p50LatencyMs).toBeLessThanOrEqual(51);
      expect(stats?.p95LatencyMs).toBeGreaterThanOrEqual(94);
      expect(stats?.p95LatencyMs).toBeLessThanOrEqual(96);
    });

    test('should determine health based on latency', () => {
      const optimizer = new LatencyOptimizer();

      for (let i = 0; i < 50; i++) {
        optimizer.recordLatency('binance', 50, 'ping');
      }

      let stats = optimizer.getStats('binance');
      expect(stats?.health).toBe('HEALTHY');

      optimizer.reset();
      for (let i = 0; i < 50; i++) {
        optimizer.recordLatency('binance', 600, 'ping');
      }

      stats = optimizer.getStats('binance');
      expect(stats?.health).toBe('DEGRADED');
    });

    test('should get best exchange by latency', () => {
      const optimizer = new LatencyOptimizer();

      optimizer.recordLatency('binance', 100, 'ping');
      optimizer.recordLatency('okx', 50, 'ping');
      optimizer.recordLatency('bybit', 75, 'ping');

      const best = optimizer.getBestExchange(['binance', 'okx', 'bybit']);
      expect(best).toBe('okx');
    });

    test('should get healthy exchanges', () => {
      const optimizer = new LatencyOptimizer();

      optimizer.recordLatency('binance', 50, 'ping');
      for (let i = 0; i < 5; i++) {
        optimizer.recordError('okx');
      }

      const healthy = optimizer.getHealthyExchanges();
      expect(healthy).toContain('binance');
      expect(healthy).not.toContain('okx');
    });

    test('should recommend failover for unhealthy exchange', () => {
      const optimizer = new LatencyOptimizer();

      for (let i = 0; i < 5; i++) {
        optimizer.recordError('binance');
      }

      const shouldFailover = optimizer.shouldFailover('binance');
      expect(shouldFailover).toBe(true);
    });

    test('should get backup exchange', () => {
      const optimizer = new LatencyOptimizer();

      optimizer.recordLatency('binance', 50, 'ping');
      optimizer.recordLatency('okx', 60, 'ping');

      const backup = optimizer.getBackupExchange('binance');
      expect(backup).toBe('okx');
    });

    test('should get health summary', () => {
      const optimizer = new LatencyOptimizer();

      optimizer.recordLatency('binance', 50, 'ping');
      optimizer.recordError('okx');

      const summary = optimizer.getHealthSummary();
      expect(summary.has('binance')).toBe(true);
      expect(summary.has('okx')).toBe(true);
    });
  });
});
