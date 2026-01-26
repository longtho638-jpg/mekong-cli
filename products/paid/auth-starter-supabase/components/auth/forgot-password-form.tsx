'use client';

import { useState } from 'react';
import { useAuth } from './auth-provider';
import { getErrorMessage } from '../../lib/auth-helpers';

export default function ForgotPasswordForm() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await resetPassword(email);

    if (result.error) {
      setError(getErrorMessage(result.error));
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center text-green-600 dark:text-green-400">
          Check your email
        </h2>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-300">
          We've sent a password reset link to <strong>{email}</strong>.
        </p>
        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
        Reset your password
      </h2>
      <p className="text-center text-gray-600 dark:text-gray-400">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md dark:bg-red-900/20 dark:text-red-400" role="alert">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending link...' : 'Send Reset Link'}
        </button>
      </form>

      <div className="text-center">
        <a href="/auth/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          Back to Login
        </a>
      </div>
    </div>
  );
}
