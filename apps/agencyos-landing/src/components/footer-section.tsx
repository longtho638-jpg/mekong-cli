"use client";

import { useTranslations } from "next-intl";

export function FooterSection() {
  const t = useTranslations('footer');
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-8 md:py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
             <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                AgencyOS
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('tagline')}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{t('product.title')}</h3>
            <ul className="space-y-1">
              <li><a href="#" className="block py-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">{t('product.features')}</a></li>
              <li><a href="#" className="block py-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">{t('product.pricing')}</a></li>
              <li><a href="#" className="block py-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">{t('product.marketplace')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{t('resources.title')}</h3>
            <ul className="space-y-1">
              <li><a href="#" className="block py-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">{t('resources.docs')}</a></li>
              <li><a href="#" className="block py-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">{t('resources.api')}</a></li>
              <li><a href="#" className="block py-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">{t('resources.blog')}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">{t('legal.title')}</h3>
            <ul className="space-y-1">
              <li><a href="#" className="block py-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">{t('legal.privacy')}</a></li>
              <li><a href="#" className="block py-2 text-sm text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">{t('legal.terms')}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
}
