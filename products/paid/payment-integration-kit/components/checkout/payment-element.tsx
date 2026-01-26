"use client";

import { Elements } from "@stripe/react-stripe-js";
import { useStripePromise } from "../../hooks/useStripe";
import { CheckoutForm } from "./checkout-form";
import { useState, useEffect } from "react";

interface PaymentElementWrapperProps {
  clientSecret?: string;
  amount?: number; // Needed if clientSecret is not created yet (for PaymentIntent creation on the fly)
}

export function PaymentElementWrapper({ clientSecret: initialClientSecret }: PaymentElementWrapperProps) {
  const stripePromise = useStripePromise();
  const [clientSecret, setClientSecret] = useState<string | null>(initialClientSecret || null);

  // If you don't pass a clientSecret, you might fetch it here
  useEffect(() => {
    if (!initialClientSecret) {
      fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ id: "xl-tshirt" }] }),
      })
        .then((res) => res.json())
        .then((data) => setClientSecret(data.clientSecret));
    }
  }, [initialClientSecret]);

  if (!clientSecret || !stripePromise) {
    return <div className="flex justify-center p-8">Loading checkout...</div>;
  }

  const appearance = {
    theme: 'stripe' as const,
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="App">
      <Elements options={options} stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}
