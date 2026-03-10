/**
 * Edge Auth Handler — JWT validation at Cloudflare edge
 * Supports Supabase JWT and mk_ API keys
 * Flow: Extract token → Validate → Return tenant context
 */

/**
 * Base64url decode helper (Workers have no Buffer)
 * @param {string} str
 * @returns {string}
 */
function base64urlDecode(str) {
  // Convert base64url to base64
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return atob(padded);
}

/**
 * Decode JWT payload without signature verification (edge-side)
 * Full crypto verification would require SubtleCrypto + public key
 * @param {string} token
 * @returns {{ payload: object|null, error: string|null }}
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { payload: null, error: 'Invalid JWT format' };
    }
    const payload = JSON.parse(base64urlDecode(parts[1]));
    return { payload, error: null };
  } catch {
    return { payload: null, error: 'JWT decode failed' };
  }
}

/**
 * Validate JWT expiry and extract tenant info
 * @param {object} payload
 * @returns {{ valid: boolean, tenantId: string|null, role: string, error: string|null }}
 */
function validateJWTPayload(payload) {
  const now = Math.floor(Date.now() / 1000);

  if (!payload.exp || payload.exp < now) {
    return { valid: false, tenantId: null, role: 'anon', error: 'Token expired' };
  }

  // Supabase JWT: sub = user UUID, app_metadata.tenant_id or raw_user_meta_data
  const tenantId =
    payload.tenant_id ||
    (payload.app_metadata && payload.app_metadata.tenant_id) ||
    payload.sub ||
    null;

  const role = payload.role || (payload.app_metadata && payload.app_metadata.role) || 'free';

  return { valid: true, tenantId, role, error: null };
}

/**
 * Validate mk_ prefixed API key against env config
 * API keys stored as "mk_<key>:<tenantId>:<tier>" in MK_API_KEYS env var (comma-separated)
 * @param {string} apiKey
 * @param {object} env - Cloudflare Worker env bindings
 * @returns {{ valid: boolean, tenantId: string|null, role: string, error: string|null }}
 */
function validateApiKey(apiKey, env) {
  if (!apiKey.startsWith('mk_')) {
    return { valid: false, tenantId: null, role: 'anon', error: 'Invalid API key format' };
  }

  // Allow SERVICE_TOKEN passthrough for internal services
  if (env.SERVICE_TOKEN && apiKey === env.SERVICE_TOKEN) {
    return { valid: true, tenantId: 'internal', role: 'service', error: null };
  }

  // Parse MK_API_KEYS: "mk_abc123:tenant1:pro,mk_xyz789:tenant2:free"
  const keysConfig = env.MK_API_KEYS || '';
  if (!keysConfig) {
    return { valid: false, tenantId: null, role: 'anon', error: 'No API keys configured' };
  }

  for (const entry of keysConfig.split(',')) {
    const [key, tenantId, tier] = entry.trim().split(':');
    if (key === apiKey) {
      return { valid: true, tenantId: tenantId || 'unknown', role: tier || 'free', error: null };
    }
  }

  return { valid: false, tenantId: null, role: 'anon', error: 'Invalid API key' };
}

/**
 * Main auth handler — extracts and validates credentials from request
 * @param {Request} request
 * @param {object} env
 * @returns {{ authenticated: boolean, tenantId: string|null, role: string, licenseKey: string|null, error: string|null }}
 */
export function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization') || '';

  if (!authHeader.startsWith('Bearer ')) {
    return { authenticated: false, tenantId: null, role: 'anon', licenseKey: null, error: 'Missing Bearer token' };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { authenticated: false, tenantId: null, role: 'anon', licenseKey: null, error: 'Empty token' };
  }

  // mk_ API key takes priority over JWT
  if (token.startsWith('mk_')) {
    const result = validateApiKey(token, env);
    return {
      authenticated: result.valid,
      tenantId: result.tenantId,
      role: result.role,
      licenseKey: result.valid ? token : null,
      error: result.error
    };
  }

  // Try JWT decode
  const { payload, error: decodeError } = decodeJWT(token);
  if (decodeError || !payload) {
    return { authenticated: false, tenantId: null, role: 'anon', licenseKey: null, error: decodeError || 'JWT decode failed' };
  }

  const { valid, tenantId, role, error: validError } = validateJWTPayload(payload);
  return {
    authenticated: valid,
    tenantId,
    role,
    licenseKey: null, // JWT tokens don't have mk_ license keys
    error: validError
  };
}
