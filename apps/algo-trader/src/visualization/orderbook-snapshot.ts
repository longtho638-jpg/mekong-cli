/**
 * Order Book Snapshot ASCII Renderer
 *
 * Generates terminal-friendly ASCII visualizations of order book snapshots.
 */

import type { OrderBookSnapshot, OrderBookMetrics } from '../analysis/orderbook/types';

/**
 * Display format for order book snapshot
 */
export interface SnapshotDisplay {
  tokenId: string;
  timestamp: string;
  midPrice: number;
  spreadBps: number;
  imbalance: number;
}

/**
 * Character sets for bar rendering
 */
const BID_CHAR = '▓';
const ASK_CHAR = '░';

/**
 * Render order book snapshot as ASCII table
 *
 * @param snapshot - Order book snapshot
 * @param metrics - Computed metrics (optional)
 * @param width - Table width in characters (default: 80)
 */
export function renderOrderBookSnapshotASCII(
  snapshot: OrderBookSnapshot,
  metrics?: OrderBookMetrics,
  width = 80
): string {
  const lines: string[] = [];

  // Header
  const timestamp = new Date(snapshot.timestamp).toLocaleTimeString();
  lines.push(`╔══════════════════════════════════════════════════════════════════════════════╗`);
  lines.push(`║  Order Book: ${snapshot.tokenId.padEnd(50)} ${timestamp}  ║`);
  lines.push(`╠══════════════════════════════════════════════════════════════════════════════╣`);

  // Key metrics
  const midStr = snapshot.midPrice.toFixed(4);
  const spreadStr = snapshot.spread.toFixed(4);
  const spreadBpsStr = snapshot.spreadBps.toFixed(1);

  lines.push(`║  Mid: ${midStr.padEnd(10)} | Spread: ${spreadStr} (${spreadBpsStr.padEnd(5)} bps)                      `);

  if (metrics) {
    const imbalanceIndicator = metrics.imbalance > 0 ? '←' : metrics.imbalance < 0 ? '→' : '=';
    const imbalanceStr = `${imbalanceIndicator} ${Math.abs(metrics.imbalance).toFixed(2)}`;
    lines.push(`║  Imbalance: ${imbalanceStr.padEnd(10)} | Liquidity Score: ${metrics.liquidityScore.toString().padEnd(3)}/100                `);
  }

  lines.push(`╠══════════════════════════════════════════════════════════════════════════════╣`);

  // Column headers
  lines.push(`║  BIDS (BUY)                                         │  ASKS (SELL)                       ║`);
  lines.push(`║  Price     Size    Cumul       Bar                  │  Price     Size    Cumul       Bar ║`);
  lines.push(`╠──────────────────────────────────────────────────────┼────────────────────────────────────╣`);

  // Determine max cumulative for bar scaling
  const maxBidCumul = snapshot.bids.length > 0 ? snapshot.bids[snapshot.bids.length - 1].cumulativeSize : 1;
  const maxAskCumul = snapshot.asks.length > 0 ? snapshot.asks[snapshot.asks.length - 1].cumulativeSize : 1;
  const maxCumul = Math.max(maxBidCumul, maxAskCumul);
  const barWidth = 15;

  // Render rows (max 10 levels)
  const maxLevels = Math.max(snapshot.bids.length, snapshot.asks.length, 10);

  for (let i = 0; i < maxLevels; i++) {
    let line = '║  ';

    // Bid side
    if (i < snapshot.bids.length) {
      const bid = snapshot.bids[i];
      const barLength = Math.round((bid.cumulativeSize / maxCumul) * barWidth);
      const bar = BID_CHAR.repeat(barLength);

      const priceStr = bid.price.toFixed(4).padStart(8);
      const sizeStr = bid.size.toFixed(0).padStart(6);
      const cumulStr = bid.cumulativeSize.toFixed(0).padStart(8);

      line += `${priceStr} │${sizeStr}│${cumulStr} │ ${bar.padEnd(barWidth)}`;
    } else {
      line += '         │      │         │                 ';
    }

    line += ' │  ';

    // Ask side
    if (i < snapshot.asks.length) {
      const ask = snapshot.asks[i];
      const barLength = Math.round((ask.cumulativeSize / maxCumul) * barWidth);
      const bar = ASK_CHAR.repeat(barLength);

      const priceStr = ask.price.toFixed(4).padStart(8);
      const sizeStr = ask.size.toFixed(0).padStart(6);
      const cumulStr = ask.cumulativeSize.toFixed(0).padStart(8);

      line += `${priceStr} │${sizeStr}│${cumulStr} │ ${bar.padEnd(barWidth)}`;
    } else {
      line += '         │      │         │                 ';
    }

    line += '  ║';
    lines.push(line);
  }

  lines.push(`╚══════════════════════════════════════════════════════════════════════════════╝`);

  // Liquidity zones (if metrics provided)
  if (metrics && metrics.concentrationZones.length > 0) {
    lines.push('');
    lines.push('Liquidity Zones:');

    const topZones = metrics.concentrationZones.slice(0, 5);
    for (const zone of topZones) {
      const side = zone.side === 'BUY' ? 'BID' : 'ASK';
      const sigBar = '█'.repeat(Math.round(zone.significance * 20));
      lines.push(`  ${side} @ ${zone.price.toFixed(4)}: ${zone.totalSize.toFixed(0)} shares ${sigBar}`);
    }
  }

  return lines.join('\n');
}

/**
 * Render compact order book summary (single line)
 */
export function renderOrderBookCompact(snapshot: OrderBookSnapshot): string {
  const bestBid = snapshot.bids[0]?.price.toFixed(4) ?? 'N/A';
  const bestAsk = snapshot.asks[0]?.price.toFixed(4) ?? 'N/A';
  const bidSize = snapshot.bids[0]?.size.toFixed(0) ?? '0';
  const askSize = snapshot.asks[0]?.size.toFixed(0) ?? '0';

  return `${snapshot.tokenId}: ${bestBid}/${bestAsk} (${bidSize}x${askSize}) | Spread: ${snapshot.spreadBps.toFixed(1)}bps`;
}

/**
 * Render imbalance indicator
 */
export function renderImbalanceIndicator(imbalance: number): string {
  const arrows = ['←←←', '←←', '←', '↔', '→', '→→', '→→→'];
  const index = Math.min(
    Math.max(0, Math.round((imbalance + 1) * 3)),
    arrows.length - 1
  );
  return arrows[index];
}
