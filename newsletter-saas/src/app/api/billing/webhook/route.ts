import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  verifyPayPalWebhookSignature,
  extractPayPalWebhookHeaders,
} from "./paypal-webhook-verifier";

/**
 * PayPal webhook handler with signature verification
 * POST /api/billing/webhook
 *
 * Security: Verifies PayPal webhook signatures to prevent spoofing
 * Idempotency: Tracks processed events to prevent duplicates
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const eventId = crypto.randomUUID(); // For logging/tracing

  try {
    // Extract webhook body and headers
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    const eventType = body.event_type;
    const webhookId = process.env.PAYPAL_WEBHOOK_ID!;

    console.log(`[PayPal Webhook ${eventId}] Received event: ${eventType}`);

    // SECURITY: Verify webhook signature
    const webhookHeaders = extractPayPalWebhookHeaders(request.headers);

    if (
      !webhookHeaders.transmissionId ||
      !webhookHeaders.transmissionTime ||
      !webhookHeaders.certUrl ||
      !webhookHeaders.authAlgo ||
      !webhookHeaders.transmissionSig
    ) {
      console.error(`[PayPal Webhook ${eventId}] Missing verification headers`);
      return NextResponse.json(
        { error: "Missing verification headers" },
        { status: 401 },
      );
    }

    const isValid = await verifyPayPalWebhookSignature({
      transmissionId: webhookHeaders.transmissionId,
      transmissionTime: webhookHeaders.transmissionTime,
      certUrl: webhookHeaders.certUrl,
      authAlgo: webhookHeaders.authAlgo,
      transmissionSig: webhookHeaders.transmissionSig,
      webhookId,
      webhookEvent: body,
    });

    if (!isValid) {
      console.error(`[PayPal Webhook ${eventId}] Invalid signature - potential spoofing attempt`);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    console.log(`[PayPal Webhook ${eventId}] Signature verified successfully`);

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // IDEMPOTENCY: Check if event already processed
    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id")
      .eq("event_id", body.id)
      .single();

    if (existingEvent) {
      console.log(`[PayPal Webhook ${eventId}] Event already processed: ${body.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Log webhook event for audit trail
    await supabase.from("webhook_events").insert({
      event_id: body.id,
      event_type: eventType,
      payload: body,
      processed_at: new Date().toISOString(),
    });

    // Process webhook based on event type
    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCaptured(supabase, body, eventId);
        break;

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED":
        await handlePaymentFailed(supabase, body, eventType, eventId);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(supabase, body, eventId);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(supabase, body, eventId);
        break;

      default:
        console.log(`[PayPal Webhook ${eventId}] Unhandled event: ${eventType}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[PayPal Webhook ${eventId}] Processed successfully in ${duration}ms`);

    return NextResponse.json({ received: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[PayPal Webhook ${eventId}] Error after ${duration}ms:`, error);

    // Return 200 to prevent PayPal retries for malformed requests
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // Return 500 for server errors (PayPal will retry)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

/**
 * Handle successful payment capture
 */
async function handlePaymentCaptured(
  supabase: any,
  body: any,
  eventId: string,
) {
  const captureId = body.resource?.id;
  const payerEmail = body.resource?.payer?.email_address;
  const amount = body.resource?.amount?.value;

  console.log(
    `[PayPal Webhook ${eventId}] Payment captured: ${captureId} - $${amount} from ${payerEmail}`,
  );

  // Update organization payment status
  const { error } = await supabase
    .from("organizations")
    .update({
      last_payment_at: new Date().toISOString(),
      last_payment_amount: amount,
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_order_id", body.resource?.supplementary_data?.related_ids?.order_id);

  if (error) {
    console.error(`[PayPal Webhook ${eventId}] Failed to update organization:`, error);
  }
}

/**
 * Handle failed or refunded payment
 */
async function handlePaymentFailed(
  supabase: any,
  body: any,
  eventType: string,
  eventId: string,
) {
  const failedOrderId = body.resource?.id;
  console.log(`[PayPal Webhook ${eventId}] Payment ${eventType}: ${failedOrderId}`);

  // Could implement downgrade logic here
  // For now, just log the event
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(
  supabase: any,
  body: any,
  eventId: string,
) {
  const subscriptionId = body.resource?.id;
  console.log(`[PayPal Webhook ${eventId}] Subscription cancelled: ${subscriptionId}`);

  // Downgrade to free plan
  const { error } = await supabase
    .from("organizations")
    .update({
      plan: "free",
      paypal_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_subscription_id", subscriptionId);

  if (error) {
    console.error(`[PayPal Webhook ${eventId}] Failed to downgrade organization:`, error);
  }
}

/**
 * Handle subscription activation
 */
async function handleSubscriptionActivated(
  supabase: any,
  body: any,
  eventId: string,
) {
  const subscriptionId = body.resource?.id;
  const planId = body.resource?.plan_id;

  console.log(`[PayPal Webhook ${eventId}] Subscription activated: ${subscriptionId}`);

  // Map PayPal plan ID to internal plan
  const planMapping: Record<string, string> = {
    [process.env.PAYPAL_PRO_PLAN_ID!]: "pro",
    [process.env.PAYPAL_ENTERPRISE_PLAN_ID!]: "enterprise",
  };

  const internalPlan = planMapping[planId] || "free";

  // Update organization plan
  const { error } = await supabase
    .from("organizations")
    .update({
      plan: internalPlan,
      paypal_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_subscription_id", subscriptionId);

  if (error) {
    console.error(`[PayPal Webhook ${eventId}] Failed to activate subscription:`, error);
  }
}
