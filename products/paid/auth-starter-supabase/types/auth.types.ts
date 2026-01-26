import { type User as SupabaseUser, type Session as SupabaseSession, type AuthError } from '@supabase/supabase-js';

export type User = SupabaseUser;
export type Session = SupabaseSession;

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
}

export interface AuthContextType extends AuthState {
  signIn: (data: LoginCredentials) => Promise<{ error: AuthError | null }>;
  signUp: (data: SignupCredentials) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export type AuthView = 'sign_in' | 'sign_up' | 'forgot_password' | 'update_password';
