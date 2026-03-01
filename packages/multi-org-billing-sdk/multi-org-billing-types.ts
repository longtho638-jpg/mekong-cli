/**
 * @agencyos/multi-org-billing-sdk — Multi-Org Billing Types
 *
 * Type definitions for multi-tenant billing orchestration,
 * tenant resolution, and org-scoped subscription management.
 */

// ─── Tenant Context ─────────────────────────────────────────────

/** Resolved tenant context from subdomain or custom domain */
export interface TenantContext {
  orgSlug: string;
  orgName: string;
  orgId?: string;
}

/** Route type for tenant resolution */
export type TenantRouteType = 'subdomain' | 'path' | 'custom-domain' | 'root';

/** Result of tenant resolution */
export interface TenantResolution {
  orgSlug: string | null;
  routeType: TenantRouteType;
  isRoot: boolean;
  customDomain?: string;
}

// ─── Multi-Org Billing ──────────────────────────────────────────

/** Config for multi-org billing orchestrator */
export interface MultiOrgBillingConfig {
  /** Resolve tenant context from org ID */
  resolveTenantFromOrg: (orgId: string) => Promise<TenantContext | null>;
  /** Callback after successful billing event */
  onBillingComplete?: (result: MultiOrgBillingResult) => Promise<void>;
  /** Webhook secret for signature verification */
  webhookSecret: string;
  /** Checksum key for payload verification */
  checksumKey: string;
}

/** Result from multi-org billing pipeline */
export interface MultiOrgBillingResult {
  /** Webhook processing status */
  status: 'processed' | 'ignored' | 'error';
  /** Resolved tenant (null if no org binding) */
  tenantContext: TenantContext | null;
  /** Order code from payment event */
  orderCode?: number;
  /** New status after processing */
  newStatus?: string;
  /** Timestamp of processing */
  timestamp: string;
  /** Error message if failed */
  message?: string;
}

// ─── Subscription Intent (org-scoped) ───────────────────────────

/** Subscription intent with optional org binding for multi-tenant */
export interface OrgScopedSubscriptionIntent {
  id: string;
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  status: 'pending' | 'paid' | 'canceled';
  /** Org binding for multi-tenant — null for personal subscriptions */
  orgId?: string | null;
  amount?: number;
}
