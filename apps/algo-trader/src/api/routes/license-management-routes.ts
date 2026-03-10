/**
 * License Management API Routes
 * RBAC: Admin-only access for license CRUD operations
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { licenseQueries } from '../../db/queries/license-queries';
import { logger } from '../../utils/logger';
import { LicenseUsageAnalytics } from '../../lib/license-usage-analytics';
import { featureFlagService, CreateFeatureFlagInput } from '../../services/feature-flag-service';
import { extensionEligibilityService } from '../../services/extension-eligibility-service';
import { signToken } from '../../auth/jwt-token-service';
import { raasKVClient } from '../../lib/raas-gateway-kv-client';

interface CreateLicenseBody {
  key?: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  tenantId?: string;
  expiresAt?: string;
  metadata?: Record<string, any>;
}

interface ActivateLicenseBody {
  key: string;
  domain?: string;
}

interface RevokeLicenseParams {
  id: string;
}

interface AnalyticsResponse {
  total: number;
  byTier: { free: number; pro: number; enterprise: number };
  byStatus: { active: number; revoked: number };
  usage: { apiCalls: number; mlFeatures: number; premiumData: number };
  recentActivity: Array<{ event: string; timestamp: string; licenseId: string }>;
}

interface ActivateLicenseResponse {
  license: {
    id: string;
    key: string;
    tier: string;
    domain?: string;
    status: string;
  };
  jwt: string;
}

// Phase 6: Feature Flags interfaces
interface FeatureFlagBody extends CreateFeatureFlagInput {}
interface FeatureFlagParams { name: string }
interface LicenseFeatureBody { enabled: boolean; overrideValue?: any }

// Phase 6: Extension Eligibility interfaces
interface ExtensionRequestParams { licenseId: string; extensionName: string }
interface ExtensionApproveBody { usageLimit?: number; resetAt?: string }

/**
 * Generate secure license key
 * Format: raas-{tier}-{random}-{timestamp}
 */
function generateLicenseKey(tier: string): string {
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  const tierPrefix = tier === 'PRO' ? 'RPP' : tier === 'ENTERPRISE' ? 'REP' : 'FREE';
  return `raas-${tierPrefix.toLowerCase()}-${random}-${timestamp}`;
}

/**
 * RBAC Middleware: Check admin role
 */
async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const user = (request as any).user;
  if (!user || user.role !== 'admin') {
    reply.code(403).send({
      error: 'Forbidden',
      message: 'Admin access required',
    });
  }
}

export async function licenseManagementRoutes(fastify: FastifyInstance) {
  // List all licenses (admin only)
  fastify.get('/api/v1/licenses', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { take, skip, status, tier } = request.query as any;
        const licenses = await licenseQueries.list({
          take: take ? parseInt(take, 10) : 100,
          skip: skip ? parseInt(skip, 10) : 0,
          status,
          tier,
        });
        reply.send({ licenses });
      } catch (error) {
        logger.error('Failed to list licenses:', error);
        reply.code(500).send({ error: 'Failed to list licenses' });
      }
    },
  });

  // Get single license (admin only)
  fastify.get('/api/v1/licenses/:id', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const license = await licenseQueries.findById(request.params.id);
        if (!license) {
          return reply.code(404).send({ error: 'License not found' });
        }
        reply.send({ license });
      } catch (error) {
        logger.error('Failed to get license:', error);
        reply.code(500).send({ error: 'Failed to get license' });
      }
    },
  });

  // Create license (admin only)
  fastify.post('/api/v1/licenses', {
    preHandler: [requireAdmin],
    handler: async (
      request: FastifyRequest<{ Body: CreateLicenseBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { key, tier, tenantId, expiresAt, metadata } = request.body;

        if (!tier || !['FREE', 'PRO', 'ENTERPRISE'].includes(tier)) {
          return reply.code(400).send({ error: 'Invalid tier' });
        }

        const licenseKey = key || generateLicenseKey(tier);
        const license = await licenseQueries.create({
          key: licenseKey,
          tier,
          tenantId,
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          metadata: metadata || {},
        });

        // Audit log
        await licenseQueries.logAudit({
          licenseId: license.id,
          event: 'created',
          tier,
          ip: (request as any).ip,
        });

        logger.info(`License created: ${license.id} (${tier})`);
        reply.code(201).send({ license });
      } catch (error) {
        logger.error('Failed to create license:', error);
        reply.code(500).send({ error: 'Failed to create license' });
      }
    },
  });

  // Activate license (public - for user self-activation)
  fastify.post('/api/v1/licenses/activate', {
    handler: async (
      request: FastifyRequest<{ Body: ActivateLicenseBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { key, domain } = request.body;

        if (!key) {
          return reply.code(400).send({ error: 'License key is required' });
        }

        // 1. Find license by key
        const license = await licenseQueries.findByKey(key);
        if (!license) {
          return reply.code(404).send({ error: 'Invalid license key' });
        }

        // 2. Check if already revoked
        if (license.status === 'revoked') {
          return reply.code(403).send({ error: 'License has been revoked' });
        }

        // 3. Check if expired
        if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
          return reply.code(403).send({ error: 'License has expired' });
        }

        // 4. Check RaaS KV for suspension state
        const suspension = await raasKVClient.getSuspension(key);
        if (suspension?.suspended) {
          return reply.code(403).send({
            error: 'License suspended',
            reason: suspension.reason,
          });
        }

        // 5. Update license with domain if provided
        const updatedLicense = domain
          ? await licenseQueries.update(license.id, { domain })
          : license;

        // 6. Generate JWT token for this license
        const jwtPayload = {
          tenantId: license.tenantId || license.id,
          scopes: ['license:read', 'license:use'], // Required by TenantToken type
          keyId: license.id,
        };
        const jwt = signToken(jwtPayload, 86400); // 24 hours

        // 7. Audit log
        await licenseQueries.logAudit({
          licenseId: license.id,
          event: 'activated',
          tier: license.tier,
          ip: (request as any).ip,
          metadata: { domain },
        });

        logger.info(`License activated: ${license.id} (${license.tier})`);

        // Get domain from updated license or metadata
        const licenseDomain = (updatedLicense as any).domain || (updatedLicense.metadata as any)?.domain as string || undefined;

        reply.send({
          license: {
            id: updatedLicense.id,
            key: updatedLicense.key,
            tier: updatedLicense.tier,
            domain: licenseDomain,
            status: updatedLicense.status,
          },
          jwt,
        } as ActivateLicenseResponse);
      } catch (error) {
        logger.error('Failed to activate license:', error);
        reply.code(500).send({ error: 'Failed to activate license' });
      }
    },
  });

  // Revoke license (admin only)
  fastify.patch('/api/v1/licenses/:id/revoke', {
    preHandler: [requireAdmin],
    handler: async (
      request: FastifyRequest<{ Params: { id: string }; Body: { reason?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { id } = request.params;
        const { reason } = request.body;
        const user = (request as any).user;

        const license = await licenseQueries.revoke(id, user?.id || 'admin');

        // Audit log
        await licenseQueries.logAudit({
          licenseId: license.id,
          event: 'revoked',
          tier: license.tier,
          ip: (request as any).ip,
          metadata: { reason },
        });

        logger.info(`License revoked: ${id} by ${user?.id || 'admin'}`);
        reply.send({ license });
      } catch (error) {
        logger.error('Failed to revoke license:', error);
        reply.code(500).send({ error: 'Failed to revoke license' });
      }
    },
  });

  // Get audit logs (admin only)
  fastify.get('/api/v1/licenses/:id/audit', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const logs = await licenseQueries.getAuditLogs(request.params.id);
        reply.send({ logs });
      } catch (error) {
        logger.error('Failed to get audit logs:', error);
        reply.code(500).send({ error: 'Failed to get audit logs' });
      }
    },
  });

  // Get license analytics (admin only)
  fastify.get('/api/v1/licenses/analytics', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const analytics = LicenseUsageAnalytics.getInstance();
        const allEvents = analytics.getEvents(undefined, 10);

        const [licenseStats, recentActivity] = await Promise.all([
          licenseQueries.getAnalytics(),
          licenseQueries.getRecentActivity(10),
        ]);

        const usage = {
          apiCalls: allEvents.filter((e) => e.event === 'api_call').length,
          mlFeatures: allEvents.filter((e) => e.event === 'ml_prediction').length,
          premiumData: allEvents.filter((e) => e.feature === 'premium_data').length,
        };

        const response: AnalyticsResponse = {
          total: licenseStats.total,
          byTier: licenseStats.byTier,
          byStatus: licenseStats.byStatus,
          usage,
          recentActivity: recentActivity.map((log) => ({
            event: log.event,
            timestamp: log.createdAt.toISOString(),
            licenseId: log.licenseId,
          })),
        };

        reply.send(response);
      } catch (error) {
        logger.error('Failed to get license analytics:', error);
        reply.code(500).send({ error: 'Failed to get license analytics' });
      }
    },
  });

  // Delete license (admin only)
  fastify.delete('/api/v1/licenses/:id', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        await licenseQueries.delete(request.params.id);
        logger.info(`License deleted: ${request.params.id}`);
        reply.code(204).send();
      } catch (error) {
        logger.error('Failed to delete license:', error);
        reply.code(500).send({ error: 'Failed to delete license' });
      }
    },
  });

  // ============================================
  // Phase 6: Feature Flags Routes (Admin)
  // ============================================

  // List all feature flags
  fastify.get('/api/v1/feature-flags', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const flags = await featureFlagService.getAllFlags();
        reply.send({ flags });
      } catch (error) {
        logger.error('Failed to list feature flags:', error);
        reply.code(500).send({ error: 'Failed to list feature flags' });
      }
    },
  });

  // Get single feature flag
  fastify.get('/api/v1/feature-flags/:name', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
      try {
        const flag = await featureFlagService.getFlagByName(request.params.name);
        if (!flag) {
          return reply.code(404).send({ error: 'Feature flag not found' });
        }
        reply.send({ flag });
      } catch (error) {
        logger.error('Failed to get feature flag:', error);
        reply.code(500).send({ error: 'Failed to get feature flag' });
      }
    },
  });

  // Create feature flag
  fastify.post('/api/v1/feature-flags', {
    preHandler: [requireAdmin],
    handler: async (
      request: FastifyRequest<{ Body: FeatureFlagBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { name, description, enabled, rolloutPercentage, userWhitelist, metadata } = request.body;

        if (!name) {
          return reply.code(400).send({ error: 'Feature flag name is required' });
        }

        const flag = await featureFlagService.createFlag({
          name,
          description,
          enabled,
          rolloutPercentage,
          userWhitelist,
          metadata
        });

        logger.info(`Feature flag created: ${name}`);
        reply.code(201).send({ flag });
      } catch (error) {
        logger.error('Failed to create feature flag:', error);
        reply.code(500).send({ error: 'Failed to create feature flag' });
      }
    },
  });

  // Update feature flag
  fastify.patch('/api/v1/feature-flags/:name', {
    preHandler: [requireAdmin],
    handler: async (
      request: FastifyRequest<{ Params: { name: string }; Body: Partial<FeatureFlagBody> }>,
      reply: FastifyReply
    ) => {
      try {
        const { name } = request.params;
        const updates = request.body;

        const flag = await featureFlagService.updateFlag(name, updates);
        logger.info(`Feature flag updated: ${name}`);
        reply.send({ flag });
      } catch (error) {
        logger.error('Failed to update feature flag:', error);
        reply.code(500).send({ error: 'Failed to update feature flag' });
      }
    },
  });

  // Delete feature flag
  fastify.delete('/api/v1/feature-flags/:name', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest<{ Params: { name: string } }>, reply: FastifyReply) => {
      try {
        await featureFlagService.deleteFlag(request.params.name);
        logger.info(`Feature flag deleted: ${request.params.name}`);
        reply.code(204).send();
      } catch (error) {
        logger.error('Failed to delete feature flag:', error);
        reply.code(500).send({ error: 'Failed to delete feature flag' });
      }
    },
  });

  // Get license features
  fastify.get('/api/v1/licenses/:licenseId/features', {
    preHandler: [requireAdmin],
    handler: async (request: FastifyRequest<{ Params: { licenseId: string } }>, reply: FastifyReply) => {
      try {
        const features = await featureFlagService.getLicenseFeatures(request.params.licenseId);
        reply.send({ features });
      } catch (error) {
        logger.error('Failed to get license features:', error);
        reply.code(500).send({ error: 'Failed to get license features' });
      }
    },
  });

  // Set license feature override
  fastify.patch('/api/v1/licenses/:licenseId/features/:featureName', {
    preHandler: [requireAdmin],
    handler: async (
      request: FastifyRequest<{ Params: { licenseId: string; featureName: string }; Body: LicenseFeatureBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { licenseId, featureName } = request.params;
        const { enabled, overrideValue } = request.body;

        const result = await featureFlagService.setLicenseFeature(licenseId, featureName, enabled, overrideValue);
        logger.info(`License feature updated: ${licenseId}/${featureName}`);
        reply.send({ result });
      } catch (error) {
        logger.error('Failed to set license feature:', error);
        reply.code(500).send({ error: 'Failed to set license feature' });
      }
    },
  });

  // Check feature flag (public - for client-side checks)
  fastify.get('/api/v1/features/:name/check', {
    handler: async (
      request: FastifyRequest<{ Params: { name: string }; Querystring: { licenseId?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { name } = request.params;
        const { licenseId } = request.query;

        const result = await featureFlagService.checkFeature(name, licenseId);
        reply.send(result);
      } catch (error) {
        logger.error('Failed to check feature flag:', error);
        reply.code(500).send({ error: 'Failed to check feature flag' });
      }
    },
  });

  // ============================================
  // Phase 6: Extension Eligibility Routes
  // ============================================

  // Get extension eligibility for a license
  fastify.get('/api/v1/licenses/:licenseId/extensions/:extensionName', {
    handler: async (
      request: FastifyRequest<{ Params: { licenseId: string; extensionName: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const status = await extensionEligibilityService.checkEligibility(
          request.params.licenseId,
          request.params.extensionName
        );
        reply.send({ status });
      } catch (error) {
        logger.error('Failed to check extension eligibility:', error);
        reply.code(500).send({ error: 'Failed to check extension eligibility' });
      }
    },
  });

  // Get all extensions for a license
  fastify.get('/api/v1/licenses/:licenseId/extensions', {
    handler: async (
      request: FastifyRequest<{ Params: { licenseId: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const extensions = await extensionEligibilityService.getLicenseExtensions(request.params.licenseId);
        reply.send({ extensions });
      } catch (error) {
        logger.error('Failed to get license extensions:', error);
        reply.code(500).send({ error: 'Failed to get license extensions' });
      }
    },
  });

  // Request extension access
  fastify.post('/api/v1/licenses/:licenseId/extensions/:extensionName/request', {
    handler: async (
      request: FastifyRequest<{ Params: { licenseId: string; extensionName: string }; Body: { reason?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { licenseId, extensionName } = request.params;
        const { reason } = request.body;

        const eligibility = await extensionEligibilityService.requestExtension(licenseId, extensionName, reason);
        logger.info(`Extension requested: ${licenseId}/${extensionName}`);
        reply.send({ eligibility });
      } catch (error) {
        logger.error('Failed to request extension:', error);
        reply.code(500).send({ error: 'Failed to request extension' });
      }
    },
  });

  // Approve extension (admin only)
  fastify.post('/api/v1/licenses/:licenseId/extensions/:extensionName/approve', {
    preHandler: [requireAdmin],
    handler: async (
      request: FastifyRequest<{ Params: { licenseId: string; extensionName: string }; Body: ExtensionApproveBody }>,
      reply: FastifyReply
    ) => {
      try {
        const { licenseId, extensionName } = request.params;
        const { usageLimit, resetAt } = request.body;

        const eligibility = await extensionEligibilityService.approveExtension(
          licenseId,
          extensionName,
          usageLimit,
          resetAt ? new Date(resetAt) : undefined
        );
        logger.info(`Extension approved: ${licenseId}/${extensionName}`);
        reply.send({ eligibility });
      } catch (error) {
        logger.error('Failed to approve extension:', error);
        reply.code(500).send({ error: 'Failed to approve extension' });
      }
    },
  });

  // Deny extension (admin only)
  fastify.post('/api/v1/licenses/:licenseId/extensions/:extensionName/deny', {
    preHandler: [requireAdmin],
    handler: async (
      request: FastifyRequest<{ Params: { licenseId: string; extensionName: string }; Body: { reason?: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const { licenseId, extensionName } = request.params;
        const { reason } = request.body;

        await extensionEligibilityService.denyExtension(licenseId, extensionName, reason);
        logger.info(`Extension denied: ${licenseId}/${extensionName}`);
        reply.send({ success: true });
      } catch (error) {
        logger.error('Failed to deny extension:', error);
        reply.code(500).send({ error: 'Failed to deny extension' });
      }
    },
  });

  // Track extension usage (internal API)
  fastify.post('/api/v1/extensions/:extensionName/track', {
    handler: async (
      request: FastifyRequest<{ Params: { extensionName: string }; Body: { licenseId: string; units?: number } }>,
      reply: FastifyReply
    ) => {
      try {
        const { extensionName } = request.params;
        const { licenseId, units } = request.body;

        const result = await extensionEligibilityService.trackUsage(licenseId, extensionName, units || 1);
        reply.send(result);
      } catch (error) {
        logger.error('Failed to track extension usage:', error);
        reply.code(500).send({ error: 'Failed to track extension usage' });
      }
    },
  });
}
