# Phase 3: CLI Dashboard & Paper Trading Integration

## Context Links
- [plan.md](./plan.md) — Overview
- [Phase 1] `./phase-01-core-arbitrage-engine.md` — WebSocket feed, atomic executor
- [Phase 2] `./phase-02-raas-api-multi-tenant.md` — API routes, position tracker
- [PaperTradingEngine] `src/core/paper-trading-engine.ts`
- [CliDashboard] `src/ui/CliDashboard.ts`
- [ConsoleReporter] `src/reporting/ConsoleReporter.ts`
- [WebSocket Server] `src/core/websocket-server.ts`
- [arb:agi command] `src/cli/arb-agi-auto-execution-commands.ts`

## Overview
- **Priority:** P2
- **Effort:** 3h
- **Status:** Pending
- **Depends on:** Phase 1 (WebSocket feed, atomic executor), Phase 2 (position tracker)
- **Description:** Rich CLI dashboard hien thi real-time P&L, paper trading mode chay full arb pipeline, trade history export.

## Key Insights
- PaperTradingEngine da implement IExchange interface — drop-in replacement cho live exchange
- PaperTradingEngine chua ket noi voi arb pipeline (chi dung cho BotEngine single-exchange)
- Hien tai chi co winston logger output — khong co structured dashboard
- chalk da co trong dependencies — dung cho colored terminal output
- `src/ui/CliDashboard.ts` da co nhung basic — can nang cap cho arb-specific

## Requirements

### Functional
1. CLI dashboard real-time: P&L, active positions, spread opportunities, circuit breaker status
2. Paper trading mode: full arb pipeline (scan → score → validate → execute) voi virtual balances
3. `--paper` flag tren arb:agi va arb:auto commands
4. Trade history export: CSV va JSON format
5. Alert khi phat hien opportunity (terminal bell + colored output)

### Non-Functional
- Dashboard refresh rate: 1s (configurable)
- Paper trading phai simulate slippage + fees chinh xac
- Export file < 1s cho 10,000 trades
- Terminal width responsive (min 80 cols)

## Architecture

```
[arb:agi --paper --dashboard]
        |
        v
[PaperTradingArbBridge]           <-- new
  - Wrap 2x PaperTradingEngine (buy exchange + sell exchange)
  - Route arb orders to correct paper engine
  - Aggregate P&L across both sides
        |
        v
[ArbCliDashboard]                  <-- new
  - Render: spreads table, positions, P&L, regime, circuit breaker
  - Refresh every 1s
  - chalk colors: green=profit, red=loss, yellow=warning
        |
        v
[ArbTradeHistoryExporter]         <-- new
  - Export to CSV/JSON
  - Filter by date range, symbol
```

## Related Code Files

### Files to CREATE
| File | Purpose |
|------|---------|
| `src/execution/paper-trading-arbitrage-bridge.ts` | Bridge 2 paper engines cho arb buy/sell |
| `src/ui/arbitrage-cli-realtime-dashboard.ts` | Rich CLI dashboard cho arb monitoring |
| `src/reporting/arbitrage-trade-history-exporter.ts` | Export trades CSV/JSON |
| `tests/execution/paper-trading-arbitrage-bridge.test.ts` | Tests cho paper arb bridge |
| `tests/ui/arbitrage-cli-realtime-dashboard.test.ts` | Tests cho dashboard rendering |
| `tests/reporting/arbitrage-trade-history-exporter.test.ts` | Tests cho exporter |

### Files to MODIFY
| File | Change |
|------|--------|
| `src/cli/arb-agi-auto-execution-commands.ts` | Them `--paper`, `--dashboard`, `--export` flags |
| `src/cli/arb-cli-commands.ts` | Register export command `arb:export` |
| `src/index.ts` | Register new arb:export command |

## Implementation Steps

### Step 1: Paper Trading Arbitrage Bridge (1h)

1. Tao `src/execution/paper-trading-arbitrage-bridge.ts`
2. Design:
   ```typescript
   interface PaperArbConfig {
     exchanges: string[];          // ['binance', 'okx', 'bybit']
     initialBalancePerExchange: number; // USD per exchange
     slippagePct?: number;
     feeRate?: number;
   }

   class PaperTradingArbBridge {
     private engines: Map<string, PaperTradingEngine>;

     constructor(config: PaperArbConfig);

     /** Execute paper arb: buy on exchangeA, sell on exchangeB */
     async executeArb(params: {
       symbol: string;
       buyExchange: string;
       sellExchange: string;
       amount: number;
       buyPrice: number;
       sellPrice: number;
     }): Promise<PaperArbResult>;

     /** Update prices across all paper engines */
     updatePrices(ticks: Map<string, number>): void;

     /** Aggregate P&L across all engines */
     getAggregatedPnl(): { realized: number; unrealized: number; total: number; perExchange: Record<string, PaperPnl> };

     /** Get all positions across exchanges */
     getAllPositions(): PaperPosition[];

     /** Get combined trade history */
     getCombinedHistory(): PaperTrade[];

     /** Reset all engines */
     reset(): void;
   }
   ```
3. Moi exchange co PaperTradingEngine rieng voi initial balance
4. `executeArb()` goi `buyEngine.createMarketOrder('buy')` + `sellEngine.createMarketOrder('sell')`
5. Price feed tu Phase 1 WebSocketPriceFeedManager → `updatePrices()`
6. Viet tests: multi-exchange paper execution, P&L aggregation, reset

### Step 2: Arbitrage CLI Real-time Dashboard (1h)

1. Tao `src/ui/arbitrage-cli-realtime-dashboard.ts`
2. Layout (80+ cols terminal):
   ```
   ╔══════════════════════════════════════════════════════════════╗
   ║  AGI ARBITRAGE DASHBOARD          [PAPER MODE] 14:32:05    ║
   ╠══════════════════════════════════════════════════════════════╣
   ║  REGIME: trending (87%)  │  KELLY: 3.2%  │  CIRCUIT: OK    ║
   ╠══════════════════════════════════════════════════════════════╣
   ║  TOP SPREADS                                                ║
   ║  BTC/USDT  binance→okx    +0.12%  $12.50  [PROFITABLE]     ║
   ║  ETH/USDT  bybit→binance  +0.08%  $3.20   [BELOW THRESH]  ║
   ╠══════════════════════════════════════════════════════════════╣
   ║  POSITIONS (2 active)                                       ║
   ║  #1  BTC  buy@binance sell@okx  +$8.30  +0.08%             ║
   ╠══════════════════════════════════════════════════════════════╣
   ║  P&L: +$142.50 realized │ +$8.30 unrealized │ 23 trades    ║
   ║  Win: 78% │ Avg: +$6.19 │ MaxDD: -$45.00 │ Sharpe: 1.82   ║
   ╚══════════════════════════════════════════════════════════════╝
   ```
3. Dung chalk cho colors:
   - `chalk.green()` — profit, profitable spread
   - `chalk.red()` — loss, circuit breaker tripped
   - `chalk.yellow()` — warnings, below threshold
   - `chalk.cyan()` — info, headers
4. Clear screen + redraw moi 1s: `process.stdout.write('\x1B[2J\x1B[H')`
5. Accept data tu: AgiArbitrageEngine stats, PaperArbBridge P&L, spread results
6. Interface:
   ```typescript
   class ArbCliDashboard {
     constructor(refreshMs?: number); // default 1000
     start(): void;
     stop(): void;
     updateSpreads(spreads: SpreadResult[]): void;
     updatePositions(positions: ArbPosition[]): void;
     updatePnl(pnl: PaperPnl): void;
     updateEngineStats(stats: AgiStats): void;
     setPaperMode(enabled: boolean): void;
   }
   ```
7. Viet tests: test rendering output (capture stdout), test data update

### Step 3: Trade History Exporter (0.5h)

1. Tao `src/reporting/arbitrage-trade-history-exporter.ts`
2. Formats:
   - **CSV:** header row + data rows, comma-separated
   - **JSON:** array of trade objects, pretty-printed
3. Interface:
   ```typescript
   interface ExportOptions {
     format: 'csv' | 'json';
     outputPath: string;
     filterSymbol?: string;
     startDate?: number;
     endDate?: number;
   }

   async function exportArbHistory(
     trades: PaperTrade[] | ArbPosition[],
     options: ExportOptions
   ): Promise<{ path: string; count: number }>;
   ```
4. CSV columns: id, timestamp, symbol, buyExchange, sellExchange, buyPrice, sellPrice, amount, netSpreadPct, pnl, fee, status
5. Dung `fs.createWriteStream` cho large exports (>1000 trades)
6. Viet tests: test CSV output format, JSON output, filter, empty input

### Step 4: CLI Command Integration (0.5h)

1. Update `src/cli/arb-agi-auto-execution-commands.ts`:
   ```typescript
   .option('--paper', 'Enable paper trading mode (no real orders)')
   .option('--dashboard', 'Show real-time CLI dashboard')
   .option('--export <format>', 'Export history on exit (csv/json)')
   .option('--export-path <path>', 'Export file path', './arb-history')
   ```
2. Khi `--paper`:
   - Tao PaperTradingArbBridge thay vi real exchange clients
   - Skip API key validation
   - Hien thi `[PAPER MODE]` tren dashboard
3. Khi `--dashboard`:
   - Tao ArbCliDashboard, wire vao engine events
   - Disable winston console transport (tranh conflict)
4. Khi `--export`:
   - On shutdown (SIGINT), export history truoc khi exit
5. Register `arb:export` command rieng:
   ```
   arb:export --format csv --path ./exports/trades.csv --days 7
   ```

## Todo List

- [ ] Tao PaperTradingArbBridge voi multi-exchange paper engines
- [ ] Tao ArbCliDashboard voi chalk rendering
- [ ] Tao ArbTradeHistoryExporter (CSV + JSON)
- [ ] Them `--paper`, `--dashboard`, `--export` flags vao arb:agi
- [ ] Register `arb:export` CLI command
- [ ] Viet tests cho bridge, dashboard, exporter
- [ ] `tsc --noEmit` pass, 0 `any` types
- [ ] Chay `npm test` — tat ca tests pass

## Success Criteria
- `arb:agi --paper` chay full pipeline voi virtual balance, khong can API keys
- Dashboard render dung, refresh 1s, responsive >= 80 cols
- Paper P&L phan anh chinh xac fee + slippage
- Export CSV/JSON file voi dung format, dung data
- `arb:export --format csv --path ./out.csv` xuat file thanh cong
- 0 regression tren tests hien tai

## Risk Assessment
- **Terminal compatibility:** Khong phai tat ca terminal support ANSI escape codes. Mitigation: detect va fallback plain text
- **Dashboard vs logger conflict:** Dashboard clear screen xoa logger output. Mitigation: disable console logger khi dashboard on
- **Paper trading accuracy:** Slippage simulation khong 100% chinh xac so voi live. Mitigation: configurable slippage, warn user

## Security
- Paper mode khong goi exchange API — an toan
- Export files luu local, khong upload
- Khong log API keys trong dashboard output

## Next Steps
- Phase future: persist trade history vao Redis/TimescaleDB
- Phase future: web dashboard (React) thay vi CLI
- Phase future: Telegram alert bot khi detect profitable spread
