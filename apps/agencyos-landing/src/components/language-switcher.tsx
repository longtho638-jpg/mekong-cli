"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';
import { Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const handleLocaleChange = (newLocale: Locale) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newPathname);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg glass-effect hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] justify-center"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{localeNames[locale as Locale]}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 right-0 glass-effect rounded-lg overflow-hidden min-w-[140px] z-50"
          >
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleLocaleChange(loc)}
                className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors min-h-[44px] flex items-center ${
                  locale === loc ? 'bg-white/5 font-medium' : ''
                }`}
              >
                {localeNames[loc]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
