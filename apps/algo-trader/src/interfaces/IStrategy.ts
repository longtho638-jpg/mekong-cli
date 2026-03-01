import { ICandle } from './ICandle';

export enum SignalType {
  BUY = 'BUY',
  SELL = 'SELL',
  NONE = 'NONE'
}

export interface ISignal {
  type: SignalType;
  price: number;
  timestamp: number;
  tag?: string;
  metadata?: Record<string, unknown>;
}

export interface IStrategy {
  name: string;

  /**
   * Initialize the strategy with historical data and optional initial config
   * @param history Array of historical candles
   * @param config Optional initial configuration (dynamic JSON)
   */
  init(history: ICandle[], config?: Record<string, unknown>): Promise<void>;

  /**
   * Update the strategy with a new candle
   * @param candle The new candle
   * @returns A signal if one is generated, otherwise null
   */
  onCandle(candle: ICandle): Promise<ISignal | null>;

  /**
   * Lifecycle methods — standardized for BotEngine/Plugin compatibility
   */
  onStart?(): Promise<void>;
  /** Fine-grained price updates between candles */
  onTick?(tick: { price: number; timestamp: number }): Promise<ISignal | null>;
  /** Called when a strategy produces a signal (pre-execution check/enrichment) */
  onSignal?(signal: ISignal): Promise<ISignal | null>;
  /** Called when the bot is stopping */
  onFinish?(): Promise<void>;

  /**
   * Dynamic JSON configuration support (Formbricks-style)
   * Allows RaaS AGI to tune the strategy at runtime without restart.
   */
  updateConfig?(config: Record<string, unknown>): Promise<void>;
  getConfigSchema?(): Record<string, unknown>;
  getConfig?(): Record<string, unknown>;
}
