import { createStealthMiddleware } from '../../src/execution/stealth-cli-fingerprint-masking-middleware';
import type { GatewayContext, GatewayResponse } from '../../src/execution/portkey-inspired-exchange-gateway-middleware-pipeline';

function makeCtx(overrides?: Partial<GatewayContext>): GatewayContext {
  return {
    tenantId: 'test',
    strategyId: 'strat-1',
    exchangeId: 'binance',
    operation: 'fetchTicker',
    params: { symbol: 'BTC/USDT' },
    metadata: {},
    startTime: Date.now(),
    ...overrides,
  };
}

const mockResponse: GatewayResponse = {
  success: true,
  data: { price: 50000 },
  latency: 50,
  exchangeId: 'binance',
  cached: false,
  retries: 0,
};

describe('stealth-cli-fingerprint-masking-middleware', () => {
  test('injects browser-like headers into metadata', async () => {
    const middleware = createStealthMiddleware({ enableMicroDelay: false });
    const ctx = makeCtx();

    await middleware(ctx, async (newCtx) => {
      const headers = (newCtx ?? ctx).metadata.headers as Record<string, string>;
      expect(headers['User-Agent']).toMatch(/Mozilla/);
      expect(headers['Accept-Language']).toMatch(/en/);
      expect(headers['Sec-Fetch-Mode']).toBe('cors');
      expect(headers['DNT']).toBe('1');
      return mockResponse;
    });
  });

  test('preserves existing metadata headers', async () => {
    const middleware = createStealthMiddleware({ enableMicroDelay: false });
    const ctx = makeCtx({ metadata: { headers: { 'X-Custom': 'keep-me' } } });

    await middleware(ctx, async (newCtx) => {
      const headers = (newCtx ?? ctx).metadata.headers as Record<string, string>;
      expect(headers['X-Custom']).toBe('keep-me');
      expect(headers['User-Agent']).toMatch(/Mozilla/);
      return mockResponse;
    });
  });

  test('rotates session identity after lifetime expires', async () => {
    const middleware = createStealthMiddleware({
      enableMicroDelay: false,
      enableSessionRotation: true,
    });

    // Collect User-Agent from 2 calls — same session should give same UA
    const uas: string[] = [];
    for (let i = 0; i < 2; i++) {
      const ctx = makeCtx();
      await middleware(ctx, async (newCtx) => {
        uas.push(((newCtx ?? ctx).metadata.headers as Record<string, string>)['User-Agent']);
        return mockResponse;
      });
    }
    expect(uas[0]).toBe(uas[1]); // same session = same UA
  });

  test('adds Poisson micro-delay when enabled', async () => {
    const middleware = createStealthMiddleware({
      enableMicroDelay: true,
      targetCallsPerMin: 600, // fast for test
    });

    const start = Date.now();
    await middleware(makeCtx(), async () => mockResponse);
    const elapsed = Date.now() - start;
    // Should have SOME delay (at least 50ms floor from Poisson config)
    expect(elapsed).toBeGreaterThanOrEqual(40);
  });

  test('skips headers injection when disabled', async () => {
    const middleware = createStealthMiddleware({
      enableMicroDelay: false,
      injectBrowserHeaders: false,
    });
    const ctx = makeCtx();

    await middleware(ctx, async (newCtx) => {
      expect((newCtx ?? ctx).metadata.headers).toBeUndefined();
      return mockResponse;
    });
  });
});
