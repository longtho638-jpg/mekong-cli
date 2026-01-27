'use client';

import { useEffect, useState } from 'react';
import { api, type Subscription } from './services/api';
import { PlanSelector } from './components/PlanSelector';
import { BillingHistory } from './components/BillingHistory';
import { PaymentMethods } from './components/PaymentMethods';

export default function SubscriptionPortal() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'billing' | 'payment'>('plans');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await api.subscriptions.getCurrent();
      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      await api.subscriptions.cancel();
      loadSubscription();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--md-sys-color-background)]">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[var(--md-sys-color-primary)] border-r-transparent"></div>
          <p className="mt-4 m3-body-large text-[var(--md-sys-color-on-surface-variant)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--md-sys-color-background)] p-6">
        <div className="max-w-md w-full p-8 rounded-[var(--md-sys-shape-corner-extra-large)] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
          <h2 className="m3-headline-large mb-4">Error</h2>
          <p className="m3-body-large">{error || 'No subscription found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)]">
      {/* Header */}
      <header className="bg-[var(--md-sys-color-surface)] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="m3-display-small text-[var(--md-sys-color-on-surface)]">Subscription Management</h1>
          <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-2">
            Current Plan: <span className="font-semibold capitalize">{subscription.plan}</span> •{' '}
            <span className={subscription.status === 'active' ? 'text-[var(--md-sys-color-tertiary)]' : 'text-[var(--md-sys-color-error)]'}>
              {subscription.status}
            </span>
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex gap-2 border-b border-[var(--md-sys-color-outline-variant)]">
          {[
            { id: 'plans' as const, label: 'Plans & Pricing' },
            { id: 'billing' as const, label: 'Billing History' },
            { id: 'payment' as const, label: 'Payment Methods' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 m3-label-large transition-colors
                ${activeTab === tab.id
                  ? 'text-[var(--md-sys-color-primary)] border-b-2 border-[var(--md-sys-color-primary)]'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'}
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'plans' && (
          <div>
            <PlanSelector currentSubscription={subscription} />

            {subscription.status === 'active' && !subscription.cancel_at_period_end && (
              <div className="mt-8 p-6 rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-surface-variant)]">
                <h3 className="m3-title-large text-[var(--md-sys-color-on-surface)] mb-2">Need to cancel?</h3>
                <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-4">
                  You can cancel anytime. You'll retain access until {new Date(subscription.current_period_end).toLocaleDateString()}.
                </p>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 rounded-[var(--md-sys-shape-corner-full)] bg-[var(--md-sys-color-error)] text-[var(--md-sys-color-on-error)] m3-label-large hover:shadow-md transition-shadow"
                >
                  Cancel Subscription
                </button>
              </div>
            )}

            {subscription.cancel_at_period_end && (
              <div className="mt-8 p-6 rounded-[var(--md-sys-shape-corner-large)] bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
                <h3 className="m3-title-large mb-2">Subscription Scheduled for Cancellation</h3>
                <p className="m3-body-medium">
                  Your subscription will end on {new Date(subscription.current_period_end).toLocaleDateString()}. You'll continue to have access until then.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'billing' && <BillingHistory />}

        {activeTab === 'payment' && <PaymentMethods />}
      </main>
    </div>
  );
}
