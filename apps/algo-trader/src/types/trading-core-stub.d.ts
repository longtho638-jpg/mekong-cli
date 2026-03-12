/**
 * Module stubs for @agencyos/trading-core
 * Used for TypeScript compilation when package is not available
 */

declare module '@agencyos/trading-core/exchanges' {
  export interface IExchange {
    name: string;
    fetchTicker(symbol: string): Promise<any>;
    fetchOrderBook(symbol: string): Promise<any>;
    createOrder(symbol: string, type: string, side: string, amount: number, price?: number): Promise<any>;
    createMarketOrder(symbol: string, side: string, amount: number): Promise<any>;
    fetchBalance(): Promise<any>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    [key: string]: any;
  }

  export class ExchangeClientBase {
    constructor(config?: any);
    name: string;
    fetchTicker(symbol: string): Promise<any>;
    fetchOrderBook(symbol: string): Promise<any>;
    createOrder(symbol: string, type: string, side: string, amount: number, price?: number, ...args: any[]): Promise<any>;
    createMarketOrder(symbol: string, side: string, amount: number): Promise<any>;
    fetchBalance(): Promise<any>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    [key: string]: any;
  }

  export class BinanceAdapter extends ExchangeClientBase {
    constructor(config?: any, ...args: any[]);
  }

  export class OkxAdapter extends ExchangeClientBase {
    constructor(config?: any, ...args: any[]);
  }

  export class BybitAdapter extends ExchangeClientBase {
    constructor(config?: any, ...args: any[]);
  }

  export class ExchangeFactory {
    static createExchange(name: string, config: any): IExchange;
  }

  export const exchanges: {
    Binance: new (config: any) => IExchange;
    Coinbase: new (config: any) => IExchange;
    Kraken: new (config: any) => IExchange;
  };
}

declare module '@agencyos/trading-core/arbitrage' {
  export interface ArbitrageOpportunity {
    id: string;
    symbol: string;
    buyExchange: string;
    sellExchange: string;
    spread: number;
    profit: number;
    timestamp: number;
    buyPrice: number;
    sellPrice: number;
    spreadPercent: number;
    netProfitPercent: number;
    estimatedProfitUsd: number;
    [key: string]: any;
  }

  export interface ArbitrageConfig {
    minProfit?: number;
    maxInvestment?: number;
    exchanges?: string[];
    symbols?: string[];
    minSpreadPercent?: number;
    pollIntervalMs?: number;
    positionSizeUsd?: number;
    [key: string]: any;
  }

  export interface ExchangeConfig {
    name: string;
    apiKey?: string;
    secret?: string;
    [key: string]: any;
  }

  export class AgiArbitrageEngine {
    constructor(config?: any, ...args: any[]);
    execute(): Promise<any>;
    init(): void;
    start(): void;
    stop(): void;
    getStats(): any;
    getProfitSummary(): any;
    [key: string]: any;
  }

  export class SpreadDetectorEngine {
    constructor(config?: any, ...args: any[]);
    init(): void;
    start(): void;
    stop(): void;
    getStats(): any;
    getProfitSummary(): any;
    [key: string]: any;
  }

  export class ArbitrageOrchestrator {
    constructor(config?: any, ...args: any[]);
    init(): void;
    start(): void;
    stop(): void;
    getStats(): any;
    [key: string]: any;
  }

  export class ArbitrageScanner {
    constructor(config?: ArbitrageConfig, ...args: any[]);
    scan(): Promise<ArbitrageOpportunity[]>;
    addExchange(config: ExchangeConfig | any, ...args: any[]): void;
    onOpportunity(callback: (opp: ArbitrageOpportunity) => void, ...args: any[]): void;
    start(): void;
    stop(): void;
    getStats(): any;
    [key: string]: any;
  }

  export class ArbitrageExecutor {
    constructor(config?: any, ...args: any[]);
    execute(opp: ArbitrageOpportunity): Promise<any>;
    addExchange(exchange: any, ...args: any[]): void;
    printDashboard(): void;
    [key: string]: any;
  }
}

declare module '@agencyos/trading-core/interfaces' {
  export interface IExchange {
    name: string;
    fetchTicker(symbol: string): Promise<any>;
    fetchOrderBook(symbol: string): Promise<any>;
    createOrder(symbol: string, type: string, side: string, amount: number, price?: number): Promise<any>;
    createMarketOrder(symbol: string, side: string, amount: number): Promise<any>;
    fetchBalance(): Promise<any>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    [key: string]: any; // Allow any additional properties
  }

  export interface IBalance {
    [key: string]: {
      free: number;
      used: number;
      total: number;
    } | string | number; // Allow string/number for balance values
  }

  export interface IOrderBookEntry {
    price: number;
    amount: number;
  }

  export interface IOrderBook {
    symbol: string;
    bids: [number, number][];
    asks: [number, number][];
    timestamp: number;
  }

  export interface IOrder {
    id: string;
    symbol: string;
    type?: string; // Optional
    side: string;
    amount: number;
    price?: number;
    filled?: number; // Optional
    status: string;
    timestamp: number;
    [key: string]: any;
  }

  export interface ISignal {
    type: SignalType;
    symbol?: string; // Optional
    action?: 'buy' | 'sell' | 'hold'; // Optional
    strength?: number; // Optional
    timestamp: number;
    price?: number;
    metadata?: any;
    [key: string]: any;
  }

  export interface ICandle {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    metadata?: any;
    [key: string]: any;
  }

  export interface IStrategy {
    name: string;
    execute(): Promise<any>;
    [key: string]: any;
  }

  export enum SignalType {
    BUY = 'buy',
    SELL = 'sell',
    HOLD = 'hold',
  }
}

declare module '@agencyos/vibe-arbitrage-engine/strategies' {
  export interface Strategy {
    name: string;
    execute(): Promise<any>;
    [key: string]: any;
  }

  export class CrossExchangeArbitrage implements Strategy {
    name: string;
    execute(): Promise<any>;
  }

  export class TriangularArbitrage implements Strategy {
    name: string;
    execute(): Promise<any>;
  }

  export class StatisticalArbitrage implements Strategy {
    name: string;
    execute(): Promise<any>;
  }

  export const strategies: {
    TriangularArbitrage: Strategy;
    CrossExchangeArbitrage: Strategy;
    StatisticalArbitrage: Strategy;
  };
}
