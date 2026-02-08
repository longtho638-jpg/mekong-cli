import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Cancelled — AgencyOS',
  description: 'Your payment was cancelled. You can try again anytime.',
  robots: { index: false, follow: false },
};

export default function CancelPage() {
  const t = useTranslations('cancel');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-deep-space-900 px-4 text-center">
      <div className="rounded-full bg-yellow-900/30 p-3">
        <svg
          className="h-12 w-12 text-yellow-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-starlight-100 sm:text-4xl">
        {t('title')}
      </h1>
      <p className="mt-4 text-lg text-gray-400 max-w-md mx-auto">
        {t('message')}
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          href="/#pricing"
          className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-shadow hover:shadow-xl hover:shadow-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-deep-space-900"
        >
          {t('tryAgain')}
        </Link>
        <Link
          href="/"
          className="text-sm font-semibold leading-6 text-starlight-100 hover:text-white"
        >
          {t('back')} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </main>
  );
}
