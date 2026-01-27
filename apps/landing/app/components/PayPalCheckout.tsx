"use client";

import { useState } from 'react';

interface PayPalCheckoutProps {
  amount?: number;
  planId?: string;
  mode?: 'payment' | 'subscription';
  productName: string;
  email: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function PayPalCheckout({
  amount,
  planId,
  mode = 'payment',
  productName,
  email,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSuccess,
  onError,
}: PayPalCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      let response;
      if (mode === 'subscription') {
        response = await fetch(`${API_BASE}/payments/paypal/create-subscription`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_id: planId,
            customer_email: email,
            tenant_id: email, // Using email as tenant_id for simplicity in this flow
            return_url: `${window.location.origin}/checkout/success`,
            cancel_url: `${window.location.origin}/checkout`,
          }),
        });
      } else {
        response = await fetch(`${API_BASE}/payments/paypal/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: amount,
            currency: "USD",
            description: `Purchase: ${productName}`,
            customer_email: email,
            tenant_id: email
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to create PayPal ${mode}`);
      }

      const data = await response.json();

      // Get approval URL from links
      // For orders, it's in data.details.links
      // For subscriptions, it's in data.links
      const links = data.details?.links || data.links;
      const approvalUrl = links?.find((l: { rel: string; href: string }) => l.rel === "approve")?.href;

      if (approvalUrl) {
        window.location.href = approvalUrl;
      } else {
        throw new Error("PayPal approval URL not found");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "PayPal checkout failed";
      setError(message);
      onError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handlePayment}
        disabled={!email || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600
                   px-6 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Đang xử lý...
          </>
        ) : (
          <>
            <span className="text-xl">💳</span>
            {mode === 'subscription' ? `Subscribe with PayPal` : `Pay with PayPal $${amount}`}
          </>
        )}
      </button>
      <p className="text-sm text-slate-400 mt-4 text-center">
        🔒 Thanh toán an toàn qua PayPal
      </p>
    </div>
  );
}
