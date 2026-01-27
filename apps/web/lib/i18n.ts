import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'vi-VN', 'ar-SA', 'he-IL', 'zh-CN', 'ja-JP', 'es-ES', 'fr-FR', 'de-DE'],
    ns: ['common', 'auth', 'dashboard', 'errors', 'validation'],
    defaultNS: 'common',
    detection: {
      order: ['cookie', 'querystring', 'navigator'],
      caches: ['cookie'],
      cookieOptions: { path: '/', maxAge: 365 * 24 * 60 * 60 }
    },
    interpolation: {
      escapeValue: false // React already escapes
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
      useSuspense: true,
    }
  });

export default i18n;
