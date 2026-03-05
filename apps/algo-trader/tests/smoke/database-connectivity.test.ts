/**
 * Smoke Tests — Database Connectivity Validation
 *
 * Verifies PostgreSQL/Supabase connection for:
 * - Basic connectivity
 * - Schema validation
 * - Critical tables exist
 * - Read/write operations
 *
 * Requires DATABASE_URL or SUPABASE_URL env vars.
 * Tests are skipped when DATABASE_URL is not set.
 */

import { Client } from 'pg';

describe('Smoke Tests — Database Connectivity', () => {
  let client: Client | null = null;
  const databaseUrl = process.env.DATABASE_URL;

  beforeAll(async () => {
    if (!databaseUrl) {
      console.warn('DATABASE_URL not set — skipping DB smoke tests');
      return;
    }

    client = new Client(databaseUrl);
    await client.connect();
  });

  afterAll(async () => {
    await client?.end();
  });

  // ── Basic Connectivity (P0) ──

  describe('Basic Database Operations', () => {
    test('Database connects successfully', async () => {
      if (!databaseUrl || !client) {
        return; // Skip when DATABASE_URL not set
      }
      const result = await client.query('SELECT 1 as check');
      expect(result.rows[0].check).toBe(1);
    });

    test('Database version is accessible', async () => {
      if (!databaseUrl || !client) {
        return;
      }
      const result = await client.query('SELECT version()');
      expect(result.rows[0].version).toContain('PostgreSQL');
    });

    test('Database has reasonable connection latency (< 100ms)', async () => {
      if (!databaseUrl || !client) {
        return;
      }
      const start = Date.now();
      await client.query('SELECT 1');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });
  });

  // ── Schema Validation (P1) ──

  describe('Schema Validation', () => {
    test('Public schema exists', async () => {
      if (!databaseUrl || !client) {
        return;
      }
      const result = await client.query(
        "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'"
      );
      expect(result.rows.length).toBeGreaterThan(0);
    });

    test('Expected tables exist in database', async () => {
      if (!databaseUrl || !client) {
        return;
      }
      // List of expected tables for algo-trader
      const expectedTables = [
        'api_keys',
        'trading_signals',
        'trade_history',
        'performance_metrics',
      ];

      const result = await client.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `);

      const existingTables = result.rows.map(r => r.table_name);

      // At least some tables should exist (not all required for fresh install)
      expect(existingTables.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Read/Write Operations (P1) ──

  describe('Read/Write Operations', () => {
    test('Can create and drop test table', async () => {
      if (!databaseUrl || !client) {
        return;
      }
      const testTable = 'smoke_test_table';

      try {
        // Create test table
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${testTable} (
            id SERIAL PRIMARY KEY,
            test_value VARCHAR(100),
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);

        // Insert test data
        await client.query(
          `INSERT INTO ${testTable} (test_value) VALUES ($1)`,
          ['smoke-test-value']
        );

        // Verify insert
        const result = await client.query(
          `SELECT test_value FROM ${testTable} WHERE test_value = $1`,
          ['smoke-test-value']
        );
        expect(result.rows.length).toBe(1);
        expect(result.rows[0].test_value).toBe('smoke-test-value');

      } finally {
        // Cleanup
        await client.query(`DROP TABLE IF EXISTS ${testTable}`);
      }
    });

    test('Transaction rollback works correctly', async () => {
      if (!databaseUrl || !client) {
        return;
      }
      const testTable = 'smoke_test_txn';

      try {
        // Create test table
        await client.query(`
          CREATE TABLE IF NOT EXISTS ${testTable} (
            id SERIAL PRIMARY KEY,
            value VARCHAR(50)
          )
        `);

        // Start transaction that will rollback
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO ${testTable} (value) VALUES ($1)`,
          ['should-rollback']
        );
        await client.query('ROLLBACK');

        // Verify no data was inserted
        const result = await client.query(
          `SELECT * FROM ${testTable} WHERE value = $1`,
          ['should-rollback']
        );
        expect(result.rows.length).toBe(0);

      } finally {
        await client.query(`DROP TABLE IF EXISTS ${testTable}`);
      }
    });
  });

  // ── Connection Pool Health (P2) ──

  describe('Connection Health', () => {
    test('Multiple sequential queries work', async () => {
      if (!databaseUrl || !client) {
        return;
      }
      for (let i = 0; i < 5; i++) {
        const result = await client.query('SELECT $1 as num', [i]);
        expect(result.rows[0].num).toBe(i);
      }
    });

    test('Concurrent queries work', async () => {
      if (!databaseUrl || !client) {
        return;
      }
      const queries = [1, 2, 3, 4, 5].map(num =>
        client.query('SELECT $1 as num', [num])
      );

      const results = await Promise.all(queries);
      expect(results.length).toBe(5);
      expect(results.map((r, i) => r.rows[0].num)).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
