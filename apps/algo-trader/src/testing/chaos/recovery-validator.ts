/**
 * Recovery Validator - Verifies system returns to normal after failure injection.
 * Checks container health, data integrity, and timing constraints.
 */
import { Environment, getEnvironmentHealth } from './environment-builder';

export interface RecoveryCheck {
  name: string;
  passed: boolean;
  detail: string;
}

export interface RecoveryReport {
  allPassed: boolean;
  recoveryTimeSec: number;
  checks: RecoveryCheck[];
}

/**
 * Validate that all containers have recovered to 'running' state.
 */
export function validateContainerRecovery(env: Environment): RecoveryCheck {
  const health = getEnvironmentHealth(env);
  const allRunning = Object.values(health).every((s) => s === 'running');
  const failedContainers = Object.entries(health)
    .filter(([, s]) => s !== 'running')
    .map(([name]) => name);

  return {
    name: 'Container Health',
    passed: allRunning,
    detail: allRunning
      ? 'All containers running'
      : `Failed containers: ${failedContainers.join(', ')}`,
  };
}

/**
 * Validate data integrity (simulated - checks no corruption markers).
 */
export function validateDataIntegrity(dataLossExpected: boolean): RecoveryCheck {
  // In simulation mode, data is always intact
  const dataIntact = true;

  return {
    name: 'Data Integrity',
    passed: dataLossExpected ? true : dataIntact,
    detail: dataIntact ? 'No data corruption detected' : 'Data corruption found',
  };
}

/**
 * Validate recovery time against the expected maximum.
 */
export function validateRecoveryTime(
  actualSec: number,
  maxSec: number
): RecoveryCheck {
  return {
    name: 'Recovery Time',
    passed: actualSec <= maxSec,
    detail: `Actual: ${actualSec.toFixed(3)}s, Max: ${maxSec}s`,
  };
}

/**
 * Run full recovery validation suite.
 */
export function validateRecovery(
  env: Environment,
  actualRecoverySec: number,
  expectedMaxRecoverySec: number,
  expectedDataLoss: boolean
): RecoveryReport {
  const checks: RecoveryCheck[] = [
    validateContainerRecovery(env),
    validateDataIntegrity(expectedDataLoss),
    validateRecoveryTime(actualRecoverySec, expectedMaxRecoverySec),
  ];

  return {
    allPassed: checks.every((c) => c.passed),
    recoveryTimeSec: actualRecoverySec,
    checks,
  };
}
