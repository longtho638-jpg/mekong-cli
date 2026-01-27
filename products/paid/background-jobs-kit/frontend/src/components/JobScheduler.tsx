import React, { useState, useEffect } from 'react';
import { jobService } from '../services/api';
import { Trash2, Calendar } from 'lucide-react';

export const JobScheduler: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [taskName, setTaskName] = useState('email_notification');
  const [cron, setCron] = useState('*/1 * * * *');
  const [payload] = useState('{}');
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const data = await jobService.listScheduledJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await jobService.scheduleJob(taskName, cron, JSON.parse(payload));
      fetchJobs();
      setCron('*/1 * * * *');
    } catch (error) {
      alert('Failed to schedule job');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Unschedule this job?')) {
      await jobService.unscheduleJob(id);
      fetchJobs();
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Recurring Jobs</h3>

      <form onSubmit={handleSchedule} className="mb-6 space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
                <label className="block text-sm font-medium text-gray-700">Task</label>
                <select value={taskName} onChange={e => setTaskName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                    <option value="email_notification">Email Notification</option>
                    <option value="data_processing">Data Processing</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Cron Expression</label>
                <input type="text" value={cron} onChange={e => setCron(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="*/1 * * * *" />
            </div>
            <div className="flex items-end">
                <button type="submit" disabled={loading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    {loading ? 'Scheduling...' : 'Schedule'}
                </button>
            </div>
        </div>
      </form>

      <ul className="divide-y divide-gray-200">
        {!jobs || jobs.length === 0 ? (
          <li className="py-4 text-center text-gray-500 text-sm">No recurring jobs scheduled</li>
        ) : (
          jobs.map(job => (
            <li key={job.id} className="py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                        <p className="text-sm font-medium text-gray-900">{job.task_name}</p>
                        <p className="text-sm text-gray-500">{job.cron}</p>
                    </div>
                </div>
                <button onClick={() => handleDelete(job.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-5 w-5" />
                </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};
