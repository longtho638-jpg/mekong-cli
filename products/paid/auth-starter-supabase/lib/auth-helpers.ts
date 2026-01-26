import { type AuthError } from '@supabase/supabase-js';

export const getErrorMessage = (error: AuthError | null): string => {
  if (!error) return '';

  switch (error.status) {
    case 400:
      if (error.message.includes('Invalid login credentials')) {
        return 'Invalid email or password. Please try again.';
      }
      if (error.message.includes('User already registered')) {
        return 'This email is already registered. Try logging in instead.';
      }
      return error.message;
    case 422:
      return 'Invalid format. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    default:
      return error.message || 'An unexpected error occurred. Please try again.';
  }
};

export const validatePassword = (password: string): string | null => {
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
};
