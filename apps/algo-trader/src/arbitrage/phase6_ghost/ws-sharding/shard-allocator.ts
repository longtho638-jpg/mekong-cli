/**
 * Shard Allocator — distributes symbols across edge nodes
 * and rebalances when nodes go down or new ones are added.
 */
import { ShardNode } from '../types';

export class ShardAllocator {
  private shards: Map<string, ShardNode> = new Map();
  private allSymbols: string[] = [];

  constructor(numShards: number, symbols: string[]) {
    this.allSymbols = [...symbols];
    for (let i = 0; i < numShards; i++) {
      const id = `shard-${i}`;
      this.shards.set(id, {
        id,
        endpoint: `ws://edge-${i}.local:8080`,
        assignedSymbols: [],
        connected: false,
        messageCount: 0,
        lastHeartbeat: Date.now(),
      });
    }
    this.rebalance();
  }

  /** Distribute symbols evenly across connected (or all) shards */
  rebalance(): void {
    const activeShards = this.getActiveShards();
    const targets = activeShards.length > 0 ? activeShards : [...this.shards.values()];

    // Clear existing assignments
    for (const shard of this.shards.values()) {
      shard.assignedSymbols = [];
    }

    // Round-robin assign symbols
    this.allSymbols.forEach((symbol, i) => {
      const shard = targets[i % targets.length];
      shard.assignedSymbols.push(symbol);
    });
  }

  /** Mark a shard as connected */
  connectShard(shardId: string): boolean {
    const shard = this.shards.get(shardId);
    if (!shard) return false;
    shard.connected = true;
    shard.lastHeartbeat = Date.now();
    return true;
  }

  /** Mark a shard as disconnected and rebalance */
  disconnectShard(shardId: string): boolean {
    const shard = this.shards.get(shardId);
    if (!shard) return false;
    shard.connected = false;
    this.rebalance();
    return true;
  }

  /** Add a new shard and rebalance */
  addShard(endpoint: string): ShardNode {
    const id = `shard-${this.shards.size}`;
    const node: ShardNode = {
      id,
      endpoint,
      assignedSymbols: [],
      connected: false,
      messageCount: 0,
      lastHeartbeat: Date.now(),
    };
    this.shards.set(id, node);
    this.rebalance();
    return node;
  }

  /** Remove a shard and rebalance */
  removeShard(shardId: string): boolean {
    const removed = this.shards.delete(shardId);
    if (removed) this.rebalance();
    return removed;
  }

  /** Record heartbeat from a shard */
  heartbeat(shardId: string): void {
    const shard = this.shards.get(shardId);
    if (shard) {
      shard.lastHeartbeat = Date.now();
      shard.messageCount++;
    }
  }

  getActiveShards(): ShardNode[] {
    return [...this.shards.values()].filter((s) => s.connected);
  }

  getAllShards(): ShardNode[] {
    return [...this.shards.values()];
  }

  getShardForSymbol(symbol: string): ShardNode | undefined {
    return [...this.shards.values()].find((s) =>
      s.assignedSymbols.includes(symbol),
    );
  }

  getShardCount(): number {
    return this.shards.size;
  }
}
