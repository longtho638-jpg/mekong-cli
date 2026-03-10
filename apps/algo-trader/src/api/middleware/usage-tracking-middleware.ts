/**
 * Usage Tracking Middleware for Fastify
 *
 * Auto-tracks API calls and ML compute time per license.
 * Non-blocking: events buffered asynchronously by UsageTrackerService.
 * Syncs to Cloudflare KV via trackWithKVSync for RaaS Gateway compatibility.
 *
 * Tracks:
 * - API calls: licenseKey, path, method, duration
 * - Backtest runs: per execution
 * - Trade executions: per order
 * - Compute minutes for ML endpoints
 *
 * Usage:
 * ```typescript
 * // Register in fastify-raas-server.ts
 * import { usageTrackingPlugin } from './middleware/usage-tracking-middleware';
 * void server.register(usageTrackingPlugin);
 * ```
 */

import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import { UsageTrackerService, BillableEventType } from '../../metering/usage-tracker-service';

export interface UsageTrackingOptions {
  enabled?: boolean;
  excludePaths?: string[];
  includeComputeTiming?: boolean;
}

const DEFAULT_OPTIONS: Required<UsageTrackingOptions> = {
  enabled: true,
  excludePaths: ['/health', '/ready', '/metrics', '/internal'],
  includeComputeTiming: true,
};

/**
 * ML endpoint patterns (for compute timing)
 */
const ML_ENDPOINT_PATTERNS = [
  '/api/ml/',
  '/api/predict/',
  '/api/inference/',
  '/ml/',
  '/predict/',
  '/optimize/',
];

/**
 * Backtest endpoint patterns
 */
const BACKTEST_PATTERNS = ['/api/backtest/', '/backtest/'];

/**
 * Trade execution endpoint patterns
 */
const TRADE_PATTERNS = ['/api/trade/', '/api/orders/', '/trade/', '/orders/'];

/**
 * Strategy execution endpoint patterns
 */
const STRATEGY_PATTERNS = ['/api/strategy/', '/strategy/run'];

/**
 * Get event type based on endpoint path
 */
function getEventType(path: string, method: string): BillableEventType {
  // Check backtest first
  if (BACKTEST_PATTERNS.some(p => path.includes(p)) && method === 'POST') {
    return BillableEventType.BACKTEST_RUN;
  }

  // Check trade execution
  if (TRADE_PATTERNS.some(p => path.includes(p)) && (method === 'POST' || method === 'PUT')) {
    return BillableEventType.TRADE_EXECUTION;
  }

  // Check strategy execution
  if (STRATEGY_PATTERNS.some(p => path.includes(p))) {
    return BillableEventType.STRATEGY_EXECUTION;
  }

  // Check ML inference
  if (ML_ENDPOINT_PATTERNS.some(p => path.includes(p))) {
    return BillableEventType.ML_INFERENCE;
  }

  // Default to API call
  return BillableEventType.API_CALL;
}

/**
 * Extract license key from request
 * Priority: X-API-Key > Authorization Bearer
 */
function extractLicenseKey(request: FastifyRequest): string | undefined {
  // Check X-API-Key header first
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey) return apiKey;

  // Check Authorization Bearer token
  const authHeader = request.headers['authorization'] as string;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return undefined;
}

/**
 * Check if path should be excluded from tracking
 */
function isExcludedPath(path: string, excludePaths: string[]): boolean {
  return excludePaths.some((excluded) => {
    if (excluded.endsWith('*')) {
      return path.startsWith(excluded.slice(0, -1));
    }
    return path === excluded || path.startsWith(excluded + '/');
  });
}

/**
 * Usage tracking middleware factory
 *
 * Creates Fastify hooks that:
 * 1. onRequest: Records start time and extracts license key
 * 2. onSend: Tracks API call + compute time for ML endpoints
 */
export function createUsageTrackingMiddleware(
  tracker: UsageTrackerService,
  options: UsageTrackingOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return {
    onRequest: async (request: FastifyRequest, reply: FastifyReply) => {
      if (!opts.enabled) {
        return;
      }

      // Skip excluded paths (health, metrics, internal)
      if (isExcludedPath(request.url, opts.excludePaths)) {
        return;
      }

      // Store start time on request for duration tracking
      (request as any).startTime = Date.now();
    },
    onSend: async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
      if (!opts.enabled) {
        return payload;
      }

      // Skip excluded paths
      if (isExcludedPath(request.url, opts.excludePaths)) {
        return payload;
      }

      const licenseKey = extractLicenseKey(request);
      const startTime = (request as any).startTime || Date.now();
      const elapsedMs = Date.now() - startTime;

      // Track with KV sync (only for licensed requests)
      if (licenseKey) {
        const eventType = getEventType(request.url, request.method);

        // Track main event with KV sync
        await tracker.trackWithKVSync(licenseKey, eventType, 1, {
          path: request.url,
          method: request.method,
          durationMs: elapsedMs,
          statusCode: reply.statusCode,
        });

        // Track compute time for ML endpoints (additional metric)
        if (opts.includeComputeTiming && eventType === BillableEventType.ML_INFERENCE) {
          const computeMinutes = elapsedMs / 60000; // Convert ms to minutes
          if (computeMinutes > 0.001) { // Only track if > 1ms
            await tracker.trackWithKVSync(licenseKey, 'compute_minute', computeMinutes, {
              path: request.url,
              durationMs: elapsedMs,
            });
          }
        }
      }

      return payload;
    },
  };
}

/**
 * Fastify plugin for easy registration
 *
 * Usage:
 * ```typescript
 * void server.register(usageTrackingPlugin);
 * ```
 */
export async function usageTrackingPlugin(
  fastify: FastifyInstance,
  options: UsageTrackingOptions = {}
) {
  const tracker = UsageTrackerService.getInstance();
  const hooks = createUsageTrackingMiddleware(tracker, options);

  fastify.addHook('onRequest', hooks.onRequest);
  fastify.addHook('onSend', hooks.onSend);

  fastify.log.info('[UsageTracking] Plugin registered');
}

/**
 * Higher-order function for manual compute tracking
 * Wraps an async operation and records compute time
 *
 * Usage:
 * ```typescript
 * const result = await withComputeTracking(
 *   tracker,
 *   'license-key',
 *   () => runMLModel(data),
 *   'ml-model-v1'
 * );
 * ```
 */
export async function withComputeTracking<T>(
  tracker: UsageTrackerService,
  licenseKey: string,
  operation: () => Promise<T>,
  model?: string
): Promise<T> {
  const startTime = Date.now();

  try {
    return await operation();
  } finally {
    const elapsedMs = Date.now() - startTime;
    const computeMinutes = elapsedMs / 60000;

    await tracker.track(licenseKey, 'compute_minutes', computeMinutes, {
      model: model || 'unknown',
      durationMs: elapsedMs,
    });
  }
}
