export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'google' | 'github' | 'discord' | 'email';
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface LoginCredentials {
  email?: string;
  password?: string;
  provider?: string;
  code?: string; // For OAuth callback
}
