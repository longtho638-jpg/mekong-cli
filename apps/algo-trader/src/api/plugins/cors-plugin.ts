/**
 * Fastify CORS plugin — configures allowed origins for dev and production.
 * Reads CORS_ORIGINS env var (comma-separated) or defaults to localhost:3000.
 */

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';

const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:5173'];

function parseAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  if (!raw) return DEFAULT_DEV_ORIGINS;
  return raw.split(',').map((o) => o.trim()).filter(Boolean);
}

async function corsPlugin(fastify: FastifyInstance): Promise<void> {
  const allowedOrigins = parseAllowedOrigins();

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (server-to-server, curl, health checks)
      if (!origin) { cb(null, true); return; }
      if (allowedOrigins.includes(origin)) { cb(null, true); return; }
      cb(new Error('CORS: origin not allowed'), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}

export default fp(corsPlugin, { name: 'cors' });
