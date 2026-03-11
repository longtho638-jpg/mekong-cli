/**
 * Auth-specific Type Definitions
 */

import type { Profile } from './database';

/**
 * User session object returned after authentication
 */
export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  user: AuthUser;
}

/**
 * Authenticated user with profile data
 */
export interface AuthUser extends Omit<Profile, 'id'> {
  id: string;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'github';

/**
 * User role type (matches database constraint)
 */
export type UserRole = 'admin' | 'user' | 'viewer';

/**
 * Subscription plan type
 */
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

/**
 * Subscription status type
 */
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

/**
 * Auth error types
 */
export type AuthErrorCode =
  | 'invalid_credentials'
  | 'user_not_found'
  | 'user_already_exists'
  | 'weak_password'
  | 'email_not_verified'
  | 'oauth_callback_error'
  | 'session_expired'
  | 'unauthorized';

/**
 * Standard auth response shape
 */
export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: AuthErrorCode;
    message: string;
  };
}
