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

  /**
   * Initialize exchange connection
   */
  connect(): Promise<void>;

  /**
   * Fetch current ticker price
   */
  fetchTicker(symbol: string): Promise<number>;

  /**
   * Create a market order
   */
  createMarketOrder(symbol: string, side: 'buy' | 'sell', amount: number): Promise<IOrder>;

  /**
   * Fetch account balance
   */
  fetchBalance(): Promise<Record<string, IBalance>>;

  /**
   * Fetch order book for a symbol
   */
  fetchOrderBook(symbol: string, limit?: number): Promise<IOrderBook>;
}
