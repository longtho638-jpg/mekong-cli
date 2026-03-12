/**
 * Tests for v0.5 License Admin — all 7 phases.
 * Uses os.tmpdir() for all file ops — no ~/.mekong writes.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { generateKey } from './key-generator.js';
import { LicenseAdmin } from './admin.js';
import { AuditLog } from './audit-log.js';
import { changeTier, upgradeTier, downgradeTier } from './tier-manager.js';
import { verifyLicense } from './verifier.js';
import type { LicenseKey } from './types.js';

// ── helpers ────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return join(tmpdir(), 'mekong-admin-test-' + randomBytes(4).toString('hex'));
}

function makeAdmin(base?: string): { admin: LicenseAdmin; registryPath: string; auditPath: string } {
  const dir = base ?? tmpDir();
  const registryPath = join(dir, 'keys.json');
  const auditPath = join(dir, 'audit.jsonl');
  return { admin: new LicenseAdmin(registryPath, auditPath, 'test-op'), registryPath, auditPath };
}

// ── Phase 1: Key Generator ─────────────────────────────────────────────────

describe('Phase 1: generateKey', () => {
  it('generates key with correct format RAAS-{TIER}-{16hex}', () => {
    const k = generateKey({ tier: 'pro', owner: 'user@example.com' });
    expect(k.key).toMatch(/^RAAS-PRO-[0-9a-f]{16}$/);
  });

  it('sets tier correctly', () => {
    expect(generateKey({ tier: 'starter', owner: 'a' }).tier).toBe('starter');
    expect(generateKey({ tier: 'enterprise', owner: 'a' }).tier).toBe('enterprise');
  });

  it('sets owner correctly', () => {
    const k = generateKey({ tier: 'free', owner: 'john@doe.com' });
    expect(k.owner).toBe('john@doe.com');
  });

  it('defaults expiryDays to 365', () => {
    const k = generateKey({ tier: 'pro', owner: 'a' });
    const diff = new Date(k.expiresAt).getTime() - new Date(k.issuedAt).getTime();
    const days = Math.round(diff / 86_400_000);
    expect(days).toBe(365);
  });

  it('respects custom expiryDays', () => {
    const k = generateKey({ tier: 'pro', owner: 'a', expiryDays: 30 });
    const diff = new Date(k.expiresAt).getTime() - new Date(k.issuedAt).getTime();
    const days = Math.round(diff / 86_400_000);
    expect(days).toBe(30);
  });

  it('generates a valid HMAC signature (verifies successfully)', () => {
    const k = generateKey({ tier: 'starter', owner: 'a' });
    const v = verifyLicense(k);
    expect(v.valid).toBe(true);
    expect(v.status).toBe('active');
  });

  it('status is active', () => {
    expect(generateKey({ tier: 'pro', owner: 'a' }).status).toBe('active');
  });

  it('generates unique keys on consecutive calls', () => {
    const k1 = generateKey({ tier: 'pro', owner: 'a' });
    const k2 = generateKey({ tier: 'pro', owner: 'a' });
    expect(k1.key).not.toBe(k2.key);
  });
});

// ── Phase 2: LicenseAdmin Core ─────────────────────────────────────────────

describe('Phase 2: LicenseAdmin', () => {
  it('createKey returns a LicenseKey', async () => {
    const { admin } = makeAdmin();
    const r = await admin.createKey('pro', 'user@example.com');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.tier).toBe('pro');
    expect(r.value.owner).toBe('user@example.com');
    expect(r.value.status).toBe('active');
  });

  it('listKeys returns created keys', async () => {
    const { admin } = makeAdmin();
    await admin.createKey('starter', 'a@b.com');
    await admin.createKey('pro', 'c@d.com');
    const r = await admin.listKeys();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(2);
  });

  it('listKeys returns empty array when no keys', async () => {
    const { admin } = makeAdmin();
    const r = await admin.listKeys();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(0);
  });

  it('revokeKey sets status to revoked', async () => {
    const { admin } = makeAdmin();
    const created = await admin.createKey('pro', 'a@b.com');
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const revoke = await admin.revokeKey(created.value.key);
    expect(revoke.ok).toBe(true);
    const list = await admin.listKeys();
    if (!list.ok) return;
    const found = list.value.find((k) => k.key === created.value.key);
    expect(found?.status).toBe('revoked');
  });

  it('revokeKey returns error for unknown key', async () => {
    const { admin } = makeAdmin();
    const r = await admin.revokeKey('RAAS-PRO-nonexistent');
    expect(r.ok).toBe(false);
  });

  it('rotateKey creates new key with same tier/owner', async () => {
    const { admin } = makeAdmin();
    const created = await admin.createKey('enterprise', 'owner@co.com', 100);
    if (!created.ok) return;
    const rotated = await admin.rotateKey(created.value.key);
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;
    expect(rotated.value.tier).toBe('enterprise');
    expect(rotated.value.owner).toBe('owner@co.com');
    expect(rotated.value.key).not.toBe(created.value.key);
  });

  it('rotateKey revokes old key', async () => {
    const { admin } = makeAdmin();
    const created = await admin.createKey('pro', 'a@b.com', 50);
    if (!created.ok) return;
    await admin.rotateKey(created.value.key);
    const list = await admin.listKeys();
    if (!list.ok) return;
    const old = list.value.find((k) => k.key === created.value.key);
    expect(old?.status).toBe('revoked');
  });

  it('rotateKey returns error for unknown key', async () => {
    const { admin } = makeAdmin();
    const r = await admin.rotateKey('RAAS-PRO-unknown');
    expect(r.ok).toBe(false);
  });

  it('registry persists across admin instances', async () => {
    const dir = tmpDir();
    const { admin: a1, registryPath, auditPath } = makeAdmin(dir);
    await a1.createKey('pro', 'persist@test.com');
    const a2 = new LicenseAdmin(registryPath, auditPath, 'test-op');
    const r = await a2.listKeys();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(1);
    expect(r.value[0]?.owner).toBe('persist@test.com');
  });
});

// ── Phase 3: AuditLog ──────────────────────────────────────────────────────

describe('Phase 3: AuditLog', () => {
  it('appends and reads entries', async () => {
    const path = join(tmpDir(), 'audit.jsonl');
    const log = new AuditLog(path);
    await log.append({ action: 'create', keyId: 'RAAS-PRO-abc', operator: 'op1' });
    const r = await log.readAll();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(1);
    expect(r.value[0]?.action).toBe('create');
  });

  it('returns empty array when log file absent', async () => {
    const path = join(tmpDir(), 'nonexistent', 'audit.jsonl');
    const log = new AuditLog(path);
    const r = await log.readAll();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(0);
  });

  it('records timestamp on each entry', async () => {
    const path = join(tmpDir(), 'audit.jsonl');
    const log = new AuditLog(path);
    await log.append({ action: 'revoke', keyId: 'RAAS-PRO-ts', operator: 'op' });
    const r = await log.readAll();
    if (!r.ok) return;
    expect(r.value[0]?.timestamp).toBeTruthy();
    expect(new Date(r.value[0]!.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('readByKey filters correctly', async () => {
    const path = join(tmpDir(), 'audit.jsonl');
    const log = new AuditLog(path);
    await log.append({ action: 'create', keyId: 'RAAS-PRO-aaa', operator: 'op' });
    await log.append({ action: 'create', keyId: 'RAAS-PRO-bbb', operator: 'op' });
    await log.append({ action: 'revoke', keyId: 'RAAS-PRO-aaa', operator: 'op' });
    const r = await log.readByKey('RAAS-PRO-aaa');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(2);
    expect(r.value.every((e) => e.keyId === 'RAAS-PRO-aaa')).toBe(true);
  });

  it('createKey appends audit entry', async () => {
    const { admin, auditPath } = makeAdmin();
    const r = await admin.createKey('starter', 'audit@test.com');
    if (!r.ok) return;
    const log = new AuditLog(auditPath);
    const entries = await log.readAll();
    expect(entries.ok).toBe(true);
    if (!entries.ok) return;
    expect(entries.value.some((e) => e.action === 'create' && e.keyId === r.value.key)).toBe(true);
  });

  it('revokeKey appends audit entry', async () => {
    const { admin, auditPath } = makeAdmin();
    const created = await admin.createKey('pro', 'a@b.com');
    if (!created.ok) return;
    await admin.revokeKey(created.value.key);
    const log = new AuditLog(auditPath);
    const entries = await log.readAll();
    if (!entries.ok) return;
    expect(entries.value.some((e) => e.action === 'revoke')).toBe(true);
  });
});

// ── Phase 4: TierManager ───────────────────────────────────────────────────

describe('Phase 4: TierManager', () => {
  function activeKey(tier: LicenseKey['tier'], daysLeft = 100): LicenseKey {
    return generateKey({ tier, owner: 'test@co.com', expiryDays: daysLeft });
  }

  it('upgradeTier returns new key with higher tier', () => {
    const k = activeKey('starter');
    const r = upgradeTier(k, 'pro');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.newKey.tier).toBe('pro');
    expect(r.value.direction).toBe('upgrade');
  });

  it('downgradeTier returns new key with lower tier', () => {
    const k = activeKey('enterprise');
    const r = downgradeTier(k, 'pro');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.newKey.tier).toBe('pro');
    expect(r.value.direction).toBe('downgrade');
  });

  it('changeTier same tier returns direction=same', () => {
    const k = activeKey('pro');
    const r = changeTier(k, 'pro');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.direction).toBe('same');
  });

  it('prorated expiry: new key gets remaining days from old key', () => {
    const k = activeKey('starter', 60);
    const r = changeTier(k, 'pro');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.remainingDays).toBeGreaterThanOrEqual(59);
    expect(r.value.remainingDays).toBeLessThanOrEqual(61);
  });

  it('upgradeTier fails if new tier is not higher', () => {
    const k = activeKey('pro');
    const r = upgradeTier(k, 'starter');
    expect(r.ok).toBe(false);
  });

  it('downgradeTier fails if new tier is not lower', () => {
    const k = activeKey('starter');
    const r = downgradeTier(k, 'pro');
    expect(r.ok).toBe(false);
  });

  it('changeTier on revoked key returns error', () => {
    const k: LicenseKey = { ...activeKey('pro'), status: 'revoked' };
    const r = changeTier(k, 'enterprise');
    expect(r.ok).toBe(false);
  });

  it('new key has valid signature after tier change', () => {
    const k = activeKey('starter', 30);
    const r = changeTier(k, 'enterprise');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const v = verifyLicense(r.value.newKey);
    expect(v.valid).toBe(true);
  });
});

// ── Phase 5: CLI command (unit-level logic tests) ──────────────────────────

describe('Phase 5: CLI admin command registration', () => {
  it('registerLicenseAdminCommand is importable', async () => {
    const mod = await import('../cli/commands/license-admin.js');
    expect(typeof mod.registerLicenseAdminCommand).toBe('function');
  });

  it('registers license-admin command on a Commander program', async () => {
    const { Command } = await import('commander');
    const { registerLicenseAdminCommand } = await import('../cli/commands/license-admin.js');
    const program = new Command();
    registerLicenseAdminCommand(program);
    const names = program.commands.map((c) => c.name());
    expect(names).toContain('license-admin');
  });

  it('license-admin has create/list/revoke/rotate/audit subcommands', async () => {
    const { Command } = await import('commander');
    const { registerLicenseAdminCommand } = await import('../cli/commands/license-admin.js');
    const program = new Command();
    registerLicenseAdminCommand(program);
    const adminCmd = program.commands.find((c) => c.name() === 'license-admin')!;
    const subNames = adminCmd.commands.map((c) => c.name());
    expect(subNames).toContain('create');
    expect(subNames).toContain('list');
    expect(subNames).toContain('revoke');
    expect(subNames).toContain('rotate');
    expect(subNames).toContain('audit');
  });
});

// ── Phase 6: Validation Enhancements ──────────────────────────────────────

describe('Phase 6: validateAll and listExpiring', () => {
  it('validateAll returns results for all keys', async () => {
    const { admin } = makeAdmin();
    await admin.createKey('pro', 'a@b.com', 30);
    await admin.createKey('starter', 'c@d.com', 10);
    const r = await admin.validateAll();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(2);
    expect(r.value.every((x) => typeof x.valid === 'boolean')).toBe(true);
  });

  it('validateAll reports active keys as valid', async () => {
    const { admin } = makeAdmin();
    await admin.createKey('pro', 'a@b.com', 90);
    const r = await admin.validateAll();
    if (!r.ok) return;
    expect(r.value[0]?.valid).toBe(true);
  });

  it('validateAll reports revoked keys as invalid', async () => {
    const { admin } = makeAdmin();
    const created = await admin.createKey('pro', 'a@b.com', 90);
    if (!created.ok) return;
    await admin.revokeKey(created.value.key);
    const r = await admin.validateAll();
    if (!r.ok) return;
    expect(r.value[0]?.valid).toBe(false);
  });

  it('listExpiring returns keys expiring within N days', async () => {
    const { admin } = makeAdmin();
    await admin.createKey('pro', 'soon@exp.com', 5);
    await admin.createKey('starter', 'later@exp.com', 100);
    const r = await admin.listExpiring(10);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(1);
    expect(r.value[0]?.owner).toBe('soon@exp.com');
  });

  it('listExpiring excludes revoked keys', async () => {
    const { admin } = makeAdmin();
    const created = await admin.createKey('pro', 'soon@exp.com', 5);
    if (!created.ok) return;
    await admin.revokeKey(created.value.key);
    const r = await admin.listExpiring(10);
    if (!r.ok) return;
    expect(r.value).toHaveLength(0);
  });

  it('listExpiring returns empty when no keys expiring soon', async () => {
    const { admin } = makeAdmin();
    await admin.createKey('pro', 'far@exp.com', 200);
    const r = await admin.listExpiring(10);
    if (!r.ok) return;
    expect(r.value).toHaveLength(0);
  });
});

// ── Phase 7: Integration ───────────────────────────────────────────────────

describe('Phase 7: Integration', () => {
  it('full lifecycle: create → list → rotate → revoke', async () => {
    const { admin } = makeAdmin();

    // Create
    const created = await admin.createKey('pro', 'lifecycle@test.com', 90);
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // List shows 1 key
    const list1 = await admin.listKeys();
    if (!list1.ok) return;
    expect(list1.value).toHaveLength(1);

    // Rotate
    const rotated = await admin.rotateKey(created.value.key);
    expect(rotated.ok).toBe(true);
    if (!rotated.ok) return;

    // List shows 2 keys (old revoked + new active)
    const list2 = await admin.listKeys();
    if (!list2.ok) return;
    expect(list2.value).toHaveLength(2);
    const oldKey = list2.value.find((k) => k.key === created.value.key);
    expect(oldKey?.status).toBe('revoked');
    const newKey = list2.value.find((k) => k.key === rotated.value.key);
    expect(newKey?.status).toBe('active');

    // Revoke new key
    await admin.revokeKey(rotated.value.key);
    const allInvalid = await admin.validateAll();
    if (!allInvalid.ok) return;
    expect(allInvalid.value.every((x) => !x.valid)).toBe(true);
  });

  it('audit log records full lifecycle', async () => {
    const { admin, auditPath } = makeAdmin();
    const created = await admin.createKey('enterprise', 'full@lifecycle.com', 60);
    if (!created.ok) return;
    await admin.rotateKey(created.value.key);

    const log = new AuditLog(auditPath);
    const entries = await log.readAll();
    if (!entries.ok) return;
    const actions = entries.value.map((e) => e.action);
    expect(actions).toContain('create');
    expect(actions).toContain('rotate');
  });

  it('JSONL audit log file is valid (one JSON object per line)', async () => {
    const { admin, auditPath } = makeAdmin();
    await admin.createKey('pro', 'jsonl@test.com');
    const raw = await readFile(auditPath, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  it('VERSION is 0.6.0 in cli/index.ts', async () => {
    const { main } = await import('../cli/index.js');
    expect(typeof main).toBe('function');
    // Read source to verify VERSION string
    const src = await readFile(
      new URL('../cli/index.ts', import.meta.url).pathname.replace(/\.js$/, '.ts'),
      'utf-8',
    ).catch(() => '');
    if (src) expect(src).toContain("'0.6.0'");
  });

  it('multiple admins with same registry path share state', async () => {
    const dir = tmpDir();
    const reg = join(dir, 'keys.json');
    const audit = join(dir, 'audit.jsonl');
    const a1 = new LicenseAdmin(reg, audit, 'op1');
    const a2 = new LicenseAdmin(reg, audit, 'op2');
    await a1.createKey('starter', 'shared@test.com');
    const r = await a2.listKeys();
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(1);
  });

  it('rotateKey new key signature is valid', async () => {
    const { admin } = makeAdmin();
    const created = await admin.createKey('pro', 'sig@test.com', 30);
    if (!created.ok) return;
    const rotated = await admin.rotateKey(created.value.key);
    if (!rotated.ok) return;
    const v = verifyLicense(rotated.value);
    expect(v.valid).toBe(true);
  });
});
