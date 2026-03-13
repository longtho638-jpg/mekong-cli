/**
 * Signal API Routes — Gated Signal Delivery
 *
 * REST API endpoints for accessing trading signals with tier-based gating.
 *
 * Endpoints:
 * - GET /api/signals — Get all signals (gated by tier)
 * - GET /api/signals/:marketId — Get signals for specific market
 * - GET /api/signals/early-access — Get early access signals (Enterprise only)
 * - GET /api/signals/stats — Get signal statistics
 *
 * Authentication:
 * - X-API-Key header for license key
 * - Falls back to FREE tier if no key provided
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { defaultSignalGate, SignalType, TradingSignal, GatedSignal } from './signal-gate';
import { LicenseTier } from '../lib/raas-gate';
import { logger } from '../utils/logger';

/**
 * Request schema for signals endpoint
 */
interface SignalsRequest {
  Headers: {
    'x-api-key'?: string;
  };
  Params: {
    marketId?: string;
  };
  Querystring: {
    limit?: number;
    since?: number;
  };
}

/**
 * Response schema for signals endpoint
 */
interface SignalsResponse {
  success: boolean;
  signals: GatedSignal[];
  tier: LicenseTier;
  metadata: {
    totalSignals: number;
    delayedSignals: number;
    hasUpgradeCTA: boolean;
  };
}

/**
 * Register signal API routes
 */
export async function registerSignalRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * GET /api/signals
   * Get all available signals (gated by tier)
   */
  fastify.get<SignalsRequest>('/api/signals', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];
    const limit = request.query.limit || 100;
    const since = request.query.since;

    try {
      // Get all signals and apply gating
      const allSignals = getSignalsFromSource();
      const gatedSignals: GatedSignal[] = [];

      for (const signal of allSignals.slice(0, limit)) {
        if (since && signal.createdAt < since) continue;

        const gated = defaultSignalGate.processSignal(signal, apiKey);
        gatedSignals.push(gated);
      }

      // Determine tier for response
      const tier = getTierFromKey(apiKey);

      // Check if any signals have upgrade CTA
      const hasUpgradeCTA = gatedSignals.some(g => g.cta !== undefined);
      const delayedCount = gatedSignals.filter(g => g.isDelayed).length;

      const response: SignalsResponse = {
        success: true,
        signals: gatedSignals,
        tier,
        metadata: {
          totalSignals: allSignals.length,
          delayedSignals: delayedCount,
          hasUpgradeCTA,
        },
      };

      return reply.code(200).send(response);
    } catch (error) {
      logger.error('[SignalAPI] Error fetching signals:', error instanceof Error ? error.message : String(error));
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch signals',
      });
    }
  });

  /**
   * GET /api/signals/:marketId
   * Get signals for a specific market
   */
  fastify.get<SignalsRequest>('/api/signals/:marketId', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];
    const { marketId } = request.params;

    try {
      const gatedSignals = defaultSignalGate.getSignalsForMarket(marketId, apiKey);

      const tier = getTierFromKey(apiKey);
      const hasUpgradeCTA = gatedSignals.some(g => g.cta !== undefined);
      const delayedCount = gatedSignals.filter(g => g.isDelayed).length;

      const response: SignalsResponse = {
        success: true,
        signals: gatedSignals,
        tier,
        metadata: {
          totalSignals: gatedSignals.length,
          delayedSignals: delayedCount,
          hasUpgradeCTA,
        },
      };

      return reply.code(200).send(response);
    } catch (error) {
      logger.error(`[SignalAPI] Error fetching signals for market ${marketId}:`, error instanceof Error ? error.message : String(error));
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch market signals',
      });
    }
  });

  /**
   * GET /api/signals/early-access
   * Get early access signals (Enterprise only)
   */
  fastify.get<SignalsRequest>('/api/signals/early-access', async (request, reply) => {
    const apiKey = request.headers['x-api-key'];

    try {
      // Check if user has early access
      const hasAccess = defaultSignalGate.hasAccess('early-access', apiKey);

      if (!hasAccess) {
        const tier = getTierFromKey(apiKey);
        return reply.code(403).send({
          success: false,
          error: 'Early access requires Enterprise subscription',
          tier,
          cta: {
            title: 'Upgrade to Enterprise',
            description: 'Get early access to signals before they are released to other tiers',
            upgradeUrl: 'https://polar.sh/agencyos',
          },
        });
      }

      const earlySignals = defaultSignalGate.getEarlyAccessSignals(apiKey);

      return reply.code(200).send({
        success: true,
        signals: earlySignals.map(s => ({
          signal: s,
          isDelayed: false,
          delaySeconds: 0,
          tier: LicenseTier.ENTERPRISE,
        })),
        tier: LicenseTier.ENTERPRISE,
        metadata: {
          totalSignals: earlySignals.length,
          delayedSignals: 0,
          hasUpgradeCTA: false,
        },
      });
    } catch (error) {
      logger.error('[SignalAPI] Error fetching early access signals:', error instanceof Error ? error.message : String(error));
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch early access signals',
      });
    }
  });

  /**
   * GET /api/signals/stats
   * Get signal statistics by tier
   */
  fastify.get('/api/signals/stats', async (request, reply) => {
    const stats = defaultSignalGate.getAllStats();

    return reply.code(200).send({
      success: true,
      stats,
      timestamp: Date.now(),
    });
  });

  /**
   * POST /api/signals/ingest
   * Ingest a new signal (internal use only)
   */
  fastify.post<{ Body: { signal: TradingSignal } }>('/api/signals/ingest', async (request, reply) => {
    // This would be called by the trading bot engine to ingest signals
    const { signal } = request.body;

    // Validate signal
    if (!signal || !signal.id || !signal.tokenId) {
      return reply.code(400).send({
        success: false,
        error: 'Invalid signal format',
      });
    }

    // Process signal through gate
    const gated = defaultSignalGate.processSignal(signal);

    logger.info(`[SignalAPI] Ingested signal ${signal.id} for market ${signal.marketId}`);

    return reply.code(200).send({
      success: true,
      signalId: signal.id,
      isDelayed: gated.isDelayed,
      delaySeconds: gated.delaySeconds,
    });
  });
}

/**
 * Helper: Get tier from API key
 */
function getTierFromKey(apiKey?: string): LicenseTier {
  if (!apiKey) return LicenseTier.FREE;

  try {
    const { LicenseService } = require('../lib/raas-gate');
    const service = LicenseService.getInstance();
    const validation = service.validateSync(apiKey);

    if (!validation.valid) return LicenseTier.FREE;
    if (validation.features.includes('enterprise')) return LicenseTier.ENTERPRISE;
    if (validation.features.includes('pro')) return LicenseTier.PRO;

    return LicenseTier.FREE;
  } catch {
    return LicenseTier.FREE;
  }
}

/**
 * Helper: Get signals from source (trading bot engine)
 * This is a placeholder - in production, this would connect to the bot engine
 */
function getSignalsFromSource(): TradingSignal[] {
  // Placeholder implementation
  // In production, this would fetch from PolymarketBotEngine or a message queue
  return [];
}
