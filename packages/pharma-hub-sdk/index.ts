/**
 * @agencyos/pharma-hub-sdk — Unified Pharmaceutical Hub
 *
 * Facade consolidating drug discovery pipelines, regulatory submissions,
 * pharmacovigilance, cold-chain distribution, and track-and-trace.
 *
 * Quick Start:
 *   import { createDrugDiscoveryManager, createRegulatoryManager, createDistributionManager } from '@agencyos/pharma-hub-sdk';
 *
 * Sub-path imports:
 *   import { createDrugDiscoveryManager } from '@agencyos/pharma-hub-sdk/drug-discovery';
 *   import { createRegulatoryManager } from '@agencyos/pharma-hub-sdk/regulatory';
 *   import { createDistributionManager } from '@agencyos/pharma-hub-sdk/distribution';
 */

export { createDrugDiscoveryManager } from './drug-discovery-facade';
export type { Molecule, ClinicalTrial, ScreeningResult } from './drug-discovery-facade';

export { createRegulatoryManager } from './regulatory-facade';
export type { RegulatorySubmission, ComplianceCheck, AdverseEvent } from './regulatory-facade';

export { createDistributionManager } from './distribution-facade';
export type { ColdChainShipment, PharmacyPartner, SerializedUnit } from './distribution-facade';
