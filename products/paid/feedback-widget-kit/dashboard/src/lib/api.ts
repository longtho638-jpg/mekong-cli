import { Feedback, FeedbackStatus, FeedbackType } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const API_KEY = import.meta.env.VITE_API_KEY || '';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
});

export const fetchFeedbacks = async (type?: FeedbackType, status?: FeedbackStatus): Promise<Feedback[]> => {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status) params.append('status', status);

  const response = await fetch(`${API_URL}/feedback?${params.toString()}`, {
    headers: {
        'X-API-Key': API_KEY,
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch feedbacks');
  }
  return response.json();
};

export const updateFeedbackStatus = async (id: number, status: FeedbackStatus): Promise<Feedback> => {
  const response = await fetch(`${API_URL}/feedback/${id}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update feedback status');
  }
  return response.json();
};

export const deleteFeedback = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/feedback/${id}`, {
    method: 'DELETE',
    headers: {
        'X-API-Key': API_KEY,
    }
  });

  if (!response.ok) {
    throw new Error('Failed to delete feedback');
  }
};
