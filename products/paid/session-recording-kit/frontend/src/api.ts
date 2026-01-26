import axios from 'axios';
import type { Project, Session, SessionEvent } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
});

export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects/');
  return response.data;
};

export const createProject = async (name: string): Promise<Project> => {
  const response = await api.post<Project>('/projects/', { name });
  return response.data;
};

export const getProjectSessions = async (projectId: number): Promise<Session[]> => {
  const response = await api.get<Session[]>(`/projects/${projectId}/sessions`);
  return response.data;
};

export const getSession = async (sessionId: string): Promise<Session> => {
  const response = await api.get<Session>(`/sessions/${sessionId}`);
  return response.data;
};

export const getSessionEvents = async (sessionId: string): Promise<SessionEvent[]> => {
  const response = await api.get<SessionEvent[]>(`/sessions/${sessionId}/events`);
  return response.data;
};
