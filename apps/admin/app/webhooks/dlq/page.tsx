'use client';

import React, { useState, useEffect } from 'react';
import {
  MD3Card,
  MD3Button,
  MD3Typography,
  MD3DataTable,
  MD3Chip
} from '@/components/md3'; // Assuming internal MD3 components exist per rules
import { AlertCircle, RefreshCw, Trash2, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api'; // Assuming standard API client

interface WebhookDLQRow {
  id: string;
  event_type: string;
  error_message: string;
  retry_count: number;
  stored_at: string;
  [key: string]: unknown;
}

export default function DLQPage() {
  const queryClient = useQueryClient();
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);

  // Fetch DLQ Entries
  const { data: entries, isLoading } = useQuery({
    queryKey: ['dlq-entries'],
    queryFn: async () => {
      const res = await api.get('/dlq/');
      return res.data;
    }
  });

  // Replay Mutation
  const replayMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/dlq/${id}/replay`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlq-entries'] });
      // Show toast
    }
  });

  // Discard Mutation
  const discardMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dlq/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dlq-entries'] });
    }
  });

  const handleReplay = (id: string) => {
    replayMutation.mutate(id);
  };

  const handleDiscard = (id: string) => {
    if (confirm('Are you sure you want to discard this entry?')) {
      discardMutation.mutate(id);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Event Type', accessor: 'event_type' },
    {
      header: 'Error',
      accessor: 'error_message',
      render: (data: unknown) => {
        const row = data as WebhookDLQRow;
        return (
            <span className="text-red-500 text-sm truncate max-w-xs block" title={row.error_message}>
            {row.error_message}
            </span>
        );
      }
    },
    { header: 'Retries', accessor: 'retry_count' },
    {
      header: 'Stored At',
      accessor: 'stored_at',
      render: (data: unknown) => {
        const row = data as WebhookDLQRow;
        return new Date(row.stored_at).toLocaleString();
      }
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (data: unknown) => {
        const row = data as WebhookDLQRow;
        return (
            <div className="flex gap-2">
            <MD3Button
                variant="text"
                size="small"
                onClick={() => handleReplay(row.id)}
                disabled={replayMutation.isPending}
                startIcon={<RefreshCw size={14} />}
            >
                Replay
            </MD3Button>
            <MD3Button
                variant="text"
                size="small"
                color="error"
                onClick={() => handleDiscard(row.id)}
                disabled={discardMutation.isPending}
                startIcon={<Trash2 size={14} />}
            >
                Discard
            </MD3Button>
            </div>
        );
      }
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="m3-headline-medium text-[var(--md-sys-color-on-surface)]">
            Dead Letter Queue
          </h1>
          <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
            Manage failed webhook deliveries (Fire Attack Protocol)
          </p>
        </div>
        <div className="flex gap-3">
          <MD3Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => queryClient.invalidateQueries({ queryKey: ['dlq-entries'] })}
          >
            Refresh
          </MD3Button>
        </div>
      </div>

      <MD3Card variant="elevated" className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading DLQ...</div>
        ) : entries && entries.length > 0 ? (
          <MD3DataTable<WebhookDLQRow>
            columns={columns}
            data={entries}
            selectable
            onSelectionChange={setSelectedEntries}
          />
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <h3 className="m3-title-large">All Clean!</h3>
            <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              No failed webhooks in the Dead Letter Queue.
            </p>
          </div>
        )}
      </MD3Card>
    </div>
  );
}
