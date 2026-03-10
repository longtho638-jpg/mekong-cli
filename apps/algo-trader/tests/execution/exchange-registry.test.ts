import { ExchangeRegistry, ExchangeConfig } from '../../src/execution/exchange-registry';

describe('ExchangeRegistry', () => {
  let registry: ExchangeRegistry;

  beforeEach(() => {
    registry = new ExchangeRegistry();
  });

  const makeCfg = (id: string, enabled = true, pairs = ['BTC/USDT']): ExchangeConfig => ({
    id, enabled, tradingPairs: pairs,
  });

  test('register and get exchange', () => {
    registry.register(makeCfg('binance'));
    expect(registry.get('binance')).toBeDefined();
    expect(registry.get('binance')!.id).toBe('binance');
    expect(registry.size).toBe(1);
  });

  test('unregister removes exchange', () => {
    registry.register(makeCfg('binance'));
    registry.unregister('binance');
    expect(registry.get('binance')).toBeUndefined();
    expect(registry.size).toBe(0);
  });

  test('getEnabled filters disabled exchanges', () => {
    registry.register(makeCfg('binance', true));
    registry.register(makeCfg('okx', false));
    registry.register(makeCfg('bybit', true));
    const enabled = registry.getEnabled();
    expect(enabled).toHaveLength(2);
    expect(enabled.map(e => e.id)).toEqual(['binance', 'bybit']);
  });

  test('getAllPairs deduplicates across exchanges', () => {
    registry.register(makeCfg('binance', true, ['BTC/USDT', 'ETH/USDT']));
    registry.register(makeCfg('okx', true, ['ETH/USDT', 'SOL/USDT']));
    registry.register(makeCfg('bybit', false, ['DOGE/USDT'])); // disabled
    const pairs = registry.getAllPairs();
    expect(pairs).toHaveLength(3);
    expect(pairs).toContain('BTC/USDT');
    expect(pairs).toContain('ETH/USDT');
    expect(pairs).toContain('SOL/USDT');
    expect(pairs).not.toContain('DOGE/USDT');
  });

  test('loadFromEnv reads API keys from process.env', () => {
    process.env.BINANCE_API_KEY = 'test-key-123';
    process.env.BINANCE_SECRET = 'test-secret-456';
    registry.register(makeCfg('binance'));
    registry.loadFromEnv(['binance']);
    expect(registry.get('binance')!.apiKey).toBe('test-key-123');
    expect(registry.get('binance')!.secret).toBe('test-secret-456');
    delete process.env.BINANCE_API_KEY;
    delete process.env.BINANCE_SECRET;
  });

  test('loadFromEnv ignores unregistered exchanges', () => {
    registry.loadFromEnv(['unknown']);
    expect(registry.get('unknown')).toBeUndefined();
  });

  test('getIds returns all registered IDs', () => {
    registry.register(makeCfg('binance'));
    registry.register(makeCfg('okx'));
    expect(registry.getIds()).toEqual(['binance', 'okx']);
  });
});
