import Link from 'next/link';
import { RegisterForm } from './register-form';

export default function RegisterPage() {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Create Account
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        Sign up for a free account to get started.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
