import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/polar-checkout-client';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const headersList = await headers();
    const signature = headersList.get('polar-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    const isValid = await verifyWebhookSignature(payload, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);

    // Handle different event types
    switch (event.type) {
      case 'checkout.completed':
        await handleCheckoutCompleted(event.data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(event.data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event.data);
        break;

      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event.data);
        break;

      default:
        // Unhandled event type - log to stderr for monitoring
        console.warn(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(data: Record<string, unknown>) {
  // TODO: Send confirmation email, provision access, etc.
}

async function handleSubscriptionCreated(data: Record<string, unknown>) {
  // TODO: Grant user access, send welcome email
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
  // TODO: Update user permissions
}

async function handleSubscriptionCancelled(data: Record<string, unknown>) {
  // TODO: Schedule access revocation, send exit survey
}
