/**
 * Phase 6 Ghost Protocol — shared types & interfaces
 */

// ── Proxy Manager ──
export interface ProxyInfo {
  host: string;
  port: number;
  username?: string;
  password?: string;
  protocol: 'http' | 'https' | 'socks5';
  latencyMs?: number;
  alive: boolean;
}

export interface ProxyManagerConfig {
  provider: 'brightdata' | 'oxylabs' | 'mock';
  rotationRequests: number;
  rotationSec: number;
  pool: ProxyInfo[];
}

// ── Fingerprint Generator ──
export interface BrowserFingerprint {
  id: string;
  userAgent: string;
  acceptLanguage: string;
  platform: string;
  tlsVersion: string;
  ja3Hash: string;
  httpVersion: '1.1' | '2';
  headers: Record<string, string>;
}

// ── Jitter Injector ──
export interface JitterConfig {
  meanMs: number;
  stdMs: number;
  orderSizeJitterPct: number;
}

// ── HTTP Client Wrapper ──
export interface GhostRequestOptions {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface GhostResponse {
  status: number;
  headers: Record<string, string>;
  data: unknown;
  proxyUsed: string;
  fingerprintId: string;
  jitterAppliedMs: number;
}

// ── WebSocket Sharding ──
export interface ShardNode {
  id: string;
  endpoint: string;
  assignedSymbols: string[];
  connected: boolean;
  messageCount: number;
  lastHeartbeat: number;
}

export interface ShardMessage {
  shardId: string;
  symbol: string;
  type: 'orderbook' | 'trade' | 'ticker';
  data: unknown;
  timestamp: number;
  sequence: number;
}

export interface AggregatedFeed {
  symbol: string;
  orderbook?: { bids: [number, number][]; asks: [number, number][] };
  lastTrade?: { price: number; amount: number; side: 'buy' | 'sell' };
  lastUpdate: number;
}

// ── Chameleon RL ──
export type NoiseAction = 'cancel' | 'tinyOrder' | 'guiCheck' | 'doNothing';

export interface ChameleonState {
  detectionScore: number;
  recentActions: NoiseAction[];
  requestFrequency: number;
  patternRegularity: number;
}

export interface ChameleonConfig {
  rlModel: 'qlearning' | 'rulebased';
  noiseActions: NoiseAction[];
  detectionThreshold: number;
  noiseIntervalMs: number;
  learningRate: number;
  discountFactor: number;
  explorationRate: number;
}

// ── Phase 6 Top-Level Config ──
export interface Phase6Config {
  polymorphicMatrix: {
    enabled: boolean;
    proxyProvider: string;
    proxyRotationRequests: number;
    proxyRotationSec: number;
    jitterMeanMs: number;
    jitterStdMs: number;
    orderSizeJitterPct: number;
  };
  wsSharding: {
    enabled: boolean;
    numShards: number;
    edgeProvider: string;
    rebalanceIntervalSec: number;
  };
  chameleon: {
    enabled: boolean;
    rlModel: string;
    noiseActions: string[];
    detectionThreshold: number;
    noiseIntervalMs: number;
  };
}

export interface Phase6Status {
  polymorphicMatrix: { active: boolean; proxyPoolSize: number; requestCount: number };
  wsSharding: { active: boolean; shardCount: number; connectedShards: number };
  chameleon: { active: boolean; detectionScore: number; noiseActionsTriggered: number };
}
