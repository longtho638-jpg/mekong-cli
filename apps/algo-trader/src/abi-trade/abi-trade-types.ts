/**
 * AbiTrade Types and Interfaces
 * Type definitions for deep scanner module
 */

import { IArbitrageOpportunity } from '../interfaces/IArbitrageOpportunity';

export interface AbiTradeScanConfig {
  exchanges: string[];
  symbols: string[];
  pollIntervalMs: number;
  minNetProfitPercent: number;
  positionSizeUsd: number;
  maxSlippagePercent: number;
  opportunityTtlMs: number;
  deepScanEnabled: boolean;
  correlationThreshold: number;
  latencyBufferMs: number;
  maxConcurrentScans: number;
  enableHistoricalAnalysis: boolean;
  enableLatencyOptimization: boolean;
  maxDepthLevels: number;
  volumeThreshold: number;
  volatilityWindow: number;
}

export interface DeepScanResult {
  opportunities: IArbitrageOpportunity[];
  correlations: MarketCorrelation[];
  latencyMetrics: LatencyMetrics[];
  riskFactors: RiskFactor[];
  scanDurationMs: number;
  confidenceScore: number;
}

export interface MarketCorrelation {
  symbol: string;
  exchanges: string[];
  correlationCoefficient: number;
  priceDelta: number;
  volumeDelta: number;
  timestamp: number;
}

export interface LatencyMetrics {
  exchange: string;
  symbol: string;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  timestamp: number;
}

export interface RiskFactor {
  type: 'volatility' | 'liquidity' | 'volume' | 'latency' | 'correlation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  description: string;
}
