/**
 * @agencyos/insurtech-hub-sdk — Unified Insurance & InsurTech Hub
 *
 * Facade package consolidating policy management, claims processing,
 * underwriting AI, risk assessment, premium calculation, and fraud detection.
 *
 * Quick Start:
 *   import { createPolicyManager, createClaimsProcessor, createUnderwritingEngine } from '@agencyos/insurtech-hub-sdk';
 *
 * Sub-path imports:
 *   import { createPolicyManager } from '@agencyos/insurtech-hub-sdk/policy';
 *   import { createClaimsProcessor } from '@agencyos/insurtech-hub-sdk/claims';
 *   import { createUnderwritingEngine } from '@agencyos/insurtech-hub-sdk/underwriting';
 */

// Policy Management
export { createPolicyManager, createPremiumCalculator } from './policy-facade';
export type { Policy, PolicyRenewal, PolicyEndorsement } from './policy-facade';

// Claims Processing & Fraud Detection
export { createClaimsProcessor, createFraudDetector } from './claims-facade';
export type { Claim, ClaimSettlement } from './claims-facade';

// Underwriting & Risk Assessment
export { createUnderwritingEngine, createRegulatoryCompliance } from './underwriting-facade';
export type { RiskAssessment, UnderwritingDecision } from './underwriting-facade';
