'use client';

import React, { useState, useEffect } from 'react';
import { MD3Typography, MD3Button } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Download, Calendar, RefreshCcw, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { FunnelChart } from '@/components/charts/FunnelChart';
import { CohortChart } from '@/components/charts/CohortChart';
import { TrendChart } from '@/components/charts/TrendChart';

interface MetricCardProps {
    title: string;
    value?: number | string;
    change?: number;
    icon: React.ElementType;
    prefix?: string;
}

// Metric Card Component
function MetricCard({ title, value, change, icon: Icon, prefix = "" }: MetricCardProps) {
    const isPositive = (change ?? 0) >= 0;
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                    <Icon size={20} />
                </div>
                {change !== undefined && (
                    <div className={`text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {isPositive ? '+' : ''}{change}%
                    </div>
                )}
            </div>
            <div className="text-gray-500 text-sm font-medium">{title}</div>
            <div className="text-2xl font-bold mt-1 text-gray-900">{prefix}{value?.toLocaleString()}</div>
        </div>
    );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview'); // overview, funnel, cohort

  // 1. Fetch Dashboard Overview
  const { data: overview, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: async () => {
      // In a real implementation, call /api/v1/analytics/dashboard/overview
      // Mocking for now as the backend endpoint requires data in DB
      try {
        const res = await api.get('/api/v1/analytics/dashboard/overview');
        return res.data;
      } catch (e) {
        // Fallback mock data if DB is empty
        return {
            mrr: { metric_value: 12500, churn_rate_daily: 2.1 },
            active_users: { metric_value: 3450 },
            new_users: { metric_value: 120 },
            churn_rate: { metric_value: 1.2 }
        };
      }
    }
  });

  // 2. Fetch Funnel Data
  const { data: funnelData } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: async () => {
        try {
            const res = await api.post('/api/v1/analytics/funnel', {
                steps: ['page_view', 'signup_click', 'signup_submit', 'onboarding_start', 'onboarding_complete', 'subscription_start', 'subscription_complete'],
                start_date: '2026-01-01',
                end_date: '2026-01-31'
            });
            return res.data.funnel;
        } catch (e) {
            // Mock data
            return [
                { step: 'page_view', count: 5000, conversion_rate: 100 },
                { step: 'signup_click', count: 2500, conversion_rate: 50 },
                { step: 'signup_submit', count: 1800, conversion_rate: 72 },
                { step: 'onboarding_start', count: 1750, conversion_rate: 97 },
                { step: 'onboarding_complete', count: 1500, conversion_rate: 85 },
                { step: 'subscription_start', count: 800, conversion_rate: 53 },
                { step: 'subscription_complete', count: 600, conversion_rate: 75 },
            ];
        }
    }
  });

  // 3. Fetch Cohort Data
  const { data: cohortData } = useQuery({
    queryKey: ['analytics-cohort'],
    queryFn: async () => {
        try {
            const res = await api.get('/api/v1/analytics/cohort?period_type=weekly&periods=8');
            return res.data.cohorts;
        } catch (e) {
            // Mock data
            return [
                { cohort_date: '2026-W01', users: 150, data: [{period:0, percentage:100, count:150}, {period:1, percentage:85, count:127}, {period:2, percentage:70, count:105}] },
                { cohort_date: '2026-W02', users: 180, data: [{period:0, percentage:100, count:180}, {period:1, percentage:82, count:147}] },
                { cohort_date: '2026-W03', users: 200, data: [{period:0, percentage:100, count:200}] },
            ];
        }
    }
  });

  // 4. Mock Trend Data
  const trendData = [
      { date: 'Jan 1', value: 1000 },
      { date: 'Jan 5', value: 1200 },
      { date: 'Jan 10', value: 1150 },
      { date: 'Jan 15', value: 1400 },
      { date: 'Jan 20', value: 1650 },
      { date: 'Jan 25', value: 1800 },
      { date: 'Jan 30', value: 2100 },
  ];

  // 5. WebSocket Realtime
  useEffect(() => {
    // Connect to WebSocket
    // const ws = new WebSocket('ws://localhost:8000/ws/analytics/live');
    // ws.onmessage = (event) => { console.log("Realtime:", JSON.parse(event.data)); };
    // return () => ws.close();
  }, []);

  return (
    <div className="space-y-8 p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">Analytics Dashboard</MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">Real-time insights into system performance</MD3Typography>
        </div>
        <div className="flex gap-3">
             <MD3Button variant="outlined" startIcon={<Calendar size={18} />}>Last 30 Days</MD3Button>
             <MD3Button variant="text" startIcon={<RefreshCcw size={18} />}>Refresh</MD3Button>
             <MD3Button variant="filled" startIcon={<Download size={18} />}>Export</MD3Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
            title="Monthly Recurring Revenue"
            value={overview?.mrr?.metric_value || 0}
            change={5.2}
            icon={DollarSign}
            prefix="$"
        />
        <MetricCard
            title="Active Users"
            value={overview?.active_users?.metric_value || 0}
            change={12.5}
            icon={Users}
        />
        <MetricCard
            title="New Signups"
            value={overview?.new_users?.metric_value || 0}
            change={-2.4}
            icon={TrendingUp}
        />
        <MetricCard
            title="Churn Rate"
            value={overview?.churn_rate?.metric_value || 0}
            change={-0.5}
            icon={Activity}
            prefix="%"
        />
      </div>

      {/* Main Content Tabs */}
      <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['overview', 'funnel', 'cohort'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm capitalize
                  ${activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab} Analysis
              </button>
            ))}
          </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
          {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrendChart
                    data={trendData}
                    title="Revenue Trend (30 Days)"
                    dataKey="value"
                    valuePrefix="$"
                    className="lg:col-span-2"
                  />
                  <FunnelChart data={funnelData || []} title="User Journey Funnel" />
                  <CohortChart data={cohortData || []} title="User Retention (Weekly)" />
              </div>
          )}

          {activeTab === 'funnel' && (
              <div className="space-y-6">
                 <FunnelChart data={funnelData || []} title="Detailed Conversion Funnel" className="h-[600px]" />
              </div>
          )}

          {activeTab === 'cohort' && (
              <div className="space-y-6">
                 <CohortChart data={cohortData || []} title="Detailed Retention Analysis" className="h-[600px]" />
              </div>
          )}
      </div>
    </div>
  );
}
