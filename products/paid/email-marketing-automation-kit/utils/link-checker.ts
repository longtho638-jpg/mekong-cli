export interface LinkCheckResult {
  url: string;
  status: 'ok' | 'broken' | 'redirect' | 'error';
  statusCode?: number;
}

/**
 * Extracts and verifies all links in the email HTML.
 */
export async function checkLinks(html: string): Promise<LinkCheckResult[]> {
  const linkRegex = /href=["'](https?:\/\/[^"']+)["']/g;
  const matches = [...html.matchAll(linkRegex)];
  const urls = matches.map(m => m[1]);

  const uniqueUrls = [...new Set(urls)];
  const results: LinkCheckResult[] = [];

  // In a real implementation, we would fetch these URLs.
  // For this kit, we will simulate the check or perform a HEAD request if possible.
  // Since this runs in Next.js API route, we can make HTTP requests.

  for (const url of uniqueUrls) {
    try {
      if (url.includes('localhost') || url.includes('example.com') || url.includes('yourdomain.com')) {
        results.push({ url, status: 'ok', statusCode: 200 }); // Skip mock domains
        continue;
      }

      const response = await fetch(url, { method: 'HEAD' });

      results.push({
        url,
        status: response.ok ? 'ok' : 'broken',
        statusCode: response.status
      });
    } catch (error) {
      results.push({
        url,
        status: 'error',
      });
    }
  }

  return results;
}
