import axios from 'axios';

// Get backend URL from env or default to localhost
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface RateLimitRule {
  path: string;
  method: string;
  limit: number;
  window: number;
  strategy: 'fixed' | 'sliding';
}

export interface RuleCreate {
  path: string;
  method: string;
  limit: number;
  window: number;
  strategy: 'fixed' | 'sliding';
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const getRules = async () => {
  const response = await api.get<RateLimitRule[]>('/api/v1/admin/rules/');
  return response.data;
};

export const createRule = async (rule: RuleCreate) => {
  const response = await api.post<RateLimitRule>('/api/v1/admin/rules/', rule);
  return response.data;
};

export const deleteRule = async (method: string, path: string) => {
  // Path might need encoding if it contains special chars, but usually just needs to be safe
  // The backend expects /api/v1/admin/rules/{method}/{path}
  // We need to ensure path doesn't have a leading slash if we rely on backend to add it or handle it carefully.
  // The backend code: normalized_path = f"/{path}" if not path.startswith("/") else path
  // The router path: /{method}/{path:path}
  // So if we pass "GET" and "/api/foo", url is .../GET//api/foo -> might be double slash.
  // Let's strip leading slash for safety in client before sending
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  const response = await api.delete(`/api/v1/admin/rules/${method}/${cleanPath}`);
  return response.data;
};

export default api;
