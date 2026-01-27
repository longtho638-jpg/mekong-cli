import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import BillingPage from './page'

// Mock the components that might cause issues in test environment
vi.mock('@mui/x-charts', () => ({
  BarChart: () => <div data-testid="bar-chart">Bar Chart</div>,
  PieChart: () => <div data-testid="pie-chart">Pie Chart</div>,
  LineChart: () => <div data-testid="line-chart">Line Chart</div>,
}))

describe('Billing Page', () => {
  it('renders the page title', () => {
    render(<BillingPage />)
    expect(screen.getByText('Billing & Subscription')).toBeInTheDocument()
  })

  it('renders pricing plans', () => {
    render(<BillingPage />)
    expect(screen.getByText('Free')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('indicates the current plan', () => {
    render(<BillingPage />)
    // "Current Plan" appears twice: once as a chip, once as a button
    const currentPlanElements = screen.getAllByText('Current Plan')
    expect(currentPlanElements.length).toBeGreaterThan(0)
  })

  it('renders payment method section', () => {
    render(<BillingPage />)
    expect(screen.getByText('Payment Method')).toBeInTheDocument()
    // Use regex for partial match to be safer
    expect(screen.getByText(/Visa ending in/)).toBeInTheDocument()
  })

  it('renders invoice history', () => {
    render(<BillingPage />)
    expect(screen.getByText('Invoice History')).toBeInTheDocument()
    // INV-001 is the ID but it is not rendered in the table columns (Date, Amount, Status)
    // So we check for the date or amount instead
    expect(screen.getByText('Oct 01, 2023')).toBeInTheDocument()
  })
})
