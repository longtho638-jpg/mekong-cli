import { useI18n } from './context.js';

export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
