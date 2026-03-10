/**
 * API Rate Gate — File-based lock to prevent proxy overload
 *
 * Problem: 11 daemons calling proxy simultaneously → crash
 * Solution: File lock with min gap between API calls
 *
 * Usage:
 *   const gate = require('./lib/api-rate-gate');
 *   await gate.acquire();  // blocks until safe to call API
 *   // ... make API call ...
 */

const fs = require('fs');
const config = require('../config');

const LOCK_FILE = '/tmp/tom_hum_api.lock';
const MIN_GAP_MS = config.API_RATE_GATE_MS || 5000;
const MAX_WAIT_MS = 60000; // Max 60s wait before giving up
const POLL_MS = 500;

/**
 * Read last API call timestamp from lock file
 */
function getLastCallTime() {
	try {
		if (fs.existsSync(LOCK_FILE)) {
			const content = fs.readFileSync(LOCK_FILE, 'utf8').trim();
			const ts = parseInt(content, 10);
			return isNaN(ts) ? 0 : ts;
		}
	} catch (e) {
		/* ignore read errors */
	}
	return 0;
}

/**
 * Write current timestamp to lock file (atomic via rename)
 */
function stampLock() {
	const tmpFile = LOCK_FILE + '.tmp.' + process.pid;
	try {
		fs.writeFileSync(tmpFile, String(Date.now()));
		fs.renameSync(tmpFile, LOCK_FILE);
	} catch (e) {
		try {
			fs.writeFileSync(LOCK_FILE, String(Date.now()));
		} catch (e2) {
			/* ignore */
		}
		try {
			fs.unlinkSync(tmpFile);
		} catch (e3) {
			/* ignore */
		}
	}
}

/**
 * Acquire the rate gate — waits until MIN_GAP_MS has passed since last API call.
 * Returns true if acquired, false if timed out.
 */
async function acquire() {
	const startWait = Date.now();

	while (true) {
		const lastCall = getLastCallTime();
		const elapsed = Date.now() - lastCall;

		if (elapsed >= MIN_GAP_MS) {
			stampLock();
			return true;
		}

		if (Date.now() - startWait > MAX_WAIT_MS) {
			stampLock();
			return false;
		}

		const waitMs = Math.min(MIN_GAP_MS - elapsed + 100, POLL_MS);
		await new Promise((resolve) => setTimeout(resolve, waitMs));
	}
}

/**
 * Check if gate is available without blocking
 */
function isAvailable() {
	const lastCall = getLastCallTime();
	return Date.now() - lastCall >= MIN_GAP_MS;
}

/**
 * Reset the lock (for testing or manual override)
 */
function reset() {
	try {
		fs.unlinkSync(LOCK_FILE);
	} catch (e) {
		/* ignore */
	}
}

module.exports = { acquire, isAvailable, reset, LOCK_FILE };
