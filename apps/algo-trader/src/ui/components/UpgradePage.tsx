/**
 * Upgrade Page Component
 *
 * Displays pricing plans and handles checkout flow
 */

import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../components/SubscriptionPlan';

interface LicenseStatus {
  tier: string;
  valid: boolean;
  features: string[];
}

export const UpgradePage: React.FC = () => {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  const fetchLicenseStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      const data = await response.json();
      setLicense(data);
    } catch (error) {
      console.error('Failed to fetch license status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (tier: 'pro' | 'enterprise') => {
    setCheckoutLoading(tier);
    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (!response.ok) throw new Error('Failed to create checkout');

      const { checkoutUrl } = await response.json();

      // Redirect to Polar checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const currentTier = license?.tier?.toUpperCase() || 'FREE';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Unlock premium features and boost your trading performance
          </p>
          {license && (
            <p className="mt-2 text-sm text-gray-500">
              Current plan: <span className="font-semibold">{currentTier}</span>
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FREE Tier */}
          <SubscriptionPlan
            tier="FREE"
            price="$0"
            interval="month"
            features={[
              'Basic trading strategies',
              'Live trading',
              'Basic backtesting',
              'Community support',
            ]}
            isCurrentTier={currentTier === 'FREE'}
            onUpgrade={() => handleUpgrade('pro')}
            disabled={currentTier === 'FREE'}
          />

          {/* PRO Tier */}
          <SubscriptionPlan
            tier="PRO"
            price="$49"
            interval="month"
            features={[
              'Everything in FREE',
              'ML models (GRU, LSTM)',
              'Premium data feeds',
              'Advanced optimization',
              'Walk-forward analysis',
              'Monte Carlo simulation',
            ]}
            isCurrentTier={currentTier === 'PRO'}
            onUpgrade={() => handleUpgrade('pro')}
            disabled={currentTier === 'PRO'}
          />

          {/* ENTERPRISE Tier */}
          <SubscriptionPlan
            tier="ENTERPRISE"
            price="$199"
            interval="month"
            features={[
              'Everything in PRO',
              'Priority support',
              'Custom strategies',
              'Multi-exchange support',
              'Dedicated account manager',
              'SLA guarantee',
            ]}
            isCurrentTier={currentTier === 'ENTERPRISE'}
            onUpgrade={() => handleUpgrade('enterprise')}
            disabled={currentTier === 'ENTERPRISE'}
          />
        </div>

        {/* Features Comparison */}
        <div className="mt-16 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Compare Features
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Feature</th>
                  <th className="text-center py-3 px-4">FREE</th>
                  <th className="text-center py-3 px-4">PRO</th>
                  <th className="text-center py-3 px-4">ENTERPRISE</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-3 px-4">Basic Strategies</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">ML Models</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Premium Data</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Advanced Optimization</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3 px-4">Priority Support</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Custom Strategies</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✗</td>
                  <td className="text-center">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. Your premium
                features will remain active until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                We offer a 14-day free trial for PRO tier. No credit card required
                to start.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards via Polar.sh secure checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
