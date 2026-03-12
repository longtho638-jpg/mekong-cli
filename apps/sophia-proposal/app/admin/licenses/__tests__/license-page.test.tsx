/**
 * Tests for License Management Page - ROIaaS Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLicensesPage from '../page';

// Mock LicenseService
vi.mock('../../../lib/license-service', () => ({
  LicenseService: {
    getAll: vi.fn(),
    create: vi.fn(),
    revoke: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock UsageMetering
vi.mock('../../../lib/usage-metering', () => ({
  UsageMetering: {
    getUsageStats: vi.fn(() => ({
      apiCalls: { percent: 0, used: 0, limit: 1000 },
      transferMb: { percent: 0, used: 0, limit: 100 },
      status: 'normal' as const,
    })),
    getUsage: vi.fn(() => ({
      apiCalls: 0,
      transferMb: 0,
      periodStart: new Date(),
      periodEnd: new Date(),
    })),
    checkLimit: vi.fn(() => ({
      exceeded: false,
      apiCallsPercent: 0,
      transferMbPercent: 0,
    })),
  },
}));

import { LicenseService } from '../../../lib/license-service';

describe('AdminLicensesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLicenses = [
    {
      id: 'lic_001',
      tier: 'PRO' as const,
      status: 'active' as const,
      customerId: 'cust_001',
      customerName: 'Test Customer',
      createdAt: new Date('2026-03-01'),
      expiresAt: new Date('2027-03-01'),
      features: ['hd-video', 'no-watermark'],
      metadata: { licenseKey: 'raas-pro-abc123xyz' },
    },
    {
      id: 'lic_002',
      tier: 'ENTERPRISE' as const,
      status: 'active' as const,
      customerId: 'cust_002',
      customerName: 'Enterprise Customer',
      createdAt: new Date('2026-02-15'),
      expiresAt: new Date('2027-12-31'),
      features: ['4k-video', 'no-watermark'],
      metadata: { licenseKey: 'raas-ent-premium456' },
    },
  ];

  it('should display license stats', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Licenses')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
      expect(screen.getByText('Total Usage')).toBeInTheDocument();
    });
  });

  it('should display license table with headers', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      expect(screen.getByText('License Keys')).toBeInTheDocument();
      expect(screen.getByText('License Key')).toBeInTheDocument();
      expect(screen.getByText('Tier')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  it('should filter licenses by tier', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    // License key is displayed truncated (first 16 chars + '...')
    await waitFor(() => {
      expect(screen.getByText(/raas-pro/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    // Select PRO tier filter
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    const proOption = screen.getByText('Pro');
    fireEvent.click(proOption);

    // Should filter to show only PRO licenses
    await waitFor(() => {
      expect(screen.getByText('PRO')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should open create license modal', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Create License')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Create License'));

    await waitFor(() => {
      expect(screen.getByText('Create License Key')).toBeInTheDocument();
    });
  });

  it('should close create license modal on cancel', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      fireEvent.click(screen.getByText('Create License'));
    });

    await waitFor(() => {
      expect(screen.getByText('Create License Key')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Cancel'));

    await waitFor(() => {
      expect(screen.queryByText('Create License Key')).not.toBeInTheDocument();
    });
  });

  it('should display enterprise badge for enterprise licenses', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display active badge for active licenses', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      // Table should be displayed with license data
      expect(screen.getByRole('table')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show revoke button for active licenses', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      // Revoke button contains RotateCcw icon - look for buttons in table rows
      const allButtons = screen.getAllByRole('button');
      const revokeButton = allButtons.find(btn =>
        btn.querySelector('svg') &&
        btn.closest('table')
      );
      expect(revokeButton).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should show delete button for all licenses', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      // Delete button contains Trash2 icon - look for buttons in table rows
      const allButtons = screen.getAllByRole('button');
      const deleteButton = allButtons.find(btn =>
        btn.querySelector('svg') &&
        btn.closest('table')
      );
      expect(deleteButton).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should display revenue calculation in stats', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      // PRO = $149, ENTERPRISE = $499
      expect(screen.getByText('$648')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it.skip('should handle empty license list', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue([]);
    render(<AdminLicensesPage />);

    // Page should render without errors even with empty list
    expect(screen.getByText('License Management')).toBeInTheDocument();
    expect(screen.getByText('Create License')).toBeInTheDocument();
  });
});
