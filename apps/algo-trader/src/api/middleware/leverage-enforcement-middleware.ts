/**
 * Leverage Enforcement Middleware
 *
 * Intercepts trade requests containing leverage and validates
 * against tier-based caps (FREE=1x, PRO=10x, ENTERPRISE=20x).
 * Rejects requests exceeding the caller's tier maximum.
 */

import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { LicenseService } from '../../lib/raas-gate';
import { checkLeverageCap } from '../../execution/max-order-limits';

/** Request body shape that may contain leverage */
interface LeverageBody {
  leverage?: number;
}

/** Options for leverage enforcement plugin */
export interface LeverageEnforcementOptions {
  /** Override tier resolver for testing — defaults to LicenseService.getInstance().getTier() */
  getTier?: () => string;
}

/**
 * Fastify plugin that enforces leverage caps on all routes in scope.
 * Register on route groups that accept leverage in request body.
 *
 * Usage:
 *   fastify.register(leverageEnforcementPlugin);
 *   // All routes registered after this will have leverage checks
 */
export const leverageEnforcementPlugin = fp(
  async function leverageEnforcement(
    fastify: FastifyInstance,
    options?: LeverageEnforcementOptions
  ): Promise<void> {
    const resolveTier = options?.getTier ?? (() => LicenseService.getInstance().getTier());

    fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as LeverageBody | undefined;

      // Skip if no body or no leverage field (defaults to 1x spot)
      if (!body || typeof body.leverage !== 'number') {
        return;
      }

      const requestedLeverage = body.leverage;

      // Reject invalid leverage values (must be >= 1)
      if (requestedLeverage < 1) {
        return reply.status(400).send({
          error: 'Invalid Leverage',
          message: `Leverage must be >= 1, got ${requestedLeverage}`,
        });
      }

      // Spot (exactly 1x) always allowed — skip validation overhead
      if (requestedLeverage === 1) {
        return;
      }

      // Get caller's tier
      const tier = resolveTier();
      const result = checkLeverageCap(requestedLeverage, tier);

      if (!result.passed) {
        return reply.status(403).send({
          error: 'Leverage Exceeded',
          message: result.rejectedReason,
          requestedLeverage: result.requestedLeverage,
          maxAllowed: result.maxAllowed,
          tier: result.tier,
        });
      }
    });
  },
  { name: 'leverage-enforcement' }
);
