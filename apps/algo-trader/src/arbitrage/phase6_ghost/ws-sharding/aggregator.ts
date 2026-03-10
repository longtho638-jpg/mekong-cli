/**
 * Aggregator — reassembles sharded WebSocket feeds into
 * a unified orderbook/trade stream for the core engine.
 * Handles out-of-order messages and deduplication.
 */
import { ShardMessage, AggregatedFeed } from '../types';

export class Aggregator {
  private feeds: Map<string, AggregatedFeed> = new Map();
  private sequenceTracker: Map<string, number> = new Map();
  private seenMessages: Set<string> = new Set();
  private maxSeenSize = 10000;
  private processedCount = 0;
  private duplicateCount = 0;
  private outOfOrderCount = 0;

  /** Process an incoming shard message */
  processMessage(msg: ShardMessage): boolean {
    // Deduplicate using shardId + sequence
    const msgKey = `${msg.shardId}:${msg.symbol}:${msg.sequence}`;
    if (this.seenMessages.has(msgKey)) {
      this.duplicateCount++;
      return false;
    }

    this.seenMessages.add(msgKey);
    // Evict old entries to prevent unbounded growth
    if (this.seenMessages.size > this.maxSeenSize) {
      const first = this.seenMessages.values().next().value;
      if (first) this.seenMessages.delete(first);
    }

    // Track sequence ordering per symbol
    const seqKey = `${msg.shardId}:${msg.symbol}`;
    const lastSeq = this.sequenceTracker.get(seqKey) ?? -1;
    if (msg.sequence < lastSeq) {
      this.outOfOrderCount++;
      // Still process — just note it was out of order
    }
    this.sequenceTracker.set(seqKey, Math.max(lastSeq, msg.sequence));

    // Update aggregated feed
    const feed = this.getOrCreateFeed(msg.symbol);
    this.applyMessage(feed, msg);
    this.processedCount++;
    return true;
  }

  private getOrCreateFeed(symbol: string): AggregatedFeed {
    let feed = this.feeds.get(symbol);
    if (!feed) {
      feed = { symbol, lastUpdate: 0 };
      this.feeds.set(symbol, feed);
    }
    return feed;
  }

  private applyMessage(feed: AggregatedFeed, msg: ShardMessage): void {
    feed.lastUpdate = msg.timestamp;

    switch (msg.type) {
      case 'orderbook': {
        const data = msg.data as { bids: [number, number][]; asks: [number, number][] };
        feed.orderbook = data;
        break;
      }
      case 'trade': {
        const data = msg.data as { price: number; amount: number; side: 'buy' | 'sell' };
        feed.lastTrade = data;
        break;
      }
      case 'ticker':
        // Ticker updates can extend feed in future
        break;
    }
  }

  /** Get unified feed for a symbol */
  getFeed(symbol: string): AggregatedFeed | undefined {
    return this.feeds.get(symbol);
  }

  /** Get all feeds */
  getAllFeeds(): AggregatedFeed[] {
    return [...this.feeds.values()];
  }

  getStats(): { processed: number; duplicates: number; outOfOrder: number } {
    return {
      processed: this.processedCount,
      duplicates: this.duplicateCount,
      outOfOrder: this.outOfOrderCount,
    };
  }

  /** Reset all state */
  reset(): void {
    this.feeds.clear();
    this.sequenceTracker.clear();
    this.seenMessages.clear();
    this.processedCount = 0;
    this.duplicateCount = 0;
    this.outOfOrderCount = 0;
  }
}
