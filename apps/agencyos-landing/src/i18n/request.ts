import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  // Await the locale from the [locale] URL segment
  const requested = await requestLocale;

  // Validate locale is supported, fallback to default if invalid
  const locale = requested && locales.includes(requested as "en" | "vi")
    ? requested
    : defaultLocale;

  if (!requested || !locales.includes(requested as "en" | "vi")) {
    notFound();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
