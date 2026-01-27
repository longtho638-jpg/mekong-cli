import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Dashboard from '@/app/(dashboard)/dashboard/page'
import { vi } from 'vitest'

// Mock Recharts since it doesn't play well with JSDOM
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 500, height: 300 }}>
        {children}
      </div>
    ),
    AreaChart: () => <div data-testid="area-chart">Area Chart</div>,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  }
})

describe('Dashboard Page', () => {
  it('renders dashboard overview title', () => {
    render(<Dashboard />)
    const heading = screen.getByText(/Dashboard Overview/i)
    expect(heading).toBeInTheDocument()
  })

  it('renders stats cards', () => {
    render(<Dashboard />)
    expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    expect(screen.getByText('Active Users')).toBeInTheDocument()
    expect(screen.getByText('Sales')).toBeInTheDocument()
    expect(screen.getByText('Active Now')).toBeInTheDocument()
  })

  it('renders revenue chart placeholder', () => {
    render(<Dashboard />)
    expect(screen.getByText('Revenue Over Time')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })
})
