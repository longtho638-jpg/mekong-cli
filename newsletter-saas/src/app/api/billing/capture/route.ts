import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { captureOrder, PLAN_LIMITS } from "@/lib/paypal/client";

// GET /api/billing/capture - Handle PayPal payment capture after approval
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const { searchParams } = new URL(request.url);
    const plan = searchParams.get("plan");
    const token = searchParams.get("token"); // PayPal adds this

    if (!token) {
      return NextResponse.redirect(
        new URL("/pricing?error=missing_token", request.url),
      );
    }

    // Get pending order from database
    const { data: org } = await supabase
      .from("organizations")
      .select("paypal_pending_order, paypal_pending_plan")
      .eq("owner_id", user.id)
      .single();

    const orderId = org?.paypal_pending_order || token;

    // Capture the payment
    const capture = await captureOrder(orderId);

    if (capture.status !== "COMPLETED") {
      return NextResponse.redirect(
        new URL(
          `/pricing?error=payment_failed&status=${capture.status}`,
          request.url,
        ),
      );
    }

    // Update organization with subscription
    const planKey = (plan ||
      org?.paypal_pending_plan ||
      "starter") as keyof typeof PLAN_LIMITS;
    await supabase
      .from("organizations")
      .update({
        plan: planKey,
        paypal_order_id: capture.transactionId,
        paypal_payer_email: capture.payerEmail,
        paypal_pending_order: null,
        paypal_pending_plan: null,
        subscriber_limit: PLAN_LIMITS[planKey]?.subscribers || 5000,
        email_limit: PLAN_LIMITS[planKey]?.emails_per_month || 20000,
        updated_at: new Date().toISOString(),
      })
      .eq("owner_id", user.id);

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/dashboard?payment=success&plan=${planKey}&amount=${capture.amount}`,
        request.url,
      ),
    );
  } catch (error) {
    console.error("Capture error:", error);
    return NextResponse.redirect(
      new URL("/pricing?error=capture_failed", request.url),
    );
  }
}
