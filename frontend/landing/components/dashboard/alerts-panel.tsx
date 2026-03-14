'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAlerts, acknowledgeAlert, type AlertResponse } from '@/lib/api/billing-client'
import AlertBadge from './alert-badge'

interface AlertsPanelProps {
  workspaceId: string
  onAlertCountChange?: (count: number) => void
}

interface AlertItem {
  icon: string
  color: string
  label: string
}

const ALERT_TYPES: Record<string, AlertItem> = {
  warning: {
    icon: '⚠️',
    color: 'text-[var(--md-error-container)] bg-[var(--md-error-container)]',
    label: 'Warning',
  },
  critical: {
    icon: '🚨',
    color: 'text-[var(--md-error)] bg-[var(--md-error-container)]',
    label: 'Critical',
  },
  exhausted: {
    icon: '💀',
    color: 'text-[var(--md-on-error)] bg-[var(--md-error)]',
    label: 'Exhausted',
  },
  low_credits: {
    icon: '💰',
    color: 'text-[var(--md-tertiary)] bg-[var(--md-tertiary-container)]',
    label: 'Low Credits',
  },
}

export default function AlertsPanel({ workspaceId, onAlertCountChange }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<AlertResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getAlerts(workspaceId)
      setAlerts(data)
      onAlertCountChange?.(data.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setIsLoading(false)
    }
  }, [workspaceId, onAlertCountChange])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleAcknowledge = async (alertId: string) => {
    try {
      setIsAcknowledging(true)
      await acknowledgeAlert(workspaceId, alertId)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
      onAlertCountChange?.(alerts.length - 1)
    } catch (err) {
      setError('Failed to acknowledge alert')
    } finally {
      setIsAcknowledging(false)
    }
  }

  const handleAcknowledgeAll = async () => {
    try {
      setIsAcknowledging(true)
      await Promise.all(alerts.map((alert) => acknowledgeAlert(workspaceId, alert.id)))
      setAlerts([])
      onAlertCountChange?.(0)
    } catch (err) {
      setError('Failed to acknowledge all alerts')
    } finally {
      setIsAcknowledging(false)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)] p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--md-on-surface)]">Loading alerts...</span>
        </div>
      </div>
    )
  }

  const unreadCount = alerts.length

  return (
    <div className="rounded-lg border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--md-outline-variant)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <span className="text-sm font-medium text-[var(--md-on-surface)]">Billing Alerts</span>
          <AlertBadge count={unreadCount} />
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleAcknowledgeAll}
            disabled={isAcknowledging}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-[var(--md-primary)] transition-colors hover:bg-[var(--md-primary-container)] disabled:opacity-50"
          >
            {isAcknowledging ? 'Acknowledging...' : 'Ack All'}
          </button>
        )}
      </div>

      {/* Alerts List */}
      <div className="divide-y divide-[var(--md-outline-variant)]">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-4xl">✅</span>
            <p className="mt-2 text-sm font-medium text-[var(--md-on-surface)]">All caught up!</p>
            <p className="text-xs text-[var(--md-on-surface-variant)]">No unread billing alerts</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const alertType = ALERT_TYPES[alert.alert_type] || ALERT_TYPES.warning
            const date = new Date(alert.triggered_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })

            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--md-surface-container-high)]"
              >
                {/* Icon */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${alertType.color}`}
                >
                  <span className="text-sm">{alertType.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--md-on-surface)]">
                      {alertType.label}
                    </span>
                    <span className="text-xs text-[var(--md-on-surface-variant)]">
                      - {alert.message}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--md-on-surface-variant)]">Triggered: {date}</p>
                </div>

                {/* Dismiss Button */}
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  disabled={isAcknowledging}
                  className="shrink-0 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--md-on-surface-variant)] transition-colors hover:bg-[var(--md-surface-container)] disabled:opacity-50"
                >
                  Dismiss
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-t border-[var(--md-outline-variant)] bg-[var(--md-error-container)] px-4 py-2">
          <p className="text-sm text-[var(--md-on-error-container)]">{error}</p>
        </div>
      )}
    </div>
  )
}
