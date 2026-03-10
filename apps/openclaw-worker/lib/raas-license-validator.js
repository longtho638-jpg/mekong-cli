/**
 * RaaS License Validator Middleware — Phase 1
 *
 * Validates X-RaaS-License-Key header against RaaS Gateway
 * Supports: mk_ API keys, raasjwt-* JWT tokens
 *
 * Usage:
 *   const { raasLicenseMiddleware, validateLicense } = require('./raas-license-validator');
 *
 *   // In mission dispatcher
 *   const result = await raasLicenseMiddleware(mission, env);
 *   if (!result.allowed) {
 *     return { rejected: true, reason: result.reason };
 *   }
 */

// Configuration
const RAAS_GATEWAY_URL = process.env.RAAS_GATEWAY_URL || 'https://raas.agencyos.network';
const VALIDATION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const VALIDATION_TIMEOUT_MS = 10000; // 10 seconds

// Cache: licenseKey → { tenantId, tier, role, features, validatedAt, expiresAt }
const _validationCache = new Map();

// Metrics
const _metrics = {
  totalValidations: 0,
  cacheHits: 0,
  cacheMisses: 0,
  gatewayErrors: 0,
  rejections: 0,
};

/**
 * Mask license key for logging
 * @param {string} key
 * @returns {string}
 */
function maskLicenseKey(key) {
  if (!key) return 'none';
  if (key.startsWith('mk_')) {
    return `mk_${key.slice(3, 7)}...${key.slice(-4)}`;
  }
  if (key.startsWith('raasjwt-')) {
    return 'raasjwt-***';
  }
  return '***';
}

/**
 * Simple logger (uses console for now, can be replaced with brain-logger)
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}][RAAS][${level}] ${message}`);
}

/**
 * Decode JWT payload without signature verification
 * @param {string} token
 * @returns {object|null}
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let payload = parts[1];
    // Add padding
    const padding = 4 - (payload.length % 4);
    if (padding !== 4) {
      payload += '='.repeat(padding);
    }

    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Validate license key format
 * @param {string} licenseKey
 * @returns {{ valid: boolean, error?: string, type?: 'mk_api_key' | 'jwt' }}
 */
function validateLicenseFormat(licenseKey) {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, error: 'License key is required' };
  }

  const trimmed = licenseKey.trim();

  // mk_ API key format
  if (trimmed.startsWith('mk_')) {
    if (trimmed.length < 8) {
      return { valid: false, error: 'Invalid API key format (too short)' };
    }
    return { valid: true, type: 'mk_api_key' };
  }

  // raasjwt-* JWT format
  if (trimmed.startsWith('raasjwt-')) {
    const jwtPart = trimmed.slice(8); // Remove 'raasjwt-' prefix
    const payload = decodeJwtPayload(jwtPart);

    if (!payload) {
      return { valid: false, error: 'Invalid JWT format' };
    }

    // Check expiry
    const exp = payload.exp;
    if (!exp || exp < Math.floor(Date.now() / 1000)) {
      return { valid: false, error: 'JWT token expired' };
    }

    return { valid: true, type: 'jwt' };
  }

  // raas-* legacy format (fallback to local validation)
  if (trimmed.startsWith('raas-')) {
    return { valid: true, type: 'legacy' };
  }

  return { valid: false, error: 'Unrecognized license key format' };
}

/**
 * Check cache for valid license
 * @param {string} licenseKey
 * @returns {{ hit: boolean, data?: object }}
 */
function checkCache(licenseKey) {
  const cached = _validationCache.get(licenseKey);
  if (!cached) {
    return { hit: false };
  }

  const now = Date.now();
  if (now > cached.expiresAt) {
    _validationCache.delete(licenseKey);
    return { hit: false };
  }

  return { hit: true, data: cached };
}

/**
 * Cache validation result
 * @param {string} licenseKey
 * @param {object} tenantContext
 */
function cacheValidationResult(licenseKey, tenantContext) {
  _validationCache.set(licenseKey, {
    ...tenantContext,
    expiresAt: Date.now() + VALIDATION_CACHE_TTL_MS,
  });
}

/**
 * Validate license key with RaaS Gateway
 * @param {string} licenseKey
 * @param {object} env - Worker environment (KV bindings, optional)
 * @returns {Promise<{
 *   valid: boolean,
 *   tenant?: {
 *     tenant_id: string,
 *     tier: string,
 *     role: string,
 *     features: string[],
 *     license_key?: string
 *   },
 *   error?: string,
 *   error_code?: string
 * }>}
 */
async function validateLicense(licenseKey, env = {}) {
  _metrics.totalValidations++;

  // Step 1: Format validation
  const formatCheck = validateLicenseFormat(licenseKey);
  if (!formatCheck.valid) {
    log(`Format validation failed: ${formatCheck.error}`, 'WARN');
    return {
      valid: false,
      error: formatCheck.error,
      error_code: 'invalid_format',
    };
  }

  // Step 2: Check cache
  const cacheResult = checkCache(licenseKey);
  if (cacheResult.hit) {
    _metrics.cacheHits++;
    log(`Cache HIT for ${maskLicenseKey(licenseKey)}`, 'DEBUG');
    return {
      valid: true,
      tenant: cacheResult.data,
      cached: true,
    };
  }

  _metrics.cacheMisses++;

  // Step 3: Call RaaS Gateway
  try {
    const validationUrl = `${RAAS_GATEWAY_URL}/v1/auth/validate`;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${licenseKey}`,
    };

    const response = await fetch(validationUrl, {
      method: 'POST',
      headers,
      timeout: VALIDATION_TIMEOUT_MS,
    });

    const data = await response.json();

    if (response.status === 200 && data.valid) {
      // Success - cache result
      const tenantContext = {
        tenant_id: data.tenant_id || 'unknown',
        tier: data.tier || 'free',
        role: data.role || 'free',
        features: data.features || [],
        license_key: licenseKey.startsWith('mk_') ? licenseKey : undefined,
        rate_limit: data.rateLimit,
        suspension: data.suspension,
      };

      cacheValidationResult(licenseKey, tenantContext);
      log(`Validation SUCCESS for ${maskLicenseKey(licenseKey)} (tier: ${tenantContext.tier})`, 'INFO');

      return {
        valid: true,
        tenant: tenantContext,
      };
    }

    // Gateway returned error
    _metrics.rejections++;

    if (response.status === 401) {
      log(`Validation FAILED for ${maskLicenseKey(licenseKey)}: Invalid credentials`, 'WARN');
      return {
        valid: false,
        error: data.error || 'Invalid credentials',
        error_code: 'invalid_credentials',
      };
    }

    if (response.status === 403) {
      const reason = data.reason || 'forbidden';
      log(`Validation BLOCKED for ${maskLicenseKey(licenseKey)}: ${reason}`, 'WARN');

      if (reason === 'revoked') {
        return {
          valid: false,
          error: 'License has been revoked',
          error_code: 'license_revoked',
        };
      }

      if (reason === 'expired') {
        return {
          valid: false,
          error: 'License has expired',
          error_code: 'license_expired',
        };
      }

      return {
        valid: false,
        error: data.error || 'Access denied',
        error_code: 'access_denied',
      };
    }

    if (response.status === 429) {
      log(`Validation RATE LIMITED for ${maskLicenseKey(licenseKey)}`, 'WARN');
      return {
        valid: false,
        error: 'Rate limit exceeded',
        error_code: 'rate_limit_exceeded',
        retry_after: response.headers.get('Retry-After'),
      };
    }

    // Other errors
    log(`Gateway error for ${maskLicenseKey(licenseKey)}: HTTP ${response.status}`, 'ERROR');
    _metrics.gatewayErrors++;

    // FAIL OPEN: On gateway errors, allow with warning (graceful degradation)
    // Exception: Don't fail open for known bad states (revoked/expired)
    if (data.reason === 'revoked' || data.reason === 'expired') {
      return {
        valid: false,
        error: data.error || `Gateway error: ${response.status}`,
        error_code: 'gateway_error',
      };
    }

    // For transient errors, fail open
    log('FAIL OPEN: Gateway error, allowing request', 'WARN');
    return {
      valid: true,
      tenant: {
        tenant_id: 'offline',
        tier: 'free',
        role: 'free',
        features: [],
        offline_mode: true,
      },
      warning: 'Gateway unavailable, using offline mode',
    };

  } catch (error) {
    // Network error - FAIL OPEN
    _metrics.gatewayErrors++;
    log(`Gateway unreachable: ${error.message}`, 'ERROR');
    log('FAIL OPEN: Network error, allowing request', 'WARN');

    return {
      valid: true,
      tenant: {
        tenant_id: 'offline',
        tier: 'free',
        role: 'free',
        features: [],
        offline_mode: true,
      },
      warning: `Gateway unreachable, using offline mode: ${error.message}`,
    };
  }
}

/**
 * RaaS License Middleware for mission dispatch
 *
 * @param {object} mission - Mission object with metadata.headers
 * @param {object} env - Worker environment
 * @returns {Promise<{
 *   allowed: boolean,
 *   reason?: string,
 *   tenant?: object,
 *   warning?: string
 * }>}
 */
async function raasLicenseMiddleware(mission, env = {}) {
  // Extract license key from mission metadata
  const headers = mission?.metadata?.headers || {};
  const licenseKey = headers['x-raas-license-key'] ||
                     headers['X-RaaS-License-Key'] ||
                     mission?.licenseKey ||
                     process.env.RAAS_LICENSE_KEY;

  // If no license key and RAAS is not enforced, allow
  if (!licenseKey) {
    if (process.env.RAAS_ENFORCE === 'true') {
      log('Mission rejected: No license key provided (RAAS_ENFORCE=true)', 'WARN');
      return {
        allowed: false,
        reason: 'No license key provided. Set X-RaaS-License-Key header or RAAS_LICENSE_KEY env var.',
        error_code: 'missing_license',
      };
    }

    log('Mission allowed: No license key (RAAS not enforced)', 'DEBUG');
    return {
      allowed: true,
      tenant: {
        tenant_id: 'anonymous',
        tier: 'free',
        role: 'free',
        features: [],
      },
    };
  }

  // Validate license
  const result = await validateLicense(licenseKey, env);

  if (!result.valid) {
    _metrics.rejections++;
    return {
      allowed: false,
      reason: result.error || 'License validation failed',
      error_code: result.error_code,
    };
  }

  // Success
  return {
    allowed: true,
    tenant: result.tenant,
    warning: result.warning,
  };
}

/**
 * Get validation metrics
 * @returns {object}
 */
function getMetrics() {
  return {
    ..._metrics,
    cacheSize: _validationCache.size,
    cacheHitRate: _metrics.totalValidations > 0
      ? ((_metrics.cacheHits / _metrics.totalValidations) * 100).toFixed(2) + '%'
      : '0%',
  };
}

/**
 * Clear validation cache (for testing/debugging)
 */
function clearCache() {
  _validationCache.clear();
  log('Validation cache cleared', 'DEBUG');
}

module.exports = {
  // Main middleware
  raasLicenseMiddleware,

  // Core validation
  validateLicense,
  validateLicenseFormat,

  // Cache management
  checkCache,
  cacheValidationResult,
  clearCache,

  // Utilities
  maskLicenseKey,
  decodeJwtPayload,

  // Metrics
  getMetrics,

  // Constants
  RAAS_GATEWAY_URL,
  VALIDATION_CACHE_TTL_MS,
};
