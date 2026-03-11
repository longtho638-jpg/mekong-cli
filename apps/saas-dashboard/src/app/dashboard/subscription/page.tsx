'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PLANS = {
  FREE: {
    name: 'Free',
    price: '$0',
    features: ['Basic missions', 'Limited analytics', 'Community support'],
  },
  PRO: {
    name: 'Pro',
    price: '$49',
    features: ['Unlimited missions', 'Advanced analytics', 'Priority support', 'Custom integrations'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: '$199',
    features: ['Everything in Pro', 'Dedicated support', 'SLA', 'Custom contracts', 'SSO/SAML'],
  },
};

export default function SubscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlan] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE'); // TODO: Load from API

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to open customer portal');
      }
    } catch (error) {
      console.error('Portal error:', error);
      alert('Failed to open customer portal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'PRO' | 'ENTERPRISE') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to create checkout session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your current subscription status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {PLANS[currentPlan].name}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {PLANS[currentPlan].price}
                {currentPlan !== 'FREE' && <span className="text-sm">/month</span>}
              </p>
            </div>
            <Badge variant={currentPlan === 'FREE' ? 'secondary' : 'default'}>
              {currentPlan === 'FREE' ? 'Free Plan' : 'Active'}
            </Badge>
          </div>

          {currentPlan !== 'FREE' && (
            <div className="mt-6">
              <Button onClick={handleManageSubscription} disabled={isLoading}>
                {isLoading ? 'Opening...' : 'Manage Subscription'}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Update payment method, download invoices, or cancel subscription
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(PLANS).map(([key, plan]) => (
          <Card key={key} className={key === currentPlan ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>
                {plan.price}
                {key !== 'FREE' && <span className="text-sm">/month</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              {key !== currentPlan && key !== 'FREE' && (
                <Button
                  className="w-full mt-4"
                  onClick={() => handleUpgrade(key as 'PRO' | 'ENTERPRISE')}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500">
            {currentPlan === 'FREE' ? (
              <p>No billing history available. Upgrade to a paid plan to see invoices.</p>
            ) : (
              <div className="space-y-3">
                <p>Invoices will appear here after your first payment.</p>
                <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                  View all invoices in Stripe Portal
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
