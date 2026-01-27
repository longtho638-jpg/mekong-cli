"use client";

import { useEffect, useState, useRef } from "react";

// Braintree Drop-in UI types
declare global {
  interface Window {
    braintree?: {
      dropin: {
        create: (options: {
          authorization: string;
          container: string;
        }) => Promise<BraintreeDropinInstance>;
      };
    };
  }
}

interface BraintreeDropinInstance {
  requestPaymentMethod: () => Promise<{ nonce: string }>;
  teardown: () => Promise<void>;
}

interface BraintreeCheckoutProps {
  amount: number;
  productName: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
}

export default function BraintreeCheckout({
  amount,
  productName,
  onSuccess,
  onError,
}: BraintreeCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [braintreeReady, setBraintreeReady] = useState(false);
  const dropinInstance = useRef<BraintreeDropinInstance | null>(null);

  // API base URL - configure for production
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  useEffect(() => {
    // Load Braintree Drop-in script
    const script = document.createElement("script");
    script.src =
      "https://js.braintreegateway.com/web/dropin/1.43.0/js/dropin.min.js";
    script.async = true;
    script.onload = () => {
      void initializeBraintree();
    };
    script.onerror = () => setError("Failed to load payment processor");
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (dropinInstance.current) {
        void dropinInstance.current.teardown();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeBraintree = async () => {
    try {
      // Get client token from backend
      const response = await fetch(`${API_BASE}/payments/client-token`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to get payment token");
      }

      const { token } = await response.json();

      // Initialize Drop-in UI
      if (window.braintree) {
        dropinInstance.current = await window.braintree.dropin.create({
          authorization: token,
          container: "#braintree-dropin-container",
        });
        setBraintreeReady(true);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment initialization failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!dropinInstance.current) {
      setError("Payment not ready");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Get payment method nonce
      const { nonce } = await dropinInstance.current.requestPaymentMethod();

      // Process payment via backend
      const response = await fetch(`${API_BASE}/payments/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nonce,
          amount: amount.toFixed(2),
          description: `Purchase: ${productName}`,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess(result.transaction_id);
      } else {
        throw new Error(result.message || "Payment failed");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Payment processing failed";
      setError(message);
      onError(message);
    } finally {
      setProcessing(false);
    }
  };

  // Mock payment for testing without credentials
  const handleMockPayment = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`${API_BASE}/payments/mock-checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nonce: "mock-nonce",
          amount: amount.toFixed(2),
          description: `[TEST] ${productName}`,
        }),
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.transaction_id);
      }
    } catch {
      onError("Mock payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>💳</span> Pay with Card (Braintree)
      </h3>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="ml-3 text-slate-400">Loading payment form...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
          <p className="text-sm">{error}</p>
          {/* Show mock payment option on error */}
          <button
            onClick={handleMockPayment}
            disabled={processing}
            className="mt-2 text-xs underline hover:text-red-300"
          >
            Use test payment instead
          </button>
        </div>
      )}

      {/* Braintree Drop-in container */}
      <div
        id="braintree-dropin-container"
        className={loading ? "hidden" : "mb-4"}
      ></div>

      {braintreeReady && (
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 
                     px-6 py-4 rounded-lg font-bold text-lg transition flex items-center justify-center gap-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>Pay ${amount.toFixed(2)}</>
          )}
        </button>
      )}

      <p className="text-xs text-slate-500 mt-4 text-center">
        🔒 Secure payment powered by Braintree (PayPal)
      </p>
    </div>
  );
}
