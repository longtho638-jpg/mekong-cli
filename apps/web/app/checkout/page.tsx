"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import PayPalSmartButton from "../components/PayPalSmartButton";

function CheckoutForm() {
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "pro";

  const [email, setEmail] = useState("");
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  const prices = {
    starter: { amount: "29", name: "Starter Agency", planId: "P-7DA230130F8006938NFYLZDA", mode: "subscription" },
    pro: { amount: "99", name: "Pro Agency", planId: "P-95T479827M227991CNFYLZDI", mode: "subscription" },
    franchise: { amount: "299", name: "Franchise", planId: "P-0KK81193UG062012VNFYLZDI", mode: "subscription" },
    enterprise: { amount: "999", name: "Enterprise", planId: "P-92J98622GM186390LNFYLZDQ", mode: "subscription" },
  };

  const selectedPrice = prices[tier as keyof typeof prices] || prices.pro;

  const handlePaymentSuccess = (details: unknown) => {
    const data = details as { subscriptionID?: string; id?: string };
    // Determine ID based on flow
    const id = data.subscriptionID || data.id || "CONFIRMED";
    setPaymentSuccess(id);
  };

  const handlePaymentError = (error: unknown) => {
    console.error("Payment error:", error);
  };

  // Success state
  if (paymentSuccess) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 p-8 rounded-2xl text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2 text-emerald-400">
          {selectedPrice.mode === 'subscription' ? 'Subscription Successful!' : 'Payment Successful!'}
        </h2>
        <p className="text-slate-300 mb-4">
          ID:{" "}
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
          <span className="text-lg text-slate-500 ml-2 font-normal">
            {selectedPrice.mode === 'subscription' ? '/tháng' : ''}
          </span>
        </div>
        <p className="text-slate-400 mt-2">
          {selectedPrice.mode === 'subscription' ? 'Hủy bất cứ lúc nào' : 'Thanh toán 1 lần, sở hữu trọn đời'}
        </p>
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

      {/* Payment Forms */}
      <PayPalSmartButton
        amount={selectedPrice.amount}
        currency="USD"
        planId={selectedPrice.planId}
        mode={selectedPrice.mode as 'payment' | 'subscription'}
        description={selectedPrice.name}
        customerEmail={email}
        tenantId={email} // Using email as tenant_id for new signups
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        apiBaseUrl="/api/v1" // Proxy or direct backend URL
      />
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
