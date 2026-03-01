/**
 * @agencyos/multi-org-billing-sdk — Tenant Router Facade
 *
 * Re-exports subdomain and path-based tenant routing from @agencyos/vibe-ops.
 *
 * Usage:
 *   import { createSubdomainRouter, resolveOrgFromPath } from '@agencyos/multi-org-billing-sdk/tenant-router';
 *
 *   const router = createSubdomainRouter({ baseDomain: 'myapp.com' });
 *   const tenant = await router.resolve('acme.myapp.com');
 *   // → { orgSlug: 'acme', routeType: 'subdomain', isRoot: false }
 */

// Subdomain router
export {
  createSubdomainRouter,
  resolveOrgFromPath,
} from '@agencyos/vibe-ops';

export type {
  RouteType,
  TenantResolution,
  SubdomainRouterConfig,
  SubdomainRouter,
  PathRouterConfig,
} from '@agencyos/vibe-ops';
