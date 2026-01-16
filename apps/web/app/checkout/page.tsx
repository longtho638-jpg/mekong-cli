"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import BraintreeCheckout from "../components/BraintreeCheckout";

type PaymentMethod = "polar" | "braintree";

function CheckoutForm() {
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "pro";

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("braintree");
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const prices = {
    pro: { amount: 497, name: "Pro Agency" },
    enterprise: { amount: 2997, name: "Enterprise Franchise" },
  };

  const selectedPrice = prices[tier as keyof typeof prices] || prices.pro;

  const handlePolarCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, email }),
      });

      const { checkoutUrl, error } = await response.json();

      if (error) {
        alert(`Error: ${error}`);
        return;
      }

      // Redirect to Polar checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBraintreeSuccess = (transactionId: string) => {
    setPaymentSuccess(transactionId);
  };

  const handleBraintreeError = (error: string) => {
    console.error("Braintree error:", error);
  };

  // Success state
  if (paymentSuccess) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-2xl text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2 text-emerald-400">
          Payment Successful!
        </h2>
        <p className="text-slate-300 mb-4">
          Transaction ID:{" "}
          <code className="text-xs bg-slate-700 px-2 py-1 rounded">
            {paymentSuccess}
          </code>
        </p>
        <p className="text-slate-400">
          Check your email for access instructions.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-emerald-500 rounded-lg font-semibold hover:bg-emerald-600 transition"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Product Info */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <h2 className="text-2xl font-bold mb-2">{selectedPrice.name}</h2>
        <div className="text-4xl font-bold text-emerald-400">
          ${selectedPrice.amount}
        </div>
        <p className="text-slate-400 mt-2">Thanh toán 1 lần, sở hữu trọn đời</p>
      </div>

      {/* Email Input */}
      <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-emerald-500 focus:outline-none"
          placeholder="your@email.com"
        />
      </div>

      {/* Payment Method Selector */}
      <div className="flex gap-2 p-1 bg-slate-800 rounded-xl border border-slate-700">
        <button
          onClick={() => setPaymentMethod("braintree")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
            paymentMethod === "braintree"
              ? "bg-emerald-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          💳 Card (Braintree)
        </button>
        <button
          onClick={() => setPaymentMethod("polar")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
            paymentMethod === "polar"
              ? "bg-emerald-500 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          🧊 Polar
        </button>
      </div>

      {/* Payment Forms */}
      {paymentMethod === "braintree" ? (
        <BraintreeCheckout
          amount={selectedPrice.amount}
          productName={selectedPrice.name}
          onSuccess={handleBraintreeSuccess}
          onError={handleBraintreeError}
        />
      ) : (
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
          <button
            onClick={handlePolarCheckout}
            disabled={!email || loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 
                       px-6 py-4 rounded-lg font-bold text-lg transition"
          >
            {loading
              ? "Đang xử lý..."
              : `Pay with Polar $${selectedPrice.amount}`}
          </button>
          <p className="text-sm text-slate-400 mt-4 text-center">
            🔒 Secure payment via Polar
          </p>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-slate-900 to-slate-800 text-white py-20">
      <div className="container mx-auto px-6 max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-center">Thanh Toán</h1>

        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <CheckoutForm />
        </Suspense>

        <div className="mt-8 text-center">
          <Link href="/" className="text-emerald-400 hover:underline">
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}
