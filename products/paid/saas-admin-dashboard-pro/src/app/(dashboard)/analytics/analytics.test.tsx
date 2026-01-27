import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AnalyticsPage from './page'

// Mock Recharts
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts')
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 500, height: 300 }}>
        {children}
      </div>
    ),
    BarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
    Bar: () => null,
    PieChart: () => <div data-testid="pie-chart">Pie Chart</div>,
    Pie: () => null,
    Cell: () => null,
    LineChart: () => <div data-testid="line-chart">Line Chart</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  }
})

describe('Analytics Page', () => {
  it('renders the page title', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('renders charts', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('Traffic Sources')).toBeInTheDocument()
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()

    expect(screen.getByText('Device Distribution')).toBeInTheDocument()
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument()

    expect(screen.getByText('User Growth')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })
})
