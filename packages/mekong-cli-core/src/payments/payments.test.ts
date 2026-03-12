/**
 * payments.test.ts — comprehensive tests for v0.6 Payment Webhook module.
 * Covers all 7 phases: types, verifier, handler, subscription, receipt-store,
 * polar-client, and integration wiring.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';

// Static imports — no top-level await
import { resolveTierFromProduct } from './types.js';
import { verifyWebhookSignature, parseWebhookPayload } from './webhook-verifier.js';
import { ReceiptStore } from './receipt-store.js';
import { SubscriptionManager } from './subscription.js';
import { WebhookHandler } from './webhook-handler.js';
import { PolarClient, createPolarClientFromEnv } from './polar-client.js';
import { ConfigSchema } from '../types/config.js';
import { DEFAULT_CONFIG } from '../config/defaults.js';
import type { WebhookEvent, PolarCheckout, PolarSubscription } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Phase 1: Types ─────────────────────────────────────────────────────────────

describe('Phase 1 — types', () => {
  afterEach(() => {
    delete process.env['POLAR_PRODUCT_MAP'];
  });

  it('resolveTierFromProduct uses env override', () => {
    process.env['POLAR_PRODUCT_MAP'] = JSON.stringify({ prod_ent: 'enterprise' });
    expect(resolveTierFromProduct('prod_ent')).toBe('enterprise');
  });

  it('resolveTierFromProduct infers from name — pro', () => {
    expect(resolveTierFromProduct('prod_pro_monthly')).toBe('pro');
  });

  it('resolveTierFromProduct infers from name — enterprise', () => {
    expect(resolveTierFromProduct('prod_enterprise_annual')).toBe('enterprise');
  });

  it('resolveTierFromProduct infers from name — starter', () => {
    expect(resolveTierFromProduct('prod_starter_monthly')).toBe('starter');
  });

  it('resolveTierFromProduct defaults to starter for unknown product', () => {
    expect(resolveTierFromProduct('prod_unknown_xyz')).toBe('starter');
  });

  it('resolveTierFromProduct handles malformed env JSON gracefully', () => {
    process.env['POLAR_PRODUCT_MAP'] = '{bad json';
    expect(() => resolveTierFromProduct('prod_pro')).not.toThrow();
  });
});

// ── Phase 1: WebhookVerifier ───────────────────────────────────────────────────

describe('Phase 1 — webhook-verifier', () => {
  const secret = 'test-secret-key';

  function signStandard(body: string, webhookId: string, timestamp: string): string {
    const content = `${webhookId}.${timestamp}.${body}`;
    const hex = createHmac('sha256', secret).update(content).digest('hex');
    return `v1,${hex}`;
  }

  it('verifies valid Standard Webhooks signature', () => {
    const body = JSON.stringify({ type: 'checkout.completed', id: 'evt_1' });
    const id = 'msg_1';
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = signStandard(body, id, ts);

    const result = verifyWebhookSignature({ rawBody: body, signature: sig, secret, webhookId: id, timestamp: ts });
    expect(result.ok).toBe(true);
  });

  it('rejects wrong signature', () => {
    const body = JSON.stringify({ type: 'checkout.completed', id: 'evt_2' });
    const id = 'msg_2';
    const ts = String(Math.floor(Date.now() / 1000));

    const result = verifyWebhookSignature({ rawBody: body, signature: 'v1,badhex00', secret, webhookId: id, timestamp: ts });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('verification failed');
  });

  it('rejects expired timestamp (> 300s)', () => {
    const body = '{}';
    const id = 'msg_3';
    const oldTs = String(Math.floor(Date.now() / 1000) - 400);
    const sig = signStandard(body, id, oldTs);

    const result = verifyWebhookSignature({ rawBody: body, signature: sig, secret, webhookId: id, timestamp: oldTs });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('too old');
  });

  it('accepts custom maxAgeSeconds', () => {
    const body = '{}';
    const id = 'msg_4';
    const ts = String(Math.floor(Date.now() / 1000) - 200);
    const sig = signStandard(body, id, ts);

    const result = verifyWebhookSignature({ rawBody: body, signature: sig, secret, webhookId: id, timestamp: ts, maxAgeSeconds: 500 });
    expect(result.ok).toBe(true);
  });

  it('rejects missing signature', () => {
    const result = verifyWebhookSignature({ rawBody: '{}', signature: '', secret });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('Missing');
  });

  it('rejects missing secret', () => {
    const result = verifyWebhookSignature({ rawBody: '{}', signature: 'v1,abc', secret: '' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('secret not configured');
  });

  it('verifies legacy HMAC (no webhookId/timestamp)', () => {
    const body = JSON.stringify({ type: 'order.created' });
    const hex = createHmac('sha256', secret).update(body).digest('hex');
    const sig = `v1,${hex}`;

    const result = verifyWebhookSignature({ rawBody: body, signature: sig, secret });
    expect(result.ok).toBe(true);
  });

  it('verifies with Buffer rawBody', () => {
    const body = '{"type":"checkout.completed","id":"evt_buf"}';
    const id = 'msg_buf';
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = signStandard(body, id, ts);

    const result = verifyWebhookSignature({ rawBody: Buffer.from(body), signature: sig, secret, webhookId: id, timestamp: ts });
    expect(result.ok).toBe(true);
  });

  it('parseWebhookPayload parses valid JSON', () => {
    const payload = JSON.stringify({ type: 'checkout.completed', id: 'evt_1', created_at: new Date().toISOString(), data: {} });
    const result = parseWebhookPayload(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.type).toBe('checkout.completed');
  });

  it('parseWebhookPayload rejects invalid JSON', () => {
    const result = parseWebhookPayload('{bad json');
    expect(result.ok).toBe(false);
  });

  it('parseWebhookPayload rejects missing type', () => {
    const result = parseWebhookPayload(JSON.stringify({ id: 'evt_1' }));
    expect(result.ok).toBe(false);
  });
});

// ── Phase 4: ReceiptStore ──────────────────────────────────────────────────────

describe('Phase 4 — receipt-store', () => {
  let tmpDir: string;
  let storePath: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'receipts-'));
    storePath = join(tmpDir, 'receipts.jsonl');
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  function makeEvent(id: string, overrides: Partial<WebhookEvent> = {}): WebhookEvent {
    return {
      id,
      type: 'checkout.completed',
      receivedAt: new Date().toISOString(),
      processed: true,
      customerId: 'cust_001',
      ...overrides,
    };
  }

  it('appends and reads events', async () => {
    const store = new ReceiptStore(storePath);
    await store.append(makeEvent('evt_1'));
    await store.append(makeEvent('evt_2'));
    const result = await store.readAll();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(2);
  });

  it('returns empty array when file missing', async () => {
    const store = new ReceiptStore(join(tmpDir, 'nonexistent.jsonl'));
    const result = await store.readAll();
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(0);
  });

  it('hasEvent returns true for existing event', async () => {
    const store = new ReceiptStore(storePath);
    await store.append(makeEvent('evt_dedup'));
    expect(await store.hasEvent('evt_dedup')).toBe(true);
  });

  it('hasEvent returns false for missing event', async () => {
    const store = new ReceiptStore(storePath);
    expect(await store.hasEvent('evt_missing')).toBe(false);
  });

  it('findByCustomer filters correctly', async () => {
    const store = new ReceiptStore(storePath);
    await store.append(makeEvent('evt_a', { customerId: 'cust_A' }));
    await store.append(makeEvent('evt_b', { customerId: 'cust_B' }));
    const result = await store.findByCustomer('cust_A');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]!.id).toBe('evt_a');
    }
  });

  it('findByDateRange filters by date', async () => {
    const store = new ReceiptStore(storePath);
    const old = makeEvent('evt_old', { receivedAt: '2024-01-01T00:00:00Z' });
    const recent = makeEvent('evt_new', { receivedAt: '2025-06-01T00:00:00Z' });
    await store.append(old);
    await store.append(recent);
    const result = await store.findByDateRange('2025-01-01T00:00:00Z', '2026-01-01T00:00:00Z');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]!.id).toBe('evt_new');
    }
  });

  it('findByType filters by event type', async () => {
    const store = new ReceiptStore(storePath);
    await store.append(makeEvent('evt_co', { type: 'checkout.completed' }));
    await store.append(makeEvent('evt_su', { type: 'subscription.canceled' }));
    const result = await store.findByType('checkout.completed');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });
});

// ── Phase 3: SubscriptionManager ──────────────────────────────────────────────

describe('Phase 3 — subscription-manager', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'sub-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  function makeManager() {
    return new SubscriptionManager(
      join(tmpDir, 'keys.json'),
      join(tmpDir, 'audit.jsonl'),
    );
  }

  function makeCheckout(overrides: Partial<PolarCheckout> = {}): PolarCheckout {
    return {
      id: 'chk_001',
      status: 'succeeded',
      customer_email: 'user@example.com',
      customer_id: 'cust_001',
      product_id: 'prod_starter_monthly',
      amount: 4900,
      currency: 'usd',
      ...overrides,
    };
  }

  function makeSub(overrides: Partial<PolarSubscription> = {}): PolarSubscription {
    return {
      id: 'sub_001',
      status: 'active',
      customer_id: 'cust_001',
      customer_email: 'user@example.com',
      product_id: 'prod_starter_monthly',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      ...overrides,
    };
  }

  it('handleCheckout creates a license key for starter tier', async () => {
    const mgr = makeManager();
    const result = await mgr.handleCheckout(makeCheckout());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tier).toBe('starter');
      expect(result.value.owner).toBe('user@example.com');
      expect(result.value.status).toBe('active');
    }
  });

  it('handleCheckout resolves pro tier from product ID', async () => {
    const mgr = makeManager();
    const result = await mgr.handleCheckout(makeCheckout({ product_id: 'prod_pro_annual', customer_email: 'pro@example.com' }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tier).toBe('pro');
  });

  it('handleCheckout uses custom expiry_days from metadata', async () => {
    const mgr = makeManager();
    const result = await mgr.handleCheckout(makeCheckout({ metadata: { expiry_days: '30' } }));
    expect(result.ok).toBe(true);
  });

  it('handleCancel revokes active license', async () => {
    const mgr = makeManager();
    await mgr.handleCheckout(makeCheckout({ customer_email: 'cancel@example.com' }));

    const result = await mgr.handleCancel(makeSub({ customer_email: 'cancel@example.com', status: 'canceled' }));
    expect(result.ok).toBe(true);
  });

  it('handleCancel returns error when no active license found', async () => {
    const mgr = makeManager();
    const result = await mgr.handleCancel(makeSub({ customer_email: 'ghost@example.com', customer_id: 'ghost' }));
    expect(result.ok).toBe(false);
  });

  it('getSubscription returns null for unknown customer', async () => {
    const mgr = makeManager();
    const result = await mgr.getSubscription('nobody@example.com');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBeNull();
  });

  it('getSubscription returns active record after checkout', async () => {
    const mgr = makeManager();
    await mgr.handleCheckout(makeCheckout({ customer_email: 'query@example.com', product_id: 'prod_pro_monthly' }));
    const result = await mgr.getSubscription('query@example.com');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).not.toBeNull();
      expect(result.value!.status).toBe('active');
      expect(result.value!.tier).toBe('pro');
    }
  });

  it('buildCheckoutEvent produces correct shape on success', () => {
    const checkout = makeCheckout({ customer_email: 'e@x.com', product_id: 'prod_starter' });
    const event = SubscriptionManager.buildCheckoutEvent('evt_ok', checkout);
    expect(event.id).toBe('evt_ok');
    expect(event.type).toBe('checkout.completed');
    expect(event.processed).toBe(true);
    expect(event.error).toBeUndefined();
  });

  it('buildCheckoutEvent marks processed=false on error', () => {
    const checkout = makeCheckout();
    const event = SubscriptionManager.buildCheckoutEvent('evt_err', checkout, undefined, 'some error');
    expect(event.processed).toBe(false);
    expect(event.error).toBe('some error');
  });
});

// ── Phase 2: WebhookHandler ────────────────────────────────────────────────────

describe('Phase 2 — webhook-handler', () => {
  let tmpDir: string;
  const secret = 'handler-test-secret';

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'handler-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  function makeHandler() {
    return new WebhookHandler({
      secret,
      registryPath: join(tmpDir, 'keys.json'),
      auditLogPath: join(tmpDir, 'audit.jsonl'),
      receiptStorePath: join(tmpDir, 'receipts.jsonl'),
    });
  }

  function sign(body: string, webhookId: string, timestamp: string): string {
    const content = `${webhookId}.${timestamp}.${body}`;
    const hex = createHmac('sha256', secret).update(content).digest('hex');
    return `v1,${hex}`;
  }

  function makeCheckoutPayload(email = 'user@example.com', productId = 'prod_starter_monthly'): string {
    return JSON.stringify({
      type: 'checkout.completed',
      id: `evt_${Date.now()}`,
      created_at: new Date().toISOString(),
      data: {
        id: `chk_${Date.now()}`,
        status: 'succeeded',
        customer_email: email,
        customer_id: `cust_${Math.random().toString(36).slice(2)}`,
        product_id: productId,
        amount: 4900,
        currency: 'usd',
      },
    });
  }

  it('processes checkout.completed and creates license', async () => {
    const handler = makeHandler();
    const body = makeCheckoutPayload();
    const id = `msg_${Date.now()}`;
    const ts = String(Math.floor(Date.now() / 1000));

    const result = await handler.process({ rawBody: body, signature: sign(body, id, ts), webhookId: id, timestamp: ts });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.processed).toBe(true);
      expect(result.value.licenseKey).toBeDefined();
      expect(result.value.tier).toBe('starter');
    }
  });

  it('rejects invalid signature', async () => {
    const handler = makeHandler();
    const body = makeCheckoutPayload();
    const result = await handler.process({
      rawBody: body,
      signature: 'v1,badsignature00000000000000000000000000000000000000000000000000000000',
      webhookId: 'msg_bad',
      timestamp: String(Math.floor(Date.now() / 1000)),
    });
    expect(result.ok).toBe(false);
  });

  it('deduplicates duplicate event IDs', async () => {
    const handler = makeHandler();
    const body = makeCheckoutPayload('dedup@example.com');
    const id = `msg_dedup_${Date.now()}`;
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign(body, id, ts);

    await handler.process({ rawBody: body, signature: sig, webhookId: id, timestamp: ts });
    const second = await handler.process({ rawBody: body, signature: sig, webhookId: id, timestamp: ts });

    expect(second.ok).toBe(true);
    if (second.ok) expect(second.value.error).toBe('duplicate');
  });

  it('acks unhandled event types gracefully', async () => {
    const handler = makeHandler();
    const body = JSON.stringify({
      type: 'order.created',
      id: `evt_order_${Date.now()}`,
      created_at: new Date().toISOString(),
      data: {},
    });
    const id = `msg_order_${Date.now()}`;
    const ts = String(Math.floor(Date.now() / 1000));

    const result = await handler.process({ rawBody: body, signature: sign(body, id, ts), webhookId: id, timestamp: ts });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.processed).toBe(true);
  });

  it('persists receipt after processing', async () => {
    const handler = makeHandler();
    const body = makeCheckoutPayload('persist@example.com');
    const id = `msg_persist_${Date.now()}`;
    const ts = String(Math.floor(Date.now() / 1000));

    await handler.process({ rawBody: body, signature: sign(body, id, ts), webhookId: id, timestamp: ts });

    const all = await handler.getReceiptStore().readAll();
    expect(all.ok).toBe(true);
    if (all.ok) expect(all.value.length).toBeGreaterThan(0);
  });

  it('exposes getSubscriptionManager', () => {
    expect(makeHandler().getSubscriptionManager()).toBeDefined();
  });

  it('processes subscription.updated event', async () => {
    const handler = makeHandler();

    // First create via checkout
    const coBody = makeCheckoutPayload('update@example.com', 'prod_starter_monthly');
    const coId = `msg_co_${Date.now()}`;
    const coTs = String(Math.floor(Date.now() / 1000));
    await handler.process({ rawBody: coBody, signature: sign(coBody, coId, coTs), webhookId: coId, timestamp: coTs });

    // Then update to pro
    const upBody = JSON.stringify({
      type: 'subscription.updated',
      id: `evt_up_${Date.now()}`,
      created_at: new Date().toISOString(),
      data: {
        id: `sub_${Date.now()}`,
        status: 'active',
        customer_id: 'cust_update',
        customer_email: 'update@example.com',
        product_id: 'prod_pro_monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      },
    });
    const upId = `msg_up_${Date.now()}`;
    const upTs = String(Math.floor(Date.now() / 1000));
    const upResult = await handler.process({ rawBody: upBody, signature: sign(upBody, upId, upTs), webhookId: upId, timestamp: upTs });

    expect(upResult.ok).toBe(true);
  });
});

// ── Phase 5: PolarClient ───────────────────────────────────────────────────────

describe('Phase 5 — polar-client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env['POLAR_API_KEY'];
  });

  it('createPolarClientFromEnv returns error without POLAR_API_KEY', () => {
    delete process.env['POLAR_API_KEY'];
    const result = createPolarClientFromEnv();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('POLAR_API_KEY');
  });

  it('createPolarClientFromEnv succeeds when key set', () => {
    process.env['POLAR_API_KEY'] = 'test_key';
    const result = createPolarClientFromEnv();
    expect(result.ok).toBe(true);
  });

  it('checkSubscription returns active: false for empty items', async () => {
    const client = new PolarClient({ apiKey: 'test', baseUrl: 'http://localhost:19999' });
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      json: async () => ({ items: [], pagination: {} }),
      status: 200,
      headers: { get: () => null },
    }));

    const result = await client.checkSubscription('cust_001');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.active).toBe(false);
  });

  it('checkSubscription returns active: true with subscription', async () => {
    const client = new PolarClient({ apiKey: 'test', baseUrl: 'http://localhost:19999' });
    const fakeSub = {
      id: 'sub_001', status: 'active', customer_id: 'cust_001', product_id: 'prod_pro',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 86_400_000).toISOString(),
    };
    vi.stubGlobal('fetch', async () => ({
      ok: true, json: async () => ({ items: [fakeSub], pagination: {} }),
      status: 200, headers: { get: () => null },
    }));

    const result = await client.checkSubscription('cust_001');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.active).toBe(true);
      expect(result.value.subscription?.id).toBe('sub_001');
    }
  });

  it('listProducts returns product array', async () => {
    const client = new PolarClient({ apiKey: 'test', baseUrl: 'http://localhost:19999' });
    vi.stubGlobal('fetch', async () => ({
      ok: true,
      json: async () => ({ items: [{ id: 'prod_001', name: 'Starter', price_amount: 4900, price_currency: 'usd' }], pagination: {} }),
      status: 200, headers: { get: () => null },
    }));

    const result = await client.listProducts();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]!.name).toBe('Starter');
    }
  });

  it('returns error on API 403 status', async () => {
    const client = new PolarClient({ apiKey: 'test', baseUrl: 'http://localhost:19999', maxRetries: 0 });
    vi.stubGlobal('fetch', async () => ({
      ok: false, status: 403, text: async () => 'Forbidden',
      headers: { get: () => null },
    }));

    const result = await client.listProducts();
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toContain('403');
  });

  it('retries on 429 and succeeds on second attempt', async () => {
    const client = new PolarClient({ apiKey: 'test', baseUrl: 'http://localhost:19999', maxRetries: 2 });
    let calls = 0;
    vi.stubGlobal('fetch', async () => {
      calls++;
      if (calls < 2) {
        return { ok: false, status: 429, text: async () => 'rate limited', headers: { get: () => '0' } };
      }
      return { ok: true, json: async () => ({ items: [], pagination: {} }), status: 200, headers: { get: () => null } };
    });

    const result = await client.listProducts();
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it('getSubscription fetches single subscription', async () => {
    const client = new PolarClient({ apiKey: 'test', baseUrl: 'http://localhost:19999' });
    const fakeSub = { id: 'sub_direct', status: 'active', customer_id: 'cust_x', product_id: 'prod_pro',
      current_period_start: new Date().toISOString(), current_period_end: new Date().toISOString() };
    vi.stubGlobal('fetch', async () => ({
      ok: true, json: async () => fakeSub, status: 200, headers: { get: () => null },
    }));

    const result = await client.getSubscription('sub_direct');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.id).toBe('sub_direct');
  });
});

// ── Phase 7: Integration — end-to-end ─────────────────────────────────────────

describe('Phase 7 — integration end-to-end', () => {
  let tmpDir: string;
  const secret = 'integration-secret';

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'e2e-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  function makeHandler() {
    return new WebhookHandler({
      secret,
      registryPath: join(tmpDir, 'keys.json'),
      auditLogPath: join(tmpDir, 'audit.jsonl'),
      receiptStorePath: join(tmpDir, 'receipts.jsonl'),
    });
  }

  function sign(body: string, id: string, ts: string): string {
    const content = `${id}.${ts}.${body}`;
    const hex = createHmac('sha256', secret).update(content).digest('hex');
    return `v1,${hex}`;
  }

  it('payment → webhook → license created → receipt stored', async () => {
    const handler = makeHandler();
    const body = JSON.stringify({
      type: 'checkout.completed',
      id: 'evt_e2e_001',
      created_at: new Date().toISOString(),
      data: {
        id: 'chk_e2e_001', status: 'succeeded',
        customer_email: 'e2e@example.com', customer_id: 'cust_e2e',
        product_id: 'prod_pro_monthly', amount: 9900, currency: 'usd',
      },
    });
    const id = 'msg_e2e_001';
    const ts = String(Math.floor(Date.now() / 1000));

    const result = await handler.process({ rawBody: body, signature: sign(body, id, ts), webhookId: id, timestamp: ts });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tier).toBe('pro');
      expect(result.value.licenseKey).toMatch(/^RAAS-/);
    }

    const store = new ReceiptStore(join(tmpDir, 'receipts.jsonl'));
    const receipts = await store.readAll();
    expect(receipts.ok).toBe(true);
    if (receipts.ok) {
      expect(receipts.value).toHaveLength(1);
      expect(receipts.value[0]!.id).toBe('msg_e2e_001');
    }
  });

  it('checkout → cancel → subscription status is canceled', async () => {
    const handler = makeHandler();

    const coBody = JSON.stringify({
      type: 'checkout.completed', id: 'evt_co_c',
      created_at: new Date().toISOString(),
      data: {
        id: 'chk_c', status: 'succeeded',
        customer_email: 'cancel.flow@example.com', customer_id: 'cust_cf',
        product_id: 'prod_starter', amount: 4900, currency: 'usd',
      },
    });
    const coId = 'msg_co_c';
    const coTs = String(Math.floor(Date.now() / 1000));
    await handler.process({ rawBody: coBody, signature: sign(coBody, coId, coTs), webhookId: coId, timestamp: coTs });

    const cancelBody = JSON.stringify({
      type: 'subscription.canceled', id: 'evt_sub_c',
      created_at: new Date().toISOString(),
      data: {
        id: 'sub_c', status: 'canceled',
        customer_id: 'cust_cf', customer_email: 'cancel.flow@example.com',
        product_id: 'prod_starter',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 86_400_000).toISOString(),
      },
    });
    const cancelId = 'msg_sub_c';
    const cancelTs = String(Math.floor(Date.now() / 1000));
    const cancelResult = await handler.process({ rawBody: cancelBody, signature: sign(cancelBody, cancelId, cancelTs), webhookId: cancelId, timestamp: cancelTs });

    expect(cancelResult.ok).toBe(true);

    const sub = await handler.getSubscriptionManager().getSubscription('cancel.flow@example.com');
    expect(sub.ok).toBe(true);
    if (sub.ok && sub.value) expect(sub.value.status).toBe('canceled');
  });

  it('idempotent: duplicate webhook stores both but only one is not-duplicate', async () => {
    const handler = makeHandler();
    const body = JSON.stringify({
      type: 'checkout.completed', id: 'evt_idem',
      created_at: new Date().toISOString(),
      data: {
        id: 'chk_idem', status: 'succeeded',
        customer_email: 'idem@example.com', customer_id: 'cust_idem',
        product_id: 'prod_starter', amount: 4900, currency: 'usd',
      },
    });
    const id = 'msg_idem';
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = sign(body, id, ts);

    await handler.process({ rawBody: body, signature: sig, webhookId: id, timestamp: ts });
    const second = await handler.process({ rawBody: body, signature: sig, webhookId: id, timestamp: ts });

    expect(second.ok).toBe(true);
    if (second.ok) expect(second.value.error).toBe('duplicate');
  });

  it('config schema includes payments section with defaults', () => {
    const parsed = ConfigSchema.parse({});
    expect(parsed.payments).toBeDefined();
    expect(parsed.payments.polar_api_key_env).toBe('POLAR_API_KEY');
    expect(parsed.payments.polar_webhook_secret_env).toBe('POLAR_WEBHOOK_SECRET');
    expect(parsed.payments.product_tier_map).toEqual({});
  });

  it('DEFAULT_CONFIG includes payments section', () => {
    expect(DEFAULT_CONFIG.payments).toBeDefined();
    expect(DEFAULT_CONFIG.payments.polar_api_key_env).toBe('POLAR_API_KEY');
    expect(DEFAULT_CONFIG.payments.receipt_store_path).toContain('receipts.jsonl');
  });

  it('VERSION bumped to 0.6.0 in cli/index.ts', async () => {
    const indexPath = join(__dirname, '..', 'cli', 'index.ts');
    const content = await readFile(indexPath, 'utf-8');
    expect(content).toContain("'0.6.0'");
  });
});
