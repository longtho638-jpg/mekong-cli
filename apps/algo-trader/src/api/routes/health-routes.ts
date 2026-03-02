/**
 * Fastify health and readiness routes — /health and /ready endpoints.
 * Replaces http-health-check-server.ts. Used for container liveness/readiness probes.
 */

import { FastifyInstance } from 'fastify';

const VERSION = process.env.npm_package_version ?? '0.1.0';

let isReady = false;

export function setReady(ready: boolean): void {
  isReady = ready;
}

export function getReady(): boolean {
  return isReady;
}

export async function healthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/health', async (_req, reply) => {
    return reply.status(200).send({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: VERSION,
    });
  });

  fastify.get('/ready', async (_req, reply) => {
    const code = isReady ? 200 : 503;
    return reply.status(code).send({ ready: isReady });
  });
}
