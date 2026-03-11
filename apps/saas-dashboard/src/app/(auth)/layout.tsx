import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Authentication - SaaS Dashboard',
  description: 'Sign in or create an account to access your dashboard',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {children}
      </div>
    </div>
  );
}
