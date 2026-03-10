---
title: "License Management UI Implementation"
description: "Activate/revoke licenses, display usage quotas, RaaS Gateway integration"
status: pending
priority: P2
effort: 6h
branch: master
tags: [license, ui, raas-gateway, dashboard]
created: 2026-03-09
---

# License Management UI Implementation Plan

## Overview

Phase 2: License Management UI với RaaS Gateway integration. Thêm chức năng:
1. **View Licenses** - Hiển thị status, domain, usage limits vs quota
2. **Activate Licenses** - Nhập license key, validate qua RaaS Gateway
3. **Revoke Licenses** - Revoke active licenses với confirmation

## Files to Modify/Create

### Backend (Node.js/Fastify)

| File | Action | Purpose |
|------|--------|---------|
| `src/db/queries/license-queries.ts` | Modify | Thêm `domain`, `overageUnits`, `overageAllowed` fields |
| `src/api/routes/license-management-routes.ts` | Modify | Thêm `/activate` endpoint, JWT validation |
| `src/lib/raas-gateway-kv-client.ts` | Already exists | Dùng cho usage tracking |

### Frontend (React/TypeScript)

| File | Action | Purpose |
|------|--------|---------|
| `dashboard/src/hooks/use-licenses.ts` | Modify | Thêm `activateLicense()`, domain/overage fields |
| `dashboard/src/hooks/use-api-client.ts` | Modify | Thêm JWT auth header support |
| `dashboard/src/components/license-list-table.tsx` | Modify | Domain column, overage status, activate action |
| `dashboard/src/components/activate-license-modal.tsx` | Create | Modal nhập license key |
| `dashboard/src/pages/license-page.tsx` | Modify | Integrate activate modal |

## Implementation Steps

### Step 1: Backend Schema Updates (30 min)

**File:** `src/db/queries/license-queries.ts`

```typescript
// Thêm vào LicenseCreateInput interface
export interface LicenseCreateInput {
  key: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  tenantId?: string;
  expiresAt?: Date;
  metadata?: Prisma.InputJsonValue;
  domain?: string;              // NEW
  overageUnits?: number;        // NEW
  overageAllowed?: boolean;     // NEW
}
```

**File:** `src/api/routes/license-management-routes.ts`

Thêm endpoint activate license:

```typescript
// POST /api/v1/licenses/activate
fastify.post('/api/v1/licenses/activate', {
  handler: async (request, reply) => {
    const { key, domain } = request.body as { key: string; domain?: string };

    // 1. Validate license key format
    // 2. Call RaaS Gateway KV để check suspension/usage
    // 3. Generate JWT token cho license
    // 4. Update license với domain
    // 5. Return JWT + license info
  }
})
```

### Step 2: Frontend Hook Updates (45 min)

**File:** `dashboard/src/hooks/use-licenses.ts`

```typescript
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
  domain?: string;              // NEW
  overageUnits?: number;        // NEW
  overageAllowed?: boolean;     // NEW
}

// Thêm method
const activateLicense = useCallback(async (key: string, domain?: string) => {
  const result = await fetchApi<License & { jwt: string }>('/licenses/activate', {
    method: 'POST',
    body: JSON.stringify({ key, domain }),
  });
  return result || null;
}, [fetchApi]);

return {
  // ... existing
  activateLicense,
};
```

### Step 3: API Client JWT Support (15 min)

**File:** `dashboard/src/hooks/use-api-client.ts`

```typescript
export function useApiClient() {
  const [loading, setLoading] = useState(false);
  const [jwtToken, setJwtToken] = useState<string | null>(null);

  const fetchApi = useCallback(async <T>(path: string, options?: RequestInit): Promise<T | null> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(jwtToken ? { 'Authorization': `Bearer ${jwtToken}` } : {}),
      ...options?.headers,
    };

    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers,
    });
    // ... rest of logic
  }, [jwtToken]);

  const setToken = useCallback((token: string) => setJwtToken(token), []);

  return { fetchApi, loading, setToken };
}
```

### Step 4: Create Activate License Modal (60 min)

**File:** `dashboard/src/components/activate-license-modal.tsx`

```typescript
interface ActivateLicenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (license: License, jwt: string) => void;
}

export function ActivateLicenseModal({ open, onClose, onSuccess }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { activateLicense } = useLicenses();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await activateLicense(licenseKey.trim(), domain.trim() || undefined);
      if (result) {
        onSuccess(result, result.jwt);
        setLicenseKey('');
        setDomain('');
      } else {
        setError('Invalid license key or activation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Modal UI similar to CreateLicenseModal
    // Fields: License Key (required), Domain (optional)
    // Success: Show license details + JWT token (copied to clipboard)
  );
}
```

### Step 5: Update License List Table (45 min)

**File:** `dashboard/src/components/license-list-table.tsx`

1. **Thêm Domain column:**

```typescript
const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'key', label: 'Key' },
  { key: 'domain', label: 'Domain' },  // NEW
  { key: 'tier', label: 'Tier', align: 'center' },
  // ... rest
];

// Trong row render:
<td className="px-3 py-3 text-right text-muted">
  {license.domain || <span className="text-muted/40">—</span>}
</td>
```

2. **Thêm overage status badge:**

```typescript
function OverageBadge({ overageUnits, overageAllowed }: { overageUnits?: number; overageAllowed?: boolean }) {
  if (!overageAllowed) return null;
  return (
    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-500 border-amber-500/40">
      +{overageUnits || 0} overage
    </span>
  );
}
```

3. **Thêm "Activate" action vào menu:**

```typescript
<button
  onClick={() => {
    onActivate?.(license.id);
    setActionMenuOpen(null);
  }}
  disabled={license.status !== 'active'}
  className="w-full px-4 py-2 text-left text-xs text-white hover:bg-bg-border disabled:opacity-50"
>
  {license.status === 'active' ? 'Activate License' : 'Already Inactive'}
</button>
```

### Step 6: Update License Page (30 min)

**File:** `dashboard/src/pages/license-page.tsx`

```typescript
import { ActivateLicenseModal } from '../components/activate-license-modal';

export function LicensePage() {
  const [activateModalOpen, setActivateModalOpen] = useState(false);

  function handleActivateLicense() {
    setActivateModalOpen(true);
  }

  function handleActivateSuccess(license: License, jwt: string) {
    setSuccessMessage(`License activated: ${license.name}`);
    setActivateModalOpen(false);
    reload();
  }

  return (
    // ... existing UI
    <button onClick={handleActivateLicense} className="...">
      Activate License
    </button>

    <ActivateLicenseModal
      open={activateModalOpen}
      onClose={() => setActivateModalOpen(false)}
      onSuccess={handleActivateSuccess}
    />
  );
}
```

## RaaS Gateway Integration

### KV Storage Structure

```typescript
// Usage counter: raas:counter:{licenseKey}:{YYYY-MM}:{metric}
await raasKVClient.getCounter(licenseKey, 'api_calls', '2026-03');

// Suspension state: raas:suspension:{licenseKey}
const suspension = await raasKVClient.getSuspension(licenseKey);
// { suspended: false, overageUnits: 150, overageAllowed: true }

// Overage config: raas:overage_config:{licenseKey}
const config = await raasKVClient.getOverageConfig(licenseKey);
// { enabled: true, maxOveragePercent: 150, pricePerUnit: 0.01 }
```

### JWT Token Flow

```
1. User enters license key in UI
2. Frontend → POST /api/v1/licenses/activate { key, domain }
3. Backend validates key against DB
4. Backend calls RaaS KV để check suspension/usage
5. Backend generates JWT với claims:
   {
     sub: licenseId,
     tenant_id: license.tenantId,
     tier: license.tier,
     exp: Date.now() + 24h
   }
6. Backend returns { license, jwt }
7. Frontend lưu JWT, dùng cho subsequent API calls
```

## Success Criteria

| Criterion | Verification |
|-----------|-------------|
| License list shows domain column | Visual inspection, 0 `any` types |
| Activate modal validates license key | Test với valid/invalid keys |
| JWT stored và dùng cho API calls | Check Network tab headers |
| Revoke updates UI immediately | Row status changes without refresh |
| Overage status visible | Badge shows when `overageAllowed: true` |
| All TypeScript compile | `npm run build` = 0 errors |
| No console.log/errors | `grep -r "console\." dashboard/src` = 0 |

## Testing Approach

### Unit Tests

```typescript
// tests/unit/activate-license-modal.test.tsx
describe('ActivateLicenseModal', () => {
  it('shows error for invalid license key', async () => {
    // Mock API return null
    // Render modal, submit invalid key
    // Assert error message visible
  });

  it('calls onSuccess with license + JWT on success', async () => {
    // Mock API return { license, jwt }
    // Submit form
    // Assert onSuccess called with correct args
  });
});
```

### Integration Tests

```typescript
// tests/integration/license-management-ui-e2e.test.ts
describe('License Management E2E', () => {
  it('activates license and shows in list', async () => {
    // Navigate to /licenses
    // Click "Activate License"
    // Enter valid key
    // Assert row appears with correct status
  });

  it('revokes license with confirmation', async () => {
    // Click actions menu → Revoke
    // Confirm dialog
    // Assert status changes to "revoked"
  });
});
```

### Manual Testing Checklist

- [ ] Activate license với valid key → Success toast
- [ ] Activate license với invalid key → Error message
- [ ] Enter domain during activation → Domain saved
- [ ] Revoke license → Confirmation → Status updates
- [ ] Domain column hiển thị đúng giá trị
- [ ] Overage badge hiển thị khi có overage
- [ ] JWT token được lưu vào localStorage/session
- [ ] Subsequent API calls include Authorization header

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| RaaS KV không available | High | Fallback to DB-only validation, log warning |
| JWT token expired | Medium | Auto-refresh token sau 24h |
| Domain validation fails | Low | Allow empty domain, make optional |
| CORS issues với RaaS Gateway | Medium | Proxy qua backend thay vì direct call |

## Next Steps

1. **Phase 3:** Usage Analytics Dashboard - Hiển thị biểu đồ usage trends
2. **Phase 4:** Quota Management - Allow admins to adjust quotas
3. **Phase 5:** Alerts & Notifications - Email/slack khi sắp vượt quota

## Unresolved Questions

1. **Domain validation:** Có cần validate domain format (regex) không?
2. **JWT expiration:** Nên set bao lâu? (đang đề xuất 24h)
3. **Multiple activations:** 1 license key có thể activate nhiều domains không?
4. **RaaS Gateway URL:** Cần confirm `raas.agencyos.network` hay local endpoint?
