/**
 * strategy-detection-rules-builtin — Built-in strategy type detectors ranked by priority.
 * Explicit type override, indicator heuristics, and name heuristics.
 * Extracted from StrategyAutoDetector for isolated rule management and testability.
 */

import { StrategyDetector, StrategyConfig, DetectionResult, StrategyType } from './strategy-auto-detector-types';

const explicitTypeDetector: StrategyDetector = {
  name: 'explicit-type',
  priority: 100,
  detect: (config: StrategyConfig): DetectionResult | null => {
    if (!config.type) return null;
    const typeMap: Record<string, StrategyType> = {
      trend: 'trend',
      momentum: 'momentum',
      arbitrage: 'arbitrage',
      'mean-reversion': 'mean-reversion',
      composite: 'composite',
      arb: 'arbitrage',
      'stat-arb': 'mean-reversion',
    };
    const mapped = typeMap[config.type.toLowerCase()];
    return mapped
      ? { type: mapped, confidence: 1.0, provider: 'explicit-type', markers: [`type=${config.type}`] }
      : null;
  },
};

const indicatorHeuristicDetector: StrategyDetector = {
  name: 'indicator-heuristic',
  priority: 50,
  detect: (config: StrategyConfig): DetectionResult | null => {
    if (!config.indicators || config.indicators.length === 0) return null;
    const ind = config.indicators.map(i => i.toLowerCase());

    if (ind.includes('hurst') || (config.exchanges && config.exchanges.length > 1)) {
      return { type: 'arbitrage', confidence: 0.8, provider: 'indicator-heuristic', markers: ind };
    }
    if (ind.includes('zscore') || ind.includes('correlation')) {
      return { type: 'mean-reversion', confidence: 0.8, provider: 'indicator-heuristic', markers: ind };
    }
    if (ind.includes('rsi') && ind.includes('macd')) {
      return { type: 'composite', confidence: 0.7, provider: 'indicator-heuristic', markers: ind };
    }
    if (ind.includes('sma') || ind.includes('ema') || ind.includes('macd')) {
      return { type: 'trend', confidence: 0.7, provider: 'indicator-heuristic', markers: ind };
    }
    if (ind.includes('rsi') || ind.includes('stochastic')) {
      return { type: 'momentum', confidence: 0.7, provider: 'indicator-heuristic', markers: ind };
    }
    return null;
  },
};

const nameHeuristicDetector: StrategyDetector = {
  name: 'name-heuristic',
  priority: 30,
  detect: (config: StrategyConfig): DetectionResult | null => {
    if (!config.name) return null;
    const name = config.name.toLowerCase();
    if (name.includes('arb') || name.includes('spread')) {
      return { type: 'arbitrage', confidence: 0.6, provider: 'name-heuristic', markers: [config.name] };
    }
    if (name.includes('trend') || name.includes('sma')) {
      return { type: 'trend', confidence: 0.6, provider: 'name-heuristic', markers: [config.name] };
    }
    if (name.includes('rsi') || name.includes('momentum')) {
      return { type: 'momentum', confidence: 0.6, provider: 'name-heuristic', markers: [config.name] };
    }
    if (name.includes('mean') || name.includes('revert') || name.includes('stat')) {
      return { type: 'mean-reversion', confidence: 0.6, provider: 'name-heuristic', markers: [config.name] };
    }
    return null;
  },
};

export const BUILT_IN_DETECTORS: StrategyDetector[] = [
  explicitTypeDetector,
  indicatorHeuristicDetector,
  nameHeuristicDetector,
];
