import axios from 'axios';
import type { Project, Issue, Event } from './types';

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

// Note: We need to implement these endpoints in the backend first!
// They were not explicitly detailed in Phase 1, but we need them for the dashboard.
// I will assume standard REST patterns for now and implement the backend routes shortly.

export const getProjectIssues = async (projectId: number): Promise<Issue[]> => {
  const response = await api.get<Issue[]>(`/projects/${projectId}/issues`);
  return response.data;
};

export const getIssue = async (issueId: number): Promise<Issue> => {
  const response = await api.get<Issue>(`/issues/${issueId}`);
  return response.data;
};

export const getIssueEvents = async (issueId: number): Promise<Event[]> => {
  const response = await api.get<Event[]>(`/issues/${issueId}/events`);
  return response.data;
};
