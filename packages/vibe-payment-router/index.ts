/**
 * @agencyos/vibe-payment-router — Payment Routing Engine
 *
 * Provider-agnostic payment routing with failover, webhook dispatch,
 * and tier↔price bidirectional mapping.
 *
 * Usage:
 *   import { createProviderRouter, createWebhookDispatcher, createTierPriceMapper } from '@agencyos/vibe-payment-router';
 */

// Provider failover router
export { createProviderRouter } from './provider-failover-router';
export type { ProviderName, ProviderStatus, ProviderEntry, ProviderRouterConfig, RoutingResult } from './provider-failover-router';

// Webhook dispatch engine
export { createWebhookDispatcher } from './webhook-dispatch-engine';
export type { WebhookProvider, WebhookDispatchResult, WebhookProviderHandler, ParsedWebhookEvent, WebhookDispatcherConfig } from './webhook-dispatch-engine';

// Tier ↔ Price bidirectional mapper
export { createTierPriceMapper } from './tier-price-bidirectional-mapper';
export type { BillingCycle, TierPriceEntry, TierPriceMapperConfig } from './tier-price-bidirectional-mapper';
