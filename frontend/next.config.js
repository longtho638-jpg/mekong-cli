/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    // Note: webpack fallbacks removed - middleware runs in Edge Runtime
    // which doesn't support Node.js modules
}

module.exports = withNextIntl(nextConfig);
