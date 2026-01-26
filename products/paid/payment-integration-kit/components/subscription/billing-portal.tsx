"use client";

import { useSubscription } from "../../hooks/useSubscription";

interface BillingPortalProps {
  customerId: string;
}

export function BillingPortal({ customerId }: BillingPortalProps) {
  const { manageSubscription, loading, error } = useSubscription();

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Manage Subscription</h3>
      <div className="mt-2 max-w-xl text-sm text-gray-500">
        <p>Update your payment method, view invoices, or cancel your subscription.</p>
      </div>
      <div className="mt-5">
        <button
          type="button"
          onClick={() => manageSubscription(customerId)}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto disabled:opacity-50"
        >
          {loading ? "Redirecting..." : "Open Customer Portal"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
