'use client';

import React from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3DataTable } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Shield, Clock, User, FileText } from 'lucide-react';

interface AuditLogRow {
  action: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  ip_address: string;
  timestamp: string;
}

export default function AuditPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit'],
    queryFn: async () => {
      const res = await api.get('/admin/audit');
      return res.data;
    }
  });

  const columns = [
    {
        header: 'Action',
        accessor: 'action',
        render: (row: AuditLogRow) => (
            <span className="font-medium text-gray-900">{row.action}</span>
        )
    },
    {
        header: 'Resource',
        accessor: 'resource_type',
        render: (row: AuditLogRow) => (
            <div className="flex items-center gap-1 text-sm">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-600 font-mono text-xs">{row.resource_type}</span>
                <span className="text-gray-400">/</span>
                <span className="font-mono text-xs text-gray-500">{row.resource_id}</span>
            </div>
        )
    },
    { header: 'User', accessor: 'user_id', render: (row: AuditLogRow) => <span className="text-sm text-gray-600">{row.user_id}</span> },
    { header: 'IP Address', accessor: 'ip_address' },
    { header: 'Time', accessor: 'timestamp', render: (row: AuditLogRow) => new Date(row.timestamp).toLocaleString() },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Audit Logs</MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">System security and activity audit trail</MD3Typography>
        </div>
        <MD3Button variant="outlined" startIcon={<Shield size={18} />}>Export Logs</MD3Button>
      </div>

      <MD3Card variant="elevated" className="p-0 overflow-hidden">
        {isLoading ? (
            <div className="p-8 text-center">Loading audit logs...</div>
        ) : (
            <MD3DataTable
                columns={columns}
                data={logs || []}
            />
        )}
      </MD3Card>
    </div>
  );
}
