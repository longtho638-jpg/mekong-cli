'use client'

import React from 'react'
import useSWR from 'swr'
import { MD3Card } from '@/components/ui/MD3Card'
import { Activity, Server, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { getOpsStatus, type ServiceHealth } from '@/lib/ops-api'

export const OpsStatus: React.FC = () => {
  const {
    data: services,
    error,
    isLoading,
  } = useSWR('ops-status', getOpsStatus, {
    refreshInterval: 5000, // Refresh every 5s
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-[var(--md-sys-color-primary)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)] rounded-lg">
        Failed to load operations status.
      </div>
    )
  }

  const displayServices = services || []

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayServices.map(service => (
        <MD3Card key={service.name} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-body-small text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
                {service.name}
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status={service.status} />
                <span className="text-title-medium font-bold capitalize text-[var(--md-sys-color-on-surface)]">
                  {service.status}
                </span>
              </div>
              {service.message && (
                <div className="mt-2 text-body-small text-[var(--md-sys-color-error)]">
                  {service.message}
                </div>
              )}
            </div>
            <Activity size={20} className="text-[var(--md-sys-color-outline)]" />
          </div>
          <div className="mt-3 text-xs text-[var(--md-sys-color-on-surface-variant)]">
            Last check: {new Date(service.last_check).toLocaleTimeString()}
          </div>
        </MD3Card>
      ))}
    </div>
  )
}

const StatusIcon = ({ status }: { status: ServiceHealth['status'] }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle size={18} className="text-green-500" />
    case 'degraded':
      return <AlertCircle size={18} className="text-yellow-500" />
    case 'unhealthy':
      return <AlertCircle size={18} className="text-red-500" />
    default:
      return <Server size={18} className="text-gray-500" />
  }
}
