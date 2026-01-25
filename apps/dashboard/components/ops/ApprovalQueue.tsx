'use client'

import React from 'react'
import useSWR, { mutate } from 'swr'
import { MD3Card } from '@/components/ui/MD3Card'
import { Check, X, ShieldAlert, Clock, Loader2, CheckCircle2 } from 'lucide-react'
import { getApprovals, approveRequest, rejectRequest, type ApprovalRequest } from '@/lib/ops-api'

export const ApprovalQueue: React.FC = () => {
  const {
    data: approvals,
    error,
    isLoading,
  } = useSWR('ops-approvals', getApprovals, {
    refreshInterval: 10000, // Refresh every 10s
  })

  const handleApprove = async (id: string) => {
    const success = await approveRequest(id, 'Admin')
    if (success) {
      mutate('ops-approvals')
    } else {
      alert('Failed to approve request')
    }
  }

  const handleReject = async (id: string) => {
    const success = await rejectRequest(id, 'Admin')
    if (success) {
      mutate('ops-approvals')
    } else {
      alert('Failed to reject request')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-error bg-error-container rounded-lg">
        Failed to load approval queue.
      </div>
    )
  }

  const displayApprovals = approvals || []

  if (displayApprovals.length === 0) {
    return (
      <div className="text-center p-8 bg-surface-container-low rounded-xl border border-dashed border-outline">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary opacity-50 mb-2" />
        <p className="text-on-surface-variant">
          No pending approvals. Systems nominal.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {displayApprovals.map(req => (
        <MD3Card key={req.id} className="p-0 overflow-hidden">
          <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
            <div className="flex items-center gap-2">
              <ShieldAlert size={20} className="text-primary" />
              <span className="font-bold text-on-surface">
                {req.action_name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-on-surface-variant">
              <Clock size={14} />
              <span>{new Date(req.created_at).toLocaleTimeString()}</span>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-on-surface-variant block text-xs">
                  Requester
                </span>
                <span className="font-medium text-on-surface">
                  {req.requester}
                </span>
              </div>
              <div>
                <span className="text-on-surface-variant block text-xs">
                  ID
                </span>
                <span className="font-mono text-on-surface">{req.id}</span>
              </div>
            </div>

            <div className="bg-surface-container-high p-3 rounded-lg mb-4">
              <pre className="text-xs font-mono overflow-x-auto text-on-surface-variant">
                {JSON.stringify(req.payload, null, 2)}
              </pre>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => handleReject(req.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-error text-error hover:bg-error-container transition-colors font-medium text-sm"
              >
                <X size={16} /> Reject
              </button>
              <button
                onClick={() => handleApprove(req.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity font-medium text-sm"
              >
                <Check size={16} /> Approve
              </button>
            </div>
          </div>
        </MD3Card>
      ))}
    </div>
  )
}
