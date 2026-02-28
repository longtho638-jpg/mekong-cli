/**
 * @agencyos/vibe-edge — Edge AI & TinyML Facade SDK
 *
 * Model quantization helpers, edge deployment configs, OTA update management,
 * federated learning coordination, device fleet management.
 *
 * Usage:
 *   import { createQuantizer, createFleetManager, createOTAManager } from '@agencyos/vibe-edge';
 *   const quantizer = createQuantizer({ target: 'int8', framework: 'tflite' });
 *   const fleet = createFleetManager({ maxDevices: 1000 });
 *   const ota = createOTAManager({ strategy: 'canary', canaryPercent: 10 });
 */

// ─── Types ──────────────────────────────────────────────────────

export type QuantizationType = 'int8' | 'int4' | 'fp16' | 'dynamic' | 'qat';
export type EdgeFramework = 'tflite' | 'onnx' | 'coreml' | 'tensorrt' | 'tvm';
export type DeviceStatus = 'online' | 'offline' | 'updating' | 'error' | 'retired';
export type RolloutStrategy = 'canary' | 'staged' | 'full' | 'ab_test';

export interface ModelProfile {
  name: string;
  version: string;
  sizeBytes: number;
  framework: EdgeFramework;
  quantization: QuantizationType;
  latencyMs: number;
  accuracyScore: number;
  memoryMB: number;
  powerMW: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  hardware: string;
  status: DeviceStatus;
  currentModelVersion: string;
  lastSeen: string;
  metrics: DeviceMetrics;
  group?: string;
}

export interface DeviceMetrics {
  inferenceLatencyP50: number;
  inferenceLatencyP99: number;
  throughputRPS: number;
  memoryUsageMB: number;
  batteryPercent?: number;
  cpuTemp?: number;
}

export interface OTAUpdate {
  id: string;
  modelVersion: string;
  strategy: RolloutStrategy;
  targetDevices: string[];
  status: 'pending' | 'rolling_out' | 'completed' | 'rolled_back';
  progress: number;
  startedAt?: string;
  completedAt?: string;
}

// ─── Quantizer ──────────────────────────────────────────────────

export interface QuantizerConfig {
  target: QuantizationType;
  framework: EdgeFramework;
  calibrationSamples?: number;
}

export function createQuantizer(config: QuantizerConfig) {
  const { target, framework, calibrationSamples = 100 } = config;

  const compressionRatios: Record<QuantizationType, number> = {
    fp16: 0.5, int8: 0.25, int4: 0.125, dynamic: 0.3, qat: 0.25,
  };

  return {
    /**
     * Uoc tinh kich thuoc model sau quantization
     */
    estimateCompressedSize(originalSizeBytes: number): { compressedBytes: number; ratio: number } {
      const ratio = compressionRatios[target];
      return { compressedBytes: Math.round(originalSizeBytes * ratio), ratio };
    },

    /**
     * Danh gia accuracy trade-off du kien
     */
    estimateAccuracyImpact(baselineAccuracy: number): { estimatedAccuracy: number; degradation: number } {
      const degradationRates: Record<QuantizationType, number> = {
        fp16: 0.001, int8: 0.02, int4: 0.08, dynamic: 0.015, qat: 0.005,
      };
      const degradation = degradationRates[target];
      return {
        estimatedAccuracy: baselineAccuracy * (1 - degradation),
        degradation,
      };
    },

    /**
     * Tao quantization config cho framework
     */
    generateConfig(): Record<string, unknown> {
      return {
        quantization_type: target,
        framework,
        calibration_samples: calibrationSamples,
        optimization_level: target === 'int4' ? 'aggressive' : 'balanced',
        fallback_to_fp16: target === 'int4',
      };
    },

    /**
     * So sanh 2 model profiles
     */
    compareProfiles(original: ModelProfile, quantized: ModelProfile): {
      sizeReduction: number;
      speedup: number;
      accuracyDelta: number;
      memoryReduction: number;
    } {
      return {
        sizeReduction: 1 - quantized.sizeBytes / original.sizeBytes,
        speedup: original.latencyMs / quantized.latencyMs,
        accuracyDelta: quantized.accuracyScore - original.accuracyScore,
        memoryReduction: 1 - quantized.memoryMB / original.memoryMB,
      };
    },
  };
}

// ─── Fleet Manager ──────────────────────────────────────────────

export interface FleetManagerConfig {
  maxDevices: number;
}

export function createFleetManager(config: FleetManagerConfig) {
  return {
    /**
     * Phan nhom devices theo tieu chi
     */
    groupDevices(devices: DeviceInfo[], groupBy: 'hardware' | 'status' | 'group'): Record<string, DeviceInfo[]> {
      const groups: Record<string, DeviceInfo[]> = {};
      for (const device of devices) {
        const key = groupBy === 'hardware' ? device.hardware :
                    groupBy === 'status' ? device.status :
                    device.group || 'ungrouped';
        if (!groups[key]) groups[key] = [];
        groups[key].push(device);
      }
      return groups;
    },

    /**
     * Tinh fleet health metrics
     */
    calculateFleetHealth(devices: DeviceInfo[]): {
      onlineRate: number;
      avgLatency: number;
      devicesBelowSLA: number;
      status: 'healthy' | 'degraded' | 'critical';
    } {
      const online = devices.filter(d => d.status === 'online' || d.status === 'updating');
      const onlineRate = devices.length > 0 ? online.length / devices.length : 0;
      const latencies = online.map(d => d.metrics.inferenceLatencyP50);
      const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
      const belowSLA = online.filter(d => d.metrics.inferenceLatencyP99 > 100).length;

      const status = onlineRate >= 0.95 && belowSLA === 0 ? 'healthy' :
                     onlineRate >= 0.8 ? 'degraded' : 'critical';

      return { onlineRate, avgLatency, devicesBelowSLA: belowSLA, status };
    },

    /**
     * Tim devices can update
     */
    findUpdateCandidates(devices: DeviceInfo[], targetVersion: string): DeviceInfo[] {
      return devices.filter(d =>
        d.status === 'online' &&
        d.currentModelVersion !== targetVersion
      );
    },
  };
}

// ─── OTA Manager ────────────────────────────────────────────────

export interface OTAManagerConfig {
  strategy: RolloutStrategy;
  canaryPercent?: number;
  rollbackThreshold?: number;
}

export function createOTAManager(config: OTAManagerConfig) {
  const { strategy, canaryPercent = 10, rollbackThreshold = 0.05 } = config;

  return {
    /**
     * Tao rollout plan
     */
    createRolloutPlan(devices: DeviceInfo[], modelVersion: string): OTAUpdate {
      let targetDevices: string[];

      if (strategy === 'canary') {
        const canaryCount = Math.max(1, Math.round(devices.length * (canaryPercent / 100)));
        targetDevices = devices.slice(0, canaryCount).map(d => d.id);
      } else if (strategy === 'staged') {
        targetDevices = devices.slice(0, Math.ceil(devices.length / 4)).map(d => d.id);
      } else {
        targetDevices = devices.map(d => d.id);
      }

      return {
        id: `ota_${Date.now()}`,
        modelVersion,
        strategy,
        targetDevices,
        status: 'pending',
        progress: 0,
      };
    },

    /**
     * Quyet dinh co nen rollback khong dua tren error rate
     */
    shouldRollback(errorRate: number): { rollback: boolean; reason: string } {
      if (errorRate > rollbackThreshold) {
        return { rollback: true, reason: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds threshold ${(rollbackThreshold * 100).toFixed(1)}%` };
      }
      return { rollback: false, reason: 'Error rate within acceptable range' };
    },

    /**
     * Tinh tien do rollout
     */
    calculateProgress(update: OTAUpdate, completedDevices: number): number {
      return update.targetDevices.length > 0 ? (completedDevices / update.targetDevices.length) * 100 : 0;
    },
  };
}
