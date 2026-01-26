'use client';

import { useUser, useAuth } from '../hooks/useAuth';
import ProtectedRoute from '../components/protected/protected-route';
import { AuthProvider } from '../components/auth/auth-provider';

function DashboardContent() {
  const { user } = useUser();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <nav className="bg-white shadow dark:bg-gray-800">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {user?.email}
              </span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="py-10">
        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-white shadow rounded-lg dark:bg-gray-800">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Protected Content
              </h2>
              <div className="mt-4 prose dark:prose-invert">
                <p className="text-gray-500 dark:text-gray-400">
                  This content is only visible to authenticated users. Your session is secure.
                </p>

                <h3 className="text-md font-medium text-gray-900 dark:text-white mt-6">
                  User Details
                </h3>
                <pre className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-md overflow-auto text-sm">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProtectedDashboardPage() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardContent />
      </ProtectedRoute>
    </AuthProvider>
  );
}
