"use client";

import { BillingPortal } from "./billing-portal";
import { PlanSelector } from "./plan-selector";

interface SubscriptionManagerProps {
  customerId: string;
  plans: any[]; // Define proper type
  currentPlanId?: string;
  status?: string; // active, past_due, canceled, etc.
}

export function SubscriptionManager({ customerId, plans, currentPlanId, status }: SubscriptionManagerProps) {
  return (
    <div className="space-y-8 divide-y divide-gray-200">
      <div className="space-y-1">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Subscription Status</h3>
        <p className="max-w-2xl text-sm text-gray-500">
          Your current subscription status is: <span className={`font-semibold capitalize ${status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>{status || "Inactive"}</span>
        </p>
      </div>

      <div className="pt-8">
        <PlanSelector plans={plans} currentPlanId={currentPlanId} customerId={customerId} />
      </div>

      <div className="pt-8">
        <BillingPortal customerId={customerId} />
      </div>
    </div>
  );
}
