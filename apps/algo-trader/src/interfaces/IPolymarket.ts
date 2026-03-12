/**
 * Polymarket-specific types for binary prediction markets
 */

import { ISignal, SignalType } from '../interfaces/ISignal';

/**
 * Polymarket signal types
 */
export enum PolymarketSignalType {
  BUY_YES = 'BUY_YES',     // Buy YES shares
  BUY_NO = 'BUY_NO',       // Buy NO shares
  SELL_YES = 'SELL_YES',   // Sell YES shares
  SELL_NO = 'SELL_NO',     // Sell NO shares
  CANCEL = 'CANCEL',       // Cancel open orders
  NONE = 'NONE',
}

/**
 * Polymarket signal with market context
 */
export interface IPolymarketSignal extends Omit<ISignal, 'type' | 'timestamp'> {
  type: PolymarketSignalType;
  tokenId: string;         // Conditional token ID
  marketId: string;        // Market/condition ID
  side: 'YES' | 'NO';      // Which outcome
  action: 'BUY' | 'SELL' | 'CANCEL';
  price: number;           // Price per share (0.00-1.00)
  size: number;            // Number of shares
  expectedValue?: number;  // Expected value edge
  confidence?: number;     // 0.0-1.0 confidence score
  catalyst?: string;       // What triggered the signal
  expiresAt?: number;      // Signal expiration timestamp
  metadata: {
    marketQuestion?: string;
    outcomePrices?: number[];
    volume?: number;
    liquidity?: number;
    endDate?: string;
    [key: string]: string | number | number[] | undefined;
  };
  timestamp?: number;
}

/**
 * Market data for Polymarket binary options
 */
export interface IMarketTick {
  tokenId: string;
  marketId: string;
  yesPrice: number;
  noPrice: number;
  yesBid: number;
  yesAsk: number;
  spread: number;
  volume: number;
  liquidity: number;
  timestamp: number;
}

/**
 * Position in a Polymarket
 */
export interface IPolymarketPosition {
  tokenId: string;
  marketId: string;
  side: 'YES' | 'NO';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  openedAt: number;
}

/**
 * Order in a Polymarket
 */
export interface IPolymarketOrder {
  orderId: string;
  tokenId: string;
  marketId: string;
  side: 'YES' | 'NO';
  action: 'BUY' | 'SELL';
  price: number;
  size: number;
  status: 'pending' | 'live' | 'matched' | 'cancelled' | 'expired';
  createdAt: number;
  filledSize?: number;
  avgFillPrice?: number;
}
