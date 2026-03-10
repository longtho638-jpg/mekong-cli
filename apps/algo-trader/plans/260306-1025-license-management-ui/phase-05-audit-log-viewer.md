---
phase: 5
title: "Audit Log Viewer Component"
complexity: MODERATE
effort: 1.5h
status: pending
---

# Phase 5: Audit Log Viewer — License Event Timeline

## Context

Each license has audit logs tracking:
- Creation events
- Activation/deactivation
- Revocation with reason
- Tier changes
- Usage events

Need timeline view for compliance and debugging.

## Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `dashboard/src/components/audit-log-viewer.tsx` | Create | Timeline component |
| `dashboard/src/hooks/use-audit-log-api.ts` | Create | API hook |

## Implementation Steps

### 5.1 Create Audit Log API Hook (`hooks/use-audit-log-api.ts`)

```typescript
import { useState, useCallback } from 'react';

export interface AuditLog {
  id: string;
  licenseId: string;
  event: string;
  tier?: string;
  ip?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export function useAuditLogApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async (licenseId: string): Promise<AuditLog[]> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/licenses/${licenseId}/audit`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      return data.logs;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchAuditLogs, loading, error };
}
```

### 5.2 Create Audit Log Viewer Component (`components/audit-log-viewer.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { useAuditLogApi, type AuditLog } from '../hooks/use-audit-log-api';

interface AuditLogViewerProps {
  licenseId: string;
  onClose: () => void;
}

export function AuditLogViewer({ licenseId, onClose }: AuditLogViewerProps) {
  const { fetchAuditLogs, loading } = useAuditLogApi();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetchAuditLogs(licenseId).then(setLogs);
  }, [licenseId]);

  const eventColor = (event: string) => {
    switch (event) {
      case 'created': return 'bg-accent/20 text-accent';
      case 'activated': return 'bg-profit/20 text-profit';
      case 'revoked': return 'bg-loss/20 text-loss';
      case 'tier_changed': return 'bg-warning/20 text-warning';
      default: return 'bg-bg-border text-muted';
    }
  };

  const formatMetadata = (metadata?: Record<string, any>) => {
    if (!metadata) return null;
    return Object.entries(metadata).map(([key, value]) => (
      <span key={key} className="text-xs text-muted ml-2">
        {key}: {JSON.stringify(value)}
      </span>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-bg-card border border-bg-border rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-bold">Audit Log</h3>
          <button onClick={onClose} className="text-muted hover:text-white">✕</button>
        </div>

        {loading ? (
          <div className="text-center text-muted py-8">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-muted py-8">No audit logs found</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-3 rounded border ${eventColor(log.event)} border-transparent`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{log.event}</span>
                  <span className="text-xs text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-xs space-y-1">
                  {log.tier && <div>Tier: {log.tier}</div>}
                  {log.ip && <div>IP: {log.ip}</div>}
                  {log.metadata && formatMetadata(log.metadata)}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-bg-border">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-bg-border rounded text-muted hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

### 5.3 Integrate with License Table

Add "View Audit" button to `license-list-table.tsx` actions column:

```typescript
<button
  onClick={() => setShowAuditViewer(true)}
  className="text-muted hover:text-white mr-3"
>
  Audit
</button>

// After Delete button, add:
{showAuditViewer && (
  <AuditLogViewer
    licenseId={selectedLicenseId}
    onClose={() => setShowAuditViewer(false)}
  />
)}
```

## Success Criteria

- [ ] Audit logs load per license
- [ ] Timeline shows events chronologically
- [ ] Event types color-coded
- [ ] Metadata displayed (reason for revocation, etc.)
- [ ] Modal closes properly
- [ ] Loading and empty states handled

## Event Types

| Event | Color | Description |
|-------|-------|-------------|
| `created` | Accent (cyan) | License key generated |
| `activated` | Profit (green) | Subscription activated |
| `revoked` | Loss (red) | License revoked |
| `tier_changed` | Warning (yellow) | Tier upgrade/downgrade |
| `validation_failed` | Muted | Failed validation attempt |
| `quota_exceeded` | Muted | Usage quota exceeded |

## Related Files

- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/components/audit-log-viewer.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/hooks/use-audit-log-api.ts`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/components/license-list-table.tsx`
