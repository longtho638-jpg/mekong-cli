/**
 * Fastify error handler plugin — maps Zod validation errors and domain errors
 * to consistent JSON error responses with appropriate HTTP status codes.
 */

import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

interface ApiError {
  error: string;
  details?: unknown;
  statusCode: number;
}

function buildErrorResponse(err: unknown): ApiError {
  // Fastify native validation error (Zod parse failure wrapped by route handler)
  if (err && typeof err === 'object' && 'zodError' in err) {
    const ze = (err as { zodError: { issues: unknown[] } }).zodError;
    return { statusCode: 400, error: 'validation_error', details: ze.issues };
  }

  // FastifyError (e.g. 404 from route not found)
  if (err && typeof err === 'object' && 'statusCode' in err) {
    const fe = err as FastifyError;
    return { statusCode: fe.statusCode ?? 500, error: fe.message };
  }

  // Domain errors (plain Error)
  if (err instanceof Error) {
    const msg = err.message;
    if (msg === 'not_found') return { statusCode: 404, error: 'not_found' };
    if (msg === 'invalid_json') return { statusCode: 400, error: 'invalid_json' };
    return { statusCode: 500, error: msg };
  }

  return { statusCode: 500, error: 'internal_server_error' };
}

async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler(
    (err: FastifyError, _req: FastifyRequest, reply: FastifyReply) => {
      const response = buildErrorResponse(err);
      void reply.status(response.statusCode).send(response);
    },
  );
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
