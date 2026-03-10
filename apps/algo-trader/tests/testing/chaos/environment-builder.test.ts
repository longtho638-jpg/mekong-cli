import {
  buildEnvironment, stopContainer, restartContainer, crashContainer,
  destroyEnvironment, getEnvironmentHealth, EnvironmentConfig,
} from '../../../src/testing/chaos/environment-builder';

describe('environment-builder', () => {
  const config: EnvironmentConfig = {
    useDocker: false,
    images: { 'exchange-mock': 'mock:latest', 'phase1': 'phase1:latest' },
  };

  it('should build environment with containers', () => {
    const env = buildEnvironment(config);
    expect(env.status).toBe('ready');
    expect(env.containers.size).toBe(2);
    expect(env.containers.get('exchange-mock')?.status).toBe('running');
  });

  it('should stop a container', () => {
    const env = buildEnvironment(config);
    expect(stopContainer(env, 'phase1')).toBe(true);
    expect(env.containers.get('phase1')?.status).toBe('stopped');
  });

  it('should return false for non-existent container', () => {
    const env = buildEnvironment(config);
    expect(stopContainer(env, 'nonexistent')).toBe(false);
  });

  it('should restart a stopped container', () => {
    const env = buildEnvironment(config);
    stopContainer(env, 'phase1');
    expect(restartContainer(env, 'phase1')).toBe(true);
    expect(env.containers.get('phase1')?.status).toBe('running');
  });

  it('should crash a container', () => {
    const env = buildEnvironment(config);
    expect(crashContainer(env, 'exchange-mock')).toBe(true);
    expect(env.containers.get('exchange-mock')?.status).toBe('crashed');
  });

  it('should destroy environment', () => {
    const env = buildEnvironment(config);
    destroyEnvironment(env);
    expect(env.status).toBe('destroyed');
    for (const c of env.containers.values()) {
      expect(c.status).toBe('stopped');
    }
  });

  it('should return health status', () => {
    const env = buildEnvironment(config);
    crashContainer(env, 'phase1');
    const health = getEnvironmentHealth(env);
    expect(health['exchange-mock']).toBe('running');
    expect(health['phase1']).toBe('crashed');
  });

  it('should handle empty images config', () => {
    const env = buildEnvironment({ useDocker: false, images: {} });
    expect(env.containers.size).toBe(0);
    expect(env.status).toBe('ready');
  });
});
