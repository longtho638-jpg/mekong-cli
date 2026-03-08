/**
 * Audit Logs API Routes
 *
 * Admin-only endpoints for querying audit logs.
 * Requires admin JWT scope for all operations.
 *
 * Endpoints:
 * - GET /api/v1/audit/logs?from=ISO&to=ISO&userId=xxx&tenantId=xxx
 * - GET /api/v1/audit/logs/:orderId
 * - GET /api/v1/audit/verify-integrity
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createAuditLogRepository, AuditLogRepository } from '../../execution/audit-log-repository';
import { createComplianceAuditLogger } from '../../execution/compliance-audit-logger';
import { logger } from '../../utils/logger';

/**
 * RBAC Middleware: Check admin scope
 * Admin scope required for all audit endpoints
 */
async function requireAdminScope(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;

  // Check for admin role or admin scope in JWT
  const hasAdminRole = user?.role === 'admin';
  const hasAdminScope = user?.scope?.includes('admin') || user?.scopes?.includes('admin');

  if (!hasAdminRole && !hasAdminScope) {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin scope required to access audit logs',
    });
    throw new Error('Unauthorized');
  }
}

/**
 * Query parameters for audit log retrieval
 */
interface AuditLogsQuery {
  from?: string;      // ISO 8601 date
  to?: string;        // ISO 8601 date
  userId?: string;
  tenantId?: string;
  orderId?: string;
  eventType?: string;
  limit?: string;
  offset?: string;
}

/**
 * Audit log response format
 */
interface AuditLogResponse {
  logs: Array<{
    id: string;
    eventType: string;
    tenantId: string;
    orderId?: string;
    userId: string;
    timestamp: string;
    severity: string;
    payload: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    catOrderRef?: string;
    catEventCategory?: string;
    symbol?: string;
    side?: string;
    amount?: number;
    price?: number;
    hash?: string;
    prevHash?: string;
  }>;
  total: number;
  integrityVerified?: boolean;
}

/**
 * Integrity verification response
 */
interface IntegrityResponse {
  valid: boolean;
  verifiedAt: string;
  brokenAt?: string;
  details?: string;
  tenantId?: string;
}

/**
 * Create audit routes plugin
 */
export async function createAuditRoutes(): Promise<FastifyInstance> {
  const fastify = require('fastify')({ logger: false });

  // Register auth middleware (assumes parent server has raasAuthMiddleware)

  /**
   * GET /api/v1/audit/logs
   * Query audit logs with filters
   * Requires: admin scope
   *
   * Query params:
   * - from: ISO 8601 start date
   * - to: ISO 8601 end date
   * - userId: Filter by user ID
   * - tenantId: Filter by tenant ID
   * - orderId: Filter by order ID
   * - eventType: Filter by event type
   * - limit: Max results (default: 1000)
   * - offset: Pagination offset (default: 0)
   */
  fastify.get<{ Querystring: AuditLogsQuery }>(
    '/api/v1/audit/logs',
    {
      preHandler: [requireAdminScope],
      schema: {
        description: 'Query audit logs with filters (admin only)',
        tags: ['audit', 'compliance'],
        querystring: {
          type: 'object',
          properties: {
            from: { type: 'string', format: 'date-time', description: 'Start date (ISO 8601)' },
            to: { type: 'string', format: 'date-time', description: 'End date (ISO 8601)' },
            userId: { type: 'string', description: 'Filter by user ID' },
            tenantId: { type: 'string', description: 'Filter by tenant ID' },
            orderId: { type: 'string', description: 'Filter by order ID' },
            eventType: { type: 'string', description: 'Filter by event type' },
            limit: { type: 'string', description: 'Max results (default: 1000)' },
            offset: { type: 'string', description: 'Pagination offset' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              logs: { type: 'array' },
              total: { type: 'number' },
              integrityVerified: { type: 'boolean' },
            },
          },
          403: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const {
          from,
          to,
          userId,
          tenantId,
          orderId,
          eventType,
          limit = '1000',
          offset = '0',
        } = request.query;

        const repository = createAuditLogRepository();

        // Parse dates
        const fromDate = from ? new Date(from) : new Date(0);
        const toDate = to ? new Date(to) : new Date();

        // Build query
        const logs = await repository.find({
          tenantId: tenantId || undefined,
          userId: userId || undefined,
          orderId: orderId || undefined,
          eventType: eventType || undefined,
          fromDate,
          toDate,
          limit: parseInt(limit, 10),
          offset: parseInt(offset, 10),
        });

        // Get total count
        const total = await repository.count({
          tenantId: tenantId || undefined,
          userId: userId || undefined,
          orderId: orderId || undefined,
          eventType: eventType || undefined,
          fromDate,
          toDate,
        });

        await repository.destroy();

        const response: AuditLogResponse = {
          logs: logs.map((log) => ({
            id: log.id,
            eventType: log.eventType,
            tenantId: log.tenantId,
            orderId: log.orderId,
            userId: log.userId,
            timestamp: log.timestamp.toISOString(),
            severity: log.severity,
            payload: log.payload,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            catOrderRef: log.catOrderRef,
            catEventCategory: log.catEventCategory,
            symbol: log.symbol,
            side: log.side,
            amount: log.amount,
            price: log.price,
            hash: log.hash,
            prevHash: log.prevHash,
          })),
          total,
          integrityVerified: true,
        };

        reply.send(response);
      } catch (error) {
        logger.error('[AuditRoutes] Failed to query audit logs:', error);
        reply.code(500).send({
          error: 'Failed to query audit logs',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/v1/audit/logs/:orderId
   * Get audit trail for a specific order
   * Requires: admin scope
   */
  fastify.get<{ Params: { orderId: string } }>(
    '/api/v1/audit/logs/:orderId',
    {
      preHandler: [requireAdminScope],
      schema: {
        description: 'Get audit trail for a specific order (admin only)',
        tags: ['audit', 'compliance'],
        params: {
          type: 'object',
          properties: {
            orderId: { type: 'string', description: 'Order ID' },
          },
          required: ['orderId'],
        },
      },
    },
    async (request, reply) => {
      try {
        const repository = createAuditLogRepository();
        const logs = await repository.findByOrderId(request.params.orderId);
        await repository.destroy();

        reply.send({
          orderId: request.params.orderId,
          logs: logs.map((log) => ({
            id: log.id,
            eventType: log.eventType,
            timestamp: log.timestamp.toISOString(),
            severity: log.severity,
            payload: log.payload,
            hash: log.hash,
            prevHash: log.prevHash,
          })),
          total: logs.length,
        });
      } catch (error) {
        logger.error('[AuditRoutes] Failed to get order audit trail:', error);
        reply.code(500).send({
          error: 'Failed to get order audit trail',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * GET /api/v1/audit/verify-integrity
   * Verify hash chain integrity
   * Requires: admin scope
   */
  fastify.get<{ Querystring: { tenantId?: string } }>(
    '/api/v1/audit/verify-integrity',
    {
      preHandler: [requireAdminScope],
      schema: {
        description: 'Verify audit log hash chain integrity (admin only)',
        tags: ['audit', 'compliance', 'security'],
        querystring: {
          type: 'object',
          properties: {
            tenantId: { type: 'string', description: 'Optional: verify specific tenant only' },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const repository = createAuditLogRepository();
        const result = await repository.verifyIntegrity(request.query.tenantId);
        await repository.destroy();

        const response: IntegrityResponse = {
          valid: result.valid,
          verifiedAt: new Date().toISOString(),
          brokenAt: result.brokenAt,
          details: result.details,
          tenantId: request.query.tenantId,
        };

        if (!result.valid) {
          logger.error('[AuditRoutes] Integrity verification FAILED:', {
            brokenAt: result.brokenAt,
            details: result.details,
          });
          reply.status(400).send(response);
        } else {
          reply.send(response);
        }
      } catch (error) {
        logger.error('[AuditRoutes] Integrity verification failed:', error);
        reply.code(500).send({
          error: 'Integrity verification failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  return fastify;
}

/**
 * Register audit routes with existing Fastify server
 */
export async function registerAuditRoutes(server: FastifyInstance) {
  const auditPlugin = await createAuditRoutes();
  await server.register(auditPlugin);
  logger.info('[AuditRoutes] Registered /api/v1/audit endpoints');
}
