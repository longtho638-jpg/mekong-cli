# Algo-Trader Knowledge Synthesis

**Date:** 2026-02-23
**Context:** Synthesis of learnings from recent testing and debugging missions covering `BollingerBandStrategy`, `MacdCrossoverStrategy`, and `indicators` modules.

---

## 1. Jest Mocking for Static Methods (Algorithmic Indicators)

**GOTCHA:**
When testing trading strategies that rely on deterministic mathematical indicators (like MACD or Bollinger Bands), you often need to simulate extreme edge cases (e.g., indicator utility functions returning empty arrays due to bad data or initialization errors).

**LEARNING:**
You can dynamically mock static methods of imported utility classes within a specific Jest test block, ensuring that you isolate the edge case without breaking the pure implementation for subsequent tests.

**Actionable Pattern:**
```typescript
// Dynamically require and mock the static method
const { Indicators } = require('../analysis/indicators');
const originalMacd = Indicators.macd;
Indicators.macd = jest.fn().mockReturnValue([]);

// Execute the test scenario
const result = await strategy.onCandle(candle);
expect(result).toBeNull();

// CRITICAL: Always restore the original method
Indicators.macd = originalMacd;
```

## 2. Time-Series Buffer Limits (Memory Management)

**GOTCHA:**
Trading bots running 24/7 will process thousands of tick/candle events. If a strategy indiscriminately appends every new candle to its local state (`this.candles.push(candle)`), it will rapidly consume RAM, leading to an eventual Out-Of-Memory (OOM) crash.

**LEARNING:**
Implement a strict FIFO buffer limit inside the `onCandle` handler to maintain only the rolling window of history required by the indicators.

**Actionable Pattern:**
```typescript
this.candles.push(candle);

// Trim the buffer (e.g., keep only the last 200 or 300 candles)
if (this.candles.length > 200) {
  this.candles.shift();
}
```
*Rule of Thumb:* The buffer size limit MUST be strictly greater than the maximum period required by any indicator logic (e.g., MACD slow period 26 + signal period 9 requires a minimum of 35 candles, so a buffer of 300 is safe).

## 3. Edge Case Handling & Strategy Initialization

**GOTCHA:**
Strategies crash or emit false signals if they calculate indicators before accumulating sufficient historical data. Additionally, cross-over indicators (like MACD) require the *previous* state to determine if a line has "crossed" the signal line.

**LEARNING:**
1. **Min Required Guard:** Always check `candles.length < minRequired` before processing calculations.
2. **Warm-up Phase:** Initialize and "warm up" past indicator states (like `this.prevMacd`) inside the `init(history)` method so that crossover logic functions correctly on the very first live candle.
3. **Undefined Checks:** Indicator libraries often pad the beginning of arrays with `undefined` values. Explicitly verify properties exist before comparing them.

**Actionable Pattern:**
```typescript
// 1. Guard against insufficient data
const minRequired = this.slowPeriod + this.signalPeriod + 1;
if (this.candles.length < minRequired) return null;

// 2. Strict Crossover Comparison (checking for undefined)
if (prev.MACD !== undefined && prev.signal !== undefined &&
    current.MACD !== undefined && current.signal !== undefined &&
    prev.MACD <= prev.signal && current.MACD > current.signal) {
  // Trigger Bullish Crossover
}
```

## 4. Structured Signals & Type Safety

**GOTCHA:**
Returning bare `BUY` or `SELL` signals makes it incredibly difficult to debug *why* a bot executed a trade, especially when a single strategy might have multiple entry/exit conditions. Furthermore, missing interface definitions will cause build failures during test execution (e.g., `TS2339: Property 'tag' does not exist on type 'ISignal'`).

**LEARNING:**
- Include descriptive tags (e.g., `tag: 'macd_bullish_crossover'`, `tag: 'bb_lower_rsi_oversold'`) inside the generated signal.
- Attach indicator snapshots via a `metadata` payload to maintain an audit trail of the mathematical state at the exact moment the signal was emitted.
- **Action Item:** Ensure `ISignal` interface in `src/interfaces/IStrategy.ts` is updated to include `tag?: string;` to satisfy TypeScript checks during CI pipelines.

## 5. Risk Management & Trailing Stops

**GOTCHA:**
Khi triển khai trailing stop trong thị trường crypto biến động mạnh, việc update trailing stop liên tục theo từng nhịp tick nhỏ có thể khiến lệnh bị quét (stop hunted) quá sớm trước khi xu hướng thực sự hình thành.

**LEARNING:**
1. **Positive Offset Activation:** Trailing stop chỉ nên bắt đầu bám sát (tighten) khi giá đã vượt qua một ngưỡng lợi nhuận nhất định (`trailingStopPositiveOffset`). Trước đó, nó nên giữ một khoảng cách an toàn (default offset) để tránh bị nhiễu.
2. **State Immutability:** Hàm `updateTrailingStop` cần trả về một bản copy mới của state (`nextState = { ...state }`) thay vì mutate trực tiếp object truyền vào. Điều này giúp ngăn chặn các side-effects không mong muốn khi test hoặc khi áp dụng cho nhiều position cùng lúc.
3. **Validation Guard:** Tính toán position size (`calculatePositionSize`) bắt buộc phải có guard kiểm tra `currentPrice > 0` và `riskPercentage > 0` để tránh các lỗi chia cho 0 hoặc tính toán sai quy mô vốn (position sizing).

**Actionable Pattern:**
```typescript
// Chỉ kích hoạt trailing stop bám sát khi giá đã lãi trên mức offset
if (!isPositiveActive && price >= state.entryPrice * (1 + config.trailingStopPositiveOffset)) {
  isPositiveActive = true;
  nextState.isPositiveActive = true;
}
```

## 6. Lỗi Logic Triangular Arbitrage (Chênh Lệch Tam Giác)

**GOTCHA:**
Khi tính toán chuỗi giao dịch tam giác (ví dụ: USDT -> BTC -> ETH -> USDT), việc nhầm lẫn giữa tỷ giá nhân (multiply) và tỷ giá chia (divide) giữa các cặp (base/quote) sẽ dẫn đến tính toán profit sai lệch hoàn toàn, khiến bot vào lệnh lỗ.

**LEARNING:**
1. **Xác Định Rõ Base/Quote:** Đối với cặp `ETH/BTC`, giá là số lượng BTC để mua 1 ETH.
   - Nếu có BTC, muốn đổi ra ETH: `amountETH = amountBTC / priceETH_BTC`
   - Nếu có ETH, muốn đổi ra BTC: `amountBTC = amountETH * priceETH_BTC`
2. **Tính Toán Forward & Backward Loops:**
   - **Forward (USDT -> BTC -> ETH -> USDT):** Mua BTC bằng USDT -> Mua ETH bằng BTC -> Bán ETH lấy USDT. Rate = `(1 / priceBTC_USDT / priceETH_BTC) * priceETH_USDT`.
   - **Backward (USDT -> ETH -> BTC -> USDT):** Mua ETH bằng USDT -> Bán ETH lấy BTC -> Bán BTC lấy USDT. Rate = `(1 / priceETH_USDT) * priceETH_BTC * priceBTC_USDT`.
3. **Kiểm Tra Null/Undefined:** Luôn kiểm tra metadata chứa giá của các cặp phụ (`priceETH_BTC`, `priceETH_USDT`) trước khi tính toán.

**Actionable Pattern:**
```typescript
const forwardRate = (1 / priceBTC_USDT / priceETH_BTC) * priceETH_USDT;
const forwardProfit = forwardRate - 1;

if (forwardProfit > this.minProfit) {
  // Thực thi Forward Loop Arbitrage
}
```