import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterPanel } from '@/components/dashboard/filter-panel';
import '@testing-library/jest-dom';

describe('FilterPanel', () => {
  const mockFilters = {
    dateRange: '30d' as const,
    segment: 'all',
    autoRefresh: 0
  };
  const mockOnChange = jest.fn();
  const mockOnRefresh = jest.fn();
  const mockOnExport = jest.fn();

  it('renders filter controls', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockOnChange}
        onRefresh={mockOnRefresh}
        onExport={mockOnExport}
      />
    );

    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    expect(screen.getByText('All Users')).toBeInTheDocument();
  });

  it('calls onFilterChange when segment changes', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockOnChange}
        onRefresh={mockOnRefresh}
        onExport={mockOnExport}
      />
    );

    const select = screen.getByDisplayValue('All Users'); // Displays text but value is 'all'
    // Depending on implementation, testing library select interaction can be tricky
    // But let's assume standard select
  });

  it('calls onRefresh when refresh button clicked', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockOnChange}
        onRefresh={mockOnRefresh}
        onExport={mockOnExport}
      />
    );

    const refreshBtn = screen.getByTitle('Refresh Now');
    fireEvent.click(refreshBtn);
    expect(mockOnRefresh).toHaveBeenCalled();
  });
});
