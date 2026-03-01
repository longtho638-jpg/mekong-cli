/**
 * BotEngine Plugin System — composable extensions for the trading bot.
 * Plugs standalone modules into BotEngine lifecycle via event hooks.
 * Inspired by n8n's node lifecycle + Portkey middleware.
 *
 * Wires these previously-disconnected modules:
 * - AutonomyController.canExecute() gates every trade
 * - dailyLossLimitUsd vetoes when breached
 * - SignalFilter scores veto below threshold
 * - Webhook notifications on trade events
 */

import { AgentEventBus, AgentEventType, AutonomyController } from '../a2ui';
import { WebhookNotifier } from './trading-event-webhook-notifier-with-hmac-retry';
import { logger } from '../utils/logger';
import { ICandle } from '../interfaces/ICandle';
import { ISignal } from '../interfaces/IStrategy';

// --- Plugin Contracts ---

export interface PluginContext {
  eventBus: AgentEventBus;
  config: Record<string, unknown>;
}

export interface PreTradeInfo {
  side: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  strategy: string;
}

export interface PostTradeInfo extends PreTradeInfo {
  orderId: string;
  fee: number;
  pnl?: number;
  success: boolean;
}

export interface TradeDecision {
  approved: boolean;
  reason?: string;
}

export interface BotPlugin {
  name: string;
  version: string;
  onStart?(ctx: PluginContext): Promise<void>;
  /** Return { approved: false } to veto the trade */
  onPreTrade?(ctx: PluginContext, trade: PreTradeInfo): Promise<TradeDecision>;
  onPostTrade?(ctx: PluginContext, trade: PostTradeInfo): Promise<void>;
  onCandle?(ctx: PluginContext, candle: ICandle): Promise<void>;
  onTick?(ctx: PluginContext, tick: { price: number; timestamp: number }): Promise<void>;
  /** Allows plugins to enrich or veto a signal before it reaches the trade executor */
  onSignal?(ctx: PluginContext, signal: ISignal): Promise<ISignal | null>;
  onStop?(ctx: PluginContext): Promise<void>;
  onFinish?(ctx: PluginContext): Promise<void>;
}

// --- Plugin Manager ---

export class PluginManager {
  private plugins: BotPlugin[] = [];
  private ctx: PluginContext;

  constructor(eventBus: AgentEventBus, config?: Record<string, unknown>) {
    this.ctx = { eventBus, config: config ?? {} };
  }

  register(plugin: BotPlugin): void {
    this.plugins.push(plugin);
    logger.info(`[PluginManager] Registered plugin: ${plugin.name}@${plugin.version}`);
  }

  async onStart(): Promise<void> {
    for (const p of this.plugins) {
      if (p.onStart) {
        logger.info(`[plugin:${p.name}] onStart`);
        await p.onStart(this.ctx);
      }
    }
  }

  /**
   * Run all plugins; first veto wins — trade is blocked.
   */
  async onPreTrade(trade: PreTradeInfo): Promise<TradeDecision> {
    for (const p of this.plugins) {
      if (!p.onPreTrade) continue;
      const decision = await p.onPreTrade(this.ctx, trade);
      if (!decision.approved) {
        logger.warn(
          `[plugin:${p.name}] Trade VETOED — ${decision.reason ?? 'no reason'} ` +
          `(${trade.side} ${trade.amount} ${trade.symbol} @ ${trade.price})`
        );
        return decision;
      }
    }
    return { approved: true };
  }

  async onPostTrade(trade: PostTradeInfo): Promise<void> {
    for (const p of this.plugins) {
      if (p.onPostTrade) {
        await p.onPostTrade(this.ctx, trade);
      }
    }
  }

  async onCandle(candle: ICandle): Promise<void> {
    for (const p of this.plugins) {
      if (p.onCandle) {
        await p.onCandle(this.ctx, candle);
      }
    }
  }

  async onTick(tick: { price: number; timestamp: number }): Promise<void> {
    for (const p of this.plugins) {
      if (p.onTick) {
        await p.onTick(this.ctx, tick);
      }
    }
  }

  async onSignal(signal: ISignal): Promise<ISignal | null> {
    let currentSignal: ISignal = signal;
    for (const p of this.plugins) {
      if (p.onSignal) {
        const result = await p.onSignal(this.ctx, currentSignal);
        if (result === null) {
          logger.warn(`[plugin:${p.name}] Signal suppressed by plugin`);
          return null;
        }
        currentSignal = result;
      }
    }
    return currentSignal;
  }

  async onStop(): Promise<void> {
    for (const p of this.plugins) {
      if (p.onStop) {
        logger.info(`[plugin:${p.name}] onStop`);
        await p.onStop(this.ctx);
      }
    }
  }

  async onFinish(): Promise<void> {
    for (const p of this.plugins) {
      if (p.onFinish) {
        logger.info(`[plugin:${p.name}] onFinish`);
        await p.onFinish(this.ctx);
      }
    }
  }

  getPlugins(): BotPlugin[] {
    return [...this.plugins];
  }
}

// --- Built-in Plugin Factories ---

/**
 * Autonomy Gate Plugin — vetoes trades when autonomy level is OBSERVE or PLAN.
 * Fixes the gap: AutonomyController.canExecute() was never called before trades.
 */
export function createAutonomyGatePlugin(autonomyController: AutonomyController): BotPlugin {
  return {
    name: 'autonomy-gate',
    version: '1.0.0',
    async onPreTrade(_ctx, trade) {
      const canExecute = autonomyController.canExecute(trade.strategy);
      if (!canExecute) {
        const reason = `autonomy level for '${trade.strategy}' does not permit execution`;
        return { approved: false, reason };
      }
      return { approved: true };
    },
  };
}

/**
 * Daily Loss Limit Plugin — tracks realised P&L per day; vetoes once limit is breached.
 * Fixes: dailyLossLimitUsd was declared in config but never enforced.
 */
export function createDailyLossPlugin(limitUsd: number): BotPlugin {
  let dailyLoss = 0;
  let lastResetDay = new Date().toDateString();

  return {
    name: 'daily-loss-limit',
    version: '1.0.0',

    async onPreTrade(ctx, _trade) {
      const today = new Date().toDateString();
      if (today !== lastResetDay) {
        dailyLoss = 0;
        lastResetDay = today;
        logger.info('[plugin:daily-loss-limit] Daily P&L counter reset');
      }

      if (dailyLoss <= -limitUsd) {
        ctx.eventBus.emit({
          type: AgentEventType.RISK_ALERT,
          tenantId: (ctx.config as Record<string, unknown>).tenantId as string || 'default',
          timestamp: Date.now(),
          alertType: 'daily_loss',
          value: Math.abs(dailyLoss),
          threshold: limitUsd,
          message: `Daily loss limit $${limitUsd} hit (realised: $${dailyLoss.toFixed(2)})`,
        });
        return {
          approved: false,
          reason: `daily loss limit $${limitUsd} exceeded (current: $${dailyLoss.toFixed(2)})`,
        };
      }
      return { approved: true };
    },

    async onPostTrade(_ctx, trade) {
      if (trade.pnl !== undefined) {
        dailyLoss += trade.pnl;
        logger.info(
          `[plugin:daily-loss-limit] P&L update ${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)} | daily: ${dailyLoss.toFixed(2)}`
        );
      }
    },
  };
}

/**
 * Signal Filter Plugin — vetoes trades whose composite score falls below minScore.
 * Fixes: SignalFilter was instantiated but its evaluate() result was never enforced.
 *
 * Expects PreTradeInfo.amount to carry the signal score (0-100) in metadata, OR
 * relies on an external caller to set signalScore on the info before calling onPreTrade.
 * To avoid coupling to SignalFilter's full candle pipeline here we accept a scorer function.
 */
export function createSignalFilterPlugin(
  minScore: number,
  getSignalScore: (trade: PreTradeInfo) => number,
): BotPlugin {
  return {
    name: 'signal-filter',
    version: '1.0.0',

    async onPreTrade(_ctx, trade) {
      const score = getSignalScore(trade);
      if (score < minScore) {
        return {
          approved: false,
          reason: `signal score ${score} below minimum ${minScore}`,
        };
      }
      logger.info(`[plugin:signal-filter] Score ${score} >= ${minScore} — approved`);
      return { approved: true };
    },
  };
}

/**
 * Webhook Plugin — fires trade.executed / bot.started / bot.stopped notifications.
 * Fixes: WebhookNotifier existed but was never wired to trade lifecycle.
 */
export function createWebhookPlugin(webhookUrl: string, secret?: string): BotPlugin {
  const notifier = new WebhookNotifier();
  notifier.register({
    url: webhookUrl,
    secret,
    events: ['trade.executed', 'bot.started', 'bot.stopped'],
  });

  return {
    name: 'webhook-notifier',
    version: '1.0.0',

    async onStart() {
      await notifier.notify('bot.started', { webhookUrl, timestamp: Date.now() });
    },

    async onPostTrade(_ctx, trade) {
      await notifier.notify('trade.executed', {
        orderId: trade.orderId,
        side: trade.side,
        symbol: trade.symbol,
        amount: trade.amount,
        price: trade.price,
        fee: trade.fee,
        pnl: trade.pnl,
        success: trade.success,
      });
    },

    async onStop() {
      await notifier.notify('bot.stopped', { webhookUrl, timestamp: Date.now() });
    },
  };
}
