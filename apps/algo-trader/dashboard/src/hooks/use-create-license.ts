/**
 * Hook for creating new license keys.
 * Handles form submission, loading states, and error management.
 */
import { useState, useCallback } from 'react';
import { useApiClient } from './use-api-client';

export interface CreateLicenseInput {
  name: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  expiresAt?: string;
  tenantId?: string;
}

export interface CreateLicenseResult {
  id: string;
  key: string;
  name: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'active';
  createdAt: string;
  expiresAt?: string;
  tenantId?: string;
}

interface UseCreateLicenseReturn {
  createLicense: (input: CreateLicenseInput) => Promise<CreateLicenseResult | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useCreateLicense(): UseCreateLicenseReturn {
  const { fetchApi } = useApiClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLicense = useCallback(async (input: CreateLicenseInput): Promise<CreateLicenseResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchApi<CreateLicenseResult>('/licenses', {
        method: 'POST',
        body: JSON.stringify(input),
      });

      if (!result) {
        setError('Failed to create license');
        return null;
      }

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchApi]);

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return {
    createLicense,
    loading,
    error,
    reset,
  };
}
