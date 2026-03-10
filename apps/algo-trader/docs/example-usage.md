# Algo Trader Example Usage Guide

This guide demonstrates how to use the enhanced algo trader system with practical examples.

## Risk Management Examples

### Basic Risk Management
```typescript
import { RiskManager } from './src/core/RiskManager';

// Calculate position size based on 2% risk and current price
const positionSize = RiskManager.calculatePositionSize(
  10000, // account balance
  2,     // risk percentage
  50000  // current BTC price
);

console.log(`Position size: ${positionSize}`);
```

### Dynamic Risk Management with Volatility Adjustment
```typescript
import { RiskManager } from './src/core/RiskManager';

const config = {
  atrMultiplier: 2,
  minVolatility: 1.5,
  maxVolatility: 8.0,
  volatilityLookback: 14
};

const dynamicPositionSize = RiskManager.calculateDynamicPositionSize(
  10000, // base balance
  2,     // base risk percent
  50000, // current price
  1500,  // Average True Range
  config
);
```

### Stop-Loss with ATR
```typescript
const atrStopLoss = RiskManager.calculateAtrStopLoss(
  50000, // entry price
  1500,  // ATR value
  2,     // ATR multiplier
  'buy'  // trade side (long position)
);
```

### Drawdown Control
```typescript
const drawdownResult = RiskManager.checkDrawdownLimit(
  9500,  // current balance
  10000, // peak balance
  {
    maxDrawdownPercent: 10, // max 10% drawdown
    recoveryPercentage: 0.8 // resume at 80% of high-water mark
  }
);

if (drawdownResult.exceeded) {
  console.log(`Drawdown limit exceeded: ${drawdownResult.drawdownPercent}%`);
}
```

## Cross-Exchange Order Execution

### Basic Atomic Execution
```typescript
import { AtomicCrossExchangeOrderExecutor } from './src/execution/atomic-cross-exchange-order-executor';

const executor = new AtomicCrossExchangeOrderExecutor();

const result = await executor.executeAtomic({
  symbol: 'BTC/USDT',
  amount: 0.1,
  buyExchange: binanceExchange,    // IExchange implementation
  sellExchange: okxExchange       // IExchange implementation
});

if (result.success) {
  console.log(`Orders executed successfully. P&L: $${result.netPnl}`);
} else {
  console.log(`Execution failed: ${result.error}`);
}
```

### Execution with Retry and Circuit Breaker
```typescript
import { AtomicCrossExchangeOrderExecutor } from './src/execution/atomic-cross-exchange-order-executor';
import { CircuitBreakerConfig } from './src/execution/circuit-breaker';
import { RetryConfig } from './src/execution/retry-handler';

const circuitBreakerConfig: CircuitBreakerConfig = {
  failureThreshold: 3,
  timeoutMs: 30000, // 30 seconds
  successThreshold: 1
};

const retryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  factor: 2,
  jitter: true,
  retryableErrors: ['timeout', 'rate limit', 'network error']
};

const executor = new AtomicCrossExchangeOrderExecutor({
  retryConfig,
  circuitBreakerConfig
});

const result = await executor.executeAtomic({
  symbol: 'BTC/USDT',
  amount: 0.1,
  buyExchange: binanceExchange,
  sellExchange: okxExchange
});
```

## Backtesting Examples

### Basic Backtesting
```typescript
import { BacktestRunner } from './src/backtest/BacktestRunner';
import { MyTradingStrategy } from './src/strategies/my-strategy';
import { MyDataProvider } from './src/data/my-data-provider';

const strategy = new MyTradingStrategy();
const dataProvider = new MyDataProvider();
const backtester = new BacktestRunner(strategy, dataProvider, 10000 /* initial balance */);

const results = await backtester.run(30 /* days */);

console.log(`Total Return: ${results.totalReturn}%`);
console.log(`Max Drawdown: ${results.maxDrawdown}%`);
console.log(`Win Rate: ${results.winRate}%`);
```

### Advanced Backtesting with Realistic Slippage
```typescript
import { BacktestRunner } from './src/backtest/BacktestRunner';
import { EnhancedBacktestConfig } from './src/backtest/BacktestRunner';
import { SlippageModeler } from './src/backtest/SlippageModeler';

const config: EnhancedBacktestConfig = {
  feeRate: 0.001,        // 0.1% per side
  riskPercentage: 2,     // 2% risk per trade
  slippageBps: 5,        // 0.05% base slippage
  slippageConfig: {
    baseSlippageBps: 5,
    volumeImpact: 1.2,
    marketImpactModel: 'sqrt',
    liquidityThreshold: 0.01
  },
  calculateAdvancedMetrics: true
};

const backtester = new BacktestRunner(strategy, dataProvider, 10000, config);
const results = await backtester.run(60 /* days */);

// Access advanced metrics
if (results.advancedMetrics) {
  console.log(`Sharpe Ratio: ${results.advancedMetrics.sharpeRatio}`);
  console.log(`Sortino Ratio: ${results.advancedMetrics.sortinoRatio}`);
  console.log(`Calmar Ratio: ${results.advancedMetrics.calmarRatio}`);
}
```

### Walk-Forward Analysis
```typescript
import { WalkForwardAnalyzer, WalkForwardConfig } from './src/backtest/WalkForwardAnalyzer';

const wfConfig: WalkForwardConfig = {
  inSamplePeriod: 200,
  outOfSamplePeriod: 50,
  walkMode: 'rolling',
  reoptimizeInterval: 5
};

const wfResult = await WalkForwardAnalyzer.performWalkForwardAnalysis(
  historicalData,
  wfConfig
);

const isValidated = WalkForwardAnalyzer.validateWalkForwardResult(wfResult);
console.log(`Strategy passes walk-forward validation: ${isValidated}`);
```

### Monte Carlo Simulation
```typescript
import { MonteCarloSimulator, MonteCarloConfig } from './src/backtest/MonteCarloSimulator';

const mcConfig: MonteCarloConfig = {
  simulationCount: 1000,
  shuffleMethod: 'block',
  blockSize: 10,
  volatilityAdjustment: 1.0
};

const mcResult = await MonteCarloSimulator.runSimulation(
  baselineResult,
  historicalData,
  (data) => runBacktestWithStrategy(data, strategy), // strategy execution function
  mcConfig
);

const robustness = MonteCarloSimulator.evaluateRobustness(mcResult, 0);
console.log(`Strategy robustness score: ${robustness.robustnessScore}`);
```

## VaR and Correlation Analysis

### Value at Risk Calculation
```typescript
import { VaRCalculator, VarCalculationParams } from './src/core/VaRCalculator';

const varParams: VarCalculationParams = {
  portfolioValue: 100000,
  confidenceLevel: 0.95, // 95% confidence
  lookbackDays: 252,     // 1 year of data
  method: 'historical'
};

const varResult = VaRCalculator.calculateVar(historicalData, varParams);
console.log(`Value at Risk (95%): $${varResult.var}`);
console.log(`Conditional Value at Risk: $${varResult.cvar}`);
```

### Portfolio Correlation Analysis
```typescript
import { CorrelationCalculator } from './src/core/CorrelationCalculator';

// Create a map of asset data
const assetsData = new Map<string, AssetDataPoint[]>();
assetsData.set('BTC', btcHistoricalData);
assetsData.set('ETH', ethHistoricalData);
assetsData.set('SOL', solHistoricalData);

const correlationResult = CorrelationCalculator.calculateCorrelationMatrix(assetsData);
const riskFactors = CorrelationCalculator.analyzeRiskFactors(correlationResult);

console.log(`Diversification Benefit: ${riskFactors.diversificationBenefit}`);
console.log(`Concentration Risk: ${riskFactors.concentrationRisk}`);
```

## Complete Trading System Example

Here's an example that combines multiple enhanced features:

```typescript
import { RiskManager } from './src/core/RiskManager';
import { AtomicCrossExchangeOrderExecutor } from './src/execution/atomic-cross-exchange-order-executor';
import { ExchangeClient } from './src/execution/ExchangeClient';

// Initialize trading system with enhanced features
class EnhancedTradingSystem {
  private riskManager: typeof RiskManager;
  private orderExecutor: AtomicCrossExchangeOrderExecutor;
  private exchanges: Map<string, ExchangeClient>;

  constructor() {
    this.riskManager = RiskManager;

    // Initialize order executor with retry and circuit breaker
    this.orderExecutor = new AtomicCrossExchangeOrderExecutor({
      retryConfig: {
        maxRetries: 3,
        baseDelayMs: 1000,
        factor: 2,
        retryableErrors: ['timeout', 'rate limit']
      },
      circuitBreakerConfig: {
        failureThreshold: 5,
        timeoutMs: 60000
      }
    });

    this.exchanges = new Map();
    // Initialize exchanges
    this.exchanges.set('binance', new ExchangeClient('binance'));
    this.exchanges.set('okx', new ExchangeClient('okx'));
  }

  async executeTradeSignal(signal: TradeSignal) {
    // Perform risk checks first
    const accountInfo = await this.getAccountInfo();
    const marketData = await this.getMarketData(signal.symbol);

    // Calculate dynamic position size based on volatility
    const positionSize = this.riskManager.calculateDynamicPositionSize(
      accountInfo.balance,
      2, // base risk percentage
      marketData.price,
      marketData.atr,
      { atrMultiplier: 1.5 }
    );

    // Check if trade passes risk controls
    if (positionSize <= 0) {
      console.log('Position size invalid, skipping trade');
      return;
    }

    // Execute the trade atomically across exchanges
    const result = await this.orderExecutor.executeAtomic({
      symbol: signal.symbol,
      amount: positionSize,
      buyExchange: this.exchanges.get(signal.primaryExchange)!,
      sellExchange: this.exchanges.get(signal.hedgeExchange)!
    });

    return result;
  }

  private async getAccountInfo() {
    // Implementation to get account info
    return { balance: 50000 };
  }

  private async getMarketData(symbol: string) {
    // Implementation to get market data
    return {
      price: 50000,
      atr: 1500
    };
  }
}

// Usage
const tradingSystem = new EnhancedTradingSystem();
// tradingSystem.executeTradeSignal(signal);
```