/**
 * Tests for ArbCliDashboard — data update methods, paper mode toggle, start/stop lifecycle.
 * Captures stdout.write to verify render output without visual inspection.
 * Chalk is mocked to a pass-through to avoid CJS/ESM module resolution issues in ts-jest.
 */

// Mock chalk before importing ArbCliDashboard so all chalk calls return plain strings
const chalkMock = (s: string) => s;
chalkMock.yellow = (s: string) => s;
chalkMock.green = (s: string) => s;
chalkMock.red = (s: string) => s;
chalkMock.cyan = { bold: (s: string) => s } as unknown as ((s: string) => string);
(chalkMock.cyan as unknown as Record<string, unknown>).__esModule = false;
// Make chalkMock.cyan callable too
const cyanFn = (s: string) => s;
(cyanFn as unknown as Record<string, unknown>).bold = (s: string) => s;

jest.mock('chalk', () => {
  const fn = (s: string) => s;
  fn.yellow = (s: string) => s;
  fn.green = (s: string) => s;
  fn.red = (s: string) => s;
  fn.grey = (s: string) => s;
  fn.bold = (s: string) => s;
  const cyan = (s: string) => s;
  (cyan as unknown as Record<string, unknown>).bold = (s: string) => s;
  fn.cyan = cyan;
  return fn;
});

import { ArbCliDashboard, SpreadResult, ArbPosition, AgiStats } from '../../src/ui/arbitrage-cli-realtime-dashboard';

function captureRender(dashboard: ArbCliDashboard): string {
  const chunks: string[] = [];
  const original = process.stdout.write.bind(process.stdout);
  jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
    chunks.push(String(chunk));
    return true;
  });
  dashboard.render();
  (process.stdout.write as jest.Mock).mockRestore();
  // Restore in case mockRestore doesn't work in all envs
  process.stdout.write = original;
  return chunks.join('');
}

describe('ArbCliDashboard', () => {
  let dashboard: ArbCliDashboard;

  beforeEach(() => {
    dashboard = new ArbCliDashboard(60000); // large interval — won't fire during tests
  });

  afterEach(() => {
    dashboard.stop();
  });

  describe('render — header', () => {
    it('renders dashboard header with PAPER tag when paper mode enabled', () => {
      dashboard.setPaperMode(true);
      const output = captureRender(dashboard);
      expect(output).toContain('AGI ARBITRAGE DASHBOARD');
      expect(output).toContain('[PAPER]');
    });

    it('renders LIVE tag when paper mode disabled', () => {
      dashboard.setPaperMode(false);
      const output = captureRender(dashboard);
      expect(output).toContain('[LIVE]');
    });
  });

  describe('render — spreads', () => {
    it('renders "No spreads detected" when spreads list is empty', () => {
      dashboard.updateSpreads([]);
      const output = captureRender(dashboard);
      expect(output).toContain('No spreads detected');
    });

    it('renders spread symbol and route', () => {
      const spreads: SpreadResult[] = [
        {
          symbol: 'BTC/USDT',
          buyExchange: 'binance',
          sellExchange: 'okx',
          spreadPct: 0.12,
          estimatedProfitUsd: 12.5,
          isProfitable: true,
        },
      ];
      dashboard.updateSpreads(spreads);
      const output = captureRender(dashboard);
      expect(output).toContain('BTC/USDT');
      expect(output).toContain('binance');
      expect(output).toContain('okx');
      expect(output).toContain('[PROFITABLE]');
    });

    it('renders BELOW THRESH for non-profitable spread', () => {
      const spreads: SpreadResult[] = [
        {
          symbol: 'ETH/USDT',
          buyExchange: 'bybit',
          sellExchange: 'binance',
          spreadPct: 0.02,
          estimatedProfitUsd: 0.5,
          isProfitable: false,
        },
      ];
      dashboard.updateSpreads(spreads);
      const output = captureRender(dashboard);
      expect(output).toContain('[BELOW THRESH]');
    });

    it('renders at most 5 spreads', () => {
      const spreads: SpreadResult[] = Array.from({ length: 10 }, (_, i) => ({
        symbol: `TOKEN${i}/USDT`,
        buyExchange: 'binance',
        sellExchange: 'okx',
        spreadPct: 0.1,
        estimatedProfitUsd: 5,
        isProfitable: true,
      }));
      dashboard.updateSpreads(spreads);
      const output = captureRender(dashboard);
      // Only first 5 tokens should appear
      expect(output).toContain('TOKEN0/USDT');
      expect(output).toContain('TOKEN4/USDT');
      expect(output).not.toContain('TOKEN5/USDT');
    });
  });

  describe('render — positions', () => {
    it('renders "No open positions" when positions list is empty', () => {
      dashboard.updatePositions([]);
      const output = captureRender(dashboard);
      expect(output).toContain('No open positions');
    });

    it('renders position symbol and exchanges', () => {
      const positions: ArbPosition[] = [
        { symbol: 'BTC/USDT', buyExchange: 'binance', sellExchange: 'okx', unrealizedPnl: 8.30, pnlPct: 0.083 },
      ];
      dashboard.updatePositions(positions);
      const output = captureRender(dashboard);
      expect(output).toContain('BTC/USDT');
      expect(output).toContain('binance');
      expect(output).toContain('okx');
      expect(output).toContain('+$8.30');
    });

    it('renders negative P&L without plus sign', () => {
      const positions: ArbPosition[] = [
        { symbol: 'ETH/USDT', buyExchange: 'binance', sellExchange: 'okx', unrealizedPnl: -3.50, pnlPct: -0.035 },
      ];
      dashboard.updatePositions(positions);
      const output = captureRender(dashboard);
      expect(output).toContain('$-3.50');
    });
  });

  describe('render — P&L summary', () => {
    it('renders realized and unrealized P&L', () => {
      dashboard.updatePnl({ realized: 142.50, unrealized: 8.30, total: 150.80 });
      const output = captureRender(dashboard);
      expect(output).toContain('$142.50 realized');
      expect(output).toContain('$8.30 unrealized');
      expect(output).toContain('$150.80');
    });
  });

  describe('render — engine stats', () => {
    it('renders regime and circuit breaker info', () => {
      const stats: AgiStats = {
        currentRegime: 'trending',
        regimeConfidence: 0.87,
        kellyFraction: 0.032,
        circuitState: 'CLOSED',
        totalDetections: 50,
        totalExecuted: 23,
        successfulExecutions: 18,
      };
      dashboard.updateEngineStats(stats);
      const output = captureRender(dashboard);
      expect(output).toContain('trending');
      expect(output).toContain('87%');
      expect(output).toContain('CLOSED');
      expect(output).toContain('Detections: 50');
      expect(output).toContain('Executed: 23');
    });

    it('does not render regime section when stats not set', () => {
      const output = captureRender(dashboard);
      expect(output).not.toContain('Detections:');
    });
  });

  describe('start / stop lifecycle', () => {
    it('start sets up interval without immediate render error', () => {
      jest.useFakeTimers();
      const d = new ArbCliDashboard(1000);
      expect(() => d.start()).not.toThrow();
      d.stop();
      jest.useRealTimers();
    });

    it('stop clears interval so no further renders occur', () => {
      jest.useFakeTimers();
      const writes: string[] = [];
      jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
        writes.push(String(chunk));
        return true;
      });

      const d = new ArbCliDashboard(500);
      d.start();
      d.stop();
      const countAfterStop = writes.length;
      jest.advanceTimersByTime(2000);
      expect(writes.length).toBe(countAfterStop); // no new writes

      (process.stdout.write as jest.Mock).mockRestore();
      jest.useRealTimers();
    });
  });
});
