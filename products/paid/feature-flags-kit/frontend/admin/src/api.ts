import axios from 'axios';
import type { FeatureFlag, FeatureFlagCreate, FeatureFlagUpdate } from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getFlags = async (): Promise<FeatureFlag[]> => {
  const response = await api.get<FeatureFlag[]>('/flags');
  return response.data;
};

export const getFlag = async (key: string): Promise<FeatureFlag> => {
  const response = await api.get<FeatureFlag>(`/flags/${key}`);
  return response.data;
};

export const createFlag = async (data: FeatureFlagCreate): Promise<FeatureFlag> => {
  const response = await api.post<FeatureFlag>('/flags', data);
  return response.data;
};

export const updateFlag = async (key: string, data: FeatureFlagUpdate): Promise<FeatureFlag> => {
  const response = await api.patch<FeatureFlag>(`/flags/${key}`, data);
  return response.data;
};

export const deleteFlag = async (key: string): Promise<void> => {
  await api.delete(`/flags/${key}`);
};
