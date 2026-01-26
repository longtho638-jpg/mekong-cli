import React, { useState } from 'react';
import { jobService } from '../services/api';

interface AddJobFormProps {
  onJobAdded: () => void;
}

export const AddJobForm: React.FC<AddJobFormProps> = ({ onJobAdded }) => {
  const [taskName, setTaskName] = useState('email_notification');
  const [payload, setPayload] = useState('{"email": "test@example.com"}');
  const [retries, setRetries] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(payload);
      } catch (err) {
        throw new Error("Invalid JSON payload");
      }

      await jobService.enqueueJob(taskName, parsedPayload, retries);
      onJobAdded();
      // Reset some fields if needed, or keep for rapid entry
    } catch (err: any) {
      setError(err.message || "Failed to enqueue job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Enqueue New Job</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">Task Name</label>
          <select
            id="taskName"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
          >
            <option value="email_notification">Email Notification</option>
            <option value="data_processing">Data Processing</option>
            <option value="fail_test">Fail Test (Simulate Error)</option>
          </select>
        </div>

        <div>
          <label htmlFor="payload" className="block text-sm font-medium text-gray-700">Payload (JSON)</label>
          <textarea
            id="payload"
            rows={3}
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2 font-mono"
          />
        </div>

        <div>
          <label htmlFor="retries" className="block text-sm font-medium text-gray-700">Max Retries</label>
          <input
            type="number"
            id="retries"
            min={0}
            max={10}
            value={retries}
            onChange={(e) => setRetries(parseInt(e.target.value))}
            className="mt-1 block w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md p-2"
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Enqueueing...' : 'Enqueue Job'}
        </button>
      </form>
    </div>
  );
};
