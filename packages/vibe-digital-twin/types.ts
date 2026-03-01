/**
 * @agencyos/vibe-digital-twin — Type Definitions
 *
 * Types for digital twin modeling, telemetry, and simulation.
 */

// ─── Configuration ──────────────────────────────────────────────

export interface DigitalTwinConfig {
  platform: 'azure-dt' | 'aws-twinmaker' | 'custom';
  apiEndpoint?: string;
  apiKey?: string;
  updateIntervalMs: number;
  simulationMode: 'realtime' | 'batch' | 'shadow';
}

// ─── Twin Model ─────────────────────────────────────────────────

export interface TwinModel {
  id: string;
  displayName: string;
  description?: string;
  properties: TwinProperty[];
  telemetrySchemas: TelemetrySchema[];
  relationships: RelationshipDefinition[];
}

export interface TwinProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  unit?: string;
  writable: boolean;
  defaultValue?: unknown;
}

export interface TelemetrySchema {
  name: string;
  type: 'number' | 'string' | 'boolean';
  unit?: string;
  samplingRate?: number;
}

export interface RelationshipDefinition {
  name: string;
  targetModelId: string;
  cardinality: 'one' | 'many';
}

// ─── Twin Instance ──────────────────────────────────────────────

export interface TwinInstance {
  id: string;
  modelId: string;
  displayName: string;
  properties: Record<string, unknown>;
  lastSync: number;
  status: 'synced' | 'stale' | 'offline';
  metadata: Record<string, string>;
}

export interface TwinRelationship {
  id: string;
  name: string;
  sourceId: string;
  targetId: string;
  properties?: Record<string, unknown>;
}

// ─── Telemetry ──────────────────────────────────────────────────

export interface TelemetryPoint {
  twinId: string;
  name: string;
  value: number | string | boolean;
  timestamp: number;
  quality?: 'good' | 'uncertain' | 'bad';
}

export interface TelemetryStream {
  twinId: string;
  name: string;
  points: TelemetryPoint[];
  latestValue: number | string | boolean;
  updatedAt: number;
}

// ─── Simulation ─────────────────────────────────────────────────

export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  twinIds: string[];
  parameterOverrides: Record<string, number>;
  duration: number;
  stepSize: number;
}

export interface SimulationResult {
  scenarioId: string;
  twinId: string;
  metric: string;
  baseline: number;
  simulated: number;
  delta: number;
  deltaPercent: number;
  confidence: number;
}

export interface SimulationRun {
  id: string;
  scenario: SimulationScenario;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: SimulationResult[];
  startedAt: string;
  completedAt?: string;
  error?: string;
}
