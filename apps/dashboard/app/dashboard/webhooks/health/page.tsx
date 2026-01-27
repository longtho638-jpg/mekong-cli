import React from 'react';

// Mock data for health dashboard
const HEALTH_STATS = {
  successRate: 99.8,
  avgLatency: 145,
  totalEvents: 15420,
  endpointsActive: 12
};

const ENDPOINTS = [
  { id: '1', url: 'https://api.client.com/hooks', health: 100, status: 'Healthy', latency: 120 },
  { id: '2', url: 'https://hooks.slack.com/services/XXX', health: 98, status: 'Healthy', latency: 240 },
  { id: '3', url: 'https://mysite.com/webhook', health: 45, status: 'Unhealthy', latency: 850 },
];

export default function WebhookHealthPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="m3-display-small">Webhook Health</h1>
        <p className="m3-body-large text-[var(--md-sys-color-outline)]">System-wide performance and reliability metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Success Rate (24h)"
          value={`${HEALTH_STATS.successRate}%`}
          trend="+0.2%"
          positive
        />
        <StatCard
          label="Avg Latency (P50)"
          value={`${HEALTH_STATS.avgLatency}ms`}
          trend="-12ms"
          positive
        />
        <StatCard
          label="Total Events"
          value={HEALTH_STATS.totalEvents.toLocaleString()}
        />
        <StatCard
          label="Active Endpoints"
          value={HEALTH_STATS.endpointsActive.toString()}
        />
      </div>

      {/* Endpoints Table */}
      <div className="bg-[var(--md-sys-color-surface)] rounded-xl border border-[var(--md-sys-color-outline-variant)] p-6">
        <h2 className="m3-headline-small mb-4">Endpoint Status</h2>
        <table className="w-full text-left">
          <thead className="border-b border-[var(--md-sys-color-outline-variant)]">
            <tr>
              <th className="pb-3 m3-label-large">Endpoint URL</th>
              <th className="pb-3 m3-label-large">Health Score</th>
              <th className="pb-3 m3-label-large">Avg Latency</th>
              <th className="pb-3 m3-label-large">Status</th>
            </tr>
          </thead>
          <tbody>
            {ENDPOINTS.map(ep => (
              <tr key={ep.id} className="border-b border-[var(--md-sys-color-outline-variant)] last:border-0">
                <td className="py-4 font-mono text-sm truncate max-w-xs">{ep.url}</td>
                <td className="py-4">
                  <div className="w-32 bg-[var(--md-sys-color-surface-container-high)] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${ep.health > 90 ? 'bg-green-500' : ep.health > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${ep.health}%` }}
                    />
                  </div>
                  <span className="text-xs ml-1">{ep.health}%</span>
                </td>
                <td className="py-4">{ep.latency}ms</td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ep.status === 'Healthy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {ep.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, positive }: { label: string, value: string, trend?: string, positive?: boolean }) {
  return (
    <div className="bg-[var(--md-sys-color-surface)] p-5 rounded-xl border border-[var(--md-sys-color-outline-variant)]">
      <p className="m3-label-medium text-[var(--md-sys-color-outline)] mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="m3-headline-medium">{value}</span>
        {trend && (
          <span className={`text-xs font-medium ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
