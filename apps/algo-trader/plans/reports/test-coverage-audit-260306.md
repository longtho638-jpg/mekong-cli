# Test Coverage Audit - Trading Signal & Risk Management

**Date:** 2026-03-06
**Scope:** Trading signal generation, risk management, strategy execution modules
**Target:** Identify missing unit tests

---

## Executive Summary

| Category | Files | Tested | Coverage |
|----------|-------|--------|----------|
| **Signal Generation** | 3 | 2 | 67% |
| **Risk Management** | 5 | 3 | 60% |
| **Strategy Core** | 4 | 3 | 75% |
| **Order/Position** | 3 | 2 | 67% |
| **TOTAL** | 15 | 10 | **67%** |

---

## 1. Signal Generation Modules

### ✅ Tested

| File | Test File | Status |
|------|-----------|--------|
| `src/core/SignalGenerator.ts` (106 lines) | `tests/core/SignalGenerator.test.ts` | ✅ 225 lines, comprehensive |
| `src/core/signal-filter-types.ts` | N/A (types only) | ✅ Types don't need tests |
| `src/core/signal-filter-math-helpers.ts` | N/A | ✅ Math helpers covered via SignalFilter |

### ❌ Missing Tests

| File | Purpose | Priority |
|------|---------|----------|
| `src/core/SignalFilter.ts` (117 lines) | Pre-trade signal quality filter, regime detection, scoring | **HIGH** |
| `src/core/signal-market-regime-detector.ts` | Market regime detection (trending/ranging/volatile) | **HIGH** |
| `src/core/StrategyEnsemble.ts` (70 lines) | Multi-strategy consensus voter | **MEDIUM** |

**SignalFilter.ts Analysis:**
- Complex logic: `scoreSignal()` with 4 scoring components
- Regime-aware filtering
- Cooldown tracking
- Volume confirmation
- **Recommendation:** Write 15-20 test cases covering:
  - Regime detection scenarios
  - Score calculation edge cases
  - Cooldown active/inactive
  - Volume threshold filtering
  - Reject reason categorization

---

## 2. Risk Management Modules

### ✅ Tested

| File | Test File | Status |
|------|-----------|--------|
| `src/core/RiskManager.ts` (369 lines) | `tests/core/RiskManager.test.ts` | ✅ 106 lines |
| `src/core/RiskManager.ts` | `tests/core/enhanced-risk-manager.test.ts` | ✅ Additional tests |
| `src/core/circuit-breakers.ts` | `tests/core/circuit-breakers.test.ts` | ✅ |
| `src/core/trailing-stop-position-tracker.test.ts` | `tests/core/trailing-stop-position-tracker.test.ts` | ✅ |

### ❌ Missing Tests

| File | Purpose | Priority |
|------|---------|----------|
| `src/core/PortfolioRiskManager.ts` | Portfolio-level risk management | **HIGH** |
| `src/core/VaRCalculator.ts` | Value-at-Risk calculation | **HIGH** |
| `src/core/CorrelationCalculator.ts` | Asset correlation matrix | **MEDIUM** |
| `src/core/portfolio-correlation-matrix-calculator.ts` | Correlation matrix calculator | ✅ Has `tests/core/portfolio-correlation-matrix-calculator.test.ts` |
| `src/core/historical-var-calculator.ts` | Historical VaR | ✅ Has `tests/core/historical-var-calculator.test.ts` |
| `src/core/portfolio-var-kelly-calculator.ts` | Portfolio VaR + Kelly sizing | **MEDIUM** |
| `src/core/alert-rules-engine.ts` | Alert rule evaluation | ✅ Has `tests/core/alert-rules-engine.test.ts` |

**RiskManager.ts Coverage Review:**
Current tests cover:
- ✅ `calculatePositionSize()` - 6 tests
- ✅ `initTrailingStop()` - 2 tests
- ✅ `updateTrailingStop()` - 5 tests

Missing test coverage:
- ❌ `calculateDynamicPositionSize()` - ATR-based sizing
- ❌ `calculateAtrStopLoss()` - ATR-based stop calculation
- ❌ `checkDrawdownLimit()` - Drawdown monitoring
- ❌ `calculateRiskAdjustedMetrics()` - Sharpe/Sortino/Calmar
- ❌ `calculateDynamicRiskParams()` - Market regime adjustments

---

## 3. Strategy Core Modules

### ✅ Tested

| File | Test File | Status |
|------|-----------|--------|
| `src/strategies/BaseStrategy.ts` | N/A (abstract base) | ✅ Extended by tested strategies |
| `src/strategies/RsiSmaStrategy.ts` | `src/strategies/RsiSmaStrategy.test.ts` | ✅ |
| `src/strategies/RsiCrossoverStrategy.ts` | `src/strategies/RsiCrossoverStrategy.test.ts` | ✅ |
| `src/strategies/MacdBollingerRsiStrategy.ts` | `src/strategies/MacdBollingerRsiStrategy.test.ts` | ✅ |
| `src/strategies/SafeBaseStrategy.ts` | `src/strategies/SafeBaseStrategy.test.ts` | ✅ |
| `src/strategies/Strategies.test.ts` | Integration tests | ✅ |

### ❌ Missing Tests

| File | Purpose | Priority |
|------|---------|----------|
| `src/strategies/BollingerBandStrategy.ts` | Standalone Bollinger Band strategy | **LOW** (may be legacy) |
| `src/strategies/MacdCrossoverStrategy.ts` | Standalone MACD crossover | **LOW** (may be legacy) |

---

## 4. Order/Position Management

### ✅ Tested

| File | Test File | Status |
|------|-----------|--------|
| `src/core/OrderManager.ts` (89 lines) | `tests/core/OrderManager.test.ts` | ✅ |
| `src/core/position-manager.ts` | `tests/core/position-manager.test.ts` | ✅ |
| `src/execution/strategy-position-manager.test.ts` | `tests/execution/strategy-position-manager.test.ts` | ✅ |

### ❌ Missing Tests

| File | Purpose | Priority |
|------|---------|----------|
| `src/core/tenant-arbitrage-position-tracker.ts` | Position tracking for arbitrage | **MEDIUM** |
| `src/core/tenant-crud-operations.ts` | Tenant CRUD operations | **MEDIUM** |
| `src/core/tenant-strategy-manager.ts` | Tenant strategy lifecycle | **MEDIUM** |

**OrderManager.ts Coverage Review:**
Current tests cover:
- ✅ `addOrder()`, `getOrders()`, `getOpenOrders()`, `getLastOrder()`
- ✅ `addArbTrade()` - arbitrage trade pairs
- ✅ File persistence and corruption recovery

Missing:
- ❌ Edge cases: empty orders, large order volumes
- ❌ Concurrent access patterns

---

## 5. Execution Modules (Quick Scan)

### ✅ Well Tested

| Module | Tests |
|--------|-------|
| `exchange-connector.ts` | `tests/execution/exchange-connector.test.ts` |
| `circuit-breaker.ts` | `tests/execution/circuit-breaker.test.ts`, `tests/execution/adaptive-circuit-breaker-per-exchange.test.ts` |
| `arbitrage-execution-engine.ts` | `tests/execution/arbitrage-execution-engine.test.ts` |
| `market-regime-detector.ts` | `tests/execution/market-regime-detector.test.ts` |
| `websocket-price-feed-manager.ts` | `tests/execution/websocket-price-feed-manager.test.ts` |
| `tick-to-candle-aggregator.ts` | `tests/execution/tick-to-candle-aggregator.test.ts` |

### ❌ Missing Tests

| File | Purpose | Priority |
|------|---------|----------|
| `src/execution/phantom-order-cloaking-engine.ts` | Stealth order execution | **MEDIUM** |
| `src/execution/stealth-execution-algorithms.ts` | Stealth algorithms (TWAP/VWAP) | **MEDIUM** |
| `src/execution/retry-handler*.ts` | 3 test files exist, but integration gaps | **LOW** |

---

## 6. Recommended Test Implementation Priority

### P0 - Critical (Implement First)

1. **`src/core/SignalFilter.ts`** - 15-20 tests
   - Regime detection scenarios
   - Signal scoring (4 components)
   - Cooldown logic
   - Volume confirmation
   - Reject reasons

2. **`src/core/signal-market-regime-detector.ts`** - 8-10 tests
   - Trending vs ranging detection
   - Volatility classification
   - Edge cases (empty data, single candle)

3. **`src/core/RiskManager.ts` advanced methods** - 10-12 tests
   - `calculateDynamicPositionSize()`
   - `calculateAtrStopLoss()`
   - `checkDrawdownLimit()`
   - `calculateRiskAdjustedMetrics()`
   - `calculateDynamicRiskParams()`

### P1 - Important (Implement Second)

4. **`src/core/StrategyEnsemble.ts`** - 8-10 tests
   - Multi-strategy initialization
   - Consensus aggregation
   - Signal metadata propagation

5. **`src/core/VaRCalculator.ts`** - 6-8 tests
   - VaR calculation methods
   - Confidence levels
   - Historical vs parametric

6. **`src/core/PortfolioRiskManager.ts`** - 8-10 tests
   - Portfolio-level position limits
   - Cross-asset risk aggregation
   - Kelly criterion integration

### P2 - Nice to Have

7. **`src/strategies/BollingerBandStrategy.ts`** - 5-6 tests (if still used)
8. **`src/strategies/MacdCrossoverStrategy.ts`** - 5-6 tests (if still used)
9. **`src/core/tenant-*.ts`** - 5 tests each (tenant management)

---

## 7. Test File Templates

### SignalFilter Test Template

```typescript
describe('SignalFilter', () => {
  let filter: SignalFilter;
  let mockCandles: ICandle[];

  beforeEach(() => {
    filter = new SignalFilter();
    mockCandles = generateMockCandles(50); // 50 candles
  });

  describe('scoreSignal()', () => {
    it('gives high score to trend-aligned signals with high volume', () => {
      // Setup trending regime
      // Feed high-volume candles
      // Expect score > 70
    });

    it('penalizes volatile regime signals', () => {
      // Setup volatile regime
      // Expect reduced regimeAlignment score
    });
  });

  describe('evaluate()', () => {
    it('rejects signals during cooldown', () => {
      // Record recent trade
      // Evaluate new signal
      // Expect rejectReason: 'cooldown_active'
    });

    it('rejects low volume signals', () => {
      // Feed low-volume candles
      // Expect rejectReason: 'low_volume'
    });

    it('rejects signals below minScore', () => {
      // Setup low-confidence signal
      // Expect rejectReason: 'score_X_below_Y'
    });
  });
});
```

### RiskManager Advanced Methods Template

```typescript
describe('RiskManager - Advanced Methods', () => {
  describe('calculateDynamicPositionSize()', () => {
    it('reduces position size in high volatility', () => {
      const atr = 5; // High ATR
      const size = RiskManager.calculateDynamicPositionSize(
        10000, 1, 100, atr, { atrMultiplier: 1.5 }
      );
      expect(size).toBeLessThan(1); // Less than base size
    });

    it('maintains size in low volatility', () => {
      const atr = 0.5; // Low ATR
      const size = RiskManager.calculateDynamicPositionSize(
        10000, 1, 100, atr
      );
      expect(size).toBeCloseTo(1);
    });
  });

  describe('calculateAtrStopLoss()', () => {
    it('places stop below entry for long positions', () => {
      const stop = RiskManager.calculateAtrStopLoss(100, 2, 2, 'buy');
      expect(stop).toBe(96); // 100 - (2 * 2)
    });

    it('places stop above entry for short positions', () => {
      const stop = RiskManager.calculateAtrStopLoss(100, 2, 2, 'sell');
      expect(stop).toBe(104); // 100 + (2 * 2)
    });
  });

  describe('checkDrawdownLimit()', () => {
    it('detects drawdown exceeding threshold', () => {
      const result = RiskManager.checkDrawdownLimit(
        9000, 10000, { maxDrawdownPercent: 8, recoveryPercentage: 50, resetAfterRecovery: false }
      );
      expect(result.exceeded).toBe(true); // 10% drawdown > 8%
    });

    it('allows trading within drawdown limits', () => {
      const result = RiskManager.checkDrawdownLimit(
        9500, 10000, { maxDrawdownPercent: 10, recoveryPercentage: 50, resetAfterRecovery: false }
      );
      expect(result.exceeded).toBe(false); // 5% drawdown < 10%
    });
  });
});
```

---

## 8. Estimated Effort

| Priority | Files | Tests to Add | Est. Time |
|----------|-------|--------------|-----------|
| P0 | 3 | ~40 tests | 4-6 hours |
| P1 | 3 | ~25 tests | 3-4 hours |
| P2 | 3 | ~15 tests | 2-3 hours |
| **TOTAL** | **9** | **~80 tests** | **9-13 hours** |

---

## 9. Unresolved Questions

1. Are `BollingerBandStrategy.ts` and `MacdCrossoverStrategy.ts` still in production use, or legacy code that can be removed?

2. Should `tenant-*.ts` files be tested at the integration level (with database) or as pure unit tests?

3. What's the target coverage threshold? (Current ~67%, industry standard is 80%+)

4. Should performance tests be added for critical paths (SignalFilter scoring, RiskManager calculations)?

---

## 10. Next Steps

1. **Approach approval:** Confirm P0/P1/P2 priorities
2. **Implementation:** Create test files following templates above
3. **Verification:** Run `npm test` to confirm all tests pass
4. **Coverage report:** Generate coverage report with `npm run test:coverage`
