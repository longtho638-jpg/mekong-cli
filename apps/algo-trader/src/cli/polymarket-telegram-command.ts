/**
 * CLI command to start Polymarket Telegram Bot integration.
 *
 * Usage: pnpm dev polymarket:telegram [--live] [--poll-interval <ms>]
 *
 * Bridges Telegram with PolymarketBotEngine + PortfolioManager for
 * real-time alerts, P&L reports, and phone-based bot control.
 */

import { Command } from 'commander';
import { PolymarketTelegramBot } from '../telegram/polymarket-telegram-bot';
import { logger } from '../utils/logger';

function validateConfig(): { botToken: string; chatId: string } {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    logger.error('TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID required in .env');
    logger.error('Create bot: https://t.me/BotFather → /newbot');
    logger.error('Get chat ID: https://t.me/userinfobot');
    process.exit(1);
  }

  return { botToken, chatId };
}

export function registerPolymarketTelegramCommand(program: Command): void {
  program
    .command('polymarket:telegram')
    .description('Start Polymarket Telegram bot with trading alerts and phone control')
    .option('--poll-interval <ms>', 'Telegram polling interval in ms', '3000')
    .option('--live', 'Start bot engine in LIVE mode (default: dry-run)', false)
    .option('--summary-hour <hour>', 'Hour (0-23) for daily summary', '20')
    .action(async (options) => {
      const { botToken, chatId } = validateConfig();

      const bot = new PolymarketTelegramBot({
        botToken,
        chatId,
        pollingIntervalMs: parseInt(options.pollInterval, 10),
        dailySummaryHour: parseInt(options.summaryHour, 10),
        botConfig: {
          dryRun: !options.live,
        },
      });

      await bot.start();

      logger.info('[PolyTgBot] Listening for commands. Press Ctrl+C to stop.');

      const shutdown = async (): Promise<void> => {
        await bot.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    });
}
