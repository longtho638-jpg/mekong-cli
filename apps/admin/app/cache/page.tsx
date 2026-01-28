'use client';

import React from 'react';
import { MD3Card, MD3Typography, MD3Button } from '@/components/md3';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Database, Activity, Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const StatCard = ({ title, value, subtext, icon, color = 'blue' }: any) => (
  <MD3Card variant="elevated" className="p-6">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-100 text-${color}-700`}>
        {icon}
      </div>
    </div>
    <MD3Typography variant="title-medium" className="text-gray-500 mb-1">{title}</MD3Typography>
    <MD3Typography variant="headline-medium" className="font-bold text-gray-900">{value}</MD3Typography>
    {subtext && <MD3Typography variant="body-small" className="text-gray-500 mt-1">{subtext}</MD3Typography>}
  </MD3Card>
);

export default function CacheDashboard() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['cache-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/cache/stats');
      return res.data;
    },
    refetchInterval: 5000 // Real-time updates
  });

  const flushMutation = useMutation({
    mutationFn: async () => {
      await api.post('/admin/cache/flush?confirm=true');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cache-stats'] });
      alert('Cache flushed successfully');
    },
    onError: (err) => {
      alert('Failed to flush cache');
    }
  });

  const handleFlush = () => {
    if (confirm('Are you sure you want to flush the ENTIRE cache? This will degrade performance temporarily.')) {
      flushMutation.mutate();
    }
  };

  if (isLoading) return <div>Loading cache stats...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Cache Management</MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">Monitor and manage application caching layers</MD3Typography>
        </div>
        <div className="flex gap-2">
          <Link href="/cache/keys">
            <MD3Button variant="outlined">Browse Keys</MD3Button>
          </Link>
          <Link href="/cache/invalidate">
            <MD3Button variant="outlined">Invalidate</MD3Button>
          </Link>
          <MD3Button variant="filled" className="bg-red-600 hover:bg-red-700" onClick={handleFlush}>
            <Trash2 size={18} className="mr-2" />
            Flush All
          </MD3Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Hit Rate"
          value={`${stats?.hit_rate_percent}%`}
          subtext={`${stats?.hits} hits / ${stats?.misses} misses`}
          icon={<Activity size={24} />}
          color="green"
        />
        <StatCard
          title="Avg Latency"
          value={`${stats?.avg_latency_ms}ms`}
          subtext="Operation latency"
          icon={<RefreshCw size={24} />}
          color="blue"
        />
        <StatCard
          title="Operations"
          value={(stats?.hits + stats?.misses + stats?.writes).toLocaleString()}
          subtext={`${stats?.writes} writes / ${stats?.deletes} deletes`}
          icon={<Database size={24} />}
          color="purple"
        />
        <StatCard
          title="Errors"
          value={stats?.errors}
          subtext="Cache operation errors"
          icon={<AlertTriangle size={24} />}
          color={stats?.errors > 0 ? 'red' : 'gray'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MD3Card variant="elevated" className="p-6">
          <MD3Typography variant="title-large" className="mb-4">Operation Breakdown</MD3Typography>
          <div className="space-y-4">
            {stats?.ops_breakdown && Object.entries(stats.ops_breakdown).map(([op, count]: [string, any]) => (
              <div key={op} className="flex justify-between items-center border-b pb-2">
                <span className="capitalize text-gray-700 font-medium">{op}</span>
                <span className="text-gray-900">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </MD3Card>

        <MD3Card variant="elevated" className="p-6">
          <MD3Typography variant="title-large" className="mb-4">Configuration</MD3Typography>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-700 font-medium">Backend</span>
              <span className="text-gray-900">Redis</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-700 font-medium">Mode</span>
              <span className="text-gray-900">Cluster (AWS ElastiCache)</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-700 font-medium">Eviction Policy</span>
              <span className="text-gray-900">volatile-lru</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-700 font-medium">Memory Usage</span>
              <span className="text-gray-900">128MB / 1GB</span>
            </div>
          </div>
        </MD3Card>
      </div>
    </div>
  );
}
