import { HttpClientWrapper } from '../../../../src/arbitrage/phase6_ghost/polymorphic-matrix/http-client-wrapper';
import { ProxyManager } from '../../../../src/arbitrage/phase6_ghost/polymorphic-matrix/proxy-manager';
import { FingerprintGenerator } from '../../../../src/arbitrage/phase6_ghost/polymorphic-matrix/fingerprint-generator';
import { JitterInjector } from '../../../../src/arbitrage/phase6_ghost/polymorphic-matrix/jitter-injector';

function createWrapper(fetchFn?: HttpClientWrapper extends { request: infer R } ? never : unknown) {
  const proxyManager = new ProxyManager({
    provider: 'mock',
    rotationRequests: 10,
    rotationSec: 60,
    pool: [
      { host: 'proxy-0.test', port: 8000, protocol: 'http', alive: true },
      { host: 'proxy-1.test', port: 8001, protocol: 'http', alive: true },
    ],
  });

  const fingerprintGenerator = new FingerprintGenerator();
  const jitterInjector = new JitterInjector({ meanMs: 1, stdMs: 0.5, orderSizeJitterPct: 0.5 });

  return new HttpClientWrapper({
    proxyManager,
    fingerprintGenerator,
    jitterInjector,
    fetchFn: fetchFn as any,
  });
}

describe('HttpClientWrapper', () => {
  it('should make request with proxy, fingerprint, and jitter (no fetchFn)', async () => {
    const client = createWrapper();
    const res = await client.request({
      url: 'https://api.exchange.mock/v1/ticker',
      method: 'GET',
    });

    expect(res.status).toBe(200);
    expect(res.proxyUsed).toContain('proxy-');
    expect(res.fingerprintId).toBeTruthy();
    expect(res.jitterAppliedMs).toBeGreaterThanOrEqual(0);
  });

  it('should use injected fetchFn', async () => {
    const mockHeaders = new Map<string, string>();
    mockHeaders.set('content-type', 'application/json');

    const mockFetch = jest.fn().mockResolvedValue({
      status: 200,
      headers: { forEach: (cb: (v: string, k: string) => void) => mockHeaders.forEach((v, k) => cb(v, k)) },
      json: () => Promise.resolve({ price: 50000 }),
    });

    const client = createWrapper(mockFetch);
    const res = await client.request({
      url: 'https://api.exchange.mock/v1/ticker',
      method: 'GET',
      headers: { 'Authorization': 'Bearer token123' },
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(200);
    expect(res.data).toEqual({ price: 50000 });
    expect(res.proxyUsed).toContain('proxy-');
    expect(res.fingerprintId).toBeTruthy();

    // Verify fetch was called with fingerprinted headers
    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[0]).toBe('https://api.exchange.mock/v1/ticker');
    expect(callArgs[1].headers['User-Agent']).toBeTruthy();
    expect(callArgs[1].headers['Accept-Language']).toBeTruthy();
    expect(callArgs[1].agent).toBeDefined();
  });

  it('should send body for POST requests', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      status: 201,
      headers: { forEach: () => {} },
      json: () => Promise.resolve({ orderId: 'abc123' }),
    });

    const client = createWrapper(mockFetch);
    await client.request({
      url: 'https://api.exchange.mock/v1/order',
      method: 'POST',
      body: { symbol: 'BTC/USDT', side: 'buy', amount: 0.1 },
    });

    const callArgs = mockFetch.mock.calls[0];
    expect(callArgs[1].body).toBe(JSON.stringify({ symbol: 'BTC/USDT', side: 'buy', amount: 0.1 }));
  });

  it('should track request count', async () => {
    const client = createWrapper();
    expect(client.getRequestCount()).toBe(0);

    await client.request({ url: 'https://test.com', method: 'GET' });
    await client.request({ url: 'https://test.com', method: 'GET' });

    expect(client.getRequestCount()).toBe(2);
  });
});
