# Algo Trader API Documentation

## Core Modules

### RiskManager
The RiskManager module provides essential risk management functionality for trading strategies.

#### Static Methods

**calculatePositionSize(balance: number, riskPercentage: number, currentPrice: number): number**
- Calculates the position size based on account balance and risk parameters
- Throws errors if invalid parameters are provided (negative values, percentage > 100%)

**checkStopLossTakeProfit(currentPrice: number, entryPrice: number, side: 'buy' | 'sell', config: StopLossTakeProfitConfig): StopLossTakeProfitResult**
- Checks if current price triggers hard stop-loss or take-profit levels
- Returns an object indicating whether stop-loss or take-profit was hit

**isDailyLossLimitHit(dailyPnL: number, limitUsd?: number): boolean**
- Checks if daily loss limit has been exceeded
- Returns true if limit is exceeded (should halt trading)

**initTrailingStop(price: number, config: TrailingStopConfig, defaultOffset: number = 0.02): TrailingStopState**
- Initializes a trailing stop state
- Sets up the initial stop price and tracking values

**updateTrailingStop(price: number, state: TrailingStopState, config: TrailingStopConfig, defaultOffset: number = 0.02): { state: TrailingStopState; stopHit: boolean }**
- Updates a trailing stop state based on the current price
- Returns updated state and whether the stop was triggered

**calculateDynamicPositionSize(baseBalance: number, baseRiskPercent: number, currentPrice: number, atr: number, config: VolatilityAdjustmentConfig = {}): number**
- Calculates position size adjusted based on market volatility
- Reduces position size as market volatility increases

**calculateAtrStopLoss(entryPrice: number, atr: number, atrMultiplier: number = 2, side: 'buy' | 'sell'): number**
- Calculates stop-loss based on Average True Range (ATR)
- Provides dynamic stop-loss levels based on market volatility

**checkDrawdownLimit(currentBalance: number, peakBalance: number, config: DrawdownControlConfig): { exceeded: boolean; drawdownPercent: number }**
- Checks drawdown against configured limits
- Helps control maximum drawdown during trading

**calculateRiskAdjustedMetrics(portfolioReturn: number, portfolioRisk: number, riskFreeRate: number, maxDrawdown: number): { sharpeRatio: number; sortinoRatio: number; calmarRatio: number }**
- Calculates risk-adjusted performance metrics
- Returns Sharpe, Sortino, and Calmar ratios

**calculateDynamicRiskParams(volatilityPercent: number, trendStrength: number = 0.5, marketRegime: 'trending' | 'mean-reverting' | 'volatile' | 'quiet' = 'trending'): DynamicRiskParams**
- Calculates dynamic risk parameters based on market conditions
- Adjusts risk parameters based on volatility, trend strength, and market regime

### AtomicCrossExchangeOrderExecutor
The AtomicCrossExchangeOrderExecutor handles cross-exchange order execution with rollback capabilities.

#### Constructor
**constructor(config: AtomicExecutorConfig = {})**
- Creates a new executor with optional configuration for retry and circuit breaker features

#### Methods

**executeAtomic(params: AtomicOrderParams): Promise<AtomicExecutionResult>**
- Executes buy and sell orders on two exchanges simultaneously
- Performs rollback if one side fails to prevent naked positions
- Returns detailed execution results including success status, order information, latency metrics, and error details

### BacktestRunner
The BacktestRunner provides comprehensive backtesting functionality for trading strategies.

#### Constructor
**constructor(strategy: IStrategy, dataProvider: IDataProvider, initialBalance: number = 10000, config?: EnhancedBacktestConfig)**
- Initializes a backtester with the given strategy, data provider, and configuration

#### Methods

**run(days: number = 30, silent = false): Promise<BacktestResult>**
- Runs a backtest over the specified number of days
- Returns comprehensive performance metrics

**getResults(): BacktestResult**
- Gets structured results for programmatic use
- Includes all performance metrics and trade details

## Advanced Modules

### VaRCalculator
Calculates Value at Risk (VaR) and Conditional Value at Risk (CVaR) for portfolio risk assessment.

#### Static Methods

**calculateVar(data: HistoricalDataPoint[], params: VarCalculationParams): VarResult**
- Calculates VaR and CVaR using specified method (historical, variance-covariance, or Monte Carlo)

### CorrelationCalculator
Calculates correlation matrices between different assets in a portfolio.

#### Static Methods

**calculateCorrelationMatrix(assetsData: Map<string, AssetDataPoint[]>): PortfolioCorrelationResult**
- Calculates correlation matrix for a set of assets
- Returns matrix and related stability metrics

**analyzeRiskFactors(result: PortfolioCorrelationResult): { diversificationBenefit: number; concentrationRisk: number; stabilityMetric: number }**
- Analyzes correlation matrix for risk factors
- Returns diversification benefit, concentration risk, and stability metrics

### WalkForwardAnalyzer
Implements expanding and rolling window validation techniques for strategy validation.

#### Static Methods

**performWalkForwardAnalysis(historicalData: any[], config: WalkForwardConfig): Promise<WalkForwardResult>**
- Performs walk-forward analysis on historical data
- Supports both expanding and rolling window approaches

**validateWalkForwardResult(result: WalkForwardResult, minOutOfSampleRatio: number = 0.2, minPerformanceConsistency: number = 0.5): boolean**
- Validates if a strategy passes walk-forward analysis criteria

**createAdaptiveConfig(marketRegime: 'trending' | 'mean-reverting' | 'volatile' | 'quiet'): WalkForwardConfig**
- Creates a walk-forward configuration optimized for different market regimes

### MonteCarloSimulator
Evaluates strategy robustness through randomized market simulations.

#### Static Methods

**runSimulation(baselineResult: any, historicalData: any[], strategyFn: (data: any[]) => Promise<any>, config: MonteCarloConfig): Promise<MonteCarloResult>**
- Runs Monte Carlo simulation to assess strategy robustness
- Returns comprehensive analysis of simulation results

**evaluateRobustness(result: MonteCarloResult, targetReturn: number = 0): { robustnessScore: number; riskOfSpuriousness: number; confidenceInPerformance: number }**
- Evaluates strategy robustness based on Monte Carlo results

### AdvancedMetricsCalculator
Calculates sophisticated performance metrics including Sortino, Calmar, and Sterling ratios.

#### Static Methods

**calculateMetrics(trades: Trade[], equityCurve: number[], riskFreeRate: number = 0.02): AdvancedBacktestMetrics**
- Calculates advanced performance metrics for backtesting
- Returns comprehensive performance and risk metrics

### SlippageModeler
Implements realistic slippage modeling based on order book depth.

#### Static Methods

**calculateSlippage(originalPrice: number, tradeSize: number, tradeSide: 'buy' | 'sell', orderBook: OrderBookLevel[], config: SlippageConfig = {}): SlippageEstimate**
- Calculates realistic slippage based on order book depth and trade size
- Returns detailed execution and slippage metrics

**estimateLiquidity(orderBook: OrderBookLevel[]): MarketLiquidityMetrics**
- Estimates market liquidity metrics based on order book data
- Provides information about bid-ask spreads and market depth

**adjustForVolatility(baseEstimate: SlippageEstimate, originalPrice: number, tradeSide: 'buy' | 'sell', volatility: number): SlippageEstimate**
- Adjusts slippage calculations based on market volatility
- Increases expected slippage in high volatility conditions