/**
 * Build Cache Stats Route
 * Provides cache hit/miss statistics for dashboard monitoring
 */

import { FastifyInstance } from 'fastify';
import { BuildCache } from '../../utils/build-cache';

export async function cacheStatsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/cache/stats', async (_req, reply) => {
    const agencyId = process.env.AGENCY_ID;
    const apiKey = process.env.RAAS_API_KEY;

    const cache = new BuildCache('.build-cache', agencyId, apiKey);
    const stats = cache.getStats();

    return reply.status(200).send({
      hits: stats.hits,
      misses: stats.misses,
      hitRate: stats.hitRate,
      localSize: stats.localSize,
      tier: stats.tier,
      timestamp: new Date().toISOString(),
    });
  });

  fastify.post('/cache/clear', async (_req, reply) => {
    // Clear local cache by removing .build-cache directory
    const fse = await import('fs-extra');
    const cacheDir = '.build-cache';

    try {
      if (await fse.pathExists(cacheDir)) {
        await fse.remove(cacheDir);
        return reply.status(200).send({
          success: true,
          message: 'Cache cleared successfully',
        });
      }
      return reply.status(404).send({
        success: false,
        message: 'Cache directory not found',
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to clear cache',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
