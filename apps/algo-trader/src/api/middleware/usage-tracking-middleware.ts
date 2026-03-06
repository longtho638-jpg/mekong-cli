/**
 * Usage Tracking Middleware for Fastify
 *
 * Auto-tracks API calls and ML compute time per license.
 * Non-blocking: events buffered asynchronously by UsageTrackerService.
 *
 * Tracks:
 * - API calls: licenseKey, path, method, duration
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
import { UsageTrackerService } from '../../metering/usage-tracker-service';

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
  '/api/backtest/',
  '/ml/',
  '/predict/',
  '/optimize/',
];

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
 * Check if path is an ML endpoint (for compute timing)
 */
function isMlEndpoint(path: string): boolean {
  return ML_ENDPOINT_PATTERNS.some((pattern) => path.includes(pattern));
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

      // Track API call (only for licensed requests)
      if (licenseKey) {
        await tracker.track(licenseKey, 'api_call', 1, {
          path: request.url,
          method: request.method,
          durationMs: elapsedMs,
          statusCode: reply.statusCode,
        });

        // Track compute time for ML endpoints
        if (opts.includeComputeTiming && isMlEndpoint(request.url)) {
          const computeMinutes = elapsedMs / 60000; // Convert ms to minutes
          await tracker.track(licenseKey, 'compute_minutes', computeMinutes, {
            path: request.url,
            durationMs: elapsedMs,
          });
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
