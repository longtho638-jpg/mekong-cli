# P0 Modules API & Dependencies Analysis Report

**Date:** 2026-03-05  
**Work Context:** /Users/macbookprom1/mekong-cli/apps/algo-trader

---

## CORE MODULES

### 1. SignalGenerator.ts
**Exported:**
- `class SignalGenerator`
- `interface WeightedSignal { strategyName, signal: ISignal | null, weight }`
- `interface ConsensusSignal { type, confidence, price, timestamp, votes, metadata }`
- `interface SignalGeneratorConfig { consensusThreshold: 0.6, minVotes: 2 }`

**Methods:**
- `aggregate(signals: WeightedSignal[]): ConsensusSignal | null`

**Dependencies:** `../interfaces/IStrategy`

**Test Scenarios:**
- Empty signals array → null
- BELOW minVotes → null
- BELOW consensusThreshold → null
- 60%+ BUY votes → BUY consensus
- 60%+ SELL votes → SELL consensus
- Mixed votes (no majority) → null

---

### 2. StrategyEnsemble.ts
**Exported:**
- `class StrategyEnsemble implements IStrategy`
- `interface EnsembleMember { strategy: IStrategy, weight: number }`

**Methods:**
- `constructor(members: EnsembleMember[], config?: SignalGeneratorConfig)`
- `init(history: ICandle[]): Promise<void>`
- `onCandle(candle: ICandle): Promise<ISignal | null>`

**Dependencies:**
- IStrategy, ICandle, SignalGenerator, logger

**Test Scenarios:**
- Single member → passes through signal
- Multiple members with consensus → weighted vote wins
- No consensus → returns null
- Mixed signals → signalGenerator.aggregate() logic

---

### 3. bot-engine-plugins.ts + factories
**Exported:**
- `interface BotPlugin { name, version, onStart?, onPreTrade?, onPostTrade?, onCandle?, onTick?, onSignal?, onStop?, onFinish? }`
- `interface PluginContext { eventBus, config }`
- `interface PreTradeInfo { side, symbol, amount, price, strategy }`
- `interface PostTradeInfo extends PreTradeInfo { orderId, fee, pnl, success }`
- `interface TradeDecision { approved, reason? }`
- `class PluginManager { register, onStart, onPreTrade, onPostTrade, onCandle, onTick, onSignal, onStop, onFinish }`

**Built-in Factories:**
- `createAutonomyGatePlugin(autonomyController)`
- `createDailyLossPlugin(limitUsd)` - tracks dailyPnL, resets daily
- `createSignalFilterPlugin(minScore, getSignalScore)`
- `createWebhookPlugin(webhookUrl, secret?)`

**Dependencies:** AgentEventBus, ICandle, ISignal, WebhookNotifier

**Test Scenarios:**
- Plugin veto blocks trade (onPreTrade returns approved: false)
- Daily loss resets at midnight
- Signal filter vetoes below minScore
- Webhook fires on trade.executed/bot.started/bot.stopped

---

### 4. bot-engine-trade-executor-and-position-manager.ts
**Exported:**
- `class BotTradeExecutor`

**Methods:**
- `syncPositionState(): Promise<void>` - fetches balance, determines openPosition
- `seedPeakBalance(): Promise<void>` - sets initial peak for drawdown tracking
- `checkDrawdown(): Promise<boolean>` - returns true if limit breached
- `executeTrade(side, currentPrice, strategyName): Promise<void>`

**Dependencies:** IExchange, OrderManager, RiskManager, AgentEventBus, TradeAuditLogger, AutonomyController

**Test Scenarios:**
- Insufficient balance → log warn, skip
- Drawdown breach → emit RISK_ALERT, ESCALATION events
- Successful buy → updates openPosition, entryPrice
- Successful sell → calculates P&L, resets entryPrice

---

### 5. trading-build-plan.ts
**Exported:**
- `interface TradingBuildPlan { id, createdAt, detectionContext, selectedProvider, setup, install, build, start }`
- `class TradingPlanBuilder`

**Static Methods:**
- `generatePlan(provider, context, overrides?): TradingBuildPlan`
- `serialize(plan): string`
- `deserialize(json): TradingBuildPlan`

**Dependencies:** StrategyProvider, DetectionContext, StrategyMetadata

**Test Scenarios:**
- Default config values (maxPositionSizeUsd: 500, pollIntervalMs: 2000)
- Override mode/pollInterval/maxPosition
- JSON round-trip preserves all fields

---

### 6. BotEngine.ts
**Exported:**
- `class BotEngine`

**Constructor deps:**
- strategy: IStrategy, dataProvider: IDataProvider, exchange: IExchange, config: BotConfig, orderManager?: OrderManager

**Subsystems initialized:**
- eventBus, signalExplainer, auditLogger, autonomyController
- signalMesh, tickStore, healthManager, pluginManager
- tradeExecutor

**Key Methods:**
- `start(): Promise<void>` - connects exchange, initializes, subscribes to SignalMesh
- `stop(): Promise<void>` - graceful shutdown
- `registerPlugin(plugin): void`
- `onCandle(candle): Promise<void>` - main loop
- `onSignalGenerated(signal): Promise<void>` - trade routing

**Test Scenarios:**
- Start → exchange.connect → health monitoring active
- Drawdown check per candle → stops bot if breached
- SL/TP check before strategy signal
- Plugin onPreTrade veto blocks trade execution

---

### 7. OrderManager.ts
**Exported:**
- `class OrderManager`

**Methods:**
- `addOrder(order): void` - persists to data/orders.json
- `getOrders(): IOrder[]`
- `getOpenOrders(): IOrder[]`
- `getLastOrder(): IOrder | undefined`
- `addArbTrade(buyOrder, sellOrder): void`

**Dependencies:** fs, logger, IOrder

**Test Scenarios:**
- Load from existing orders.json
- Corrupted file backup and restart
- Atomic write via temp file then rename
- Arbitrage trade logs both legs atomically

---

### 8. RiskManager.ts
**Exported:**
- `class RiskManager` (all static methods)
- `interface StopLossTakeProfitConfig { stopLossPercent, takeProfitPercent, dailyLossLimitUsd }`
- `interface TrailingStopConfig, TrailingStopState, VolatilityAdjustmentConfig, DrawdownControlConfig, DynamicRiskParams`

**Static Methods:**
- `calculatePositionSize(balance, riskPercentage, currentPrice): number`
- `checkStopLossTakeProfit(currentPrice, entryPrice, side, config): StopLossTakeProfitResult`
- `isDailyLossLimitHit(dailyPnL, limitUsd): boolean`
- `initTrailingStop(price, config, defaultOffset): TrailingStopState`
- `updateTrailingStop(price, state, config, defaultOffset): { state, stopHit }`
- `calculateDynamicPositionSize(baseBalance, baseRiskPercent, currentPrice, atr, config): number`
- `calculateAtrStopLoss(entryPrice, atr, atrMultiplier, side): number`
- `checkDrawdownLimit(currentBalance, peakBalance, config): { exceeded, drawdownPercent }`
- `calculateRiskAdjustedMetrics(portfolioReturn, portfolioRisk, riskFreeRate, maxDrawdown): { sharpe, sortino, calmar }`
- `calculateDynamicRiskParams(volatilityPercent, trendStrength, marketRegime): DynamicRiskParams`

**Dependencies:** None (pure math/utils)

**Test Scenarios:**
- Zero/invalid inputs → throw Error
- Long SL below entry, TP above entry
- Short SL above entry, TP below entry
- Daily loss resets on day change
- Trailing stop only moves up, never down
- Volatility adjustment reduces position > min threshold

---

## AUTH MODULES

### 1. scopes.ts
**Exported:**
- `SCOPES = { BACKTEST, LIVE_TRADE, LIVE_MONITOR, ADMIN }`
- `type Scope`
- `ALL_SCOPES: Scope[]`
- `hasScope(required: string, actual: string[]): boolean`
- `hasAllScopes(required: string[], actual: string[]): boolean`
- `validateScopes(scopes: string[]): scopes is Scope[]`

**Test Scenarios:**
- 'admin' scope grants everything
- Specific scope check
- Multiple required scopes (all must match)
- Invalid scope strings → validateScopes returns false

---

### 2. auth-request-response-schemas.ts
**Exported (Zod schemas):**
- `ScopeSchema`
- `IssueTokenRequestSchema`
- `RefreshTokenRequestSchema`
- `CreateApiKeyRequestSchema`
- `ApiKeyResponseSchema`
- `AuthContextSchema`
- `TokenResponseSchema`

**Types:**
- `IssueTokenRequest, RefreshTokenRequest, CreateApiKeyRequest`
- `ApiKeyResponse, TokenResponse`

**Dependencies:** zod, scopes.ts

**Test Scenarios:**
- Missing tenantId → schema error
- Scopes array empty → schema error
- Expiry > 86400 → schema error
- Valid request passes zod.parse()

---

### 3. jwt-token-service.ts
**Exported:**
- `signToken(payload, expirySeconds?): string` - HS256 JWT
- `verifyToken(token): TenantToken` - throws on invalid/expired
- `refreshToken(token): string` - returns new token if near expiry

**Internal:**
- `getSecret()` - from JWT_SECRET env (min 32 chars)
- Base64 URL encode/decode helpers
- createHmac('sha256') for signature

**Test Scenarios:**
- Invalid signature → Error
- Expired token → Error
- Token near expiry (15min) → refresh returns new token
- Token far from expiry → returns original

---

### 4. api-key-manager.ts
**Exported:**
- `generateApiKey(tenantId, scopes, label?): GeneratedApiKey & { record }`
- `hashKey(raw): string` - SHA-256
- `validateKey(raw, store): AuthContext | null`
- `getRecordByKeyId(keyId, store): ApiKeyRecord | undefined`

**Internal:**
- `KEY_PREFIX = 'algo_'` + 32 hex chars
- `timingSafeEqual()` - constant-time comparison

**Test Scenarios:**
- Missing prefix → null
- Wrong hash in store → null
- Correct key → returns AuthContext
- KeyId lookup for rate limiting

---

### 5. tenant-auth-middleware.ts
**Exported:**
- `createAuthMiddleware(keyStore, limiter, rateLimit?, windowMs?)` - preHandler
- `requireScope(requiredScope): preHandler`

**Interfaces:**
- `AuthRequest { headers, authContext? }`
- `AuthReply { code, header, send }`

**Test Scenarios:**
- Missing auth header → 401
- Invalid JWT → 401
- Invalid API key → 401
- Rate limit exceeded → 429
- Missing required scope → 403
- Valid auth → attaches authContext, adds rateLimit headers

---

### 6. sliding-window-rate-limiter.ts
**Exported:**
- `class SlidingWindowRateLimiter`
- `check(keyId, limit, windowMs): Promise<RateLimitResult>`
- `headers(result): Record<string, string>` - X-RateLimit-Remaining, X-RateLimit-Reset
- `reset(keyId): void`
- `clear(): void`

**State:**
- `store: Map<string, RateLimitState>` - count, windowStart

**Test Scenarios:**
- New window → allowed, remaining = limit - 1
- Within limit → allowed, decrement count
- At limit → denied, remaining = 0
- After reset, allowed again

---

### 7. types.ts
**Exported:**
- `TenantToken { tenantId, scopes, keyId?, iat?, exp? }`
- `AuthContext { tenantId, scopes, keyId }`
- `ApiKeyRecord { keyId, tenantId, hashedKey, scopes, createdAt, label? }`
- `GeneratedApiKey { raw, hashed, keyId }`
- `RateLimitState { count, windowStart }`
- `RateLimitResult { allowed, remaining, resetAt }`

---

## DEPENDENCY CHAIN SUMMARY

```
SignalGenerator (core)
    ↓
StrategyEnsemble (core)
    ↓
bot-engine-plugins (core)
    ↓
bot-engine-trade-executor (core)
    ↓
BotEngine (core)
    ↓
  depends on:
    - IStrategy, IDataProvider, IExchange (interfaces)
    - OrderManager
    - RiskManager
    - AgentEventBus, SignalExplainer, TradeAuditLogger, AutonomyController (a2ui)
    - SignalMesh, TickStore, HealthManager (netdata)
    - PluginManager

Auth Modules (auth/)
    ↓
  independent but integrated via:
    - tenant-auth-middleware.ts
    - jwt-token-service.ts
    - api-key-manager.ts
    - scopes.ts
    - sliding-window-rate-limiter.ts
```

---

## UNRESOLVED QUESTIONS

1. Does SignalMesh need unit tests? Currently in `netdata/` - unclear if it's module-under-test or infra
2. Are the A2UI (AgentEventBus, AutonomyController, etc.)发 trong `a2ui/` a separate package or part of this module?
3. Does BotEngine need a standalone test or only integration tests with strategy?
4. Is WebhookNotifier in `trading-event-webhook-notifier-with-hmac-retry.ts` tested? Missing .test.ts file?
5. Should StrategyProviderRegistry be included in P0? It's imported by trading-build-plan.ts
