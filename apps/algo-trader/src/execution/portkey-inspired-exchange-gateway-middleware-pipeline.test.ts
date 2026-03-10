import {
  ExchangeGateway,
  GatewayContext,
  GatewayResponse,
  loggingMiddleware,
  retryMiddleware,
  fallbackMiddleware,
  cachingMiddleware,
  budgetMiddleware,
  latencyTrackingMiddleware,
} from './portkey-inspired-exchange-gateway-middleware-pipeline';

// Suppress logger noise in tests
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// --- Helpers ---

const baseCtx: Omit<GatewayContext, 'startTime'> = {
  tenantId: 'test-tenant',
  strategyId: 'test-strategy',
  exchangeId: 'binance',
  operation: 'fetchTicker',
  params: { symbol: 'BTC/USDT' },
  metadata: {},
};

function makeOkHandler(data: any = { price: 100 }): (ctx: GatewayContext) => Promise<GatewayResponse> { // eslint-disable-line @typescript-eslint/no-explicit-any -- test helper
  return async (ctx) => ({
    success: true,
    data,
    latency: 10,
    exchangeId: ctx.exchangeId,
    cached: false,
    retries: 0,
  });
}

function makeFailHandler(error = 'exchange error'): (ctx: GatewayContext) => Promise<GatewayResponse> {
  return async (ctx) => ({
    success: false,
    error,
    latency: 5,
    exchangeId: ctx.exchangeId,
    cached: false,
    retries: 0,
  });
}

// --- Tests ---

describe('ExchangeGateway — basic execution', () => {
  it('returns handler response with no middlewares', async () => {
    const gw = new ExchangeGateway(makeOkHandler({ price: 42 }));
    const res = await gw.execute(baseCtx);

    expect(res.success).toBe(true);
    expect(res.data).toEqual({ price: 42 });
    expect(res.exchangeId).toBe('binance');
  });

  it('propagates handler failure', async () => {
    const gw = new ExchangeGateway(makeFailHandler('timeout'));
    const res = await gw.execute(baseCtx);

    expect(res.success).toBe(false);
    expect(res.error).toBe('timeout');
  });
});

describe('Middleware chain order', () => {
  it('executes middlewares in FIFO order', async () => {
    const order: number[] = [];
    const mw = (n: number) => async (_ctx: GatewayContext, next: (newCtx?: GatewayContext) => Promise<GatewayResponse>) => {
      order.push(n);
      const res = await next();
      order.push(-n);
      return res;
    };

    const gw = new ExchangeGateway(makeOkHandler())
      .use(mw(1))
      .use(mw(2))
      .use(mw(3));

    await gw.execute(baseCtx);
    expect(order).toEqual([1, 2, 3, -3, -2, -1]);
  });
});

describe('retryMiddleware', () => {
  it('retries on failure and returns success after recovery', async () => {
    let calls = 0;
    const handler = async (ctx: GatewayContext): Promise<GatewayResponse> => {
      calls++;
      const success = calls >= 3;
      return { success, data: 'ok', error: success ? undefined : 'fail', latency: 1, exchangeId: ctx.exchangeId, cached: false, retries: 0 };
    };

    const gw = new ExchangeGateway(handler).use(retryMiddleware(3, 0));
    const res = await gw.execute(baseCtx);

    expect(res.success).toBe(true);
    expect(res.retries).toBe(2);
    expect(calls).toBe(3);
  });
});

describe('fallbackMiddleware', () => {
  it('tries fallback exchange when primary fails', async () => {
    const handler = async (ctx: GatewayContext): Promise<GatewayResponse> => {
      if (ctx.exchangeId === 'binance') {
        return { success: false, error: 'binance down', latency: 1, exchangeId: ctx.exchangeId, cached: false, retries: 0 };
      }
      return { success: true, data: 'fallback ok', latency: 1, exchangeId: ctx.exchangeId, cached: false, retries: 0 };
    };

    const gw = new ExchangeGateway(handler).use(fallbackMiddleware(['okx']));
    const res = await gw.execute(baseCtx);

    expect(res.success).toBe(true);
    expect(res.exchangeId).toBe('okx');
    expect(res.data).toBe('fallback ok');
  });
});

describe('budgetMiddleware', () => {
  it('blocks request when budget exceeded', async () => {
    const gw = new ExchangeGateway(makeOkHandler()).use(budgetMiddleware(5));

    // Drain the budget
    await gw.execute({ ...baseCtx, strategyId: 's1', metadata: { estimatedCostUsd: 5 } });
    // Next request should be blocked
    const res = await gw.execute({ ...baseCtx, strategyId: 's1', metadata: { estimatedCostUsd: 1 } });

    expect(res.success).toBe(false);
    expect(res.error).toContain('Daily budget exceeded');
  });
});
