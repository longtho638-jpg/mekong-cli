import * as http from 'http';

const VERSION = process.env.npm_package_version ?? '0.1.0';
const PORT = parseInt(process.env.HEALTH_PORT ?? '3000', 10);

let server: http.Server | null = null;
let isReady = false;
let startTime: number;

// Health state
interface HealthState {
  isReady: boolean;
  isLive: boolean;
  dependencies: Record<string, boolean>;
  lastError?: string;
  errorCount: number;
}

const healthState: HealthState = {
  isReady: false,
  isLive: true,
  dependencies: {},
  errorCount: 0,
};

export function setReady(ready: boolean): void {
  isReady = ready;
  healthState.isReady = ready;
}

export function setDependencyHealth(name: string, healthy: boolean): void {
  healthState.dependencies[name] = healthy;
}

export function reportError(message: string): void {
  healthState.lastError = message;
  healthState.errorCount++;
}

export function getHealthState(): HealthState {
  return { ...healthState };
}

export function startHealthServer(): void {
  startTime = Date.now();
  server = http.createServer((req, res) => {
    if (req.method !== 'GET') {
      res.writeHead(405, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    // /health - Full health check with dependencies
    if (req.url === '/health') {
      const allDepsHealthy = Object.values(healthState.dependencies).every(v => v);
      const healthy = healthState.isLive && allDepsHealthy;
      res.writeHead(healthy ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: healthy ? 'ok' : 'degraded',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        version: VERSION,
        dependencies: healthState.dependencies,
        errorCount: healthState.errorCount,
        lastError: healthState.lastError,
      }));
      return;
    }

    // /ready - Readiness probe (traffic ready)
    if (req.url === '/ready') {
      const code = isReady ? 200 : 503;
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ready: isReady }));
      return;
    }

    // /live - Liveness probe (process alive)
    if (req.url === '/live') {
      const alive = healthState.isLive;
      const code = alive ? 200 : 503;
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        alive,
        uptime: process.uptime(),
        startTime: new Date(startTime).toISOString(),
      }));
      return;
    }

    // /metrics - Basic metrics
    if (req.url === '/metrics') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: VERSION,
        errorCount: healthState.errorCount,
        dependenciesHealthy: Object.values(healthState.dependencies).filter(v => v).length,
        dependenciesTotal: Object.keys(healthState.dependencies).length,
      }));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Not found' }));
  });

  server.listen(PORT, () => {
    process.stdout.write(`Health server listening on port ${PORT}\n`);
  });
}

export function stopHealthServer(): void {
  server?.close();
  server = null;
}
