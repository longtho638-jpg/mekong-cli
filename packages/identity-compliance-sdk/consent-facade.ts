/**
 * @agencyos/identity-compliance-sdk — Consent Management Facade
 *
 * Re-exports GDPR/CCPA consent management, DSR processing,
 * and data flow mapping from @agencyos/vibe-consent.
 *
 * Usage:
 *   import { createConsentManager, createDSRProcessor } from '@agencyos/identity-compliance-sdk/consent';
 */

export {
  createConsentManager,
  createDSRProcessor,
  createDataMapper,
} from '@agencyos/vibe-consent';
