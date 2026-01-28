import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
    let locale = await requestLocale;

    // Validate locale
    if (!locale || !['en', 'vi', 'zh'].includes(locale)) {
        locale = 'vi';
    }

    // Fallback to empty messages if file doesn't exist to prevent crash during build
    let messages = {};
    try {
        messages = (await import(`../messages/${locale}.json`)).default;
    } catch (error) {
        console.warn(`Could not load messages for locale: ${locale}`);
    }

    return {
        locale,
        messages
    };
});
