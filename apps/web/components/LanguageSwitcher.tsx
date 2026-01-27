'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

const LANGUAGES = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'vi-VN', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ar-SA', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'he-IL', name: 'עברית', flag: '🇮🇱', rtl: true },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    // Update dir attribute
    const isRTL = LANGUAGES.find(l => l.code === lang)?.rtl;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // Persist to backend (optional, fail silently)
    try {
      // We assume there is an API for this, but if not we just rely on cookie
      // fetch('/api/user/preferences', {
      //   method: 'PATCH',
      //   body: JSON.stringify({ preferred_language: lang })
      // }).catch(() => {});
    } catch (e) {
        // ignore
    }
    setOpen(false);
  };

  if (!mounted) return null; // Avoid hydration mismatch

  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        type="button"
      >
        <span role="img" aria-label={currentLang.name}>{currentLang.flag}</span>
        <span>{currentLang.name}</span>
        <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                role="menuitem"
              >
                <span role="img" aria-label={lang.name}>{lang.flag}</span>
                <span className="flex-1">{lang.name}</span>
                {lang.rtl && <span className="text-xs text-gray-400 border border-gray-200 px-1 rounded">RTL</span>}
                {currentLang.code === lang.code && (
                  <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
