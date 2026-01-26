import React, { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { fetchFeedbacks } from './lib/api';
import { FeedbackCard } from './components/FeedbackCard';
import { FeedbackType, FeedbackStatus } from './types';
import { LayoutDashboard, Filter, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

const queryClient = new QueryClient();

const DashboardContent: React.FC = () => {
  const [filterType, setFilterType] = useState<FeedbackType | undefined>(undefined);
  const [filterStatus, setFilterStatus] = useState<FeedbackStatus | undefined>(undefined);

  const { data: feedbacks, isLoading, error, refetch } = useQuery({
    queryKey: ['feedbacks', filterType, filterStatus],
    queryFn: () => fetchFeedbacks(filterType, filterStatus),
  });

  const stats = {
    total: feedbacks?.length || 0,
    open: feedbacks?.filter(f => f.status === 'open').length || 0,
    bugs: feedbacks?.filter(f => f.type === 'bug').length || 0,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <LayoutDashboard size={20} />
            </div>
            <span className="font-bold text-lg">Feedback<span className="text-blue-600">Kit</span> Dashboard</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Total: <b>{stats.total}</b></span>
            <span>Open: <b>{stats.open}</b></span>
            <span>Bugs: <b>{stats.bugs}</b></span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
              <Filter size={12} /> Type
            </div>
            <button
              onClick={() => setFilterType(undefined)}
              className={clsx("px-3 py-1.5 text-sm rounded-md transition-colors", !filterType ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50")}
            >All</button>
            {(['bug', 'feature', 'general'] as FeedbackType[]).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={clsx("px-3 py-1.5 text-sm rounded-md capitalize transition-colors", filterType === t ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50")}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
              <Filter size={12} /> Status
            </div>
            <button
              onClick={() => setFilterStatus(undefined)}
              className={clsx("px-3 py-1.5 text-sm rounded-md transition-colors", !filterStatus ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50")}
            >All</button>
            {(['open', 'in_progress', 'resolved'] as FeedbackStatus[]).map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={clsx("px-3 py-1.5 text-sm rounded-md capitalize transition-colors", filterStatus === s ? "bg-slate-100 font-medium text-slate-900" : "text-slate-600 hover:bg-slate-50")}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetch()}
            className="ml-auto p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10 bg-red-50 rounded-lg border border-red-100">
            Failed to load feedbacks. Is the backend running?
          </div>
        ) : feedbacks?.length === 0 ? (
          <div className="text-center text-slate-400 py-20 bg-white rounded-lg border border-dashed border-slate-300">
            No feedbacks found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbacks?.map(feedback => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
};

export default App;
