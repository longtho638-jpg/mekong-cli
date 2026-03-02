/**
 * Zustand store for real-time trading data.
 * WebSocket updates flush here via buffered batches.
 */
import { create } from 'zustand';

export interface PriceTick {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

export interface Position {
  id: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  amount: number;
  pnl: number;
  status: 'open' | 'closed';
}

export interface SpreadOpportunity {
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  spreadPct: number;
  netProfitUsd: number;
  timestamp: number;
}

interface TradingState {
  prices: Record<string, PriceTick>;
  positions: Position[];
  spreads: SpreadOpportunity[];
  connected: boolean;
  updatePrices: (ticks: PriceTick[]) => void;
  setPositions: (positions: Position[]) => void;
  setSpreads: (spreads: SpreadOpportunity[]) => void;
  setConnected: (connected: boolean) => void;
}

export const useTradingStore = create<TradingState>((set) => ({
  prices: {},
  positions: [],
  spreads: [],
  connected: false,
  updatePrices: (ticks) =>
    set((state) => {
      const prices = { ...state.prices };
      for (const tick of ticks) {
        prices[`${tick.exchange}:${tick.symbol}`] = tick;
      }
      return { prices };
    }),
  setPositions: (positions) => set({ positions }),
  setSpreads: (spreads) => set({ spreads }),
  setConnected: (connected) => set({ connected }),
}));
