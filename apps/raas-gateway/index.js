/**
 * RaaS Gateway — Cloudflare Worker edge router
 * Routes: /health, /v1/status, /telegram, /v1/* (proxied to FastAPI backend)
 * Auth: JWT (Supabase) + mk_ API keys | Rate limiting: KV-based per tenant
 */

import { authenticate } from './src/edge-auth-handler.js';
import { checkRateLimit, buildRateLimitHeaders } from './src/kv-rate-limiter-per-api-key.js';

const GATEWAY_VERSION = '2.0.0';

/** Allowed CORS origins */
const CORS_ORIGINS = [
  'https://agencyos.network',
  'https://sophia.agencyos.network',
  'https://raas.agencyos.network',
  'http://localhost:3000',
  'http://localhost:5173'
];

/**
 * Build CORS headers for a given request origin
 * @param {string|null} origin
 * @returns {object}
 */
function buildCORSHeaders(origin) {
  const allowed = origin && CORS_ORIGINS.includes(origin) ? origin : CORS_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id',
    'Access-Control-Max-Age': '86400'
  };
}

/**
 * JSON response helper
 * @param {object} body
 * @param {number} status
 * @param {object} [extraHeaders]
 * @returns {Response}
 */
function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

/**
 * Proxy request to FastAPI backend, forwarding tenant context headers
 * @param {Request} request
 * @param {string} backendUrl
 * @param {string} tenantId
 * @param {string} role
 * @returns {Promise<Response>}
 */
async function proxyToBackend(request, backendUrl, tenantId, role) {
  const url = new URL(request.url);
  const targetUrl = `${backendUrl}${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('X-Tenant-Id', tenantId || 'anonymous');
  headers.set('X-Tenant-Role', role);
  headers.set('X-RaaS-Source', 'raas-gateway');
  // Strip original Authorization — backend uses service-level trust
  headers.delete('Authorization');

  const init = {
    method: request.method,
    headers,
    redirect: 'follow'
  };

  // Forward body for non-GET/HEAD requests
  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
    init.duplex = 'half';
  }

  return fetch(targetUrl, init);
}

/**
 * Handle Telegram webhook (existing bridge logic, preserved)
 * @param {Request} request
 * @param {object} env
 * @returns {Promise<Response>}
 */
async function handleTelegramWebhook(request, env) {
  const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
  if (!env.TELEGRAM_SECRET_TOKEN || secretToken !== env.TELEGRAM_SECRET_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const update = await request.json();
    const message = update.message || update.edited_message;

    if (message && message.text) {
      const baseUrl = (env.BRIDGE_URL || env.OPENCLAW_URL || 'https://raas.agencyos.network')
        .replace(/\/$/, '');
      const bridgeResponse = await fetch(`${baseUrl}/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: message.text })
      });

      if (!bridgeResponse.ok) {
        return jsonResponse({ error: 'Bridge forwarding failed', status: bridgeResponse.status }, 502);
      }
    }
    return new Response('OK', { status: 200 });
  } catch (err) {
    return jsonResponse({ error: 'Error processing Telegram update', details: err.message }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get('Origin');
    const corsHeaders = buildCORSHeaders(origin);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // --- ROUTE: GET /health (no auth required) ---
    if (path === '/health' && request.method === 'GET') {
      return jsonResponse({ status: 'ok', version: GATEWAY_VERSION }, 200, corsHeaders);
    }

    // --- ROUTE: POST /telegram (Telegram secret token auth) ---
    if (path === '/telegram' && request.method === 'POST') {
      return handleTelegramWebhook(request, env);
    }

    // --- AUTH: All /v1/* routes require Bearer token ---
    const { authenticated, tenantId, role, error: authError } = authenticate(request, env);

    if (!authenticated) {
      return jsonResponse(
        { error: 'Unauthorized', details: authError },
        401,
        corsHeaders
      );
    }

    // --- RATE LIMIT: per tenant ---
    const rlResult = await checkRateLimit(env, tenantId, role);
    const rlHeaders = buildRateLimitHeaders(rlResult);

    if (!rlResult.allowed) {
      return jsonResponse(
        { error: 'Rate limit exceeded', limit: rlResult.limit, resetIn: rlResult.resetIn },
        429,
        { ...corsHeaders, ...rlHeaders }
      );
    }

    // --- ROUTE: GET /v1/status (gateway metrics) ---
    if (path === '/v1/status' && request.method === 'GET') {
      return jsonResponse(
        {
          status: 'ok',
          version: GATEWAY_VERSION,
          tenant: tenantId,
          role,
          rateLimit: { remaining: rlResult.remaining, limit: rlResult.limit }
        },
        200,
        { ...corsHeaders, ...rlHeaders }
      );
    }

    // --- ROUTE: /v1/* → proxy to FastAPI backend ---
    if (path.startsWith('/v1/')) {
      const backendUrl = (env.BACKEND_URL || env.BRIDGE_URL || env.OPENCLAW_URL || '')
        .replace(/\/$/, '');

      if (!backendUrl) {
        return jsonResponse({ error: 'Backend not configured' }, 503, corsHeaders);
      }

      try {
        const backendResponse = await proxyToBackend(request, backendUrl, tenantId, role);
        const body = await backendResponse.arrayBuffer();
        const responseHeaders = new Headers({
          'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
          ...corsHeaders,
          ...rlHeaders
        });
        return new Response(body, { status: backendResponse.status, headers: responseHeaders });
      } catch (err) {
        return jsonResponse({ error: 'Backend unreachable', details: err.message }, 502, corsHeaders);
      }
    }

    // --- FALLBACK ---
    return jsonResponse({ error: 'Not Found' }, 404, corsHeaders);
  }
};
