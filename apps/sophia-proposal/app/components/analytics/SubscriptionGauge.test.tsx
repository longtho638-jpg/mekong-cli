import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubscriptionGauge, type SubscriptionGaugeProps, type SubscriptionTier } from './SubscriptionGauge';

describe('SubscriptionGauge', () => {
  const mockTiers: SubscriptionTier[] = [
    { name: 'FREE', count: 10, color: 'secondary' },
    { name: 'PRO', count: 5, color: 'primary' },
    { name: 'ENTERPRISE', count: 3, color: 'success' },
  ];

  const defaultProps: SubscriptionGaugeProps = {
    tiers: mockTiers,
  };

  const renderComponent = (props?: Partial<SubscriptionGaugeProps>) =>
    render(<SubscriptionGauge {...defaultProps} {...props} />);

  describe('Basic Rendering', () => {
    it('renders with required props only', () => {
      renderComponent();
      expect(screen.getByTestId('subscription-gauge')).toBeInTheDocument();
    });

    it('renders default title', () => {
      renderComponent();
      expect(screen.getByText('Subscription Distribution')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      renderComponent({ title: 'Custom Title' });
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('renders total subscribers count', () => {
      renderComponent();
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('renders default total label', () => {
      renderComponent();
      expect(screen.getByText('Total Subscribers')).toBeInTheDocument();
    });
  });

  describe('Tier Display', () => {
    it('renders all tier names', () => {
      renderComponent();
      expect(screen.getByText('FREE')).toBeInTheDocument();
      expect(screen.getByText('PRO')).toBeInTheDocument();
      expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    });

    it('renders tier counts', () => {
      renderComponent();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('renders tier legend', () => {
      renderComponent();
      mockTiers.forEach((tier) => {
        expect(screen.getByText(tier.name)).toBeInTheDocument();
      });
    });
  });

  describe('Total Calculation', () => {
    it('calculates total correctly', () => {
      renderComponent();
      // Total should be 10 + 5 + 3 = 18
      expect(screen.getByText('18')).toBeInTheDocument();
    });

    it('handles empty tiers', () => {
      renderComponent({ tiers: [] });
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles single tier', () => {
      renderComponent({ tiers: [{ name: 'PRO', count: 5, color: 'primary' }] });
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('handles zero counts', () => {
      renderComponent({
        tiers: [
          { name: 'FREE', count: 0, color: 'secondary' },
          { name: 'PRO', count: 0, color: 'primary' },
        ],
      });
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Custom Total Label', () => {
    it('uses custom total label', () => {
      renderComponent({ totalLabel: 'Active Users' });
      expect(screen.getByText('Active Users')).toBeInTheDocument();
    });
  });

  describe('Animated Option', () => {
    it('enables animation by default', () => {
      renderComponent();
      expect(screen.getByTestId('subscription-gauge')).toBeInTheDocument();
    });

    it('disables animation when false', () => {
      renderComponent({ animated: false });
      expect(screen.getByTestId('subscription-gauge')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      renderComponent({ className: 'custom-class' });
      expect(screen.getByTestId('subscription-gauge')).toHaveClass('custom-class');
    });
  });
});
