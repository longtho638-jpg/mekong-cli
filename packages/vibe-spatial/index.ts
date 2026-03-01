/**
 * @agencyos/vibe-spatial — Spatial Computing Facade SDK
 *
 * XR scene management, digital twin sync, device fleet management, spatial analytics.
 *
 * Usage:
 *   import { createSceneManager, createDeviceFleet, createDigitalTwinSync } from '@agencyos/vibe-spatial';
 */

// ─── Types ──────────────────────────────────────────────────────

export type XRPlatform = 'android_xr' | 'vision_os' | 'meta_quest' | 'webxr' | 'hololens';
export type AssetFormat = 'gltf' | 'glb' | 'usdz' | 'fbx' | 'obj';
export type DeviceStatus = 'online' | 'offline' | 'updating' | 'error';
export type InteractionMode = 'gaze' | 'hand_tracking' | 'controller' | 'voice';

export interface SpatialScene {
  id: string;
  name: string;
  platform: XRPlatform;
  assets: SpatialAsset[];
  anchors: SpatialAnchor[];
  createdAt: string;
}

export interface SpatialAsset {
  id: string;
  name: string;
  format: AssetFormat;
  url: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: number;
  sizeBytes: number;
}

export interface SpatialAnchor {
  id: string;
  label: string;
  position: { x: number; y: number; z: number };
  persistentId?: string;
}

export interface XRDevice {
  id: string;
  name: string;
  platform: XRPlatform;
  status: DeviceStatus;
  firmwareVersion: string;
  batteryLevel: number;
  lastSeen: string;
}

// ─── Scene Manager ──────────────────────────────────────────────

export function createSceneManager() {
  return {
    /** Validate asset format tương thích với platform */
    isFormatSupported(format: AssetFormat, platform: XRPlatform): boolean {
      const support: Record<XRPlatform, AssetFormat[]> = {
        android_xr: ['gltf', 'glb'],
        vision_os: ['usdz', 'gltf', 'glb'],
        meta_quest: ['gltf', 'glb', 'fbx'],
        webxr: ['gltf', 'glb'],
        hololens: ['gltf', 'glb', 'fbx'],
      };
      return support[platform]?.includes(format) ?? false;
    },

    /** Tính tổng size assets để estimate download time */
    calculateSceneSize(assets: SpatialAsset[]): { totalBytes: number; estimatedDownloadSec: number } {
      const totalBytes = assets.reduce((sum, a) => sum + a.sizeBytes, 0);
      const estimatedDownloadSec = Math.ceil(totalBytes / (5 * 1024 * 1024)); // ~5MB/s
      return { totalBytes, estimatedDownloadSec };
    },

    /** Validate scene có quá nhiều polygons không (perf check) */
    checkPerformanceBudget(assetCount: number, totalSizeBytes: number): { pass: boolean; warning?: string } {
      if (assetCount > 100) return { pass: false, warning: `${assetCount} assets vượt budget 100` };
      if (totalSizeBytes > 500 * 1024 * 1024) return { pass: false, warning: 'Scene > 500MB, cần optimize' };
      return { pass: true };
    },
  };
}

// ─── Device Fleet ───────────────────────────────────────────────

export function createDeviceFleet() {
  return {
    /** Lọc devices theo status */
    filterByStatus(devices: XRDevice[], status: DeviceStatus): XRDevice[] {
      return devices.filter(d => d.status === status);
    },

    /** Check devices cần update firmware */
    needsUpdate(device: XRDevice, latestVersion: string): boolean {
      return device.firmwareVersion !== latestVersion;
    },

    /** Tính fleet health score */
    getFleetHealth(devices: XRDevice[]): { score: number; online: number; offline: number; error: number } {
      const online = devices.filter(d => d.status === 'online').length;
      const offline = devices.filter(d => d.status === 'offline').length;
      const error = devices.filter(d => d.status === 'error').length;
      const score = devices.length === 0 ? 0 : Math.round((online / devices.length) * 100);
      return { score, online, offline, error };
    },

    /** Cảnh báo battery thấp */
    getLowBatteryDevices(devices: XRDevice[], threshold: number = 20): XRDevice[] {
      return devices.filter(d => d.batteryLevel < threshold && d.status === 'online');
    },
  };
}

// ─── Digital Twin Sync ──────────────────────────────────────────

export interface TwinState {
  entityId: string;
  properties: Record<string, number | string | boolean>;
  lastUpdated: string;
  source: 'iot_sensor' | 'manual' | 'simulation';
}

export function createDigitalTwinSync() {
  return {
    /** Detect drift giữa twin state và sensor data */
    detectDrift(twin: TwinState, sensorValue: Record<string, number>, threshold: number = 0.05): string[] {
      const drifted: string[] = [];
      for (const [key, value] of Object.entries(sensorValue)) {
        const twinVal = twin.properties[key];
        if (typeof twinVal === 'number' && Math.abs(twinVal - value) / (Math.abs(value) || 1) > threshold) {
          drifted.push(key);
        }
      }
      return drifted;
    },

    /** Check staleness — twin data quá cũ */
    isStale(twin: TwinState, maxAgeMs: number = 60000): boolean {
      return Date.now() - new Date(twin.lastUpdated).getTime() > maxAgeMs;
    },
  };
}
