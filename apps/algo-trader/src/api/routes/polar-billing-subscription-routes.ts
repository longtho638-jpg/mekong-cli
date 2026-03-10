/**
 * Polar.sh billing routes — checkout, webhook, subscription status.
 * POST /api/v1/billing/checkout — generate checkout URL
 * POST /api/v1/billing/webhook — Polar webhook receiver (no auth)
 * GET /api/v1/billing/subscription/:tenantId — subscription status
 * GET /api/v1/billing/products — list available products/tiers
 */

import { FastifyInstance } from 'fastify';
import {
  PolarSubscriptionService,
  CheckoutRequestSchema,
} from '../../billing/polar-subscription-service';
import {
  PolarWebhookEventHandler,
  PolarWebhookPayloadSchema,
} from '../../billing/polar-webhook-event-handler';

export function buildPolarBillingRoutes(
  subscriptionService: PolarSubscriptionService,
  webhookHandler: PolarWebhookEventHandler,
) {
  return async function polarBillingRoutes(fastify: FastifyInstance): Promise<void> {

    /** GET /api/v1/billing/products — list tiers and pricing */
    fastify.get('/api/v1/billing/products', async (_req, reply) => {
      const products = subscriptionService.getProducts();
      return reply.status(200).send({ products });
    });

    /** POST /api/v1/billing/checkout — generate checkout data */
    fastify.post('/api/v1/billing/checkout', async (req, reply) => {
      const parsed = CheckoutRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid checkout request',
          details: parsed.error.issues,
        });
      }

      try {
        const checkoutData = subscriptionService.generateCheckoutData(parsed.data);
        return reply.status(200).send(checkoutData);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Checkout failed';
        return reply.status(400).send({ error: message });
      }
    });

    /** POST /api/v1/billing/webhook — Polar webhook receiver (rate limited) */
    fastify.post('/api/v1/billing/webhook', {
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      },
    }, async (req, reply) => {
      const rawBody = JSON.stringify(req.body);
      const signature = (req.headers['x-polar-signature'] ?? req.headers['webhook-signature'] ?? '') as string;
      const timestamp = new Date().toISOString();
      const sourceIp = req.ip || 'unknown';

      if (!webhookHandler.verifySignature(rawBody, signature)) {
        fastify.log.error({
          event: 'webhook_signature_invalid',
          timestamp,
          sourceIp,
          eventType: (req.body as any)?.type,
        });
        return reply.status(401).send({ error: 'Invalid webhook signature' });
      }

      const parsed = PolarWebhookPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        fastify.log.warn({
          event: 'webhook_payload_invalid',
          timestamp,
          sourceIp,
          errors: parsed.error.issues,
        });
        return reply.status(400).send({ error: 'Invalid webhook payload' });
      }

      const result = webhookHandler.handleEvent(parsed.data);
      fastify.log.info({
        event: 'webhook_processed',
        timestamp,
        sourceIp,
        eventType: parsed.data.type,
        tenantId: result.tenantId,
        action: result.action,
      });
      return reply.status(200).send(result);
    });

    /** GET /api/v1/billing/subscription/:tenantId — subscription status */
    fastify.get<{ Params: { tenantId: string } }>(
      '/api/v1/billing/subscription/:tenantId',
      async (req, reply) => {
        const { tenantId } = req.params;
        const sub = subscriptionService.getSubscription(tenantId);

        if (!sub) {
          return reply.status(200).send({
            tenantId,
            tier: 'free',
            active: false,
            currentPeriodEnd: null,
          });
        }

        return reply.status(200).send(sub);
      },
    );
  };
}
