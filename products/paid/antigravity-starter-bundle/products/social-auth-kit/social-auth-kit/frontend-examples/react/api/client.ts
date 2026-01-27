import axios from 'axios';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint
        const refreshResponse = await apiClient.post('/auth/refresh');
        const { access_token } = refreshResponse.data;

        // Update default header and original request header
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        originalRequest.headers['Authorization'] = `Bearer ${access_token}`;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed (token expired or invalid)
        // Redirect to login or handle logout
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
