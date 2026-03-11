// AGI Integration Types

import { SOPDecision } from '../engine/sop.types';

export interface AGIIntegrationConfig {
  enabled: boolean;
  ollamaBaseUrl: string;
  model: string;
  timeoutMs: number;
  fallbackToRules: boolean;
  minConfidence: number;
}

export interface AGIEnhancedSignal {
  originalSignal: {
    type: 'BUY' | 'SELL' | 'HOLD';
    symbol: string;
    timestamp: number;
    indicators?: Record<string, number>;
  };
  agiDecision?: SOPDecision;
  agiEnhanced: boolean;
  usedFallback: boolean;
  confidence: number;
  combinedAction: 'BUY' | 'SELL' | 'HOLD';
}

export interface AGIMetrics {
  totalSignals: number;
  agiEnhancedSignals: number;
  fallbackSignals: number;
  avgConfidence: number;
  avgLatencyMs: number;
}
