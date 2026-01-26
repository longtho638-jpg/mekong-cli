'use client';

import LoginForm from '../components/auth/login-form';
import { AuthProvider } from '../components/auth/auth-provider';

export default function BasicLoginPage() {
  return (
    <AuthProvider>
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My SaaS App
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Welcome back! Please login to continue.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-500">
            &copy; 2026 My SaaS App. All rights reserved.
          </p>
        </div>
      </div>
    </AuthProvider>
  );
}
