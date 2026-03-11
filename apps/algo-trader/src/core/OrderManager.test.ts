/**
 * Tests for OrderManager — Order persistence and management
 */

import * as fs from 'fs';
import * as path from 'path';
import { OrderManager } from './OrderManager';
import type { IOrder } from '../interfaces/IExchange';
import { OrderSide, OrderType } from '../types/trading.types';

// Order status constants (matching CCXT order status strings)
export const OrderStatus = {
  OPEN: 'open',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

// Order side constants (matching CCXT order side strings)
export const OrderSideEnum = {
  BUY: 'buy' as OrderSide,
  SELL: 'sell' as OrderSide,
} as const;

// Order type constants (matching CCXT order type strings)
export const OrderTypeEnum = {
  MARKET: 'market' as OrderType,
  LIMIT: 'limit' as OrderType,
} as const;

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  renameSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('OrderManager', () => {
  let orderManager: OrderManager;
  const mockStoragePath = '/mock/data/orders.json';

  const createMockOrder = (overrides?: Partial<IOrder>): IOrder => ({
    id: 'order-1',
    symbol: 'BTC/USDT',
    side: OrderSideEnum.BUY,
    type: OrderTypeEnum.MARKET,
    amount: 0.1,
    price: 50000,
    status: OrderStatus.OPEN,
    timestamp: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock directory exists
    mockFs.existsSync.mockReturnValue(true);
    // Mock empty orders file
    mockFs.readFileSync.mockReturnValue('[]');
    orderManager = new OrderManager();
  });

  describe('constructor', () => {
    it('should initialize with empty orders when file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      const om = new OrderManager();
      expect(om.getOrders()).toEqual([]);
    });

    it('should load orders from existing file', () => {
      const mockOrders = [createMockOrder()];
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockOrders));

      const om = new OrderManager();
      expect(om.getOrders()).toHaveLength(1);
      expect(om.getOrders()[0].id).toBe('order-1');
    });

    it('should handle corrupted orders file', () => {
      mockFs.readFileSync.mockReturnValue('{"not": "an array"}');

      const om = new OrderManager();
      expect(om.getOrders()).toEqual([]);
      expect(mockFs.renameSync).toHaveBeenCalledWith(
        expect.stringContaining('orders.json'),
        expect.stringContaining('orders.json.corrupted.')
      );
    });

    it('should create directory if not exists', () => {
      mockFs.existsSync.mockReturnValue(false);

      const om = new OrderManager();
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('data'),
        { recursive: true }
      );
    });
  });

  describe('addOrder', () => {
    it('should add order to the list', () => {
      const order = createMockOrder();
      orderManager.addOrder(order);

      const orders = orderManager.getOrders();
      expect(orders).toHaveLength(1);
      expect(orders[0]).toEqual(order);
    });

    it('should save orders after adding', () => {
      const order = createMockOrder();
      orderManager.addOrder(order);

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.any(String)
      );
      expect(mockFs.renameSync).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining('orders.json')
      );
    });

    it('should add multiple orders', () => {
      orderManager.addOrder(createMockOrder({ id: 'order-1' }));
      orderManager.addOrder(createMockOrder({ id: 'order-2' }));

      const orders = orderManager.getOrders();
      expect(orders).toHaveLength(2);
      expect(orders.map(o => o.id)).toEqual(['order-1', 'order-2']);
    });
  });

  describe('getOpenOrders', () => {
    it('should return only open orders', () => {
      orderManager.addOrder(createMockOrder({ id: 'order-1', status: OrderStatus.OPEN }));
      orderManager.addOrder(createMockOrder({ id: 'order-2', status: OrderStatus.FILLED }));
      orderManager.addOrder(createMockOrder({ id: 'order-3', status: OrderStatus.OPEN }));

      const openOrders = orderManager.getOpenOrders();
      expect(openOrders).toHaveLength(2);
      expect(openOrders.map(o => o.id)).toEqual(['order-1', 'order-3']);
    });

    it('should return empty array when no open orders', () => {
      orderManager.addOrder(createMockOrder({ status: OrderStatus.FILLED }));
      orderManager.addOrder(createMockOrder({ status: OrderStatus.CANCELLED }));

      const openOrders = orderManager.getOpenOrders();
      expect(openOrders).toHaveLength(0);
    });
  });

  describe('getLastOrder', () => {
    it('should return the last order', () => {
      orderManager.addOrder(createMockOrder({ id: 'order-1' }));
      orderManager.addOrder(createMockOrder({ id: 'order-2' }));
      orderManager.addOrder(createMockOrder({ id: 'order-3' }));

      const lastOrder = orderManager.getLastOrder();
      expect(lastOrder?.id).toBe('order-3');
    });

    it('should return undefined when no orders', () => {
      const lastOrder = orderManager.getLastOrder();
      expect(lastOrder).toBeUndefined();
    });
  });

  describe('addArbTrade', () => {
    it('should add both buy and sell orders', () => {
      const buyOrder = createMockOrder({ id: 'buy-1', side: OrderSideEnum.BUY });
      const sellOrder = createMockOrder({ id: 'sell-1', side: OrderSideEnum.SELL });

      orderManager.addArbTrade(buyOrder, sellOrder);

      const orders = orderManager.getOrders();
      expect(orders).toHaveLength(2);
      expect(orders.map(o => o.id)).toEqual(['buy-1', 'sell-1']);
    });

    it('should save orders after adding arb trade', () => {
      const buyOrder = createMockOrder({ id: 'buy-1' });
      const sellOrder = createMockOrder({ id: 'sell-1' });

      orderManager.addArbTrade(buyOrder, sellOrder);

      expect(mockFs.writeFileSync).toHaveBeenCalled();
      expect(mockFs.renameSync).toHaveBeenCalled();
    });

    it('should handle multiple arb trades', () => {
      orderManager.addArbTrade(
        createMockOrder({ id: 'buy-1', side: OrderSideEnum.BUY }),
        createMockOrder({ id: 'sell-1', side: OrderSideEnum.SELL })
      );
      orderManager.addArbTrade(
        createMockOrder({ id: 'buy-2', side: OrderSideEnum.BUY }),
        createMockOrder({ id: 'sell-2', side: OrderSideEnum.SELL })
      );

      const orders = orderManager.getOrders();
      expect(orders).toHaveLength(4);
    });
  });

  describe('error handling', () => {
    it('should handle file read errors gracefully', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Disk read error');
      });

      const om = new OrderManager();
      expect(om.getOrders()).toEqual([]);
    });

    it('should handle file write errors gracefully', () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Disk write error');
      });

      orderManager.addOrder(createMockOrder());
      // Should not throw, just log error
      expect(orderManager.getOrders()).toHaveLength(1);
    });

    it('should handle rename errors gracefully during corruption backup', () => {
      mockFs.readFileSync.mockReturnValue('corrupted');
      mockFs.renameSync.mockImplementation(() => {
        throw new Error('Backup failed');
      });

      const om = new OrderManager();
      expect(om.getOrders()).toEqual([]);
      // Should continue without backup
    });
  });

  describe('atomic write', () => {
    it('should use atomic write pattern (temp file + rename)', () => {
      const order = createMockOrder();
      orderManager.addOrder(order);

      // Verify temp file was written first
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining(order.id)
      );

      // Then renamed to final path
      expect(mockFs.renameSync).toHaveBeenCalledWith(
        expect.stringContaining('.tmp'),
        expect.stringContaining('orders.json')
      );
    });
  });
});
