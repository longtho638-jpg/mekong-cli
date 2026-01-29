'use client';

import React from 'react';
import { MD3Card, MD3Typography, MD3Button, MD3DataTable, MD3Chip } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowLeft, Globe, Key, Activity, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface WebhookDeliveryRow {
  id: string;
  event: string;
  status: 'success' | 'failed';
  status_code: number;
  duration: number;
  date: string;
  [key: string]: unknown;
}

export default function WebhookDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const configId = params.id;

  const { data: config, isLoading } = useQuery({
    queryKey: ['admin-webhook-config', configId],
    queryFn: async () => {
      const res = await api.get(`/admin/webhooks/configs/${configId}`);
      return res.data;
    }
  });

      const { data: deliveries } = useQuery<WebhookDeliveryRow[]>({
      queryKey: ['admin-webhook-deliveries', configId],
      queryFn: async () => {
          // Mock deliveries
          return [
              { id: 'del_1', event: 'user.created', status: 'success', status_code: 200, duration: 120, date: '2024-01-27T10:00:00Z' },
              { id: 'del_2', event: 'payment.failed', status: 'failed', status_code: 500, duration: 450, date: '2024-01-27T09:30:00Z' },
              { id: 'del_3', event: 'user.updated', status: 'success', status_code: 200, duration: 95, date: '2024-01-27T09:00:00Z' },
          ] as WebhookDeliveryRow[];
      }
  });

  if (isLoading) return <div className="p-8 text-center">Loading webhook details...</div>;
  if (!config) return <div className="p-8 text-center">Webhook not found</div>;

  const deliveryColumns = [
      { header: 'Event', accessor: 'event', render: (row: WebhookDeliveryRow) => <span className="font-mono text-sm">{row.event}</span> },
      {
          header: 'Status',
          accessor: 'status',
          render: (row: WebhookDeliveryRow) => (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {row.status_code} {row.status}
            </span>
          )
      },
      { header: 'Duration', accessor: 'duration', render: (row: WebhookDeliveryRow) => `${row.duration}ms` },
      { header: 'Time', accessor: 'date', render: (row: WebhookDeliveryRow) => new Date(row.date).toLocaleString() },
      {
          header: 'Actions',
          accessor: 'id',
          render: (row: WebhookDeliveryRow) => (
              <MD3Button variant="text" size="small" startIcon={<RefreshCw size={14} />}>Replay</MD3Button>
          )
      }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <MD3Button variant="text" size="small" onClick={() => router.back()} startIcon={<ArrowLeft size={18} />}>
            Back
        </MD3Button>
        <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Webhook Details</MD3Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config Card */}
        <MD3Card variant="elevated" className="p-6 space-y-6">
            <div>
                <MD3Typography variant="label-medium" className="text-gray-500 mb-1">Target URL</MD3Typography>
                <div className="flex items-center gap-2">
                    <Globe size={16} className="text-gray-400" />
                    <span className="font-medium text-gray-900 truncate">{config.url}</span>
                </div>
            </div>

            <div>
                <MD3Typography variant="label-medium" className="text-gray-500 mb-1">Description</MD3Typography>
                <p className="text-sm text-gray-700">{config.description}</p>
            </div>

            <div>
                <MD3Typography variant="label-medium" className="text-gray-500 mb-1">Secret</MD3Typography>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded border border-gray-200">
                    <Key size={14} className="text-gray-400" />
                    <code className="text-xs font-mono text-gray-600 truncate flex-1">{config.secret}</code>
                </div>
            </div>

            <div>
                <MD3Typography variant="label-medium" className="text-gray-500 mb-2">Subscribed Events</MD3Typography>
                <div className="flex flex-wrap gap-2">
                    {config.event_types?.map((type: string) => (
                        <MD3Chip key={type} label={type} size="small" />
                    ))}
                </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
                <MD3Typography variant="label-medium" className="text-gray-500 mb-2">Status</MD3Typography>
                <MD3Chip
                    label={config.is_active ? 'Active' : 'Inactive'}
                    className={config.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}
                />
            </div>
        </MD3Card>

        {/* Deliveries */}
        <div className="lg:col-span-2">
            <MD3Card variant="elevated" className="p-0 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <MD3Typography variant="title-large">Recent Deliveries</MD3Typography>
                    <div className="flex gap-2">
                        <MD3Button variant="outlined" size="small">Test Webhook</MD3Button>
                    </div>
                </div>
                <MD3DataTable<WebhookDeliveryRow> columns={deliveryColumns} data={deliveries || []} />
            </MD3Card>
        </div>
      </div>
    </div>
  );
}
