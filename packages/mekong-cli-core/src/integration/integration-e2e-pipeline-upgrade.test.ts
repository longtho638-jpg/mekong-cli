/**
 * integration-e2e-pipeline-upgrade.test.ts
 * Flow 4: Full Pipeline (license→usage→limits→ROI) | Flow 5: Tier Upgrade
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';

import { ROICalculator, currentMonthPeriod } from '../analytics/roi-calculator.js';
import {
  signWebhook,
  checkoutBody,
  subUpdateBody,
  makeWebhookHandler,
  makeMeteringStack,
} from './e2e-test-helpers.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await mkdtemp(join(tmpdir(), 'mekong-pipe-'));
});

afterEach(async () => {
  await rm(tmpDir, { recursive: true, force: true });
});

// ── Flow 4: Full Pipeline ─────────────────────────────────────────────────────

describe('Flow 4 — Full Pipeline', () => {
  it('create license → record usage → check limits → calculate ROI', async () => {
    // 1. Create license via webhook (pro tier)
    const handler = makeWebhookHandler(tmpDir);
    const evtId = `evt_${randomUUID()}`;
    const body = checkoutBody('henry@example.com', 'prod_pro_monthly', evtId);
    const ts = String(Math.floor(Date.now() / 1000));
    const msgId = `msg_${randomUUID()}`;

    const webhookResult = await handler.process({
      rawBody: body,
      signature: signWebhook(body, msgId, ts),
      webhookId: msgId,
      timestamp: ts,
    });
    expect(webhookResult.ok).toBe(true);
    expect(webhookResult.ok && webhookResult.value.tier).toBe('pro');

    // 2. Record usage events
    const { store, collector, limiter } = makeMeteringStack(tmpDir);
    collector.recordLlmCall({ provider: 'anthropic', model: 'claude-sonnet-4', inputTokens: 1000, outputTokens: 500, estimatedCost: 0.01 });
    collector.recordToolRun({ name: 'bash', durationMs: 100 });
    collector.recordSopRun({ name: 'ci-deploy', success: true });
    await collector.flush();

    // 3. Check limits — pro tier: 1000 LLM, 5000 tools, 500 SOPs
    limiter.invalidateCache();

    const llmCheck = await limiter.checkLimit('llm_call', 'pro');
    expect(llmCheck.ok && llmCheck.value.allowed).toBe(true);
    expect(llmCheck.ok && llmCheck.value.remaining).toBe(999);

    const toolCheck = await limiter.checkLimit('tool_run', 'pro');
    expect(toolCheck.ok && toolCheck.value.allowed).toBe(true);
    expect(toolCheck.ok && toolCheck.value.remaining).toBe(4999);

    // 4. Calculate ROI from usage session
    const calc = new ROICalculator();
    const period = currentMonthPeriod();
    const roi = calc.calculate({
      timeSavedHours: 8,
      hourlyRate: 100,
      revenueGenerated: 500,
      totalCost: 0.01,
      period,
    });
    expect(roi.ok).toBe(true);
    expect(roi.ok && roi.value.roiPercent).toBeGreaterThan(0);
    expect(roi.ok && roi.value.timeSavedValue).toBe(800);
    expect(roi.ok && roi.value.netValue).toBeCloseTo(1299.99);

    await collector.shutdown();
  });

  it('ROI with zero cost returns 9999% (cost-free)', () => {
    const calc = new ROICalculator();
    const roi = calc.calculate({ timeSavedHours: 5, hourlyRate: 80, revenueGenerated: 200, totalCost: 0, period: currentMonthPeriod() });
    expect(roi.ok && roi.value.roiPercent).toBe(9999);
  });

  it('ROI rejects negative timeSavedHours', () => {
    const calc = new ROICalculator();
    const roi = calc.calculate({ timeSavedHours: -1, hourlyRate: 100, revenueGenerated: 0, totalCost: 10, period: currentMonthPeriod() });
    expect(roi.ok).toBe(false);
  });
});

// ── Flow 5: Tier Upgrade ──────────────────────────────────────────────────────

describe('Flow 5 — Tier Upgrade', () => {
  it('starter → pro via subscription.updated → limits expand', async () => {
    const handler = makeWebhookHandler(tmpDir);

    // 1. Initial checkout: starter
    const evtId1 = `evt_${randomUUID()}`;
    const body1 = checkoutBody('iris@example.com', 'prod_starter_monthly', evtId1);
    const ts1 = String(Math.floor(Date.now() / 1000));
    const msg1 = `msg_${randomUUID()}`;
    const r1 = await handler.process({ rawBody: body1, signature: signWebhook(body1, msg1, ts1), webhookId: msg1, timestamp: ts1 });
    expect(r1.ok && r1.value.tier).toBe('starter');

    const sub1 = await handler.getSubscriptionManager().getSubscription('iris@example.com');
    expect(sub1.ok && sub1.value?.tier).toBe('starter');

    // 2. Upgrade via subscription.updated to pro
    const evtId2 = `evt_${randomUUID()}`;
    const body2 = subUpdateBody('iris@example.com', 'prod_pro_monthly', evtId2);
    const ts2 = String(Math.floor(Date.now() / 1000));
    const msg2 = `msg_${randomUUID()}`;
    const r2 = await handler.process({ rawBody: body2, signature: signWebhook(body2, msg2, ts2), webhookId: msg2, timestamp: ts2 });
    expect(r2.ok && r2.value.tier).toBe('pro');

    // 3. Pro limits (1000) > starter limits (100)
    const { limiter } = makeMeteringStack(tmpDir);
    const proCheck = await limiter.checkLimit('llm_call', 'pro');
    const starterCheck = await limiter.checkLimit('llm_call', 'starter');
    expect(proCheck.ok && proCheck.value.limit).toBe(1000);
    expect(starterCheck.ok && starterCheck.value.limit).toBe(100);
  });

  it('subscription.canceled revokes license → status becomes canceled', async () => {
    const handler = makeWebhookHandler(tmpDir);

    // Create license
    const evtId = `evt_${randomUUID()}`;
    const body = checkoutBody('jack@example.com', 'prod_pro_monthly', evtId);
    const ts1 = String(Math.floor(Date.now() / 1000));
    const msg1 = `msg_${randomUUID()}`;
    await handler.process({ rawBody: body, signature: signWebhook(body, msg1, ts1), webhookId: msg1, timestamp: ts1 });

    // Cancel
    const cancelBody = JSON.stringify({
      type: 'subscription.canceled',
      id: `evt_${randomUUID()}`,
      created_at: new Date().toISOString(),
      data: {
        id: `sub_${randomUUID()}`,
        status: 'canceled',
        customer_id: `cust_${randomUUID()}`,
        customer_email: 'jack@example.com',
        product_id: 'prod_pro_monthly',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 86_400_000).toISOString(),
      },
    });
    const ts2 = String(Math.floor(Date.now() / 1000));
    const msg2 = `msg_${randomUUID()}`;
    const cancelResult = await handler.process({ rawBody: cancelBody, signature: signWebhook(cancelBody, msg2, ts2), webhookId: msg2, timestamp: ts2 });
    expect(cancelResult.ok).toBe(true);

    const sub = await handler.getSubscriptionManager().getSubscription('jack@example.com');
    expect(sub.ok && sub.value?.status).toBe('canceled');
  });
});
