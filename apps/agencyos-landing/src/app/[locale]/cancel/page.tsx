import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function CancelPage() {
  const t = useTranslations('cancel');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-slate-950 px-4 text-center">
      <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30">
        <svg
          className="h-12 w-12 text-yellow-600 dark:text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
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
          href="/#pricing"
          className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          {t('tryAgain')}
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold leading-6 text-slate-900 dark:text-white"
        >
          {t('back')} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
