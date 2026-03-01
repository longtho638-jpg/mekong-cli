/**
 * @agencyos/fashion-hub-sdk — Unified Fashion & Apparel Hub
 *
 * Facade consolidating product catalog, AI-powered styling recommendations,
 * wardrobe management, and sustainable supply chain tracking.
 *
 * Quick Start:
 *   import { createCatalogManager, createStylingAdvisor, createSupplyChainManager } from '@agencyos/fashion-hub-sdk';
 *
 * Sub-path imports:
 *   import { createCatalogManager } from '@agencyos/fashion-hub-sdk/catalog';
 *   import { createStylingAdvisor } from '@agencyos/fashion-hub-sdk/styling';
 *   import { createSupplyChainManager } from '@agencyos/fashion-hub-sdk/supply-chain';
 */

export { createCatalogManager } from './catalog-facade';
export type { FashionProduct, Collection, SizingGuide } from './catalog-facade';

export { createStylingAdvisor } from './styling-facade';
export type { StyleProfile, OutfitRecommendation, WardrobeItem } from './styling-facade';

export { createSupplyChainManager } from './supply-chain-facade';
export type { Supplier, ProductionOrder, SustainabilityReport } from './supply-chain-facade';
