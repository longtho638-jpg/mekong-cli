/**
 * @agencyos/energy-hub-sdk — Renewable Energy Monitoring Facade
 *
 * Solar panel and wind turbine monitoring, capacity planning,
 * and performance analytics for renewable energy assets.
 *
 * Usage:
 *   import { createRenewableMonitor } from '@agencyos/energy-hub-sdk/renewable';
 */

export interface SolarPanel {
  panelId: string;
  siteId: string;
  installedCapacityKw: number;
  currentOutputKw: number;
  efficiencyPercent: number;
  panelTemperatureCelsius: number;
  irradianceWm2: number;
  lastMaintenanceAt: Date;
  status: 'online' | 'degraded' | 'offline' | 'maintenance';
}

export interface WindTurbine {
  turbineId: string;
  siteId: string;
  ratedCapacityMw: number;
  currentOutputMw: number;
  windSpeedMs: number;
  rotorSpeedRpm: number;
  capacityFactorPercent: number;
  lastMaintenanceAt: Date;
  status: 'online' | 'curtailed' | 'offline' | 'maintenance';
}

export interface CapacityPlan {
  planId: string;
  siteId: string;
  energyTypeId: 'solar' | 'wind' | 'mixed';
  forecastPeriodStart: Date;
  forecastPeriodEnd: Date;
  projectedOutputMwh: number;
  confidencePercent: number;
  assumptions: string[];
  createdAt: Date;
}

export interface RenewableMonitor {
  getSolarPanels(siteId: string): Promise<SolarPanel[]>;
  getWindTurbines(siteId: string): Promise<WindTurbine[]>;
  getSiteTotalOutputKw(siteId: string): Promise<number>;
  generateCapacityPlan(siteId: string, periodDays: number): Promise<CapacityPlan>;
  scheduleMaintenace(assetId: string, assetType: 'solar' | 'wind', scheduledAt: Date): Promise<void>;
}

/**
 * Create a renewable monitor for solar/wind assets and capacity planning.
 * Implement with your renewable energy backend.
 */
export function createRenewableMonitor(): RenewableMonitor {
  return {
    async getSolarPanels(_siteId) {
      throw new Error('Implement with your renewable energy backend');
    },
    async getWindTurbines(_siteId) {
      throw new Error('Implement with your renewable energy backend');
    },
    async getSiteTotalOutputKw(_siteId) {
      throw new Error('Implement with your renewable energy backend');
    },
    async generateCapacityPlan(_siteId, _periodDays) {
      throw new Error('Implement with your renewable energy backend');
    },
    async scheduleMaintenace(_assetId, _assetType, _scheduledAt) {
      throw new Error('Implement with your renewable energy backend');
    },
  };
}
