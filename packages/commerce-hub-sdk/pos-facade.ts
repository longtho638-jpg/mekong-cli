/**
 * @agencyos/commerce-hub-sdk — POS Facade
 *
 * Re-exports point-of-sale operations from @agencyos/vibe-pos.
 *
 * Usage:
 *   import { createOrderEngine } from '@agencyos/commerce-hub-sdk/pos';
 */

export {
  createOrderEngine,
  createTableManager,
  createKitchenDisplay,
  createReceiptGenerator,
} from '@agencyos/vibe-pos';
