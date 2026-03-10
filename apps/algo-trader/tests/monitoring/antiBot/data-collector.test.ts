/**
 * Tests for DataCollector and CircularBuffer
 */

import { CircularBuffer, DataCollector } from '../../../src/monitoring/antiBot/data-collector';
import { ExchangeEvent } from '../../../src/monitoring/antiBot/antibot-config-types';

describe('CircularBuffer', () => {
  it('should store and retrieve items', () => {
    const buf = new CircularBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.getAll()).toEqual([1, 2, 3]);
    expect(buf.size()).toBe(3);
  });

  it('should overwrite oldest items when full', () => {
    const buf = new CircularBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4);
    expect(buf.getAll()).toEqual([2, 3, 4]);
    expect(buf.size()).toBe(3);
  });

  it('should handle wrapping correctly', () => {
    const buf = new CircularBuffer<number>(3);
    for (let i = 1; i <= 7; i++) buf.push(i);
    expect(buf.getAll()).toEqual([5, 6, 7]);
  });

  it('should filter by time window via getRecent', () => {
    const buf = new CircularBuffer<{ timestamp: number; v: number }>(10);
    const now = Date.now();
    buf.push({ timestamp: now - 5000, v: 1 });
    buf.push({ timestamp: now - 3000, v: 2 });
    buf.push({ timestamp: now - 1000, v: 3 });

    const recent = buf.getRecent(2000, now);
    expect(recent).toHaveLength(1);
    expect(recent[0].v).toBe(3);
  });

  it('should clear all items', () => {
    const buf = new CircularBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    buf.clear();
    expect(buf.size()).toBe(0);
    expect(buf.getAll()).toEqual([]);
  });
});

describe('DataCollector', () => {
  let collector: DataCollector;

  beforeEach(() => {
    collector = new DataCollector(['binance', 'bybit'], 100);
  });

  const makeEvent = (
    exchange: string,
    overrides: Partial<ExchangeEvent> = {}
  ): Omit<ExchangeEvent, 'id'> => ({
    exchange,
    timestamp: Date.now(),
    type: 'http_response',
    statusCode: 200,
    responseTimeMs: 50,
    ...overrides,
  });

  it('should record events and assign IDs', () => {
    const evt = collector.record(makeEvent('binance'));
    expect(evt.id).toBe('evt_1');
    const evt2 = collector.record(makeEvent('binance'));
    expect(evt2.id).toBe('evt_2');
  });

  it('should store events per exchange', () => {
    collector.record(makeEvent('binance'));
    collector.record(makeEvent('binance'));
    collector.record(makeEvent('bybit'));

    expect(collector.getAllEvents('binance')).toHaveLength(2);
    expect(collector.getAllEvents('bybit')).toHaveLength(1);
  });

  it('should return empty for unknown exchange', () => {
    expect(collector.getAllEvents('okx')).toEqual([]);
  });

  it('should auto-create buffer for new exchange', () => {
    collector.record(makeEvent('okx'));
    expect(collector.getAllEvents('okx')).toHaveLength(1);
  });

  it('should emit events on record', () => {
    const received: ExchangeEvent[] = [];
    collector.on('event', (evt) => received.push(evt));

    collector.record(makeEvent('binance'));
    collector.record(makeEvent('bybit'));

    expect(received).toHaveLength(2);
  });

  it('should filter recent events by time window', () => {
    const now = Date.now();
    collector.record(makeEvent('binance', { timestamp: now - 5000 }));
    collector.record(makeEvent('binance', { timestamp: now - 1000 }));
    collector.record(makeEvent('binance', { timestamp: now }));

    const recent = collector.getRecentEvents('binance', 2000);
    expect(recent).toHaveLength(2);
  });

  it('should return event counts', () => {
    collector.record(makeEvent('binance'));
    collector.record(makeEvent('binance'));
    collector.record(makeEvent('bybit'));

    const counts = collector.getEventCounts();
    expect(counts.binance).toBe(2);
    expect(counts.bybit).toBe(1);
  });

  it('should list exchanges', () => {
    expect(collector.getExchanges()).toEqual(
      expect.arrayContaining(['binance', 'bybit'])
    );
  });

  it('should clear all data', () => {
    collector.record(makeEvent('binance'));
    collector.record(makeEvent('bybit'));
    collector.clear();

    expect(collector.getAllEvents('binance')).toHaveLength(0);
    expect(collector.getAllEvents('bybit')).toHaveLength(0);
  });
});
