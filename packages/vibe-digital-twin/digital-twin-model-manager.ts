/**
 * @agencyos/vibe-digital-twin — Model & Instance Manager
 *
 * CRUD operations for twin models, instances, relationships, and telemetry.
 */

import type {
  DigitalTwinConfig,
  TwinModel,
  TwinInstance,
  TwinRelationship,
  TelemetryPoint,
  TelemetryStream,
} from './types';

// ─── Twin Manager ───────────────────────────────────────────────

export function createTwinManager(config: DigitalTwinConfig) {
  const models = new Map<string, TwinModel>();
  const instances = new Map<string, TwinInstance>();
  const relationships: TwinRelationship[] = [];
  const telemetryStreams = new Map<string, TelemetryStream>();

  return {
    // ─── Model Operations ─────────────────────────────────────

    registerModel(model: TwinModel): void {
      models.set(model.id, model);
    },

    getModel(modelId: string): TwinModel | undefined {
      return models.get(modelId);
    },

    listModels(): TwinModel[] {
      return Array.from(models.values());
    },

    // ─── Instance Operations ──────────────────────────────────

    createInstance(modelId: string, id: string, displayName: string, properties?: Record<string, unknown>): TwinInstance {
      const model = models.get(modelId);
      if (!model) throw new Error(`Model not found: ${modelId}`);

      // Apply defaults from model
      const defaultProps: Record<string, unknown> = {};
      for (const prop of model.properties) {
        if (prop.defaultValue !== undefined) {
          defaultProps[prop.name] = prop.defaultValue;
        }
      }

      const instance: TwinInstance = {
        id,
        modelId,
        displayName,
        properties: { ...defaultProps, ...properties },
        lastSync: Date.now(),
        status: 'synced',
        metadata: {},
      };

      instances.set(id, instance);
      return instance;
    },

    getInstance(id: string): TwinInstance | undefined {
      return instances.get(id);
    },

    listInstances(modelId?: string): TwinInstance[] {
      const all = Array.from(instances.values());
      return modelId ? all.filter(i => i.modelId === modelId) : all;
    },

    updateProperties(id: string, properties: Record<string, unknown>): TwinInstance {
      const instance = instances.get(id);
      if (!instance) throw new Error(`Instance not found: ${id}`);

      Object.assign(instance.properties, properties);
      instance.lastSync = Date.now();
      instance.status = 'synced';
      return instance;
    },

    // ─── Relationship Operations ──────────────────────────────

    addRelationship(name: string, sourceId: string, targetId: string): TwinRelationship {
      const rel: TwinRelationship = {
        id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        sourceId,
        targetId,
      };
      relationships.push(rel);
      return rel;
    },

    getRelationships(twinId: string): TwinRelationship[] {
      return relationships.filter(r => r.sourceId === twinId || r.targetId === twinId);
    },

    // ─── Telemetry Operations ─────────────────────────────────

    ingestTelemetry(points: TelemetryPoint[]): void {
      for (const point of points) {
        const key = `${point.twinId}:${point.name}`;
        const stream = telemetryStreams.get(key);

        if (stream) {
          stream.points.push(point);
          // Keep only last 1000 points per stream
          if (stream.points.length > 1000) {
            stream.points = stream.points.slice(-1000);
          }
          stream.latestValue = point.value;
          stream.updatedAt = point.timestamp;
        } else {
          telemetryStreams.set(key, {
            twinId: point.twinId,
            name: point.name,
            points: [point],
            latestValue: point.value,
            updatedAt: point.timestamp,
          });
        }

        // Update instance sync status
        const instance = instances.get(point.twinId);
        if (instance) {
          instance.lastSync = point.timestamp;
          instance.status = 'synced';
        }
      }
    },

    getTelemetry(twinId: string, name: string): TelemetryStream | undefined {
      return telemetryStreams.get(`${twinId}:${name}`);
    },

    getLatestValues(twinId: string): Record<string, unknown> {
      const result: Record<string, unknown> = {};
      for (const [key, stream] of telemetryStreams) {
        if (key.startsWith(`${twinId}:`)) {
          result[stream.name] = stream.latestValue;
        }
      }
      return result;
    },

    /** Mark stale twins (no telemetry for > threshold ms) */
    markStale(thresholdMs: number = config.updateIntervalMs * 3): string[] {
      const now = Date.now();
      const staleIds: string[] = [];
      for (const instance of instances.values()) {
        if (now - instance.lastSync > thresholdMs && instance.status !== 'offline') {
          instance.status = 'stale';
          staleIds.push(instance.id);
        }
      }
      return staleIds;
    },
  };
}
