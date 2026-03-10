/**
 * Canary Deployment - Configuration types and defaults.
 */

export interface InstanceConfig {
  image: string;
  configPath: string;
}

export interface TrafficSplitConfig {
  initialPercent: number;
  incrementSteps: number[];
  evaluationPeriodHours: number;
  symbols: string[];
}

export interface MetricsThresholdConfig {
  sharpeWindowHours: number;
  slippageThresholdBps: number;
  errorRateThreshold: number;
  antiBotFlagThreshold: number;
  confidenceLevel: number;
}

export interface AlertConfig {
  telegramBotTokenEnv: string;
  telegramChatIdEnv: string;
  slackWebhookEnv: string;
}

export interface CanaryConfig {
  baseline: InstanceConfig;
  canary: InstanceConfig;
  trafficSplit: TrafficSplitConfig;
  metrics: MetricsThresholdConfig;
  alerts: AlertConfig;
  dashboardPort: number;
}

export const DEFAULT_CANARY_CONFIG: CanaryConfig = {
  baseline: {
    image: 'algo-trader:stable',
    configPath: './config.stable.json',
  },
  canary: {
    image: 'algo-trader:latest',
    configPath: './config.canary-instance.json',
  },
  trafficSplit: {
    initialPercent: 1,
    incrementSteps: [5, 10, 25, 50, 100],
    evaluationPeriodHours: 24,
    symbols: ['BTC/USDT', 'ETH/USDT'],
  },
  metrics: {
    sharpeWindowHours: 1,
    slippageThresholdBps: 5,
    errorRateThreshold: 0.01,
    antiBotFlagThreshold: 1,
    confidenceLevel: 0.95,
  },
  alerts: {
    telegramBotTokenEnv: 'TELEGRAM_BOT_TOKEN',
    telegramChatIdEnv: 'TELEGRAM_CHAT_ID',
    slackWebhookEnv: 'SLACK_WEBHOOK',
  },
  dashboardPort: 3001,
};
