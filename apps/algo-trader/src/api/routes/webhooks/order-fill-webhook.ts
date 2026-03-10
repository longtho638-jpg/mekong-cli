/**
 * Order Fill Webhook Handler
 *
 * Handles webhook callbacks from exchanges/brokers when orders are filled.
 * Supports idempotent processing to handle duplicate webhook deliveries.
 *
 * Webhook signature verification ensures authenticity.
 */

import { Hono } from 'hono';
import { getOrderLifecycleManager } from '../../../execution/order-lifecycle-manager';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Webhook payload schema
 */
export interface FillWebhookPayload {
  order_id: string;
  fill_price: number;
  fill_amount: number;
  timestamp: number;
  webhook_id?: string;          // For idempotency
  exchange_id?: string;
  signature?: string;           // HMAC signature
}

/**
 * Webhook signature verification
 *
 * Verifies HMAC-SHA256 signature from webhook provider
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(signature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    return false;
  }
}

/**
 * Get webhook secret for tenant/exchange
 *
 * In production, fetch from secure storage (e.g., environment variables, secret manager)
 */
function getWebhookSecret(exchangeId: string): string {
  const secrets: Record<string, string> = {
    binance: process.env.BINANCE_WEBHOOK_SECRET || '',
    okx: process.env.OKX_WEBHOOK_SECRET || '',
    bybit: process.env.BYBIT_WEBHOOK_SECRET || '',
    alpaca: process.env.ALPACA_WEBHOOK_SECRET || '',
    default: process.env.DEFAULT_WEBHOOK_SECRET || '',
  };

  return secrets[exchangeId] || secrets.default;
}

/**
 * Create fill webhook routes
 */
export function createFillWebhookRoutes() {
  const routes = new Hono();
  const lifecycleManager = getOrderLifecycleManager();

  /**
   * POST /api/v1/webhooks/fills
   * Handle order fill webhook from exchange/broker
   */
  routes.post('/fills', async (c) => {
    try {
      const body = await c.req.json();
      const payload: FillWebhookPayload = body;

      // Validate required fields
      if (!payload.order_id || !payload.fill_price || !payload.fill_amount) {
        return c.json({
          error: 'MISSING_FIELDS',
          required: ['order_id', 'fill_price', 'fill_amount'],
        }, 400);
      }

      // Verify webhook signature if provided
      const signature = c.req.header('X-Webhook-Signature') || payload.signature;
      const exchangeId = payload.exchange_id || 'default';

      if (signature) {
        const secret = getWebhookSecret(exchangeId);
        if (!secret) {
          return c.json({
            error: 'WEBHOOK_SECRET_NOT_CONFIGURED',
            exchangeId,
          }, 500);
        }

        const rawBody = await c.req.text();
        const valid = await verifyWebhookSignature(rawBody, signature, secret);

        if (!valid) {
          return c.json({ error: 'INVALID_SIGNATURE' }, 401);
        }
      }

      // Process fill update (idempotent)
      await lifecycleManager.handleFillWebhook(
        payload.order_id,
        payload.fill_price,
        payload.fill_amount,
        payload.webhook_id
      );

      return c.json({
        received: true,
        order_id: payload.order_id,
        processed: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({ error: 'Order not found' }, 404);
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  /**
   * POST /api/v1/webhooks/fills/:exchangeId
   * Exchange-specific webhook endpoint
   */
  routes.post('/fills/:exchangeId', async (c) => {
    try {
      const exchangeId = c.req.param('exchangeId');
      const body = await c.req.json();
      const payload: FillWebhookPayload = body;

      // Validate required fields
      if (!payload.order_id || !payload.fill_price || !payload.fill_amount) {
        return c.json({
          error: 'MISSING_FIELDS',
          required: ['order_id', 'fill_price', 'fill_amount'],
        }, 400);
      }

      // Verify webhook signature
      const signature = c.req.header('X-Webhook-Signature') ||
                        c.req.header('X-' + exchangeId.toUpperCase() + '-Signature');

      if (signature) {
        const secret = getWebhookSecret(exchangeId);
        if (!secret) {
          return c.json({
            error: 'WEBHOOK_SECRET_NOT_CONFIGURED',
            exchangeId,
          }, 500);
        }

        const rawBody = await c.req.text();
        const valid = await verifyWebhookSignature(rawBody, signature, secret);

        if (!valid) {
          return c.json({ error: 'INVALID_SIGNATURE' }, 401);
        }
      }

      // Process fill update (idempotent)
      await lifecycleManager.handleFillWebhook(
        payload.order_id,
        payload.fill_price,
        payload.fill_amount,
        payload.webhook_id
      );

      return c.json({
        received: true,
        order_id: payload.order_id,
        exchange: exchangeId,
        processed: true,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({ error: 'Order not found' }, 404);
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  return routes;
}

export default createFillWebhookRoutes;
