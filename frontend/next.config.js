/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    eslint: {
        ignoreDuringBuilds: true,
    },
    webpack: (config, { isServer }) => {
        // Fix for Edge Runtime compatibility - polyfill Node.js globals
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                os: false,
            };
        }
        return config;
    },
    experimental: {
        // Disable problematic features that may cause Edge issues
        serverComponentsExternalPackages: ['ua-parser-js'],
    },
}

module.exports = withNextIntl(nextConfig);
