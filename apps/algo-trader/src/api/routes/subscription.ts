/**
 * Subscription API Routes
 *
 * Handles subscription management (checkout, status, cancel)
 *
 * Security:
 * - All routes require API key authentication (via global middleware)
 * - Rate limiting applied per API key
 * - Input validation on all parameters
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PolarService } from '../../payment/polar-service';
import { LicenseService, LicenseTier, validateLicense } from '../../lib/raas-gate';

interface CreateCheckoutBody {
  tier: 'pro' | 'enterprise';
  customerEmail?: string;
}

interface SubscriptionStatusResponse {
  tier: string;
  valid: boolean;
  expiresAt?: string;
  features: string[];
}

/**
 * Register subscription routes
 */
export async function subscriptionRoutes(fastify: FastifyInstance): Promise<void> {
  const polarService = PolarService.getInstance();
  const licenseService = LicenseService.getInstance();

  /**
   * GET /api/subscription/status
   * Get current license status
   */
  fastify.get('/status', async (request, reply) => {
    try {
      const validation = await validateLicense();

      const response: SubscriptionStatusResponse = {
        tier: validation.tier,
        valid: validation.valid,
        expiresAt: validation.expiresAt,
        features: validation.features,
      };

      reply.send(response);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to get subscription status');
      reply.status(500).send({
        error: 'Failed to get subscription status',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/subscription/checkout
   * Create checkout session for subscription upgrade
   */
  fastify.post('/checkout', async (request, reply) => {
    try {
      const body = request.body as CreateCheckoutBody;

      if (!body.tier) {
        return reply.status(400).send({
          error: 'Missing tier parameter',
          required: 'pro | enterprise',
        });
      }

      // Validate tier parameter
      if (!['pro', 'enterprise'].includes(body.tier)) {
        return reply.status(400).send({
          error: 'Invalid tier',
          valid: ['pro', 'enterprise'],
        });
      }

      const tier = body.tier === 'pro' ? LicenseTier.PRO : LicenseTier.ENTERPRISE;

      // Create checkout session
      const checkout = await polarService.createCheckoutSession(tier, body.customerEmail);

      reply.send({
        checkoutUrl: checkout.url,
        checkoutId: checkout.id,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to create checkout');
      reply.status(500).send({
        error: 'Failed to create checkout session',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/subscription/activate
   * Manually activate license (for testing/debugging)
   * Rate limited: 10 requests/hour per API key
   */
  fastify.post('/activate', async (request, reply) => {
    try {
      const { tier, licenseKey } = request.body as { tier: string; licenseKey?: string };

      if (!tier) {
        return reply.status(400).send({
          error: 'Missing tier parameter',
        });
      }

      // Validate tier against LicenseTier enum
      const validTiers = Object.values(LicenseTier);
      const licenseTierUpper = tier.toUpperCase();
      if (!validTiers.includes(licenseTierUpper as LicenseTier)) {
        return reply.status(400).send({
          error: 'Invalid tier',
          valid: validTiers,
        });
      }

      await licenseService.activateLicense(licenseKey || 'manual', licenseTierUpper as LicenseTier);

      reply.send({
        success: true,
        tier: licenseTierUpper,
        message: `Activated ${licenseTierUpper} license`,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to activate license');
      reply.status(500).send({
        error: 'Failed to activate license',
        message: error.message,
      });
    }
  });

  /**
   * POST /api/subscription/downgrade
   * Downgrade to FREE tier (for testing/debugging)
   * Rate limited: 5 requests/hour per API key
   */
  fastify.post('/downgrade', async (request, reply) => {
    try {
      await licenseService.downgradeToFree('manual');

      reply.send({
        success: true,
        tier: LicenseTier.FREE,
        message: 'Downgraded to FREE license',
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      request.log.error({ error: error.message }, 'Failed to downgrade license');
      reply.status(500).send({
        error: 'Failed to downgrade license',
        message: error.message,
      });
    }
  });
}
