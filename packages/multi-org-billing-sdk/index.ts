/**
 * @agencyos/multi-org-billing-sdk — Multi-Org Billing Hub
 *
 * Unified SDK for multi-tenant billing orchestration:
 * - Org-scoped webhook processing pipeline
 * - Tenant resolution (subdomain + path + custom domain)
 * - Subscription activation with org binding
 * - State machine for payment status transitions
 *
 * Quick Start:
 *   import { createMultiOrgBillingHandler, createSubdomainRouter } from '@agencyos/multi-org-billing-sdk';
 *
 * Sub-path imports:
 *   import { createMultiOrgBillingHandler } from '@agencyos/multi-org-billing-sdk/orchestrator';
 *   import { createSubdomainRouter } from '@agencyos/multi-org-billing-sdk/tenant-router';
 *   import type { MultiOrgBillingConfig } from '@agencyos/multi-org-billing-sdk/types';
 */

// ─── Multi-Org Billing Orchestrator ─────────────────────────────

export {
  createMultiOrgBillingHandler,
  orchestrateBillingWebhook,
  createBillingWebhookConfig,
  processWebhookEvent,
  isValidTransition,
  VALID_TRANSITIONS,
} from './multi-org-billing-orchestrator';

export type {
  BillingOrchestrationDeps,
  BillingOrchestrationResult,
  WebhookHandlerDeps,
  OrderRecord,
  SubscriptionIntentRecord,
} from './multi-org-billing-orchestrator';

// ─── Tenant Router ──────────────────────────────────────────────

export {
  createSubdomainRouter,
  resolveOrgFromPath,
} from './multi-org-tenant-router';

export type {
  RouteType,
  SubdomainRouterConfig,
  SubdomainRouter,
  PathRouterConfig,
} from './multi-org-tenant-router';

// ─── Types ──────────────────────────────────────────────────────

export type {
  TenantContext,
  TenantRouteType,
  TenantResolution,
  MultiOrgBillingConfig,
  MultiOrgBillingResult,
  OrgScopedSubscriptionIntent,
} from './multi-org-billing-types';
