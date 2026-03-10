/**
 * Triangular Arbitrage Live Scanner — Detects profitable 3-pair cycles on the
 * same exchange. Example: USDT→BTC→ETH→USDT using BTC/USDT, ETH/BTC, ETH/USDT.
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface TriArbConfig {
  /** Base currency to start/end each cycle. Default 'USDT' */
  baseCurrency?: string;
  /** Minimum profit % to emit. Default 0.001 (0.1%) */
  minProfitPct?: number;
  /** Per-leg fee fraction. Default 0.001 (0.1%) */
  feePct?: number;
  /** Scan interval ms. Default 500 */
  scanIntervalMs?: number;
}

export interface TriArbCycle {
  exchange: string;
  /** Three symbol strings e.g. ['BTC/USDT', 'ETH/BTC', 'ETH/USDT'] */
  legs: [string, string, string];
  /** Three currency nodes e.g. ['USDT', 'BTC', 'ETH'] */
  currencies: [string, string, string];
}

export interface TriArbOpportunity {
  cycle: TriArbCycle;
  /** Net profit fraction, e.g. 0.003 = 0.3% */
  profitPct: number;
  /** Human readable path e.g. "USDT→BTC→ETH→USDT" */
  path: string;
  /** Effective rates for each leg [rate1, rate2, rate3] */
  prices: [number, number, number];
  timestamp: number;
}

interface TickData {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

interface ScannerStats {
  totalScans: number;
  opportunitiesFound: number;
  bestProfitPct: number;
}

// Parse "BASE/QUOTE" → [base, quote]
function parseSymbol(symbol: string): [string, string] | null {
  const parts = symbol.split('/');
  if (parts.length !== 2) return null;
  return [parts[0], parts[1]];
}

export class TriangularArbitrageLiveScanner extends EventEmitter {
  private readonly config: Required<TriArbConfig>;
  /** key: "exchange:symbol" */
  private priceBook = new Map<string, TickData>();
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private stats: ScannerStats = {
    totalScans: 0,
    opportunitiesFound: 0,
    bestProfitPct: 0,
  };
  /** Stale tick threshold — 10 seconds */
  private readonly staleMs = 10_000;

  constructor(config: TriArbConfig = {}) {
    super();
    this.config = {
      baseCurrency: config.baseCurrency ?? 'USDT',
      minProfitPct: config.minProfitPct ?? 0.001,
      feePct: config.feePct ?? 0.001,
      scanIntervalMs: config.scanIntervalMs ?? 500,
    };
  }

  /** Feed a price tick into the internal price book */
  onTick(tick: TickData): void {
    const key = `${tick.exchange}:${tick.symbol}`;
    this.priceBook.set(key, tick);
  }

  /**
   * Enumerate all valid 3-pair triangular cycles available in the price book.
   * Cycles start and end at baseCurrency: A→B→C→A
   */
  buildCycles(): TriArbCycle[] {
    const now = Date.now();

    // Group fresh ticks by exchange
    const byExchange = new Map<string, TickData[]>();
    for (const tick of this.priceBook.values()) {
      if (now - tick.timestamp >= this.staleMs) continue;
      const list = byExchange.get(tick.exchange) ?? [];
      list.push(tick);
      byExchange.set(tick.exchange, list);
    }

    const cycles: TriArbCycle[] = [];

    for (const [exchange, ticks] of byExchange) {
      // Build adjacency: currency → Set<currency> via available pairs
      // Also store which symbol connects two currencies
      const pairMap = new Map<string, string>(); // "A:B" → "BASE/QUOTE"

      for (const tick of ticks) {
        const parsed = parseSymbol(tick.symbol);
        if (!parsed) continue;
        const [base, quote] = parsed;
        // Both directions reachable
        pairMap.set(`${base}:${quote}`, tick.symbol);
        pairMap.set(`${quote}:${base}`, tick.symbol);
      }

      // Build adjacency list
      const adj = new Map<string, Set<string>>();
      for (const key of pairMap.keys()) {
        const [from, to] = key.split(':');
        if (!adj.has(from)) adj.set(from, new Set());
        adj.get(from)!.add(to);
      }

      const base = this.config.baseCurrency;
      const neighbors1 = adj.get(base);
      if (!neighbors1) continue;

      // Find cycles: base → B → C → base  (3 distinct currencies)
      for (const B of neighbors1) {
        if (B === base) continue;
        const neighbors2 = adj.get(B);
        if (!neighbors2) continue;

        for (const C of neighbors2) {
          if (C === base || C === B) continue;
          // Check C→base edge exists
          if (!adj.get(C)?.has(base)) continue;

          // Find the 3 actual pair symbols used
          const sym1 = this.findSymbol(exchange, base, B);
          const sym2 = this.findSymbol(exchange, B, C);
          const sym3 = this.findSymbol(exchange, C, base);

          if (!sym1 || !sym2 || !sym3) continue;

          cycles.push({
            exchange,
            legs: [sym1, sym2, sym3],
            currencies: [base, B, C],
          });
        }
      }
    }

    return cycles;
  }

  /**
   * Find a direct pair symbol in priceBook covering the two currencies.
   * Returns the symbol string if available (fresh), null otherwise.
   */
  private findSymbol(exchange: string, from: string, to: string): string | null {
    const now = Date.now();

    // Try BASE/QUOTE directly
    const direct = `${exchange}:${from}/${to}`;
    const directTick = this.priceBook.get(direct);
    if (directTick && now - directTick.timestamp < this.staleMs) return `${from}/${to}`;

    // Try reversed
    const reversed = `${exchange}:${to}/${from}`;
    const reversedTick = this.priceBook.get(reversed);
    if (reversedTick && now - reversedTick.timestamp < this.staleMs) return `${to}/${from}`;

    return null;
  }

  /**
   * Evaluate a cycle's profitability.
   * Leg semantics for A→B→C→A:
   *   Leg1 (get B using A): if pair is B/A → buy at ask; if pair is A/B → sell at bid (rate = bid)
   *   Leg2 (get C using B): if pair is C/B → buy at ask; if pair is B/C → sell at bid
   *   Leg3 (get A using C): if pair is A/C → buy at ask; if pair is C/A → sell at bid
   */
  evaluateCycle(cycle: TriArbCycle): TriArbOpportunity | null {
    const now = Date.now();
    const [A, B, C] = cycle.currencies;
    const fee = 1 - this.config.feePct;

    const rates: number[] = [];

    const legDefs: [string, string][] = [[A, B], [B, C], [C, A]];

    for (let i = 0; i < 3; i++) {
      const [from, to] = legDefs[i];
      const sym = cycle.legs[i];
      const parsed = parseSymbol(sym);
      if (!parsed) return null;

      const [symBase, symQuote] = parsed;
      const tickKey = `${cycle.exchange}:${sym}`;
      const tick = this.priceBook.get(tickKey);
      if (!tick || now - tick.timestamp >= this.staleMs) return null;

      let rate: number;

      if (symBase === to && symQuote === from) {
        // Pair is TO/FROM — buying TO with FROM, pay ask price in FROM per TO
        // We spend FROM, get TO. Rate = how much TO we get per 1 FROM = 1/ask
        rate = 1 / tick.ask;
      } else if (symBase === from && symQuote === to) {
        // Pair is FROM/TO — selling FROM for TO, receive bid price in TO per FROM
        // Rate = how much TO we get per 1 FROM = bid
        rate = tick.bid;
      } else {
        return null;
      }

      rates.push(rate);
    }

    // Apply fee on each of the 3 legs
    const product = rates[0] * rates[1] * rates[2] * fee * fee * fee;
    const profitPct = product - 1;

    if (profitPct <= this.config.minProfitPct) return null;

    const [A2, B2, C2] = cycle.currencies;
    return {
      cycle,
      profitPct,
      path: `${A2}→${B2}→${C2}→${A2}`,
      prices: [rates[0], rates[1], rates[2]],
      timestamp: now,
    };
  }

  /** Scan all cycles, emit 'opportunity' for profitable ones */
  scan(): TriArbOpportunity[] {
    this.stats.totalScans++;
    const cycles = this.buildCycles();
    const opportunities: TriArbOpportunity[] = [];

    for (const cycle of cycles) {
      const opp = this.evaluateCycle(cycle);
      if (!opp) continue;

      opportunities.push(opp);
      this.stats.opportunitiesFound++;

      if (opp.profitPct > this.stats.bestProfitPct) {
        this.stats.bestProfitPct = opp.profitPct;
      }

      this.emit('opportunity', opp);
    }

    logger.debug(`[TriArbScanner] Scan #${this.stats.totalScans}: ${cycles.length} cycles, ${opportunities.length} profitable`);
    return opportunities;
  }

  /** Start periodic scanning */
  start(intervalMs?: number): void {
    if (this.scanTimer) return;
    const ms = intervalMs ?? this.config.scanIntervalMs;
    this.scanTimer = setInterval(() => { this.scan(); }, ms);
    this.scanTimer.unref();
    logger.info(`[TriArbScanner] Started — interval ${ms}ms, base ${this.config.baseCurrency}`);
  }

  /** Stop periodic scanning */
  stop(): void {
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    logger.info('[TriArbScanner] Stopped');
  }

  getStats(): { totalScans: number; opportunitiesFound: number; bestProfitPct: number } {
    return { ...this.stats };
  }
}
