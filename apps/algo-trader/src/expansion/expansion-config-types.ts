/**
 * Shared types and default config for the expansion module.
 * All external integrations are simulated — no real blockchain/hardware deps.
 */

export interface AssetUniverseConfig {
  enabled: boolean;
  minVolume24h: number;
  volatilityBounds: [number, number]; // [min, max] as decimal
  sharpeThreshold: number;
  updateIntervalMs: number;
}

export interface CrossChainRwaConfig {
  enabled: boolean;
  chains: string[];
  minArbProfitBps: number;
  rwaAssets: string[];
}

export interface HardwareAccelerationConfig {
  enabled: boolean;
  fpgaEnabled: boolean;
  ebpfEnabled: boolean;
}

export interface DaoGovernanceConfig {
  enabled: boolean;
  tokenSymbol: string;
  treasuryAddress: string;
  quorumPercent: number;
}

export interface GeneticPromotionConfig {
  enabled: boolean;
  sharpeThreshold: number;
  monitoringWindowMs: number;
  maxLiveCandidates: number;
}

export interface ExpansionConfig {
  assetUniverse: AssetUniverseConfig;
  crossChainRWA: CrossChainRwaConfig;
  hardwareAcceleration: HardwareAccelerationConfig;
  daoGovernance: DaoGovernanceConfig;
  geneticPromotion: GeneticPromotionConfig;
}

export const DEFAULT_EXPANSION_CONFIG: ExpansionConfig = {
  assetUniverse: {
    enabled: false,
    minVolume24h: 1_000_000,
    volatilityBounds: [0.01, 0.15],
    sharpeThreshold: 1.0,
    updateIntervalMs: 60_000,
  },
  crossChainRWA: {
    enabled: false,
    chains: ['ethereum', 'solana', 'bsc'],
    minArbProfitBps: 20,
    rwaAssets: ['TSLA', 'AAPL', 'GOLD'],
  },
  hardwareAcceleration: {
    enabled: false,
    fpgaEnabled: false,
    ebpfEnabled: false,
  },
  daoGovernance: {
    enabled: false,
    tokenSymbol: 'ALGO',
    treasuryAddress: '0x0000000000000000000000000000000000000000',
    quorumPercent: 10,
  },
  geneticPromotion: {
    enabled: false,
    sharpeThreshold: 1.5,
    monitoringWindowMs: 86_400_000,
    maxLiveCandidates: 5,
  },
};

export interface SymbolInfo {
  symbol: string;
  volume24h: number;
  volatility: number;
}

export interface BacktestResult {
  symbol: string;
  sharpe: number;
  totalReturn: number;
}

export interface ChainStatus {
  chain: string;
  connected: boolean;
  latencyMs: number;
}

export interface RwaPrice {
  asset: string;
  price: number;
  timestamp: number;
}

export interface ArbPath {
  fromChain: string;
  toChain: string;
  asset: string;
  profitBps: number;
}

export interface ComplianceResult {
  asset: string;
  allowed: boolean;
  reason: string;
}

export interface ProposalAction {
  id: string;
  type: string;
  params: Record<string, unknown>;
  passed: boolean;
}

export interface StrategyPerformance {
  id: string;
  sharpe: number;
  totalPnl: number;
  trades: number;
}
