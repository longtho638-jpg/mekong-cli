/**
 * Stripe Webhook Endpoint (Next.js App Router)
 *
 * This is a complete, production-ready webhook handler using the hardened implementation.
 *
 * Location: app/api/webhooks/stripe/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { processStripeWebhook } from '@/backend/lib/stripe-webhook-handler-hardened';

/**
 * CRITICAL: Disable Next.js body parsing
 *
 * Stripe signature verification requires the raw request body.
 * Next.js's automatic body parsing would convert it to JSON, breaking verification.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/stripe
 *
 * Receives webhook events from Stripe
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get raw body (required for signature verification)
    const body = await req.text();

    // 2. Get signature from headers
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('❌ Missing Stripe signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // 3. Process webhook with full hardening
    const result = await processStripeWebhook(body, signature);

    // 4. Return appropriate response
    if (!result.success) {
      // Signature verification failed or processing error
      console.error(`❌ Webhook processing failed: ${result.message}`);
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Success - return 2xx status so Stripe doesn't retry
    console.log(`✅ Webhook ${result.eventId} processed successfully`);
    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      message: result.message
    });

  } catch (error) {
    // Unexpected error (should be rare with hardened implementation)
    console.error('❌ Unexpected webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/stripe
 *
 * Health check endpoint
 */
export async function GET() {
  const { verifyWebhookHealth } = await import('@/backend/lib/stripe-webhook-handler-hardened');
  const health = verifyWebhookHealth();

  return NextResponse.json({
    status: health.configured ? 'healthy' : 'misconfigured',
    configured: health.configured,
    issues: health.issues,
    timestamp: new Date().toISOString()
  }, {
    status: health.configured ? 200 : 503
  });
}
