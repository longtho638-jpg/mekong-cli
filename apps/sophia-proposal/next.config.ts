import type { NextConfig } from "next";
import { getSecurityHeaders } from "./lib/security-headers";
import withBundleAnalyzer from '@next/bundle-analyzer';

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
  // Security headers for static export
  // Note: Headers are applied at edge/CDN level (Cloudflare Pages)
  // This config documents the expected headers for deployment
  headers: async () => [
    {
      source: '/(.*)',
      headers: getSecurityHeaders(),
    },
  ],
};

// Bundle analyzer wrapper
export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})(nextConfig);
