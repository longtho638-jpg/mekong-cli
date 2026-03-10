/**
 * CapitalFortress module barrel — Doomsday Circuit Breaker (pure TypeScript).
 * SIMULATION MODE ONLY.
 */

export { AnomalyDetector } from './anomaly-detector';
export type { MarketSnapshot } from './anomaly-detector';
export { EmergencyProtocol } from './emergency-protocol';
export type { EmergencyConfig, EmergencyState } from './emergency-protocol';
export { HealthMonitor } from './health-monitor';
export type { HealthMonitorConfig, HealthStatus } from './health-monitor';

/** Convenience: wire HealthMonitor → EmergencyProtocol and start monitoring. */
export function start(config?: {
  monitor?: Partial<import('./health-monitor').HealthMonitorConfig>;
  emergency?: import('./emergency-protocol').EmergencyConfig;
}): { monitor: import('./health-monitor').HealthMonitor; protocol: import('./emergency-protocol').EmergencyProtocol } {
  const { HealthMonitor } = require('./health-monitor') as typeof import('./health-monitor');
  const { EmergencyProtocol } = require('./emergency-protocol') as typeof import('./emergency-protocol');

  const monitor = new HealthMonitor(config?.monitor ?? {});
  const protocol = new EmergencyProtocol(
    config?.emergency ?? { coldStorageAddresses: [], emergencyWithdrawal: false },
  );

  protocol.attachTo(monitor);
  monitor.start();

  return { monitor, protocol };
}
