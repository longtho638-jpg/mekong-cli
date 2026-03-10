/**
 * Audit logs data fetching hook with loading and error states.
 * Fetches license audit logs from GET /api/v1/licenses/:id/audit endpoint.
 */
import { useState, useCallback, useEffect } from 'react';
import { useApiClient } from './use-api-client';

export interface AuditLog {
  id: string;
  licenseId: string;
  event: string;
  tier?: string;
  ip?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditLogFilters {
  eventType?: 'all' | 'created' | 'activated' | 'revoked' | 'api_call' | 'ml_feature' | 'rate_limit';
}

export function useAuditLogs(licenseId?: string) {
  const { fetchApi } = useApiClient();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async () => {
    if (!licenseId) {
      setLogs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi<{ logs: AuditLog[] }>(`/licenses/${licenseId}/audit`);
      if (data) {
        setLogs(data.logs);
      } else {
        setError('Failed to load audit logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [fetchApi, licenseId]);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  return {
    logs,
    loading,
    error,
    reload: loadAuditLogs,
  };
}
