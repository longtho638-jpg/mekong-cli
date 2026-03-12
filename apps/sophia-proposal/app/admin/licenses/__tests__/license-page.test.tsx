/**
 * Tests for License Management Page - ROIaaS Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminLicensesPage from '../page';
import { LicenseService } from '../../../lib/license-service';

// Mock LicenseService
vi.mock('../../../lib/license-service', () => ({
  LicenseService: {
    getAll: vi.fn(),
    create: vi.fn(),
    revoke: vi.fn(),
    delete: vi.fn(),
    getStats: vi.fn(),
  },
}));

describe('AdminLicensesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockLicenses = [
    {
      id: '1',
      tier: 'PRO' as const,
      status: 'active' as const,
      createdAt: new Date('2026-03-01'),
      expiresAt: new Date('2027-03-01'),
      metadata: { licenseKey: 'raas-pro-abc123xyz' },
    },
    {
      id: '2',
      tier: 'ENTERPRISE' as const,
      status: 'active' as const,
      createdAt: new Date('2026-02-15'),
      expiresAt: new Date('2027-12-31'),
      metadata: { licenseKey: 'raas-ent-premium456' },
    },
  ];

  it('should render loading state initially', async () => {
    // Mock empty license list - loading state shows during async init
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue([]);
    const { container } = render(<AdminLicensesPage />);

    // Loading state appears during async initialization
    await waitFor(() => {
      const loader = container.querySelector('.animate-spin');
      expect(loader).toBeInTheDocument();
    });
  });

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

    await waitFor(() => {
      expect(screen.getByText(/raas-pro-abc123xyz/i)).toBeInTheDocument();
    }, { timeout: 2000 });

    // Select PRO tier filter
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);

    const proOption = screen.getByText('Pro');
    fireEvent.click(proOption);

    // Should filter to show only PRO licenses
    await waitFor(() => {
      expect(screen.getByText(/PRO/i)).toBeInTheDocument();
    }, { timeout: 2000 });
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
    }, { timeout: 2000 });
  });

  it('should display active badge for active licenses', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      expect(screen.getByText('active')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show revoke button for active licenses', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      expect(revokeButtons.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should show delete button for all licenses', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
    }, { timeout: 2000 });
  });

  it('should display revenue calculation in stats', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue(mockLicenses);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      // PRO = $149, ENTERPRISE = $499
      expect(screen.getByText('$648')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should handle empty license list', async () => {
    (LicenseService.getAll as ReturnType<typeof vi.fn>).mockReturnValue([]);
    render(<AdminLicensesPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Licenses')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    }, { timeout: 2000 });
  });
});
