import { ShardAllocator } from '../../../../src/arbitrage/phase6_ghost/ws-sharding/shard-allocator';

describe('ShardAllocator', () => {
  const symbols = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT'];

  it('should create shards and assign symbols', () => {
    const alloc = new ShardAllocator(3, symbols);
    expect(alloc.getShardCount()).toBe(3);

    // All symbols should be assigned
    const assigned = alloc.getAllShards().flatMap((s) => s.assignedSymbols);
    expect(assigned.sort()).toEqual(symbols.sort());
  });

  it('should distribute symbols evenly (round-robin)', () => {
    const alloc = new ShardAllocator(2, symbols);
    const shards = alloc.getAllShards();
    // 4 symbols / 2 shards = 2 each
    expect(shards[0].assignedSymbols.length).toBe(2);
    expect(shards[1].assignedSymbols.length).toBe(2);
  });

  it('should connect and disconnect shards', () => {
    const alloc = new ShardAllocator(3, symbols);
    expect(alloc.getActiveShards().length).toBe(0);

    alloc.connectShard('shard-0');
    alloc.connectShard('shard-1');
    expect(alloc.getActiveShards().length).toBe(2);

    alloc.disconnectShard('shard-0');
    expect(alloc.getActiveShards().length).toBe(1);
  });

  it('should return false for unknown shard operations', () => {
    const alloc = new ShardAllocator(2, symbols);
    expect(alloc.connectShard('nonexistent')).toBe(false);
    expect(alloc.disconnectShard('nonexistent')).toBe(false);
  });

  it('should rebalance after disconnect', () => {
    const alloc = new ShardAllocator(3, symbols);
    alloc.connectShard('shard-0');
    alloc.connectShard('shard-1');
    alloc.connectShard('shard-2');

    alloc.disconnectShard('shard-1'); // triggers rebalance
    // Symbols should be redistributed across connected shards
    const activeSymbols = alloc.getActiveShards().flatMap((s) => s.assignedSymbols);
    expect(activeSymbols.sort()).toEqual(symbols.sort());
  });

  it('should add new shard and rebalance', () => {
    const alloc = new ShardAllocator(2, symbols);
    expect(alloc.getShardCount()).toBe(2);

    const newShard = alloc.addShard('ws://new-edge:8080');
    expect(alloc.getShardCount()).toBe(3);
    expect(newShard.id).toBe('shard-2');

    const assigned = alloc.getAllShards().flatMap((s) => s.assignedSymbols);
    expect(assigned.sort()).toEqual(symbols.sort());
  });

  it('should remove shard and rebalance', () => {
    const alloc = new ShardAllocator(3, symbols);
    expect(alloc.removeShard('shard-2')).toBe(true);
    expect(alloc.getShardCount()).toBe(2);

    const assigned = alloc.getAllShards().flatMap((s) => s.assignedSymbols);
    expect(assigned.sort()).toEqual(symbols.sort());
  });

  it('should return false when removing non-existent shard', () => {
    const alloc = new ShardAllocator(2, symbols);
    expect(alloc.removeShard('ghost-shard')).toBe(false);
  });

  it('should record heartbeat', () => {
    const alloc = new ShardAllocator(2, symbols);
    const before = alloc.getAllShards()[0].messageCount;
    alloc.heartbeat('shard-0');
    alloc.heartbeat('shard-0');
    expect(alloc.getAllShards()[0].messageCount).toBe(before + 2);
  });

  it('should ignore heartbeat for unknown shard', () => {
    const alloc = new ShardAllocator(2, symbols);
    // Should not throw
    alloc.heartbeat('unknown');
  });

  it('should find shard for a symbol', () => {
    const alloc = new ShardAllocator(2, symbols);
    const shard = alloc.getShardForSymbol('BTC/USDT');
    expect(shard).toBeDefined();
    expect(shard!.assignedSymbols).toContain('BTC/USDT');
  });

  it('should return undefined for unassigned symbol', () => {
    const alloc = new ShardAllocator(2, symbols);
    expect(alloc.getShardForSymbol('XRP/USDT')).toBeUndefined();
  });
});
