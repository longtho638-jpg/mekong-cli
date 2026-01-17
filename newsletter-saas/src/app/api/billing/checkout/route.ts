import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createOrder, PAYPAL_PRICES } from "@/lib/paypal/client";
import {
  rateLimitMiddleware,
  securityHeaders,
  isValidPlan,
  isValidBillingCycle,
  validateOrigin,
  handleSecureError,
} from "@/lib/security";

// POST /api/billing/checkout - Create PayPal checkout session
export async function POST(request: NextRequest) {
  try {
    // Validate CORS
    if (!validateOrigin(request)) {
      return securityHeaders(
        NextResponse.json({ error: "Invalid origin" }, { status: 403 }),
      );
    }

    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware("/api/billing/checkout");
    if (rateLimitResult) {
      const rateLimitResponse = rateLimitResult(request);
      if (rateLimitResponse instanceof NextResponse) {
        return securityHeaders(rateLimitResponse);
      }
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return securityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    const body = await request.json();
    const { plan, billing } = body;

    // Validate inputs
    if (!plan || !billing) {
      return securityHeaders(
        NextResponse.json(
          { error: "Plan and billing cycle are required" },
          { status: 400 },
        ),
      );
    }

    if (!isValidPlan(plan)) {
      return securityHeaders(
        NextResponse.json({ error: "Invalid plan" }, { status: 400 }),
      );
    }

    if (!isValidBillingCycle(billing)) {
      return securityHeaders(
        NextResponse.json({ error: "Invalid billing cycle" }, { status: 400 }),
      );
    }

    const prices = PAYPAL_PRICES[planKey];
    const amount = billing === "yearly" ? prices.yearly : prices.monthly;
    const period = billing === "yearly" ? "year" : "month";

    // Demo mode if PayPal not configured
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      // Update org with demo subscription
      await supabase
        .from("organizations")
        .update({
          plan: plan,
          paypal_order_id: `demo_order_${Date.now()}`,
          updated_at: new Date().toISOString(),
        })
        .eq("owner_id", user.id);

      return securityHeaders(
        NextResponse.json({
          demo: true,
          message: `Demo mode: Upgraded to ${plan}!`,
          checkoutUrl: `/dashboard?upgraded=${plan}`,
        }),
      );
    }

    // Create PayPal order
    const order = await createOrder({
      amount,
      description: `Newsletter ${plan} - ${period}ly subscription`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/capture?plan=${plan}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?cancelled=true`,
    });

    // Save pending order
    await supabase
      .from("organizations")
      .update({
        paypal_pending_order: order.orderId,
        paypal_pending_plan: plan,
      })
      .eq("owner_id", user.id);

    return securityHeaders(
      NextResponse.json({
        orderId: order.orderId,
        checkoutUrl: order.approvalUrl,
      }),
    );
  } catch (error) {
    return handleSecureError(error, "billing/checkout");
  }
}

// GET /api/billing/checkout - Get subscription status
export async function GET(request: NextRequest) {
  try {
    // Validate CORS
    if (!validateOrigin(request)) {
      return securityHeaders(
        NextResponse.json({ error: "Invalid origin" }, { status: 403 }),
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return securityHeaders(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      );
    }

    const { data: org } = await supabase
      .from("organizations")
      .select("plan, paypal_order_id")
      .eq("owner_id", user.id)
      .single();

    return securityHeaders(
      NextResponse.json({
        plan: org?.plan || "free",
        has_subscription: !!org?.paypal_order_id,
      }),
    );
  } catch (error) {
    return handleSecureError(error, "billing/checkout/status");
  }
}
