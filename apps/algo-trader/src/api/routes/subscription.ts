/**
 * Subscription API Routes
 *
 * Handles subscription management (checkout, status, cancel)
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
    } catch (error) {
      request.log.error('Failed to get subscription status', error);
      reply.status(500).send({
        error: 'Failed to get subscription status',
        message: error instanceof Error ? error.message : String(error),
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

      const tier = body.tier === 'pro' ? LicenseTier.PRO : LicenseTier.ENTERPRISE;

      // Create checkout session
      const checkout = await polarService.createCheckoutSession(tier, body.customerEmail);

      reply.send({
        checkoutUrl: checkout.url,
        checkoutId: checkout.id,
      });
    } catch (error) {
      request.log.error('Failed to create checkout', error);
      reply.status(500).send({
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/subscription/activate
   * Manually activate license (for testing/debugging)
   */
  fastify.post('/activate', async (request, reply) => {
    try {
      const { tier, licenseKey } = request.body as { tier: string; licenseKey?: string };

      if (!tier) {
        return reply.status(400).send({
          error: 'Missing tier parameter',
        });
      }

      const licenseTier = tier.toUpperCase() as LicenseTier;
      await licenseService.activateLicense(licenseKey || 'manual', licenseTier);

      reply.send({
        success: true,
        tier: licenseTier,
        message: `Activated ${licenseTier} license`,
      });
    } catch (error) {
      request.log.error('Failed to activate license', error);
      reply.status(500).send({
        error: 'Failed to activate license',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });

  /**
   * POST /api/subscription/downgrade
   * Downgrade to FREE tier (for testing/debugging)
   */
  fastify.post('/downgrade', async (request, reply) => {
    try {
      await licenseService.downgradeToFree('manual');

      reply.send({
        success: true,
        tier: LicenseTier.FREE,
        message: 'Downgraded to FREE license',
      });
    } catch (error) {
      request.log.error('Failed to downgrade license', error);
      reply.status(500).send({
        error: 'Failed to downgrade license',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
