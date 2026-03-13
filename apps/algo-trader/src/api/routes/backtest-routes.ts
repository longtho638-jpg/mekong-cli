/**
 * Backtest API Routes — /api/backtest/* endpoints
 *
 * ROIaaS Phase 6 — Premium Backtesting Endpoints
 * - POST /api/backtest/simulate — Run strategy simulation
 * - POST /api/backtest/accuracy — Test signal accuracy
 * - POST /api/backtest/project — Project PnL
 * - GET /api/backtest/limits — Get tier-based limits
 *
 * Tier Restrictions:
 * - FREE: 7-day lookback, basic metrics only
 * - PRO: 90-day lookback, advanced metrics (Sharpe, Sortino, Calmar)
 * - ENTERPRISE: 365-day lookback, walk-forward + Monte Carlo
 */

import { FastifyInstance } from 'fastify';
import { premiumBacktestEngine, SignalAccuracyMetrics, PolymarketDataPoint } from '../../premium/backtest-engine';
import { LicenseService, LicenseTier, LicenseError } from '../../lib/raas-gate';
import { tradeMeteringService } from '../../metering/trade-metering';
import { logger } from '../../utils/logger';

/**
 * Request schemas
 */
interface BacktestRequest {
  Body: {
    strategyId?: string;
    symbol?: string;
    lookbackDays?: number;
    initialCapital?: number;
    data?: Array<{
      timestamp: number;
      yesPrice: number;
      noPrice: number;
      volume: number;
      openInterest: number;
    }>;
  };
  Headers: {
    'x-user-id'?: string;
    'x-license-tier'?: string;
  };
}

interface SignalAccuracyRequest {
  Body: {
    signals: Array<{
      timestamp: number;
      predicted: boolean;
      actual: boolean;
    }>;
    lookbackDays?: number;
  };
  Headers: {
    'x-user-id'?: string;
  };
}

interface PnLProjectionRequest {
  Body: {
    historicalTrades: Array<{
      marketId: string;
      profit: number;
      timestamp: number;
    }>;
    projectionDays?: number;
    initialCapital?: number;
  };
  Headers: {
    'x-user-id'?: string;
  };
}

/**
 * Register backtest API routes
 */
export async function registerBacktestRoutes(fastify: FastifyInstance): Promise<void> {
  const licenseService = LicenseService.getInstance();

  /**
   * GET /api/backtest/limits
   * Get tier-based lookback limits
   */
  fastify.get('/api/backtest/limits', async (_request, reply) => {
    const tiers = {
      [LicenseTier.FREE]: { lookbackDays: 7, metrics: ['totalReturn', 'winRate', 'profitFactor', 'maxDrawdown'] },
      [LicenseTier.PRO]: { lookbackDays: 90, metrics: ['totalReturn', 'winRate', 'profitFactor', 'maxDrawdown', 'sharpeRatio', 'sortinoRatio', 'calmarRatio'] },
      [LicenseTier.ENTERPRISE]: { lookbackDays: 365, metrics: ['all'] },
    };

    return reply.code(200).send({
      success: true,
      tiers,
      currentTier: licenseService.getTier(),
    });
  });

  /**
   * POST /api/backtest/simulate
   * Run strategy simulation on historical data
   */
  fastify.post<BacktestRequest>('/api/backtest/simulate', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    const { lookbackDays = 30, initialCapital = 10000, data = [] } = request.body;

    // Track usage
    if (userId) {
      const allowed = await tradeMeteringService.trackApiCall(userId, '/api/backtest/simulate');
      if (!allowed) {
        return reply.code(429).send({
          success: false,
          error: 'API call limit exceeded',
          status: tradeMeteringService.getUsageStatus(userId),
        });
      }
    }

    try {
      // Validate lookback
      premiumBacktestEngine.validateLookback(lookbackDays);

      // Mock strategy for demo (in production, load from strategy marketplace)
      const mockStrategy = async (data: PolymarketDataPoint[]): Promise<'YES' | 'NO' | null> => {
        if (data.length < 2) return null;
        // Simple momentum strategy
        const prevYes = data[data.length - 2].yesPrice;
        const currYes = data[data.length - 1].yesPrice;
        return currYes > prevYes ? 'YES' : 'NO';
      };

      const result = await premiumBacktestEngine.simulateStrategy(
        data,
        mockStrategy,
        lookbackDays,
        initialCapital
      );

      return reply.code(200).send({
        success: true,
        result,
        message: `Backtest completed with ${lookbackDays}-day lookback`,
      });
    } catch (error) {
      logger.error(`[BacktestAPI] Simulate error: ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof Error && error.message.includes('exceeds')) {
        return reply.code(403).send({
          success: false,
          error: 'lookback_limit_exceeded',
          message: error.message,
          upgradePrompt: {
            title: 'Upgrade for Longer Lookback',
            description: 'Your current tier limits lookback period. Upgrade to PRO for 90-day history or ENTERPRISE for 365-day.',
            upgradeUrl: '/pricing',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'backtest_simulation_failed',
        message: 'Failed to run backtest simulation',
      });
    }
  });

  /**
   * POST /api/backtest/accuracy
   * Test historical signal accuracy
   */
  fastify.post<SignalAccuracyRequest>('/api/backtest/accuracy', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    const { signals, lookbackDays = 30 } = request.body;

    // Track usage
    if (userId) {
      const allowed = await tradeMeteringService.trackApiCall(userId, '/api/backtest/accuracy');
      if (!allowed) {
        return reply.code(429).send({
          success: false,
          error: 'API call limit exceeded',
        });
      }
    }

    try {
      // Validate lookback
      premiumBacktestEngine.validateLookback(lookbackDays);

      const metrics: SignalAccuracyMetrics = await premiumBacktestEngine.testSignalAccuracy(
        signals,
        lookbackDays
      );

      return reply.code(200).send({
        success: true,
        metrics,
        message: `Analyzed ${metrics.totalSignals} signals over ${lookbackDays} days`,
      });
    } catch (error) {
      logger.error(`[BacktestAPI] Accuracy error: ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof Error && error.message.includes('exceeds')) {
        return reply.code(403).send({
          success: false,
          error: 'lookback_limit_exceeded',
          message: error.message,
          upgradePrompt: {
            title: 'Upgrade for Longer Lookback',
            description: 'Upgrade to PRO for 90-day signal history analysis.',
            upgradeUrl: '/pricing',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'accuracy_test_failed',
        message: 'Failed to test signal accuracy',
      });
    }
  });

  /**
   * POST /api/backtest/project
   * Project PnL based on historical performance
   */
  fastify.post<PnLProjectionRequest>('/api/backtest/project', async (request, reply) => {
    const userId = request.headers['x-user-id'];
    const { historicalTrades, projectionDays = 30, initialCapital = 10000 } = request.body;

    // Track usage
    if (userId) {
      const allowed = await tradeMeteringService.trackApiCall(userId, '/api/backtest/project');
      if (!allowed) {
        return reply.code(429).send({
          success: false,
          error: 'API call limit exceeded',
        });
      }
    }

    try {
      // PRO-only feature
      licenseService.requireTier(LicenseTier.PRO, 'pnl_projection');

      // Transform trades to BinaryOptionTrade format
      const trades = historicalTrades.map(t => ({
        marketId: t.marketId,
        question: 'Historical Trade',
        outcome: 'YES' as const,
        entryPrice: 50,
        exitPrice: 50,
        stake: 100,
        payout: 100 + t.profit,
        profit: t.profit,
        timestamp: t.timestamp,
        resolved: true,
      }));

      const projection = await premiumBacktestEngine.projectPnL(
        trades,
        projectionDays,
        initialCapital
      );

      return reply.code(200).send({
        success: true,
        projection,
        message: `PnL projected for ${projectionDays} days`,
      });
    } catch (error) {
      logger.error(`[BacktestAPI] PnL projection error: ${error instanceof Error ? error.message : String(error)}`);

      if (error instanceof LicenseError) {
        return reply.code(403).send({
          success: false,
          error: 'tier_required',
          message: error.message,
          requiredTier: error.requiredTier,
          upgradePrompt: {
            title: 'Upgrade to PRO for PnL Projection',
            description: 'PnL projection with confidence intervals is a PRO feature.',
            upgradeUrl: '/pricing',
          },
        });
      }

      return reply.code(500).send({
        success: false,
        error: 'pnl_projection_failed',
        message: 'Failed to project PnL',
      });
    }
  });
}
