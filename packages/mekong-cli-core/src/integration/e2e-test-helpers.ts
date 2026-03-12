/**
 * e2e-test-helpers.ts — shared helpers for integration e2e tests.
 */
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { createHmac } from 'node:crypto';

import { WebhookHandler } from '../payments/webhook-handler.js';
import { MeteringStore } from '../metering/store.js';
import { MeteringCollector } from '../metering/collector.js';
import { UsageLimiter } from '../metering/limiter.js';

export const WEBHOOK_SECRET = 'e2e-shared-secret';

export function signWebhook(body: string, id: string, ts: string): string {
  const hex = createHmac('sha256', WEBHOOK_SECRET).update(`${id}.${ts}.${body}`).digest('hex');
  return `v1,${hex}`;
}

export function checkoutBody(email: string, productId: string, evtId: string): string {
  return JSON.stringify({
    type: 'checkout.completed',
    id: evtId,
    created_at: new Date().toISOString(),
    data: {
      id: `chk_${randomUUID()}`,
      status: 'succeeded',
      customer_email: email,
      customer_id: `cust_${randomUUID()}`,
      product_id: productId,
      amount: 9900,
      currency: 'usd',
    },
  });
}

export function subUpdateBody(email: string, productId: string, evtId: string): string {
  return JSON.stringify({
    type: 'subscription.updated',
    id: evtId,
    created_at: new Date().toISOString(),
    data: {
      id: `sub_${randomUUID()}`,
      status: 'active',
      customer_id: `cust_${randomUUID()}`,
      customer_email: email,
      product_id: productId,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    },
  });
}

export function makeWebhookHandler(tmpDir: string): WebhookHandler {
  return new WebhookHandler({
    secret: WEBHOOK_SECRET,
    registryPath: join(tmpDir, 'keys.json'),
    auditLogPath: join(tmpDir, 'audit.jsonl'),
    receiptStorePath: join(tmpDir, 'receipts.jsonl'),
  });
}

export function makeMeteringStack(tmpDir: string) {
  const store = new MeteringStore(join(tmpDir, 'metering'));
  const collector = new MeteringCollector(store);
  const limiter = new UsageLimiter(store);
  return { store, collector, limiter };
}

export async function withTmpDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'mekong-e2e-'));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
