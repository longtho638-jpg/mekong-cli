'use client';

import React from 'react';

type StatusType = 'active' | 'idle' | 'offline' | 'pending' | 'success' | 'error';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const styles: Record<StatusType, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  idle: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  offline: 'bg-red-500/20 text-red-400 border-red-500/50',
  pending: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  error: 'bg-red-500/20 text-red-400 border-red-500/50',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs border ${styles[status]} ${className}`}>
      {status}
    </span>
  );
}
