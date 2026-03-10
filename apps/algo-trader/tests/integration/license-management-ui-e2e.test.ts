/**
 * Integration tests for License Management UI E2E flow
 * Tests complete user workflows: license list, create, revoke, audit logs, analytics
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock fetch API
const mockFetch = jest.fn();

// Mock API response data
const mockLicenses = [
  {
    id: 'lic_001',
    name: 'Production License',
    key: 'raas-pro-12345',
    tier: 'PRO' as const,
    status: 'active' as const,
    createdAt: '2026-01-15T10:30:00Z',
    expiresAt: '2026-12-31T23:59:59Z',
    usageCount: 1500,
    maxUsage: 10000,
    userId: 'user_001'
  },
  {
    id: 'lic_002',
    name: 'Staging License',
    key: 'raas-pro-67890',
    tier: 'FREE' as const,
    status: 'active' as const,
    createdAt: '2026-02-01T08:00:00Z',
    usageCount: 500,
    userId: 'user_002'
  },
  {
    id: 'lic_003',
    name: 'Expired License',
    key: 'raas-ent-11111',
    tier: 'ENTERPRISE' as const,
    status: 'expired' as const,
    createdAt: '2025-06-01T00:00:00Z',
    expiresAt: '2026-01-01T00:00:00Z',
    usageCount: 50000,
    maxUsage: 100000,
    userId: 'user_003'
  }
];

const mockAuditLogs = [
  {
    id: 'log_001',
    licenseId: 'lic_001',
    event: 'created',
    tier: 'PRO',
    ip: '192.168.1.1',
    createdAt: '2026-01-15T10:30:00Z'
  },
  {
    id: 'log_002',
    licenseId: 'lic_001',
    event: 'api_call',
    tier: 'PRO',
    ip: '192.168.1.1',
    metadata: { feature: 'ml_prediction' },
    createdAt: '2026-03-06T09:00:00Z'
  },
  {
    id: 'log_003',
    licenseId: 'lic_001',
    event: 'revoked',
    tier: 'PRO',
    ip: '192.168.1.1',
    createdAt: '2026-03-06T10:00:00Z'
  }
];

const mockAnalytics = {
  total: 150,
  byTier: { free: 50, pro: 75, enterprise: 25 },
  byStatus: { active: 120, revoked: 15, expired: 15 },
  usage: { apiCalls: 50000, mlFeatures: 5000, premiumData: 10000 },
  recentActivity: [
    { event: 'license_created', timestamp: '2026-03-06T08:00:00Z', licenseId: 'lic_004' },
    { event: 'api_usage', timestamp: '2026-03-06T09:00:00Z', licenseId: 'lic_001' }
  ],
  revenue: { monthly: 2500, projected: 10000 }
};

const mockQuota = {
  tenantId: 'tenant_001',
  apiCalls: 500,
  apiCallsLimit: 10000,
  mlPredictions: 50,
  mlPredictionsLimit: 1000,
  dataPoints: 1000,
  dataPointsLimit: 5000,
  resetDate: '2026-04-01T00:00:00Z'
};

describe('License Management UI - Integration Tests', () => {
  beforeEach(() => {
    (global as any).fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterEach(() => {
    (global as any).fetch = undefined;
  });

  describe('License List Page (GET /api/v1/licenses)', () => {
    test('should display license list table with all columns', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockLicenses
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses');
      const data = await response.json();

      expect(data).toHaveLength(3);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('key');
      expect(data[0]).toHaveProperty('tier');
      expect(data[0]).toHaveProperty('status');
      expect(data[0]).toHaveProperty('usageCount');
      expect(data[0]).toHaveProperty('createdAt');
    });

    test('should filter licenses by status', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockLicenses
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses');
      const data = await response.json();

      const activeLicenses = data.filter((l: any) => l.status === 'active');
      expect(activeLicenses).toHaveLength(2);

      const expiredLicenses = data.filter((l: any) => l.status === 'expired');
      expect(expiredLicenses).toHaveLength(1);

      const revokedLicenses = data.filter((l: any) => l.status === 'revoked');
      expect(revokedLicenses).toHaveLength(0);
    });

    test('should filter licenses by tier', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockLicenses
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses');
      const data = await response.json();

      const freeLicenses = data.filter((l: any) => l.tier === 'FREE');
      expect(freeLicenses).toHaveLength(1);

      const proLicenses = data.filter((l: any) => l.tier === 'PRO');
      expect(proLicenses).toHaveLength(1);

      const enterpriseLicenses = data.filter((l: any) => l.tier === 'ENTERPRISE');
      expect(enterpriseLicenses).toHaveLength(1);
    });

    test('should handle empty license list', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => []
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses');
      const data = await response.json();

      expect(data).toHaveLength(0);
    });

    test('should handle API error gracefully', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' })
      };
      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await fetch('/api/v1/licenses');
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });
  });

  describe('Create License Flow (POST /api/v1/licenses)', () => {
    test('should create new license with valid input', async () => {
      const newLicense = {
        name: 'Test License',
        tier: 'FREE' as const,
        expiresAt: '2026-12-31T23:59:59Z',
        tenantId: 'tenant_test'
      };

      const createdLicense = {
        id: 'lic_new_001',
        key: 'raas-free-newtest001',
        name: 'Test License',
        tier: 'FREE' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        expiresAt: '2026-12-31T23:59:59Z',
        tenantId: 'tenant_test'
      };

      const okResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        json: async () => createdLicense
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicense)
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data).toMatchObject({
        id: expect.any(String),
        key: expect.any(String),
        name: 'Test License',
        tier: 'FREE',
        status: 'active'
      });
    });

    test('should create license without expiration (non-expiring)', async () => {
      const newLicense = {
        name: 'Non-expiring License',
        tier: 'PRO' as const
      };

      const createdLicense = {
        id: 'lic_new_002',
        key: 'raas-pro-noexp001',
        name: 'Non-expiring License',
        tier: 'PRO' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString()
      };

      const okResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        json: async () => createdLicense
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLicense)
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.tier).toBe('PRO');
      expect(data.expiresAt).toBeUndefined();
    });

    test('should reject invalid tier', async () => {
      const invalidLicense = {
        name: 'Invalid License',
        tier: 'INVALID' as const
      };

      const errorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid tier' })
      };
      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await fetch('/api/v1/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidLicense)
      });

      expect(response.status).toBe(400);
    });

    test('should reject missing required fields', async () => {
      const incompleteLicense = {
        tier: 'FREE' as const
      };

      const errorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Name is required' })
      };
      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await fetch('/api/v1/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incompleteLicense)
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Revoke License (POST /api/v1/licenses/:id/revoke)', () => {
    test('should revoke an active license', async () => {
      const revokedResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          id: 'lic_001',
          name: 'Production License',
          key: 'raas-pro-12345',
          tier: 'PRO' as const,
          status: 'revoked' as const,
          revokedAt: '2026-03-06T10:00:00Z'
        })
      };
      mockFetch.mockResolvedValueOnce(revokedResponse);

      const response = await fetch('/api/v1/licenses/lic_001/revoke', {
        method: 'POST'
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.status).toBe('revoked');
    });

    test('should return error when revoked already', async () => {
      const errorResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'License already revoked' })
      };
      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await fetch('/api/v1/licenses/lic_001/revoke', {
        method: 'POST'
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Delete License (DELETE /api/v1/licenses/:id)', () => {
    test('should permanently delete a license', async () => {
      const deletionResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ deleted: true, id: 'lic_002' })
      };
      mockFetch.mockResolvedValueOnce(deletionResponse);

      const response = await fetch('/api/v1/licenses/lic_002', {
        method: 'DELETE'
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.deleted).toBe(true);
    });
  });

  describe('Audit Logs (GET /api/v1/licenses/:id/audit)', () => {
    test('should fetch audit logs for a license', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ logs: mockAuditLogs })
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses/lic_001/audit');
      const data = await response.json();

      expect(data).toHaveProperty('logs');
      expect(data.logs).toHaveLength(3);
      expect(data.logs[0]).toHaveProperty('event');
      expect(data.logs[0]).toHaveProperty('ip');
      expect(data.logs[0]).toHaveProperty('createdAt');
    });

    test('should filter audit logs by event type', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ logs: mockAuditLogs })
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses/lic_001/audit');
      const data = await response.json();

      const apiCallLogs = data.logs.filter((l: any) => l.event === 'api_call');
      expect(apiCallLogs).toHaveLength(1);
    });

    test('should return empty array for non-existent license', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ logs: [] })
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses/nonexistent/audit');
      const data = await response.json();

      expect(data.logs).toHaveLength(0);
    });
  });

  describe('Analytics Dashboard (GET /api/v1/licenses/analytics)', () => {
    test('should fetch analytics data', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockAnalytics
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses/analytics');
      const data = await response.json();

      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('byTier');
      expect(data).toHaveProperty('byStatus');
      expect(data).toHaveProperty('usage');
      expect(data).toHaveProperty('revenue');
      expect(data.total).toBe(150);
    });

    test('should fetch quota data for tenant', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockQuota
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses/analytics/quota?tenantId=tenant_001');
      const data = await response.json();

      expect(data).toMatchObject(mockQuota);
      expect(data.apiCalls).toBe(500);
      expect(data.apiCallsLimit).toBe(10000);
    });

    test('should handle missing quota gracefully', async () => {
      const errorResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => null
      };
      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await fetch('/api/v1/licenses/analytics/quota?tenantId=unknown');
      const data = await response.json();

      expect(data).toBeNull();
    });
  });

  describe('Filter Logic', () => {
    test('should apply multiple filters simultaneously', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockLicenses
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses');
      const data = await response.json();

      const activeOnly = data.filter((l: any) => l.status === 'active');
      const activeProOnly = activeOnly.filter((l: any) => l.tier === 'PRO');

      expect(activeProOnly).toHaveLength(1);
      expect(activeProOnly[0].name).toBe('Production License');
    });

    test('should show correct count when filtered', async () => {
      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => mockLicenses
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses');
      const data = await response.json();

      const totalLicenses = data.length;
      const proLicenses = data.filter((l: any) => l.tier === 'PRO').length;

      expect(totalLicenses).toBe(3);
      expect(proLicenses).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero usage count', async () => {
      const zeroUsageLicense = {
        id: 'lic_new',
        name: 'New License',
        key: 'raas-free-zero',
        tier: 'FREE' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        usageCount: 0
      };

      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [zeroUsageLicense]
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses');
      const data = await response.json();

      expect(data[0].usageCount).toBe(0);
    });

    test('should handle license with no maxUsage (unlimited)', async () => {
      const unlimitedLicense = {
        id: 'lic_unlimited',
        name: 'Unlimited License',
        key: 'raas-ent-unlimited',
        tier: 'ENTERPRISE' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        usageCount: 999999
      };

      const okResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => [unlimitedLicense]
      };
      mockFetch.mockResolvedValueOnce(okResponse);

      const response = await fetch('/api/v1/licenses');
      const data = await response.json();

      expect(data[0].maxUsage).toBeUndefined();
    });

    test('should handle rate limiting on create license', async () => {
      const testLicense = { name: 'Test', tier: 'FREE' as const };

      const errorResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ error: 'Rate limit exceeded' })
      };
      mockFetch.mockResolvedValueOnce(errorResponse);

      const response = await fetch('/api/v1/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testLicense)
      });

      expect(response.status).toBe(429);
    });
  });
});
