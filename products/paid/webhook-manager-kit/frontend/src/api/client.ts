import axios from 'axios';

const API_URL = '/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const webhookApi = {
  getEndpoints: async () => {
    const response = await apiClient.get('/webhooks/');
    return response.data;
  },
  createEndpoint: async (data: any) => {
    const response = await apiClient.post('/webhooks/', data);
    return response.data;
  },
  updateEndpoint: async (id: number, data: any) => {
    const response = await apiClient.put(`/webhooks/${id}`, data);
    return response.data;
  },
  deleteEndpoint: async (id: number) => {
    const response = await apiClient.delete(`/webhooks/${id}`);
    return response.data;
  },
  getDeliveries: async (endpointId: number) => {
    const response = await apiClient.get(`/webhooks/${endpointId}/deliveries`);
    return response.data;
  },
  getEvents: async () => {
    const response = await apiClient.get('/events/');
    return response.data;
  },
  getEvent: async (id: number) => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  },
  retryDelivery: async (deliveryId: number) => {
    const response = await apiClient.post(`/deliveries/${deliveryId}/retry`);
    return response.data;
  },
  triggerEvent: async (eventType: string, payload: any) => {
    const response = await apiClient.post('/events/trigger', {
      event_type: eventType,
      payload: payload
    });
    return response.data;
  },
  retryFailed: async () => {
    const response = await apiClient.post('/events/retry-failed');
    return response.data;
  }
};
