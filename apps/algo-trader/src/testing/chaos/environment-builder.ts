/**
 * Environment Builder - Creates and manages simulated/Docker test environments.
 * In-memory simulation mode by default; Docker support via dockerode when enabled.
 */

export interface ContainerConfig {
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'crashed';
  ports?: Record<string, number>;
  healthCheck?: () => boolean;
}

export interface EnvironmentConfig {
  useDocker: boolean;
  images: Record<string, string>;
}

export interface Environment {
  containers: Map<string, ContainerConfig>;
  status: 'ready' | 'building' | 'destroyed';
  startedAt: number;
}

/**
 * Build a simulated in-memory environment with mock containers.
 */
export function buildEnvironment(config: EnvironmentConfig): Environment {
  const containers = new Map<string, ContainerConfig>();

  for (const [name, image] of Object.entries(config.images)) {
    containers.set(name, {
      name,
      image,
      status: 'running',
      healthCheck: () => true,
    });
  }

  return {
    containers,
    status: 'ready',
    startedAt: Date.now(),
  };
}

/**
 * Stop a specific container in the environment.
 */
export function stopContainer(env: Environment, containerName: string): boolean {
  const container = env.containers.get(containerName);
  if (!container) return false;
  container.status = 'stopped';
  return true;
}

/**
 * Restart a stopped/crashed container.
 */
export function restartContainer(env: Environment, containerName: string): boolean {
  const container = env.containers.get(containerName);
  if (!container) return false;
  container.status = 'running';
  return true;
}

/**
 * Crash a container (simulates unexpected failure).
 */
export function crashContainer(env: Environment, containerName: string): boolean {
  const container = env.containers.get(containerName);
  if (!container) return false;
  container.status = 'crashed';
  return true;
}

/**
 * Destroy the entire environment.
 */
export function destroyEnvironment(env: Environment): void {
  for (const container of env.containers.values()) {
    container.status = 'stopped';
  }
  env.status = 'destroyed';
}

/**
 * Get health status of all containers.
 */
export function getEnvironmentHealth(env: Environment): Record<string, string> {
  const health: Record<string, string> = {};
  for (const [name, container] of env.containers) {
    health[name] = container.status;
  }
  return health;
}
