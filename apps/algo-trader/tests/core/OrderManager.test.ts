/**
 * Tests for OrderManager — order persistence, atomic writes, arb trades.
 */

import { OrderManager } from '../../src/core/OrderManager';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs and logger
jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  return {
    ...actual,
    existsSync: jest.fn(),
    readFileSync: jest.fn(),
    writeFileSync: jest.fn(),
    renameSync: jest.fn(),
    mkdirSync: jest.fn(),
  };
});

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('OrderManager', () => {
  let orderManager: OrderManager;
  const mockStoragePath = '/mock/data/orders.json';

  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    orderManager = new OrderManager();
  });

  describe('constructor', () => {
    it('creates directory if not exists', () => {
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    });

    it('loads existing orders from file', () => {
      const mockOrders = [
        { id: '1', side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, status: 'open' },
      ];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockOrders));

      orderManager = new OrderManager();
      expect(fs.readFileSync).toHaveBeenCalledWith(expect.any(String), 'utf8');
    });

    it('handles corrupted file by backing up and starting fresh', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');

      orderManager = new OrderManager();
      expect(fs.renameSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('.corrupted.')
      );
    });

    it('handles non-array JSON by treating as corrupted', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('{"not": "array"}');

      orderManager = new OrderManager();
      expect(fs.renameSync).toHaveBeenCalled();
    });
  });

  describe('addOrder()', () => {
    it('adds order to list and saves', () => {
      const order = { id: '1', side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, status: 'open' as const };
      orderManager.addOrder(order);

      const orders = orderManager.getOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0]).toEqual(order);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('uses atomic write (temp file + rename)', () => {
      const order = { id: '1', side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, status: 'open' as const };
      orderManager.addOrder(order);

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.any(String)
      );
      expect(fs.renameSync).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.any(String)
      );
    });
  });

  describe('getOrders()', () => {
    it('returns all orders', () => {
      const orders = [
        { id: '1', side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, status: 'open' as const },
        { id: '2', side: 'sell', symbol: 'ETH/USDT', amount: 1.0, price: 3000, status: 'closed' as const },
      ];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(orders));
      orderManager = new OrderManager();

      expect(orderManager.getOrders()).toEqual(orders);
    });
  });

  describe('getOpenOrders()', () => {
    it('returns only open orders', () => {
      const orders = [
        { id: '1', side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, status: 'open' as const },
        { id: '2', side: 'sell', symbol: 'ETH/USDT', amount: 1.0, price: 3000, status: 'closed' as const },
        { id: '3', side: 'buy', symbol: 'SOL/USDT', amount: 10, price: 100, status: 'open' as const },
      ];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(orders));
      orderManager = new OrderManager();

      const openOrders = orderManager.getOpenOrders();
      expect(openOrders).toHaveLength(2);
      expect(openOrders.every(o => o.status === 'open')).toBe(true);
    });
  });

  describe('getLastOrder()', () => {
    it('returns last order', () => {
      const orders = [
        { id: '1', side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, status: 'open' as const },
        { id: '2', side: 'sell', symbol: 'ETH/USDT', amount: 1.0, price: 3000, status: 'closed' as const },
      ];
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(orders));
      orderManager = new OrderManager();

      const last = orderManager.getLastOrder();
      expect(last).toEqual(orders[1]);
    });

    it('returns undefined for empty list', () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue('[]');
      orderManager = new OrderManager();

      expect(orderManager.getLastOrder()).toBeUndefined();
    });
  });

  describe('addArbTrade()', () => {
    it('adds both buy and sell orders', () => {
      const buyOrder = { id: 'buy-1', side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, status: 'filled' as const };
      const sellOrder = { id: 'sell-1', side: 'sell', symbol: 'ETH/USDT', amount: 1.0, price: 3000, status: 'filled' as const };

      orderManager.addArbTrade(buyOrder, sellOrder);

      const orders = orderManager.getOrders();
      expect(orders).toHaveLength(2);
      expect(orders).toContainEqual(buyOrder);
      expect(orders).toContainEqual(sellOrder);
    });

    it('saves atomically', () => {
      const buyOrder = { id: 'buy-1', side: 'buy', symbol: 'BTC/USDT', amount: 0.1, price: 50000, status: 'filled' as const };
      const sellOrder = { id: 'sell-1', side: 'sell', symbol: 'ETH/USDT', amount: 1.0, price: 3000, status: 'filled' as const };

      orderManager.addArbTrade(buyOrder, sellOrder);

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(fs.renameSync).toHaveBeenCalled();
    });
  });
});
