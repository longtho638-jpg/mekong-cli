import React from 'react';
import { Job } from '../services/api';
import { X } from 'lucide-react';

interface JobDetailsProps {
  job: Job;
  onClose: () => void;
}

export const JobDetails: React.FC<JobDetailsProps> = ({ job, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Job Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Job ID</dt>
              <dd className="mt-1 text-sm text-gray-900 break-all">{job.job_id}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Task Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{job.task_name}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                  ${job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'}`}>
                  {job.status}
                </span>
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(job.created_at * 1000).toLocaleString()}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Retries</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.retries} / {job.max_retries}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Payload</dt>
              <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded overflow-x-auto">
                <pre>{JSON.stringify(job.payload, null, 2)}</pre>
              </dd>
            </div>
            {job.error && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-red-500">Error</dt>
                <dd className="mt-1 text-sm text-red-700 bg-red-50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {job.error}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
