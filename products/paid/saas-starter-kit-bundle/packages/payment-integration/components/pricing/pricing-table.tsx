"use client";

import { CheckIcon } from "lucide-react";
import { useCheckout } from "../../hooks/useCheckout";

export interface PricingPlan {
  id: string; // Stripe Price ID
  name: string;
  price: string;
  interval: "month" | "year" | "one-time";
  features: string[];
  popular?: boolean;
}

interface PricingTableProps {
  plans: PricingPlan[];
  customerId?: string;
}

export function PricingTable({ plans, customerId }: PricingTableProps) {
  const { createCheckoutSession, loading } = useCheckout();

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for you
          </p>
        </div>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-8 ring-1 xl:p-10 ${
                plan.popular
                  ? "bg-gray-900 ring-gray-900 text-white"
                  : "bg-white ring-gray-200 text-gray-900"
              }`}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={plan.id}
                  className={`text-lg font-semibold leading-8 ${
                    plan.popular ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.name}
                </h3>
                {plan.popular && (
                  <p className="rounded-full bg-indigo-500 px-2.5 py-1 text-xs font-semibold leading-5 text-white">
                    Most popular
                  </p>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-300">
                {plan.interval === "one-time" ? "One-time payment" : `Billed ${plan.interval}ly`}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
                {plan.interval !== "one-time" && (
                  <span className="text-sm font-semibold leading-6 text-gray-300">
                    /{plan.interval}
                  </span>
                )}
              </p>
              <button
                onClick={() => createCheckoutSession(plan.id, customerId)}
                disabled={loading}
                aria-describedby={plan.id}
                className={`mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  plan.popular
                    ? "bg-white text-gray-900 hover:bg-gray-100 focus-visible:outline-white"
                    : "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? "Processing..." : "Subscribe"}
              </button>
              <ul
                role="list"
                className={`mt-8 space-y-3 text-sm leading-6 ${
                  plan.popular ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className={`h-6 w-5 flex-none ${
                        plan.popular ? "text-white" : "text-indigo-600"
                      }`}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
