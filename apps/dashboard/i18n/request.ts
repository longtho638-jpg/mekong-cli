import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    // Validate locale
    if (!locale || !['en', 'vi', 'zh'].includes(locale)) {
        locale = 'vi';
    }

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
