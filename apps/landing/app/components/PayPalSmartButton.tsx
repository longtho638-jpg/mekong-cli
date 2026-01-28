"use client";

import { PayPalScriptProvider, PayPalButtons, ReactPayPalScriptOptions } from "@paypal/react-paypal-js";
import { useState } from "react";

// Subscription types (not exported by @paypal/react-paypal-js)
type CreateSubscriptionData = Record<string, unknown>;
interface CreateSubscriptionActions {
  subscription: {
    create: (options: { plan_id: string; custom_id?: string }) => Promise<string>;
  };
}

interface PayPalSmartButtonProps {
  amount?: string;
  currency?: string;
  planId?: string; // For subscriptions
  description?: string;
  customerEmail?: string;
  tenantId?: string;
  mode?: "payment" | "subscription";
  onSuccess?: (details: unknown) => void;
  onError?: (err: unknown) => void;
  apiBaseUrl?: string; // Allow overriding API base
}

export default function PayPalSmartButton({
  amount = "0",
  currency = "USD",
  planId,
  description,
  customerEmail,
  tenantId,
  mode = "payment",
  onSuccess,
  onError,
  apiBaseUrl = "/api/v1", // Default to Next.js proxy or direct backend
}: PayPalSmartButtonProps) {
  const [error, setError] = useState<string | null>(null);

  // Environment variables should be handled safely.
  // In a real app, fetch CLIENT_ID from backend config or env.
  const initialOptions: ReactPayPalScriptOptions = {
    clientId: "test", // Replace with process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
    currency: currency,
    intent: mode === "subscription" ? "subscription" : "capture",
    vault: mode === "subscription",
  };

  const createOrder = async (data: any, actions: any) => {
    try {
      const response = await fetch(`${apiBaseUrl}/payments/paypal/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          description,
          customer_email: customerEmail,
          tenant_id: tenantId,
          provider: "paypal",
        }),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.detail || "Failed to create order");

      return resData.orderId as string; // Return order ID from backend
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      onError?.(err);
      throw err;
    }
  };

  const createSubscription = async (data: any, actions: any) => {
    if (!planId) {
      const err = new Error("Plan ID required for subscription");
      setError(err.message);
      onError?.(err);
      throw err;
    }

    // For subscriptions, we can either call backend to setup (preferred for masking)
    // or use actions.subscription.create with plan_id directly.
    // Using backend creates a clean abstraction.
    try {
        const response = await fetch(`${apiBaseUrl}/payments/paypal/create-subscription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              plan_id: planId,
              tenant_id: tenantId,
              customer_email: customerEmail,
            }),
          });

          const resData = await response.json();
          if (!response.ok) throw new Error(resData.detail || "Failed to create subscription");

          // If backend returns a flow/id, return it.
          // Note: Backend currently returns a config object.
          // If backend returns { plan_id: "..." }, use actions:
          return actions.subscription.create({
            plan_id: resData.plan_id || planId,
            custom_id: tenantId, // Pass tenant_id as custom_id
          });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(err);
        throw err;
    }
  };

  const onApprove = async (data: any, actions: any) => {
    if (mode === "subscription") {
      // Subscription approved
      onSuccess?.({
        subscriptionID: data.subscriptionID,
        orderID: data.orderID,
        facilitatorAccessToken: data.facilitatorAccessToken,
      });
    } else {
      // Capture the payment via backend
      try {
        const response = await fetch(`${apiBaseUrl}/payments/paypal/capture-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: data.orderID,
            provider: "paypal",
          }),
        });

        const details = await response.json();
        if (!response.ok) throw new Error(details.detail || "Failed to capture payment");

        onSuccess?.(details);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        onError?.(err);
      }
    }
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <div className="w-full max-w-md mx-auto relative z-0">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", label: mode === "subscription" ? "subscribe" : "pay" }}
          createOrder={mode === "payment" ? createOrder : undefined}
          createSubscription={mode === "subscription" ? createSubscription : undefined}
          onApprove={onApprove}
          onError={(err) => {
            console.error("PayPal Error:", err);
            setError("An error occurred with PayPal.");
            onError?.(err);
          }}
        />
      </div>
    </PayPalScriptProvider>
  );
}
