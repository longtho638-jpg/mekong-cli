import createMiddleware from 'next-intl/middleware';

// Use Node.js runtime to avoid Edge Runtime limitations with __dirname
export const runtime = 'nodejs';

export default createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'vi', 'zh'],

    // Used when no locale matches
    defaultLocale: 'vi'
});

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(vi|en|zh)/:path*']
};
