import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withBundleAnalyzer from '@next/bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// Simple build-time environment validation
if (process.env.NODE_ENV === 'production') {
  const requiredEnvs = [
    'NEXT_PUBLIC_BASE_URL',
    'NEXT_PUBLIC_POLAR_PRICE_STARTER',
    'NEXT_PUBLIC_POLAR_PRICE_PRO'
  ];

  const missingEnvs = requiredEnvs.filter(env => !process.env[env]);
  if (missingEnvs.length > 0) {
    console.warn(`⚠️  Missing required environment variables for production build: ${missingEnvs.join(', ')}`);
    // We don't throw here to allow build to proceed if vars are provided at runtime (e.g. Docker/Vercel)
    // but we warn loud enough.
  }
}

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// CSP directives - strict defaults, allows self-hosted fonts and Polar.sh checkout
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://api.polar.sh https://polar.sh https://*.vercel-insights.com https://*.vercel-analytics.com",
  "form-action 'self' https://polar.sh",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          },
          {
            key: 'Content-Security-Policy',
            value: cspDirectives
          }
        ]
      }
    ];
  },
};

export default bundleAnalyzer(withNextIntl(nextConfig));
