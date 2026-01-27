import React, { useEffect, useState } from 'react';
import { jobService, Stats } from '../services/api';
import { StatsCard } from './StatsCard';
import { AddJobForm } from './AddJobForm';
import { JobList } from './JobList';
import { JobScheduler } from './JobScheduler';
import { Activity, AlertOctagon, Clock, RefreshCw, Trash2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ pending: 0, processing: 0, failed: 0, total_jobs: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchStats = async () => {
    try {
      const data = await jobService.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const triggerRefresh = () => {
    fetchStats();
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    fetchStats();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchStats, 2000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearFailed = async () => {
    if (confirm("Are you sure you want to clear all failed jobs?")) {
      await jobService.clearFailedJobs();
      triggerRefresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Background Jobs Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${autoRefresh ? 'bg-green-100 text-green-800' : 'bg-white text-gray-700'} hover:bg-gray-50 focus:outline-none`}
          >
            {autoRefresh ? 'Auto-Refresh On' : 'Auto-Refresh Off'}
          </button>
          <button
            type="button"
            onClick={triggerRefresh}
            className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard title="Total Jobs" value={stats.total_jobs} icon={Activity} color="blue" />
        <StatsCard title="Pending" value={stats.pending} icon={Clock} color="yellow" />
        <StatsCard title="Processing" value={stats.processing} icon={RefreshCw} color="blue" />
        <StatsCard title="Failed" value={stats.failed} icon={AlertOctagon} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Actions & Forms */}
        <div className="lg:col-span-1 space-y-6">
          <AddJobForm onJobAdded={triggerRefresh} />

          <JobScheduler />

          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">System Actions</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <div className="flex space-x-4">
                <button
                  onClick={handleClearFailed}
                  disabled={stats.failed === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Failed Jobs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Job List */}
        <div className="lg:col-span-2">
          <JobList key={refreshTrigger} onRetry={triggerRefresh} />
        </div>
      </div>
    </div>
  );
};
