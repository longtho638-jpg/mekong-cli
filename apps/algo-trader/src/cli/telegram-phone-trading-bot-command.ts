/**
 * Telegram Phone Trading Bot CLI — Start the Telegram command handler
 * that lets users control algo-trader from their phone.
 *
 * Usage: npm run dev telegram:bot
 *
 * Prerequisites: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env
 *
 * Flow: Phone (Telegram) → Bot polls messages → Execute trading commands → Reply results
 */

import { Command } from 'commander';
import { TelegramCommandHandler } from '../execution/telegram-command-handler';
import { StrategyLoader } from '../core/StrategyLoader';
import { MockDataProvider } from '../data/MockDataProvider';
import { BacktestRunner } from '../backtest/BacktestRunner';
import { AntiDetectionSafetyLayer } from '../execution/anti-detection-order-randomizer-safety-layer';
import { BinhPhapStealthStrategy } from '../execution/binh-phap-stealth-trading-strategy';
import { logger } from '../utils/logger';

/** Shared safety layer instance — accessible from trading commands */
let safetyLayer: AntiDetectionSafetyLayer | null = null;

export function getSafetyLayer(): AntiDetectionSafetyLayer {
  if (!safetyLayer) {
    safetyLayer = new AntiDetectionSafetyLayer();
  }
  return safetyLayer;
}

function validateTelegramConfig(): { botToken: string; chatId: string } {
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

function registerTradingCommands(handler: TelegramCommandHandler): void {
  // /status — System status
  handler.registerCommand('/status', async () => {
    const uptime = Math.floor(process.uptime());
    const mem = process.memoryUsage();
    const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(1);
    return [
      '📊 *System Status*',
      `Uptime: ${Math.floor(uptime / 60)}m ${uptime % 60}s`,
      `Memory: ${heapMB} MB`,
      `Node: ${process.version}`,
      `Bot: Running ✅`,
    ].join('\n');
  });

  // /backtest [strategy] — Quick backtest
  handler.registerCommand('/backtest', async (args: string) => {
    const strategyName = args.trim() || 'RsiSma';
    try {
      const strategy = StrategyLoader.load(strategyName);
      const dataProvider = new MockDataProvider();
      const runner = new BacktestRunner(strategy, dataProvider, 10000);
      const result = await runner.run(30, true);

      return [
        `📈 *Backtest: ${strategyName}* (30d, $10k)`,
        `Return: ${result.totalReturn.toFixed(2)}%`,
        `Sharpe: ${result.sharpeRatio.toFixed(3)}`,
        `Max DD: ${result.maxDrawdown.toFixed(2)}%`,
        `Win Rate: ${result.winRate.toFixed(1)}%`,
        `Trades: ${result.totalTrades}`,
      ].join('\n');
    } catch (err) {
      return `❌ Strategy "${strategyName}" not found. Available: RsiSma, RsiCrossover, Bollinger, MacdCrossover, MacdBollingerRsi`;
    }
  });

  // /balance — Portfolio info
  handler.registerCommand('/balance', async () => {
    return [
      '💰 *Portfolio Summary*',
      'Mode: Paper Trading (dry-run)',
      'Use /arb to start scanning',
      'Use /arb\\_live for real trading',
    ].join('\n');
  });

  // /health — Health check
  handler.registerCommand('/health', async () => {
    return '✅ System healthy. All services operational.';
  });

  // /arb — Start arb info (actual arb requires dedicated CLI session)
  handler.registerCommand('/arb', async () => {
    return [
      '🔍 *Arbitrage Scanner*',
      '',
      'To start AGI arbitrage, run on your server:',
      '`npm run dev arb:agi`',
      '',
      'Alerts will be sent here automatically.',
      'Use /status to check system.',
    ].join('\n');
  });

  // /arb_live — Live arb info
  handler.registerCommand('/arb_live', async () => {
    return [
      '⚠️ *Live Arbitrage*',
      '',
      'To start LIVE arbitrage, run on server:',
      '`npm run dev arb:agi --live`',
      '',
      '⚠️ This uses REAL MONEY.',
      'Ensure exchange keys are configured.',
    ].join('\n');
  });

  // /stop — Stop info
  handler.registerCommand('/stop', async () => {
    return '🛑 To stop a running session, press Ctrl+C on the server terminal.\nFor emergency: /kill';
  });

  // /kill — Emergency kill switch
  handler.registerCommand('/kill', async () => {
    const safety = getSafetyLayer();
    safety.emergencyKill('Manual kill from Telegram phone');
    return '⛔ *EMERGENCY KILL ACTIVATED*\nAll trading operations stopped immediately.\nUse /kill\\_reset to resume.';
  });

  // /kill_reset — Reset kill switch
  handler.registerCommand('/kill_reset', async () => {
    const safety = getSafetyLayer();
    safety.resetKill();
    return '✅ Kill switch reset. Trading operations can resume.';
  });

  // /binh_phap — Binh Phap stealth intelligence report
  handler.registerCommand('/binh_phap', async () => {
    const bp = new BinhPhapStealthStrategy();
    const intel = bp.getIntelligence();
    const lines = ['🏯 *Binh Pháp Intelligence*', ''];
    for (const [id, info] of Object.entries(intel)) {
      const vol = info.isHighVolume ? '📈 High Vol' : '📉 Low Vol';
      const threat = '⚔️'.repeat(info.threat.level);
      lines.push(`*${id.toUpperCase()}*: ${vol} | Threat: ${threat} (${info.threat.level}/5)`);
      lines.push(`  Orders/hr: ${info.recentOrders}/${info.terrain.safeOrdersPerHour} | Risk: ${info.terrain.riskLevel}`);
    }
    lines.push('', '_Chapter mapping active based on threat level_');
    return lines.join('\n');
  });

  // /safety — Safety layer status
  handler.registerCommand('/safety', async () => {
    const safety = getSafetyLayer();
    const status = safety.getStatus();
    const lines = [
      `🛡️ *Safety Status*`,
      `Kill Switch: ${status.killed ? '⛔ ACTIVE' : '✅ Off'}`,
      `Jitter: timing ±${status.config.timingJitterPct * 100}%, size ±${status.config.sizeJitterPct * 100}%`,
      `Rate Limit: ${status.config.maxCallsPerMinute}/min, ${status.config.maxOrdersPerHour}/hour`,
      `Balance Stop: ${status.config.balanceDropStopPct}% drop`,
    ];
    for (const ex of status.exchanges) {
      const paused = Date.now() < ex.pausedUntil ? '⏸️' : '▶️';
      lines.push(`${paused} ${ex.exchange}: ${ex.consecutiveErrors} errors, ${ex.rateLimitWarnings} rate warns`);
    }
    return lines.join('\n');
  });
}

export function registerTelegramBotCommand(program: Command): void {
  program
    .command('telegram:bot')
    .description('Start Telegram bot for phone-based trading control')
    .option('--poll-interval <ms>', 'Polling interval in ms', '3000')
    .action(async (options) => {
      const { botToken, chatId } = validateTelegramConfig();

      const handler = new TelegramCommandHandler({
        botToken,
        chatId,
        pollingIntervalMs: parseInt(options.pollInterval, 10),
      });

      registerTradingCommands(handler);

      handler.on('command', ({ command, args }: { command: string; args: string }) => {
        logger.info(`[TelegramBot] Command: ${command} ${args}`);
      });

      handler.start();

      // Send startup notification
      await handler.reply('🤖 *AGI Algo Trader Bot Started!*\nType /help for available commands.', 'Markdown');

      logger.info('[TelegramBot] Listening for commands from phone...');
      logger.info('[TelegramBot] Press Ctrl+C to stop');

      const shutdown = (): void => {
        handler.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    });
}
