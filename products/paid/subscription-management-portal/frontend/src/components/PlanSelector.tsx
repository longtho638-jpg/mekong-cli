'use client';

import { useState } from 'react';
import { api, type Subscription } from '../services/api';

interface Plan {
  id: 'solo' | 'team' | 'enterprise';
  name: string;
  price: number;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'solo',
    name: 'Solo',
    price: 395,
    features: ['1 user', '3 agents', '10K requests/month', 'Email support'],
  },
  {
    id: 'team',
    name: 'Team',
    price: 995,
    features: ['5 users', '10 agents', '50K requests/month', 'Priority support'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    features: ['Unlimited users', 'Unlimited agents', 'Unlimited requests', 'Dedicated support'],
  },
];

export function PlanSelector({ currentSubscription }: { currentSubscription: Subscription }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanChange = async (newPlan: string) => {
    if (newPlan === currentSubscription.plan) return;

    setLoading(true);
    setError(null);

    try {
      const currentIndex = plans.findIndex((p) => p.id === currentSubscription.plan);
      const newIndex = plans.findIndex((p) => p.id === newPlan);

      if (newIndex > currentIndex) {
        await api.subscriptions.upgrade(newPlan);
      } else {
        await api.subscriptions.downgrade(newPlan);
      }

      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentSubscription.plan;
        const isUpgrade = plans.findIndex((p) => p.id === plan.id) > plans.findIndex((p) => p.id === currentSubscription.plan);

        return (
          <div
            key={plan.id}
            className={`
              p-6 rounded-[var(--md-sys-shape-corner-large)]
              ${isCurrent
                ? 'bg-[var(--md-sys-color-primary-container)] border-2 border-[var(--md-sys-color-primary)]'
                : 'bg-[var(--md-sys-color-surface-variant)]'}
            `}
          >
            <div className="mb-4">
              <h3 className="m3-headline-large text-[var(--md-sys-color-on-surface)]">{plan.name}</h3>
              {plan.price > 0 ? (
                <p className="m3-display-medium text-[var(--md-sys-color-primary)]">
                  ${plan.price}
                  <span className="m3-body-small text-[var(--md-sys-color-on-surface-variant)]">/year</span>
                </p>
              ) : (
                <p className="m3-display-medium text-[var(--md-sys-color-primary)]">Custom</p>
              )}
            </div>

            <ul className="mb-6 space-y-2">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="m3-body-medium text-[var(--md-sys-color-on-surface)] flex items-start">
                  <span className="text-[var(--md-sys-color-primary)] mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            {isCurrent ? (
              <div className="px-6 py-3 rounded-[var(--md-sys-shape-corner-full)] bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-center m3-label-large">
                Current Plan
              </div>
            ) : (
              <button
                onClick={() => handlePlanChange(plan.id)}
                disabled={loading}
                className={`
                  w-full px-6 py-3 rounded-[var(--md-sys-shape-corner-full)]
                  ${isUpgrade
                    ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]'
                    : 'bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)]'}
                  m3-label-large hover:shadow-md transition-shadow
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {loading ? 'Processing...' : isUpgrade ? 'Upgrade' : 'Downgrade'}
              </button>
            )}
          </div>
        );
      })}

      {error && (
        <div className="col-span-full p-4 rounded-[var(--md-sys-shape-corner-medium)] bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
          {error}
        </div>
      )}
    </div>
  );
}
