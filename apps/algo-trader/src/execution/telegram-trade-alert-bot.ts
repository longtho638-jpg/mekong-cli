/**
 * Telegram Trade Alert Bot — Sends trade signals, PnL reports,
 * and anomaly alerts via Telegram Bot API.
 * Subscribes to SignalOrderPipeline and PositionManager events.
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface TelegramBotConfig {
  botToken: string;
  chatId: string;
  enabled?: boolean;           // default true
  rateLimitMs?: number;        // min interval between messages, default 1000
  baseUrl?: string;            // for testing, default https://api.telegram.org
}

export interface TelegramMessage {
  text: string;
  parseMode?: 'Markdown' | 'HTML';
}

export class TelegramTradeAlertBot extends EventEmitter {
  private config: TelegramBotConfig;
  private lastSentAt = 0;
  private messageQueue: TelegramMessage[] = [];
  private drainTimer: ReturnType<typeof setInterval> | null = null;
  private readonly rateLimitMs: number;
  private readonly baseUrl: string;

  /** Inject custom fetch for testing */
  fetchFn: typeof fetch;

  constructor(config: TelegramBotConfig, fetchFn?: typeof fetch) {
    super();
    this.config = { enabled: true, ...config };
    this.rateLimitMs = config.rateLimitMs ?? 1000;
    this.baseUrl = config.baseUrl ?? 'https://api.telegram.org';
    this.fetchFn = fetchFn ?? globalThis.fetch;
  }

  /** Start draining message queue */
  start(): void {
    if (this.drainTimer) return;
    this.drainTimer = setInterval(() => this.drain(), this.rateLimitMs);
    this.drainTimer.unref();
    logger.info('[TelegramBot] Started');
  }

  /** Stop and flush remaining messages */
  stop(): void {
    if (this.drainTimer) {
      clearInterval(this.drainTimer);
      this.drainTimer = null;
    }
    logger.info('[TelegramBot] Stopped');
  }

  /** Send a trade signal alert */
  alertSignal(strategy: string, side: string, symbol: string, price: number, confirmations: number): void {
    const emoji = side === 'buy' ? '🟢' : '🔴';
    this.enqueue({
      text: `${emoji} *${side.toUpperCase()}* ${symbol}\nPrice: $${price.toFixed(2)}\nStrategy: ${strategy}\nConfirmations: ${confirmations}`,
      parseMode: 'Markdown',
    });
  }

  /** Send a position closed alert with PnL */
  alertPositionClosed(id: string, symbol: string, pnl: number, side: string): void {
    const emoji = pnl >= 0 ? '✅' : '❌';
    const sign = pnl >= 0 ? '+' : '';
    this.enqueue({
      text: `${emoji} *Position Closed* (${side})\n${symbol}\nPnL: ${sign}$${pnl.toFixed(2)}\nID: \`${id}\``,
      parseMode: 'Markdown',
    });
  }

  /** Send an anomaly/risk alert */
  alertAnomaly(type: string, message: string): void {
    this.enqueue({
      text: `⚠️ *ALERT: ${type}*\n${message}`,
      parseMode: 'Markdown',
    });
  }

  /** Send a daily PnL summary report */
  alertDailySummary(stats: {
    totalPnl: number;
    winRate: number;
    openPositions: number;
    closedPositions: number;
  }): void {
    const emoji = stats.totalPnl >= 0 ? '📈' : '📉';
    const sign = stats.totalPnl >= 0 ? '+' : '';
    this.enqueue({
      text: `${emoji} *Daily Summary*\nP&L: ${sign}$${stats.totalPnl.toFixed(2)}\nWin Rate: ${(stats.winRate * 100).toFixed(1)}%\nOpen: ${stats.openPositions} | Closed: ${stats.closedPositions}`,
      parseMode: 'Markdown',
    });
  }

  /** Send raw text message */
  sendRaw(text: string): void {
    this.enqueue({ text });
  }

  /** Get pending message count */
  getPendingCount(): number {
    return this.messageQueue.length;
  }

  private enqueue(msg: TelegramMessage): void {
    if (!this.config.enabled) return;
    this.messageQueue.push(msg);
    this.emit('enqueued', msg);
  }

  private async drain(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    const now = Date.now();
    if (now - this.lastSentAt < this.rateLimitMs) return;

    const msg = this.messageQueue.shift();
    if (!msg) return;

    try {
      const url = `${this.baseUrl}/bot${this.config.botToken}/sendMessage`;
      const body = {
        chat_id: this.config.chatId,
        text: msg.text,
        parse_mode: msg.parseMode,
      };

      const response = await this.fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      this.lastSentAt = Date.now();

      if (!response.ok) {
        const errText = await response.text();
        logger.error(`[TelegramBot] Send failed: ${response.status} ${errText}`);
        this.emit('error', new Error(`Telegram API ${response.status}`));
      } else {
        this.emit('sent', msg);
      }
    } catch (err) {
      logger.error(`[TelegramBot] Send error: ${err instanceof Error ? err.message : String(err)}`);
      this.emit('error', err);
    }
  }
}
