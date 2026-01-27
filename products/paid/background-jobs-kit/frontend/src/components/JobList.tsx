import React, { useEffect, useState } from 'react';
import { Job, jobService } from '../services/api';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { JobDetails } from './JobDetails';

interface JobListProps {
  onRetry: () => void;
}

export const JobList: React.FC<JobListProps> = ({ onRetry }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const status = filter === 'all' ? undefined : filter;
      const data = await jobService.listJobs(50, 0, status);
      setJobs(data);
    } catch (error) {
      console.error("Failed to fetch jobs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [filter]);

  const handleRetry = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // Prevent opening details
    try {
      await jobService.retryJob(jobId);
      fetchJobs();
      onRetry();
    } catch (error) {
      console.error("Failed to retry job", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing': return <Play className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'delayed': return <Clock className="h-5 w-5 text-gray-500" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Jobs</h3>
          <div className="flex space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="delayed">Delayed</option>
            </select>
            <button
              onClick={fetchJobs}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div className="border-t border-gray-200">
          <ul role="list" className="divide-y divide-gray-200">
            {!jobs || jobs.length === 0 ? (
              <li className="px-4 py-4 sm:px-6 text-center text-gray-500">No jobs found</li>
            ) : (
              jobs.map((job) => (
                <li
                  key={job.job_id}
                  onClick={() => setSelectedJob(job)}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition duration-150 ease-in-out cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center truncate min-w-0 flex-1">
                      <div className="flex-shrink-0 mr-3">
                        {getStatusIcon(job.status)}
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-medium text-indigo-600 truncate">{job.task_name}</p>
                        <p className="flex items-center text-sm text-gray-500 truncate">
                          ID: {job.job_id}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex flex-col items-end">
                      <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        job.status === 'completed' ? 'bg-green-100 text-green-800' :
                        job.status === 'failed' ? 'bg-red-100 text-red-800' :
                        job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                         {job.created_at ? formatDistanceToNow(new Date(job.created_at * 1000), { addSuffix: true }) : 'N/A'}
                      </p>
                      {job.status === 'failed' && (
                        <button
                          onClick={(e) => handleRetry(e, job.job_id)}
                          className="mt-2 text-xs text-indigo-600 hover:text-indigo-900"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  {job.error && (
                    <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                      Error: {job.error}
                    </div>
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {selectedJob && (
        <JobDetails job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </>
  );
};
