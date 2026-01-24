import { Locale, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../types';
import { locales } from '../locales';

/**
 * Get the current locale from the URL path.
 * Expects URLs like /vi/docs/... or /docs/... (defaults to EN)
 */
export function getLocaleFromUrl(url: URL): Locale {
  const [, locale] = url.pathname.split('/');
  if (SUPPORTED_LOCALES.includes(locale as Locale)) {
    return locale as Locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Get a translation function for a given locale.
 * Useful for Astro server-side components.
 */
export function useTranslations(locale: Locale) {
  return function t(key: string): string {
    const keys = key.split('.');
    let result: any = locales[locale];

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key;
      }
    }

    return typeof result === 'string' ? result : key;
  };
}

/**
 * Prefix a path with the given locale if it's not the default locale.
 */
export function getRelativeLocaleUrl(locale: Locale, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) {
    return normalizedPath;
  }
  return `/${locale}${normalizedPath}`;
}
