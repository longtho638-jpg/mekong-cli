import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    const body = await request.json();
    const { event, experimentId, variantId, url, cta } = body;

    if (!event || !experimentId || !variantId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // In a real implementation, this would write to a database (Supabase/ClickHouse)
    // For now, we'll just log it to stdout which would be captured by Vercel logs
    const logEntry = {
      timestamp: new Date().toISOString(),
      event, // 'exposure' or 'conversion'
      experimentId,
      variantId,
      url,
      cta, // Optional, for conversion events
      ip: clientAddress, // Anonymized in production logs typically
      userAgent: request.headers.get('user-agent'),
    };

    console.info(`[AB_TEST] ${JSON.stringify(logEntry)}`);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('[AB_TEST] Error logging event:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
};
