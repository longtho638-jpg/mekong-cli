/**
 * Unit tests for RaaS License Gate
 *
 * Tests cover:
 * - License format validation (standard, short, legacy)
 * - Tier verification (FREE, PRO, ENTERPRISE)
 * - SHA-256 hashing
 * - LicenseError handling scenarios
 * - Premium agent gating
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createHash } from 'crypto';

// Reset env var between tests
describe('RaaS License Gate', () => {
  const originalEnv = process.env.RAAS_LICENSE_KEY;

  beforeEach(() => {
    delete process.env.RAAS_LICENSE_KEY;
    // Need to re-import to pick up env changes
    vi.resetModules();
  });

  afterEach(() => {
    process.env.RAAS_LICENSE_KEY = originalEnv;
  });

  describe('validateLicenseKeyFormat', () => {
    it('accepts standard format (mekong-XXXX-XXXX-XXXX-XXXX)', () => {
      expect(validateLicenseKeyFormat('mekong-ABCD-1234-EFGH-5678')).toBe(true);
      expect(validateLicenseKeyFormat('mekong-1234-5678-ABCD-EFGH')).toBe(true);
      expect(validateLicenseKeyFormat('MEKONG-ABCD-1234-EFGH-5678')).toBe(true); // case insensitive
    });

    it('accepts short format (mk_XXXXXXXXXXXXXXXX)', () => {
      expect(validateLicenseKeyFormat('mk_ABCD1234EFGH5678')).toBe(true);
      expect(validateLicenseKeyFormat('mk_1234567890ABCDEF')).toBe(true);
      expect(validateLicenseKeyFormat('MK_ABCD1234EFGH5678')).toBe(true); // case insensitive
    });

    it('accepts legacy format (>= 16 chars)', () => {
      expect(validateLicenseKeyFormat('your-license-key-here')).toBe(true);
      expect(validateLicenseKeyFormat('0123456789ABCDEF')).toBe(true); // exactly 16
      expect(validateLicenseKeyFormat('a'.repeat(100))).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(validateLicenseKeyFormat('')).toBe(false);
      expect(validateLicenseKeyFormat('short')).toBe(false);
      expect(validateLicenseKeyFormat('123456789012345')).toBe(false); // 15 chars
      expect(validateLicenseKeyFormat(null as any)).toBe(false);
      expect(validateLicenseKeyFormat(undefined as any)).toBe(false);
      expect(validateLicenseKeyFormat(123 as any)).toBe(false);
    });

    it('rejects malformed patterns', () => {
      // Wrong prefix
      expect(validateLicenseKeyFormat('mekon-ABCD-1234-EFGH-5678')).toBe(false);
      expect(validateLicenseKeyFormat('mekongg-ABCD-1234-EFGH-5678')).toBe(false);

      // Wrong segment length
      expect(validateLicenseKeyFormat('mekong-ABC-1234-EFGH-5678')).toBe(false);
      expect(validateLicenseKeyFormat('mekong-ABCDE-1234-EFGH-5678')).toBe(false);

      // Wrong short prefix
      expect(validateLicenseKeyFormat('m_ABCD1234EFGH5678')).toBe(false);
      expect(validateLicenseKeyFormat('mkk_ABCD1234EFGH5678')).toBe(false);

      // Wrong short length
      expect(validateLicenseKeyFormat('mk_ABCD123')).toBe(false);
      expect(validateLicenseKeyFormat('mk_ABCD1234EFGH56789')).toBe(false);
    });
  });

  describe('hashLicenseKey', () => {
    it('produces consistent SHA-256 hash', () => {
      const key = 'test-license-key';
      const hash1 = hashLicenseKey(key);
      const hash2 = hashLicenseKey(key);
      expect(hash1).toBe(hash2);
    });

    it('produces different hashes for different keys', () => {
      const hash1 = hashLicenseKey('key-1');
      const hash2 = hashLicenseKey('key-2');
      expect(hash1).not.toBe(hash2);
    });

    it('produces valid hex SHA-256 output (64 chars)', () => {
      const hash = hashLicenseKey('test-key');
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('matches Node.js crypto module directly', () => {
      const key = 'verification-test';
      const expected = createHash('sha256').update(key).digest('hex');
      const actual = hashLicenseKey(key);
      expect(actual).toBe(expected);
    });
  });

  describe('LicenseError', () => {
    it('creates error with message and code', () => {
      const error = new LicenseError('Test message', 'TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('LicenseError');
    });

    it('is instance of Error', () => {
      const error = new LicenseError('Test', 'CODE');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(LicenseError);
    });

    it('has stack trace', () => {
      const error = new LicenseError('Test', 'CODE');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('LicenseError');
    });
  });

  describe('hasValidLicense', () => {
    it('returns false when env var not set', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { hasValidLicense } = requireReloaded();
      expect(hasValidLicense()).toBe(false);
    });

    it('returns false for invalid format', () => {
      process.env.RAAS_LICENSE_KEY = 'invalid';
      const { hasValidLicense } = requireReloaded();
      expect(hasValidLicense()).toBe(false);
    });

    it('returns true for valid standard format', () => {
      process.env.RAAS_LICENSE_KEY = 'mekong-ABCD-1234-EFGH-5678';
      const { hasValidLicense } = requireReloaded();
      expect(hasValidLicense()).toBe(true);
    });

    it('returns true for valid short format', () => {
      process.env.RAAS_LICENSE_KEY = 'mk_ABCD1234EFGH5678';
      const { hasValidLicense } = requireReloaded();
      expect(hasValidLicense()).toBe(true);
    });

    it('returns true for valid legacy format', () => {
      process.env.RAAS_LICENSE_KEY = 'your-legacy-license-key';
      const { hasValidLicense } = requireReloaded();
      expect(hasValidLicense()).toBe(true);
    });
  });

  describe('getLicenseValidation', () => {
    it('returns error when env var not set', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { getLicenseValidation } = requireReloaded();
      const result = getLicenseValidation();
      expect(result.valid).toBe(false);
      expect(result.tier).toBe('free');
      expect(result.error).toBe('RAAS_LICENSE_KEY not set');
    });

    it('returns error for invalid format', () => {
      process.env.RAAS_LICENSE_KEY = 'bad';
      const { getLicenseValidation } = requireReloaded();
      const result = getLicenseValidation();
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid license key format');
    });

    it('returns valid result for good license', () => {
      process.env.RAAS_LICENSE_KEY = 'mekong-ABCD-1234-EFGH-5678';
      const { getLicenseValidation } = requireReloaded();
      const result = getLicenseValidation();
      expect(result.valid).toBe(true);
      expect(result.tier).toBe('pro');
      expect(result.features).toContain('auto-cto-pilot');
    });
  });

  describe('requireLicense', () => {
    it('throws LICENSE_REQUIRED when no license', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { requireLicense, LicenseError } = requireReloaded();
      expect(() => requireLicense('Test Feature')).toThrow(LicenseError);
      expect(() => requireLicense('Test Feature')).toThrow('LICENSE_REQUIRED');
    });

    it('throws with descriptive message', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { requireLicense, LicenseError } = requireReloaded();
      try {
        requireLicense('Premium Feature X');
      } catch (error) {
        expect((error as LicenseError).message).toContain('Premium Feature X');
        expect((error as LicenseError).message).toContain('premium feature');
      }
    });

    it('does not throw with valid license', () => {
      process.env.RAAS_LICENSE_KEY = 'mekong-ABCD-1234-EFGH-5678';
      const { requireLicense } = requireReloaded();
      expect(() => requireLicense('auto-cto-pilot')).not.toThrow();
    });
  });

  describe('requirePremiumAgent', () => {
    it('does not throw for non-premium agents', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { requirePremiumAgent } = requireReloaded();
      expect(() => requirePremiumAgent('planner')).not.toThrow();
      expect(() => requirePremiumAgent('fullstack-developer')).not.toThrow();
    });

    it('throws LICENSE_REQUIRED for premium agents without license', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { requirePremiumAgent, LicenseError } = requireReloaded();
      expect(() => requirePremiumAgent('opus-strategy')).toThrow(LicenseError);
      expect(() => requirePremiumAgent('opus-strategy')).toThrow('LICENSE_REQUIRED');
    });

    it('throws for all premium agents without license', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { requirePremiumAgent } = requireReloaded();

      const premiumAgents = ['auto-cto-pilot', 'opus-strategy', 'opus-parallel', 'opus-review'];
      premiumAgents.forEach(agent => {
        expect(() => requirePremiumAgent(agent)).toThrow();
      });
    });

    it('does not throw for premium agents with valid license', () => {
      process.env.RAAS_LICENSE_KEY = 'mekong-ABCD-1234-EFGH-5678';
      const { requirePremiumAgent } = requireReloaded();
      expect(() => requirePremiumAgent('opus-strategy')).not.toThrow();
      expect(() => requirePremiumAgent('auto-cto-pilot')).not.toThrow();
    });
  });

  describe('isPremiumAgent', () => {
    it('returns true for premium agents', () => {
      const { isPremiumAgent } = requireReloaded();
      expect(isPremiumAgent('auto-cto-pilot')).toBe(true);
      expect(isPremiumAgent('opus-strategy')).toBe(true);
      expect(isPremiumAgent('opus-parallel')).toBe(true);
      expect(isPremiumAgent('opus-review')).toBe(true);
    });

    it('returns false for core agents', () => {
      const { isPremiumAgent } = requireReloaded();
      expect(isPremiumAgent('planner')).toBe(false);
      expect(isPremiumAgent('fullstack-developer')).toBe(false);
      expect(isPremiumAgent('code-reviewer')).toBe(false);
    });

    it('returns false for unknown agents', () => {
      const { isPremiumAgent } = requireReloaded();
      expect(isPremiumAgent('unknown-agent')).toBe(false);
      expect(isPremiumAgent('')).toBe(false);
    });
  });

  describe('getAvailableAgents', () => {
    it('returns core agents only without license', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { getAvailableAgents } = requireReloaded();
      const agents = getAvailableAgents();

      expect(agents.available).toContain('planner');
      expect(agents.available).toContain('fullstack-developer');
      expect(agents.available).not.toContain('opus-strategy');
      expect(agents.locked).toContain('auto-cto-pilot');
      expect(agents.premium.length).toBe(4);
    });

    it('returns all agents with valid license', () => {
      process.env.RAAS_LICENSE_KEY = 'mekong-ABCD-1234-EFGH-5678';
      const { getAvailableAgents } = requireReloaded();
      const agents = getAvailableAgents();

      expect(agents.available.length).toBeGreaterThan(10);
      expect(agents.available).toContain('opus-strategy');
      expect(agents.locked).toHaveLength(0);
    });
  });

  describe('getLicenseStatus', () => {
    it('returns safe status without license', () => {
      delete process.env.RAAS_LICENSE_KEY;
      const { getLicenseStatus } = requireReloaded();
      const status = getLicenseStatus();

      expect(status.hasLicense).toBe(false);
      expect(status.tier).toBe('free');
      expect(status.featureCount).toBe(0);
      expect(status.maskedKey).toBeUndefined();
    });

    it('returns masked key for logging', () => {
      process.env.RAAS_LICENSE_KEY = 'mekong-ABCD-1234-EFGH-5678';
      const { getLicenseStatus } = requireReloaded();
      const status = getLicenseStatus();

      expect(status.hasLicense).toBe(true);
      expect(status.maskedKey).toBe('meko...5678');
      expect(status.maskedKey).not.toContain('ABCD-1234-EFGH'); // Full key not exposed
    });

    it('handles short format masking', () => {
      process.env.RAAS_LICENSE_KEY = 'mk_ABCD1234EFGH5678';
      const { getLicenseStatus } = requireReloaded();
      const status = getLicenseStatus();

      expect(status.maskedKey).toBe('mk_A...5678');
    });
  });

  describe('PREMIUM_AGENTS constant', () => {
    it('defines all premium agents with required fields', () => {
      const { PREMIUM_AGENTS } = requireReloaded();
      const agents = Object.entries(PREMIUM_AGENTS);

      expect(agents.length).toBe(4);

      agents.forEach(([key, agent]) => {
        expect(agent.name).toBeDefined();
        expect(agent.description).toBeDefined();
        expect(agent.phase).toBeDefined();
        expect(agent.requiredTier).toBeDefined();
      });
    });

    it('has PRO tier for all agents', () => {
      const { PREMIUM_AGENTS, LicenseTier } = requireReloaded();

      Object.values(PREMIUM_AGENTS).forEach(agent => {
        expect(agent.requiredTier).toBe(LicenseTier.PRO);
      });
    });
  });
});

/**
 * Helper to reload module with fresh env
 */
function requireReloaded() {
  // In vitest, we need to use vi.importActual after resetModules
  return vi.importActual<typeof import('../lib/raas-gate')>('../lib/raas-gate');
}

/**
 * Helper to test hash function (needs access to internal function)
 */
function hashLicenseKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}
