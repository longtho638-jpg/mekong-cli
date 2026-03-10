/**
 * License Status Display Component
 *
 * Shows current license tier, features, and expiration
 */

import React, { useState, useEffect } from 'react';

interface LicenseStatus {
  tier: string;
  valid: boolean;
  expiresAt?: string;
  features: string[];
}

export const LicenseStatus: React.FC = () => {
  const [license, setLicense] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLicenseStatus();
  }, []);

  const fetchLicenseStatus = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (!response.ok) throw new Error('Failed to fetch license status');
      const data = await response.json();
      setLicense(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse h-6 bg-gray-300 rounded w-1/2 mb-2"></div>
        <div className="animate-pulse h-4 bg-gray-300 rounded w-3/4"></div>
      </div>
    );
  }

  if (error || !license) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p className="font-bold">Error</p>
        <p>{error || 'Failed to load license status'}</p>
      </div>
    );
  }

  const getTierBadgeColor = () => {
    switch (license.tier) {
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'PRO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">License Status</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTierBadgeColor()}`}
        >
          {license.tier.toUpperCase()}
        </span>
      </div>

      {/* Validity */}
      <div className="mb-4">
        {license.valid ? (
          <div className="flex items-center text-green-600">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Active License</span>
          </div>
        ) : (
          <div className="flex items-center text-gray-600">
            <span>Free Tier</span>
          </div>
        )}
      </div>

      {/* Expiration */}
      {license.expiresAt && (
        <div className="mb-4 text-sm text-gray-600">
          <span className="font-semibold">Expires:</span>{' '}
          {new Date(license.expiresAt).toLocaleDateString()}
        </div>
      )}

      {/* Features */}
      <div>
        <h3 className="font-semibold text-gray-700 mb-2">Enabled Features:</h3>
        <div className="flex flex-wrap gap-2">
          {license.features.map((feature) => (
            <span
              key={feature}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
            >
              {feature.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
