'use client';

import React, { useState } from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3DataTable, MD3Chip } from '@/components/md3';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Plus, Webhook, Activity, AlertTriangle, RefreshCw, Trash2, Edit } from 'lucide-react';
import Link from 'next/link';

interface WebhookConfigRow {
  id: string;
  url: string;
  description: string;
  event_types: string[];
  is_active: boolean;
  [key: string]: unknown;
}

interface WebhookEventRow {
  event_type: string;
  status: 'success' | 'failed';
  created_at: string;
  [key: string]: unknown;
}

export default function WebhooksPage() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 1. Fetch Webhook Configs
  const { data: configs, isLoading: isLoadingConfigs } = useQuery({
    queryKey: ['admin-webhook-configs'],
    queryFn: async () => {
      const res = await api.get('/admin/webhooks/configs');
      return res.data;
    }
  });

  // 2. Fetch Recent Events (for quick view)
  const { data: recentEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['admin-webhook-events'],
    queryFn: async () => {
      const res = await api.get('/admin/webhooks/events', { params: { per_page: 5 } });
      return res.data;
    }
  });

  const columns = [
    {
        header: 'URL',
        accessor: 'url',
        render: (data: unknown) => {
            const row = data as WebhookConfigRow;
            return (
                <div className="font-medium text-gray-900 truncate max-w-xs" title={row.url}>{row.url}</div>
            );
        }
    },
    { header: 'Description', accessor: 'description' },
    {
        header: 'Events',
        accessor: 'event_types',
        render: (data: unknown) => {
            const row = data as WebhookConfigRow;
            return (
                <div className="flex gap-1 flex-wrap">
                    {row.event_types.map((type: string) => (
                        <span key={type} className="px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 font-mono">{type}</span>
                    ))}
                </div>
            );
        }
    },
    {
        header: 'Status',
        accessor: 'is_active',
        render: (data: unknown) => {
            const row = data as WebhookConfigRow;
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {row.is_active ? 'Active' : 'Inactive'}
                </span>
            );
        }
    },
    {
        header: 'Actions',
        accessor: 'id',
        render: (data: unknown) => {
            const row = data as WebhookConfigRow;
            return (
                <div className="flex gap-2">
                    <MD3Button variant="text" size="small" startIcon={<Edit size={14} />}>Edit</MD3Button>
                </div>
            );
        }
    }
  ];

  const eventColumns = [
      {
          header: 'Event',
          accessor: 'event_type',
          render: (data: unknown) => {
              const row = data as WebhookEventRow;
              return <span className="font-mono text-sm">{row.event_type}</span>;
          }
      },
      {
          header: 'Status',
          accessor: 'status',
          render: (data: unknown) => {
            const row = data as WebhookEventRow;
            return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {row.status}
                </span>
            );
          }
      },
      { header: 'Time', accessor: 'created_at', render: (data: unknown) => { const row = data as WebhookEventRow; return new Date(row.created_at).toLocaleString(); } }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Webhooks</MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">Manage outgoing webhooks and integrations</MD3Typography>
        </div>
        <div className="flex gap-3">
             <Link href="/webhooks/health">
                <MD3Button variant="outlined" startIcon={<Activity size={18} />}>Health Dashboard</MD3Button>
            </Link>
            <Link href="/webhooks/dlq">
                <MD3Button variant="outlined" startIcon={<AlertTriangle size={18} />} color="error">DLQ</MD3Button>
            </Link>
            <MD3Button startIcon={<Plus size={18} />}>Create Webhook</MD3Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
              <MD3Card variant="elevated" className="p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <MD3Typography variant="title-medium">Active Configurations</MD3Typography>
                </div>
                {isLoadingConfigs ? (
                    <div className="p-8 text-center">Loading configs...</div>
                ) : (
                    <MD3DataTable<WebhookConfigRow>
                        columns={columns}
                        data={configs || []}
                    />
                )}
              </MD3Card>
          </div>

          <div className="space-y-6">
               <MD3Card variant="elevated" className="p-0 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <MD3Typography variant="title-medium">Recent Events</MD3Typography>
                        <MD3Button variant="text" size="small" startIcon={<RefreshCw size={14} />}>Refresh</MD3Button>
                    </div>
                     {isLoadingEvents ? (
                        <div className="p-8 text-center">Loading events...</div>
                    ) : (
                        <MD3DataTable<WebhookEventRow>
                            columns={eventColumns}
                            data={recentEvents?.items || []}
                        />
                    )}
               </MD3Card>
          </div>
      </div>
    </div>
  );
}
