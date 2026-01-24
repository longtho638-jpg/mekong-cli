import { useI18n } from './context';

export function useLocale() {
  const { locale, setLocale } = useI18n();
  return { locale, setLocale };
}
