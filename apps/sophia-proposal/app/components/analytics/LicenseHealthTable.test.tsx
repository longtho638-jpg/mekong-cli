import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LicenseHealthTable, type LicenseHealthTableProps, type LicenseEntry } from './LicenseHealthTable';

describe('LicenseHealthTable', () => {
  const mockLicenses: LicenseEntry[] = [
    {
      id: '1',
      key: 'SOPHIA-001',
      tier: 'PRO',
      status: 'active',
      customer: 'Acme Corp',
      expiresAt: '2027-12-31',
    },
    {
      id: '2',
      key: 'SOPHIA-002',
      tier: 'ENTERPRISE',
      status: 'expiring',
      customer: 'Tech Inc',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    },
  ];

  const defaultProps: LicenseHealthTableProps = {
    licenses: mockLicenses,
  };

  const renderComponent = (props?: Partial<LicenseHealthTableProps>) =>
    render(<LicenseHealthTable {...defaultProps} {...props} />);

  describe('Basic Rendering', () => {
    it('renders with required props only', () => {
      renderComponent();
      expect(screen.getByTestId('license-health-table')).toBeInTheDocument();
    });

    it('renders default title', () => {
      renderComponent();
      expect(screen.getByText('License Distribution')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      renderComponent({ title: 'Custom Title' });
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders table headers', () => {
      renderComponent();
      expect(screen.getByText('License Key')).toBeInTheDocument();
      expect(screen.getByText('Tier')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Customer')).toBeInTheDocument();
      expect(screen.getByText('Expiration')).toBeInTheDocument();
    });
  });

  describe('License Display', () => {
    it('renders all license keys', () => {
      renderComponent();
      expect(screen.getByText('SOPHIA-001')).toBeInTheDocument();
      expect(screen.getByText('SOPHIA-002')).toBeInTheDocument();
    });

    it('renders tier for each license', () => {
      renderComponent();
      expect(screen.getByText('PRO')).toBeInTheDocument();
      expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    });

    it('renders customer names', () => {
      renderComponent();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Tech Inc')).toBeInTheDocument();
    });
  });

  describe('Status Display', () => {
    it('renders status with correct icon', () => {
      renderComponent();
      expect(screen.getByText('● active')).toBeInTheDocument();
      expect(screen.getByText('⚠ expiring')).toBeInTheDocument();
    });

    it('applies correct status styles', () => {
      renderComponent();
      const activeStatus = screen.getByText('● active');
      expect(activeStatus).toHaveClass('bg-green-500/10', 'text-green-400');

      const expiringStatus = screen.getByText('⚠ expiring');
      expect(expiringStatus).toHaveClass('bg-yellow-500/10', 'text-yellow-400');
    });

    it('handles all status types', () => {
      const allStatuses: LicenseEntry[] = [
        { id: '1', key: 'K1', tier: 'PRO', status: 'active', customer: 'C1', expiresAt: '2027-01-01' },
        { id: '2', key: 'K2', tier: 'PRO', status: 'expiring', customer: 'C2', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '3', key: 'K3', tier: 'PRO', status: 'expired', customer: 'C3', expiresAt: '2020-01-01' },
        { id: '4', key: 'K4', tier: 'PRO', status: 'suspended', customer: 'C4', expiresAt: '2027-01-01' },
      ];
      renderComponent({ licenses: allStatuses });

      expect(screen.getByText('● active')).toBeInTheDocument();
      expect(screen.getByText('⚠ expiring')).toBeInTheDocument();
      expect(screen.getByText('○ expired')).toBeInTheDocument();
      expect(screen.getByText('◌ suspended')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats future dates', () => {
      renderComponent();
      // Should show expiration info
      expect(screen.getByText(/Expires/)).toBeInTheDocument();
    });

    it('formats expired dates', () => {
      renderComponent({
        licenses: [
          { id: '1', key: 'K1', tier: 'PRO', status: 'expired', customer: 'C1', expiresAt: '2020-01-01' },
        ],
      });
      expect(screen.getByText(/Expired/)).toBeInTheDocument();
    });

    it('handles "expires today"', () => {
      const today = new Date().toISOString().split('T')[0];
      renderComponent({
        licenses: [
          { id: '1', key: 'K1', tier: 'PRO', status: 'expiring', customer: 'C1', expiresAt: today },
        ],
      });
      expect(screen.getByText('Expires today')).toBeInTheDocument();
    });

    it('handles "expires tomorrow"', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      renderComponent({
        licenses: [
          { id: '1', key: 'K1', tier: 'PRO', status: 'expiring', customer: 'C1', expiresAt: tomorrow },
        ],
      });
      expect(screen.getByText('Expires tomorrow')).toBeInTheDocument();
    });
  });

  describe('MaxVisible Option', () => {
    it('shows all licenses when count is below maxVisible', () => {
      renderComponent({ maxVisible: 10 });
      expect(screen.getByText('SOPHIA-001')).toBeInTheDocument();
      expect(screen.getByText('SOPHIA-002')).toBeInTheDocument();
    });

    it('limits displayed licenses to maxVisible', () => {
      const manyLicenses: LicenseEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        key: `KEY-${i}`,
        tier: 'PRO',
        status: 'active' as const,
        customer: `Customer ${i}`,
        expiresAt: '2027-01-01',
      }));
      renderComponent({ licenses: manyLicenses, maxVisible: 5 });

      // First 5 should be visible
      expect(screen.getByText('KEY-0')).toBeInTheDocument();
      expect(screen.getByText('KEY-4')).toBeInTheDocument();

      // Should show "more" indicator
      expect(screen.getByText('+5 more licenses')).toBeInTheDocument();
    });

    it('shows singular "license" when 1 remaining', () => {
      const sixLicenses: LicenseEntry[] = Array.from({ length: 6 }, (_, i) => ({
        id: String(i),
        key: `KEY-${i}`,
        tier: 'PRO',
        status: 'active' as const,
        customer: `Customer ${i}`,
        expiresAt: '2027-01-01',
      }));
      renderComponent({ licenses: sixLicenses, maxVisible: 5 });

      expect(screen.getByText('+1 more license')).toBeInTheDocument();
    });
  });

  describe('Row Click Handler', () => {
    it('calls onRowClick when row is clicked', () => {
      const handleClick = vi.fn();
      renderComponent({ onRowClick: handleClick });

      const row = screen.getByText('SOPHIA-001').closest('div');
      if (row) {
        fireEvent.click(row);
      }

      expect(handleClick).toHaveBeenCalledWith(mockLicenses[0]);
    });

    it('has pointer cursor when clickable', () => {
      renderComponent({ onRowClick: vi.fn() });
      const row = screen.getByText('SOPHIA-001').closest('div');
      expect(row).toHaveClass('cursor-pointer');
    });

    it('has default cursor when no handler', () => {
      renderComponent();
      const row = screen.getByText('SOPHIA-001').closest('div');
      expect(row).toHaveClass('cursor-default');
    });
  });

  describe('Seats Display', () => {
    it('renders seats info when provided', () => {
      const licensesWithSeats: LicenseEntry[] = [
        {
          id: '1',
          key: 'KEY-1',
          tier: 'PRO',
          status: 'active',
          customer: 'C1',
          expiresAt: '2027-01-01',
          seats: { used: 3, total: 5 },
        },
      ];
      renderComponent({ licenses: licensesWithSeats });

      expect(screen.getByText(/seats/)).toBeInTheDocument();
    });

    it('does not render seats section when no licenses have seats', () => {
      renderComponent();
      expect(screen.queryByText(/seats/)).not.toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      renderComponent({ className: 'custom-class' });
      expect(screen.getByTestId('license-health-table')).toHaveClass('custom-class');
    });
  });
});
