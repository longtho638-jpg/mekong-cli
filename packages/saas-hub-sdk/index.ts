/**
 * @agencyos/saas-hub-sdk — Unified SaaS Platform Hub
 *
 * Facade package consolidating multi-tenancy, usage billing,
 * and product-led growth operations.
 *
 * Quick Start:
 *   import { createTenantManager, createGrowthEngine } from '@agencyos/saas-hub-sdk';
 *
 * Sub-path imports:
 *   import { createTenantManager } from '@agencyos/saas-hub-sdk/tenant';
 *   import { createGrowthEngine } from '@agencyos/saas-hub-sdk/growth';
 *   import { ... } from '@agencyos/saas-hub-sdk/billing';
 */

// Tenant Management
export { createTenantManager } from './tenant-facade';
export type { Tenant, TenantIsolationConfig, TenantProvisionResult, TenantManager } from './tenant-facade';

// Billing (re-exports from vibe-subscription + vibe-billing)
export type { SubscriptionPlan, BillingRecord, UsageEvent, Invoice } from './billing-facade';
export { createBillingEngine } from './billing-facade';

// Product-Led Growth
export { createGrowthEngine } from './growth-facade';
export type { OnboardingFunnel, FeatureFlag, PLGMetrics, GrowthEngine } from './growth-facade';
