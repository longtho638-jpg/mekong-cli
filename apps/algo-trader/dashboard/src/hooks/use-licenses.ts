/**
 * License data fetching hook with loading and error states.
 * Uses useState pattern consistent with project conventions.
 */
import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from './use-api-client';

export interface License {
  id: string;
  name: string;
  key: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt?: string;
  usageCount: number;
  maxUsage?: number;
  userId?: string;
  updatedAt?: string;
  domain?: string;              // NEW: Associated domain
  overageUnits?: number;        // NEW: Overage units consumed
  overageAllowed?: boolean;     // NEW: Whether overage is allowed
}

export interface ActivateLicenseResult extends License {
  jwt: string;                  // JWT token for API calls
  success?: boolean;            // From RaaS Gateway response
  activatedAt?: string;         // Activation timestamp
}

export interface LicenseFilters {
  status?: 'all' | 'active' | 'expired' | 'revoked';
  tier?: 'all' | 'FREE' | 'PRO' | 'ENTERPRISE';
}

export function useLicenses() {
  const { fetchApi, setToken } = useApiClient();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLicenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<License[]>('/licenses');
      if (data) {
        setLicenses(data);
      } else {
        setError('Failed to load licenses');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  const revokeLicense = useCallback(async (licenseId: string) => {
    const result = await fetchApi<License>(`/licenses/${licenseId}/revoke`, {
      method: 'POST',
    });
    if (result) {
      setLicenses((prev) => prev.map((l) => (l.id === licenseId ? { ...l, status: 'revoked' as const } : l)));
    }
    return !!result;
  }, [fetchApi]);

  const deleteLicense = useCallback(async (licenseId: string) => {
    const success = await fetchApi(`/licenses/${licenseId}`, {
      method: 'DELETE',
    });
    if (success) {
      setLicenses((prev) => prev.filter((l) => l.id !== licenseId));
    }
    return !!success;
  }, [fetchApi]);

  const activateLicense = useCallback(async (key: string, domain?: string, mkApiKey?: string): Promise<ActivateLicenseResult | null> => {
    // Option 1: Call local backend endpoint (existing)
    // Option 2: Call RaaS Gateway directly with mk_ API key

    const raasGatewayUrl = import.meta.env.VITE_RAAS_GATEWAY_URL || 'https://raas.agencyos.network';

    // If mkApiKey provided, call RaaS Gateway directly
    if (mkApiKey) {
      try {
        const response = await fetch(`${raasGatewayUrl}/v2/license/activate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': mkApiKey,
          },
          body: JSON.stringify({ licenseKey: key, domain }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Activation failed');
        }

        // Map RaaS Gateway response to ActivateLicenseResult
        const result: ActivateLicenseResult = {
          id: data.licenseKey || key,
          name: `License ${key.slice(0, 8)}...`,
          key: data.licenseKey || key,
          tier: (data.tier as 'FREE' | 'PRO' | 'ENTERPRISE') || 'FREE',
          status: 'active',
          createdAt: data.activatedAt || new Date().toISOString(),
          usageCount: 0,
          domain: data.domain,
          jwt: '', // RaaS Gateway doesn't return JWT, will need to get from local backend
          success: data.success,
          activatedAt: data.activatedAt,
        };

        return result;
      } catch (err) {
        console.error('RaaS Gateway activation failed:', err);
        throw err;
      }
    }

    // Fallback to local backend
    const result = await fetchApi<ActivateLicenseResult>('/licenses/activate', {
      method: 'POST',
      body: JSON.stringify({ key, domain }),
    });

    if (result) {
      setToken(result.jwt);
    }
    return result || null;
  }, [fetchApi, setToken]);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  return {
    licenses,
    loading,
    error,
    reload: loadLicenses,
    revokeLicense,
    deleteLicense,
    activateLicense,
  };
}
