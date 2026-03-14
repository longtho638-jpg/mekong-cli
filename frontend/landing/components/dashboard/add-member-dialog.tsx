'use client'

import { useState } from 'react'
import { addMember } from '@/lib/api/billing-client'

interface AddMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  onSuccess: () => void
}

/**
 * Add Member Dialog
 *
 * Form for adding new team members with email and role selection.
 * Features:
 * - Email validation (required, valid format)
 * - Role dropdown (owner/admin/member)
 * - Loading state during submission
 * - Error handling
 */
export default function AddMemberDialog({
  open,
  onOpenChange,
  workspaceId,
  onSuccess,
}: AddMemberDialogProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'owner' | 'admin' | 'member'>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await addMember(workspaceId, email, role)
      onSuccess()
      setEmail('')
      setRole('member')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add member')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('member')
    setError(null)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative z-50 w-full max-w-md rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--md-on-surface)]">
            Add Team Member
          </h2>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container-high)]"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-[var(--md-on-surface)]">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@example.com"
              required
              className="w-full rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-4 py-2 text-[var(--md-on-surface)] placeholder-[var(--md-on-surface-variant)] focus:border-[var(--md-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--md-primary-container)]"
            />
          </div>

          {/* Role Select */}
          <div className="mb-6">
            <label htmlFor="role" className="mb-2 block text-sm font-medium text-[var(--md-on-surface)]">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'owner' | 'admin' | 'member')}
              className="w-full rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container)] px-4 py-2 text-[var(--md-on-surface)] focus:border-[var(--md-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--md-primary-container)]"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
            <p className="mt-2 text-xs text-[var(--md-on-surface-variant)]">
              Owners have full access, admins can manage members, members have basic access.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg bg-[var(--md-error-container)] p-3 text-sm text-[var(--md-on-error-container)]">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-[var(--md-outline-variant)] px-4 py-2 text-sm font-medium text-[var(--md-on-surface)] transition-colors hover:bg-[var(--md-surface-container-high)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="mekong-button-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
