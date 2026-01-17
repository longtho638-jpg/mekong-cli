import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// PayPal webhook handler
// POST /api/billing/webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.event_type;

    // Initialize Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    switch (eventType) {
      case "PAYMENT.CAPTURE.COMPLETED":
        // Payment was successful
        const captureId = body.resource?.id;
        const payerEmail = body.resource?.payer?.email_address;
        const amount = body.resource?.amount?.value;

        console.log(
          `[PayPal Webhook] Payment captured: ${captureId} - $${amount} from ${payerEmail}`,
        );

        // Could update organization here if needed
        break;

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REFUNDED":
        // Payment failed or refunded
        const failedOrderId = body.resource?.id;
        console.log(`[PayPal Webhook] Payment ${eventType}: ${failedOrderId}`);

        // Could downgrade subscription here
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        // Subscription cancelled
        const subscriptionId = body.resource?.id;
        console.log(
          `[PayPal Webhook] Subscription cancelled: ${subscriptionId}`,
        );

        // Downgrade to free plan
        await supabase
          .from("organizations")
          .update({
            plan: "free",
            updated_at: new Date().toISOString(),
          })
          .eq("paypal_order_id", subscriptionId);
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PayPal Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
