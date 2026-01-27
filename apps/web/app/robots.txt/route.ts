import { generateRobotsTxt } from '@/lib/seo/robots-generator';

export async function GET() {
  const robots = generateRobotsTxt('https://agencyos.ai/sitemap.xml');

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain'
    }
  });
}
