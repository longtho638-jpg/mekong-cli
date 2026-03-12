/**
 * security-audit.test.ts — ROIaaS endpoint security audit
 * Tests HMAC bypass, auth bypass, replay attacks, tier escalation, quota bypass,
 * cache poisoning, and null/empty input handling.
 */
import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';

import { verifyLicense, computeSignature } from '../license/verifier.js';
import { tierMeetsMinimum, getRequiredTier } from '../license/feature-map.js';
import { TIER_QUOTAS, TIER_ORDER } from '../license/types.js';
import { verifyWebhookSignature, parseWebhookPayload } from '../payments/webhook-verifier.js';
import type { LicenseKey, LicenseTier } from '../license/types.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function futureISO(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function pastISO(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function makeLicense(overrides: Partial<LicenseKey> = {}): LicenseKey {
  const base = {
    key: 'RAAS-SEC-001',
    tier: 'pro' as LicenseTier,
    status: 'active' as const,
    issuedAt: new Date().toISOString(),
    expiresAt: futureISO(30),
    owner: 'auditor@test.com',
    ...overrides,
  };
  return { ...base, signature: computeSignature(base as Omit<LicenseKey, 'signature'>) };
}

function makeWebhookSig(secret: string, id: string, ts: string, body: string): string {
  const content = `${id}.${ts}.${body}`;
  return 'v1,' + createHmac('sha256', secret).update(content).digest('hex');
}

const NOW_TS = String(Math.floor(Date.now() / 1000));
const SECRET = 'test-webhook-secret';
const BODY = JSON.stringify({ type: 'checkout.completed', id: 'evt_001', data: {} });
const WH_ID = 'wh_001';

// ─── 1. HMAC Bypass Prevention ─────────────────────────────────────────────────

describe('HMAC bypass prevention', () => {
  it('rejects tampered signature (bit flip)', () => {
    const lic = makeLicense();
    const tampered = lic.signature.replace(/[a-f]/, 'x');
    const result = verifyLicense({ ...lic, signature: tampered });
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/signature invalid/i);
  });

  it('rejects empty string signature', () => {
    const lic = makeLicense();
    const result = verifyLicense({ ...lic, signature: '' });
    expect(result.valid).toBe(false);
  });

  it('rejects signature computed with wrong secret', () => {
    const wrongSecret = 'wrong-secret-key';
    const lic = makeLicense();
    const badSig = computeSignature(
      { key: lic.key, tier: lic.tier, status: lic.status, issuedAt: lic.issuedAt, expiresAt: lic.expiresAt, owner: lic.owner },
      wrongSecret,
    );
    const result = verifyLicense({ ...lic, signature: badSig });
    expect(result.valid).toBe(false);
  });

  it('rejects signature after field mutation (tier upgrade attempt)', () => {
    const lic = makeLicense({ tier: 'starter' });
    // Attacker changes tier to 'enterprise' without re-signing
    const escalated = { ...lic, tier: 'enterprise' as LicenseTier };
    const result = verifyLicense(escalated);
    expect(result.valid).toBe(false);
  });
});

// ─── 2. Expiry Enforcement — No Grace Period Bypass ────────────────────────────

describe('expiry enforcement', () => {
  it('rejects license expired beyond grace period (8+ days ago)', () => {
    const base = { tier: 'pro' as LicenseTier, expiresAt: pastISO(8) };
    const lic = makeLicense(base);
    const result = verifyLicense(lic);
    expect(result.valid).toBe(false);
    expect(result.status).toBe('expired');
  });

  it('accepts license within 7-day grace period', () => {
    const lic = makeLicense({ expiresAt: pastISO(3) });
    const result = verifyLicense(lic);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('grace');
  });

  it('rejects revoked license even with valid signature', () => {
    // Build a properly signed revoked license — must not be valid
    const partial = {
      key: 'RAAS-REV-001',
      tier: 'enterprise' as LicenseTier,
      status: 'revoked' as const,
      issuedAt: new Date().toISOString(),
      expiresAt: futureISO(365),
      owner: 'attacker@bad.com',
    };
    const sig = computeSignature(partial);
    const result = verifyLicense({ ...partial, signature: sig });
    expect(result.valid).toBe(false);
    expect(result.status).toBe('revoked');
  });
});

// ─── 3. Tier Escalation Prevention ────────────────────────────────────────────

describe('tier escalation prevention', () => {
  it('free tier cannot access starter commands', () => {
    expect(tierMeetsMinimum('free', 'starter')).toBe(false);
  });

  it('free tier cannot access pro commands', () => {
    expect(tierMeetsMinimum('free', 'pro')).toBe(false);
  });

  it('free tier cannot access enterprise commands', () => {
    expect(tierMeetsMinimum('free', 'enterprise')).toBe(false);
  });

  it('starter tier cannot access pro commands', () => {
    expect(tierMeetsMinimum('starter', 'pro')).toBe(false);
  });

  it('pro tier cannot access enterprise commands', () => {
    expect(tierMeetsMinimum('pro', 'enterprise')).toBe(false);
  });

  it('each tier only meets its own and lower tiers', () => {
    for (let i = 0; i < TIER_ORDER.length; i++) {
      const current = TIER_ORDER[i];
      for (let j = 0; j < TIER_ORDER.length; j++) {
        const required = TIER_ORDER[j];
        expect(tierMeetsMinimum(current, required)).toBe(i >= j);
      }
    }
  });

  it('enterprise-gated command cannot be accessed by free tier', () => {
    const tier = getRequiredTier('self-improve');
    expect(tierMeetsMinimum('free', tier)).toBe(false);
  });
});

// ─── 4. Webhook Signature — Bypass Prevention ─────────────────────────────────

describe('webhook signature bypass prevention', () => {
  it('rejects request with wrong secret', () => {
    const sig = makeWebhookSig(SECRET, WH_ID, NOW_TS, BODY);
    const result = verifyWebhookSignature({
      rawBody: BODY, signature: sig, secret: 'bad-secret',
      webhookId: WH_ID, timestamp: NOW_TS,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects tampered body', () => {
    const sig = makeWebhookSig(SECRET, WH_ID, NOW_TS, BODY);
    const tamperedBody = BODY.replace('checkout.completed', 'subscription.canceled');
    const result = verifyWebhookSignature({
      rawBody: tamperedBody, signature: sig, secret: SECRET,
      webhookId: WH_ID, timestamp: NOW_TS,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects missing signature header', () => {
    const result = verifyWebhookSignature({
      rawBody: BODY, signature: '', secret: SECRET,
      webhookId: WH_ID, timestamp: NOW_TS,
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: Error }).error.message).toMatch(/missing/i);
  });

  it('rejects missing secret', () => {
    const sig = makeWebhookSig(SECRET, WH_ID, NOW_TS, BODY);
    const result = verifyWebhookSignature({
      rawBody: BODY, signature: sig, secret: '',
      webhookId: WH_ID, timestamp: NOW_TS,
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: Error }).error.message).toMatch(/secret not configured/i);
  });
});

// ─── 5. Webhook Replay Attack Prevention ──────────────────────────────────────

describe('webhook replay attack prevention', () => {
  it('rejects webhook with timestamp older than maxAgeSeconds', () => {
    const oldTs = String(Math.floor(Date.now() / 1000) - 600); // 10 min ago
    const sig = makeWebhookSig(SECRET, WH_ID, oldTs, BODY);
    const result = verifyWebhookSignature({
      rawBody: BODY, signature: sig, secret: SECRET,
      webhookId: WH_ID, timestamp: oldTs, maxAgeSeconds: 300,
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: Error }).error.message).toMatch(/too old/i);
  });

  it('rejects webhook with invalid (NaN) timestamp', () => {
    const sig = makeWebhookSig(SECRET, WH_ID, 'not-a-number', BODY);
    const result = verifyWebhookSignature({
      rawBody: BODY, signature: sig, secret: SECRET,
      webhookId: WH_ID, timestamp: 'not-a-number',
    });
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: Error }).error.message).toMatch(/invalid.*timestamp/i);
  });

  it('accepts valid recent webhook', () => {
    const sig = makeWebhookSig(SECRET, WH_ID, NOW_TS, BODY);
    const result = verifyWebhookSignature({
      rawBody: BODY, signature: sig, secret: SECRET,
      webhookId: WH_ID, timestamp: NOW_TS,
    });
    expect(result.ok).toBe(true);
  });
});

// ─── 6. Null / Empty / Undefined Input Handling ───────────────────────────────

describe('null / empty input hardening', () => {
  it('parseWebhookPayload rejects empty string', () => {
    const result = parseWebhookPayload('');
    expect(result.ok).toBe(false);
  });

  it('parseWebhookPayload rejects payload missing type field', () => {
    const result = parseWebhookPayload(JSON.stringify({ id: 'x' }));
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: Error }).error.message).toMatch(/missing type/i);
  });

  it('parseWebhookPayload rejects payload missing id field', () => {
    const result = parseWebhookPayload(JSON.stringify({ type: 'checkout.completed' }));
    expect(result.ok).toBe(false);
  });

  it('verifyLicense handles undefined expiresAt gracefully (does not throw)', () => {
    const lic = makeLicense({ expiresAt: 'not-a-date' });
    expect(() => verifyLicense(lic)).not.toThrow();
    const result = verifyLicense(lic);
    // NaN date → remainingMs is NaN → expired path
    expect(result.valid).toBe(false);
  });
});

// ─── 7. Quota Bypass — Tier Quotas Are Non-Manipulable ────────────────────────

describe('quota bypass prevention', () => {
  it('free tier llm_call limit is positive and finite', () => {
    const q = TIER_QUOTAS['free'];
    expect(q.llmCallsPerDay).toBeGreaterThan(0);
    expect(Number.isFinite(q.llmCallsPerDay)).toBe(true);
  });

  it('enterprise tier has unlimited (-1) quotas — no positive cap to bypass', () => {
    const q = TIER_QUOTAS['enterprise'];
    expect(q.llmCallsPerDay).toBe(-1);
    expect(q.toolRunsPerDay).toBe(-1);
    expect(q.sopRunsPerDay).toBe(-1);
  });

  it('TIER_QUOTAS covers all tiers — no tier missing quotas', () => {
    for (const tier of TIER_ORDER) {
      expect(TIER_QUOTAS[tier]).toBeDefined();
      expect(TIER_QUOTAS[tier].tier).toBe(tier);
    }
  });

  it('quota limits increase monotonically across tiers (llmCallsPerDay)', () => {
    const paidTiers: LicenseTier[] = ['free', 'starter', 'pro'];
    for (let i = 0; i < paidTiers.length - 1; i++) {
      const lower = TIER_QUOTAS[paidTiers[i]].llmCallsPerDay;
      const higher = TIER_QUOTAS[paidTiers[i + 1]].llmCallsPerDay;
      expect(higher).toBeGreaterThan(lower);
    }
  });
});
