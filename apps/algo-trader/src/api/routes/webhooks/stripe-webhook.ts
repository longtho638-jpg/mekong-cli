/**
 * Stripe Webhook API Route
 *
 * POST /api/v1/billing/stripe/webhook — Stripe webhook receiver (no auth)
 * Verifies signature, routes events to StripeWebhookHandler
 */

import { FastifyInstance } from 'fastify';
import {
  StripeWebhookHandler,
  StripeWebhookPayloadSchema,
} from '../../../billing/stripe-webhook-handler';

export function buildStripeWebhookRoute(
  webhookHandler: StripeWebhookHandler,
) {
  return async function stripeWebhookRoute(fastify: FastifyInstance): Promise<void> {

    /** POST /api/v1/billing/stripe/webhook — Stripe webhook receiver (rate limited) */
    fastify.post('/api/v1/billing/stripe/webhook', {
      config: {
        rateLimit: {
          max: 100,
          timeWindow: '1 minute',
        },
      },
    }, async (req, reply) => {
      const timestamp = new Date().toISOString();
      const sourceIp = req.ip || 'unknown';
      const signature = (req.headers['stripe-signature'] ?? '') as string;

      // Get raw body for signature verification (match Polar webhook pattern)
      const rawBody = JSON.stringify(req.body);

      // Verify webhook signature
      if (!webhookHandler.verifySignature(rawBody, signature)) {
        fastify.log.error({
          event: 'stripe_webhook_signature_invalid',
          timestamp,
          sourceIp,
          eventType: (req.body as any)?.type,
        });
        return reply.status(400).send({ error: 'Invalid webhook signature' });
      }

      // Parse and validate payload
      const parsed = StripeWebhookPayloadSchema.safeParse(req.body);
      if (!parsed.success) {
        fastify.log.warn({
          event: 'stripe_webhook_payload_invalid',
          timestamp,
          sourceIp,
          errors: parsed.error.issues,
        });
        return reply.status(400).send({ error: 'Invalid webhook payload' });
      }

      // Handle event
      try {
        const result = webhookHandler.handleEvent(parsed.data);
        fastify.log.info({
          event: 'stripe_webhook_processed',
          timestamp,
          sourceIp,
          eventType: parsed.data.type,
          tenantId: result.tenantId,
          action: result.action,
          handled: result.handled,
        });
        return reply.status(200).send(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        fastify.log.error({
          event: 'stripe_webhook_error',
          timestamp,
          sourceIp,
          eventType: parsed.data.type,
          error: message,
        });
        return reply.status(500).send({ error: 'Failed to process webhook' });
      }
    });
  };
}
