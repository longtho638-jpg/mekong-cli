import axios from 'axios';

// Default to localhost for dev, but allow override
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000/api/v1';

export interface ChangelogEntry {
  title: string;
  date: string;
  type: 'new' | 'fix' | 'improvement' | 'security' | string;
  author?: string;
  content_html: string;
  slug: string;
}

export interface ChangelogResponse {
  entries: ChangelogEntry[];
  total: number;
}

const api = axios.create({
  baseURL: BASE_URL,
});

export const getChangelog = async () => {
  const response = await api.get<ChangelogResponse>('/changelog');
  return response.data;
};

export const getLatestVersion = async () => {
  const response = await api.get('/latest');
  return response.data;
};
