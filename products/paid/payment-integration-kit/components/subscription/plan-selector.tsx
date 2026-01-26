"use client";

import { useState } from "react";
import { useCheckout } from "../../hooks/useCheckout";

interface Plan {
  id: string;
  name: string;
  price: string;
  interval: string;
}

interface PlanSelectorProps {
  plans: Plan[];
  currentPlanId?: string;
  customerId?: string;
}

export function PlanSelector({ plans, currentPlanId, customerId }: PlanSelectorProps) {
  const { createCheckoutSession, loading } = useCheckout();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlanId || plans[0]?.id);

  const handleSubscribe = async () => {
    if (selectedPlanId) {
       await createCheckoutSession(selectedPlanId, customerId);
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Change Plan</h3>
      <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => setSelectedPlanId(plan.id)}
            className={`relative flex cursor-pointer rounded-lg border p-4 shadow-sm focus:outline-none ${
              selectedPlanId === plan.id
                ? "border-indigo-600 ring-2 ring-indigo-600"
                : "border-gray-300"
            }`}
          >
            <span className="flex flex-1">
              <span className="flex flex-col">
                <span className="block text-sm font-medium text-gray-900">{plan.name}</span>
                <span className="mt-1 flex items-center text-sm text-gray-500">
                  {plan.price} / {plan.interval}
                </span>
                <span className="mt-6 text-sm font-medium text-gray-900">
                  {currentPlanId === plan.id ? "Current Plan" : ""}
                </span>
              </span>
            </span>
            <span
              className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                selectedPlanId === plan.id
                  ? "bg-indigo-600 border-transparent"
                  : "bg-white border-gray-300"
              }`}
              aria-hidden="true"
            >
              {selectedPlanId === plan.id && <span className="h-2.5 w-2.5 rounded-full bg-white" />}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button
           onClick={handleSubscribe}
           disabled={loading || selectedPlanId === currentPlanId}
           className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : selectedPlanId === currentPlanId ? "Current Plan" : "Update Subscription"}
        </button>
      </div>
    </div>
  );
}
