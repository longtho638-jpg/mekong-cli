/**
 * `mekong billing` — Billing and subscription management subcommands.
 *
 *   mekong billing status          Show current subscription from Polar.sh
 *   mekong billing receipts        List local payment receipt history
 *   mekong billing webhook-test    Simulate a webhook payload for local dev
 *
 * Phase 6 of v0.6 Payment Webhook.
 */
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Command } from 'commander';
import { ReceiptStore } from '../../payments/receipt-store.js';
import { WebhookHandler } from '../../payments/webhook-handler.js';
import { createPolarClientFromEnv } from '../../payments/polar-client.js';
import { resolveTierFromProduct } from '../../payments/types.js';
import type { WebhookEventType } from '../../payments/types.js';

const DEFAULT_RECEIPT_PATH = join(homedir(), '.mekong', 'payments', 'receipts.jsonl');
const DEFAULT_REGISTRY = join(homedir(), '.mekong', 'admin', 'keys.json');
const DEFAULT_AUDIT_LOG = join(homedir(), '.mekong', 'admin', 'audit.jsonl');

export function registerBillingCommand(program: Command): void {
  const billing = program
    .command('billing')
    .description('Billing and subscription management (Polar.sh)');

  // ── billing status ──────────────────────────────────────────────────────────
  billing
    .command('status')
    .description('Show current subscription status from Polar.sh')
    .option('--customer <id>', 'Customer ID or email to check')
    .action(async (opts: { customer?: string }) => {
      const clientResult = createPolarClientFromEnv();
      if (!clientResult.ok) {
        console.error(`Error: ${clientResult.error.message}`);
        console.error('Set POLAR_API_KEY environment variable to use billing status.');
        process.exit(1);
      }

      const customerId = opts.customer ?? process.env['POLAR_CUSTOMER_ID'];
      if (!customerId) {
        console.error('Error: specify --customer <id> or set POLAR_CUSTOMER_ID env var.');
        process.exit(1);
      }

      const result = await clientResult.value.checkSubscription(customerId);
      if (!result.ok) {
        console.error('Failed to check subscription:', result.error.message);
        process.exit(1);
      }

      const { active, subscription } = result.value;
      console.log('\nBilling Status');
      console.log(`  Customer   : ${customerId}`);
      console.log(`  Active     : ${active}`);
      if (subscription) {
        console.log(`  Status     : ${subscription.status}`);
        console.log(`  Product    : ${subscription.product_id}`);
        console.log(`  Tier       : ${resolveTierFromProduct(subscription.product_id)}`);
        console.log(`  Period end : ${subscription.current_period_end}`);
        if (subscription.cancel_at_period_end) {
          console.log('  Note       : Cancels at period end');
        }
      } else {
        console.log('  Note       : No active subscription found');
      }
      console.log('');
    });

  // ── billing receipts ────────────────────────────────────────────────────────
  billing
    .command('receipts')
    .description('List local payment receipt history')
    .option('--customer <id>', 'Filter by customer ID or email')
    .option('--from <date>', 'Filter from date (ISO 8601)')
    .option('--to <date>', 'Filter to date (ISO 8601)')
    .option('--limit <n>', 'Max number of receipts to show', '20')
    .action(async (opts: { customer?: string; from?: string; to?: string; limit: string }) => {
      const store = new ReceiptStore(DEFAULT_RECEIPT_PATH);

      let result;
      if (opts.customer) {
        result = await store.findByCustomer(opts.customer);
      } else if (opts.from || opts.to) {
        const from = opts.from ?? '1970-01-01T00:00:00Z';
        const to = opts.to ?? new Date().toISOString();
        result = await store.findByDateRange(from, to);
      } else {
        result = await store.readAll();
      }

      if (!result.ok) {
        console.error('Failed to read receipts:', result.error.message);
        process.exit(1);
      }

      const limit = Math.max(1, parseInt(opts.limit, 10) || 20);
      const events = result.value.slice(-limit);

      if (events.length === 0) {
        console.log('\nNo payment receipts found.\n');
        return;
      }

      console.log(`\nPayment Receipts (${events.length} shown)\n`);
      for (const e of events) {
        const status = e.processed ? (e.error === 'duplicate' ? 'dup' : 'ok') : 'err';
        const tier = e.tier ? `  tier=${e.tier}` : '';
        const key = e.licenseKey ? `  key=${e.licenseKey.slice(0, 20)}...` : '';
        const errMsg = e.error && e.error !== 'duplicate' ? `  error=${e.error}` : '';
        console.log(
          `  [${e.receivedAt}] ${e.type.padEnd(28)} ${status}  customer=${e.customerId ?? e.customerEmail ?? 'unknown'}${tier}${key}${errMsg}`,
        );
      }
      console.log('');
    });

  // ── billing webhook-test ────────────────────────────────────────────────────
  billing
    .command('webhook-test')
    .description('Simulate a webhook payload for local development')
    .option('--event <type>', 'Event type to simulate', 'checkout.completed')
    .option('--product <id>', 'Product ID', 'prod_starter_monthly')
    .option('--email <email>', 'Customer email', 'test@example.com')
    .option('--customer-id <id>', 'Customer ID', 'cust_test_001')
    .option(
      '--secret <secret>',
      'Webhook secret (default: POLAR_WEBHOOK_SECRET env)',
    )
    .option('--dry-run', 'Print payload without processing', false)
    .action(
      async (opts: {
        event: string;
        product: string;
        email: string;
        customerId: string;
        secret?: string;
        dryRun: boolean;
      }) => {
        const eventType = opts.event as WebhookEventType;
        const payload = buildTestPayload(eventType, opts.product, opts.email, opts.customerId);
        const rawBody = JSON.stringify(payload);

        console.log('\nWebhook Test Payload:');
        console.log(JSON.stringify(payload, null, 2));

        if (opts.dryRun) {
          console.log('\n[dry-run] Payload printed. Not processed.\n');
          return;
        }

        const secret =
          opts.secret ?? process.env['POLAR_WEBHOOK_SECRET'] ?? 'test-webhook-secret';
        const webhookId = `test_${Date.now()}`;
        const timestamp = String(Math.floor(Date.now() / 1000));

        // Compute valid signature for the test
        const { createHmac } = await import('node:crypto');
        const signedContent = `${webhookId}.${timestamp}.${rawBody}`;
        const sigHex = createHmac('sha256', secret).update(signedContent).digest('hex');
        const signature = `v1,${sigHex}`;

        const handler = new WebhookHandler({
          secret,
          registryPath: DEFAULT_REGISTRY,
          auditLogPath: DEFAULT_AUDIT_LOG,
          receiptStorePath: DEFAULT_RECEIPT_PATH,
        });

        const result = await handler.process({
          rawBody,
          signature,
          webhookId,
          timestamp,
        });

        if (!result.ok) {
          console.error('\nWebhook processing failed:', result.error.message);
          process.exit(1);
        }

        const event = result.value;
        console.log('\nWebhook processed:');
        console.log(`  Event ID  : ${event.id}`);
        console.log(`  Type      : ${event.type}`);
        console.log(`  Processed : ${event.processed}`);
        if (event.licenseKey) console.log(`  License   : ${event.licenseKey}`);
        if (event.tier) console.log(`  Tier      : ${event.tier}`);
        if (event.error && event.error !== 'duplicate') console.log(`  Error     : ${event.error}`);
        console.log('');
      },
    );
}

function buildTestPayload(
  type: WebhookEventType,
  productId: string,
  email: string,
  customerId: string,
) {
  const id = `evt_test_${Date.now()}`;
  const now = new Date().toISOString();

  if (type === 'checkout.completed') {
    return {
      type,
      id,
      created_at: now,
      data: {
        id: `chk_test_${Date.now()}`,
        status: 'succeeded',
        customer_email: email,
        customer_id: customerId,
        product_id: productId,
        amount: 4900,
        currency: 'usd',
        metadata: {},
      },
    };
  }

  // subscription events
  return {
    type,
    id,
    created_at: now,
    data: {
      id: `sub_test_${Date.now()}`,
      status: type.includes('cancel') ? 'canceled' : 'active',
      customer_id: customerId,
      customer_email: email,
      product_id: productId,
      current_period_start: now,
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      cancel_at_period_end: type.includes('cancel'),
      metadata: {},
    },
  };
}
