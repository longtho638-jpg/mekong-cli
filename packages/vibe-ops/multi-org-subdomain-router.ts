/**
 * Multi-Org Subdomain Router — Tenant resolution for RaaS platforms
 *
 * Resolves organization context from hostname/subdomain patterns.
 * Supports: subdomain-based, path-based, and custom domain routing.
 *
 * Usage:
 *   const router = createSubdomainRouter({ baseDomain: 'wellnexus.vn' });
 *   const tenant = router.resolve('acme.wellnexus.vn');
 *   // → { orgSlug: 'acme', routeType: 'subdomain' }
 */

// ─── Types ──────────────────────────────────────────────────────

export type RouteType = 'subdomain' | 'path' | 'custom-domain' | 'root';

export interface TenantResolution {
  orgSlug: string | null;
  routeType: RouteType;
  isRoot: boolean;
  customDomain?: string;
}

export interface SubdomainRouterConfig {
  /** Base domain (e.g., 'wellnexus.vn') */
  baseDomain: string;
  /** Reserved subdomains that should NOT resolve to orgs */
  reservedSubdomains?: string[];
  /** Custom domain → org slug mapping lookup */
  resolveCustomDomain?: (hostname: string) => Promise<string | null>;
}

// ─── Default Reserved Subdomains ────────────────────────────────

const DEFAULT_RESERVED = [
  'www', 'app', 'api', 'admin', 'dashboard',
  'mail', 'smtp', 'ftp', 'cdn', 'static',
  'auth', 'login', 'signup', 'docs', 'help',
  'status', 'blog', 'dev', 'staging', 'test',
];

// ─── Router ─────────────────────────────────────────────────────

export interface SubdomainRouter {
  resolve: (hostname: string) => Promise<TenantResolution>;
  isReserved: (subdomain: string) => boolean;
  extractSubdomain: (hostname: string) => string | null;
}

export function createSubdomainRouter(config: SubdomainRouterConfig): SubdomainRouter {
  const reserved = new Set([
    ...DEFAULT_RESERVED,
    ...(config.reservedSubdomains ?? []),
  ].map(s => s.toLowerCase()));

  const baseDomain = config.baseDomain.toLowerCase();

  function extractSubdomain(hostname: string): string | null {
    const host = hostname.toLowerCase().replace(/:\d+$/, ''); // strip port

    // Must end with base domain
    if (!host.endsWith(`.${baseDomain}`)) return null;

    // Extract subdomain part
    const sub = host.slice(0, -(baseDomain.length + 1));

    // Must be a single-level subdomain (no dots)
    if (!sub || sub.includes('.')) return null;

    return sub;
  }

  function isReserved(subdomain: string): boolean {
    return reserved.has(subdomain.toLowerCase());
  }

  async function resolve(hostname: string): Promise<TenantResolution> {
    const host = hostname.toLowerCase().replace(/:\d+$/, '');

    // Root domain
    if (host === baseDomain || host === `www.${baseDomain}`) {
      return { orgSlug: null, routeType: 'root', isRoot: true };
    }

    // Subdomain routing
    const sub = extractSubdomain(hostname);
    if (sub) {
      if (isReserved(sub)) {
        return { orgSlug: null, routeType: 'root', isRoot: true };
      }
      return { orgSlug: sub, routeType: 'subdomain', isRoot: false };
    }

    // Custom domain routing
    if (config.resolveCustomDomain) {
      const orgSlug = await config.resolveCustomDomain(host);
      if (orgSlug) {
        return { orgSlug, routeType: 'custom-domain', isRoot: false, customDomain: host };
      }
    }

    // Fallback to root
    return { orgSlug: null, routeType: 'root', isRoot: true };
  }

  return { resolve, isReserved, extractSubdomain };
}

// ─── Path-Based Router (for single-domain setups) ───────────────

export interface PathRouterConfig {
  /** Path prefix for org routes (e.g., '/org') */
  prefix: string;
}

/**
 * Extract org slug from URL path.
 * Pattern: /org/:slug/... → slug
 */
export function resolveOrgFromPath(pathname: string, config: PathRouterConfig): string | null {
  const prefix = config.prefix.replace(/\/$/, '');
  const regex = new RegExp(`^${prefix}/([a-z0-9-]+)`, 'i');
  const match = pathname.match(regex);
  return match ? match[1].toLowerCase() : null;
}
