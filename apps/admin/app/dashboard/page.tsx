'use client';

import React from 'react';
import { MD3Card, MD3Typography, MD3Button } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ArrowUpRight, Users, DollarSign, Activity, Webhook } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MetricCard = ({ title, value, change, icon, trend }: any) => (
  <MD3Card variant="elevated" className="p-6">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
        {icon}
      </div>
      <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
        {change > 0 && '+'}{change}%
        <ArrowUpRight size={16} className="ml-1" />
      </span>
    </div>
    <MD3Typography variant="title-medium" className="text-gray-500 mb-1">{title}</MD3Typography>
    <MD3Typography variant="headline-medium" className="font-bold text-gray-900">{value}</MD3Typography>
  </MD3Card>
);

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/system/stats');
      return res.data;
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
        const res = await api.get('/admin/analytics/overview');
        return res.data;
    }
  });

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 22000, 24000, 28000],
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Dashboard</MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">Overview of system performance and metrics</MD3Typography>
        </div>
        <div className="flex gap-2">
            <MD3Button variant="outlined">Download Report</MD3Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={`$${analytics?.mrr?.toLocaleString() ?? '...'}`}
          change={analytics?.mrr_growth ?? 0}
          icon={<DollarSign size={24} />}
          trend="up"
        />
        <MetricCard
          title="Active Users"
          value={analytics?.active_users?.toLocaleString() ?? '...'}
          change={analytics?.active_users_growth ?? 0}
          icon={<Users size={24} />}
          trend="up"
        />
        <MetricCard
          title="API Requests"
          value={analytics?.api_requests?.toLocaleString() ?? '...'}
          change={analytics?.api_requests_growth ?? 0}
          icon={<Activity size={24} />}
          trend="up"
        />
        <MetricCard
          title="Webhook Health"
          value="99.9%"
          change={0.1}
          icon={<Webhook size={24} />}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MD3Card variant="elevated" className="p-6 lg:col-span-2">
          <MD3Typography variant="title-large" className="mb-4">Revenue Trend</MD3Typography>
          <div className="h-64 w-full">
            <Line options={{ maintainAspectRatio: false }} data={chartData} />
          </div>
        </MD3Card>

        <MD3Card variant="elevated" className="p-6">
          <MD3Typography variant="title-large" className="mb-4">System Status</MD3Typography>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">API Server</span>
                </div>
                <span className="text-sm text-green-600">Operational</span>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Database</span>
                </div>
                <span className="text-sm text-green-600">Operational</span>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Redis Cache</span>
                </div>
                <span className="text-sm text-green-600">Operational</span>
            </div>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Webhooks</span>
                </div>
                <span className="text-sm text-green-600">Operational</span>
            </div>
          </div>
        </MD3Card>
      </div>
    </div>
  );
}
