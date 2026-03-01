/**
 * @agencyos/vibe-digital-twin — Digital Twin SDK
 *
 * Model, monitor, and simulate physical systems as virtual replicas.
 *
 * Usage:
 *   import { createTwinManager, createSimulationEngine } from '@agencyos/vibe-digital-twin';
 *
 *   const twins = createTwinManager({ platform: 'custom', updateIntervalMs: 5000, simulationMode: 'realtime' });
 *   twins.registerModel({ id: 'hvac', displayName: 'HVAC Unit', properties: [...], ... });
 *   twins.createInstance('hvac', 'hvac-floor-3', 'HVAC Floor 3');
 *   twins.ingestTelemetry([{ twinId: 'hvac-floor-3', name: 'temperature', value: 22.5, timestamp: Date.now() }]);
 */

// Twin model & instance management
export { createTwinManager } from './digital-twin-model-manager';

// Simulation engine
export { createSimulationEngine } from './digital-twin-simulation-engine';
export type { SimulationEngineConfig } from './digital-twin-simulation-engine';

// All types
export type {
  DigitalTwinConfig,
  TwinModel,
  TwinProperty,
  TelemetrySchema,
  RelationshipDefinition,
  TwinInstance,
  TwinRelationship,
  TelemetryPoint,
  TelemetryStream,
  SimulationScenario,
  SimulationResult,
  SimulationRun,
} from './types';
