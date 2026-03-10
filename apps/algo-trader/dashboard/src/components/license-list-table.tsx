/**
 * Sortable, filterable license list table with actions.
 * Displays licenses with tier/status badges, usage tracking, and row actions.
 */
import { useState, useMemo } from 'react';
import { License, LicenseFilters } from '../hooks/use-licenses';

type SortKey = keyof Pick<License, 'name' | 'key' | 'domain' | 'tier' | 'status' | 'usageCount' | 'createdAt' | 'expiresAt'>;
type SortDir = 'asc' | 'desc';

interface LicenseListTableProps {
  licenses: License[];
  loading?: boolean;
  onRevoke?: (licenseId: string) => Promise<void>;
  onDelete?: (licenseId: string) => Promise<void>;
  onViewAudit?: (licenseId: string) => void;
}

function formatUsage(usageCount: number, maxUsage?: number): string {
  if (maxUsage === undefined) {
    return `${usageCount} / ∞`;
  }
  return `${usageCount} / ${maxUsage}`;
}

function SortIcon({ dir }: { dir: SortDir | null }) {
  if (!dir) {
    return (
      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-muted/40">
        <path d="M5 1L8 4H2L5 1ZM5 9L2 6H8L5 9Z" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="text-accent">
      {dir === 'asc'
        ? <path d="M5 1L8 5H2L5 1Z" />
        : <path d="M5 9L2 5H8L5 9Z" />}
    </svg>
  );
}

const COLUMNS: { key: SortKey; label: string; align?: 'right' | 'center' }[] = [
  { key: 'name', label: 'Name' },
  { key: 'key', label: 'Key' },
  { key: 'domain', label: 'Domain' },
  { key: 'tier', label: 'Tier', align: 'center' },
  { key: 'status', label: 'Status', align: 'center' },
  { key: 'usageCount', label: 'Usage', align: 'right' },
  { key: 'createdAt', label: 'Created', align: 'right' },
  { key: 'expiresAt', label: 'Expires', align: 'right' },
];

export function LicenseListTable({
  licenses,
  loading = false,
  onRevoke,
  onDelete,
  onViewAudit,
}: LicenseListTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filters, setFilters] = useState<LicenseFilters>({ status: 'all', tier: 'all' });
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Filter licenses
  const filteredLicenses = useMemo(() => {
    return licenses.filter((license) => {
      if (filters.status && filters.status !== 'all' && license.status !== filters.status) {
        return false;
      }
      if (filters.tier && filters.tier !== 'all' && license.tier !== filters.tier) {
        return false;
      }
      return true;
    });
  }, [licenses, filters]);

  // Sort licenses
  const sortedLicenses = useMemo(() => {
    return [...filteredLicenses].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];

      let cmp: number;
      if (sortKey === 'usageCount') {
        cmp = (av as number) - (bv as number);
      } else if (sortKey === 'createdAt' || sortKey === 'expiresAt') {
        cmp = new Date(av as string).getTime() - new Date(bv as string).getTime();
      } else {
        cmp = String(av).localeCompare(String(bv));
      }

      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredLicenses, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  function handleFilterChange(type: 'status' | 'tier', value: string) {
    setFilters((prev) => ({ ...prev, [type]: value }));
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted font-mono">
        <svg className="animate-spin h-8 w-8 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm">Loading licenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <label className="text-muted text-xs uppercase tracking-wider">Status:</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="bg-bg-primary border border-bg-border text-white text-sm px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-muted text-xs uppercase tracking-wider">Tier:</label>
          <select
            value={filters.tier}
            onChange={(e) => handleFilterChange('tier', e.target.value)}
            className="bg-bg-primary border border-bg-border text-white text-sm px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="all">All</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>
        <div className="ml-auto text-muted text-xs">
          Showing {sortedLicenses.length} of {licenses.length} licenses
        </div>
      </div>

      {/* Table */}
      {sortedLicenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted font-mono bg-bg-card border border-bg-border rounded-lg">
          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24" className="mb-3 opacity-30">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="9" x2="9" y2="21" />
          </svg>
          <p className="text-sm">No licenses match the current filters</p>
          {(filters.status !== 'all' || filters.tier !== 'all') && (
            <button
              onClick={() => setFilters({ status: 'all', tier: 'all' })}
              className="mt-2 text-accent hover:text-accent/80 text-sm underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto bg-bg-card border border-bg-border rounded-lg">
          <table className="w-full min-w-[800px] text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-bg-border bg-bg-card/50">
                {COLUMNS.map(({ key, label, align }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className={`
                      px-3 py-3 text-muted cursor-pointer select-none
                      hover:text-white transition-colors whitespace-nowrap
                      ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}
                    `}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <SortIcon dir={sortKey === key ? sortDir : null} />
                    </span>
                  </th>
                ))}
                <th className="px-3 py-3 text-muted text-left text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLicenses.map((license) => (
                <tr
                  key={license.id}
                  className="border-b border-bg-border/50 hover:bg-bg-card/60 transition-colors"
                >
                  <td className="px-3 py-3 text-white font-semibold">{license.name}</td>
                  <td className="px-3 py-3 text-muted font-mono text-[10px]">{license.key}</td>
                  <td className="px-3 py-3 text-center text-muted">
                    {license.domain || <span className="text-muted/40">—</span>}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <TierBadge tier={license.tier} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={license.status} />
                  </td>
                  <td className="px-3 py-3 text-right text-muted">
                    {formatUsage(license.usageCount, license.maxUsage)}
                  </td>
                  <td className="px-3 py-3 text-right text-muted">
                    {new Date(license.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-3 py-3 text-right text-muted">
                    {license.expiresAt
                      ? new Date(license.expiresAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Never'}
                  </td>
                  <td className="px-3 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setActionMenuOpen(actionMenuOpen === license.id ? null : license.id)}
                        className="text-muted hover:text-white p-1 rounded hover:bg-bg-border transition-colors"
                        title="Actions"
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <circle cx="8" cy="3" r="1.5" />
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="8" cy="13" r="1.5" />
                        </svg>
                      </button>
                      {actionMenuOpen === license.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActionMenuOpen(null)}
                          />
                          <div className="absolute right-0 top-8 z-20 bg-bg-card border border-bg-border rounded shadow-lg min-w-[140px]">
                            <button
                              onClick={() => {
                                onRevoke?.(license.id);
                                setActionMenuOpen(null);
                              }}
                              disabled={license.status === 'revoked'}
                              className="w-full px-4 py-2 text-left text-xs text-white hover:bg-bg-border disabled:opacity-50 disabled:cursor-not-allowed first:rounded-t"
                            >
                              Revoke License
                            </button>
                            <button
                              onClick={() => {
                                onViewAudit?.(license.id);
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs text-white hover:bg-bg-border"
                            >
                              View Audit Log
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete license "${license.name}"? This cannot be undone.`)) {
                                  onDelete?.(license.id);
                                }
                                setActionMenuOpen(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs text-loss hover:bg-bg-border rounded-b"
                            >
                              Delete License
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: License['status'] }) {
  const styles = {
    active: 'bg-profit/10 text-profit border-profit/40',
    expired: 'bg-loss/10 text-loss border-loss/40',
    revoked: 'bg-muted/10 text-muted border-muted/40',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${styles[status]}`}>
      {status}
    </span>
  );
}

function TierBadge({ tier }: { tier: License['tier'] }) {
  const styles = {
    FREE: 'bg-muted/10 text-muted border-muted/40',
    PRO: 'bg-accent/10 text-accent border-accent/40',
    ENTERPRISE: 'bg-amber-500/10 text-amber-500 border-amber-500/40',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${styles[tier]}`}>
      {tier}
    </span>
  );
}
