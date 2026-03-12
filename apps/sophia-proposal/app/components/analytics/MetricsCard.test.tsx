import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricsCard, type MetricsCardProps } from './MetricsCard';

describe('MetricsCard', () => {
  const defaultProps: MetricsCardProps = {
    title: 'Test Metric',
    value: 100,
  };

  const renderComponent = (props?: Partial<MetricsCardProps>) =>
    render(<MetricsCard {...defaultProps} {...props} />);

  describe('Basic Rendering', () => {
    it('renders with required props only', () => {
      renderComponent();
      expect(screen.getByText('Test Metric')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders string value correctly', () => {
      renderComponent({ value: '$1,000' });
      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    it('renders title correctly', () => {
      renderComponent({ title: 'Monthly Revenue' });
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });
  });

  describe('Description', () => {
    it('renders description when provided', () => {
      renderComponent({ description: 'Updated daily' });
      expect(screen.getByText('Updated daily')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      renderComponent();
      expect(screen.queryByText('Updated daily')).not.toBeInTheDocument();
    });
  });

  describe('Delta Display', () => {
    it('renders positive delta', () => {
      renderComponent({
        delta: { value: 12, isPositive: true, label: 'vs last month' },
      });
      expect(screen.getByText(/12%/)).toBeInTheDocument();
    });

    it('renders negative delta', () => {
      renderComponent({
        delta: { value: 5, isPositive: false, label: 'vs last month' },
      });
      expect(screen.getByText(/5%/)).toBeInTheDocument();
    });

    it('renders delta without label', () => {
      renderComponent({
        delta: { value: 10, isPositive: true },
      });
      expect(screen.getByText(/10%/)).toBeInTheDocument();
    });
  });

  describe('Glow Variants', () => {
    it('renders with primary glow', () => {
      renderComponent({ glow: 'primary' });
      expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
    });

    it('renders with secondary glow', () => {
      renderComponent({ glow: 'secondary' });
      expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
    });

    it('renders with success glow', () => {
      renderComponent({ glow: 'success' });
      expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
    });

    it('renders with warning glow', () => {
      renderComponent({ glow: 'warning' });
      expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
    });

    it('renders with no glow', () => {
      renderComponent({ glow: 'none' });
      expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
    });

    it('defaults to none glow', () => {
      renderComponent();
      expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
    });
  });

  describe('Delay Prop', () => {
    it('accepts delay prop', () => {
      renderComponent({ delay: 0.5 });
      expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
    });

    it('defaults to 0 delay', () => {
      renderComponent();
      expect(screen.getByTestId('metrics-card')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      renderComponent({ className: 'custom-class' });
      expect(screen.getByTestId('metrics-card')).toHaveClass('custom-class');
    });
  });
});
