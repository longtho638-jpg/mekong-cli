/**
 * integration-e2e-payment-metering.test.ts
 * Flow 2: Payment → License | Flow 3: Metering Pipeline
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

import type { UsageEvent } from '../metering/types.js';
import {
  WEBHOOK_SECRET,
  signWebhook,
  checkoutBody,
  makeWebhookHandler,
  makeMeteringStack,
} from './e2e-test-helpers.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'mekong-pay-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ── Flow 2: Payment → License ─────────────────────────────────────────────────

describe('Flow 2 — Payment to License', () => {
  it('checkout.completed creates pro license with correct tier', async () => {
    const handler = makeWebhookHandler(tmpDir);
    const evtId = `evt_${randomUUID()}`;
    const body = checkoutBody('dave@example.com', 'prod_pro_monthly', evtId);
    const ts = String(Math.floor(Date.now() / 1000));
    const msgId = `msg_${randomUUID()}`;

    const result = await handler.process({
      rawBody: body,
      signature: signWebhook(body, msgId, ts),
      webhookId: msgId,
      timestamp: ts,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.processed).toBe(true);
    expect(result.value.tier).toBe('pro');
    expect(result.value.licenseKey).toMatch(/^RAAS-PRO-/);
  });

  it('checkout.completed creates starter license and subscription is active', async () => {
    const handler = makeWebhookHandler(tmpDir);
    const evtId = `evt_${randomUUID()}`;
    const body = checkoutBody('eve@example.com', 'prod_starter_monthly', evtId);
    const ts = String(Math.floor(Date.now() / 1000));
    const msgId = `msg_${randomUUID()}`;

    const result = await handler.process({
      rawBody: body,
      signature: signWebhook(body, msgId, ts),
      webhookId: msgId,
      timestamp: ts,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.tier).toBe('starter');
    expect(result.value.licenseKey).toMatch(/^RAAS-STARTER-/);

    const sub = await handler.getSubscriptionManager().getSubscription('eve@example.com');
    expect(sub.ok).toBe(true);
    if (!sub.ok || !sub.value) return;
    expect(sub.value.status).toBe('active');
    expect(sub.value.tier).toBe('starter');
  });

  it('enterprise checkout persists receipt with correct tier', async () => {
    const handler = makeWebhookHandler(tmpDir);
    const evtId = `evt_${randomUUID()}`;
    const body = checkoutBody('frank@example.com', 'prod_enterprise_annual', evtId);
    const ts = String(Math.floor(Date.now() / 1000));
    const msgId = `msg_${randomUUID()}`;

    await handler.process({
      rawBody: body,
      signature: signWebhook(body, msgId, ts),
      webhookId: msgId,
      timestamp: ts,
    });

    const receipts = await handler.getReceiptStore().readAll();
    expect(receipts.ok).toBe(true);
    if (!receipts.ok) return;
    const found = receipts.value.find((r) => r.id === msgId);
    expect(found).toBeDefined();
    expect(found?.tier).toBe('enterprise');
  });

  it('duplicate webhook event is deduped (idempotent)', async () => {
    const handler = makeWebhookHandler(tmpDir);
    const evtId = `evt_${randomUUID()}`;
    const body = checkoutBody('grace@example.com', 'prod_pro_monthly', evtId);
    const ts = String(Math.floor(Date.now() / 1000));
    const msgId = `msg_${randomUUID()}`;
    const sig = signWebhook(body, msgId, ts);
    const opts = { rawBody: body, signature: sig, webhookId: msgId, timestamp: ts };

    await handler.process(opts);
    const second = await handler.process(opts);

    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.error).toBe('duplicate');
  });
});

// ── Flow 3: Metering Pipeline ─────────────────────────────────────────────────

describe('Flow 3 — Metering Pipeline', () => {
  it('record LLM/tool/SOP events → flush → query → verify counts', async () => {
    const { store, collector } = makeMeteringStack(tmpDir);

    collector.recordLlmCall({ provider: 'anthropic', model: 'claude-sonnet-4', inputTokens: 500, outputTokens: 200, estimatedCost: 0.005 });
    collector.recordLlmCall({ provider: 'openai', model: 'gpt-4o', inputTokens: 1000, outputTokens: 300, estimatedCost: 0.006 });
    collector.recordToolRun({ name: 'bash', durationMs: 50 });
    collector.recordSopRun({ name: 'deploy', success: true });

    expect(collector.bufferSize).toBe(4);
    await collector.flush();
    expect(collector.bufferSize).toBe(0);

    const today = await store.readToday();
    expect(today.ok).toBe(true);
    if (!today.ok) return;
    expect(today.value.filter((e) => e.category === 'llm_call')).toHaveLength(2);
    expect(today.value.filter((e) => e.category === 'tool_run')).toHaveLength(1);
    expect(today.value.filter((e) => e.category === 'sop_run')).toHaveLength(1);

    await collector.shutdown();
  });

  it('free tier LLM blocked at 10 daily calls', async () => {
    const { store, limiter } = makeMeteringStack(tmpDir);
    const today = new Date().toISOString().slice(0, 10);
    const batch: UsageEvent[] = Array.from({ length: 10 }, () => ({
      id: randomUUID(),
      category: 'llm_call' as const,
      timestamp: `${today}T10:00:00.000Z`,
    }));
    await store.appendBatch(batch);
    limiter.invalidateCache();

    const result = await limiter.checkLimit('llm_call', 'free');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.allowed).toBe(false);
    expect(result.value.used).toBe(10);
    expect(result.value.limit).toBe(10);
  });

  it('pro tier allows 1000 LLM calls per day (fresh store)', async () => {
    const { limiter } = makeMeteringStack(tmpDir);
    const result = await limiter.checkLimit('llm_call', 'pro');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.allowed).toBe(true);
    expect(result.value.limit).toBe(1000);
    expect(result.value.remaining).toBe(1000);
  });

  it('enterprise tier always unlimited', async () => {
    const { limiter } = makeMeteringStack(tmpDir);
    const result = await limiter.checkLimit('llm_call', 'enterprise');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.allowed).toBe(true);
    expect(result.value.limit).toBe(-1);
  });
});
