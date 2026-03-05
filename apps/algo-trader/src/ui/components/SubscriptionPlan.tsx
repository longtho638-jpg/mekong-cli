/**
 * Subscription Plan Card Component
 *
 * Displays pricing tier with features and upgrade button
 */

import React from 'react';

export interface SubscriptionPlanProps {
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  price: string;
  interval: string;
  features: string[];
  isCurrentTier: boolean;
  onUpgrade: () => void;
  disabled?: boolean;
}

export const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({
  tier,
  price,
  interval,
  features,
  isCurrentTier,
  onUpgrade,
  disabled = false,
}) => {
  const getTierStyles = () => {
    switch (tier) {
      case 'PRO':
        return {
          borderColor: 'border-blue-500',
          badgeBg: 'bg-blue-500',
          buttonBg: 'bg-blue-500 hover:bg-blue-600',
        };
      case 'ENTERPRISE':
        return {
          borderColor: 'border-purple-500',
          badgeBg: 'bg-purple-500',
          buttonBg: 'bg-purple-500 hover:bg-purple-600',
        };
      default:
        return {
          borderColor: 'border-gray-300',
          badgeBg: 'bg-gray-300',
          buttonBg: 'bg-gray-300 hover:bg-gray-400',
        };
    }
  };

  const styles = getTierStyles();

  return (
    <div
      className={`
        relative p-6 rounded-lg border-2 ${styles.borderColor}
        ${isCurrentTier ? 'ring-2 ring-green-500' : ''}
        transition-all duration-200
      `}
    >
      {/* Current Tier Badge */}
      {isCurrentTier && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
          CURRENT
        </div>
      )}

      {/* Tier Name */}
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier}</h3>

      {/* Price */}
      <div className="mb-4">
        <span className="text-4xl font-bold text-gray-900">{price}</span>
        <span className="text-gray-500 ml-2">/{interval}</span>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <svg
              className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Upgrade Button */}
      <button
        onClick={onUpgrade}
        disabled={disabled || isCurrentTier}
        className={`
          w-full py-2 px-4 rounded font-semibold text-white
          ${styles.buttonBg}
          ${(disabled || isCurrentTier) ? 'opacity-50 cursor-not-allowed' : ''}
          transition-colors duration-200
        `}
      >
        {isCurrentTier ? 'Current Plan' : 'Upgrade'}
      </button>
    </div>
  );
};
