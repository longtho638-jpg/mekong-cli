import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SettingsPage from './page'

describe('Settings Page', () => {
  it('renders the page title', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders profile information section', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Profile Information')).toBeInTheDocument()
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
  })

  it('renders notifications section', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Notifications')).toBeInTheDocument()
    expect(screen.getByText('Email Notifications')).toBeInTheDocument()
  })

  it('renders security section', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(screen.getByText('Change Password')).toBeInTheDocument()
  })

  it('renders save button', () => {
    render(<SettingsPage />)
    expect(screen.getByText('Save Changes')).toBeInTheDocument()
  })
})
