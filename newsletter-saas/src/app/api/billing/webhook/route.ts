import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLAN_LIMITS } from "@/lib/polar/client";
import crypto from "crypto";

// Verify webhook signature using HMAC
function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !secret) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload, "utf8")
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex"),
    );
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

// Polar webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text(); // Get raw body for signature verification
    const signature = request.headers.get("polar-signature");

    // Verify webhook signature
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("POLAR_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not properly configured" },
        { status: 500 },
      );
    }

    const isValid = verifyWebhookSignature(body, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const data = JSON.parse(body);

    const supabase = await createClient();
    const event = body.type;
    const data = body.data;

    switch (event) {
      case "subscription.created":
      case "subscription.updated": {
        const orgId = data.metadata?.organization_id;
        if (!orgId) break;

        // Determine plan from product
        let plan = "starter";
        if (data.product?.name?.toLowerCase().includes("pro")) plan = "pro";
        if (data.product?.name?.toLowerCase().includes("agency"))
          plan = "agency";

        const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

        await supabase
          .from("organizations")
          .update({
            plan,
            polar_subscription_id: data.id,
            polar_customer_id: data.customer_id,
            newsletters_limit: limits.newsletters,
            subscribers_limit: limits.subscribers,
            emails_limit: limits.emails_per_month,
          })
          .eq("id", orgId);

        break;
      }

      case "subscription.canceled":
      case "subscription.revoked": {
        const orgId = data.metadata?.organization_id;
        if (!orgId) break;

        // Downgrade to free
        const limits = PLAN_LIMITS.free;

        await supabase
          .from("organizations")
          .update({
            plan: "free",
            polar_subscription_id: null,
            newsletters_limit: limits.newsletters,
            subscribers_limit: limits.subscribers,
            emails_limit: limits.emails_per_month,
          })
          .eq("id", orgId);

        break;
      }

      case "checkout.created": {
        // User started checkout - tracked silently
        break;
      }

      case "checkout.updated": {
        // Checkout completed or failed - subscription webhook handles the update
        break;
      }

      default:
      // Unhandled events are ignored silently
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
