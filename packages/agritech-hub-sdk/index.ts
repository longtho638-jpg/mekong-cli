/**
 * @agencyos/agritech-hub-sdk — Unified AgriTech Hub
 *
 * Facade package consolidating precision farming, crop management,
 * and farm-to-table marketplace operations.
 *
 * Quick Start:
 *   import { createPrecisionFarmingEngine, createCropManager, createFarmMarketplace } from '@agencyos/agritech-hub-sdk';
 *
 * Sub-path imports:
 *   import { createPrecisionFarmingEngine } from '@agencyos/agritech-hub-sdk/precision-farming';
 *   import { createCropManager } from '@agencyos/agritech-hub-sdk/crop-management';
 *   import { createFarmMarketplace } from '@agencyos/agritech-hub-sdk/marketplace';
 */

// Precision Farming
export { createPrecisionFarmingEngine } from './precision-farming-facade';
export type { SoilSensorReading, IrrigationSchedule, WeatherForecast, CropAIRecommendation, PrecisionFarmingEngine } from './precision-farming-facade';

// Crop Management
export { createCropManager } from './crop-management-facade';
export type { CropLifecycle, HarvestPlan, PestDetectionResult, CropManager } from './crop-management-facade';

// Marketplace
export { createFarmMarketplace } from './marketplace-facade';
export type { FarmListing, OrganicCertification, FarmMarketplace } from './marketplace-facade';
