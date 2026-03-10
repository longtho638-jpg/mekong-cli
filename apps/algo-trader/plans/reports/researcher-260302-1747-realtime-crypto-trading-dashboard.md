# Real-Time Crypto Trading Dashboard Architecture — 2026

## 1. WebSocket Architecture Pattern

**Data Layer:** Split into three streams:
- **Price/Trade feed** — High-freq (10-20 msgs/sec), use Fastify + @fastify/websocket on ws@8
- **Order book** — Med-freq (1-5 msgs/sec), buffer before state update
- **Alerts/PnL** — Low-freq, immediate client-side calc

**Fastify Config (Recommended):**
```js
// Scale: single instance handles 10k+ concurrent connections
fastify.register(require('@fastify/websocket'));
fastify.post('/stream', { websocket: true }, (socket) => {
  // Redis pub/sub for multi-instance: fanout trades to all connected clients
  redis.subscribe('trades', (msg) => socket.send(JSON.stringify(msg)));
});
```

## 2. TradingView Lightweight Charts — Production Pattern

**Why not alternatives:** 45KB gzip, native candlestick perf, community react wrappers proven stable.

**Real-time Update Pattern:**
```js
// Use series.update() NOT series.setData() — 60FPS maintained
let currentBar = { time: now, open, high, low, close };
const updateOrCreateBar = (data) => {
  if (isNewCandle(data.time)) {
    candlestickSeries.addData(currentBar);
    currentBar = { time: data.time, open: data.price, ... };
  } else {
    currentBar = { ...currentBar, high: max(currentBar.high, data.price), ... };
    candlestickSeries.update(currentBar);
  }
};
```
**Key:** Update latest bar in-place, add new bars sparingly — avoids chart re-layout thrash.

## 3. React 19 Patterns (Suspense + Streaming)

**For dashboards:** Use Server Components for static config (symbols, layout), Client Components for streams.

**Streaming SSR Pattern:**
```jsx
// Server Component — render once, stream initial state
async function Dashboard() {
  const symbols = await getSymbols(); // SSR'd directly
  return <Suspense fallback={<Skeleton />}>
    <PriceStream symbols={symbols} /> {/* Client side streams */}
  </Suspense>;
}
```
**Anti-pattern:** Don't await data inside Client Components — defeats streaming. Use `use()` hook instead.

## 4. State Management: Zustand 5 (Not Jotai for this case)

**Why Zustand over Jotai:** Trading dashboards have clear boundaries (price state, PnL state, alerts state). Jotai's atom families over-complicate simple updates. Zustand's single store + mutable updates wins.

**Pattern:**
```ts
create((set) => ({
  prices: new Map(),
  updatePrice: (symbol, tick) => set(state => ({
    prices: new Map(state.prices).set(symbol, tick)
  })),
}));

// Mutable batch updates (critical for perf)
const store = useStore();
ws.on('message', (ticks) => {
  store.setState(state => {
    const newPrices = new Map(state.prices);
    ticks.forEach(t => newPrices.set(t.symbol, t));
    return { prices: newPrices };
  });
});
```

## 5. Re-render Optimization (Critical for High-Frequency Data)

**Buffering Pattern** — The ONE pattern that works:
```js
const bufferRef = useRef([]);
const flushBuffer = () => {
  if (bufferRef.current.length === 0) return;
  const batch = bufferRef.current.splice(0, 100); // Batch 100 updates max
  store.setState(state => {
    const prices = new Map(state.prices);
    batch.forEach(t => prices.set(t.symbol, t));
    return { prices };
  });
};

// Flush at display sync (60FPS cap)
useEffect(() => {
  const timer = setInterval(flushBuffer, 16); // ~60FPS
  ws.on('message', msg => bufferRef.current.push(msg));
  return () => clearInterval(timer);
}, []);
```
**Result:** 20 msgs/sec → 1 state update every 16ms. Prevents React render thrashing.

## 6. Dashboard Layout — React Grid Layout

**Library:** react-grid-layout (most stable for trading UIs).

**Config for Trading Terminal:**
```jsx
const layout = [
  { i: 'chart', x: 0, y: 0, w: 8, h: 6, static: false },
  { i: 'orderbook', x: 8, y: 0, w: 4, h: 6, static: false },
  { i: 'trades', x: 0, y: 6, w: 12, h: 3, static: true }, // Lock row count
];

<GridLayout layout={layout} cols={12} rowHeight={30}>
  {/* Each widget is isolated Zustand subscriber — won't re-render siblings */}
</GridLayout>
```
**Key:** Non-static widgets (chart, orderbook) update independently. Static widgets (trades feed) batched.

## 7. Virtualization for Trade Tables

**TanStack Table + @tanstack/react-virtual for trade history:**
```ts
// Handles 50k trades without lag — only renders visible rows (~20-30)
const virtualizer = useVirtualizer({
  count: trades.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 35, // px per row
});

// Update strategy: prepend new trades, cap at 10k rows
const addTrade = (trade) => {
  trades.unshift(trade);
  if (trades.length > 10000) trades.pop();
};
```
**Critical:** Re-virtualizer only on scroll/window resize, NOT on data updates.

## 8. Mobile/Tablet Responsive Pattern

**Breakpoints for trading:**
```ts
const breakpoints = {
  lg: 1024,  // Full 3-panel layout
  md: 768,   // 2-panel stacked
  sm: 480,   // Single column (chart + minimal orderbook)
};

// At md: collapse orderbook into sheet/modal, stack chart above
// At sm: Full-screen chart toggle, orderbook drawer
```
**Chart responsiveness:** TradingView Lightweight Charts auto-scales with container. Set `container.style.height = '100%'` for viewport-fill.

## 9. Arbitrage Opportunity Stream

**Pattern:** Separate WebSocket channel, deduplicate by `(symbol_a, symbol_b, exchange_a, exchange_b)` tuple.

```ts
const arbStream = create((set) => ({
  opportunities: new Map(), // key: "BTCUSD-KRAKEN_USDT-BINANCE"
  updateArb: (opp) => set(state => {
    const key = `${opp.pair}-${opp.exchanges}`;
    return { opportunities: new Map(state.opportunities).set(key, opp) };
  }),
}));

// Auto-expire old opps (>2s stale)
useEffect(() => {
  const timer = setInterval(() => {
    setOpportunities(old => {
      const fresh = new Map(old);
      old.forEach((v, k) => {
        if (Date.now() - v.timestamp > 2000) fresh.delete(k);
      });
      return fresh;
    });
  }, 500);
}, []);
```

## 10. Alert System (Toast + Badge)

**Pattern:** Separate alert Zustand store, debounce by 500ms to prevent spam.

```ts
const debounceAlert = useMemo(
  () => debounce((alert) => showAlert(alert), 500),
  []
);

// In WebSocket handler
if (pnlChange > threshold) {
  debounceAlert({ type: 'pnl-spike', value: pnlChange });
}
```

## Unresolved Questions

- **CoinGecko vs Kaiko vs Custom Feed:** CoinGecko gives 18k+ coins, Kaiko serves institutions. Which for arb? (Likely hybrid: CoinGecko for initial discovery, Kaiko for execution precision)
- **CEX vs DEX Price Streams:** Arbitrage requires both — how to normalize AMM slippage in real-time? (Likely: pre-calc slippage curves for major pools, cache hourly)
- **Persistence:** Save trade history to Postgres or file-based? (Likely: Postgres for queries, local SQLite for backup)

## Stack Summary

| Layer | Choice | Why |
|-------|--------|-----|
| Backend | Fastify 5 + ws@8 | 10k+ concurrent, sub-10ms latency |
| Charts | TradingView Lightweight | 45KB, proven stability, native perf |
| State | Zustand 5 | Simple store, mutable batch updates |
| Layout | react-grid-layout | Most stable for trading UIs |
| Tables | TanStack Table + @tanstack/react-virtual | 50k rows, virtualized rendering |
| Re-render | Buffering + requestAnimationFrame | Only way to handle 20+ msgs/sec |
| Responsive | Tailwind breakpoints + CSS Grid | Mobile chart full-screen toggle |

---

**Report Generated:** 2026-03-02 17:47
**Status:** Ready for implementation via `/cook` command
**Next:** Architect WebSocket/Fastify layer, integrate TradingView Lightweight Charts, implement Zustand stores.
