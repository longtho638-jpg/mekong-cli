/**
 * Order Book Depth Chart Visualization
 *
 * Generates depth chart data and ASCII visualizations for order book depth.
 */

import type { OrderBookSnapshot } from '../analysis/orderbook/types';

/**
 * Depth chart series data for visualization
 */
export interface DepthChartSeries {
  bids: Array<{ price: number; cumulative: number }>;
  asks: Array<{ price: number; cumulative: number }>;
}

/**
 * Generate depth chart data from order book snapshot
 *
 * @param snapshot - Order book snapshot
 * @param depth - Number of levels to include (default: all)
 */
export function generateDepthChartData(
  snapshot: OrderBookSnapshot,
  depth?: number
): DepthChartSeries {
  const bidDepth = depth ?? snapshot.bids.length;
  const askDepth = depth ?? snapshot.asks.length;

  return {
    bids: snapshot.bids.slice(0, bidDepth).map(level => ({
      price: level.price,
      cumulative: level.cumulativeSize,
    })),
    asks: snapshot.asks.slice(0, askDepth).map(level => ({
      price: level.price,
      cumulative: level.cumulativeSize,
    })),
  };
}

/**
 * Render ASCII depth chart
 *
 * Creates a terminal-friendly visualization of order book depth.
 *
 * @param snapshot - Order book snapshot
 * @param width - Chart width in characters (default: 80)
 * @param height - Chart height in lines (default: 20)
 */
export function renderDepthChartASCII(
  snapshot: OrderBookSnapshot,
  width = 80,
  height = 20
): string {
  const lines: string[] = [];

  // Header
  lines.push(`Order Book Depth: ${snapshot.tokenId}`);
  lines.push(`Mid: ${snapshot.midPrice.toFixed(4)} | Spread: ${snapshot.spreadBps.toFixed(1)} bps`);
  lines.push('');

  // Calculate max cumulative for scaling
  const maxBidCumul = snapshot.bids.length > 0 ? snapshot.bids[snapshot.bids.length - 1].cumulativeSize : 1;
  const maxAskCumul = snapshot.asks.length > 0 ? snapshot.asks[snapshot.asks.length - 1].cumulativeSize : 1;
  const maxCumul = Math.max(maxBidCumul, maxAskCumul);

  // Render asks (top half)
  lines.push('ASKS (SELL)');
  lines.push('─'.repeat(width));

  const askBars: string[] = [];
  for (let i = snapshot.asks.length - 1; i >= 0; i--) {
    const level = snapshot.asks[i];
    const barWidth = Math.round((level.cumulativeSize / maxCumul) * (width / 2 - 10));
    const bar = '█'.repeat(barWidth);
    const priceStr = level.price.toFixed(4).padStart(8);
    const sizeStr = level.size.toFixed(0).padStart(6);
    const cumulStr = level.cumulativeSize.toFixed(0).padStart(8);

    askBars.push(`${priceStr} │${sizeStr}│${cumulStr} │ ${bar}`);
  }

  // Pad asks to fill height
  while (askBars.length < height / 2) {
    askBars.push('         │      │         │');
  }

  lines.push(...askBars.slice(-Math.floor(height / 2)));

  // Mid line
  lines.push('─'.repeat(width));
  lines.push(`MID PRICE: ${snapshot.midPrice.toFixed(4)}`);
  lines.push('─'.repeat(width));

  // Render bids (bottom half)
  lines.push('BIDS (BUY)');

  const bidBars: string[] = [];
  for (let i = 0; i < Math.min(snapshot.bids.length, Math.floor(height / 2)); i++) {
    const level = snapshot.bids[i];
    const barWidth = Math.round((level.cumulativeSize / maxCumul) * (width / 2 - 10));
    const bar = '█'.repeat(barWidth);
    const priceStr = level.price.toFixed(4).padStart(8);
    const sizeStr = level.size.toFixed(0).padStart(6);
    const cumulStr = level.cumulativeSize.toFixed(0).padStart(8);

    bidBars.push(`${priceStr} │${sizeStr}│${cumulStr} │ ${bar}`);
  }

  lines.push(...bidBars);

  return lines.join('\n');
}

/**
 * Render compact depth summary (single line)
 */
export function renderDepthSummary(snapshot: OrderBookSnapshot, levels = 5): string {
  const bidTotal = snapshot.bids.slice(0, levels).reduce((s, l) => s + l.size, 0);
  const askTotal = snapshot.asks.slice(0, levels).reduce((s, l) => s + l.size, 0);

  const bidPrices = snapshot.bids.slice(0, 3).map(l => l.price.toFixed(2)).join('/');
  const askPrices = snapshot.asks.slice(0, 3).map(l => l.price.toFixed(2)).join('/');

  return `Bid[${levels}]: ${bidTotal.toFixed(0)} @ ${bidPrices} | Ask[${levels}]: ${askTotal.toFixed(0)} @ ${askPrices}`;
}
