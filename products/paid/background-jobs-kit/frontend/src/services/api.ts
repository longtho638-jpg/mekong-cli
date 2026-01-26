import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Job {
  job_id: string;
  task_name: string;
  payload: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: number;
  retries: number;
  max_retries: number;
  error?: string;
}

export interface Stats {
  pending: number;
  processing: number;
  failed: number;
  total_jobs: number;
}

export const jobService = {
  getStats: async (): Promise<Stats> => {
    const response = await api.get<Stats>('/stats');
    return response.data;
  },

  enqueueJob: async (taskName: string, payload: Record<string, any> = {}, maxRetries: number = 3): Promise<{ job_id: string; status: string }> => {
    const response = await api.post('/jobs', {
      task_name: taskName,
      payload,
      max_retries: maxRetries,
    });
    return response.data;
  },

  getJob: async (jobId: string): Promise<Job> => {
    const response = await api.get<Job>(`/jobs/${jobId}`);
    return response.data;
  },

  retryJob: async (jobId: string): Promise<void> => {
    await api.post(`/jobs/${jobId}/retry`);
  },

  clearFailedJobs: async (): Promise<{ message: string }> => {
    const response = await api.delete('/jobs/failed');
    return response.data;
  },
};
