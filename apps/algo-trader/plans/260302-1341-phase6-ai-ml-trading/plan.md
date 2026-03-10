# Phase 6: Advanced AI/ML Trading — Implementation Plan

**Date:** 2026-03-02 | **Status:** COMPLETE ✅
**Pre-req:** Phase 5.4 COMPLETE ✅ (905 tests, 0 TS errors)
**Result:** 934 tests, 0 TS errors

## Research Reports
- [ML Trading TypeScript Patterns](../reports/researcher-260302-1341-ml-trading-typescript-patterns.md)
- [RL Trading Agents Patterns](../reports/researcher-260302-1341-rl-trading-agents-patterns.md)

## Sub-phases

| Sub-phase | Description | Priority | Deps | Parallel? |
|-----------|-------------|----------|------|-----------|
| 6.1 | Feature engineering pipeline | P1 | None | ✅ |
| 6.2 | Tabular Q-learning RL strategy | P1 | 6.1 | ❌ needs features |
| 6.3 | GRU price prediction (tfjs-node) | P2 | 6.1 | ❌ needs features |

## Phase 6.1: Feature Engineering Pipeline

**Goal:** Extract normalized ML features from ICandle[] using existing Indicators class.

### New File: `src/ml/feature-engineering-pipeline.ts` (~150 lines)

```typescript
// FeatureVector: normalized features per candle for ML consumption
interface FeatureVector {
  rsiNorm: number;         // RSI / 100 → [0, 1]
  macdHistNorm: number;    // MACD histogram / ATR → [-1, 1] clamped
  bbWidth: number;         // (upper - lower) / middle
  bbPercentB: number;      // (close - lower) / (upper - lower)
  atrNorm: number;         // ATR / close → volatility ratio
  volumeRatio: number;     // volume / SMA(volume, 20) → [0, 3] clamped
  hlRange: number;         // (high - low) / close
}

class FeatureEngineeringPipeline {
  // Configure indicator periods
  constructor(config?: { rsiPeriod?: number; smaPeriod?: number; ... })

  // Extract features from candle array (requires min ~50 candles warmup)
  extract(candles: ICandle[]): FeatureVector[]

  // Extract single feature vector from last candle (for live inference)
  extractLast(candles: ICandle[]): FeatureVector | null

  // Convert FeatureVector to flat number array (for model input)
  static toArray(fv: FeatureVector): number[]

  // Create sliding window tensor: windowSize × numFeatures
  static toWindow(features: FeatureVector[], windowSize: number): number[][]
}
```

Uses existing `Indicators.rsi()`, `Indicators.sma()`, `Indicators.macd()`, `Indicators.bbands()`.

### Test: `tests/ml/feature-engineering-pipeline.test.ts` (~60 lines)

## Phase 6.2: Tabular Q-Learning RL Strategy

**Goal:** Zero-dependency RL agent using discretized state + Q-table.

### State Design (5 discrete features → ~3000 states)
- RSI bucket: oversold(0-30)/neutral(30-70)/overbought(70-100) → 3
- Trend: down(SMAfast<SMAslow)/flat/up → 3
- Volatility: low(ATR<1%)/med/high(ATR>3%) → 3
- Position: none/long → 2
- Bars held: 0/1-5/6+ → 3 (only when in position)
→ Total: 3×3×3×2×3 = 162 states (very tractable)

### Action Space: BUY(0) / HOLD(1) / SELL(2)

### Reward: Differential Sharpe (running mean/std of returns)

### New Files

**`src/ml/tabular-q-learning-rl-strategy.ts`** (~180 lines)
- `QTable` — Map<string, number[]> (stateKey → [Q_buy, Q_hold, Q_sell])
- `QLearningStrategy extends BaseStrategy implements IStrategy`
  - `init()` → load Q-table from JSON if exists
  - `onCandle()` → extract state → epsilon-greedy → signal
  - `train(candles, episodes)` → simulate episodes, update Q-table
  - `save(path)` / `load(path)` → serialize Q-table

**`src/ml/tabular-q-learning-trainer.ts`** (~100 lines)
- Training loop: episode = full candle history pass
- State transitions via FeatureEngineeringPipeline
- Reward = differential Sharpe ratio

**`tests/ml/tabular-q-learning-rl-strategy.test.ts`** (~80 lines)

## Phase 6.3: GRU Price Prediction (COMPLETE ✅)

**Goal:** TensorFlow.js GRU model for price direction prediction.

### Architecture
- Input: [windowSize, 7] sliding window of normalized features
- GRU(64) → Dropout(0.2) → Dense(32) → Dense(1, sigmoid)
- Output: probability of price going up → threshold 0.55 BUY, <0.45 SELL

### Dep: `@tensorflow/tfjs` (pure JS CPU backend — M1 compatible)

### Files
- `src/ml/gru-price-prediction-model.ts` — build/train/predict/save ✅
- `src/ml/gru-prediction-strategy.ts` — IStrategy wrapper ✅
- `tests/ml/gru-price-prediction-model.test.ts` — 12 tests ✅

## Success Criteria
- [x] Feature pipeline: extract 7 features from any ICandle[]
- [x] Q-learning: train → save → load → backtest integration
- [x] Tests for all new modules (41 ML tests)
- [x] 0 TS errors, total tests 946

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Q-table state explosion | Memory | Discretized to 162 states |
| Overfitting to historical data | Loss | WalkForwardOptimizerPipeline validation |
| tfjs-node M1 compatibility | Build fail | Used @tensorflow/tfjs pure JS backend ✅ |
