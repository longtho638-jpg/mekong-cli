import React from 'react';
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/dashboard/kpi-card';
import '@testing-library/jest-dom';

describe('KPICard', () => {
  it('renders title and value', () => {
    render(<KPICard title="Revenue" value="$50,000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
  });

  it('renders positive trend correctly', () => {
    render(<KPICard title="Growth" value="100" trend={15} />);
    expect(screen.getByText('15%')).toBeInTheDocument();
    // In real implementation, we might check for class names or icon presence
    // For now, just ensuring it doesn't crash
  });

  it('renders negative trend correctly', () => {
    render(<KPICard title="Churn" value="5%" trend={-2} />);
    expect(screen.getByText('2%')).toBeInTheDocument();
  });
});
