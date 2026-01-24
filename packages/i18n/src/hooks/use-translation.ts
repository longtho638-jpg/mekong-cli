import { useI18n } from './context.js';

export function useTranslation() {
  const { t, locale } = useI18n();
  return { t, locale };
}
