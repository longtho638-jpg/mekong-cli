'use client';

import React, { useState } from 'react';
import { MD3Card, MD3Typography, MD3Button } from '@/components/md3';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Activity,
  Download,
  Calendar
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// --- Components ---

const MetricCard = ({ title, value, subtext, trend, trendValue, icon: Icon, alert }: any) => (
  <MD3Card variant="elevated" className={`p-6 relative overflow-hidden ${alert ? 'border-l-4 border-red-500' : ''}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${alert ? 'bg-red-100 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
        <Icon size={24} />
      </div>
      {trendValue && (
        <span className={`text-sm font-medium flex items-center ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
          {trendValue}%
        </span>
      )}
    </div>
    <MD3Typography variant="title-medium" className="text-gray-500 mb-1">{title}</MD3Typography>
    <MD3Typography variant="headline-medium" className="font-bold text-gray-900 mb-1">{value}</MD3Typography>
    {subtext && <MD3Typography variant="body-small" className="text-gray-400">{subtext}</MD3Typography>}
  </MD3Card>
);

const AlertBanner = ({ alerts }: { alerts: any[] }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-6">
      {alerts.map((alert, idx) => (
        <div key={idx} className={`p-4 rounded-lg flex items-center gap-3 ${
          alert.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          <AlertTriangle size={20} />
          <div>
            <span className="font-bold mr-2">[{alert.category.toUpperCase()}]</span>
            {alert.message}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function ExecutiveDashboardPage() {
  const [reportDays, setReportDays] = useState(30);

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['executive-dashboard'],
    queryFn: async () => {
      const res = await api.get('/executive/dashboard');
      return res.data;
    }
  });

  const { data: revenueTrend } = useQuery({
    queryKey: ['revenue-trend', reportDays],
    queryFn: async () => {
      const res = await api.get(`/revenue/trend?days=${reportDays}`);
      return res.data;
    }
  });

  const downloadReport = async () => {
    try {
      const response = await api.get(`/executive/report/pdf?days=${reportDays}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `executive_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Failed to download report", error);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading Executive Dashboard...</div>;
  }

  // Chart Data Preparation
  const chartLabels = revenueTrend?.map((d: any) => new Date(d.snapshot_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })) || [];
  const mrrData = revenueTrend?.map((d: any) => d.mrr) || [];
  const subscribersData = revenueTrend?.map((d: any) => d.active_subscribers) || [];

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'MRR ($)',
        data: mrrData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'y'
      },
      {
        label: 'Subscribers',
        data: subscribersData,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: { display: true, text: 'MRR ($)' }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Subscribers' }
      },
    },
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <MD3Typography variant="headline-medium" className="font-bold text-gray-900">
            Executive Dashboard
          </MD3Typography>
          <MD3Typography variant="body-large" className="text-gray-500">
            Real-time strategic overview & KPIs
          </MD3Typography>
        </div>

        <div className="flex gap-2">
           <MD3Button variant="outlined" onClick={() => setReportDays(30)} className={reportDays === 30 ? 'bg-primary-50' : ''}>
             30 Days
           </MD3Button>
           <MD3Button variant="outlined" onClick={() => setReportDays(90)} className={reportDays === 90 ? 'bg-primary-50' : ''}>
             90 Days
           </MD3Button>
           <MD3Button variant="filled" onClick={downloadReport}>
             <Download size={18} className="mr-2" />
             Export PDF
           </MD3Button>
        </div>
      </div>

      {/* Strategic Alerts */}
      <AlertBanner alerts={dashboard?.alerts} />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="MRR"
          value={`$${dashboard?.mrr?.toLocaleString() ?? '0'}`}
          subtext={`ARR: $${dashboard?.arr?.toLocaleString() ?? '0'}`}
          icon={DollarSign}
          trend="up"
          trendValue={5.2} // TODO: Calculate actual trend
        />

        <MetricCard
          title="Runway"
          value={`${dashboard?.runway_months?.toFixed(1) ?? '∞'} Months`}
          subtext={`Burn Rate: $${dashboard?.burn_rate?.toLocaleString()}/mo`}
          icon={Activity}
          alert={dashboard?.runway_months < 6}
        />

        <MetricCard
          title="Churn Rate"
          value={`${dashboard?.churn_rate?.toFixed(1) ?? '0'}%`}
          subtext="Revenue Churn"
          icon={TrendingUp}
          trend={dashboard?.churn_rate > 5 ? 'down' : 'up'} // 'down' means bad here, need context aware colors
          trendValue={1.1}
          alert={dashboard?.churn_rate > 5}
        />

        <MetricCard
          title="New Growth"
          value={dashboard?.new_leads_this_month ?? 0}
          subtext={`Pipeline: $${dashboard?.active_deals_value?.toLocaleString() ?? '0'}`}
          icon={Calendar}
        />
      </div>

      {/* Main Chart */}
      <MD3Card variant="elevated" className="p-6">
        <MD3Typography variant="title-large" className="mb-6 font-bold">Revenue & Growth Trend</MD3Typography>
        <div className="h-80 w-full">
          <Line options={chartOptions} data={chartData} />
        </div>
      </MD3Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Strategic Insights Placeholder */}
         <MD3Card variant="elevated" className="p-6">
            <MD3Typography variant="title-large" className="mb-4 font-bold">Strategic Insights</MD3Typography>
            <div className="space-y-4">
               <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-bold text-blue-800 mb-1">Growth Opportunity</h4>
                  <p className="text-sm text-blue-600">Consider increasing ad spend in APAC region based on recent LTV spikes.</p>
               </div>
               <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="font-bold text-gray-800 mb-1">Retention Focus</h4>
                  <p className="text-sm text-gray-600">Churn is stable but higher than industry avg (3%). Review onboarding flow.</p>
               </div>
            </div>
         </MD3Card>

         {/* Recent Actions / Audit Log Preview */}
         <MD3Card variant="elevated" className="p-6">
            <MD3Typography variant="title-large" className="mb-4 font-bold">System Status</MD3Typography>
            <div className="space-y-3">
               <div className="flex justify-between items-center border-b pb-2">
                 <span>Report Scheduler</span>
                 <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">HEALTHY</span>
               </div>
               <div className="flex justify-between items-center border-b pb-2">
                 <span>PDF Generation Service</span>
                 <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">HEALTHY</span>
               </div>
               <div className="flex justify-between items-center border-b pb-2">
                 <span>Revenue Engine</span>
                 <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">HEALTHY</span>
               </div>
            </div>
         </MD3Card>
      </div>
    </div>
  );
}
