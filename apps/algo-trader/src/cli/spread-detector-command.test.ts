/**
 * Tests for arb:spread CLI command — cross-exchange spread detector registration + defaults.
 */

import { Command } from 'commander';
import { registerSpreadDetectorCommand } from './spread-detector-command';

describe('registerSpreadDetectorCommand', () => {
  let program: Command;

  beforeEach(() => {
    program = new Command();
    program.exitOverride(); // prevent process.exit in tests
    registerSpreadDetectorCommand(program);
  });

  test('registers arb:spread command', () => {
    const cmd = program.commands.find(c => c.name() === 'arb:spread');
    expect(cmd).toBeDefined();
    expect(cmd!.description()).toContain('Cross-exchange spread detector');
  });

  test('arb:spread has correct default options', () => {
    const cmd = program.commands.find(c => c.name() === 'arb:spread')!;
    const opts = cmd.opts();

    // Commander pre-fills defaults from .option() declarations
    expect(opts.pairs).toBe('BTC/USDT,ETH/USDT');
    expect(opts.exchanges).toBe('binance,okx,bybit');
    expect(opts.size).toBe('500');
    expect(opts.threshold).toBe('0.08');
    expect(opts.scoreThreshold).toBe('60');
    expect(opts.equity).toBe('10000');
    expect(opts.maxLoss).toBe('50');
    expect(opts.poll).toBe('2000');
    expect(opts.maxPolls).toBe('0');
  });

  test('arb:spread has --dry-run flag', () => {
    const cmd = program.commands.find(c => c.name() === 'arb:spread')!;
    const dryRunOpt = cmd.options.find(o => o.long === '--dry-run');
    expect(dryRunOpt).toBeDefined();
  });

  test('arb:spread supports custom pairs and exchanges', () => {
    const cmd = program.commands.find(c => c.name() === 'arb:spread')!;
    // Verify option definitions exist
    const pairsOpt = cmd.options.find(o => o.long === '--pairs');
    const exchangesOpt = cmd.options.find(o => o.long === '--exchanges');
    expect(pairsOpt).toBeDefined();
    expect(exchangesOpt).toBeDefined();
  });
});
