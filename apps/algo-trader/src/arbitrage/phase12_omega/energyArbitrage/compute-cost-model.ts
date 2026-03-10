/**
 * Phase 12 Omega — Energy Arbitrage Module.
 * Estimates current compute cost based on cloud provider rates (AWS/GCP).
 * Tracks CPU hours, bandwidth, storage. Returns ComputeCostReport.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type CloudProvider = 'AWS' | 'GCP' | 'AZURE';

export interface ComputeUsage {
  cpuHours: number;
  memoryGbHours: number;
  bandwidthGb: number;
  storageGbMonth: number;
  gpuHours: number;
}

export interface ComputeCostReport {
  provider: CloudProvider;
  usage: ComputeUsage;
  costs: {
    cpuCost: number;
    memoryCost: number;
    bandwidthCost: number;
    storageCost: number;
    gpuCost: number;
    totalHourly: number;
    totalDaily: number;
  };
  generatedAt: number;
}

export interface ComputeCostModelConfig {
  provider: CloudProvider;
  region: string;
}

// ── Provider rate tables (USD per unit) ──────────────────────────────────────

interface ProviderRates {
  cpuPerHour: number;
  memoryGbPerHour: number;
  bandwidthGbOut: number;
  storageGbPerMonth: number;
  gpuPerHour: number;
}

const PROVIDER_RATES: Record<CloudProvider, ProviderRates> = {
  AWS: {
    cpuPerHour: 0.048,       // c6i.large vCPU
    memoryGbPerHour: 0.006,  // per GB
    bandwidthGbOut: 0.09,    // data transfer out
    storageGbPerMonth: 0.023, // S3 standard
    gpuPerHour: 0.526,       // p3.2xlarge per GPU
  },
  GCP: {
    cpuPerHour: 0.0475,
    memoryGbPerHour: 0.00638,
    bandwidthGbOut: 0.08,
    storageGbPerMonth: 0.020,
    gpuPerHour: 0.45,
  },
  AZURE: {
    cpuPerHour: 0.0497,
    memoryGbPerHour: 0.0063,
    bandwidthGbOut: 0.087,
    storageGbPerMonth: 0.0184,
    gpuPerHour: 0.50,
  },
};

// ── ComputeCostModel ──────────────────────────────────────────────────────────

export class ComputeCostModel {
  private readonly config: ComputeCostModelConfig;
  private currentUsage: ComputeUsage = {
    cpuHours: 0,
    memoryGbHours: 0,
    bandwidthGb: 0,
    storageGbMonth: 0,
    gpuHours: 0,
  };

  constructor(config: Partial<ComputeCostModelConfig> = {}) {
    this.config = {
      provider: 'AWS',
      region: 'us-east-1',
      ...config,
    };
  }

  /** Update tracked usage metrics (additive). */
  recordUsage(delta: Partial<ComputeUsage>): void {
    if (delta.cpuHours !== undefined) this.currentUsage.cpuHours += delta.cpuHours;
    if (delta.memoryGbHours !== undefined) this.currentUsage.memoryGbHours += delta.memoryGbHours;
    if (delta.bandwidthGb !== undefined) this.currentUsage.bandwidthGb += delta.bandwidthGb;
    if (delta.storageGbMonth !== undefined) this.currentUsage.storageGbMonth += delta.storageGbMonth;
    if (delta.gpuHours !== undefined) this.currentUsage.gpuHours += delta.gpuHours;
  }

  /** Reset usage counters. */
  resetUsage(): void {
    this.currentUsage = {
      cpuHours: 0, memoryGbHours: 0, bandwidthGb: 0, storageGbMonth: 0, gpuHours: 0,
    };
  }

  /** Calculate costs for given usage (or current tracked usage). */
  calculateCost(usage?: ComputeUsage): ComputeCostReport {
    const u = usage ?? { ...this.currentUsage };
    const rates = PROVIDER_RATES[this.config.provider];

    const cpuCost = u.cpuHours * rates.cpuPerHour;
    const memoryCost = u.memoryGbHours * rates.memoryGbPerHour;
    const bandwidthCost = u.bandwidthGb * rates.bandwidthGbOut;
    // Storage is monthly — convert to hourly fraction
    const storageCost = (u.storageGbMonth * rates.storageGbPerMonth) / (24 * 30);
    const gpuCost = u.gpuHours * rates.gpuPerHour;

    const totalHourly = cpuCost + memoryCost + bandwidthCost + storageCost + gpuCost;

    return {
      provider: this.config.provider,
      usage: { ...u },
      costs: {
        cpuCost: round(cpuCost),
        memoryCost: round(memoryCost),
        bandwidthCost: round(bandwidthCost),
        storageCost: round(storageCost),
        gpuCost: round(gpuCost),
        totalHourly: round(totalHourly),
        totalDaily: round(totalHourly * 24),
      },
      generatedAt: Date.now(),
    };
  }

  /** Return cost rates for the active provider. */
  getRates(): ProviderRates {
    return { ...PROVIDER_RATES[this.config.provider] };
  }

  getConfig(): ComputeCostModelConfig {
    return { ...this.config };
  }
}

function round(n: number): number {
  return Math.round(n * 10_000) / 10_000;
}

export default ComputeCostModel;
