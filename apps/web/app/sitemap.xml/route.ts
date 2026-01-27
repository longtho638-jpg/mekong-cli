import { generateDynamicSitemap } from '@/lib/seo/sitemap-generator';

export async function GET() {
  const sitemap = await generateDynamicSitemap();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}
