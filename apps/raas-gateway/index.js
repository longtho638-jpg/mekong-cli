/**
 * RaaS Gateway — Cloudflare Worker edge router
 * Routes: /health, /v1/status, /telegram, /v1/* (proxied to FastAPI backend)
 * Auth: JWT (Supabase) + mk_ API keys | Rate limiting: KV-based per tenant
 */

import { authenticate } from './src/edge-auth-handler.js';
import { checkRateLimit, buildRateLimitHeaders } from './src/kv-rate-limiter-per-api-key.js';
import { trackUsage, getUsageMetrics, getPayloadSize, getEndpointType, aggregateUsageForBilling, getCurrentHourBucket } from './src/kv-usage-meter.js';
import { checkSuspensionStatus, syncSuspensionToKV, buildSuspensionStatusHeader } from './src/kv-suspension-checker.js';
import { validateExtensionFlags, getExtensionStatus, trackExtensionUsage } from './src/extension-validator.js';
import { checkQuota, incrementUsage } from './src/kv-quota-enforcer.js';
import { checkAndTriggerAlerts, buildQuotaHeaders } from './src/quota-alert-webhook.js';
import { handleLicenseActivation } from './src/license-activation-handler.js';
import { getCliVersionInfo } from './src/cli-version-handler.js';

const GATEWAY_VERSION = '2.0.0';

/**
 * Get features list for role/tier
 * @param {string} role
 * @returns {string[]}
 */
function getFeaturesForRole(role) {
  const features = {
    free: ['basic_cli_commands', 'open_source_agents', 'community_patterns'],
    trial: ['basic_cli_commands', 'open_source_agents', 'community_patterns', 'trial_agents'],
    pro: [
      'basic_cli_commands',
      'open_source_agents',
      'community_patterns',
      'premium_agents',
      'advanced_patterns',
      'priority_support',
      'custom_workflows',
      'ml_models',
      'premium_data'
    ],
    enterprise: [
      'basic_cli_commands',
      'open_source_agents',
      'community_patterns',
      'premium_agents',
      'advanced_patterns',
      'priority_support',
      'custom_workflows',
      'ml_models',
      'premium_data',
      'agi_auto_pilot',
      'team_collaboration',
      'audit_logs',
      'sso_integration',
      'dedicated_support',
      'custom_integrations'
    ],
    service: ['all']
  };
  return features[role] || features.free;
}

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

    // --- ROUTE: POST /v2/license/activate (license activation) ---
    if (path === '/v2/license/activate' && request.method === 'POST') {
      return handleLicenseActivation(request, env);
    }

    // --- ROUTE: POST /telegram (Telegram secret token auth) ---
    if (path === '/telegram' && request.method === 'POST') {
      return handleTelegramWebhook(request, env);
    }

    // --- ROUTE: POST /internal/sync-suspension (internal service endpoint) ---
    if (path === '/internal/sync-suspension' && request.method === 'POST') {
      // Verify service token
      const authHeader = request.headers.get('Authorization') || '';
      const serviceToken = env.SERVICE_TOKEN || env.RAAS_SERVICE_TOKEN;

      if (!authHeader.startsWith('Bearer ') || authHeader.slice(7) !== serviceToken) {
        return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
      }

      try {
        const body = await request.json();
        const { tenantId, status, since, reason } = body;

        if (!tenantId || !status) {
          return jsonResponse({ error: 'Missing tenantId or status' }, 400, corsHeaders);
        }

        // Use existing syncSuspensionToKV function from kv-suspension-checker.js
        const success = await syncSuspensionToKV(env, tenantId, status, reason);

        if (!success) {
          return jsonResponse({ error: 'Failed to sync to KV' }, 500, corsHeaders);
        }

        return jsonResponse({
          success: true,
          tenantId,
          status,
          since: since || new Date().toISOString()
        }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({
          error: 'Invalid request',
          details: error.message
        }, 400, corsHeaders);
      }
    }

    // --- AUTH: All /v1/* routes require Bearer token ---
    const { authenticated, tenantId, role, licenseKey, error: authError } = authenticate(request, env);

    if (!authenticated) {
      return jsonResponse(
        { error: 'Unauthorized', details: authError },
        401,
        corsHeaders
      );
    }

    // --- SUSPENSION CHECK: Block suspended/revoked tenants ---
    const suspensionResult = await checkSuspensionStatus(env, tenantId);

    if (suspensionResult.blocked) {
      return jsonResponse(
        { error: 'account_suspended', reason: suspensionResult.reason, since: suspensionResult.since },
        403,
        corsHeaders
      );
    }

    // --- QUOTA CHECK: Block over-quota tenants (after auth & suspension, before rate limit) ---
    const quotaResult = licenseKey ? await checkQuota(env, licenseKey, role) : null;
    const quotaHeaders = buildQuotaHeaders(quotaResult);

    if (quotaResult && !quotaResult.allowed) {
      // Trigger quota exceeded alert (rate-limited) with billing metadata
      const billingMetadata = {
        stripeCustomerId: quotaResult.status?.limit?.stripeCustomerId,
        polarProductId: quotaResult.status?.limit?.polarProductId,
        subscriptionId: quotaResult.status?.limit?.subscriptionId,
        planName: quotaResult.status?.limit?.planName || role,
        currency: quotaResult.status?.limit?.currency || 'USD'
      };
      await checkAndTriggerAlerts(env, quotaResult, billingMetadata);

      return jsonResponse(
        { error: 'quota_exceeded', reason: quotaResult.blockReason, resetIn: quotaResult.resetIn },
        429,
        { ...corsHeaders, ...quotaHeaders }
      );
    }

    // --- EXTENSION CHECK: Validate extension eligibility for /v1/trade/* and /v1/extension/* ---
    const isExtensionEndpoint = path.startsWith('/v1/trade') || path.startsWith('/v1/extension');
    let extensionResult = null;

    if (isExtensionEndpoint && role !== 'service') {
      extensionResult = validateExtensionFlags(request, env, tenantId, role, 'algo-trader');
      if (!extensionResult.allowed && extensionResult.required) {
        return jsonResponse(
          { error: 'extension_not_permitted', extension: extensionResult.required, reason: extensionResult.reason },
          403,
          corsHeaders
        );
      }
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

    // --- ROUTE: POST /v1/auth/validate (validate credentials) ---
    if (path === '/v1/auth/validate' && request.method === 'POST') {
      // Auth already validated above — return tenant context + rate limit + quota info
      const features = getFeaturesForRole(role);
      return jsonResponse(
        {
          valid: true,
          tenant_id: tenantId,
          role,
          tier: role,
          features,
          suspension: {
            blocked: suspensionResult.blocked,
            status: suspensionResult.status,
            since: suspensionResult.since,
            reason: suspensionResult.reason
          },
          rateLimit: {
            remaining: rlResult.remaining,
            limit: rlResult.limit,
            resetIn: rlResult.resetIn
          },
          quota: quotaResult ? {
            remaining: quotaResult.remaining,
            monthlyUsagePercent: quotaResult.status?.monthlyUsagePercent,
            isNearQuota: quotaResult.status?.isNearQuota,
            isOverQuota: quotaResult.status?.isOverQuota,
            resetIn: quotaResult.resetIn
          } : null,
          gateway: {
            version: GATEWAY_VERSION,
            url: env.GATEWAY_URL || 'https://raas.agencyos.network'
          }
        },
        200,
        { ...corsHeaders, ...rlHeaders, ...buildSuspensionStatusHeader(suspensionResult), ...quotaHeaders }
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

    // --- ROUTE: GET /v1/cli/version (CLI version check) ---
    if (path === '/v1/cli/version' && request.method === 'GET') {
      return getCliVersionInfo(env, tenantId, role);
    }

    // --- ROUTE: GET /v1/usage (retrieve usage metrics) ---
    if (path === '/v1/usage' && request.method === 'GET') {
      // Only allow service accounts or authenticated users to get usage
      if (role !== 'service' && !licenseKey) {
        return jsonResponse({ error: 'Unauthorized to access usage data' }, 403, corsHeaders);
      }

      const targetLicenseKey = licenseKey; // For now, only allow getting your own usage

      // Parse query parameters
      const url = new URL(request.url);
      const startHour = url.searchParams.get('start_hour');
      const endHour = url.searchParams.get('end_hour');
      const limit = parseInt(url.searchParams.get('limit')) || 100;
      const offset = parseInt(url.searchParams.get('offset')) || 0;

      return getUsageMetrics(env, targetLicenseKey, startHour, endHour, limit, offset).then(result => {
        // Transform to billing-compatible format
        const billingMetrics = result.metrics.map(metric => ({
          license_key: metric.licenseKey,
          tenant_id: metric.tenantId,
          tier: metric.tier,
          endpoint: metric.endpoint,
          method: metric.method,
          request_count: metric.requestCount,
          payload_size: metric.payloadSize,
          timestamp: metric.timestamp,
          hour_bucket: metric.hourBucket,
          // Billing-specific fields for Phase 3
          metric_name: 'api_calls',
          quantity: metric.requestCount,
          unit: 'calls'
        }));

        return jsonResponse({
          license_key: targetLicenseKey,
          tenant_id: tenantId,
          metrics: billingMetrics,
          pagination: {
            limit,
            offset,
            total: result.total,
            has_more: result.hasMore
          },
          summary: {
            total_requests: result.metrics.reduce((sum, m) => sum + m.requestCount, 0),
            total_payload_size: result.metrics.reduce((sum, m) => sum + m.payloadSize, 0),
            total_hours: result.metrics.length
          }
        }, 200, { ...corsHeaders, ...rlHeaders });
      }).catch(err => {
        return jsonResponse({ error: 'Failed to retrieve usage metrics', details: err.message }, 500, corsHeaders);
      });
    }

    // --- ROUTE: GET /v1/overage/calculate (overage billing calculation) ---
    if (path === '/v1/overage/calculate' && request.method === 'GET') {
      // Only allow service accounts or mk_ API key holders to calculate overage
      if (role !== 'service' && !licenseKey) {
        return jsonResponse({ error: 'Unauthorized to access overage calculation' }, 403, corsHeaders);
      }

      const url = new URL(request.url);
      const startHour = url.searchParams.get('start_hour');
      const endHour = url.searchParams.get('end_hour');

      // Default to last 24 hours if not specified
      const effectiveEndHour = endHour || getCurrentHourBucket();
      const effectiveStartHour = startHour || effectiveEndHour; // Default to same hour if not specified

      return aggregateUsageForBilling(env, licenseKey, effectiveStartHour, effectiveEndHour).then(aggregated => {
        // Forward to algo-trader backend for overage calculation
        const backendUrl = (env.BACKEND_URL || env.BRIDGE_URL || env.OPENCLAW_URL || '')
          .replace(/$/, '');

        if (backendUrl) {
          // Forward usage data to backend for pricing calculation
          return fetch(`${backendUrl}/v1/billing/calculate-overage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': tenantId,
              'X-Tenant-Role': role,
              'X-RaaS-Source': 'raas-gateway'
            },
            body: JSON.stringify({
              license_key: licenseKey,
              tenant_id: tenantId,
              usage: aggregated,
              period: {
                start_hour: effectiveStartHour,
                end_hour: effectiveEndHour
              }
            })
          }).then(async backendResponse => {
            const backendData = await backendResponse.arrayBuffer();
            const responseHeaders = new Headers({
              'Content-Type': 'application/json',
              ...corsHeaders,
              ...rlHeaders,
              'X-Overage-Total-Requests': String(aggregated.totalRequests),
              'X-Overage-Payload-Size': String(aggregated.totalPayloadSize),
              'X-Overage-Hours-Active': String(aggregated.hoursActive)
            });
            return new Response(backendData, {
              status: backendResponse.status,
              headers: responseHeaders
            });
          }).catch(_err => {
            // Backend unavailable, return aggregated usage only
            return jsonResponse({
              license_key: licenseKey,
              tenant_id: tenantId,
              period: {
                start_hour: effectiveStartHour,
                end_hour: effectiveEndHour
              },
              usage_summary: aggregated,
              overage_status: 'pending_backend_calculation',
              note: 'Backend unavailable for pricing - usage data only'
            }, 200, { ...corsHeaders, ...rlHeaders });
          });
        }

        // No backend configured, return usage summary only
        return jsonResponse({
          license_key: licenseKey,
          tenant_id: tenantId,
          period: {
            start_hour: effectiveStartHour,
            end_hour: effectiveEndHour
          },
          usage_summary: aggregated,
          overage_status: 'backend_not_configured'
        }, 200, { ...corsHeaders, ...rlHeaders });
      }).catch(err => {
        return jsonResponse({ error: 'Failed to calculate overage', details: err.message }, 500, corsHeaders);
      });
    }

    // --- ROUTE: GET /v1/extension/status (extension eligibility + usage) ---
    if (path === '/v1/extension/status' && request.method === 'GET') {
      const extensionStatus = await getExtensionStatus(env, tenantId, 'algo-trader');

      return jsonResponse(
        {
          tenant_id: tenantId,
          extensions: {
            'algo-trader': {
              permitted: extensionStatus.permitted,
              status: extensionStatus.status,
              usage: extensionStatus.usage,
              limit: extensionStatus.limit,
              resetAt: extensionStatus.resetAt
            }
          }
        },
        200,
        corsHeaders
      );
    }

    // --- ROUTE: /v1/* → proxy to FastAPI backend ---
    if (path.startsWith('/v1/')) {
      // Track usage if we have a valid license key (mk_ API key)
      if (licenseKey) {
        const payloadSize = await getPayloadSize(request);
        const endpointType = getEndpointType(path);

        // Track extension usage for trade endpoints
        if (path.startsWith('/v1/trade')) {
          const idempotencyKey = request.headers.get('X-Idempotency-Key');
          trackExtensionUsage(env, tenantId, 'algo-trader', 1, idempotencyKey).catch(err => {
            console.error('Extension usage tracking error:', err);
          });
        }

        // Track usage in RAAS_USAGE_KV (monthly aggregation)
        trackUsage(env, licenseKey, tenantId, role, endpointType, request.method, payloadSize).catch(err => {
          console.error('Usage tracking failed:', err);
        });

        // Increment quota counters (daily/hourly)
        incrementUsage(env, licenseKey, payloadSize).catch(err => {
          console.error('Quota increment error:', err);
        });

        // Check and trigger quota alerts (non-blocking) with billing metadata
        if (quotaResult) {
          const billingMetadata = {
            stripeCustomerId: quotaResult.status?.limit?.stripeCustomerId,
            polarProductId: quotaResult.status?.limit?.polarProductId,
            subscriptionId: quotaResult.status?.limit?.subscriptionId,
            planName: quotaResult.status?.limit?.planName || role,
            currency: quotaResult.status?.limit?.currency || 'USD'
          };
          checkAndTriggerAlerts(env, quotaResult, billingMetadata).catch(err => {
            console.error('Quota alert error:', err);
          });
        }
      }

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
          ...rlHeaders,
          ...quotaHeaders
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
