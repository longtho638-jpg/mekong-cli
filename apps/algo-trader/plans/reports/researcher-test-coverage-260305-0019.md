# Test Coverage Analysis Report

**Date:** 2026-03-05  
**Project:** /Users/macbookprom1/mekong-cli/apps/algo-trader  
**Test Framework:** Jest  

## Test Inventory

| Metric | Count |
|--------|-------|
| Test Files | 57 |
| Total Tests | 516 |
| Source Files (non-test) | 200 |

### Test Distribution by Directory

| Directory | Source Files | Test Files | Coverage |
|-----------|-------------|------------|----------|
| execution | 37 | 37 | 100% |
| core | 60 | 23 | 38% |
| src/src (root) | 30 | 18 | 60% |
| cli | 15 | 6 | 40% |
| arbitrage | 11 | 11 | 100% |
| auth | 10 | 3 | 30% |
| netdata | 10 | 5 | 50% |
| ml | 5 | 4 | 80% |
| backtest | 10 | 6 | 60% |
| strategies | 12 | 5 | 42% |
| abi-trade | 3 | 2 | 67% |
| reporting | 4 | 0 | 0% |
| billing | 2 | 0 | 0% |
| pipeline | 2 | 1 | 50% |
| analysis | 1 | 1 | 100% |
| data | 2 | 0 | 0% |

## Test Coverage Assessment

### 100% Coverage (All modules tested)
- `execution/` - All 37 modules have tests
- `arbitrage/` - All 11 modules tested

### Partial Coverage
- `ml/` - 4/5 modules tested
- `backtest/` - 6/10 modules tested
- `cli/` - 6/15 modules tested

### Low Coverage (Critical Gaps)
- `core/` -only 23/60 modules tested (38%)
- `auth/` -only 3/10 modules tested (30%)
- `strategies/` -only 5/12 modules tested (42%)
- `abi-trade/` -2/3 modules tested (67%)

## Untested Modules (Critical)

### Core Module Gaps
```
src/core/SignalGenerator.ts
src/core/StrategyEnsemble.ts
src/core/StrategyLoader.ts
src/core/VaRCalculator.ts
src/core/CorrelationCalculator.ts
src/core/OrderManager.ts
src/core/PortfolioRiskManager.ts
src/core/SignalFilter.ts
src/core/alert-rules-engine.ts (TESTED)
src/core/autonomy-controller.ts
src/core/bot-engine-builtin-plugin-factories.ts
src/core/bot-engine-config-and-state-types.ts
src/core/bot-engine-plugins.ts
src/core/bot-engine-trade-executor-and-position-manager.ts
src/core/circuit-breakers.ts (TESTED)
src/core/historical-var-calculator.ts
src/core/paper-trading-engine.ts
src/core/persistent-tenant-state-store.ts
src/core/pnl-realtime-snapshot-service.ts
src/core/portfolio-correlation-matrix-calculator.ts
src/core/portfolio-risk-types.ts
src/core/portfolio-var-kelly-calculator.ts
src/core/raas-api-router.ts
src/core/signal-filter-math-helpers.ts
src/core/signal-filter-types.ts
src/core/signal-market-regime-detector.ts
src/core/strategy-auto-detector-types.ts
src/core/strategy-auto-detector.ts
src/core/strategy-build-phases-factory.ts
src/core/strategy-config-cascade.ts
src/core/strategy-detection-rules-builtin.ts
src/core/strategy-marketplace.ts
src/core/strategy-provider-registry.ts
src/core/tenant-arbitrage-position-tracker-types.ts
src/core/tenant-arbitrage-position-tracker.ts
src/core/tenant-crud-operations.ts
src/core/tenant-strategy-manager-types.ts
src/core/tenant-strategy-manager.ts
src/core/trading-build-plan.ts
src/core/trading-event-webhook-notifier-with-hmac-retry.ts
src/core/websocket-server.ts
```

### Auth Module Gaps
```
src/auth/auth-request-response-schemas.ts
src/auth/scopes.ts
src/auth/sliding-window-rate-limiter.ts
src/auth/tenant-auth-middleware.ts
```

### Strategies Module Gaps
```
src/strategies/BaseStrategy.ts
src/strategies/BollingerBandStrategy.ts
src/strategies/MacdCrossoverStrategy.ts
src/strategies/RsiCrossoverStrategy.ts
src/strategies/RsiSmaStrategy.ts
src/strategies/SafeBaseStrategy.ts
```

### Other Untested Modules
```
src/reporting/ConsoleReporter.ts
src/reporting/HtmlReporter.ts
src/reporting/PerformanceAnalyzer.ts
src/reporting/arbitrage-trade-history-exporter.ts
src/billing/polar-subscription-service.ts
src/billing/polar-webhook-event-handler.ts
src/db/client.ts
src/db/queries/*.ts (all)
src/jobs/*.ts (all - no tests)
src/jobs/workers/*.ts (all - no tests)
src/pipeline/workflow-pipeline-engine.ts
src/ui/CliDashboard.ts
src/ui/arbitrage-cli-realtime-dashboard.ts
src/utils/CredentialVault.ts
src/utils/config.ts
src/utils/logger.ts
src/analysis/indicators.ts
src/data/LiveDataProvider.ts
src/data/MockDataProvider.ts
```

## Test Quality Observations

1. **Fake Data Usage**: Some tests appear to use mocked/simulated data (e.g., `AtomicCrossExchangeOrderExecutor` with synthetic PnL)

2. **Integration Gaps**: 
   - No test for `bot-engine-config-and-state-types.ts` - critical config handling
   - No test for `credential-vault.ts` - security-sensitive module
   - No test for `redis/*` jobs infrastructure

3. **Edge Cases**: Limited evidence of edge case testing in output

## Recommendations

### Critical Priority
1. Add tests for `SignalGenerator.ts` and `StrategyEnsemble.ts` - core execution logic
2. Add tests for `CredentialVault.ts` - security-critical
3. Add tests for `bot-engine-*.ts` modules - trading orchestration
4. Add tests for auth middleware chain

### High Priority
5. Add tests for `reporting/` module - trade reporting
6. Add tests for `jobs/` workers - queue processing
7. Add tests for `db/queries/` - data persistence
8. Add tests for `strategies/` base implementations

## Coverage Estimate

**Overall: ~40-45%** (based on module-level analysis)

**Target (Per Binh Pháp Quality Front 6):** 100% coverage for critical paths
