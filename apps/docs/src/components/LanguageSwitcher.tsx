import { useState, useEffect } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SUPPORTED_LOCALES as LOCALES, Locale } from '@agencyos/i18n/types';
import { getRelativeLocaleUrl } from '@agencyos/i18n/astro';

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  ja: '日本語',
  ko: '한국어',
  th: 'ไทย',
  id: 'Bahasa Indonesia'
};

interface LanguageSwitcherProps {
  currentLocale: Locale;
  currentPath: string;
}

export default function LanguageSwitcher({ currentLocale, currentPath }: LanguageSwitcherProps) {
  const [locale, setLocale] = useState<Locale>(currentLocale);

  useEffect(() => {
    // SSR safety check
    if (typeof window !== 'undefined') {
      // Load saved language preference
      const savedLocale = localStorage.getItem('preferred-locale') as Locale;
      if (savedLocale && (LOCALES as string[]).includes(savedLocale)) {
        setLocale(savedLocale);
      }
    }
  }, []);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);

    // SSR safety check
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-locale', newLocale);

      // Get the current slug without locale prefix
      // Example paths: /docs/intro, /vi/docs/intro, /pricing, /vi/pricing
      let slug = currentPath;

      // Remove leading slash for processing
      if (slug.startsWith('/')) slug = slug.slice(1);

      // Split into parts
      const parts = slug.split('/');

      // If first part is a supported locale, remove it
      if ((LOCALES as string[]).includes(parts[0])) {
        parts.shift();
      }

      const cleanSlug = parts.join('/');
      const newPath = getRelativeLocaleUrl(newLocale, `/${cleanSlug}`);

      // Navigate to the new path
      window.location.href = newPath;
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="language-switcher-trigger"
          aria-label="Switch language"
          title="Switch language"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          <span className="language-label">{LOCALE_LABELS[locale]}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chevron-icon"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className="language-switcher-content" sideOffset={8} align="end">
          {LOCALES.map((lang) => (
            <DropdownMenu.Item
              key={lang}
              className={`language-switcher-item ${lang === locale ? 'active' : ''}`}
              onSelect={() => handleLanguageChange(lang)}
            >
              <span className="language-name">{LOCALE_LABELS[lang]}</span>
              {lang === locale && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="check-icon"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
