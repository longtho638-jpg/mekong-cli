/**
 * Unit tests for License Management UI Components
 * Tests QuotaGauge, StatusBadge, TierBadge components and filter logic
 */
import { describe, test, expect } from '@jest/globals';

/**
 * Component simulation for testing (independent of React rendering)
 */

// StatusBadge component logic (extracted from license-list-table.tsx)
function getStatusStyle(status: 'active' | 'expired' | 'revoked') {
  const styles: Record<string, string> = {
    active: 'bg-profit/10 text-profit border-profit/40',
    expired: 'bg-loss/10 text-loss border-loss/40',
    revoked: 'bg-muted/10 text-muted border-muted/40',
  };
  return styles[status] || styles['revoked'];
}

// TierBadge component logic (extracted from license-list-table.tsx)
function getTierStyle(tier: 'FREE' | 'PRO' | 'ENTERPRISE') {
  const styles: Record<string, string> = {
    FREE: 'bg-muted/10 text-muted border-muted/40',
    PRO: 'bg-accent/10 text-accent border-accent/40',
    ENTERPRISE: 'bg-amber-500/10 text-amber-500 border-amber-500/40',
  };
  return styles[tier] || styles['FREE'];
}

// QuotaGauge calculation logic (extracted from quota-gauge.tsx)
function calculateUsagePercentage(used: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.min((used / limit) * 100, 100);
}

function getQuotaColorClass(percentage: number): 'bg-loss' | 'bg-warning' | 'bg-profit' {
  if (percentage >= 80) return 'bg-loss';
  if (percentage >= 50) return 'bg-warning';
  return 'bg-profit';
}

interface License {
  id: string;
  name: string;
  key: string;
  tier: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'active' | 'expired' | 'revoked';
  createdAt: string;
  expiresAt?: string;
  usageCount: number;
  maxUsage?: number;
}

function filterLicenses(licenses: License[], filters: { status?: string; tier?: string }): License[] {
  return licenses.filter((license) => {
    if (filters.status && filters.status !== 'all' && license.status !== filters.status) {
      return false;
    }
    if (filters.tier && filters.tier !== 'all' && license.tier !== filters.tier) {
      return false;
    }
    return true;
  });
}

function sortLicenses(
  licenses: License[],
  sortKey: keyof License,
  sortDir: 'asc' | 'desc'
): License[] {
  return [...licenses].sort((a, b) => {
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
}

describe('StatusBadge Component', () => {
  test('should return correct style for active status', () => {
    const style = getStatusStyle('active');
    expect(style).toBe('bg-profit/10 text-profit border-profit/40');
  });

  test('should return correct style for expired status', () => {
    const style = getStatusStyle('expired');
    expect(style).toBe('bg-loss/10 text-loss border-loss/40');
  });

  test('should return correct style for revoked status', () => {
    const style = getStatusStyle('revoked');
    expect(style).toBe('bg-muted/10 text-muted border-muted/40');
  });

  test('should handle unknown status gracefully', () => {
    // Type assertion to test edge case
    const style = getStatusStyle('unknown' as any);
    expect(style).toBe('bg-muted/10 text-muted border-muted/40');
  });

  test('should include border class in all styles', () => {
    expect(getStatusStyle('active')).toContain('border');
    expect(getStatusStyle('expired')).toContain('border');
    expect(getStatusStyle('revoked')).toContain('border');
  });
});

describe('TierBadge Component', () => {
  test('should return correct style for FREE tier', () => {
    const style = getTierStyle('FREE');
    expect(style).toBe('bg-muted/10 text-muted border-muted/40');
  });

  test('should return correct style for PRO tier', () => {
    const style = getTierStyle('PRO');
    expect(style).toBe('bg-accent/10 text-accent border-accent/40');
  });

  test('should return correct style for ENTERPRISE tier', () => {
    const style = getTierStyle('ENTERPRISE');
    expect(style).toBe('bg-amber-500/10 text-amber-500 border-amber-500/40');
  });

  test('should handle unknown tier gracefully (fallback to FREE)', () => {
    const style = getTierStyle('UNKNOWN' as any);
    expect(style).toBe('bg-muted/10 text-muted border-muted/40');
  });

  test('should include border class in all tier styles', () => {
    expect(getTierStyle('FREE')).toContain('border');
    expect(getTierStyle('PRO')).toContain('border');
    expect(getTierStyle('ENTERPRISE')).toContain('border');
  });
});

describe('QuotaGauge Component', () => {
  test('should calculate 0% when used is 0 and limit is 100', () => {
    const percentage = calculateUsagePercentage(0, 100);
    expect(percentage).toBe(0);
  });

  test('should calculate 50% when used is 50 and limit is 100', () => {
    const percentage = calculateUsagePercentage(50, 100);
    expect(percentage).toBe(50);
  });

  test('should calculate 100% when used equals limit', () => {
    const percentage = calculateUsagePercentage(100, 100);
    expect(percentage).toBe(100);
  });

  test('should cap percentage at 100% when used exceeds limit', () => {
    const percentage = calculateUsagePercentage(200, 100);
    expect(percentage).toBe(100);
  });

  test('should return 0% when limit is 0', () => {
    const percentage = calculateUsagePercentage(50, 0);
    expect(percentage).toBe(0);
  });

  test('should return 0% when limit is negative', () => {
    const percentage = calculateUsagePercentage(50, -100);
    expect(percentage).toBe(0);
  });

  test('should return 0% when used is 0 and limit is negative', () => {
    const percentage = calculateUsagePercentage(0, -100);
    expect(percentage).toBe(0);
  });

  test('should return correct color class for low usage (<50%)', () => {
    const percentage = calculateUsagePercentage(25, 100);
    const color = getQuotaColorClass(percentage);
    expect(color).toBe('bg-profit');
  });

  test('should return correct color class for medium usage (50-80%)', () => {
    const percentage = calculateUsagePercentage(65, 100);
    const color = getQuotaColorClass(percentage);
    expect(color).toBe('bg-warning');
  });

  test('should return correct color class for high usage (>80%)', () => {
    const percentage = calculateUsagePercentage(85, 100);
    const color = getQuotaColorClass(percentage);
    expect(color).toBe('bg-loss');
  });

  test('should return correct color class at exact 50% threshold', () => {
    const percentage = calculateUsagePercentage(50, 100);
    const color = getQuotaColorClass(percentage);
    expect(color).toBe('bg-warning');
  });

  test('should return correct color class at exact 80% threshold', () => {
    const percentage = calculateUsagePercentage(80, 100);
    const color = getQuotaColorClass(percentage);
    expect(color).toBe('bg-loss');
  });

  test('should handle circular gauge calculation', () => {
    // Circular gauge uses same percentage logic
    const value = 750;
    const max = 1000;
    const percentage = calculateUsagePercentage(value, max);
    expect(percentage).toBe(75);
  });
});

describe('Filter Logic', () => {
  const mocks: License[] = [
    {
      id: '1',
      name: 'License 1',
      key: 'key1',
      tier: 'FREE',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      usageCount: 100
    },
    {
      id: '2',
      name: 'License 2',
      key: 'key2',
      tier: 'PRO',
      status: 'active',
      createdAt: '2026-01-02T00:00:00Z',
      usageCount: 200
    },
    {
      id: '3',
      name: 'License 3',
      key: 'key3',
      tier: 'ENTERPRISE',
      status: 'revoked',
      createdAt: '2026-01-03T00:00:00Z',
      usageCount: 300
    },
    {
      id: '4',
      name: 'License 4',
      key: 'key4',
      tier: 'FREE',
      status: 'revoked',
      createdAt: '2026-01-04T00:00:00Z',
      usageCount: 400
    },
    {
      id: '5',
      name: 'License 5',
      key: 'key5',
      tier: 'PRO',
      status: 'expired',
      createdAt: '2026-01-05T00:00:00Z',
      usageCount: 500
    }
  ];

  test('should return all licenses when no filters applied', () => {
    const filtered = filterLicenses(mocks, { status: 'all', tier: 'all' });
    expect(filtered).toHaveLength(5);
  });

  test('should filter by status: active', () => {
    const filtered = filterLicenses(mocks, { status: 'active', tier: 'all' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((l) => l.status === 'active')).toBe(true);
  });

  test('should filter by status: revoked', () => {
    const filtered = filterLicenses(mocks, { status: 'revoked', tier: 'all' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((l) => l.status === 'revoked')).toBe(true);
  });

  test('should filter by status: expired', () => {
    const filtered = filterLicenses(mocks, { status: 'expired', tier: 'all' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe('expired');
  });

  test('should filter by tier: FREE', () => {
    const filtered = filterLicenses(mocks, { status: 'all', tier: 'FREE' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((l) => l.tier === 'FREE')).toBe(true);
  });

  test('should filter by tier: PRO', () => {
    const filtered = filterLicenses(mocks, { status: 'all', tier: 'PRO' });
    expect(filtered).toHaveLength(2);
    expect(filtered.every((l) => l.tier === 'PRO')).toBe(true);
  });

  test('should filter by tier: ENTERPRISE', () => {
    const filtered = filterLicenses(mocks, { status: 'all', tier: 'ENTERPRISE' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].tier).toBe('ENTERPRISE');
  });

  test('should apply both status and tier filters', () => {
    const filtered = filterLicenses(mocks, { status: 'active', tier: 'FREE' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].status).toBe('active');
    expect(filtered[0].tier).toBe('FREE');
  });

  test('should return empty array when no matches found', () => {
    const filtered = filterLicenses(mocks, { status: 'active', tier: 'ENTERPRISE' });
    expect(filtered).toHaveLength(0);
  });

  test('should handle filters with invalid values', () => {
    // Invalid status should not match any licenses
    const filtered = filterLicenses(mocks, { status: 'invalid', tier: 'all' });
    expect(filtered).toHaveLength(0);
  });
});

describe('Sort Logic', () => {
  const mocks: License[] = [
    {
      id: '1',
      name: 'Zebra',
      key: 'key1',
      tier: 'FREE',
      status: 'active',
      createdAt: '2026-01-05T00:00:00Z',
      usageCount: 300
    },
    {
      id: '2',
      name: 'Apple',
      key: 'key2',
      tier: 'PRO',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      usageCount: 100
    },
    {
      id: '3',
      name: 'Mango',
      key: 'key3',
      tier: 'ENTERPRISE',
      status: 'revoked',
      createdAt: '2026-01-03T00:00:00Z',
      usageCount: 200
    }
  ];

  test('should sort by name alphabetically (asc)', () => {
    const sorted = sortLicenses(mocks, 'name', 'asc');
    expect(sorted[0].name).toBe('Apple');
    expect(sorted[1].name).toBe('Mango');
    expect(sorted[2].name).toBe('Zebra');
  });

  test('should sort by name alphabetically (desc)', () => {
    const sorted = sortLicenses(mocks, 'name', 'desc');
    expect(sorted[0].name).toBe('Zebra');
    expect(sorted[1].name).toBe('Mango');
    expect(sorted[2].name).toBe('Apple');
  });

  test('should sort by usage count (asc)', () => {
    const sorted = sortLicenses(mocks, 'usageCount', 'asc');
    expect(sorted[0].usageCount).toBe(100);
    expect(sorted[1].usageCount).toBe(200);
    expect(sorted[2].usageCount).toBe(300);
  });

  test('should sort by usage count (desc)', () => {
    const sorted = sortLicenses(mocks, 'usageCount', 'desc');
    expect(sorted[0].usageCount).toBe(300);
    expect(sorted[1].usageCount).toBe(200);
    expect(sorted[2].usageCount).toBe(100);
  });

  test('should sort by created date (asc)', () => {
    const sorted = sortLicenses(mocks, 'createdAt', 'asc');
    expect(sorted[0].createdAt).toBe('2026-01-01T00:00:00Z');
    expect(sorted[1].createdAt).toBe('2026-01-03T00:00:00Z');
    expect(sorted[2].createdAt).toBe('2026-01-05T00:00:00Z');
  });

  test('should sort by created date (desc)', () => {
    const sorted = sortLicenses(mocks, 'createdAt', 'desc');
    expect(sorted[0].createdAt).toBe('2026-01-05T00:00:00Z');
    expect(sorted[1].createdAt).toBe('2026-01-03T00:00:00Z');
    expect(sorted[2].createdAt).toBe('2026-01-01T00:00:00Z');
  });

  test('should handle null/undefined expiresAt in sorting', () => {
    const licensesWithMissingExpire: License[] = [
      {
        id: '1',
        name: 'Test 1',
        key: 'key1',
        tier: 'FREE',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        usageCount: 100
        // No expiresAt
      },
      {
        id: '2',
        name: 'Test 2',
        key: 'key2',
        tier: 'FREE',
        status: 'active',
        createdAt: '2026-01-02T00:00:00Z',
        usageCount: 200,
        expiresAt: '2026-12-31T23:59:59Z'
      }
    ];

    const sorted = sortLicenses(licensesWithMissingExpire, 'expiresAt', 'asc');
    expect(sorted).toHaveLength(2);
  });

  test('should not mutate original array', () => {
    const original = [...mocks];
    sortLicenses(mocks, 'name', 'asc');
    expect(mocks).toEqual(original);
  });
});

describe('Integration: Complete Filter + Sort Workflow', () => {
  const licenses: License[] = [
    {
      id: '1',
      name: 'Z Production',
      key: 'raas-pro-001',
      tier: 'PRO',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      usageCount: 5000
    },
    {
      id: '2',
      name: 'A Staging',
      key: 'raas-free-001',
      tier: 'FREE',
      status: 'active',
      createdAt: '2026-02-01T00:00:00Z',
      usageCount: 1000
    },
    {
      id: '3',
      name: 'M Enterprise',
      key: 'raas-ent-001',
      tier: 'ENTERPRISE',
      status: 'revoked',
      createdAt: '2025-06-01T00:00:00Z',
      usageCount: 50000
    },
    {
      id: '4',
      name: 'B Dev',
      key: 'raas-pro-002',
      tier: 'PRO',
      status: 'expired',
      createdAt: '2026-03-01T00:00:00Z',
      usageCount: 2000
    }
  ];

  test('should filter active PRO licenses then sort by usage desc', () => {
    // Step 1: Filter
    const filtered = filterLicenses(licenses, { status: 'active', tier: 'PRO' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');

    // Step 2: Sort (would apply in real UI)
    const sorted = sortLicenses(filtered, 'usageCount', 'desc');
    expect(sorted[0].usageCount).toBe(5000);
  });

  test('should filter all tiers, then sort by name asc', () => {
    // Step 1: Filter by status only (all tiers)
    const filtered = filterLicenses(licenses, { status: 'active', tier: 'all' });
    expect(filtered).toHaveLength(2);

    // Step 2: Sort
    const sorted = sortLicenses(filtered, 'name', 'asc');
    expect(sorted[0].name).toBe('A Staging');
    expect(sorted[1].name).toBe('Z Production');
  });

  test('should handle empty license list', () => {
    const filtered = filterLicenses([], { status: 'all', tier: 'all' });
    expect(filtered).toHaveLength(0);

    const sorted = sortLicenses([], 'name', 'asc');
    expect(sorted).toHaveLength(0);
  });
});
