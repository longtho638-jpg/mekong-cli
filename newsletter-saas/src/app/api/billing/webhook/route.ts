import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  verifyPayPalWebhookSignature,
  extractPayPalWebhookHeaders,
} from "./paypal-webhook-verifier";

interface PayPalResource {
  id?: string;
  payer?: { email_address?: string };
  amount?: { value?: string };
  supplementary_data?: { related_ids?: { order_id?: string } };
  plan_id?: string;
  custom_id?: string;
}

interface PayPalWebhookBody {
  id?: string;
  event_type?: string;
  resource?: PayPalResource;
}

/**
 * PayPal webhook handler with signature verification
 * POST /api/billing/webhook
 *
 * Security: Verifies PayPal webhook signatures to prevent spoofing
 * Idempotency: Tracks processed events to prevent duplicates
 */

// Validate environment variables at module load time
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID;
if (!PAYPAL_WEBHOOK_ID || !PAYPAL_WEBHOOK_ID.startsWith("WH-")) {
  throw new Error("Invalid PAYPAL_WEBHOOK_ID format (expected: WH-...)");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is required");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const eventId = crypto.randomUUID(); // For logging/tracing

  try {
    // Extract webhook body and headers
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    const eventType = body.event_type;

    console.info(`[PayPal Webhook ${eventId}] Received event: ${eventType}`);

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

    // SECURITY: Replay protection - reject webhooks older than 5 minutes
    const transmissionTime = new Date(webhookHeaders.transmissionTime);
    const now = new Date();
    const ageInMinutes = (now.getTime() - transmissionTime.getTime()) / 60000;

    if (ageInMinutes > 5 || ageInMinutes < -1) {
      console.error(
        `[PayPal Webhook ${eventId}] Webhook replay detected - transmission age: ${ageInMinutes.toFixed(2)} minutes`,
      );
      return NextResponse.json(
        { error: "Expired or future-dated webhook" },
        { status: 401 },
      );
    }

    const isValid = await verifyPayPalWebhookSignature({
      transmissionId: webhookHeaders.transmissionId,
      transmissionTime: webhookHeaders.transmissionTime,
      certUrl: webhookHeaders.certUrl,
      authAlgo: webhookHeaders.authAlgo,
      transmissionSig: webhookHeaders.transmissionSig,
      webhookId: PAYPAL_WEBHOOK_ID,
      webhookEvent: body,
    });

    if (!isValid) {
      console.error(
        `[PayPal Webhook ${eventId}] Invalid signature - potential spoofing attempt`,
      );
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    console.info(`[PayPal Webhook ${eventId}] Signature verified successfully`);

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // IDEMPOTENCY: Check if event already processed
    const { error: insertError } = await supabase
      .from("webhook_events")
      .insert({
        event_id: body.id,
        event_type: eventType,
        payload: body,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      if (
        insertError.code === "23505" ||
        insertError.message?.includes("duplicate")
      ) {
        console.info(
          `[PayPal Webhook ${eventId}] Event already processed (idempotent): ${body.id}`,
        );
        return NextResponse.json({ received: true, duplicate: true });
      }
      console.error(
        `[PayPal Webhook ${eventId}] Failed to log event:`,
        insertError.message,
      );
    }

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
        console.warn(
          `[PayPal Webhook ${eventId}] Unhandled event: ${eventType}`,
        );
    }

    const duration = Date.now() - startTime;
    console.info(
      `[PayPal Webhook ${eventId}] Processed successfully in ${duration}ms`,
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[PayPal Webhook ${eventId}] Error after ${duration}ms:`,
      error,
    );

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

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
  supabase: SupabaseClient,
  body: PayPalWebhookBody,
  eventId: string,
) {
  const captureId = body.resource?.id;
  const payerEmail = body.resource?.payer?.email_address;
  const amountStr = body.resource?.amount?.value;

  if (!captureId || !/^[A-Z0-9]+$/i.test(captureId)) {
    console.error(`[PayPal Webhook ${eventId}] Invalid capture ID format`);
    return;
  }

  const amount = parseFloat(amountStr || "0");
  if (isNaN(amount) || amount <= 0) {
    console.error(`[PayPal Webhook ${eventId}] Invalid payment amount`);
    return;
  }

  console.info(
    `[PayPal Webhook ${eventId}] Payment captured: ${captureId.slice(0, 8)}...`,
  );

  // Update organization payment status
  const { data: orgData, error } = await supabase
    .from("organizations")
    .update({
      last_payment_at: new Date().toISOString(),
      last_payment_amount: amount,
      updated_at: new Date().toISOString(),
    })
    .eq(
      "paypal_order_id",
      body.resource?.supplementary_data?.related_ids?.order_id,
    )
    .select("id")
    .single();

  if (error) {
    console.error(
      `[PayPal Webhook ${eventId}] Failed to update organization:`,
      error,
    );
  } else if (orgData) {
    // Record in unified payments table
    await supabase.from("payments").insert({
      tenant_id: orgData.id,
      amount: amount,
      currency: "USD",
      status: "succeeded",
      paid_at: new Date().toISOString(),
      payment_method: "paypal",
      paypal_capture_id: captureId
    });
  }
}

/**
 * Handle failed or refunded payment
 */
async function handlePaymentFailed(
  supabase: SupabaseClient,
  body: PayPalWebhookBody,
  eventType: string,
  eventId: string,
) {
  const failedOrderId = body.resource?.id;
  console.warn(
    `[PayPal Webhook ${eventId}] Payment ${eventType}: ${failedOrderId}`,
  );
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(
  supabase: SupabaseClient,
  body: PayPalWebhookBody,
  eventId: string,
) {
  const subscriptionId = body.resource?.id;
  console.info(
    `[PayPal Webhook ${eventId}] Subscription cancelled: ${subscriptionId}`,
  );

  // Downgrade to free plan in legacy table
  const { data: orgData, error } = await supabase
    .from("organizations")
    .update({
      plan: "free",
      paypal_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("paypal_subscription_id", subscriptionId)
    .select("id")
    .single();

  if (error) {
    console.error(
      `[PayPal Webhook ${eventId}] Failed to downgrade organization:`,
      error,
    );
  } else if (orgData) {
    // Update unified subscriptions table
    await supabase
      .from("subscriptions")
      .update({
        plan: "FREE",
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("tenant_id", orgData.id);
  }
}

/**
 * Handle subscription activation
 */
async function handleSubscriptionActivated(
  supabase: SupabaseClient,
  body: PayPalWebhookBody,
  eventId: string,
) {
  const subscriptionId = body.resource?.id;
  const planId = body.resource?.plan_id;

  console.info(
    `[PayPal Webhook ${eventId}] Subscription activated: ${subscriptionId}`,
  );

  const planMapping: Record<string, string> = {
    [process.env.PAYPAL_PRO_PLAN_ID!]: "pro",
    [process.env.PAYPAL_ENTERPRISE_PLAN_ID!]: "enterprise",
  };

  const internalPlan = planMapping[planId || ""] || "free";

  // Update organization plan
  // We first try to find the org by paypal_subscription_id (if already set via checkout)
  // or by custom_id if we passed it during subscription creation
  let query = supabase.from("organizations").update({
    plan: internalPlan,
    paypal_subscription_id: subscriptionId,
    updated_at: new Date().toISOString(),
  });

  // Try matching by subscription ID first (if set by checkout flow)
  // Or fallback to other matching if needed.
  // NOTE: In current flow, we set subscription_id in checkout only if we have it?
  // Actually checkout usually sets order_id. Subscription flow might be different.
  // Assuming subscription_id is set in the org row already or we have a way to link.
  // For now, we assume checkout/approval flow sets it, or we need 'custom_id' in resource.

  if (body.resource?.custom_id) {
      query = query.eq("id", body.resource.custom_id);
  } else {
      query = query.eq("paypal_subscription_id", subscriptionId);
  }

  const { data: orgData, error } = await query.select("id").single();

  if (error) {
    console.error(
      `[PayPal Webhook ${eventId}] Failed to activate subscription:`,
      error,
    );
  } else if (orgData) {
    // Update unified subscriptions table
    await supabase.from("subscriptions").upsert({
      tenant_id: orgData.id,
      plan: internalPlan.toUpperCase(),
      status: "active",
      paypal_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'tenant_id' });
  }
}
