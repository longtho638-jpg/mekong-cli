'use client'

import { useState, useCallback, useMemo } from 'react'

/**
 * 📋 Audit Trail Hook
 *
 * Inspired by Frappe Framework Activity Log
 * Track all changes to records
 */

export type AuditAction = 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout'

export interface AuditEntry {
  id: string
  action: AuditAction
  entityType: string
  entityId: string
  entityName: string
  userId: string
  userName: string
  changes?: FieldChange[]
  ipAddress?: string
  userAgent?: string
  timestamp: string
}

export interface FieldChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

export interface AuditFilters {
  entityType?: string
  entityId?: string
  userId?: string
  action?: AuditAction
  startDate?: string
  endDate?: string
}

export function useAuditTrail() {
  const [entries, setEntries] = useState<AuditEntry[]>(getDemoAuditEntries())
  const [loading, setLoading] = useState(false)

  // Log an action
  const log = useCallback(
    (
      action: AuditAction,
      entityType: string,
      entityId: string,
      entityName: string,
      userId: string,
      userName: string,
      changes?: FieldChange[]
    ) => {
      const entry: AuditEntry = {
        id: crypto.randomUUID(),
        action,
        entityType,
        entityId,
        entityName,
        userId,
        userName,
        changes,
        timestamp: new Date().toISOString(),
      }

      setEntries(prev => [entry, ...prev])
      return entry
    },
    []
  )

  // Filter entries
  const filter = useCallback(
    (filters: AuditFilters): AuditEntry[] => {
      return entries.filter(e => {
        if (filters.entityType && e.entityType !== filters.entityType) return false
        if (filters.entityId && e.entityId !== filters.entityId) return false
        if (filters.userId && e.userId !== filters.userId) return false
        if (filters.action && e.action !== filters.action) return false
        if (filters.startDate && e.timestamp < filters.startDate) return false
        if (filters.endDate && e.timestamp > filters.endDate) return false
        return true
      })
    },
    [entries]
  )

  // Get history for entity
  const getEntityHistory = useCallback(
    (entityType: string, entityId: string) =>
      entries
        .filter(e => e.entityType === entityType && e.entityId === entityId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [entries]
  )

  // Get user activity
  const getUserActivity = useCallback(
    (userId: string) =>
      entries
        .filter(e => e.userId === userId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [entries]
  )

  // Summary stats
  const summary = useMemo(() => {
    const byAction = entries.reduce(
      (acc, e) => {
        acc[e.action] = (acc[e.action] || 0) + 1
        return acc
      },
      {} as Record<AuditAction, number>
    )

    const byEntity = entries.reduce(
      (acc, e) => {
        acc[e.entityType] = (acc[e.entityType] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const today = new Date().toISOString().split('T')[0]
    const todayCount = entries.filter(e => e.timestamp.startsWith(today)).length

    return {
      totalEntries: entries.length,
      todayCount,
      byAction,
      byEntity,
    }
  }, [entries])

  return {
    entries,
    summary,
    loading,
    log,
    filter,
    getEntityHistory,
    getUserActivity,
  }
}

// Demo entries
function getDemoAuditEntries(): AuditEntry[] {
  return [
    {
      id: '1',
      action: 'update',
      entityType: 'invoice',
      entityId: '42',
      entityName: 'INV-2024-042',
      userId: 'u1',
      userName: 'John Doe',
      changes: [{ field: 'status', oldValue: 'draft', newValue: 'sent' }],
      timestamp: '2026-01-04T10:30:00Z',
    },
    {
      id: '2',
      action: 'create',
      entityType: 'project',
      entityId: 'p1',
      entityName: 'Project Alpha',
      userId: 'u1',
      userName: 'John Doe',
      timestamp: '2026-01-04T09:00:00Z',
    },
    {
      id: '3',
      action: 'view',
      entityType: 'client',
      entityId: 'c1',
      entityName: 'Acme Corp',
      userId: 'u2',
      userName: 'Jane Smith',
      timestamp: '2026-01-04T08:45:00Z',
    },
    {
      id: '4',
      action: 'login',
      entityType: 'user',
      entityId: 'u1',
      entityName: 'John Doe',
      userId: 'u1',
      userName: 'John Doe',
      timestamp: '2026-01-04T08:00:00Z',
    },
    {
      id: '5',
      action: 'export',
      entityType: 'report',
      entityId: 'r1',
      entityName: 'Q4 Revenue Report',
      userId: 'u2',
      userName: 'Jane Smith',
      timestamp: '2026-01-03T16:00:00Z',
    },
  ]
}

export default useAuditTrail
