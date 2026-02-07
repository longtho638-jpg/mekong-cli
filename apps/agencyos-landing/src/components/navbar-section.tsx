"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function NavbarSection() {
  const t = useTranslations('nav');
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            AgencyOS
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 active:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-400 dark:active:text-indigo-500 transition-colors">
            {t('features')}
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 active:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-400 dark:active:text-indigo-500 transition-colors">
            {t('pricing')}
          </Link>
          <Link href="https://github.com/agencyos/mekong-cli" target="_blank" className="text-sm font-medium text-slate-600 hover:text-indigo-600 active:text-indigo-700 dark:text-slate-400 dark:hover:text-indigo-400 dark:active:text-indigo-500 transition-colors">
            GitHub
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="#pricing"
            className="hidden sm:inline-flex h-9 items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          >
            {t('signup')}
          </Link>
        </div>
      </div>
    </header>
  );
}
