import { ExchangeRouter } from './exchange-router-with-fallback';

describe('ExchangeRouter', () => {
  let router: ExchangeRouter;

  beforeEach(() => {
    router = new ExchangeRouter({ maxConsecutiveFailures: 2, cooldownMs: 100 });
    router.addEndpoint('binance', 80, 120);
    router.addEndpoint('okx', 60, 100);
    router.addEndpoint('bybit', 40, 80);
  });

  it('should route to highest-weight exchange', async () => {
    const result = await router.route('test', async (id) => ({ exchange: id }));
    expect(result.success).toBe(true);
    expect(result.exchangeId).toBe('binance');
    expect(result.fallbackUsed).toBe(false);
  });

  it('should fallback when primary fails', async () => {
    let callCount = 0;
    const result = await router.route('test', async (id) => {
      callCount++;
      if (id === 'binance') throw new Error('Binance down');
      return { exchange: id };
    });

    expect(result.success).toBe(true);
    expect(result.exchangeId).toBe('okx');
    expect(result.fallbackUsed).toBe(true);
    expect(callCount).toBe(2);
  });

  it('should mark exchange unhealthy after consecutive failures', async () => {
    // Fail binance twice (maxConsecutiveFailures = 2)
    await router.route('test', async (id) => {
      if (id === 'binance') throw new Error('fail 1');
      return {};
    });
    await router.route('test', async (id) => {
      if (id === 'binance') throw new Error('fail 2');
      return {};
    });

    const health = router.getHealth();
    expect(health.find(h => h.id === 'binance')?.healthy).toBe(false);
  });

  it('should return error when all exchanges fail', async () => {
    const result = await router.route('test', async () => {
      throw new Error('All down');
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('All down');
  });

  it('should enforce budget limits', async () => {
    router.setBudget('conservative', { maxDailyNotional: 1000, maxDailyFees: 10 });

    const r1 = await router.route('conservative', async () => ({}), 500, 5);
    expect(r1.success).toBe(true);

    const r2 = await router.route('conservative', async () => ({}), 600, 5);
    expect(r2.success).toBe(false);
    expect(r2.error).toContain('Budget exceeded');
  });

  it('should return budget status', () => {
    router.setBudget('test', { maxDailyNotional: 50000, maxDailyFees: 200 });
    const status = router.getBudgetStatus('test');
    expect(status?.dailyNotional).toBe(0);
    expect(status?.config.maxDailyNotional).toBe(50000);
  });

  it('should allow unlimited when no budget set', async () => {
    const result = await router.route('no-budget', async () => ({}), 999999, 9999);
    expect(result.success).toBe(true);
  });

  it('should manually mark exchange as healthy', async () => {
    // Force unhealthy
    for (let i = 0; i < 3; i++) {
      await router.route('test', async (id) => {
        if (id === 'binance') throw new Error('fail');
        return {};
      });
    }

    router.markHealthy('binance');
    const health = router.getHealth();
    expect(health.find(h => h.id === 'binance')?.healthy).toBe(true);
  });

  it('should report endpoint count', () => {
    expect(router.size).toBe(3);
  });

  it('should auto-recover after cooldown', async () => {
    // Mark binance unhealthy
    for (let i = 0; i < 3; i++) {
      await router.route('test', async (id) => {
        if (id === 'binance') throw new Error('fail');
        return {};
      });
    }
    expect(router.getHealth().find(h => h.id === 'binance')?.healthy).toBe(false);

    // Wait for cooldown (100ms)
    await new Promise(r => setTimeout(r, 150));

    const result = await router.route('test', async (id) => ({ exchange: id }));
    expect(result.success).toBe(true);
    // After cooldown, binance should be healthy again and get priority
    expect(result.exchangeId).toBe('binance');
  });

  it('should return error when no endpoints registered', async () => {
    const emptyRouter = new ExchangeRouter();
    const result = await emptyRouter.route('test', async () => ({}));
    expect(result.success).toBe(false);
    expect(result.error).toContain('No healthy exchanges');
  });
});
