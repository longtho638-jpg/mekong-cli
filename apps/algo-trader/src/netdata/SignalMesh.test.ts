import { SignalMesh as MarketEventBus } from './SignalMesh';
import { MarketEventType, TickEvent } from '../interfaces/IMarketEvent';

describe('MarketEventBus', () => {
  let bus: MarketEventBus;

  beforeEach(() => {
    bus = MarketEventBus.getInstance();
    bus.reset();
  });

  it('should emit and receive events globally', (done) => {
    const event: TickEvent = {
      type: MarketEventType.TICK,
      tenantId: 'tenant-1',
      symbol: 'BTC/USDT',
      price: 50000,
      volume: 1.5,
      timestamp: Date.now(),
      source: 'binance',
    };

    bus.onAny((received) => {
      expect(received).toEqual(event);
      done();
    });

    bus.emit(event);
  });

  it('should route events to specific tenants', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    bus.onTenant('tenant-1', handler1);
    bus.onTenant('tenant-2', handler2);

    const event1: TickEvent = {
      type: MarketEventType.TICK,
      tenantId: 'tenant-1',
      symbol: 'BTC/USDT',
      price: 50000,
      volume: 1,
      timestamp: Date.now(),
      source: 'binance',
    };

    bus.emit(event1);

    expect(handler1).toHaveBeenCalledWith(event1);
    expect(handler2).not.toHaveBeenCalled();
  });

  it('should route events by type and tenant', () => {
    const handler = jest.fn();
    bus.onType(MarketEventType.TICK, 'tenant-1', handler);

    const event: TickEvent = {
      type: MarketEventType.TICK,
      tenantId: 'tenant-1',
      symbol: 'BTC/USDT',
      price: 50000,
      volume: 1,
      timestamp: Date.now(),
      source: 'binance',
    };

    bus.emit(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should provide metrics', () => {
    bus.onTenant('tenant-1', () => {});
    bus.onTenant('tenant-2', () => {});

    bus.emit({
      type: MarketEventType.TICK,
      tenantId: 'tenant-1',
      symbol: 'BTC/USDT',
      price: 50000,
      volume: 1,
      timestamp: Date.now(),
      source: 'binance',
    } as TickEvent);

    const metrics = bus.getMetrics();
    expect(metrics.totalEvents).toBe(1);
    expect(metrics.activeTenants).toBe(2);
  });

  it('should handle unsubscribe', () => {
    const handler = jest.fn();
    const unsub = bus.onTenant('tenant-1', handler);

    unsub();

    bus.emit({
      type: MarketEventType.TICK,
      tenantId: 'tenant-1',
      symbol: 'BTC/USDT',
      price: 50000,
      volume: 1,
      timestamp: Date.now(),
      source: 'binance',
    } as TickEvent);

    expect(handler).not.toHaveBeenCalled();
  });
});
