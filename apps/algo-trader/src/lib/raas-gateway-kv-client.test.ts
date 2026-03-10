/**
 * RaaS Gateway KV Client Tests
 */

import { RaaSGatewayKVClient, KVKeyBuilder } from './raas-gateway-kv-client';

describe('RaaSGatewayKVClient', () => {
  let client: RaaSGatewayKVClient;

  beforeEach(() => {
    // Create client without env vars (will use memory/no-op mode)
    client = new RaaSGatewayKVClient();
  });

  it('should create client', () => {
    expect(client).toBeDefined();
  });

  it('should not be configured without env vars', () => {
    expect(client.isConfigured()).toBe(false);
  });

  it('should create client with config', () => {
    const configuredClient = new RaaSGatewayKVClient({
      apiToken: 'test_token',
      accountId: 'test_account',
      namespaceId: 'test_namespace',
    });

    expect(configuredClient.isConfigured()).toBe(true);
  });

  describe('KVKeyBuilder', () => {
    it('should build counter key', () => {
      const key = KVKeyBuilder.counterKey('lic_abc123', 'api_call', '2026-03');
      expect(key).toBe('raas:counter:lic_abc123:2026-03:api_call');
    });

    it('should build counter key with current month', () => {
      const key = KVKeyBuilder.counterKey('lic_abc123', 'api_call');
      expect(key).toContain('raas:counter:lic_abc123:');
      expect(key).toContain(':api_call');
    });

    it('should build suspension key', () => {
      const key = KVKeyBuilder.suspensionKey('lic_abc123');
      expect(key).toBe('raas:suspension:lic_abc123');
    });

    it('should build overage config key', () => {
      const key = KVKeyBuilder.overageConfigKey('lic_abc123');
      expect(key).toBe('raas:overage_config:lic_abc123');
    });

    it('should build overage state key', () => {
      const key = KVKeyBuilder.overageStateKey('lic_abc123');
      expect(key).toBe('raas:overage_state:lic_abc123');
    });
  });

  describe('Counter operations (no-op when not configured)', () => {
    it('should skip setCounter when not configured', async () => {
      await client.setCounter('lic_test', 'api_call', 100);
      // Should not throw
    });

    it('should return 0 for incrementCounter when not configured', async () => {
      const result = await client.incrementCounter('lic_test', 'api_call', 1);
      expect(result).toBe(0);
    });

    it('should return null for getCounter when not configured', async () => {
      const result = await client.getCounter('lic_test', 'api_call');
      expect(result).toBe(null);
    });
  });

  describe('Suspension operations (no-op when not configured)', () => {
    it('should skip setSuspension when not configured', async () => {
      await client.setSuspension('lic_test', {
        suspended: true,
        reason: 'quota_exceeded',
        currentUsage: 15000,
        limit: 10000,
      });
      // Should not throw
    });

    it('should return null for getSuspension when not configured', async () => {
      const result = await client.getSuspension('lic_test');
      expect(result).toBe(null);
    });
  });

  describe('Overage config operations (no-op when not configured)', () => {
    it('should skip setOverageConfig when not configured', async () => {
      await client.setOverageConfig('lic_test', {
        enabled: true,
        maxOveragePercent: 200,
      });
      // Should not throw
    });

    it('should return null for getOverageConfig when not configured', async () => {
      const result = await client.getOverageConfig('lic_test');
      expect(result).toBe(null);
    });
  });
});
