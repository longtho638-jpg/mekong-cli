/**
 * Audit Log Viewer Component
 * Displays license audit logs in a timeline view with filtering.
 */
import { useState, useMemo } from 'react';
import { AuditLogFilters, useAuditLogs } from '../hooks/use-audit-logs';

interface AuditLogViewerProps {
  licenseId?: string;
}

const EVENT_TYPES: { id: AuditLogFilters['eventType']; label: string; color: string }[] = [
  { id: 'all', label: 'All Events', color: 'text-muted' },
  { id: 'created', label: 'Created', color: 'text-accent' },
  { id: 'activated', label: 'Activated', color: 'text-profit' },
  { id: 'revoked', label: 'Revoked', color: 'text-loss' },
  { id: 'api_call', label: 'API Call', color: 'text-blue-400' },
  { id: 'ml_feature', label: 'ML Feature', color: 'text-purple-400' },
  { id: 'rate_limit', label: 'Rate Limit', color: 'text-amber-400' },
];

function getEventColor(event: string): string {
  const colors: Record<string, string> = {
    created: 'bg-accent/10 text-accent border-accent/40',
    activated: 'bg-profit/10 text-profit border-profit/40',
    revoked: 'bg-loss/10 text-loss border-loss/40',
    api_call: 'bg-blue-500/10 text-blue-400 border-blue-500/40',
    ml_feature: 'bg-purple-500/10 text-purple-400 border-purple-500/40',
    rate_limit: 'bg-amber-500/10 text-amber-400 border-amber-500/40',
  };
  return colors[event] || 'bg-muted/10 text-muted border-muted/40';
}

function EventBadge({ event }: { event: string }) {
  const colorClass = getEventColor(event);
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${colorClass}`}>
      {event.replace(/_/g, ' ')}
    </span>
  );
}

function formatTimestamp(date: string): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatFullTimestamp(date: string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

export function AuditLogViewer({ licenseId }: AuditLogViewerProps) {
  const { logs, loading, error } = useAuditLogs(licenseId);
  const [filter, setFilter] = useState<'all' | 'created' | 'activated' | 'revoked' | 'api_call' | 'ml_feature' | 'rate_limit'>('all');

  const filteredLogs = useMemo(() => {
    if (!filter || filter === 'all') return logs;
    return logs.filter((log) => log.event === filter);
  }, [logs, filter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted font-mono">
        <svg className="animate-spin h-8 w-8 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-sm">Loading audit logs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-loss/10 border border-loss/40 rounded text-loss text-sm">
        <p className="font-semibold mb-1">Failed to load audit logs</p>
        <p className="text-xs opacity-80">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setFilter(type.id as 'all' | 'created' | 'activated' | 'revoked' | 'api_call' | 'ml_feature' | 'rate_limit')}
            className={`
              px-3 py-1.5 text-xs font-mono rounded border transition-colors
              ${
                filter === type.id
                  ? `bg-accent/20 ${type.color} border-accent/40`
                  : 'bg-bg-card/50 text-muted border-bg-border hover:border-muted/40'
              }
            `}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted font-mono bg-bg-card border border-bg-border rounded-lg">
          <svg className="w-12 h-12 mb-4 opacity-30" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">
            {filter === 'all'
              ? 'No audit logs available'
              : `No "${filter.replace('_', ' ')}" events found`}
          </p>
          <p className="text-xs mt-2 opacity-60">
            {filter === 'all'
              ? 'Activity will appear here as the license is used'
              : 'Try selecting a different filter'}
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-bg-border" />

          {/* Log Entries */}
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-10">
                {/* Timeline Dot */}
                <div
                  className={`
                    absolute left-2 w-4 h-4 rounded-full border-2 bg-bg-primary
                    ${getEventColor(log.event).replace('text-', 'border-').split(' ')[2]}
                  `}
                />

                {/* Log Card */}
                <div className="bg-bg-card border border-bg-border rounded-lg p-4 hover:bg-bg-card/60 transition-colors">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <EventBadge event={log.event} />
                      {log.tier && (
                        <span className="text-xs text-muted font-mono">
                          Tier: {log.tier}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs text-muted font-mono"
                      title={formatFullTimestamp(log.createdAt)}
                    >
                      {formatTimestamp(log.createdAt)}
                    </span>
                  </div>

                  {/* Metadata */}
                  {(log.ip || log.metadata) && (
                    <div className="mt-3 pt-3 border-t border-bg-border/50">
                      {log.ip && (
                        <div className="flex items-center gap-2 text-xs text-muted font-mono mb-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <span>IP: {log.ip}</span>
                        </div>
                      )}
                      {log.metadata && typeof log.metadata === 'object' && (
                        <div className="text-xs text-muted font-mono">
                          <span className="text-muted/60">Metadata:</span>
                          <pre className="mt-1 text-[10px] bg-bg-primary/50 p-2 rounded overflow-auto max-h-32">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
