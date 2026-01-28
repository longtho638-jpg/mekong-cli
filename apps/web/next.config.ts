import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Image Optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: ['mekong-cli.com'], // Add your image domains here
  },

  // Headers
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png)',
        locale: false,
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          }
        ],
      },
    ];
  },

  // Compression (gzip/brotli enabled by default in Next.js, but explicitly stating intent)
  compress: true,

  // Build Optimization
  poweredByHeader: false,

  // Output standalone for Docker/Container deployments
  output: 'standalone',
};

export default nextConfig;
