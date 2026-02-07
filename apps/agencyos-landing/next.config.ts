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

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
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
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      }
    ];
  },
};

export default bundleAnalyzer(withNextIntl(nextConfig));
