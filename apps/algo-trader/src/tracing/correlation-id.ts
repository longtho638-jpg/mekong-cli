/**
 * Correlation ID Generator and Propagator
 *
 * Generates and propagates unique correlation IDs across services
 * for distributed tracing and request tracking.
 *
 * Correlation IDs are:
 * - UUID v4 format (RFC 4122)
 * - Added to request headers as X-Correlation-ID
 * - Logged with every trace event for cross-service tracing
 *
 * @example
 * ```typescript
 * import { generateCorrelationId, extractCorrelationId, injectCorrelationId } from './correlation-id';
 *
 * // Generate new ID at request entry point
 * const correlationId = generateCorrelationId();
 *
 * // Extract from incoming request headers
 * const extractedId = extractCorrelationId(request.headers);
 *
 * // Inject into outgoing request headers
 * injectCorrelationId(outgoingHeaders, correlationId);
 * ```
 */

import { randomBytes } from 'crypto';

/**
 * Header name for correlation ID
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Correlation ID format: UUID v4
 * Pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export type CorrelationId = string;

/**
 * Generate a new UUID v4 correlation ID
 *
 * Uses crypto.randomBytes for cryptographically secure randomness.
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * Where y is one of [8, 9, a, b] per UUID v4 spec.
 *
 * @returns UUID v4 formatted correlation ID
 */
export function generateCorrelationId(): CorrelationId {
  const bytes = randomBytes(16);

  // Set version to 4 (random UUID)
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Set variant to RFC 4122 (bits 6-7 = 10)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytes.toString('hex');

  // Format as UUID: 8-4-4-4-12
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/**
 * Extract correlation ID from headers
 *
 * Looks for X-Correlation-ID header (case-insensitive).
 * Returns null if not found or invalid format.
 *
 * @param headers - HTTP headers object (Record<string, string>)
 * @returns Correlation ID if found and valid, null otherwise
 */
export function extractCorrelationId(headers: Record<string, string | string[] | undefined | null>): CorrelationId | null {
  if (!headers || typeof headers !== 'object') {
    return null;
  }

  // Check various header name casings
  const headerNames = [
    CORRELATION_ID_HEADER,
    CORRELATION_ID_HEADER.toUpperCase(),
    'x-correlation-id',
    'X-Correlation-ID',
    'correlation-id',
    'Correlation-ID',
  ];

  let correlationId: string | string[] | undefined | null = null;
  for (const name of headerNames) {
    if (name in headers) {
      correlationId = headers[name];
      break;
    }
  }

  // Handle array headers (some servers allow multiple values)
  if (Array.isArray(correlationId)) {
    correlationId = correlationId[0];
  }

  if (!correlationId || typeof correlationId !== 'string') {
    return null;
  }

  // Validate UUID format
  if (!isValidUuid(correlationId)) {
    return null;
  }

  return correlationId;
}

/**
 * Inject correlation ID into headers
 *
 * Sets X-Correlation-ID header for outgoing requests.
 * Modifies the headers object in place.
 *
 * @param headers - HTTP headers object to modify
 * @param id - Correlation ID to inject
 */
export function injectCorrelationId(headers: Record<string, string | string[]>, id: CorrelationId): void {
  if (!headers || typeof headers !== 'object') {
    throw new Error('Headers must be an object');
  }

  if (!id || typeof id !== 'string') {
    throw new Error('Correlation ID must be a non-empty string');
  }

  if (!isValidUuid(id)) {
    throw new Error(`Invalid UUID format: ${id}`);
  }

  // Set header with standard casing
  headers[CORRELATION_ID_HEADER] = id;
}

/**
 * Validate UUID format (version 4)
 *
 * Pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * Where x is any hex digit and y is [8, 9, a, b]
 *
 * @param uuid - String to validate
 * @returns true if valid UUID v4, false otherwise
 */
export function isValidUuid(uuid: string): boolean {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
}

/**
 * Get or create correlation ID
 *
 * Utility function that extracts existing correlation ID from headers,
 * or generates a new one if not present.
 *
 * @param headers - HTTP headers object
 * @returns Existing or new correlation ID
 */
export function getOrCreateCorrelationId(headers: Record<string, string | string[] | undefined | null>): CorrelationId {
  const existing = extractCorrelationId(headers);
  return existing || generateCorrelationId();
}

/**
 * Middleware factory for correlation ID propagation
 *
 * Creates middleware that:
 * 1. Extracts correlation ID from incoming request
 * 2. Generates new ID if not present
 * 3. Adds ID to response headers
 *
 * @example
 * ```typescript
 * // Fastify middleware
 * const correlationMiddleware = createCorrelationMiddleware();
 * fastify.use(correlationMiddleware);
 *
 * // Express middleware
 * const correlationMiddleware = createCorrelationMiddleware();
 * app.use(correlationMiddleware);
 * ```
 */
export function createCorrelationMiddleware() {
  return function correlationMiddleware(
    req: { headers: Record<string, string | string[] | undefined | null>; id?: string },
    res: { setHeader?: (name: string, value: string) => void; set?: (name: string, value: string) => void },
    next: () => void
  ): void {
    // Get or create correlation ID
    const correlationId = getOrCreateCorrelationId(req.headers);

    // Store on request object for logging
    req.id = correlationId;

    // Add to response headers
    if (res.setHeader) {
      res.setHeader(CORRELATION_ID_HEADER, correlationId);
    } else if (res.set) {
      res.set(CORRELATION_ID_HEADER, correlationId);
    }

    next();
  };
}

/**
 * Logger interface for trace logging
 */
export interface TraceLogger {
  info(message: string, context: Record<string, unknown>): void;
  warn(message: string, context: Record<string, unknown>): void;
  error(message: string, context: Record<string, unknown>): void;
}

/**
 * Create a trace logger that includes correlation ID in all logs
 *
 * @param baseLogger - Base logger instance
 * @param correlationId - Correlation ID to include in all logs
 * @returns Wrapped logger with correlation context
 */
export function createTraceLogger(baseLogger: TraceLogger, correlationId: CorrelationId): TraceLogger {
  return {
    info: (message: string, context: Record<string, unknown>) =>
      baseLogger.info(message, { ...context, correlationId }),
    warn: (message: string, context: Record<string, unknown>) =>
      baseLogger.warn(message, { ...context, correlationId }),
    error: (message: string, context: Record<string, unknown>) =>
      baseLogger.error(message, { ...context, correlationId }),
  };
}
