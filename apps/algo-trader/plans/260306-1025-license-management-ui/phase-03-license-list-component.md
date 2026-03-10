---
phase: 3
title: "License List Component (Table View)"
complexity: MODERATE
effort: 2h
status: completed
---

# Phase 3: License List Component — Sortable/Filterable Table

## Context

Need a table component to display all licenses with:
- Sortable columns (key, tier, status, created, expires)
- Filter by status (active/revoked/expired) and tier (FREE/PRO/ENTERPRISE)
- Actions: View Details, Revoke, Delete

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `dashboard/src/hooks/use-licenses.ts` | Created | API hook for licenses (replaces use-license-api.ts) |
| `dashboard/src/components/license-list-table.tsx` | Created | Table component with filters + actions |
| `dashboard/src/pages/license-page.tsx` | Modified | Integrated LicenseListTable component |

## Implementation Summary

### Components Created:
1. **use-licenses.ts** - React hook with:
   - `useLicenses()` returning licenses, loading, error states
   - `revokeLicense(id)` and `deleteLicense(id)` actions
   - Auto-fetch on mount

2. **license-list-table.tsx** - Table component with:
   - Sortable columns (name, key, tier, status, usage, createdAt, expiresAt)
   - Status filter (All/Active/Expired/Revoked)
   - Tier filter (All/FREE/PRO/ENTERPRISE)
   - Actions dropdown menu (Revoke, View Audit, Delete)
   - Loading and empty states
   - Integrated StatusBadge and TierBadge components

### Page Updated:
- **license-page.tsx** - Now uses:
   - `useLicenses()` hook for data fetching
   - `LicenseListTable` component
   - Error handling display
   -保留了 audit-logs and analytics tabs

## Success Criteria

- [x] Table displays all licenses with sortable columns
- [x] Filter by status and tier works
- [x] Revoke button triggers API call
- [x] Delete button triggers API call
- [x] Loading state shown during fetch
- [x] Empty state shown when no results
- [x] Actions dropdown menu implemented

## Build Status

- TypeScript: PASS (npx tsc --noEmit)
- Build: PASS (npm run build)

## Implementation Steps

### 3.1 Create API Hook (`hooks/use-license-api.ts`)

```typescript
import { useState, useCallback } from 'react';

export interface License {
  id: string;
  key: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'active' | 'revoked' | 'expired';
  tenantId?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export function useLicenseApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLicenses = useCallback(async (
    take = 100,
    skip = 0,
    status?: string,
    tier?: string
  ): Promise<License[]> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        take: take.toString(),
        skip: skip.toString(),
        ...(status && { status }),
        ...(tier && { tier }),
      });
      const res = await fetch(`/api/v1/licenses?${params}`);
      if (!res.ok) throw new Error('Failed to fetch licenses');
      const data = await res.json();
      return data.licenses;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const revokeLicense = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/licenses/${id}/revoke`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const deleteLicense = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/v1/licenses/${id}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  return { fetchLicenses, revokeLicense, deleteLicense, loading, error };
}
```

### 3.2 Create License Page (`pages/license-page.tsx`)

```typescript
import { useState, useEffect } from 'react';
import { useLicenseApi, type License } from '../hooks/use-license-api';
import { LicenseListTable } from '../components/license-list-table';
import { LicenseFilters } from '../components/license-filters';
import { CreateLicenseModal } from '../components/create-license-modal';

export function LicensePage() {
  const { fetchLicenses, revokeLicense, deleteLicense, loading } = useLicenseApi();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filters, setFilters] = useState({ status: '', tier: '' });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadLicenses = async () => {
    const data = await fetchLicenses(100, 0, filters.status || undefined, filters.tier || undefined);
    setLicenses(data);
  };

  useEffect(() => {
    loadLicenses();
  }, [filters]);

  const handleRevoke = async (id: string, reason?: string) => {
    const success = await revokeLicense(id, reason);
    if (success) loadLicenses();
  };

  const handleDelete = async (id: string) => {
    const success = await deleteLicense(id);
    if (success) loadLicenses();
  };

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white text-lg font-bold tracking-tight">License Management</h2>
          <p className="text-muted text-xs mt-0.5">RaaS admin dashboard</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-accent text-black font-semibold rounded hover:opacity-90"
        >
          + Create License
        </button>
      </div>

      {/* Filters */}
      <LicenseFilters filters={filters} onFiltersChange={setFilters} />

      {/* Table */}
      <LicenseListTable
        licenses={licenses}
        loading={loading}
        onRevoke={handleRevoke}
        onDelete={handleDelete}
      />

      {/* Create Modal */}
      <CreateLicenseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={loadLicenses}
      />
    </div>
  );
}
```

### 3.3 Create Filters Component (`components/license-filters.tsx`)

```typescript
import { ChangeEvent } from 'react';

interface Filters {
  status: string;
  tier: string;
}

interface LicenseFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export function LicenseFilters({ filters, onFiltersChange }: LicenseFiltersProps) {
  const handleStatusChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, status: e.target.value });
  };

  const handleTierChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, tier: e.target.value });
  };

  return (
    <div className="flex gap-3 flex-wrap">
      <div>
        <label className="text-muted text-xs block mb-1">Status</label>
        <select
          value={filters.status}
          onChange={handleStatusChange}
          className="bg-bg-card border border-bg-border rounded px-3 py-1.5 text-sm text-white"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="revoked">Revoked</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      <div>
        <label className="text-muted text-xs block mb-1">Tier</label>
        <select
          value={filters.tier}
          onChange={handleTierChange}
          className="bg-bg-card border border-bg-border rounded px-3 py-1.5 text-sm text-white"
        >
          <option value="">All</option>
          <option value="FREE">Free</option>
          <option value="PRO">Pro</option>
          <option value="ENTERPRISE">Enterprise</option>
        </select>
      </div>
    </div>
  );
}
```

### 3.4 Create Table Component (`components/license-list-table.tsx`)

```typescript
import { useState } from 'react';
import { License } from '../hooks/use-license-api';

interface LicenseListTableProps {
  licenses: License[];
  loading: boolean;
  onRevoke: (id: string, reason?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function LicenseListTable({ licenses, loading, onRevoke, onDelete }: LicenseListTableProps) {
  const [sortBy, setSortBy] = useState<keyof License>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = [...licenses].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    const dir = sortDir === 'asc' ? 1 : -1;
    if (aVal < bVal) return -1 * dir;
    if (aVal > bVal) return 1 * dir;
    return 0;
  });

  const handleSort = (key: keyof License) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-profit';
      case 'revoked': return 'text-loss';
      case 'expired': return 'text-muted';
      default: return 'text-white';
    }
  };

  return (
    <div className="bg-bg-card border border-bg-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-bg-border">
          <tr>
            {['key', 'tier', 'status', 'tenantId', 'expiresAt', 'createdAt'].map((key) => (
              <th
                key={key}
                onClick={() => handleSort(key as keyof License)}
                className="px-4 py-3 text-left text-muted cursor-pointer hover:text-white"
              >
                {key} {sortBy === key ? (sortDir === 'asc' ? '↑' : '↓') : ''}
              </th>
            ))}
            <th className="px-4 py-3 text-left text-muted">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">Loading...</td></tr>
          ) : sorted.length === 0 ? (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No licenses found</td></tr>
          ) : (
            sorted.map((license) => (
              <tr key={license.id} className="border-t border-bg-border">
                <td className="px-4 py-3 font-mono text-xs">{license.key}</td>
                <td className="px-4 py-3">{license.tier}</td>
                <td className={`px-4 py-3 ${statusColor(license.status)}`}>{license.status}</td>
                <td className="px-4 py-3 font-mono text-xs">{license.tenantId || '-'}</td>
                <td className="px-4 py-3 text-muted">{license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Never'}</td>
                <td className="px-4 py-3 text-muted">{new Date(license.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onRevoke(license.id, 'Admin revoked')}
                    className="text-loss hover:underline mr-3"
                  >
                    Revoke
                  </button>
                  <button
                    onClick={() => onDelete(license.id)}
                    className="text-muted hover:text-white"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
```

## Success Criteria

- [ ] Table displays all licenses with sortable columns
- [ ] Filter by status and tier works
- [ ] Revoke button triggers API call
- [ ] Delete button triggers API call
- [ ] Loading state shown during fetch
- [ ] Empty state shown when no results

## Related Files

- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/pages/license-page.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/components/license-list-table.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/components/license-filters.tsx`
- `/Users/macbookprom1/mekong-cli/apps/algo-trader/dashboard/src/hooks/use-license-api.ts`
