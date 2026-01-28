"use client";

import React, { useState, useEffect } from 'react';
// import {
//   MD3Card,
//   MD3Button,
//   MD3Typography,
//   MD3DataTable
// } from '@/components/md3'; // Assuming shared components exist, otherwise standard HTML/Tailwind
import { format } from 'date-fns';

interface DLQEntry {
  id: string;
  webhook_config_id: string;
  event_type: string;
  event_payload: Record<string, unknown>;
  error_message: string;
  retry_count: number;
  stored_at: string;
  replayed_at?: string;
}

export default function DLQPage() {
  const [entries, setEntries] = useState<DLQEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<DLQEntry | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dlq');
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async (id: string) => {
    try {
      await fetch(`/api/dlq/${id}/replay`, { method: 'POST' });
      // Refresh
      fetchEntries();
      if (selectedEntry?.id === id) setSelectedEntry(null);
    } catch (err) {
      alert('Failed to replay');
    }
  };

  const handleDiscard = async (id: string) => {
    if (!confirm('Are you sure you want to discard this entry?')) return;
    try {
      await fetch(`/api/dlq/${id}`, { method: 'DELETE' });
      fetchEntries();
      if (selectedEntry?.id === id) setSelectedEntry(null);
    } catch (err) {
      alert('Failed to discard');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="m3-display-small">Dead Letter Queue</h1>
        <div className="space-x-2">
           <button
             className="px-4 py-2 bg-[var(--md-sys-color-primary)] text-white rounded-full"
             onClick={fetchEntries}
           >
             Refresh
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline-variant)] overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[var(--md-sys-color-surface-container)]">
                <tr>
                  <th className="p-4 m3-label-large">Date</th>
                  <th className="p-4 m3-label-large">Event</th>
                  <th className="p-4 m3-label-large">Error</th>
                  <th className="p-4 m3-label-large">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => (
                  <tr
                    key={entry.id}
                    className={`border-t border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-low)] cursor-pointer ${selectedEntry?.id === entry.id ? 'bg-[var(--md-sys-color-secondary-container)]' : ''}`}
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <td className="p-4 m3-body-medium">
                      {format(new Date(entry.stored_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="p-4 m3-body-medium">{entry.event_type}</td>
                    <td className="p-4 m3-body-medium text-[var(--md-sys-color-error)] truncate max-w-xs">
                      {entry.error_message}
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        className="text-[var(--md-sys-color-primary)] font-medium text-sm"
                        onClick={(e) => { e.stopPropagation(); handleReplay(entry.id); }}
                      >
                        Replay
                      </button>
                      <button
                        className="text-[var(--md-sys-color-error)] font-medium text-sm"
                        onClick={(e) => { e.stopPropagation(); handleDiscard(entry.id); }}
                      >
                        Discard
                      </button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[var(--md-sys-color-outline)]">
                      No entries in DLQ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-1">
          {selectedEntry ? (
            <div className="bg-[var(--md-sys-color-surface)] p-6 rounded-xl border border-[var(--md-sys-color-outline-variant)] sticky top-6">
              <h2 className="m3-headline-small mb-4">Entry Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="m3-label-small text-[var(--md-sys-color-outline)]">ID</label>
                  <p className="m3-body-medium font-mono text-xs">{selectedEntry.id}</p>
                </div>

                <div>
                  <label className="m3-label-small text-[var(--md-sys-color-outline)]">Endpoint Config ID</label>
                  <p className="m3-body-medium font-mono text-xs">{selectedEntry.webhook_config_id}</p>
                </div>

                <div>
                  <label className="m3-label-small text-[var(--md-sys-color-outline)]">Error</label>
                  <div className="bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] p-3 rounded-lg text-sm">
                    {selectedEntry.error_message}
                  </div>
                </div>

                <div>
                  <label className="m3-label-small text-[var(--md-sys-color-outline)]">Payload</label>
                  <pre className="bg-[var(--md-sys-color-surface-container-high)] p-3 rounded-lg text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedEntry.event_payload, null, 2)}
                  </pre>
                </div>

                <div className="pt-4 flex gap-3">
                   <button
                     className="flex-1 py-2 bg-[var(--md-sys-color-primary)] text-white rounded-full m3-label-large"
                     onClick={() => handleReplay(selectedEntry.id)}
                   >
                     Replay Event
                   </button>
                   <button
                     className="flex-1 py-2 border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)] rounded-full m3-label-large"
                     onClick={() => handleDiscard(selectedEntry.id)}
                   >
                     Discard
                   </button>
                </div>
              </div>
            </div>
          ) : (
             <div className="bg-[var(--md-sys-color-surface-container)] p-8 rounded-xl text-center text-[var(--md-sys-color-outline)] h-full flex items-center justify-center">
               <p>Select an entry to view details</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
