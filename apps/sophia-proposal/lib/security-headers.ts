/**
 * Security Headers Configuration for Next.js Static Export
 *
 * These headers provide defense-in-depth security for the static export
 * deployed to Cloudflare Pages.
 */

export interface SecurityHeaders {
  key: string;
  value: string;
}

/**
 * Content Security Policy configuration
 * Restricts resource loading to trusted sources only
 *
 * SECURITY FIX: Removed 'unsafe-inline' and 'unsafe-eval' for stricter CSP
 * Note: This requires all inline scripts to be externalized
 */
export const createCSP = (): string => {
  const directives = {
    "default-src": ["'self'"],
    // Production: Remove 'unsafe-inline' and 'unsafe-eval' after testing
    // Development: Keep for hot reload compatibility
    "script-src": process.env.NODE_ENV === "production"
      ? ["'self'", "'wasm-unsafe-eval'"] // WebAssembly support for Next.js
      : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'"], // Required for Next.js CSS
    "img-src": ["'self'", "data:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://api.sophia.agencyos.network"],
    "frame-src": ["'none'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return directive;
      return `${directive} ${sources.join(" ")}`;
    })
    .join("; ");
};

/**
 * Generate all security headers for static export
 */
export const getSecurityHeaders = (): SecurityHeaders[] => [
  {
    key: "Content-Security-Policy",
    value: createCSP(),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

/**
 * Get headers as a Record format for next.config.ts
 */
export const getSecurityHeadersRecord = (): Record<string, string> => {
  const headers = getSecurityHeaders();
  return Object.fromEntries(headers.map(({ key, value }) => [key, value]));
};
