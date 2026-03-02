/**
 * Fastify alert rules routes — /api/v1/alerts/* endpoints.
 * Stateless: rules and cooldownMap live in-memory per server instance.
 * Routes: GET /alerts/rules, POST /alerts/rules, DELETE /alerts/rules/:id,
 *         POST /alerts/evaluate
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  AlertRule,
  AlertRuleSchema,
  AlertMetric,
  evaluate,
} from '../../core/alert-rules-engine';
import { EvaluateAlertsSchema } from '../schemas/shared-schemas';

// In-memory store shared across requests within the same server instance
const rulesStore = new Map<string, AlertRule>();
const cooldownMap = new Map<string, number>();

/** Exposed for testing — reset state between test runs */
export function _resetAlertStore(): void {
  rulesStore.clear();
  cooldownMap.clear();
}

export async function alertRulesRoutes(fastify: FastifyInstance): Promise<void> {

  // GET /api/v1/alerts/rules — list all rules
  fastify.get('/api/v1/alerts/rules', async (_req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send(Array.from(rulesStore.values()));
  });

  // POST /api/v1/alerts/rules — create a rule
  fastify.post('/api/v1/alerts/rules', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = AlertRuleSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
    }
    if (rulesStore.has(parsed.data.id)) {
      return reply.status(409).send({ error: 'rule_already_exists', id: parsed.data.id });
    }
    rulesStore.set(parsed.data.id, parsed.data);
    return reply.status(201).send(parsed.data);
  });

  // DELETE /api/v1/alerts/rules/:id — remove a rule
  fastify.delete('/api/v1/alerts/rules/:id', async (
    req: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply,
  ) => {
    if (!rulesStore.has(req.params.id)) {
      return reply.status(404).send({ error: 'not_found' });
    }
    rulesStore.delete(req.params.id);
    cooldownMap.delete(req.params.id);
    return reply.status(200).send({ deleted: req.params.id });
  });

  // POST /api/v1/alerts/evaluate — evaluate rules against a metrics snapshot
  fastify.post('/api/v1/alerts/evaluate', async (req: FastifyRequest, reply: FastifyReply) => {
    const parsed = EvaluateAlertsSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_error', details: parsed.error.issues });
    }
    const results = evaluate(
      parsed.data.rules,
      parsed.data.metrics as Partial<Record<AlertMetric, number>>,
      cooldownMap,
    );
    return reply.status(200).send(results);
  });
}
