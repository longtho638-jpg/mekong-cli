/**
 * HTTP Client Wrapper — combines proxy, fingerprint, and jitter
 * into a single request() function for ghost-mode API calls.
 */
import { GhostRequestOptions, GhostResponse } from '../types';
import { ProxyManager } from './proxy-manager';
import { FingerprintGenerator } from './fingerprint-generator';
import { JitterInjector } from './jitter-injector';

export interface HttpClientDeps {
  proxyManager: ProxyManager;
  fingerprintGenerator: FingerprintGenerator;
  jitterInjector: JitterInjector;
  /** Injectable fetch function for testing */
  fetchFn?: (url: string, init: RequestInit & { agent?: unknown }) => Promise<{ status: number; headers: Headers; json: () => Promise<unknown> }>;
}

export class HttpClientWrapper {
  private proxyManager: ProxyManager;
  private fingerprintGenerator: FingerprintGenerator;
  private jitterInjector: JitterInjector;
  private fetchFn: HttpClientDeps['fetchFn'];
  private requestCount = 0;

  constructor(deps: HttpClientDeps) {
    this.proxyManager = deps.proxyManager;
    this.fingerprintGenerator = deps.fingerprintGenerator;
    this.jitterInjector = deps.jitterInjector;
    this.fetchFn = deps.fetchFn;
  }

  /** Execute a ghost-mode HTTP request with proxy + fingerprint + jitter */
  async request(options: GhostRequestOptions): Promise<GhostResponse> {
    // 1. Apply jitter delay
    const jitterMs = await this.jitterInjector.applyDelay();

    // 2. Get proxy
    const proxy = this.proxyManager.getProxy();
    const proxyUrl = `${proxy.protocol}://${proxy.host}:${proxy.port}`;

    // 3. Get fingerprint
    const fp = this.fingerprintGenerator.getFingerprint();

    // 4. Build headers with fingerprint
    const headers = this.fingerprintGenerator.applyToHeaders(
      options.headers ?? {},
      fp,
    );

    // 5. Execute request
    this.requestCount++;

    if (this.fetchFn) {
      const res = await this.fetchFn(options.url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        agent: { proxy: proxyUrl },
      });

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((v: string, k: string) => { responseHeaders[k] = v; });

      return {
        status: res.status,
        headers: responseHeaders,
        data: await res.json(),
        proxyUsed: proxyUrl,
        fingerprintId: fp.id,
        jitterAppliedMs: jitterMs,
      };
    }

    // Fallback: return mock response for environments without fetch
    return {
      status: 200,
      headers: {},
      data: null,
      proxyUsed: proxyUrl,
      fingerprintId: fp.id,
      jitterAppliedMs: jitterMs,
    };
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}
