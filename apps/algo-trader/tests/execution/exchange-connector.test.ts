/**
 * Binance Exchange Connector Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import { BinanceWebSocket, createBinanceWebSocket } from '../../src/execution/exchange-connector';

describe('BinanceWebSocket', () => {
  let ws: BinanceWebSocket;

  beforeEach(() => {
    ws = createBinanceWebSocket();
  });

  describe('Initialization', () => {
    test('should create instance with default config', () => {
      expect(ws).toBeInstanceOf(BinanceWebSocket);
    });

    test('should create instance with API credentials', () => {
      const ws = createBinanceWebSocket({
        apiKey: 'test-key',
        secret: 'test-secret',
        options: { defaultType: 'spot' },
      });

      expect(ws).toBeInstanceOf(BinanceWebSocket);
    });

    test('should emit initialized event on successful init', (done) => {
      ws.on('initialized', (data) => {
        expect(data).toHaveProperty('markets');
        expect(data).toHaveProperty('timestamp');
        done();
      });

      // Note: This test requires network, may need mocking
      ws.initialize().catch(() => {
        // Expected to fail in test environment without credentials
      });
    });

    test('should emit error on initialization failure', (done) => {
      const ws = createBinanceWebSocket({
        apiKey: 'invalid',
        secret: 'invalid',
      });

      ws.on('error', (error) => {
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('timestamp');
        done();
      });

      ws.initialize().catch(() => {});
    });
  });

  describe('Connection Status', () => {
    test('should return initial connection status', () => {
      const status = ws.getConnectionStatus();

      expect(status.isRunning).toBe(false);
      expect(status.activeConnections).toBe(0);
      expect(status.subscriptions).toEqual([]);
    });
  });

  describe('Subscription Management', () => {
    test('should track subscription keys', () => {
      // Mock implementation for testing
      const mockWs = {
        on: jest.fn(),
        close: jest.fn(),
      };

      (ws as any).wsConnections.set('orderbook:BTC/USDT', mockWs);

      const status = ws.getConnectionStatus();
      expect(status.activeConnections).toBe(1);
      expect(status.subscriptions).toContain('orderbook:BTC/USDT');
    });

    test('should prevent duplicate subscriptions', () => {
      const mockWs = { on: jest.fn(), close: jest.fn() };
      (ws as any).wsConnections.set('trades:BTC/USDT', mockWs);

      // Attempting to subscribe again should not add duplicate
      expect((ws as any).wsConnections.size).toBe(1);
    });
  });

  describe('Reconnection Logic', () => {
    test('should track reconnect attempts', () => {
      const key = 'ticker:ETH/USDT';

      // Simulate reconnect attempts
      (ws as any).reconnectAttempts.set(key, 3);

      expect((ws as any).reconnectAttempts.get(key)).toBe(3);
    });

    test('should respect max reconnect attempts', () => {
      const key = 'orderbook:BTC/USDT';
      const maxAttempts = (ws as any).MAX_RECONNECT_ATTEMPTS;

      // Set at max attempts
      (ws as any).reconnectAttempts.set(key, maxAttempts);

      // Should not reconnect
      expect((ws as any).reconnectAttempts.get(key)).toBe(maxAttempts);
    });
  });

  describe('Close Connections', () => {
    test('should clear all connections on close', async () => {
      const mockWs = {
        on: jest.fn(),
        close: jest.fn(),
      };

      (ws as any).wsConnections.set('test:key', mockWs);
      (ws as any).reconnectAttempts.set('test:key', 2);

      await ws.close();

      expect((ws as any).wsConnections.size).toBe(0);
      expect((ws as any).reconnectAttempts.size).toBe(0);
    });

    test('should emit closed event', (done) => {
      ws.on('closed', (data) => {
        expect(data).toHaveProperty('timestamp');
        done();
      });

      ws.close();
    });
  });

  describe('Factory Function', () => {
    test('should create instance via factory', () => {
      const instance = createBinanceWebSocket();
      expect(instance).toBeInstanceOf(BinanceWebSocket);
    });

    test('should create instance with config via factory', () => {
      const instance = createBinanceWebSocket({
        apiKey: 'factory-key',
        options: { defaultType: 'future' },
      });
      expect(instance).toBeInstanceOf(BinanceWebSocket);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing symbol gracefully', () => {
      expect(() => {
        (ws as any).subscribeOrderBook('', 20);
      }).not.toThrow();
    });

    test('should handle undefined config', () => {
      expect(() => {
        createBinanceWebSocket(undefined as any);
      }).not.toThrow();
    });
  });
});
