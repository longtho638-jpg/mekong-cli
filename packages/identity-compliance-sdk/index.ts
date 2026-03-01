/**
 * @agencyos/identity-compliance-sdk — Unified Identity & Compliance Hub
 *
 * Facade package consolidating decentralized identity, KYC/AML compliance,
 * and privacy consent management.
 *
 * Quick Start:
 *   import { createCredentialIssuer, createKYCEngine, createConsentManager } from '@agencyos/identity-compliance-sdk';
 *
 * Sub-path imports:
 *   import { createCredentialIssuer } from '@agencyos/identity-compliance-sdk/identity';
 *   import { createKYCEngine } from '@agencyos/identity-compliance-sdk/compliance';
 *   import { createConsentManager } from '@agencyos/identity-compliance-sdk/consent';
 */

// Identity (DID, Verifiable Credentials)
export { createCredentialIssuer, createIdentityWallet, createVerificationEngine } from './identity-facade';

// Compliance (KYC/AML, Audit Trails)
export { createKYCEngine, createAuditTrail, createComplianceChecker, createRiskScorer, createSanctionsScreener, createPerpetualKycMonitor } from './compliance-facade';

// Consent (GDPR/CCPA)
export { createConsentManager, createDSRProcessor, createDataMapper } from './consent-facade';
