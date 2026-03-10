---
phase: 4
title: "Create License Modal (Key Generation)"
complexity: SIMPLE
effort: 1h
status: pending
---

# Phase 4: Create License Modal — Key Generation Form

## Context

Admin needs to create new license keys with:
- Auto-generated UUID format OR custom key
- Tier selection (FREE/PRO/ENTERPRISE)
- Optional expiration date
- Optional tenant ID assignment

## Files to Create

| File | Action | Purpose |
|------|--------|---------|
| `dashboard/src/components/create-license-modal.tsx` | Create | Modal form |
| `dashboard/src/components/license-key-generator.tsx` | Create | Key preview component |

## Implementation Steps

### 4.1 Create Modal Component (`components/create-license-modal.tsx`)

```typescript
import { useState, ChangeEvent, FormEvent } from 'react';
import { useApiClient } from '../hooks/use-api-client';

interface CreateLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateLicenseModal({ isOpen, onClose, onCreated }: CreateLicenseModalProps) {
  const { fetchApi, loading } = useApiClient();
  const [tier, setTier] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('PRO');
  const [customKey, setCustomKey] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = await fetchApi<{ license: any }>('/api/v1/licenses', {
      method: 'POST',
      body: JSON.stringify({
        key: customKey || undefined,
        tier,
        tenantId: tenantId || undefined,
        expiresAt: expiresAt || undefined,
      }),
    });
    if (result?.license) {
      setGeneratedKey(result.license.key);
    }
  };

  const handleClose = () => {
    setGeneratedKey(null);
    setCustomKey('');
    setTenantId('');
    setExpiresAt('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-bg-card border border-bg-border rounded-lg p-6 w-full max-w-md">
        <h3 className="text-white text-lg font-bold mb-4">Create License Key</h3>

        {generatedKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-accent/10 border border-accent rounded">
              <p className="text-muted text-xs mb-1">Generated License Key</p>
              <p className="text-white font-mono text-sm break-all">{generatedKey}</p>
            </div>
            <p className="text-muted text-xs">
              ⚠️ Save this key securely. It cannot be shown again.
            </p>
            <button
              onClick={handleClose}
              className="w-full px-4 py-2 bg-accent text-black font-semibold rounded"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-muted text-xs block mb-1">Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as any)}
                className="w-full bg-bg-border border border-bg-border rounded px-3 py-2 text-white"
                required
              >
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="text-muted text-xs block mb-1">
                Custom Key (optional, leave empty for auto-generate)
              </label>
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="raas-pro-XXXX-XXXX"
                className="w-full bg-bg-border border border-bg-border rounded px-3 py-2 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-muted text-xs block mb-1">Tenant ID (optional)</label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="tenant-123"
                className="w-full bg-bg-border border border-bg-border rounded px-3 py-2 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-muted text-xs block mb-1">Expiration Date (optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full bg-bg-border border border-bg-border rounded px-3 py-2 text-white text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-bg-border rounded text-muted hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-accent text-black font-semibold rounded disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

## Success Criteria

- [ ] Modal opens/closes correctly
- [ ] Tier selection works (FREE/PRO/ENTERPRISE)
- [ ] Auto-generates key when custom key empty
- [ ] Custom key accepted when provided
- [ ] Tenant ID optional
- [ ] Expiration date optional
- [ ] Generated key shown once with warning
- [ ] OnCreated callback triggers table refresh

## Key Format

Auto-generated format (from backend):
```
raas-{tierPrefix}-{random}-{timestamp}
- FREE: raas-free-ABC123-XYZ789
- PRO: raas-rpp-ABC123-XYZ789
- ENTERPRISE: raas-rep-ABC123-XYZ789
```

## Related Files

- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/components/create-license-modal.tsx`
