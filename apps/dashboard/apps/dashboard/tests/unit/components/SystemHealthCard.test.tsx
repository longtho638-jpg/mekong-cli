import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { SystemHealthCard } from '@/components/SystemHealthCard'
import { SystemStatus } from '@/lib/monitor-api'
import React from 'react'

describe.skip('SystemHealthCard', () => {
  const mockStatus: SystemStatus = {
    status: 'healthy',
    message: 'System is operational',
    last_check: new Date().toISOString(),
    details: { version: '1.0.0' }
  }

  it('renders system name correctly', () => {
    render(<SystemHealthCard name="proxy" status={mockStatus} />)
    expect(screen.getByText(/proxy/i)).toBeInTheDocument()
  })

  it('renders status message correctly', () => {
    render(<SystemHealthCard name="proxy" status={mockStatus} />)
    expect(screen.getByText('System is operational')).toBeInTheDocument()
  })

  it('displays details when provided', () => {
    render(<SystemHealthCard name="proxy" status={mockStatus} />)
    expect(screen.getByText('version:')).toBeInTheDocument()
    expect(screen.getByText('1.0.0')).toBeInTheDocument()
  })
})
