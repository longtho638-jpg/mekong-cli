/**
 * PayPal Webhook Endpoint (Next.js App Router)
 *
 * This is a complete, production-ready webhook handler using the hardened implementation.
 *
 * Location: app/api/webhooks/paypal/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { processPayPalWebhook } from '@/backend/lib/paypal-webhook-handler-hardened';

/**
 * CRITICAL: Disable Next.js body parsing
 *
 * PayPal signature verification requires the raw request body.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/webhooks/paypal
 *
 * Receives webhook events from PayPal
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Get raw body (required for signature verification)
    const body = await req.text();

    // 2. Get all headers (PayPal uses multiple headers for verification)
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // 3. Validate required headers
    const requiredHeaders = [
      'paypal-transmission-id',
      'paypal-transmission-time',
      'paypal-transmission-sig',
      'paypal-cert-url',
      'paypal-auth-algo'
    ];

    const missingHeaders = requiredHeaders.filter(h => !headers[h]);
    if (missingHeaders.length > 0) {
      console.error(`❌ Missing PayPal headers: ${missingHeaders.join(', ')}`);
      return NextResponse.json(
        { error: `Missing required headers: ${missingHeaders.join(', ')}` },
        { status: 400 }
      );
    }

    // 4. Process webhook with full hardening
    const result = await processPayPalWebhook(headers, body);

    // 5. Return appropriate response
    if (!result.success) {
      // Signature verification failed or processing error
      console.error(`❌ PayPal webhook processing failed: ${result.message}`);
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    // Success - return 2xx status so PayPal doesn't retry
    console.log(`✅ PayPal webhook ${result.eventId} processed successfully`);
    return NextResponse.json({
      received: true,
      eventId: result.eventId,
      message: result.message
    });

  } catch (error) {
    // Unexpected error
    console.error('❌ Unexpected PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/paypal
 *
 * Health check endpoint
 */
export async function GET() {
  const { verifyPayPalWebhookHealth } = await import('@/backend/lib/paypal-webhook-handler-hardened');
  const health = verifyPayPalWebhookHealth();

  return NextResponse.json({
    status: health.configured ? 'healthy' : 'misconfigured',
    configured: health.configured,
    issues: health.issues,
    mode: process.env.PAYPAL_MODE || 'not set',
    timestamp: new Date().toISOString()
  }, {
    status: health.configured ? 200 : 503
  });
}
