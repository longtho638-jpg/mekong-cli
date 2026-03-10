import { Aggregator } from '../../../../src/arbitrage/phase6_ghost/ws-sharding/aggregator';
import { ShardMessage } from '../../../../src/arbitrage/phase6_ghost/types';

function makeMsg(overrides: Partial<ShardMessage> = {}): ShardMessage {
  return {
    shardId: 'shard-0',
    symbol: 'BTC/USDT',
    type: 'trade',
    data: { price: 50000, amount: 0.1, side: 'buy' },
    timestamp: Date.now(),
    sequence: 1,
    ...overrides,
  };
}

describe('Aggregator', () => {
  let agg: Aggregator;

  beforeEach(() => {
    agg = new Aggregator();
  });

  it('should process a trade message', () => {
    const result = agg.processMessage(makeMsg());
    expect(result).toBe(true);

    const feed = agg.getFeed('BTC/USDT');
    expect(feed).toBeDefined();
    expect(feed!.lastTrade).toEqual({ price: 50000, amount: 0.1, side: 'buy' });
  });

  it('should process an orderbook message', () => {
    agg.processMessage(makeMsg({
      type: 'orderbook',
      data: { bids: [[49999, 1]], asks: [[50001, 0.5]] },
    }));

    const feed = agg.getFeed('BTC/USDT');
    expect(feed!.orderbook!.bids).toEqual([[49999, 1]]);
    expect(feed!.orderbook!.asks).toEqual([[50001, 0.5]]);
  });

  it('should process a ticker message without error', () => {
    const result = agg.processMessage(makeMsg({ type: 'ticker', data: { last: 50000 } }));
    expect(result).toBe(true);
  });

  it('should deduplicate messages', () => {
    const msg = makeMsg({ sequence: 42 });
    expect(agg.processMessage(msg)).toBe(true);
    expect(agg.processMessage(msg)).toBe(false); // duplicate

    const stats = agg.getStats();
    expect(stats.processed).toBe(1);
    expect(stats.duplicates).toBe(1);
  });

  it('should detect out-of-order messages', () => {
    agg.processMessage(makeMsg({ sequence: 5 }));
    agg.processMessage(makeMsg({ sequence: 3 })); // out of order

    const stats = agg.getStats();
    expect(stats.outOfOrder).toBe(1);
    expect(stats.processed).toBe(2); // still processed
  });

  it('should handle multiple symbols', () => {
    agg.processMessage(makeMsg({ symbol: 'BTC/USDT', sequence: 1 }));
    agg.processMessage(makeMsg({ symbol: 'ETH/USDT', sequence: 1, data: { price: 3000, amount: 1, side: 'sell' } }));

    const feeds = agg.getAllFeeds();
    expect(feeds.length).toBe(2);
    expect(agg.getFeed('ETH/USDT')!.lastTrade!.price).toBe(3000);
  });

  it('should handle messages from multiple shards', () => {
    agg.processMessage(makeMsg({ shardId: 'shard-0', sequence: 1 }));
    agg.processMessage(makeMsg({ shardId: 'shard-1', sequence: 1 }));

    const stats = agg.getStats();
    expect(stats.processed).toBe(2);
    expect(stats.duplicates).toBe(0); // different shards = not duplicates
  });

  it('should evict old seen messages to prevent unbounded growth', () => {
    // Process many messages to trigger eviction
    for (let i = 0; i < 10010; i++) {
      agg.processMessage(makeMsg({ shardId: `shard-${i}`, sequence: i }));
    }
    const stats = agg.getStats();
    expect(stats.processed).toBe(10010);
  });

  it('should reset all state', () => {
    agg.processMessage(makeMsg());
    agg.reset();

    expect(agg.getAllFeeds().length).toBe(0);
    expect(agg.getStats().processed).toBe(0);
  });

  it('should return undefined for unknown symbol', () => {
    expect(agg.getFeed('UNKNOWN/USDT')).toBeUndefined();
  });

  it('should update lastUpdate timestamp', () => {
    const ts = 1700000000000;
    agg.processMessage(makeMsg({ timestamp: ts }));
    expect(agg.getFeed('BTC/USDT')!.lastUpdate).toBe(ts);
  });
});
