/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@lobster/db", "@lobster/agents"],
};

module.exports = nextConfig;
