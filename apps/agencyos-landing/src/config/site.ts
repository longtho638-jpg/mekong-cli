/**
 * Central site configuration.
 * Single source of truth for brand, social links, and sitemap routes.
 */

export const siteConfig = {
  name: 'AgencyOS',
  url: process.env.NEXT_PUBLIC_BASE_URL || 'https://agencyos.dev',
  ogImage: '/og-image.png',
  ogImageDimensions: { width: 1200, height: 630 },

  social: {
    twitter: 'https://twitter.com/agencyos',
    github: 'https://github.com/agencyos',
    githubRepo: 'https://github.com/agencyos/mekong-cli',
  },

  /** Routes exposed in sitemap.xml (relative, without locale prefix). */
  sitemapRoutes: ['', '/pricing', '/docs', '/blog'] as const,

  /** JSON-LD structured data defaults */
  structuredData: {
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    defaultPrice: '99',
    priceCurrency: 'USD',
    ratingValue: '4.8',
    ratingCount: '127',
  },
} as const;

export type SiteConfig = typeof siteConfig;
