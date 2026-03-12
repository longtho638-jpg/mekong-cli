import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages
  output: 'export',
  images: {
    unoptimized: true,
    disableStaticImages: true
  },
  // Bundle Optimization - removeConsole in production
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Disable ISR for static export
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 2,
  },
  // Disable webpack cache for CF deployment
  webpack: (config) => {
    config.cache = false;
    return config;
  },
  // Exclude agi-sops from tracing (Python .venv > 25MB)
  outputFileTracingExcludes: {
    '*': ['./agi-sops/**/*'],
  },
  // Static export output directory
  distDir: 'out',
};

export default nextConfig;
