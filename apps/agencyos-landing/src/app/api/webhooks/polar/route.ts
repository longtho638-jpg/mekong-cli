import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/polar-checkout-client';
import { headers } from 'next/headers';
import { WebhookEventSchema, type WebhookEvent } from '@/lib/schemas/webhook';
import { ApiError, handleRouteError } from '@/lib/api-errors';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const headersList = await headers();
    const signature = headersList.get('polar-signature');

    if (!signature) {
      throw new ApiError('Missing signature', 'MISSING_SIGNATURE', 401);
    }

    const isValid = await verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new ApiError('Invalid signature', 'INVALID_SIGNATURE', 401);
    }

    const json: unknown = JSON.parse(payload);
    const event = WebhookEventSchema.parse(json);

    await routeWebhookEvent(event);

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    return handleRouteError(error);
  }
}

async function routeWebhookEvent(event: WebhookEvent): Promise<void> {
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
  }
}

async function handleCheckoutCompleted(_data: Record<string, unknown>) {
  // Stub: send confirmation email, provision access when @agencyos/money is wired
}

async function handleSubscriptionCreated(_data: Record<string, unknown>) {
  // Stub: grant user access, send welcome email
}

async function handleSubscriptionUpdated(_data: Record<string, unknown>) {
  // Stub: update user permissions
}

async function handleSubscriptionCancelled(_data: Record<string, unknown>) {
  // Stub: schedule access revocation, send exit survey
}
