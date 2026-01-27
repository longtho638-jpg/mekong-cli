import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import UsersPage from './page'

// Mock the DataTable component since it's complex and tested separately (ideally)
// For this integration test, we just want to ensure the page renders
vi.mock('@/components/ui/DataTable', () => ({
  DataTable: () => <div data-testid="data-table">Mock Data Table</div>,
}))

describe('Users Page', () => {
  it('renders the page title', () => {
    render(<UsersPage />)
    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  it('renders the Add User button', () => {
    render(<UsersPage />)
    expect(screen.getByText('Add User')).toBeInTheDocument()
  })

  it('renders the data table', () => {
    render(<UsersPage />)
    expect(screen.getByTestId('data-table')).toBeInTheDocument()
  })
})
