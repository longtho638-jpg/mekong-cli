'use client'

interface RemoveMemberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberEmail: string
  onConfirm: () => void
  isLastOwner?: boolean
}

/**
 * Remove Member Dialog
 *
 * Confirmation dialog for removing team members.
 * Features:
 * - Shows member email being removed
 * - Last owner protection (disabled state)
 * - Destructive action styling
 */
export default function RemoveMemberDialog({
  open,
  onOpenChange,
  memberEmail,
  onConfirm,
  isLastOwner = false,
}: RemoveMemberDialogProps) {
  const handleClose = () => {
    onOpenChange(false)
  }

  const handleConfirm = () => {
    if (!isLastOwner) {
      onConfirm()
    }
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
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md-error-container)]">
            <svg className="h-5 w-5 text-[var(--md-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--md-on-surface)]">
            Remove Member
          </h2>
        </div>

        {isLastOwner ? (
          <div className="mb-6 rounded-lg bg-[var(--md-error-container)] p-4">
            <p className="text-sm text-[var(--md-on-error-container)]">
              <strong className="font-medium">Cannot remove last owner</strong>
              <br />
              You must transfer ownership to another member before removing this user.
            </p>
          </div>
        ) : (
          <div className="mb-6">
            <p className="text-sm text-[var(--md-on-surface-variant)]">
              Are you sure you want to remove{' '}
              <span className="font-medium text-[var(--md-on-surface)]">
                {memberEmail}
              </span>{' '}
              from the workspace?
            </p>
            <p className="mt-2 text-xs text-[var(--md-on-surface-variant)]">
              This action cannot be undone. The member will lose access to all workspace resources.
            </p>
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
            type="button"
            onClick={handleConfirm}
            disabled={isLastOwner}
            className="rounded-lg bg-[var(--md-error)] px-4 py-2 text-sm font-medium text-[var(--md-on-error)] transition-colors hover:bg-[var(--md-error-high)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLastOwner ? 'Cannot Remove' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  )
}
