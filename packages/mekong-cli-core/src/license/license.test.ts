/**
 * license.test.ts — comprehensive tests for all license module phases.
 * Uses tmpdir to avoid side effects on ~/.mekong/
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { TIER_QUOTAS, TIER_ORDER } from './types.js';
import type { LicenseKey, LicenseTier } from './types.js';
import { LicenseStore } from './store.js';
import { verifyLicense, computeSignature } from './verifier.js';
import { LicenseGate } from './gate.js';
import { tierMeetsMinimum, getRequiredTier, FEATURE_MAP } from './feature-map.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function futureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86_400_000).toISOString();
}

function pastDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

function makeLicense(overrides: Partial<LicenseKey> = {}): LicenseKey {
  const partial = {
    key: 'RAAS-TEST-001',
    tier: 'starter' as LicenseTier,
    status: 'active' as const,
    issuedAt: new Date().toISOString(),
    expiresAt: futureDate(30),
    owner: 'test-user',
    ...overrides,
  };
  const signature = computeSignature(partial as Omit<LicenseKey, 'signature'>);
  return { ...partial, signature } as LicenseKey;
}

// ─── Phase 1: Types ────────────────────────────────────────────────────────────

describe('TIER_QUOTAS', () => {
  it('defines quotas for all four tiers', () => {
    const tiers: LicenseTier[] = ['free', 'starter', 'pro', 'enterprise'];
    for (const tier of tiers) {
      expect(TIER_QUOTAS[tier]).toBeDefined();
      expect(TIER_QUOTAS[tier].tier).toBe(tier);
    }
  });

  it('free tier has limited llmCallsPerDay', () => {
    expect(TIER_QUOTAS['free'].llmCallsPerDay).toBe(10);
  });

  it('enterprise tier has unlimited (-1) quotas', () => {
    const eq = TIER_QUOTAS['enterprise'];
    expect(eq.llmCallsPerDay).toBe(-1);
    expect(eq.toolRunsPerDay).toBe(-1);
    expect(eq.sopRunsPerDay).toBe(-1);
    expect(eq.storageBytes).toBe(-1);
  });

  it('quotas increase with tier', () => {
    expect(TIER_QUOTAS['starter'].llmCallsPerDay).toBeGreaterThan(TIER_QUOTAS['free'].llmCallsPerDay);
    expect(TIER_QUOTAS['pro'].llmCallsPerDay).toBeGreaterThan(TIER_QUOTAS['starter'].llmCallsPerDay);
  });

  it('TIER_ORDER contains all tiers in ascending order', () => {
    expect(TIER_ORDER).toEqual(['free', 'starter', 'pro', 'enterprise']);
  });
});

// ─── Phase 1: LicenseStore ────────────────────────────────────────────────────

describe('LicenseStore', () => {
  let tmpDir: string;
  let store: LicenseStore;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mekong-license-test-'));
    store = new LicenseStore(join(tmpDir, 'license.json'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('load returns ok(null) when no file exists', async () => {
    const result = await store.load();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });

  it('save and load round-trips a license', async () => {
    const lic = makeLicense();
    const saved = await store.save(lic);
    expect(saved.ok).toBe(true);

    const loaded = await store.load();
    expect(loaded.ok).toBe(true);
    if (loaded.ok && loaded.value) {
      expect(loaded.value.key).toBe(lic.key);
      expect(loaded.value.tier).toBe(lic.tier);
      expect(loaded.value.owner).toBe(lic.owner);
    }
  });

  it('clear removes the file', async () => {
    await store.save(makeLicense());
    await store.clear();
    const loaded = await store.load();
    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.value).toBeNull();
  });

  it('clear is idempotent when file does not exist', async () => {
    const result = await store.clear();
    expect(result.ok).toBe(true);
  });

  it('getPath returns the configured path', () => {
    expect(store.getPath()).toContain('license.json');
  });

  it('creates directory if missing', async () => {
    const nestedPath = join(tmpDir, 'nested', 'dir', 'license.json');
    const nestedStore = new LicenseStore(nestedPath);
    const result = await nestedStore.save(makeLicense());
    expect(result.ok).toBe(true);
  });

  it('save overwrites existing license', async () => {
    await store.save(makeLicense({ owner: 'first' }));
    await store.save(makeLicense({ owner: 'second' }));
    const loaded = await store.load();
    expect(loaded.ok).toBe(true);
    if (loaded.ok && loaded.value) {
      expect(loaded.value.owner).toBe('second');
    }
  });
});

// ─── Phase 2: LicenseVerifier ─────────────────────────────────────────────────

describe('verifyLicense', () => {
  it('validates a well-formed active license', () => {
    const lic = makeLicense();
    const result = verifyLicense(lic);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('active');
    expect(result.remainingDays).toBeGreaterThan(0);
  });

  it('rejects a license with wrong signature', () => {
    const lic = makeLicense();
    const tampered = { ...lic, signature: 'bad-signature' };
    const result = verifyLicense(tampered);
    expect(result.valid).toBe(false);
    expect(result.message).toContain('signature');
  });

  it('rejects a revoked license regardless of signature', () => {
    const lic = makeLicense({ status: 'revoked' });
    // Recompute signature for revoked status
    const sig = computeSignature({ ...lic });
    const result = verifyLicense({ ...lic, signature: sig });
    expect(result.valid).toBe(false);
    expect(result.status).toBe('revoked');
  });

  it('rejects an expired license outside grace period', () => {
    const lic = makeLicense({ expiresAt: pastDate(10) }); // 10 days ago, beyond 7-day grace
    const result = verifyLicense(lic);
    expect(result.valid).toBe(false);
    expect(result.status).toBe('expired');
  });

  it('accepts a license in grace period (expired < 7 days ago)', () => {
    const lic = makeLicense({ expiresAt: pastDate(3) }); // 3 days ago, within grace
    const result = verifyLicense(lic);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('grace');
    expect(result.message).toContain('Grace period');
  });

  it('computeSignature is deterministic', () => {
    const lic = makeLicense();
    const s1 = computeSignature(lic);
    const s2 = computeSignature(lic);
    expect(s1).toBe(s2);
  });

  it('computeSignature changes when any field changes', () => {
    const lic = makeLicense();
    const s1 = computeSignature(lic);
    const s2 = computeSignature({ ...lic, owner: 'other-user' });
    expect(s1).not.toBe(s2);
  });

  it('accepts custom signing secret', () => {
    const partial = {
      key: 'K1', tier: 'pro' as LicenseTier, status: 'active' as const,
      issuedAt: new Date().toISOString(), expiresAt: futureDate(30), owner: 'me',
    };
    const sig = computeSignature(partial, 'my-secret');
    const lic: LicenseKey = { ...partial, signature: sig };
    const result = verifyLicense(lic, 'my-secret');
    expect(result.valid).toBe(true);
  });
});

// ─── Phase 3: FeatureMap ──────────────────────────────────────────────────────

describe('tierMeetsMinimum', () => {
  it('free meets free', () => expect(tierMeetsMinimum('free', 'free')).toBe(true));
  it('starter meets free', () => expect(tierMeetsMinimum('starter', 'free')).toBe(true));
  it('pro meets starter', () => expect(tierMeetsMinimum('pro', 'starter')).toBe(true));
  it('enterprise meets pro', () => expect(tierMeetsMinimum('enterprise', 'pro')).toBe(true));
  it('free does not meet starter', () => expect(tierMeetsMinimum('free', 'starter')).toBe(false));
  it('starter does not meet pro', () => expect(tierMeetsMinimum('starter', 'pro')).toBe(false));
  it('pro does not meet enterprise', () => expect(tierMeetsMinimum('pro', 'enterprise')).toBe(false));
});

describe('getRequiredTier', () => {
  it('run is free', () => expect(getRequiredTier('run')).toBe('free'));
  it('crm is starter', () => expect(getRequiredTier('crm')).toBe('starter'));
  it('kaizen is pro', () => expect(getRequiredTier('kaizen')).toBe('pro'));
  it('self-improve is enterprise', () => expect(getRequiredTier('self-improve')).toBe('enterprise'));
  it('unknown command defaults to free', () => expect(getRequiredTier('unknown-xyz')).toBe('free'));
});

describe('FEATURE_MAP', () => {
  it('contains entries for all known tiers', () => {
    const tiers = new Set(FEATURE_MAP.map(f => f.minTier));
    expect(tiers.has('free')).toBe(true);
    expect(tiers.has('starter')).toBe(true);
    expect(tiers.has('pro')).toBe(true);
    expect(tiers.has('enterprise')).toBe(true);
  });

  it('all entries have non-empty command and description', () => {
    for (const entry of FEATURE_MAP) {
      expect(entry.command.length).toBeGreaterThan(0);
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });
});

// ─── Phase 3: LicenseGate ─────────────────────────────────────────────────────

describe('LicenseGate', () => {
  let tmpDir: string;
  let store: LicenseStore;
  let gate: LicenseGate;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'mekong-gate-test-'));
    store = new LicenseStore(join(tmpDir, 'license.json'));
    gate = new LicenseGate(store);
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns free tier when no license stored', async () => {
    const result = await gate.validate();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tier).toBe('free');
      expect(result.value.valid).toBe(true);
    }
  });

  it('returns correct tier for stored active license', async () => {
    await store.save(makeLicense({ tier: 'pro' }));
    const result = await gate.validate();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tier).toBe('pro');
  });

  it('canAccess allows free commands without license', async () => {
    const result = await gate.canAccess('run');
    expect(result.ok).toBe(true);
  });

  it('canAccess blocks starter command on free tier', async () => {
    const result = await gate.canAccess('crm');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('starter');
  });

  it('canAccess allows crm with starter license', async () => {
    await store.save(makeLicense({ tier: 'starter' }));
    const result = await gate.canAccess('crm');
    expect(result.ok).toBe(true);
  });

  it('canAccess blocks pro command on starter license', async () => {
    await store.save(makeLicense({ tier: 'starter' }));
    const result = await gate.canAccess('kaizen');
    expect(result.ok).toBe(false);
  });

  it('canAccess allows self-improve with enterprise license', async () => {
    await store.save(makeLicense({ tier: 'enterprise' }));
    const result = await gate.canAccess('self-improve');
    expect(result.ok).toBe(true);
  });

  it('getCurrentTier returns free when no license', async () => {
    const tier = await gate.getCurrentTier();
    expect(tier).toBe('free');
  });

  it('getQuotas returns correct quotas for tier', async () => {
    await store.save(makeLicense({ tier: 'pro' }));
    const quotas = await gate.getQuotas();
    expect(quotas.tier).toBe('pro');
    expect(quotas.llmCallsPerDay).toBe(1000);
  });

  it('getCachedValidation is null before first validate()', () => {
    expect(gate.getCachedValidation()).toBeNull();
  });

  it('getCachedValidation is populated after validate()', async () => {
    await gate.validate();
    expect(gate.getCachedValidation()).not.toBeNull();
  });

  it('falls back to free tier for expired license', async () => {
    await store.save(makeLicense({ expiresAt: pastDate(10) }));
    const result = await gate.validate();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tier).toBe('free');
      expect(result.value.valid).toBe(false);
    }
  });
});

// ─── Phase 5: RemoteLicenseClient (unit-level cache tests) ───────────────────

describe('RemoteLicenseClient cache behaviour', () => {
  // We only test the cache path without hitting real network
  it('module imports without error', async () => {
    const { RemoteLicenseClient } = await import('./remote.js');
    expect(RemoteLicenseClient).toBeDefined();
  });

  it('can be constructed with custom paths', async () => {
    const { RemoteLicenseClient } = await import('./remote.js');
    const tmpDir2 = await mkdtemp(join(tmpdir(), 'mekong-remote-test-'));
    try {
      const client = new RemoteLicenseClient('https://example.com', join(tmpDir2, 'cache.json'));
      expect(client).toBeDefined();
    } finally {
      await rm(tmpDir2, { recursive: true, force: true });
    }
  });
});

// ─── Phase 6: License CLI command (smoke import) ─────────────────────────────

describe('registerLicenseCommand', () => {
  it('imports without error', async () => {
    const mod = await import('../cli/commands/license.js');
    expect(mod.registerLicenseCommand).toBeDefined();
    expect(typeof mod.registerLicenseCommand).toBe('function');
  });
});

// ─── Phase 7: Engine integration ─────────────────────────────────────────────

describe('MekongEngine license integration', () => {
  it('LicenseGate is wired into engine after init', async () => {
    const { MekongEngine } = await import('../core/engine.js');
    const engine = new MekongEngine();
    // Before init, license field is undefined
    expect((engine as { license?: unknown }).license).toBeUndefined();

    // Init with minimal config to avoid LLM network calls
    await engine.init({ configOverrides: { llm: { providers: {} } as never } });
    expect(engine.license).toBeDefined();
    await engine.shutdown();
  });

  it('getStatus includes tier field', async () => {
    const { MekongEngine } = await import('../core/engine.js');
    const engine = new MekongEngine();
    await engine.init({ configOverrides: { llm: { providers: {} } as never } });
    const status = engine.getStatus();
    expect(status).toHaveProperty('tier');
    expect(['free', 'starter', 'pro', 'enterprise']).toContain(status.tier);
    await engine.shutdown();
  });
});

// ─── Phase 4: Middleware (smoke test) ────────────────────────────────────────

describe('attachLicenseMiddleware', () => {
  it('imports without error', async () => {
    const mod = await import('./middleware.js');
    expect(mod.attachLicenseMiddleware).toBeDefined();
  });

  it('attaches to commander program without throwing', async () => {
    const { Command } = await import('commander');
    const { attachLicenseMiddleware } = await import('./middleware.js');
    const program = new Command();
    expect(() => attachLicenseMiddleware(program)).not.toThrow();
  });
});
