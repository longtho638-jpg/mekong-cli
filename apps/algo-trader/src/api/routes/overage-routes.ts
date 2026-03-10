/**
 * Overage API Routes
 *
 * Public endpoints for overage calculation and queries.
 * Secured via JWT + mk_ API key authentication (same as RaaS Gateway).
 *
 * Endpoints:
 * - GET /v1/overage/calculate/:tenantId - Calculate overage for current period
 * - GET /v1/overage/calculate/:tenantId/export - Export overage for billing period
 * - POST /v1/overage/sync - Trigger bulk overage calculation for all tenants
 *
 * @see apps/raas-gateway/index.js - RaaS Gateway auth patterns
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../../utils/logger';
import { overageCalculator, OverageSummary, OverageCharge } from '../../billing/overage-calculator';
import { stripeInvoiceService, InvoiceOptions } from '../../billing/stripe-invoice-service';

/**
 * Overage calculation response
 */
export interface OverageResponse {
  success: boolean;
  data?: OverageSummary;
  error?: string;
  message?: string;
}

/**
 * Bulk sync response
 */
export interface BulkOverageResponse {
  success: boolean;
  period: string;
  totalTenants: number;
  tenantsWithOverage: number;
  totalOverageRevenue: number;
  summaries: OverageSummary[];
}

/**
 * Invoice creation request
 */
export interface InvoiceCreateRequest {
  /** Stripe customer ID (required) */
  customerId: string;
  /** Billing period YYYY-MM (default: current month) */
  period?: string;
  /** Number of days until invoice is due (default: 30) */
  daysUntilDue?: number;
  /** Custom description for invoice */
  description?: string;
  /** Whether to auto-finalize invoice (default: false) */
  autoFinalize?: boolean;
  /** Metadata to attach to invoice */
  metadata?: Record<string, string>;
}

/**
 * Invoice creation response
 */
export interface InvoiceCreateResponse {
  success: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  hostedInvoiceUrl?: string;
  totalAmount?: number;
  currency?: string;
  error?: string;
}

/**
 * Verify JWT or mk_ API key from headers
 *
 * Follows same pattern as RaaS Gateway (raas.agencyos.network):
 * - Authorization: Bearer <jwt_token>
 * - X-API-Key: <mk_api_key>
 *
 * @param request - Fastify request object
 * @returns Decoded auth context or null if invalid
 */
async function verifyAuth(
  request: FastifyRequest
): Promise<{ tenantId: string; role: string } | null> {
  // Try mk_ API key first (priority as per RaaS Gateway)
  const apiKey = request.headers['x-api-key'] as string;
  if (apiKey && apiKey.startsWith('mk_')) {
    // Validate mk_ key format: mk_<key>:<tenantId>:<tier>
    const parts = apiKey.slice(3).split(':');
    if (parts.length === 3) {
      const tenantId = parts[1];
      const tier = parts[2];
      logger.debug('[Overage API] mk_ API key auth', { tenantId, tier });
      return { tenantId, role: tier };
    }
  }

  // Try JWT token
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);

    try {
      // Decode JWT without verification (edge-side validation like RaaS Gateway)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

        // Check expiry
        if (payload.exp && payload.exp < Date.now() / 1000) {
          logger.warn('[Overage API] JWT expired');
          return null;
        }

        const tenantId = payload.tenant_id || payload.sub;
        const role = payload.role || 'user';

        if (tenantId) {
          logger.debug('[Overage API] JWT auth', { tenantId, role });
          return { tenantId, role };
        }
      }
    } catch (e) {
      logger.debug('[Overage API] JWT decode failed');
    }
  }

  // Fallback to env-based auth for dev/testing
  const devApiKey = process.env.OVERAGE_API_KEY;
  if (devApiKey && apiKey === devApiKey) {
    logger.debug('[Overage API] Dev API key auth');
    return { tenantId: 'dev', role: 'admin' };
  }

  return null;
}

/**
 * Register overage API routes
 */
export async function registerOverageRoutes(fastify: FastifyInstance) {
  /**
   * GET /v1/overage/calculate/:tenantId
   *
   * Calculate overage charges for a specific tenant.
   *
   * Headers:
   * - Authorization: Bearer <jwt_token> OR
   * - X-API-Key: <mk_api_key>
   *
   * Query params:
   * - period: YYYY-MM format (default: current month)
   *
   * Response:
   * - success: boolean
   * - data: OverageSummary with charges breakdown
   * - error: Error message if failed
   */
  fastify.get(
    '/v1/overage/calculate/:tenantId',
    async (
      request: FastifyRequest<{
        Params: { tenantId: string };
        Querystring: { period?: string };
      }>,
      reply: FastifyReply
    ) => {
      // Verify auth
      const auth = await verifyAuth(request);
      if (!auth) {
        logger.warn('[Overage API] Unauthorized access attempt');
        return reply.code(401).send({
          success: false,
          error: 'Unauthorized',
          message: 'Valid JWT or mk_ API key required',
        } as OverageResponse);
      }

      const { tenantId } = request.params;
      const { period } = request.query;

      // Validate tenantId format
      if (!tenantId || tenantId.length < 3) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Invalid tenantId format',
        } as OverageResponse);
      }

      // Validate period format if provided
      if (period && !/^\d{4}-\d{2}$/.test(period)) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Invalid period format - use YYYY-MM',
        } as OverageResponse);
      }

      try {
        const calculator = overageCalculator;
        const summary = await calculator.calculateOverageSummary(tenantId, period);

        if (!summary) {
          return reply.code(404).send({
            success: false,
            error: 'Not Found',
            message: `Tenant not found: ${tenantId}`,
          } as OverageResponse);
        }

        logger.info('[Overage API] Calculation complete', {
          tenantId,
          period: summary.period,
          totalOverage: summary.totalOverage,
          chargesCount: summary.charges.length,
        });

        return reply.code(200).send({
          success: true,
          data: summary,
        } as OverageResponse);
      } catch (error) {
        logger.error('[Overage API] Calculation error', {
          tenantId,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to calculate overage',
        } as OverageResponse);
      }
    }
  );

  /**
   * GET /v1/overage/calculate/:tenantId/export
   *
   * Export overage in Stripe-compatible format for billing sync.
   *
   * Headers:
   * - Authorization: Bearer <jwt_token> OR
   * - X-API-Key: <mk_api_key>
   *
   * Query params:
   * - period: YYYY-MM format (default: current month)
   * - subscription_item: Stripe subscription item ID (required)
   *
   * Response:
   * - subscription_item: Stripe subscription item ID
   * - period: Billing period
   * - records: Array of Stripe usage records
   * - totalOverage: Total overage charge
   */
  fastify.get(
    '/v1/overage/calculate/:tenantId/export',
    async (
      request: FastifyRequest<{
        Params: { tenantId: string };
        Querystring: { period?: string; subscription_item?: string };
      }>,
      reply: FastifyReply
    ) => {
      // Verify auth
      const auth = await verifyAuth(request);
      if (!auth) {
        return reply.code(401).send({ error: 'Unauthorized' });
      }

      const { tenantId } = request.params;
      const { period, subscription_item } = request.query;

      // Validate subscription_item
      if (!subscription_item) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'subscription_item query param required',
        });
      }

      try {
        const calculator = overageCalculator;
        const summary = await calculator.calculateOverageSummary(tenantId, period);

        if (!summary) {
          return reply.code(404).send({ error: 'Tenant not found' });
        }

        // Convert to Stripe format
        const now = Math.floor(Date.now() / 1000);
        const records = summary.charges.map((charge: OverageCharge) => ({
          subscription_item,
          quantity: charge.overageUnits,
          timestamp: now,
          action: 'increment' as const,
        }));

        logger.info('[Overage API] Export complete', {
          tenantId,
          recordsCount: records.length,
          totalOverage: summary.totalOverage,
        });

        return reply.code(200).send({
          subscription_item,
          period: summary.period,
          records,
          totalOverage: summary.totalOverage,
        });
      } catch (error) {
        logger.error('[Overage API] Export error', {
          tenantId,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  /**
   * POST /v1/overage/sync
   *
   * Trigger bulk overage calculation for all active tenants.
   * Used by periodic billing sync jobs.
   *
   * Headers:
   * - Authorization: Bearer <jwt_token> OR
   * - X-API-Key: <mk_api_key>
   *
   * Body (optional):
   * - period: YYYY-MM format (default: current month)
   *
   * Response:
   * - success: boolean
   * - period: Processed period
   * - totalTenants: Number of tenants processed
   * - tenantsWithOverage: Number of tenants with overage charges
   * - totalOverageRevenue: Total overage revenue
   * - summaries: Array of overage summaries
   */
  fastify.post(
    '/v1/overage/sync',
    async (
      request: FastifyRequest<{
        Body?: { period?: string };
      }>,
      reply: FastifyReply
    ) => {
      // Verify auth (admin only)
      const auth = await verifyAuth(request);
      if (!auth || auth.role !== 'admin') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
        });
      }

      const period = request.body?.period;

      // Validate period format if provided
      if (period && !/^\d{4}-\d{2}$/.test(period)) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Invalid period format - use YYYY-MM',
        });
      }

      try {
        const calculator = overageCalculator;
        const summaries = await calculator.getTenantsWithOverage(period);

        const totalTenants = summaries.length;
        const tenantsWithOverage = summaries.filter((s: OverageSummary) => s.totalOverage > 0).length;
        const totalOverageRevenue = summaries.reduce(
          (sum: number, s: OverageSummary) => sum + s.totalOverage,
          0
        );

        logger.info('[Overage API] Bulk sync complete', {
          period: period || 'current',
          totalTenants,
          tenantsWithOverage,
          totalOverageRevenue,
        });

        return reply.code(200).send({
          success: true,
          period: period || new Date().toISOString().slice(0, 7),
          totalTenants,
          tenantsWithOverage,
          totalOverageRevenue,
          summaries,
        } as BulkOverageResponse);
      } catch (error) {
        logger.error('[Overage API] Bulk sync error', {
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to sync overage data',
        });
      }
    }
  );

  /**
   * POST /v1/overage/invoice
   *
   * Create Stripe invoice for overage charges.
   * Admin-only endpoint for manual invoice creation.
   *
   * Headers:
   * - Authorization: Bearer <jwt_token> OR
   * - X-API-Key: <mk_api_key>
   *
   * Body:
   * - customerId: Stripe customer ID (required)
   * - period: YYYY-MM format (default: current month)
   * - daysUntilDue: Days until invoice due (default: 30)
   * - description: Custom invoice description
   * - autoFinalize: Auto-finalize invoice (default: false)
   * - metadata: Custom metadata for invoice
   *
   * Response:
   * - success: boolean
   * - invoiceId: Stripe invoice ID
   * - invoiceNumber: Invoice number
   * - hostedInvoiceUrl: URL to view/pay invoice
   * - totalAmount: Total amount in cents
   * - currency: Currency code (usd)
   * - error: Error message if failed
   */
  fastify.post(
    '/v1/overage/invoice',
    async (
      request: FastifyRequest<{
        Body: InvoiceCreateRequest;
      }>,
      reply: FastifyReply
    ) => {
      // Verify auth (admin only)
      const auth = await verifyAuth(request);
      if (!auth || auth.role !== 'admin') {
        return reply.code(403).send({
          success: false,
          error: 'Forbidden',
          message: 'Admin access required',
        } as InvoiceCreateResponse);
      }

      const body = request.body;

      // Validate customerId
      if (!body.customerId) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'customerId is required',
        } as InvoiceCreateResponse);
      }

      // Validate customerId format
      if (!body.customerId.startsWith('cus_')) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'customerId must be a Stripe customer ID (cus_*)',
        } as InvoiceCreateResponse);
      }

      // Validate period format if provided
      if (body.period && !/^\d{4}-\d{2}$/.test(body.period)) {
        return reply.code(400).send({
          success: false,
          error: 'Bad Request',
          message: 'Invalid period format - use YYYY-MM',
        } as InvoiceCreateResponse);
      }

      try {
        // Calculate overage for the period
        const calculator = overageCalculator;
        const summary = await calculator.calculateOverageWithStripe({
          customerId: body.customerId,
          period: body.period,
        });

        // Check if there are any overage charges
        if (!summary || summary.totalOverage <= 0) {
          return reply.code(400).send({
            success: false,
            error: 'Bad Request',
            message: 'No overage charges for this period',
          } as InvoiceCreateResponse);
        }

        // Build invoice options
        const invoiceOptions: InvoiceOptions = {
          daysUntilDue: body.daysUntilDue || 30,
          description: body.description || `Overage charges for ${summary.period}`,
          autoFinalize: body.autoFinalize || false,
          metadata: {
            ...body.metadata,
            tenantId: summary.tenantId,
            period: summary.period,
            tier: summary.tier,
          },
        };

        // Create invoice
        const invoiceService = stripeInvoiceService;
        const result = await invoiceService.createOverageInvoice(
          body.customerId,
          summary,
          invoiceOptions
        );

        if (!result.success) {
          return reply.code(500).send({
            success: false,
            error: 'Internal Server Error',
            message: result.error || 'Failed to create invoice',
          } as InvoiceCreateResponse);
        }

        logger.info('[Overage API] Invoice created', {
          invoiceId: result.invoiceId,
          customerId: body.customerId,
          tenantId: summary.tenantId,
          totalAmount: result.totalAmount,
        });

        return reply.code(200).send({
          success: true,
          invoiceId: result.invoiceId,
          invoiceNumber: result.invoiceNumber,
          hostedInvoiceUrl: result.hostessUrl,
          totalAmount: result.totalAmount,
          currency: result.currency,
        } as InvoiceCreateResponse);
      } catch (error) {
        logger.error('[Overage API] Invoice creation error', {
          customerId: body.customerId,
          error: error instanceof Error ? error.message : error,
        });
        return reply.code(500).send({
          success: false,
          error: 'Internal Server Error',
          message: 'Failed to create invoice',
        } as InvoiceCreateResponse);
      }
    }
  );

  logger.info('[Overage API] Routes registered');
}
