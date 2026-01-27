export function generateRobotsTxt(sitemapUrl: string): string {
  return `User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Allow: /

Sitemap: ${sitemapUrl}`;
}
