interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(urls: SitemapURL[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

// Example usage
export async function generateDynamicSitemap() {
  const urls: SitemapURL[] = [
    { loc: 'https://agencyos.ai/', changefreq: 'daily', priority: 1.0 },
    { loc: 'https://agencyos.ai/pricing', changefreq: 'weekly', priority: 0.8 },
    { loc: 'https://agencyos.ai/docs', changefreq: 'weekly', priority: 0.7 }
  ];

  // In a real application, you would fetch these from a database
  // const blogPosts = await fetchBlogPosts();
  // blogPosts.forEach(post => {
  //   urls.push({
  //     loc: \`https://agencyos.ai/blog/\${post.slug}\`,
  //     lastmod: post.updatedAt.toISOString(),
  //     changefreq: 'monthly',
  //     priority: 0.6
  //   });
  // });

  return generateSitemap(urls);
}
