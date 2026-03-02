/**
 * Telegram Command Handler — Receives commands from user's phone via Telegram.
 * Long-polling based (no webhook server needed). Extends TelegramTradeAlertBot
 * for bi-directional communication: receive commands + send responses.
 *
 * Commands:
 *   /start, /help     — Show available commands
 *   /status            — Current positions, P&L, system status
 *   /arb               — Start AGI arbitrage (dry-run by default)
 *   /arb_live           — Start AGI arbitrage (LIVE mode)
 *   /stop              — Stop running arb session
 *   /backtest [strategy] — Run quick backtest
 *   /balance           — Portfolio balance summary
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export interface TelegramCommandConfig {
  botToken: string;
  chatId: string;
  pollingIntervalMs?: number;  // default 3000
  baseUrl?: string;            // for testing
}

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
    from?: { id: number; first_name: string };
  };
}

export type CommandAction = (args: string) => Promise<string>;

export class TelegramCommandHandler extends EventEmitter {
  private config: TelegramCommandConfig;
  private offset = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private commands = new Map<string, CommandAction>();
  private running = false;
  private readonly baseUrl: string;
  private readonly pollingInterval: number;

  fetchFn: typeof fetch;

  constructor(config: TelegramCommandConfig, fetchFn?: typeof fetch) {
    super();
    this.config = config;
    this.baseUrl = config.baseUrl ?? 'https://api.telegram.org';
    this.pollingInterval = config.pollingIntervalMs ?? 3000;
    this.fetchFn = fetchFn ?? globalThis.fetch;

    this.registerDefaultCommands();
  }

  /** Register a command handler */
  registerCommand(name: string, action: CommandAction): void {
    this.commands.set(name.toLowerCase(), action);
  }

  /** Start long-polling for incoming messages */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.pollTimer = setInterval(() => this.poll(), this.pollingInterval);
    this.pollTimer.unref();
    logger.info('[TelegramCmd] Started polling for commands');
  }

  /** Stop polling */
  stop(): void {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    logger.info('[TelegramCmd] Stopped');
  }

  /** Send reply message */
  async reply(text: string, parseMode: string = 'Markdown'): Promise<void> {
    try {
      const url = `${this.baseUrl}/bot${this.config.botToken}/sendMessage`;
      await this.fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.config.chatId,
          text,
          parse_mode: parseMode,
        }),
      });
    } catch (err) {
      logger.error(`[TelegramCmd] Reply failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private registerDefaultCommands(): void {
    this.registerCommand('/start', async () => this.helpText());
    this.registerCommand('/help', async () => this.helpText());
  }

  private helpText(): string {
    return [
      '🤖 *AGI Algo Trader — Phone Control*',
      '',
      '📊 Trading:',
      '  /status — Positions & P&L',
      '  /arb — Start AGI arb (dry-run)',
      '  /arb\\_live — Start AGI arb (LIVE)',
      '  /stop — Stop running session',
      '',
      '📈 Analysis:',
      '  /backtest — Quick RsiSma backtest',
      '  /backtest MacdCrossover — Custom strategy',
      '  /balance — Portfolio summary',
      '',
      '🛡️ Safety:',
      '  /safety — Safety layer status',
      '  /binh\\_phap — 🏯 Stealth intelligence report',
      '  /kill — ⛔ Emergency stop ALL trading',
      '  /kill\\_reset — Resume after kill',
      '',
      '⚙️ System:',
      '  /health — System health check',
      '  /help — This menu',
    ].join('\n');
  }

  private async poll(): Promise<void> {
    if (!this.running) return;

    try {
      const url = `${this.baseUrl}/bot${this.config.botToken}/getUpdates?offset=${this.offset}&timeout=1&limit=10`;
      const response = await this.fetchFn(url);

      if (!response.ok) {
        logger.error(`[TelegramCmd] Poll failed: ${response.status}`);
        return;
      }

      const data = await response.json() as { ok: boolean; result: TelegramUpdate[] };
      if (!data.ok || !data.result) return;

      for (const update of data.result) {
        this.offset = update.update_id + 1;

        if (!update.message?.text) continue;

        // Security: only accept commands from configured chat
        if (String(update.message.chat.id) !== this.config.chatId) {
          logger.warn(`[TelegramCmd] Unauthorized chat ${update.message.chat.id}`);
          continue;
        }

        await this.handleMessage(update.message.text);
      }
    } catch (err) {
      logger.error(`[TelegramCmd] Poll error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async handleMessage(text: string): Promise<void> {
    const parts = text.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    this.emit('command', { command: cmd, args });

    const handler = this.commands.get(cmd);
    if (handler) {
      try {
        const response = await handler(args);
        if (response) {
          await this.reply(response);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await this.reply(`❌ Error: ${errMsg}`);
        logger.error(`[TelegramCmd] Command ${cmd} failed: ${errMsg}`);
      }
    } else {
      await this.reply(`❓ Unknown command: ${cmd}\nType /help for available commands.`);
    }
  }
}
