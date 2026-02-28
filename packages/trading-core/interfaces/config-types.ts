/**
 * Bot configuration types — exchange, strategy, backtest, logging.
 */

export interface IConfig {
  exchange: {
    id: string;
    apiKey?: string;
    secret?: string;
    testMode: boolean;
  };
  bot: {
    symbol: string;
    riskPercentage: number;
    pollInterval: number;
    strategy: string;
  };
  backtest: {
    days: number;
    initialBalance: number;
  };
  logging: {
    level: string;
    directory: string;
  };
}
