/**
 * Exchange abstraction types — order, balance, order book.
 * Implement IExchange to connect any CEX/DEX.
 */

export interface IOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price: number;
  status: 'open' | 'closed' | 'canceled';
  timestamp: number;
}

export interface IBalance {
  currency: string;
  free: number;
  used: number;
  total: number;
}

export interface IOrderBookEntry {
  price: number;
  amount: number;
}

export interface IOrderBook {
  symbol: string;
  bids: IOrderBookEntry[];
  asks: IOrderBookEntry[];
  timestamp: number;
}

export interface IExchange {
  name: string;
  connect(): Promise<void>;
  fetchTicker(symbol: string): Promise<number>;
  createMarketOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<IOrder>;
  fetchBalance(): Promise<Record<string, IBalance>>;
  fetchOrderBook(symbol: string, limit?: number): Promise<IOrderBook>;
}
