/**
 * Exchange factory — Shared exchange validation + construction for arb CLI commands.
 * Eliminates duplicate ExchangeConfig[] building across arb:scan/run/engine/orchestrator/auto.
 */

import { ExchangeClient } from '../execution/ExchangeClient';
import { logger } from '../utils/logger';

export interface ExchangeEntry {
  id: string;
  apiKey: string;
  secret: string;
  enabled: boolean;
}

/**
 * Parse comma-separated exchange IDs, validate API keys from env, return ExchangeEntry[].
 * Exits process with error if any exchange missing API key.
 */
export function buildExchangeConfigs(exchangeIds: string[]): ExchangeEntry[] {
  return exchangeIds.map((id: string) => {
    const apiKey = process.env[`${id.toUpperCase()}_API_KEY`] || '';
    const secret = process.env[`${id.toUpperCase()}_SECRET`] || '';

    if (!apiKey || apiKey.length < 10) {
      logger.error(`Missing API key for ${id}. Set ${id.toUpperCase()}_API_KEY in .env`);
      process.exit(1);
    }

    return { id, apiKey, secret, enabled: true };
  });
}

/**
 * Create ExchangeClient instances from exchange IDs (no API key validation).
 * Used by arb:scan (dry-run, no keys needed).
 */
export function buildExchangeClients(exchangeIds: string[]): Map<string, ExchangeClient> {
  const clients = new Map<string, ExchangeClient>();

  for (const id of exchangeIds) {
    try {
      const client = new ExchangeClient(id);
      clients.set(id, client);
    } catch (err) {
      logger.warn(`Skipping ${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return clients;
}

/**
 * Create authenticated ExchangeClient instances (with API keys).
 * Used by arb:run.
 */
export function buildAuthenticatedClients(exchangeIds: string[]): Map<string, ExchangeClient> {
  const clients = new Map<string, ExchangeClient>();

  for (const id of exchangeIds) {
    const apiKey = process.env[`${id.toUpperCase()}_API_KEY`] || '';
    const secret = process.env[`${id.toUpperCase()}_SECRET`] || '';

    if (!apiKey || apiKey.length < 10) {
      logger.error(`Missing API key for ${id}. Set ${id.toUpperCase()}_API_KEY in .env`);
      process.exit(1);
    }

    const client = new ExchangeClient(id, apiKey, secret);
    clients.set(id, client);
  }

  return clients;
}

/**
 * Parse comma-separated string into trimmed array.
 */
export function parseList(csv: string): string[] {
  return csv.split(',').map(s => s.trim()).filter(Boolean);
}

/**
 * Validate minimum exchange count for arbitrage.
 */
export function validateMinExchanges(ids: string[], min: number = 2): void {
  if (ids.length < min) {
    logger.error(`Need at least ${min} exchanges for arbitrage, got ${ids.length}`);
    process.exit(1);
  }
}
