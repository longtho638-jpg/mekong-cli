/**
 * @agencyos/identity-compliance-sdk — Decentralized Identity Facade
 *
 * Re-exports DID, verifiable credentials, and identity wallet from @agencyos/vibe-identity.
 *
 * Usage:
 *   import { createCredentialIssuer, createIdentityWallet } from '@agencyos/identity-compliance-sdk/identity';
 */

export {
  createCredentialIssuer,
  createIdentityWallet,
  createVerificationEngine,
} from '@agencyos/vibe-identity';
