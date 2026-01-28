'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MD3Card,
  MD3Typography,
  MD3Grid
} from '@/components/md3';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { api } from '@/lib/api';

// Metric Card Component
const MetricCard = ({ title, value, unit, icon: Icon, trend, color = "primary" }: any) => (
  <MD3Card variant="filled" className="p-6">
    <div className="flex justify-between items-start">
      <div>
        <p className="m3-label-medium text-[var(--md-sys-color-on-surface-variant)] mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-1">
          <h2 className="m3-display-small text-[var(--md-sys-color-on-surface)]">
            {value}
          </h2>
          {unit && (
            <span className="m3-body-small text-[var(--md-sys-color-on-surface-variant)]">
              {unit}
            </span>
          )}
        </div>
      </div>
      <div className={`p-3 rounded-full bg-[var(--md-sys-color-${color}-container)] text-[var(--md-sys-color-${color})]`}>
        <Icon size={24} />
      </div>
    </div>
  </MD3Card>
);

export default function WebhookHealthPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['webhook-health'],
    queryFn: async () => {
      const res = await api.get('/health/stats');
      return res.data;
    },
    refetchInterval: 30000 // Refresh every 30s
  });

  if (isLoading) {
    return <div className="p-6">Loading Health Stats...</div>;
  }

  // Determine health color based on success rate
  const successRate = stats?.success_rate || 0;
  let healthColor = "success";
  if (successRate < 95) healthColor = "warning";
  if (successRate < 90) healthColor = "error";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="m3-headline-medium text-[var(--md-sys-color-on-surface)]">
            Webhook Health Dashboard
          </h1>
          <p className="m3-body-medium text-[var(--md-sys-color-on-surface-variant)]">
            Real-time delivery metrics and fire engine status (24h)
          </p>
        </div>
        <div className="flex items-center gap-2">
           <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium">System Operational</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Success Rate"
          value={stats?.success_rate}
          unit="%"
          icon={CheckCircle}
          color={healthColor === "error" ? "error" : "primary"}
        />
        <MetricCard
          title="Avg Latency"
          value={stats?.avg_latency}
          unit="ms"
          icon={Clock}
          color="secondary"
        />
        <MetricCard
          title="Total Events"
          value={stats?.total_events}
          icon={Activity}
          color="tertiary"
        />
        <MetricCard
          title="DLQ Entries"
          value={stats?.dlq_count || 0}
          icon={AlertTriangle}
          color={stats?.dlq_count > 0 ? "error" : "surface-variant"}
        />
      </div>

      {/* Charts section would go here */}
      <MD3Card variant="elevated" className="p-6 h-64 flex items-center justify-center text-[var(--md-sys-color-outline)]">
        Charts placeholder (Volume & Latency over time)
      </MD3Card>
    </div>
  );
}
