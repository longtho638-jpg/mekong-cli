'use client'

import { useState, useEffect, useCallback } from 'react'
import { getMembers, removeMember, type MemberResponse } from '@/lib/api/billing-client'
import AddMemberDialog from './add-member-dialog'
import RemoveMemberDialog from './remove-member-dialog'

interface MemberListProps {
  workspaceId: string
}

const ROLE_CONFIG: Record<string, { badge: string; label: string; priority: number }> = {
  owner: { badge: 'bg-[var(--md-primary)] text-[var(--md-on-primary)]', label: 'Owner', priority: 3 },
  admin: { badge: 'bg-[var(--md-secondary)] text-[var(--md-on-secondary)]', label: 'Admin', priority: 2 },
  member: { badge: 'bg-[var(--md-surface-container)] text-[var(--md-on-surface)]', label: 'Member', priority: 1 },
}

const RefreshIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

/**
 * Member List Component
 *
 * Displays workspace members with email, role badge, and join date.
 * Features:
 * - Add new members via dialog
 * - Remove members with confirmation
 * - Last owner protection
 * - Loading/error/empty states
 */
export default function MemberList({ workspaceId }: MemberListProps) {
  const [members, setMembers] = useState<MemberResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<string | null>(null)

  const fetchMembers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      const data = await getMembers(workspaceId)
      setMembers(data.members)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch members')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [workspaceId])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const handleRemove = async () => {
    if (!selectedMember) return
    try {
      await removeMember(workspaceId, selectedMember)
      await fetchMembers(true)
      setRemoveDialogOpen(false)
      setSelectedMember(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member')
    }
  }

  const openRemoveDialog = (email: string) => {
    setSelectedMember(email)
    setRemoveDialogOpen(true)
  }

  // Check if member is the last owner
  const isLastOwner = useCallback((email: string): boolean => {
    const member = members.find(m => m.user_email === email)
    if (member?.role !== 'owner') return false
    const ownerCount = members.filter(m => m.role === 'owner').length
    return ownerCount <= 1
  }, [members])

  // Loading state
  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-[var(--md-on-surface)]">Team Members</span>
          </div>
          <div className="h-8 w-8 animate-pulse rounded bg-[var(--md-outline)]" />
        </div>

        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-[var(--md-outline)]" />
                <div className="space-y-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-[var(--md-outline)]" />
                  <div className="h-3 w-20 animate-pulse rounded bg-[var(--md-outline)]" />
                </div>
              </div>
              <div className="h-6 w-16 animate-pulse rounded bg-[var(--md-outline)]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-xl border border-[var(--md-error-container)] bg-[var(--md-error-container-low)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-[var(--md-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-lg font-semibold text-[var(--md-on-error-container)]">Team Members</span>
        </div>
        <p className="text-sm text-[var(--md-on-error-container)]">{error}</p>
        <button
          onClick={() => fetchMembers(true)}
          className="mt-4 rounded-lg bg-[var(--md-error)] px-4 py-2 text-sm font-medium text-[var(--md-on-error)] transition-colors hover:bg-[var(--md-error-high)]"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Empty state
  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <span className="text-lg font-semibold text-[var(--md-on-surface)]">Team Members</span>
          </div>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="mekong-button-primary rounded-lg px-4 py-2 text-sm font-medium"
          >
            Add Member
          </button>
        </div>
        <p className="py-8 text-center text-sm text-[var(--md-on-surface-variant)]">
          No members yet. Add your first team member to get started.
        </p>
      </div>
    )
  }

  // Member list
  return (
    <div className="rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <span className="text-lg font-semibold text-[var(--md-on-surface)]">Team Members</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--md-on-surface-variant)]">{members.length} members</span>
          <button
            onClick={() => setAddDialogOpen(true)}
            className="mekong-button-primary rounded-lg px-3 py-2 text-sm font-medium"
          >
            Add Member
          </button>
          <button
            onClick={() => fetchMembers(true)}
            disabled={refreshing}
            className={`rounded-lg p-2 text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container-high)] ${
              refreshing ? 'animate-spin' : ''
            }`}
            aria-label="Refresh"
          >
            <RefreshIcon />
          </button>
        </div>
      </div>

      <div className="divide-y divide-[var(--md-outline-variant)]">
        {members.map((member) => {
          const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member
          const joinedDate = new Date(member.joined_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })

          return (
            <div
              key={member.user_email}
              className="flex items-center justify-between py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] text-sm font-medium">
                  {member.user_email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--md-on-surface)]">
                    {member.user_email}
                  </p>
                  <p className="text-xs text-[var(--md-on-surface-variant)]">
                    Joined {joinedDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${roleConfig.badge}`}>
                  {roleConfig.label}
                </span>
                {member.role !== 'owner' && (
                  <button
                    onClick={() => openRemoveDialog(member.user_email)}
                    className="rounded-lg p-2 text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-error-container)] hover:text-[var(--md-error)]"
                    aria-label={`Remove ${member.user_email}`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Dialogs */}
      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        workspaceId={workspaceId}
        onSuccess={() => {
          fetchMembers(true)
          setAddDialogOpen(false)
        }}
      />

      <RemoveMemberDialog
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        memberEmail={selectedMember || ''}
        onConfirm={handleRemove}
        isLastOwner={selectedMember ? isLastOwner(selectedMember) : false}
      />
    </div>
  )
}
