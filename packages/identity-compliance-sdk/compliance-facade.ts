/**
 * @agencyos/identity-compliance-sdk — Compliance & AML Facade
 *
 * Re-exports KYC/AML, audit trails, and compliance automation
 * from @agencyos/vibe-compliance + @agencyos/vibe-compliance-auto.
 *
 * Usage:
 *   import { createKYCEngine, createAuditTrail, createRiskScorer } from '@agencyos/identity-compliance-sdk/compliance';
 */

// RegTech compliance
export {
  createKYCEngine,
  createAuditTrail,
  createComplianceChecker,
} from '@agencyos/vibe-compliance';

// AML automation
export {
  createRiskScorer,
  createSanctionsScreener,
  createPerpetualKycMonitor,
} from '@agencyos/vibe-compliance-auto';
