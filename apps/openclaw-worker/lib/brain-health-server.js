'use strict';

/**
 * Brain Health HTTP Server — Port 9090
 * Exposes daemon health status via /health (JSON) and /metrics (Prometheus text).
 * Bearer token auth via TOM_HUM_HEALTH_TOKEN env var (optional).
 */

const http = require('http');
const { log } = require('./brain-logger');

const HEALTH_PORT = parseInt(process.env.TOM_HUM_HEALTH_PORT || '9090', 10);
const HEALTH_TOKEN = process.env.TOM_HUM_HEALTH_TOKEN || '';
const START_TIME = Date.now();

let server = null;

function checkAuth(req) {
	if (!HEALTH_TOKEN) return true;
	const authHeader = req.headers['authorization'] || '';
	return authHeader === `Bearer ${HEALTH_TOKEN}`;
}

function buildHealthResponse() {
	let heartbeatStale = true;
	let heartbeatAgeMs = Infinity;
	try {
		const hb = require('./brain-heartbeat');
		heartbeatStale = hb.isBrainHeartbeatStale();
		heartbeatAgeMs = hb.readHeartbeatAge();
	} catch (e) {
		/* heartbeat module not loaded yet */
	}

	let brainAlive = false;
	try {
		brainAlive = require('./brain-spawn-manager').isBrainAlive();
	} catch (e) {}

	let queueStats = { pending: 0, active: 0, dlqCount: 0 };
	try {
		queueStats = require('./task-queue').getQueueStats();
	} catch (e) {}

	let circuitState = 'CLOSED';
	try {
		circuitState = require('./circuit-breaker').getState('proxy');
	} catch (e) {}

	let status = 'ok';
	if (heartbeatStale || !brainAlive) status = 'critical';
	else if (circuitState === 'OPEN' || queueStats.dlqCount > 0) status = 'degraded';

	return {
		status,
		uptime: Math.round((Date.now() - START_TIME) / 1000),
		heartbeat: { stale: heartbeatStale, ageMs: Math.round(heartbeatAgeMs) },
		brain: { alive: brainAlive, mode: process.env.TOM_HUM_BRAIN_MODE || 'tmux' },
		queue: queueStats,
		circuit: { proxy: circuitState },
		ts: new Date().toISOString(),
	};
}

function buildMetricsResponse(health) {
	return (
		[
			`# HELP tom_hum_uptime_seconds Daemon uptime`,
			`tom_hum_uptime_seconds ${health.uptime}`,
			`# HELP tom_hum_brain_alive Brain alive (1=yes 0=no)`,
			`tom_hum_brain_alive ${health.brain.alive ? 1 : 0}`,
			`# HELP tom_hum_queue_pending Pending tasks`,
			`tom_hum_queue_pending ${health.queue.pending}`,
			`# HELP tom_hum_queue_active Active tasks`,
			`tom_hum_queue_active ${health.queue.active}`,
			`# HELP tom_hum_dlq_count Dead letter queue count`,
			`tom_hum_dlq_count ${health.queue.dlqCount}`,
			`# HELP tom_hum_circuit_open Circuit breaker open (1=open)`,
			`tom_hum_circuit_open ${health.circuit.proxy === 'OPEN' ? 1 : 0}`,
		].join('\n') + '\n'
	);
}

function startHealthServer() {
	if (server) return;
	server = http.createServer((req, res) => {
		if (!checkAuth(req)) {
			res.writeHead(401, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ error: 'Unauthorized' }));
			return;
		}
		try {
			if (req.url === '/health' || req.url === '/') {
				const health = buildHealthResponse();
				const statusCode = health.status === 'critical' ? 503 : 200;
				res.writeHead(statusCode, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(health, null, 2));
			} else if (req.url === '/metrics') {
				const health = buildHealthResponse();
				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end(buildMetricsResponse(health));
			} else {
				res.writeHead(404);
				res.end('Not found');
			}
		} catch (e) {
			res.writeHead(500);
			res.end(JSON.stringify({ error: e.message }));
		}
	});

	server.listen(HEALTH_PORT, '127.0.0.1', () => {
		log(`[HEALTH] Server listening on http://127.0.0.1:${HEALTH_PORT}/health`);
	});
	server.on('error', (e) => {
		log(`[HEALTH] Server error: ${e.message}`);
	});
}

function stopHealthServer() {
	if (server) {
		server.close(() => log('[HEALTH] Server stopped'));
		server = null;
	}
}

module.exports = { startHealthServer, stopHealthServer };
