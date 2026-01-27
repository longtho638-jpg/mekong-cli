'use client';

import dynamic from 'next/dynamic';

const AnalyticsDashboard = dynamic(
  () => import('../../components/analytics/AnalyticsDashboard').then((mod) => mod.AnalyticsDashboard),
  { ssr: false }
);

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsDashboard />
    </div>
  );
}
