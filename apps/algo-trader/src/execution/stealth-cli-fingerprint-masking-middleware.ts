/**
 * Stealth CLI Fingerprint Masking Middleware
 *
 * Exchanges detect CLI bots via HTTP-level signals:
 * 1. Static User-Agent (node-fetch, axios, got → instant flag)
 * 2. Missing browser headers (Accept-Language, Sec-Fetch-*, DNT)
 * 3. Perfect request spacing (bots don't hesitate)
 * 4. No session rotation (same session for hours = bot)
 * 5. Monotonic request IDs / timestamps
 *
 * This middleware wraps ALL exchange API calls with human browser fingerprints.
 * Plugs into ExchangeGateway as composable middleware.
 *
 * Usage:
 *   gateway.use(createStealthMiddleware());
 */

import type { GatewayContext, GatewayResponse, MiddlewareFn } from './portkey-inspired-exchange-gateway-middleware-pipeline';
import { poissonDelay } from './phantom-stealth-math';

// ─── BROWSER FINGERPRINT POOL ─────────────────────────────────

/** Real Chrome/Firefox/Safari User-Agent strings (2024-2026 versions) */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
];

const ACCEPT_LANGUAGES = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9,en-US;q=0.8',
  'en-US,en;q=0.9,vi;q=0.8',
  'en,vi;q=0.9,en-US;q=0.8',
];

const SEC_FETCH_SITES = ['same-origin', 'same-site', 'cross-site'];

// ─── SESSION IDENTITY ─────────────────────────────────────────

interface SessionIdentity {
  userAgent: string;
  acceptLanguage: string;
  createdAt: number;
  requestCount: number;
  /** Session lifetime (20-90 min) — rotate identity after */
  lifetimeMs: number;
}

function createIdentity(): SessionIdentity {
  return {
    userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    acceptLanguage: ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)],
    createdAt: Date.now(),
    requestCount: 0,
    lifetimeMs: 20 * 60_000 + Math.random() * 70 * 60_000, // 20-90 min
  };
}

// ─── CONFIG ───────────────────────────────────────────────────

export interface StealthCliConfig {
  /** Add micro-delay before each request (Poisson). Default true */
  enableMicroDelay: boolean;
  /** Target API calls per minute for Poisson timing. Default 12 */
  targetCallsPerMin: number;
  /** Rotate session identity. Default true */
  enableSessionRotation: boolean;
  /** Inject browser-like headers. Default true */
  injectBrowserHeaders: boolean;
}

const DEFAULT_CONFIG: StealthCliConfig = {
  enableMicroDelay: true,
  targetCallsPerMin: 12,
  enableSessionRotation: true,
  injectBrowserHeaders: true,
};

// ─── MIDDLEWARE FACTORY ───────────────────────────────────────

/**
 * Create stealth middleware for the ExchangeGateway pipeline.
 * Injects browser fingerprints + micro-delays into every API call.
 */
export function createStealthMiddleware(
  config?: Partial<StealthCliConfig>,
): MiddlewareFn {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  let session = createIdentity();

  return async (ctx: GatewayContext, next) => {
    // 1. Session rotation check
    if (cfg.enableSessionRotation) {
      const age = Date.now() - session.createdAt;
      if (age > session.lifetimeMs || session.requestCount > 200) {
        session = createIdentity();
      }
    }
    session.requestCount++;

    // 2. Inject browser-like headers into metadata
    if (cfg.injectBrowserHeaders) {
      ctx.metadata = {
        ...ctx.metadata,
        headers: {
          'User-Agent': session.userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': session.acceptLanguage,
          'Accept-Encoding': 'gzip, deflate, br',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': SEC_FETCH_SITES[Math.floor(Math.random() * SEC_FETCH_SITES.length)],
          'DNT': '1',
          'Connection': 'keep-alive',
          ...(ctx.metadata?.headers as Record<string, string> ?? {}),
        },
      };
    }

    // 3. Micro-delay (Poisson inter-arrival — human-like hesitation)
    if (cfg.enableMicroDelay) {
      const delay = poissonDelay(cfg.targetCallsPerMin, 50, 8_000);
      await new Promise(r => setTimeout(r, delay));
    }

    // 4. Pass through to next middleware / exchange handler
    return next(ctx);
  };
}

/**
 * Get current session fingerprint for debugging/monitoring.
 * Returns safe subset (no secrets).
 */
export function getStealthStatus(config?: Partial<StealthCliConfig>): {
  configActive: boolean;
  features: string[];
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const features: string[] = [];
  if (cfg.injectBrowserHeaders) features.push('browser-headers');
  if (cfg.enableMicroDelay) features.push('poisson-micro-delay');
  if (cfg.enableSessionRotation) features.push('session-rotation');
  return { configActive: true, features };
}
