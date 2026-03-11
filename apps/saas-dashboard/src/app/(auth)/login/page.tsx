import Link from 'next/link';
import { LoginForm } from './login-form';

export default function LoginPage() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Sign In
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Welcome back! Please sign in to continue.
      </p>

      <div className="mt-8">
        <LoginForm />
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
