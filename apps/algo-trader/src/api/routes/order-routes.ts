/**
 * Order Routes
 *
 * REST API endpoints for order management:
 * - POST /api/v1/orders - Create new order
 * - GET /api/v1/orders/:id - Get order status
 * - DELETE /api/v1/orders/:id - Cancel order
 * - GET /api/v1/orders - List orders (with filters)
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { getOrderLifecycleManager } from '../../execution/order-lifecycle-manager';
import { OrderState } from '../../execution/order-state-machine';
import { LicenseService, LicenseTier } from '../../lib/raas-gate';
import { rateLimitMiddleware } from '../../lib/rate-limiter-middleware';

/**
 * Request schemas
 */
const createOrderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell']),
  type: z.enum(['market', 'limit']),
  amount: z.number().positive('Amount must be positive'),
  price: z.number().positive().optional(),
  clientOrderId: z.string().optional(),
  strategyId: z.string().optional(),
});

const listOrdersSchema = z.object({
  symbol: z.string().optional(),
  status: z.nativeEnum(OrderState).optional(),
  side: z.enum(['buy', 'sell']).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

/**
 * Create order routes
 */
export function createOrderRoutes() {
  const routes = new Hono();
  const lifecycleManager = getOrderLifecycleManager();
  const licenseService = LicenseService.getInstance();

  // Rate limiting
  routes.use('*', rateLimitMiddleware());

  /**
   * POST /api/v1/orders
   * Create a new order
   */
  routes.post('/', async (c) => {
    try {
      // License check - FREE tier can create orders
      licenseService.requireTier(LicenseTier.FREE, 'order_creation');

      const body = await c.req.json();
      const parsed = createOrderSchema.safeParse(body);

      if (!parsed.success) {
        return c.json({
          error: 'VALIDATION_ERROR',
          details: parsed.error.issues,
        }, 400);
      }

      const { symbol, side, type, amount, price, clientOrderId, strategyId } = parsed.data;

      // Get tenant ID from header
      const tenantId = c.req.header('X-Tenant-ID');
      if (!tenantId) {
        return c.json({ error: 'Missing X-Tenant-ID header' }, 400);
      }

      // Get exchange ID from header or default
      const exchangeId = c.req.header('X-Exchange-ID') || 'binance';

      // Generate order ID with crypto-safe randomness
      const orderId = `order_${tenantId}_${Date.now()}_${randomBytes(8).toString('hex')}`;

      // Create order
      const order = await lifecycleManager.submitOrder({
        id: orderId,
        clientOrderId,
        tenantId,
        exchangeId,
        symbol,
        side,
        type,
        amount,
        price,
        status: OrderState.PENDING,
        createdAt: Date.now(),
        strategyId,
        ip: c.req.header('X-Forwarded-For'),
        userAgent: c.req.header('User-Agent'),
      });

      return c.json({
        orderId: order.id,
        clientOrderId: order.clientOrderId,
        status: order.status,
        symbol: order.symbol,
        side: order.side,
        type: order.type,
        amount: order.amount,
        price: order.price,
        createdAt: order.createdAt,
      }, 202);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  /**
   * GET /api/v1/orders/:id
   * Get order status
   */
  routes.get('/:id', async (c) => {
    try {
      const orderId = c.req.param('id');

      const status = await lifecycleManager.getOrderStatus(orderId);

      return c.json(status);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({ error: 'Order not found' }, 404);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  /**
   * DELETE /api/v1/orders/:id
   * Cancel an order
   */
  routes.delete('/:id', async (c) => {
    try {
      const orderId = c.req.param('id');
      const tenantId = c.req.header('X-Tenant-ID');

      if (!tenantId) {
        return c.json({ error: 'Missing X-Tenant-ID header' }, 400);
      }

      const body = await c.req.json().catch(() => ({}));
      const reason = body.reason;

      const order = await lifecycleManager.cancelOrder(orderId, reason);

      return c.json({
        orderId: order.id,
        status: order.status,
        cancelledAt: order.cancelledAt,
        reason: order.status === OrderState.CANCELLED ? reason : undefined,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({ error: 'Order not found' }, 404);
      }
      if (error instanceof Error && error.message.includes('Cannot cancel')) {
        return c.json({ error: error.message }, 400);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  /**
   * GET /api/v1/orders
   * List orders with optional filters
   */
  routes.get('/', async (c) => {
    try {
      const tenantId = c.req.header('X-Tenant-ID');
      if (!tenantId) {
        return c.json({ error: 'Missing X-Tenant-ID header' }, 400);
      }

      // Parse query params
      const queryParsed = listOrdersSchema.safeParse({
        symbol: c.req.query('symbol'),
        status: c.req.query('status'),
        side: c.req.query('side'),
        limit: parseInt(c.req.query('limit') || '50'),
        offset: parseInt(c.req.query('offset') || '0'),
      });

      if (!queryParsed.success) {
        return c.json({
          error: 'VALIDATION_ERROR',
          details: queryParsed.error.issues,
        }, 400);
      }

      const { symbol, status, side, limit, offset } = queryParsed.data;

      // Get orders by tenant
      let orders = lifecycleManager.getOrdersByTenant(tenantId);

      // Apply filters
      if (symbol) {
        orders = orders.filter((o) => o.symbol === symbol);
      }
      if (status) {
        orders = orders.filter((o) => o.status === status);
      }
      if (side) {
        orders = orders.filter((o) => o.side === side);
      }

      // Pagination
      const total = orders.length;
      const paginated = orders.slice(offset, offset + limit);

      return c.json({
        orders: paginated.map((o) => ({
          orderId: o.id,
          clientOrderId: o.clientOrderId,
          status: o.status,
          symbol: o.symbol,
          side: o.side,
          type: o.type,
          amount: o.amount,
          price: o.price,
          avgFillPrice: o.avgFillPrice,
          totalFilled: o.totalFilled,
          remainingAmount: o.remainingAmount,
          createdAt: o.createdAt,
          submittedAt: o.submittedAt,
          filledAt: o.filledAt,
          cancelledAt: o.cancelledAt,
        })),
        total,
        limit,
        offset,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return c.json({ error: message }, 500);
    }
  });

  return routes;
}

export default createOrderRoutes;
