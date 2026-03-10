/**
 * AutoProvisioningService Tests
 *
 * Tests for tenant provisioning/deprovisioning lifecycle:
 * - API key generation and validation
 * - Default config per tier
 * - Idempotency checks
 * - Deprovisioning cleanup
 * - Audit logging
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  AutoProvisioningService,
  mapTenantTierToLicenseTier,
} from './auto-provisioning-service';
import { LicenseTier } from '../lib/raas-gate';
import { PolarAuditLogger } from './polar-audit-logger';

describe('AutoProvisioningService', () => {
  let service: AutoProvisioningService;
  let auditLogger: PolarAuditLogger;

  beforeEach(() => {
    AutoProvisioningService.resetInstance();
    PolarAuditLogger.getInstance().reset();
    service = AutoProvisioningService.getInstance();
    auditLogger = PolarAuditLogger.getInstance();
  });

  describe('provisionTenant', () => {
    test('should provision a new tenant with API key and config', async () => {
      const result = await service.provisionTenant(
        'sub_123',
        'customer_456',
        'pro',
      );

      expect(result.success).toBe(true);
      expect(result.tenantId).toBe('tenant_customer_456');
      expect(result.subscriptionId).toBe('sub_123');
      expect(result.tier).toBe('pro');
      expect(result.apiKey).toBeDefined();
      expect(result.apiKey).toMatch(/^raas_pro_[a-f0-9]{32}_[a-f0-9]{6}$/);
      expect(result.apiKeyChecksum).toBeDefined();
      expect(result.defaultConfig).toBeDefined();
      expect(result.defaultConfig?.maxPositionSizeUsd).toBe(5000);
    });

    test('should be idempotent (return same checksum on duplicate provision)', async () => {
      const first = await service.provisionTenant('sub_123', 'customer_456', 'pro');
      const second = await service.provisionTenant('sub_789', 'customer_456', 'enterprise');

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      expect(first.apiKeyChecksum).toBe(second.apiKeyChecksum);
    });

    test('should generate different API keys for different tenants', async () => {
      const tenant1 = await service.provisionTenant('sub_111', 'customer_a', 'pro');
      const tenant2 = await service.provisionTenant('sub_222', 'customer_b', 'pro');

      expect(tenant1.apiKey).not.toBe(tenant2.apiKey);
      expect(tenant1.apiKeyChecksum).not.toBe(tenant2.apiKeyChecksum);
    });

    test('should set correct default config for free tier', async () => {
      const result = await service.provisionTenant('sub_free', 'customer_free', 'free');

      expect(result.defaultConfig?.maxPositionSizeUsd).toBe(500);
      expect(result.defaultConfig?.maxDailyLossUsd).toBe(50);
      expect(result.defaultConfig?.mode).toBe('paper');
    });

    test('should set correct default config for enterprise tier', async () => {
      const result = await service.provisionTenant(
        'sub_ent',
        'customer_ent',
        'enterprise',
      );

      expect(result.defaultConfig?.maxPositionSizeUsd).toBe(50000);
      expect(result.defaultConfig?.maxDailyLossUsd).toBe(5000);
      expect(result.defaultConfig?.mode).toBe('live');
    });
  });

  describe('deprovisionTenant', () => {
    test('should deprovision a tenant and clean up resources', async () => {
      await service.provisionTenant('sub_123', 'customer_456', 'pro');

      const result = await service.deprovisionTenant('sub_123');

      expect(result.success).toBe(true);
      expect(result.tenantId).toBe('tenant_customer_456');
      expect(result.resourcesCleaned).toContain('tenant_record');
    });

    test('should fail to deprovision non-existent subscription', async () => {
      const result = await service.deprovisionTenant('sub_nonexistent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Tenant not found for subscription');
    });

    test('should invalidate API key after deprovisioning', async () => {
      const provision = await service.provisionTenant('sub_123', 'customer_456', 'pro');
      await service.deprovisionTenant('sub_123');

      const validation = service.validateApiKey(provision.apiKey!);
      expect(validation.valid).toBe(false);
    });
  });

  describe('validateApiKey', () => {
    test('should validate a correctly formatted API key', async () => {
      const provision = await service.provisionTenant('sub_123', 'customer_456', 'pro');
      const validation = service.validateApiKey(provision.apiKey!);

      expect(validation.valid).toBe(true);
      expect(validation.tier).toBe('pro');
      expect(validation.tenantId).toBe('tenant_customer_456');
    });

    test('should reject invalid API key format', () => {
      const validation = service.validateApiKey('invalid_key_format');
      expect(validation.valid).toBe(false);
    });

    test('should reject API key with wrong checksum', () => {
      const fakeKey = 'raas_pro_a1b2c3d4e5f6_999999';
      const validation = service.validateApiKey(fakeKey);
      expect(validation.valid).toBe(false);
    });

    test('should reject API key for deprovisioned tenant', async () => {
      const provision = await service.provisionTenant('sub_123', 'customer_456', 'pro');
      await service.deprovisionTenant('sub_123');

      const validation = service.validateApiKey(provision.apiKey!);
      expect(validation.valid).toBe(false);
    });

    test('should reject API key with invalid tier', () => {
      const fakeKey = 'raas_invalid_a1b2c3d4e5f6_abc123';
      const validation = service.validateApiKey(fakeKey);
      expect(validation.valid).toBe(false);
    });
  });

  describe('isProvisioned', () => {
    test('should return true for provisioned tenant', async () => {
      await service.provisionTenant('sub_123', 'customer_456', 'pro');

      expect(service.isProvisioned('tenant_customer_456')).toBe(true);
    });

    test('should return false for non-provisioned tenant', () => {
      expect(service.isProvisioned('tenant_unknown')).toBe(false);
    });

    test('should return false after deprovisioning', async () => {
      await service.provisionTenant('sub_123', 'customer_456', 'pro');
      await service.deprovisionTenant('sub_123');

      expect(service.isProvisioned('tenant_customer_456')).toBe(false);
    });
  });

  describe('getTenantInfo', () => {
    test('should return tenant info for provisioned tenant', async () => {
      await service.provisionTenant('sub_123', 'customer_456', 'pro');

      const info = service.getTenantInfo('tenant_customer_456');

      expect(info).toBeDefined();
      expect(info?.subscriptionId).toBe('sub_123');
      expect(info?.tier).toBe('pro');
    });

    test('should return undefined for non-provisioned tenant', () => {
      const info = service.getTenantInfo('tenant_unknown');
      expect(info).toBeUndefined();
    });
  });

  describe('getAllProvisionedTenants', () => {
    test('should return empty array when no tenants provisioned', () => {
      const tenants = service.getAllProvisionedTenants();
      expect(tenants).toEqual([]);
    });

    test('should return all provisioned tenants', async () => {
      await service.provisionTenant('sub_1', 'customer_a', 'pro');
      await service.provisionTenant('sub_2', 'customer_b', 'enterprise');

      const tenants = service.getAllProvisionedTenants();

      expect(tenants).toHaveLength(2);
      expect(tenants.map(t => t.tier)).toContain('pro');
      expect(tenants.map(t => t.tier)).toContain('enterprise');
    });
  });

  describe('mapTenantTierToLicenseTier', () => {
    test('should map free tier correctly', () => {
      expect(mapTenantTierToLicenseTier('free')).toBe(LicenseTier.FREE);
    });

    test('should map pro tier correctly', () => {
      expect(mapTenantTierToLicenseTier('pro')).toBe(LicenseTier.PRO);
    });

    test('should map enterprise tier correctly', () => {
      expect(mapTenantTierToLicenseTier('enterprise')).toBe(LicenseTier.ENTERPRISE);
    });
  });

  describe('Audit Logging', () => {
    test('should log provisioning events', async () => {
      await service.provisionTenant('sub_123', 'customer_456', 'pro');

      const logs = auditLogger.getRecentLogs(5);

      // Should have at least 3 logs: api_key_generated, config_set, provision
      expect(logs.length).toBeGreaterThanOrEqual(3);
      const eventTypes = logs.map(log => log.eventType);
      expect(eventTypes).toContainEqual(expect.stringContaining('provisioning'));
    });

    test('should log deprovisioning events', async () => {
      await service.provisionTenant('sub_123', 'customer_456', 'pro');
      await service.deprovisionTenant('sub_123');

      const logs = auditLogger.getRecentLogs(5);
      const eventTypes = logs.map(log => log.eventType);
      expect(eventTypes).toContainEqual(expect.stringContaining('provisioning.deprovision'));
    });
  });
});
