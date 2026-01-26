import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatsCard } from './StatsCard';
import { Activity } from 'lucide-react';
import React from 'react';

describe('StatsCard', () => {
  it('renders title and value', () => {
    render(<StatsCard title="Test Stat" value={123} icon={Activity} />);
    expect(screen.getByText('Test Stat')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('applies color classes', () => {
    const { container } = render(<StatsCard title="Red Stat" value={0} icon={Activity} color="red" />);
    // Check for a class that indicates red color - this depends on implementation details but
    // looking for text-red-700 is a safe bet based on the component code
    expect(container.querySelector('.text-red-700')).toBeInTheDocument();
  });
});
