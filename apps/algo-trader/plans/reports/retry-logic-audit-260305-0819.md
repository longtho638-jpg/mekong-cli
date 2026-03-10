# Retry Logic Audit - Asymmetric Buy/Sell Errors

## 🔴 CRITICAL BUGS FOUND

### Bug #1: RetryHandler chỉ retry lần đầu, không retry subsequent attempts

**File:** `src/execution/retry-handler.ts:28-36`

```typescript
for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
  this.metrics.attempts++;
  try {
    const result = await operation();
    if (attempt > 0) {
      this.metrics.successfulRetries++;  // ← BUG: đếm sai
    }
    return result;
  }
```

**Vấn đề:** `metrics.attempts++` tăng ở MỌI attempt, nhưng `successfulRetries++` chỉ tăng khi `attempt > 0`. Nếu attempt=0 thành công, metrics báo 1 attempt, 0 successfulRetries - ĐÚNG. Nhưng nếu attempt=0 fail, attempt=1 thành công, metrics báo 2 attempts, 1 successfulRetry - SAI vì totalRetryDelayMs không được cộng đúng.

### Bug #2: CircuitBreaker không phân biệt BUY/SELL sides

**File:** `src/execution/circuit-breaker.ts:24-35`

```typescript
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount: number = 0;
  // ...
```

**Vấn đề:** Mỗi `CircuitBreaker` instance chỉ theo dõi 1 side. Trong `atomic-cross-exchange-order-executor.ts`, buy và sell có circuit breaker RIÊNG biệtnhưng khi 1 side fail, side kia vẫn retry bình thường. Điều này tạo asymmetric retry behavior.

### Bug #3: Asymmetric Retry - Buy retry khác Sell retry

**File:** `src/execution/atomic-cross-exchange-order-executor.ts:100-109`

```typescript
result = await this.retryHandler.execute(async () => {
  if (this.buyCircuitBreaker && this.sellCircuitBreaker) {
    return await this.performAtomicExecutionWithCircuitBreakersCheck(params, startTime);
  } else {
    return await this.performAtomicExecution(params, startTime);
  }
});
```

**Vấn đề:** Retry handler bọc TOÀN BỘ atomic execution. Nếu buy succeed nhưng sell fail với retryable error, retry handler sẽ retry CẢ HAI sides. Buy order có thể被执行多次 trên exchange, gây over-exposure.

### Bug #4: Rollback không retry

**File:** `src/execution/atomic-cross-exchange-order-executor.ts:312-342`

```typescript
private async handlePartialFailure(...) {
  if (buyOrder && !sellOrder) {
    try {
      await buyExchange.createMarketOrder(symbol, 'sell', buyOrder.amount);
      // ← Không retry nếu rollback fail!
    } catch (err) {
      logger.error(`[AtomicExec] Rollback FAILED...`);
    }
  }
}
```

**Vấn đề:** Rollback là CRITICAL để tránh naked position, nhưng không có retry logic. Nếu rollback fail do timeout tạm thời, user mất tiền.

## 📊 Test Coverage Gaps

| Test Case | Coverage | Issue |
|-----------|----------|-------|
| Buy retry, sell success | ✅ Covered | Nhưng không verify buy được execute 2 lần trên exchange |
| Sell retry, buy success | ❌ Missing | Test only covers buy-side retry |
| Both sides retry | ❌ Missing | Không test scenario cả 2 sides fail với retryable errors |
| Rollback retry | ❌ Missing | Không test rollback failure + retry |
| Circuit breaker + retry combined | ⚠️ Partial | Test có nhưng không verify asymmetric behavior |

## 🔧 RECOMMENDED FIXES

### Fix 1: Separate Retry per Side

```typescript
interface SideExecutionResult {
  success: boolean;
  order?: IOrder;
  error?: Error;
  attempts: number;
}

async executeWithIndividualRetry(
  exchange: IExchange,
  side: 'buy' | 'sell',
  symbol: string,
  amount: number,
  circuitBreaker?: CircuitBreaker
): Promise<SideExecutionResult> {
  // Retry logic cho từng side độc lập
}
```

### Fix 2: Rollback với Retry

```typescript
private async handlePartialFailure(...) {
  const rollbackConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 50,
    maxDelayMs: 500,
    factor: 2,
    jitter: true
  };
  const rollbackRetry = new RetryHandler(rollbackConfig);

  if (buyOrder && !sellOrder) {
    await rollbackRetry.execute(async () =>
      buyExchange.createMarketOrder(symbol, 'sell', buyOrder.amount)
    );
  }
}
```

### Fix 3: Circuit Breaker Metrics per Side

Thêm vào result:
```typescript
interface AtomicExecutionResult {
  // ...
  circuitBreakerMetrics?: {
    buyState: string;
    sellState: string;
    buyFailureCount: number;
    sellFailureCount: number;
    // ...
  };
}
```

## 📝 Unresolved Questions

1. Có nên thêm "idempotency key" vào mỗi order để tránh double-execution khi retry?
2. Rollback retry vô tận hay giới hạn? Nếu giới hạn, làm gì khi rollback vẫn fail sau max retries?
3. Có nên thêm "circuit breaker cho rollback" riêng biệt?
