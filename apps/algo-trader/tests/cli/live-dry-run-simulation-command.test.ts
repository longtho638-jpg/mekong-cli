import { Command } from 'commander';
import { registerDryRunCommand } from '../../src/cli/live-dry-run-simulation-command';

// Mock ws to prevent real connections
jest.mock('ws', () => {
  return class MockWebSocket {
    static OPEN = 1;
    readyState = 1;
    on = jest.fn();
    send = jest.fn();
    close = jest.fn();
    ping = jest.fn();
  };
});

// Mock exchange-factory
jest.mock('../../src/cli/exchange-factory', () => ({
  createExchangeAdapter: jest.fn((id: string) => ({ exchangeId: id })),
}));

describe('registerDryRunCommand', () => {
  test('registers live:dry-run command on program', () => {
    const program = new Command();
    registerDryRunCommand(program);
    const cmd = program.commands.find(c => c.name() === 'live:dry-run');
    expect(cmd).toBeDefined();
    expect(cmd!.description()).toContain('simulation');
  });

  test('command has required options', () => {
    const program = new Command();
    registerDryRunCommand(program);
    const cmd = program.commands.find(c => c.name() === 'live:dry-run')!;
    const optNames = cmd.options.map(o => o.long);
    expect(optNames).toContain('--exchanges');
    expect(optNames).toContain('--pairs');
    expect(optNames).toContain('--strategy');
  });

  test('command has optional telegram options', () => {
    const program = new Command();
    registerDryRunCommand(program);
    const cmd = program.commands.find(c => c.name() === 'live:dry-run')!;
    const optNames = cmd.options.map(o => o.long);
    expect(optNames).toContain('--telegram-token');
    expect(optNames).toContain('--telegram-chat');
  });

  test('command has default values for optional params', () => {
    const program = new Command();
    registerDryRunCommand(program);
    const cmd = program.commands.find(c => c.name() === 'live:dry-run')!;
    const intervalOpt = cmd.options.find(o => o.long === '--interval');
    expect(intervalOpt?.defaultValue).toBe('60000');
  });
});
