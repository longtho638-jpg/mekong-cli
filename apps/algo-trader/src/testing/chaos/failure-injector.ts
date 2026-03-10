/**
 * Failure Injector - Injects various failure scenarios at runtime.
 * Supports network latency, packet loss, process crashes, exchange errors, and blockchain reorgs.
 */
import { Environment, crashContainer, stopContainer, restartContainer } from './environment-builder';

export type FailureType = 'latency' | 'packet-loss' | 'process' | 'exchange-error' | 'blockchain-reorg';

export interface FailureSpec {
  type: FailureType;
  target: string;
  duration: number; // seconds
  delayMs?: number;
  lossPercent?: number;
  statusCode?: number;
}

export interface ActiveFailure {
  spec: FailureSpec;
  startedAt: number;
  endAt: number;
  resolved: boolean;
}

/** Registry of all active failures */
const activeFailures: ActiveFailure[] = [];

/**
 * Inject a failure into the environment.
 */
export function injectFailure(env: Environment, spec: FailureSpec): ActiveFailure {
  const now = Date.now();
  const failure: ActiveFailure = {
    spec,
    startedAt: now,
    endAt: now + spec.duration * 1000,
    resolved: false,
  };

  switch (spec.type) {
    case 'process':
      // Kill/crash the target container
      crashContainer(env, spec.target);
      break;
    case 'latency':
      // Simulated: record latency injection (real would use tc netem)
      break;
    case 'packet-loss':
      // Simulated: record packet loss (real would use tc netem)
      break;
    case 'exchange-error':
      // Simulated: exchange returns error status codes
      break;
    case 'blockchain-reorg':
      // Simulated: blockchain state invalidation
      break;
  }

  activeFailures.push(failure);
  return failure;
}

/**
 * Resolve a failure (simulate recovery).
 */
export function resolveFailure(env: Environment, failure: ActiveFailure): void {
  failure.resolved = true;

  if (failure.spec.type === 'process') {
    restartContainer(env, failure.spec.target);
  }
}

/**
 * Check if a failure has expired and auto-resolve.
 */
export function checkAndResolveExpired(env: Environment): ActiveFailure[] {
  const now = Date.now();
  const resolved: ActiveFailure[] = [];

  for (const failure of activeFailures) {
    if (!failure.resolved && now >= failure.endAt) {
      resolveFailure(env, failure);
      resolved.push(failure);
    }
  }

  return resolved;
}

/**
 * Get all active (unresolved) failures.
 */
export function getActiveFailures(): ActiveFailure[] {
  return activeFailures.filter((f) => !f.resolved);
}

/**
 * Clear all failures (reset for next test).
 */
export function clearAllFailures(): void {
  activeFailures.length = 0;
}

/**
 * Simulate the effect of a latency failure on a request.
 * Returns the added delay in ms if target is affected, 0 otherwise.
 */
export function getInjectedLatency(target: string): number {
  for (const failure of activeFailures) {
    if (!failure.resolved && failure.spec.type === 'latency' && failure.spec.target === target) {
      return failure.spec.delayMs || 0;
    }
  }
  return 0;
}

/**
 * Check if an exchange error is being injected for a target.
 */
export function getInjectedExchangeError(target: string): number | null {
  for (const failure of activeFailures) {
    if (!failure.resolved && failure.spec.type === 'exchange-error' && failure.spec.target === target) {
      return failure.spec.statusCode || 500;
    }
  }
  return null;
}
