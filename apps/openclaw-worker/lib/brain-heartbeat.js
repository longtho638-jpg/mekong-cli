'use strict';
/**
 * brain-heartbeat.js
 *
 * Heartbeat file mechanism for brain liveness monitoring.
 * Writes /tmp/tom_hum_heartbeat every 30s; age > 90s = stale.
 *
 * Exports: startHeartbeat, stopHeartbeat, isBrainHeartbeatStale,
 *          readHeartbeatAge, HEARTBEAT_FILE
 */

const fs = require('fs');

const HEARTBEAT_FILE = '/tmp/tom_hum_heartbeat';
const HEARTBEAT_INTERVAL_MS = 30_000;
const HEARTBEAT_MAX_AGE_MS = 90_000;

let heartbeatInterval = null;

function writeHeartbeat(pid) {
	try {
		fs.writeFileSync(HEARTBEAT_FILE, `${new Date().toISOString()}\n${pid || process.pid}\n`);
	} catch (e) {
		/* non-critical */
	}
}

function readHeartbeatAge() {
	try {
		const stat = fs.statSync(HEARTBEAT_FILE);
		return Date.now() - stat.mtimeMs;
	} catch (e) {
		return Infinity;
	}
}

function startHeartbeat(pid) {
	stopHeartbeat();
	writeHeartbeat(pid);
	heartbeatInterval = setInterval(() => writeHeartbeat(pid), HEARTBEAT_INTERVAL_MS);
}

function stopHeartbeat() {
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
		heartbeatInterval = null;
	}
}

function isBrainHeartbeatStale() {
	return readHeartbeatAge() > HEARTBEAT_MAX_AGE_MS;
}

module.exports = {
	startHeartbeat,
	stopHeartbeat,
	isBrainHeartbeatStale,
	readHeartbeatAge,
	HEARTBEAT_FILE,
};
