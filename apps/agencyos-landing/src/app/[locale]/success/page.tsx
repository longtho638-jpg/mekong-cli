import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payment Successful — AgencyOS',
  description: 'Thank you for your purchase. Your AgencyOS access is being provisioned.',
  robots: { index: false, follow: false },
};

export default function SuccessPage() {
  const t = useTranslations('success');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-deep-space-900 px-4 text-center">
      <div className="rounded-full bg-green-900/30 p-3">
        <svg
          className="h-12 w-12 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
          href="/"
          className="rounded-full bg-gradient-to-r from-purple-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-shadow hover:shadow-xl hover:shadow-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-deep-space-900"
        >
          {t('back')}
        </Link>
      </div>
    </main>
  );
}
