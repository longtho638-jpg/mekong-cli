'use client';

import { useEffect, useState } from 'react';
import { api, type PaymentMethod } from '../services/api';

export function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const data = await api.billing.getPaymentMethods();
      setMethods(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      await api.billing.setDefaultPaymentMethod(paymentMethodId);
      loadPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set default payment method');
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) return;

    try {
      await api.billing.removePaymentMethod(paymentMethodId);
      loadPaymentMethods();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove payment method');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--md-sys-color-primary)] border-r-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-[var(--md-sys-shape-corner-medium)] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
          {error}
        </div>
      )}

      {methods.length === 0 ? (
        <div className="p-12 text-center text-[var(--md-sys-color-on-surface-variant)]">
          <p className="m3-body-large mb-4">No payment methods</p>
          <button className="px-6 py-3 rounded-[var(--md-sys-shape-corner-full)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] m3-label-large hover:shadow-md transition-shadow">
            Add Payment Method
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`
                p-6 rounded-[var(--md-sys-shape-corner-large)]
                ${method.is_default
                  ? 'bg-[var(--md-sys-color-primary-container)] border-2 border-[var(--md-sys-color-primary)]'
                  : 'bg-[var(--md-sys-color-surface-variant)]'}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="m3-title-medium text-[var(--md-sys-color-on-surface)] capitalize">
                    {method.card.brand} •••• {method.card.last4}
                  </p>
                  <p className="m3-body-small text-[var(--md-sys-color-on-surface-variant)]">
                    Expires {method.card.exp_month}/{method.card.exp_year}
                  </p>
                </div>
                {method.is_default && (
                  <span className="px-3 py-1 rounded-[var(--md-sys-shape-corner-full)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] m3-label-small">
                    Default
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {!method.is_default && (
                  <button
                    onClick={() => handleSetDefault(method.id)}
                    className="flex-1 px-4 py-2 rounded-[var(--md-sys-shape-corner-full)] bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)] m3-label-medium hover:shadow-md transition-shadow"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleRemove(method.id)}
                  disabled={method.is_default && methods.length === 1}
                  className="flex-1 px-4 py-2 rounded-[var(--md-sys-shape-corner-full)] bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] m3-label-medium hover:shadow-md transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="w-full px-6 py-3 rounded-[var(--md-sys-shape-corner-full)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] m3-label-large hover:shadow-md transition-shadow">
        + Add Payment Method
      </button>
    </div>
  );
}
