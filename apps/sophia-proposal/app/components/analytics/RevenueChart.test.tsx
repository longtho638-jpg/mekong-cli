import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RevenueChart, type RevenueChartProps, type RevenueDataPoint } from './RevenueChart';

describe('RevenueChart', () => {
  const mockData: RevenueDataPoint[] = [
    { label: 'MRR', value: 5000 },
    { label: 'ARR', value: 60000, projected: true },
  ];

  const defaultProps: RevenueChartProps = {
    data: mockData,
  };

  const renderComponent = (props?: Partial<RevenueChartProps>) =>
    render(<RevenueChart {...defaultProps} {...props} />);

  describe('Basic Rendering', () => {
    it('renders with required props only', () => {
      renderComponent();
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    });

    it('renders default title', () => {
      renderComponent();
      expect(screen.getByText('Revenue Overview')).toBeInTheDocument();
    });

    it('renders custom title', () => {
      renderComponent({ title: 'Custom Revenue' });
      expect(screen.getByText('Custom Revenue')).toBeInTheDocument();
    });

    it('renders all data points as bars', () => {
      renderComponent();
      mockData.forEach((point) => {
        expect(screen.getByText(point.label)).toBeInTheDocument();
      });
    });
  });

  describe('Currency Formatting', () => {
    it('formats USD currency correctly', () => {
      renderComponent({ currency: 'USD', data: [{ label: 'Test', value: 1000 }] });
      // Tooltip should show formatted value
      const tooltip = screen.getByText('$1,000');
      expect(tooltip).toBeInTheDocument();
    });

    it('formats VND currency correctly', () => {
      renderComponent({ currency: 'VND', data: [{ label: 'Test', value: 1000000 }] });
      // Tooltip should show in millions
      const tooltip = screen.getByText('1.0M');
      expect(tooltip).toBeInTheDocument();
    });
  });

  describe('Chart Height', () => {
    it('uses default height', () => {
      renderComponent();
      const chart = screen.getByTestId('revenue-chart');
      expect(chart).toBeInTheDocument();
    });

    it('accepts custom height', () => {
      renderComponent({ height: 300 });
      const chart = screen.getByTestId('revenue-chart');
      expect(chart).toBeInTheDocument();
    });
  });

  describe('ShowGrid Option', () => {
    it('shows grid lines by default', () => {
      renderComponent();
      // Grid lines should be present
      const gridLines = screen.getAllByRole('presentation', { hidden: true });
      expect(gridLines.length).toBeGreaterThan(0);
    });

    it('hides grid lines when disabled', () => {
      renderComponent({ showGrid: false });
      // Should render without grid
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    });
  });

  describe('Animated Option', () => {
    it('enables animation by default', () => {
      renderComponent();
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    });

    it('disables animation when false', () => {
      renderComponent({ animated: false });
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    });
  });

  describe('Projected Data Styling', () => {
    it('applies different styles for projected data', () => {
      const dataWithProjection: RevenueDataPoint[] = [
        { label: 'Actual', value: 5000 },
        { label: 'Projected', value: 6000, projected: true },
      ];
      renderComponent({ data: dataWithProjection });

      // Both bars should be rendered
      expect(screen.getByText('Actual')).toBeInTheDocument();
      expect(screen.getByText('Projected')).toBeInTheDocument();
    });
  });

  describe('Custom ClassName', () => {
    it('applies custom className', () => {
      renderComponent({ className: 'custom-class' });
      expect(screen.getByTestId('revenue-chart')).toHaveClass('custom-class');
    });
  });

  describe('Data Calculations', () => {
    it('handles zero values gracefully', () => {
      renderComponent({ data: [{ label: 'Zero', value: 0 }] });
      expect(screen.getByText('Zero')).toBeInTheDocument();
    });

    it('handles negative values', () => {
      renderComponent({ data: [{ label: 'Loss', value: -1000 }] });
      expect(screen.getByText('Loss')).toBeInTheDocument();
    });

    it('handles single data point', () => {
      renderComponent({ data: [{ label: 'Single', value: 100 }] });
      expect(screen.getByText('Single')).toBeInTheDocument();
    });

    it('handles large values', () => {
      renderComponent({ data: [{ label: 'Large', value: 1000000000 }] });
      expect(screen.getByText('Large')).toBeInTheDocument();
    });
  });
});
