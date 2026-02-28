/**
 * Vibe Auth SDK — Provider-Agnostic Auth Types
 *
 * Reusable interfaces for any auth provider (Supabase, Firebase, Clerk).
 * Designed for RaaS (Retail-as-a-Service) multi-project reuse.
 */

// ─── Provider Identity ──────────────────────────────────────────

export type AuthProviderName = 'supabase' | 'firebase' | 'clerk';

// ─── Auth User ──────────────────────────────────────────────────

export interface VibeAuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  isAdmin?: boolean;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
}

// ─── Auth Result ────────────────────────────────────────────────

export interface VibeAuthResult<T = unknown> {
  data: T | null;
  error: VibeAuthError | null;
}

export interface VibeAuthError {
  message: string;
  code?: string;
  status?: number;
}

// ─── Auth State ─────────────────────────────────────────────────

export interface VibeAuthState {
  user: VibeAuthUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
}

// ─── Auth Session ───────────────────────────────────────────────

export interface VibeAuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: VibeAuthUser;
}

// ─── Auth Events ────────────────────────────────────────────────

export type AuthEventType = 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED';

export interface VibeAuthEvent {
  type: AuthEventType;
  session: VibeAuthSession | null;
}

export type AuthEventCallback = (event: VibeAuthEvent) => void;

// ─── Route Guard ────────────────────────────────────────────────

export type RouteGuardVerdict = 'allow' | 'redirect-login' | 'redirect-unauthorized';

export interface RouteGuardConfig {
  requireAuth: boolean;
  requiredRoles?: string[];
  redirectTo?: string;
}

// ─── Auto-Logout Config ────────────────────────────────────────

export interface AutoLogoutConfig {
  inactivityLimitMs: number;
  checkIntervalMs: number;
  onLogout?: () => void;
  trackedEvents?: string[];
}

// ─── Admin Check Config ────────────────────────────────────────

export interface AdminCheckConfig {
  adminEmails: string[];
  adminRoles: string[];
}

// ─── Provider Interface ─────────────────────────────────────────

export interface VibeAuthProvider {
  readonly name: AuthProviderName;

  signIn(email: string, password: string): Promise<VibeAuthResult<VibeAuthSession>>;
  signUp(email: string, password: string, metadata?: Record<string, unknown>): Promise<VibeAuthResult<VibeAuthSession>>;
  signOut(): Promise<VibeAuthResult<void>>;

  getSession(): Promise<VibeAuthSession | null>;
  onAuthStateChange(callback: AuthEventCallback): () => void;

  isConfigured(): boolean;
}
