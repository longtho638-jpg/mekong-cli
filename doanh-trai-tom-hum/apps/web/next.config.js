/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    output: "standalone",
    transpilePackages: ["@lobster/db", "@lobster/agents"],
};

module.exports = nextConfig;
