/**
 * Tracing Module — Distributed Tracing & Correlation IDs
 *
 * Provides correlation ID generation and propagation for distributed tracing:
 * - UUID v4 correlation ID generation
 * - Header extraction/injection for HTTP requests
 * - Middleware for automatic correlation ID propagation
 * - Trace logger wrapper for structured logging
 *
 * @example
 * ```typescript
 * import { generateCorrelationId, extractCorrelationId, injectCorrelationId } from './tracing';
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

export * from './correlation-id';
