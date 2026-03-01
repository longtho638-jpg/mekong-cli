# Algo Trader Codebase Exploration Report

**Report Date:** March 1, 2026  
**Scope:** Full Directory Structure, Source Code Analysis, Tech Stack Details  
**Total Lines of Code:** ~9,936 TypeScript lines (src/)  
**Test Files:** 18 test files  

---

## 1. DIRECTORY STRUCTURE

### Root Level
```
algo-trader/
├── src/                    # Main source code (all TypeScript)
├── dist/                   # Compiled JavaScript (build output)
├── config/                 # Configuration files
├── docs/                   # Documentation
├── logs/                   # Runtime logs
├── data/                   # Historical data / mock data storage
├── coverage/               # Test coverage reports
├── plans/                  # Planning documents + research
├── package.json            # Node.js dependencies
├── tsconfig.json           # TypeScript configuration
├── jest.config.js          # Jest test configuration
├── jest.setup.js           # Jest setup file
├── .env.example            # Environment variables template
├── .turbo/                 # Turborepo cache directory
└── README.md               # Main documentation
```

### Source Code Structure (`src/`)
```
src/
├── analysis/               # Technical indicator calculations
│   ├── indicators.ts       # RSI, SMA, EMA, MACD, Bollinger Bands
│   └── indicators.test.ts  # 5 test cases
├── arbitrage/              # Arbitrage logic (re-exports from packages)
│   ├── index.ts            # Barrel exports from @agencyos/trading-core
│   ├── AgiArbitrageEngine.test.ts
│   ├── ArbitrageEngine.test.ts
│   ├── ArbitrageRound4.test.ts
│   ├── ArbitrageRound5.test.ts
│   ├── ArbitrageRound6.test.ts
│   ├── ArbitrageRound7.test.ts
│   ├── SpreadDetectorEngine.test.ts
│   └── vibe-billing-trading-hooks.test.ts
├── backtest/               # Backtesting framework
│   ├── BacktestEngine.ts   # Detailed backtest analysis (Sharpe, Sortino, Calmar, Monte Carlo)
│   ├── BacktestEngine.test.ts
│   ├── BacktestOptimizer.ts # Parameter optimization
│   └── BacktestRunner.ts    # Orchestrates backtest execution
├── cli/                    # CLI commands
│   ├── arb-cli-commands.ts          # Registers arb:scan, arb:run, arb:engine, arb:orchestrator, arb:auto, arb:agi
│   ├── exchange-factory.ts          # Exchange client creation from CLI options
│   ├── spread-detector-command.ts   # arb:spread CLI command
│   └── spread-detector-command.test.ts
├── core/                   # Core trading engine
│   ├── BotEngine.ts        # Main orchestrator (strategy→signal→risk→execution)
│   ├── BotEngine.test.ts   # 3 test cases
│   ├── OrderManager.ts     # Order lifecycle management
│   ├── RiskManager.ts      # Position sizing, stop-loss, take-profit
│   ├── RiskManager.test.ts # 5 test cases
│   ├── PortfolioRiskManager.ts # Multi-position risk tracking
│   ├── SignalGenerator.ts  # Signal filtering and validation
│   ├── SignalFilter.ts     # Pre-trade signal filtering
│   ├── StrategyLoader.ts   # Dynamic strategy loading by name
│   ├── StrategyEnsemble.ts # Multi-strategy voting
│   ├── RewardFunction.ts   # Risk-adjusted return metrics
│   ├── strategy-provider-registry.ts  # Strategy registry + cascading config
│   ├── strategy-config-cascade.ts     # Config inheritance pattern
│   ├── trading-build-plan.ts          # Nixpacks-inspired build plan
│   └── nixpacks-inspired-modules.test.ts
├── data/                   # Data providers
│   ├── LiveDataProvider.ts # (Placeholder) WebSocket/polling data
│   └── MockDataProvider.ts # Generates synthetic OHLCV candles
├── interfaces/             # TypeScript interfaces
│   ├── ICandle.ts          # OHLCV candle structure
│   ├── IConfig.ts          # Configuration interface
│   ├── IDataProvider.ts    # Data source contract
│   ├── IExchange.ts        # Exchange API contract
│   └── IStrategy.ts        # Strategy interface (onCandle, init)
├── reporting/              # Performance reporting
│   ├── ConsoleReporter.ts  # Console output formatter
│   ├── HtmlReporter.ts     # HTML report generator
│   └── PerformanceAnalyzer.ts # Metrics calculation (Sharpe, drawdown, etc.)
├── strategies/             # Trading strategy implementations
│   ├── BaseStrategy.ts     # Abstract base class
│   ├── RsiSmaStrategy.ts   # RSI(14) + SMA(20/50) crossover
│   ├── RsiCrossoverStrategy.ts # RSI overbought/oversold signals
│   ├── MacdCrossoverStrategy.ts # MACD line/signal line crossover
│   ├── BollingerBandStrategy.ts # Bollinger Bands mean reversion
│   ├── MacdBollingerRsiStrategy.ts # Combo: MACD + Bollinger + RSI
│   ├── MacdBollingerRsiStrategy.test.ts
│   ├── Arbitrage.test.ts   # Arbitrage strategy tests
│   ├── StatisticalArbitrage.test.ts
│   └── Strategies.test.ts
├── ui/                     # User interface
│   └── CliDashboard.ts     # Real-time CLI dashboard
├── utils/                  # Utilities
│   ├── logger.ts           # Winston logger
│   ├── config.ts           # Config loader (YAML + env)
│   └── CredentialVault.ts  # Secure credential management
└── index.ts                # CLI entry point (Commander.js)
```

---

## 2. KEY SOURCE FILES & PURPOSES

### Core Trading Engine

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/BotEngine.ts` | ~250 | Main orchestrator: connects strategy→signal→risk check→order execution |
| `src/core/RiskManager.ts` | ~200 | Position sizing, stop-loss/take-profit, daily loss limits, trailing stop |
| `src/core/OrderManager.ts` | ~120 | Manages order lifecycle (open, update, close, track P&L) |
| `src/core/StrategyLoader.ts` | ~80 | Factory pattern: dynamically loads strategies by name |
| `src/core/StrategyEnsemble.ts` | ~100 | Multi-strategy voting (average/weighted signals) |
| `src/core/SignalFilter.ts` | ~90 | Pre-trade filtering (confirmation, cooldown, max daily trades) |
| `src/core/PortfolioRiskManager.ts` | ~150 | Multi-position risk aggregation |

### Strategy Implementations

| File | Type | Indicators | Use Case |
|------|------|-----------|----------|
| `RsiSmaStrategy.ts` | Trend | RSI(14), SMA(20), SMA(50) | Buy dips in uptrend, sell overbought |
| `RsiCrossoverStrategy.ts` | Momentum | RSI(14) | Overbought/oversold signals |
| `MacdCrossoverStrategy.ts` | Trend | MACD (12/26), Signal (9) | Line/signal crossover |
| `BollingerBandStrategy.ts` | Mean-Reversion | Bollinger Bands (20, 2 std) | Reversal at bands |
| `MacdBollingerRsiStrategy.ts` | Combo | MACD + Bollinger + RSI | Multi-factor confirmation |

### Arbitrage Implementations (via `@agencyos/trading-core`)

| Type | Strategy | File |
|------|----------|------|
| **Cross-Exchange** | Price spread on same asset across exchanges | `trading-core/arbitrage/` |
| **Triangular** | 3-leg cycle: USDT→BTC→ETH→USDT | `trading-core/arbitrage/` |
| **Statistical** | Pairs trading via Z-Score mean reversion | `trading-core/arbitrage/` |
| **AGI (Advanced)** | Regime detection + Kelly sizing + self-tuning | `vibe-arbitrage-engine/agi-arbitrage-engine.ts` |

### Backtesting & Analysis

| File | Purpose |
|------|---------|
| `BacktestEngine.ts` | Detailed analysis: Sharpe, Sortino, Calmar ratios, Monte Carlo, walk-forward |
| `BacktestRunner.ts` | Orchestrates backtest execution against historical data |
| `BacktestOptimizer.ts` | Parameter sweep and optimization |
| `PerformanceAnalyzer.ts` | Metrics calculation: win rate, drawdown, expectancy, Hurst exponent |

---

## 3. EXISTING FEATURES & MODULES

### Trading Modes
- ✅ **Backtesting** — Historical data simulation with detailed metrics
- ✅ **Paper Trading** — Simulated execution without real capital
- ✅ **Live Trading** — Real exchange connections via CCXT
- ✅ **Strategy Comparison** — Bench-mark all strategies against same data
- ✅ **Walk-Forward Analysis** — Overfitting detection

### Risk Management
- ✅ Position sizing (fixed %, risk-based)
- ✅ Stop-loss & take-profit (hard levels + trailing stop)
- ✅ Maximum daily loss limits
- ✅ Portfolio-level risk aggregation
- ✅ Drawdown protection (halt when max drawdown hit)

### Data & Execution
- ✅ CCXT integration (100+ exchanges)
- ✅ Mock data provider (for testing)
- ✅ Multi-exchange balance rebalancing
- ✅ Live WebSocket price feeds (adapter-ready)
- ✅ Order management (placement, cancellation, tracking)

### Arbitrage Engines
- ✅ **SpreadDetectorEngine** — Real-time cross-exchange scanner + signal scoring
- ✅ **ArbitrageOrchestrator** — Latency optimizer + adaptive spread threshold
- ✅ **AgiArbitrageEngine** — Market regime detection + Kelly position sizing + self-tuning
- ✅ **BalanceRebalancer** — Auto-rebalance portfolio across exchanges
- ✅ **EmergencyCircuitBreaker** — Stop trading on max daily loss / risk threshold hit
- ✅ **ProfitTracker** — Track P&L, fees, ROI per trade

### Technical Indicators
- ✅ RSI (Relative Strength Index)
- ✅ SMA, EMA (Simple/Exponential Moving Averages)
- ✅ MACD (Moving Average Convergence Divergence)
- ✅ Bollinger Bands
- ✅ Standard Deviation, Z-Score
- ✅ Correlation, Hurst Exponent (advanced)

### CLI Commands
```bash
# Standard Trading
backtest              # Backtest strategy on historical data
backtest:advanced     # Detailed: Sharpe, Sortino, Calmar, Monte Carlo
backtest:walk-forward # Walk-forward to detect overfitting
live                  # Live trading bot
compare               # Compare all strategies

# Arbitrage
arb:scan              # Dry-run cross-exchange scan
arb:run               # Live arbitrage execution
arb:engine            # Full SpreadDetectorEngine (scoring + orderbook + circuit breaker)
arb:orchestrator      # With latency optimizer + adaptive threshold
arb:auto              # Unified auto-execution pipeline
arb:spread            # BTC/ETH cross-exchange scanner (Binance/OKX/Bybit) + auto-exec
arb:agi               # AGI Arbitrage (regime + Kelly + self-tune) — RECOMMENDED
```

---

## 4. TECH STACK DETAILS

### Core Technologies
| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| **Language** | TypeScript | 5.9.3 | Type-safe trading logic |
| **Runtime** | Node.js | 20.x | Execution environment |
| **CLI** | Commander.js | 11.1.0 | Command-line interface |
| **Exchange** | CCXT | 4.5.36 | Multi-exchange API wrapper |
| **Indicators** | technicalindicators | 3.1.0 | Technical analysis library |
| **Logging** | Winston | 3.19.0 | Structured logging |
| **Testing** | Jest + ts-jest | 29.7.0 | Unit & integration tests |
| **Build** | TypeScript Compiler | 5.9.3 | Compilation to JavaScript |

### Internal Packages (Workspace Dependencies)
```json
{
  "@agencyos/trading-core": "workspace:*",           // Core trading infrastructure
  "@agencyos/vibe-arbitrage-engine": "workspace:*",  // AGI arbitrage + regime detection
  "@agencyos/vibe-billing-trading": "workspace:*"    // Billing hooks for trading
}
```

### Package.json Scripts
```bash
npm run build           # Compile TypeScript → JavaScript
npm start              # Run compiled JavaScript
npm run dev            # Run with ts-node (development)
npm test               # Run Jest test suite
npm run test:coverage  # Test with coverage report
```

---

## 5. PACKAGE.JSON DEPENDENCIES

### Direct Dependencies (7)
```
@agencyos/trading-core         (workspace)
@agencyos/vibe-arbitrage-engine (workspace)
@agencyos/vibe-billing-trading  (workspace)
ccxt                           ^4.5.36  — Multi-exchange API
chalk                          ^4.1.2   — Colored console output
commander                      ^11.1.0  — CLI framework
dotenv                         ^16.6.1  — Environment variable loader
technicalindicators            ^3.1.0   — Technical analysis
winston                        ^3.19.0  — Structured logging
```

### Dev Dependencies (9)
```
@types/fs-extra               ^11.0.4  — File system types
@types/jest                   ^29.5.14 — Jest testing types
@types/node                   ^20.19.32 — Node.js types
@types/ws                     ^8.5.0   — WebSocket types
jest                          ^29.7.0  — Test framework
pkg-dir                       9.0.0    — Directory resolver
ts-jest                       ^29.4.6  — TypeScript Jest transformer
ts-node                       ^10.9.0  — Run TS directly
typescript                    ^5.9.3   — TypeScript compiler
yaml                          ^2.8.2   — YAML parser
```

---

## 6. CONFIGURATION FILES

### `tsconfig.json`
- **Target:** ES2022
- **Module:** CommonJS
- **Strict Mode:** Enabled
- **Module Resolution:** Node with path aliases for workspace packages
- **Path Mappings:**
  ```
  @agencyos/trading-core → ../../packages/trading-core/index.ts
  @agencyos/vibe-arbitrage-engine → ../../packages/vibe-arbitrage-engine/index.ts
  @agencyos/vibe-billing-trading → ../../packages/vibe-billing-trading/index.ts
  ```

### `config/default.yaml`
```yaml
exchange:
  id: "binance"
  testMode: true
bot:
  symbol: "BTC/USDT"
  riskPercentage: 1.0
  pollInterval: 1000
  strategy: "RsiSma"
backtest:
  days: 30
  initialBalance: 10000
logging:
  level: "info"
  directory: "./logs"
```

### `.env.example`
```
EXCHANGE_ID=binance
EXCHANGE_API_KEY=your_api_key_here
EXCHANGE_SECRET=your_secret_here
TRADING_PAIR=BTC/USDT
TIMEFRAME=1h
RSI_PERIOD=14
SMA_SHORT=20
SMA_LONG=50
MAX_POSITION_SIZE=0.01
STOP_LOSS_PCT=2.0
TAKE_PROFIT_PCT=5.0
MAX_DAILY_LOSS=100
LOG_LEVEL=info
LOG_FILE=algo-trader.log
ENABLE_BACKTESTING=false
ENABLE_LIVE_TRADING=false

# Multi-exchange credentials
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET=your_binance_secret
OKX_API_KEY=your_okx_api_key
OKX_SECRET=your_okx_secret
BYBIT_API_KEY=your_bybit_api_key
BYBIT_SECRET=your_bybit_secret
```

---

## 7. EXTERNAL PACKAGES INTEGRATION

### `@agencyos/trading-core` (Package)
**Location:** `packages/trading-core/`

**Modules:**
- `analysis/` — Technical indicators
- `arbitrage/` — ArbitrageScanner, ArbitrageExecutor, SpreadDetectorEngine, etc.
- `exchanges/` — ExchangeClientBase (CCXT wrapper), adapters for Binance/OKX/Bybit
- `interfaces/` — ICandle, IStrategy, IExchange, IDataProvider, IConfig
- `core/` — BaseStrategy, RiskManager, SignalGenerator, SignalFilter

### `@agencyos/vibe-arbitrage-engine` (Package)
**Location:** `packages/vibe-arbitrage-engine/`

**Key Classes:**
- `AgiArbitrageEngine` — Intelligence layer with regime detection
- `SpreadDetectorEngine` — Real-time spread monitoring
- `RegimeDetector` — Market state classification (trending/mean-reverting/volatile/quiet)
- `KellyPositionSizer` — Optimal position sizing via Kelly criterion
- `ArbitrageOrchestrator` — Latency optimization
- `AdaptiveSpreadThreshold` — Auto-tuning threshold
- `MultiExchangeConnector` — Multi-exchange order routing
- `BalanceRebalancer` — Automated balance redistribution

### `@agencyos/vibe-billing-trading` (Package)
**Location:** `packages/vibe-billing-trading/`

**Hooks:**
- `FeeCalculatorHook` — Integrates fee tracking into arbitrage execution
- `ProfitTrackerHook` — Monitors profitability and ROI
- `ArbitrageBillingHook` — Billing integration for arbitrage trades

---

## 8. TEST COVERAGE

### Test Files (18 total)
```
src/analysis/indicators.test.ts                    # 5 tests
src/arbitrage/AgiArbitrageEngine.test.ts
src/arbitrage/ArbitrageEngine.test.ts
src/arbitrage/ArbitrageRound4.test.ts
src/arbitrage/ArbitrageRound5.test.ts
src/arbitrage/ArbitrageRound6.test.ts
src/arbitrage/ArbitrageRound7.test.ts
src/arbitrage/SpreadDetectorEngine.test.ts
src/arbitrage/vibe-billing-trading-hooks.test.ts
src/backtest/BacktestEngine.test.ts
src/cli/spread-detector-command.test.ts
src/core/BotEngine.test.ts                        # 3 tests
src/core/RiskManager.test.ts                      # 5 tests
src/core/nixpacks-inspired-modules.test.ts
src/strategies/Arbitrage.test.ts
src/strategies/MacdBollingerRsiStrategy.test.ts
src/strategies/StatisticalArbitrage.test.ts
src/strategies/Strategies.test.ts
```

**Coverage Focus:**
- Risk management (position sizing, stop-loss/TP)
- Indicator calculations (RSI, SMA, MACD)
- Arbitrage detection and execution
- Strategy signal generation

---

## 9. DOCUMENTATION

### Main Docs (`docs/`)
1. **project-overview-pdr.md** — PDR (Project Definition Reference)
2. **system-architecture.md** — High-level architecture diagram + component flow
3. **arbitrage-strategies.md** — Details on Cross-Exchange, Triangular, Statistical
4. **project-roadmap.md** — Development phases and milestones
5. **project-changelog.md** — Change history and version notes
6. **codebase-summary.md** — Quick reference
7. **code-standards.md** — Development guidelines
8. **knowledge-synthesis-2026-02-23.md** — Research synthesis

### In-Codebase Documentation
- **JSDoc comments** on all public methods
- **Interface definitions** for all contracts
- **README.md** with setup, usage, and CLI commands

---

## 10. KEY INSIGHTS & PATTERNS

### Architecture Patterns
1. **Factory Pattern** — StrategyLoader, ExchangeFactory
2. **Observer Pattern** — Event-driven signals (onCandle)
3. **Adapter Pattern** — CCXT exchange clients
4. **Composition Pattern** — StrategyEnsemble, RiskManager composition
5. **Cascading Config** — strategy-config-cascade.ts for inheritance

### Design Principles
- **Modularity** — Clear separation of concerns (strategies, risk, execution)
- **Type Safety** — Strict TypeScript, no `any` types
- **Extensibility** — Interfaces for strategies, exchanges, data providers
- **Testability** — Dependency injection, mock implementations
- **Scalability** — Multi-strategy ensemble, multi-exchange arbitrage

### Key Files to Understand First
1. `src/index.ts` — CLI entry point
2. `src/interfaces/` — All contract definitions
3. `src/core/BotEngine.ts` — Main orchestrator
4. `src/strategies/BaseStrategy.ts` — Strategy template
5. `src/cli/arb-cli-commands.ts` — Arbitrage CLI wiring

---

## 11. UNRESOLVED QUESTIONS

1. **LiveDataProvider Status** — Placeholder exists; WebSocket implementation pending?
2. **Exchange Credentials** — How are production API keys stored securely beyond .env?
3. **Paper Trading** — Simulated execution layer fully implemented?
4. **Historical Data Storage** — Where are backtesting candles sourced? CCXT fetch or external DB?
5. **Order Slippage Modeling** — How is slippage estimated in backtests?
6. **Multi-Timeframe Strategy** — Are strategies restricted to single timeframe or can they use multiple?
7. **Real-Time Alert System** — Webhook/email notifications on trade signals?
8. **Dashboard Persistence** — CLI dashboard data logged to file for later analysis?
9. **Strategy Hot-Reload** — Can strategies be updated without restarting bot?
10. **Performance Optimization** — Latency benchmarks for real-time arbitrage? Target <100ms?

