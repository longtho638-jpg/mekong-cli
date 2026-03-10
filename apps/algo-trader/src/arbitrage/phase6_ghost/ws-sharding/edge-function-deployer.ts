/**
 * Edge Function Deployer (simulated) — represents Cloudflare Worker
 * edge nodes that maintain WebSocket connections to exchanges.
 * For testing, simulates local WebSocket connections.
 */
import { ShardNode, ShardMessage } from '../types';

export interface EdgeConnection {
  shardId: string;
  connected: boolean;
  messageCallback?: (msg: ShardMessage) => void;
}

export class EdgeFunctionDeployer {
  private connections: Map<string, EdgeConnection> = new Map();
  private sequenceCounters: Map<string, number> = new Map();

  /** Deploy (simulate) an edge connection for a shard */
  deploy(shard: ShardNode): EdgeConnection {
    const conn: EdgeConnection = {
      shardId: shard.id,
      connected: true,
    };
    this.connections.set(shard.id, conn);
    this.sequenceCounters.set(shard.id, 0);
    return conn;
  }

  /** Undeploy an edge connection */
  undeploy(shardId: string): boolean {
    const conn = this.connections.get(shardId);
    if (!conn) return false;
    conn.connected = false;
    this.connections.delete(shardId);
    return true;
  }

  /** Register a message callback for a shard */
  onMessage(shardId: string, callback: (msg: ShardMessage) => void): boolean {
    const conn = this.connections.get(shardId);
    if (!conn) return false;
    conn.messageCallback = callback;
    return true;
  }

  /** Simulate receiving a message from an exchange via edge node */
  simulateMessage(shardId: string, symbol: string, type: ShardMessage['type'], data: unknown): boolean {
    const conn = this.connections.get(shardId);
    if (!conn || !conn.connected || !conn.messageCallback) return false;

    const seq = (this.sequenceCounters.get(shardId) ?? 0) + 1;
    this.sequenceCounters.set(shardId, seq);

    const msg: ShardMessage = {
      shardId,
      symbol,
      type,
      data,
      timestamp: Date.now(),
      sequence: seq,
    };

    conn.messageCallback(msg);
    return true;
  }

  isConnected(shardId: string): boolean {
    return this.connections.get(shardId)?.connected ?? false;
  }

  getDeployedCount(): number {
    return this.connections.size;
  }
}
