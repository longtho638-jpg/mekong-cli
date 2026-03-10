/**
 * License Activation Handler for RaaS Gateway
 *
 * Handles license activation requests from AgencyOS dashboard.
 * Validates license keys against Stripe/Polar webhook-synced data in KV.
 *
 * @see https://docs.polar.sh/api-reference
 * @see https://stripe.com/docs/api
 */

/**
 * Activate license request body
 * @typedef {Object} ActivateLicenseRequest
 * @property {string} licenseKey - License key to activate
 * @property {string} domain - Optional domain to associate
 * @property {string} mkApiKey - mk_ API key for authentication
 */

/**
 * Activate license response
 * @typedef {Object} ActivateLicenseResponse
 * @property {boolean} success
 * @property {string} [licenseKey]
 * @property {string} [tier]
 * @property {string} [status]
 * @property {string} [domain]
 * @property {string} [error]
 * @property {string} [reason]
 */

/**
 * Get Stripe customer ID from KV by license key
 * @param {any} env - Worker environment
 * @param {string} licenseKey
 * @returns {Promise<{stripeCustomerId?: string, polarCustomerId?: string, subscriptionId?: string} | null>}
 */
async function getStripeDataByLicenseKey(env, licenseKey) {
  try {
    if (!env.RAAS_KV) {
      return null;
    }

    const key = `stripe:license:${licenseKey}`;
    const data = await env.RAAS_KV.get(key, 'json');
    return data;
  } catch (error) {
    console.error('[LicenseActivation] Failed to get Stripe data:', error);
    return null;
  }
}

/**
 * Check if license is already activated
 * @param {any} env
 * @param {string} licenseKey
 * @returns {Promise<boolean>}
 */
async function isLicenseActivated(env, licenseKey) {
  try {
    if (!env.RAAS_KV) {
      return false;
    }

    const key = `license:status:${licenseKey}`;
    const status = await env.RAAS_KV.get(key);
    return status === 'active';
  } catch (error) {
    console.error('[LicenseActivation] Failed to check status:', error);
    return false;
  }
}

/**
 * Mark license as activated in KV
 * @param {any} env
 * @param {string} licenseKey
 * @param {string} tier
 * @param {string} [domain]
 * @returns {Promise<boolean>}
 */
async function markLicenseActivated(env, licenseKey, tier, domain) {
  try {
    if (!env.RAAS_KV) {
      // No KV configured, return success for local dev
      console.warn('[LicenseActivation] KV not configured, simulating success');
      return true;
    }

    const statusKey = `license:status:${licenseKey}`;
    const dataKey = `license:data:${licenseKey}`;

    await env.RAAS_KV.put(statusKey, 'active');
    await env.RAAS_KV.put(dataKey, JSON.stringify({
      status: 'active',
      tier,
      domain,
      activatedAt: new Date().toISOString()
    }));

    return true;
  } catch (error) {
    console.error('[LicenseActivation] Failed to mark activated:', error);
    return false;
  }
}

/**
 * Parse mk_ API key and validate format
 * @param {string} apiKey
 * @returns {{valid: boolean, tenantId?: string, tier?: string, error?: string}}
 */
function parseMKApiKey(apiKey) {
  if (!apiKey || !apiKey.startsWith('mk_')) {
    return { valid: false, error: 'Invalid API key format. Expected mk_<key>:<tenantId>:<tier>' };
  }

  const withoutPrefix = apiKey.slice(3);
  const parts = withoutPrefix.split(':');

  if (parts.length !== 3) {
    return { valid: false, error: 'API key must have 3 parts separated by colons' };
  }

  const [key, tenantId, tier] = parts;

  if (!key || !tenantId || !tier) {
    return { valid: false, error: 'API key parts cannot be empty' };
  }

  return { valid: true, tenantId, tier };
}

/**
 * Handle license activation request
 * @param {Request} request
 * @param {any} env
 * @returns {Promise<Response>}
 */
export async function handleLicenseActivation(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || 'https://agencyos.network',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { licenseKey, domain, mkApiKey } = body;

    // Validate required fields
    if (!licenseKey) {
      return new Response(JSON.stringify({
        error: 'license_key_required',
        message: 'License key is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!mkApiKey) {
      return new Response(JSON.stringify({
        error: 'api_key_required',
        message: 'mk_ API key is required for authentication'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate API key format
    const apiKeyResult = parseMKApiKey(mkApiKey);
    if (!apiKeyResult.valid) {
      return new Response(JSON.stringify({
        error: 'invalid_api_key',
        message: apiKeyResult.error
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if already activated
    const alreadyActive = await isLicenseActivated(env, licenseKey);
    if (alreadyActive) {
      return new Response(JSON.stringify({
        success: true,
        licenseKey,
        status: 'already_active',
        message: 'License is already activated'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get Stripe/Polar data from KV
    const stripeData = await getStripeDataByLicenseKey(env, licenseKey);

    // If no Stripe data found, license key is invalid
    if (!stripeData || (!stripeData.stripeCustomerId && !stripeData.polarCustomerId)) {
      return new Response(JSON.stringify({
        error: 'invalid_license',
        message: 'License key not found in Stripe/Polar system'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine tier from Stripe data
    const tier = stripeData.tier || 'FREE';

    // Mark license as activated in KV
    const activated = await markLicenseActivated(env, licenseKey, tier, domain);

    if (!activated) {
      return new Response(JSON.stringify({
        error: 'activation_failed',
        message: 'Failed to activate license in KV'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Success response
    return new Response(JSON.stringify({
      success: true,
      licenseKey,
      tier,
      status: 'active',
      domain: domain || null,
      stripeCustomerId: stripeData.stripeCustomerId,
      polarCustomerId: stripeData.polarCustomerId,
      subscriptionId: stripeData.subscriptionId,
      activatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[LicenseActivation] Error:', error);
    return new Response(JSON.stringify({
      error: 'internal_error',
      message: error.message || 'Failed to activate license'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
