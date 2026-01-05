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
        // Enable Node.js runtime for middleware to fix __dirname error on Vercel
        nodeMiddleware: true,
    },
}

module.exports = withNextIntl(nextConfig);
