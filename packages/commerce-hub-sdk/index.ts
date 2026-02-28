/**
 * @agencyos/commerce-hub-sdk — Unified Commerce Hub
 *
 * Facade package consolidating e-commerce, POS, and F&B operations.
 *
 * Quick Start:
 *   import { createCartEngine, createOrderEngine, createMenuEngine } from '@agencyos/commerce-hub-sdk';
 *
 * Sub-path imports:
 *   import { createCartEngine } from '@agencyos/commerce-hub-sdk/ecommerce';
 *   import { createOrderEngine } from '@agencyos/commerce-hub-sdk/pos';
 *   import { createMenuEngine } from '@agencyos/commerce-hub-sdk/fnb';
 */

// E-Commerce
export { createCartEngine, createOrderManager, createPromotionEngine, createPricingEngine } from './ecommerce-facade';

// POS
export { createOrderEngine, createTableManager, createKitchenDisplay, createReceiptGenerator } from './pos-facade';

// F&B
export { createMenuEngine, createInventoryTracker } from './fnb-facade';
