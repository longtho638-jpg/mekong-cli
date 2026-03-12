// Cloudflare Worker — Edge API Template
// Handles: webhooks, rate limiting, routing

export interface Env {
  // KV: KVNamespace;
  // DB: D1Database;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Routes
    if (url.pathname === '/health') {
      return Response.json({ status: 'ok', env: env.ENVIRONMENT });
    }

    if (url.pathname === '/api/mission' && request.method === 'POST') {
      const body = await request.json() as { goal: string };
      return Response.json({
        id: crypto.randomUUID(),
        goal: body.goal,
        status: 'queued'
      }, { headers: corsHeaders });
    }

    return new Response('Not Found', { status: 404 });
  },
};
