import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function SuccessPage() {
  const t = useTranslations('success');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950 px-4 text-center">
      <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
        <svg
          className="h-12 w-12 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
        {t('title')}
      </h1>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
        {t('message')}
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          href="/"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {t('back')}
        </Link>
      </div>
    </div>
  );
}
