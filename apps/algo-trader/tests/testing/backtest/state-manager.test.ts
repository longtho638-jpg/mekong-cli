import { StateManager, Order } from '../../../src/testing/backtest/state-manager';

function makeOrder(overrides: Partial<Order> = {}): Omit<Order, 'id'> {
  return {
    asset: 'BTC',
    side: 'buy',
    price: 50000,
    quantity: 0.1,
    exchange: 'binance',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('StateManager', () => {
  it('initializes with correct cash', () => {
    const sm = new StateManager(100000);
    expect(sm.getState().cash).toBe(100000);
  });

  it('initializes with empty positions', () => {
    const sm = new StateManager(100000);
    expect(sm.getState().positions.size).toBe(0);
  });

  it('openOrder assigns an id', () => {
    const sm = new StateManager(100000);
    const order = sm.openOrder(makeOrder());
    expect(order.id).toBeDefined();
    expect(typeof order.id).toBe('string');
  });

  it('openOrder appears in openOrders list', () => {
    const sm = new StateManager(100000);
    const order = sm.openOrder(makeOrder());
    expect(sm.getState().openOrders).toContainEqual(order);
  });

  it('cancelOrder removes order', () => {
    const sm = new StateManager(100000);
    const order = sm.openOrder(makeOrder());
    const removed = sm.cancelOrder(order.id);
    expect(removed).toBe(true);
    expect(sm.getState().openOrders.length).toBe(0);
  });

  it('cancelOrder returns false for unknown id', () => {
    const sm = new StateManager(100000);
    expect(sm.cancelOrder('nonexistent')).toBe(false);
  });

  it('executeFill buy reduces cash and creates position', () => {
    const sm = new StateManager(100000);
    const order = sm.openOrder(makeOrder({ side: 'buy', price: 50000, quantity: 0.1 }));
    sm.executeFill(order, 50000, 5);
    const state = sm.getState();
    expect(state.cash).toBeLessThan(100000);
    expect(state.positions.size).toBe(1);
  });

  it('executeFill sell increases cash', () => {
    const sm = new StateManager(100000);
    const buy = sm.openOrder(makeOrder({ side: 'buy', price: 50000, quantity: 0.1 }));
    sm.executeFill(buy, 50000, 0);
    const cashAfterBuy = sm.getState().cash;
    const sell = sm.openOrder(makeOrder({ side: 'sell', price: 51000, quantity: 0.1 }));
    sm.executeFill(sell, 51000, 0);
    expect(sm.getState().cash).toBeGreaterThan(cashAfterBuy);
  });

  it('recordEquityPoint adds to equity curve', () => {
    const sm = new StateManager(100000);
    sm.recordEquityPoint(Date.now(), new Map());
    expect(sm.getEquityCurve().length).toBe(1);
  });

  it('getTotalEquity with no positions equals cash', () => {
    const sm = new StateManager(50000);
    expect(sm.getTotalEquity(new Map())).toBe(50000);
  });

  it('tracks multiple positions independently', () => {
    const sm = new StateManager(1000000);
    const o1 = sm.openOrder(makeOrder({ asset: 'BTC', exchange: 'binance', quantity: 0.1 }));
    const o2 = sm.openOrder(makeOrder({ asset: 'ETH', exchange: 'bybit', quantity: 1.0 }));
    sm.executeFill(o1, 50000, 0);
    sm.executeFill(o2, 3000, 0);
    expect(sm.getState().positions.size).toBe(2);
  });
});
