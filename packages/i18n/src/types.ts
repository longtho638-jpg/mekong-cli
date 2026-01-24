export type Locale = 'en' | 'vi' | 'ja' | 'ko' | 'th' | 'id';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'vi', 'ja', 'ko', 'th', 'id'];

export const DEFAULT_LOCALE: Locale = 'en';

export interface TranslationKeys {
  [key: string]: string | TranslationKeys;
}

export interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
}
