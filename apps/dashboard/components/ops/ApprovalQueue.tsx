'use client';

import React, { useState } from 'react';
import { MD3Card } from '@/components/ui/MD3Card';
import { Check, X, ShieldAlert, Clock } from 'lucide-react';

interface ApprovalRequest {
  id: string;
  action_name: string;
  requester: string;
  payload: any;
  created_at: number;
  status: 'pending' | 'approved' | 'rejected';
}

// Mock data
const MOCK_APPROVALS: ApprovalRequest[] = [
  {
    id: 'req_1',
    action_name: 'deploy_production',
    requester: 'CI/CD Bot',
    payload: { version: 'v5.4.0', commit: 'a1b2c3d' },
    created_at: Date.now() - 1000 * 60 * 15, // 15 mins ago
    status: 'pending'
  },
  {
    id: 'req_2',
    action_name: 'database_migration',
    requester: 'DevOps Agent',
    payload: { migration: '20260123_kanban_tables' },
    created_at: Date.now() - 1000 * 60 * 60, // 1 hour ago
    status: 'pending'
  }
];

export const ApprovalQueue: React.FC = () => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>(MOCK_APPROVALS);

  const handleApprove = (id: string) => {
    // API call would go here
    setApprovals(prev => prev.filter(req => req.id !== id));
    alert(`Approved request ${id}`);
  };

  const handleReject = (id: string) => {
    // API call would go here
    setApprovals(prev => prev.filter(req => req.id !== id));
    alert(`Rejected request ${id}`);
  };

  if (approvals.length === 0) {
    return (
      <div className="text-center p-8 bg-[var(--md-sys-color-surface-container-low)] rounded-xl border border-dashed border-[var(--md-sys-color-outline)]">
        <CheckCircleIcon className="mx-auto h-12 w-12 text-[var(--md-sys-color-primary)] opacity-50 mb-2" />
        <p className="text-[var(--md-sys-color-on-surface-variant)]">No pending approvals. Systems nominal.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {approvals.map((req) => (
        <MD3Card key={req.id} className="p-0 overflow-hidden">
          <div className="p-4 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between bg-[var(--md-sys-color-surface-container)]">
             <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-[var(--md-sys-color-primary)]" />
                <span className="font-bold text-[var(--md-sys-color-on-surface)]">{req.action_name}</span>
             </div>
             <div className="flex items-center gap-1 text-xs text-[var(--md-sys-color-on-surface-variant)]">
                <Clock size={14} />
                <span>{new Date(req.created_at).toLocaleTimeString()}</span>
             </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                    <span className="text-[var(--md-sys-color-on-surface-variant)] block text-xs">Requester</span>
                    <span className="font-medium text-[var(--md-sys-color-on-surface)]">{req.requester}</span>
                </div>
                <div>
                    <span className="text-[var(--md-sys-color-on-surface-variant)] block text-xs">ID</span>
                    <span className="font-mono text-[var(--md-sys-color-on-surface)]">{req.id}</span>
                </div>
            </div>

            <div className="bg-[var(--md-sys-color-surface-container-high)] p-3 rounded-lg mb-4">
                <pre className="text-xs font-mono overflow-x-auto text-[var(--md-sys-color-on-surface-variant)]">
                    {JSON.stringify(req.payload, null, 2)}
                </pre>
            </div>

            <div className="flex gap-3 justify-end">
                <button
                    onClick={() => handleReject(req.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--md-sys-color-error)] text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error-container)] transition-colors font-medium text-sm"
                >
                    <X size={16} /> Reject
                </button>
                <button
                    onClick={() => handleApprove(req.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] hover:opacity-90 transition-opacity font-medium text-sm"
                >
                    <Check size={16} /> Approve
                </button>
            </div>
          </div>
        </MD3Card>
      ))}
    </div>
  );
};

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
          {...props}
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    )
}
