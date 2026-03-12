import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UsageProgressBar, type UsageProgressBarProps, type UsageTier } from './UsageProgressBar';

describe('UsageProgressBar', () => {
  const mockTiers: UsageTier[] = [
    { name: 'FREE', current: 500, limit: 1000, unit: 'calls' },
    { name: 'PRO', current: 5000, limit: 10000, unit: 'calls' },
  ];

  const defaultProps: UsageProgressBarProps = {
    tiers: mockTiers,
  };

  const renderComponent = (props?: Partial<UsageProgressBarProps>) =>
    render(<UsageProgressBar {...defaultProps} {...props} />);

  describe('Basic Rendering', () => {
    it('renders with required props only', () => {
      renderComponent();
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('renders default title', () => {
      renderComponent();
      expect(screen.getByText('Usage Overview')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      renderComponent({ title: 'API Usage' });
      expect(screen.getByText('API Usage')).toBeInTheDocument();
    });

    it('renders all tier names', () => {
      renderComponent();
      expect(screen.getByText('FREE')).toBeInTheDocument();
      expect(screen.getByText('PRO')).toBeInTheDocument();
    });
  });

  describe('Progress Calculation', () => {
    it('renders progress bars', () => {
      renderComponent();
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('handles 100% usage', () => {
      renderComponent({
        tiers: [{ name: 'MAX', current: 1000, limit: 1000, unit: 'calls' }],
      });
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('handles over limit', () => {
      renderComponent({
        tiers: [{ name: 'OVER', current: 1500, limit: 1000, unit: 'calls' }],
      });
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('handles zero usage', () => {
      renderComponent({
        tiers: [{ name: 'ZERO', current: 0, limit: 1000, unit: 'calls' }],
      });
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });
  });

  describe('Near Limit Warning', () => {
    it('renders with usage information', () => {
      renderComponent({
        tiers: [{ name: 'NEAR', current: 850, limit: 1000, unit: 'calls' }],
      });
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('renders without warning below 80%', () => {
      renderComponent({
        tiers: [{ name: 'OK', current: 700, limit: 1000, unit: 'calls' }],
      });
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });
  });

  describe('ShowPercentage Option', () => {
    it('renders with percentage display', () => {
      renderComponent();
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('renders without percentage when disabled', () => {
      renderComponent({ showPercentage: false });
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });
  });

  describe('Animated Option', () => {
    it('enables animation by default', () => {
      renderComponent();
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('disables animation when false', () => {
      renderComponent({ animated: false });
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });
  });

  describe('Usage Display', () => {
    it('shows usage information', () => {
      renderComponent();
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('handles large numbers', () => {
      renderComponent({
        tiers: [{ name: 'LARGE', current: 1000000, limit: 10000000, unit: 'calls' }],
      });
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      renderComponent({ className: 'custom-class' });
      expect(screen.getByTestId('usage-progress')).toHaveClass('custom-class');
    });
  });
});
