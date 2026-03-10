/**
 * cto-ram-policy.js
 * RAM-based worker budget policy for M1 16GB.
 *
 * freeRAM >= 4GB  → max 3 workers
 * freeRAM 2-4GB  → max 2 workers (skip P3)
 * freeRAM 1-2GB  → max 1 worker  (only P1)
 * freeRAM < 1GB  → 0 workers, emergency cool
 */

'use strict';

const { execSync } = require('child_process');

/**
 * Get free RAM in MB using macOS `top`.
 * Falls back to 8192 (8GB) on parse failure to avoid blocking all workers.
 * @returns {number} free RAM in MB
 */
function getFreeRamMB() {
	try {
		// `top -l 1 -s 0` is fast (no delay), PhysMem line: "PhysMem: 11G used (1894M wired), 4869M unused."
		const out = execSync('top -l 1 -s 0 | grep PhysMem', {
			encoding: 'utf-8',
			timeout: 5000,
		}).trim();

		// Parse "unused" figure — may be in GB or MB
		const unusedMatch = out.match(/(\d+(?:\.\d+)?)(G|M)\s+unused/i);
		if (unusedMatch) {
			const val = parseFloat(unusedMatch[1]);
			const unit = unusedMatch[2].toUpperCase();
			return unit === 'G' ? Math.round(val * 1024) : Math.round(val);
		}
	} catch {
		/* parse failure → safe fallback */
	}
	return 8192; // safe fallback: assume 8GB free
}

/**
 * Determine max allowed workers based on current free RAM.
 * @returns {{ maxWorkers: number, freeRamMB: number, emergency: boolean }}
 */
function getRamPolicy() {
	const freeRamMB = getFreeRamMB();
	const freeRamGB = freeRamMB / 1024;

	let maxWorkers;
	let emergency = false;

	if (freeRamGB >= 4) {
		maxWorkers = 3;
	} else if (freeRamGB >= 2) {
		maxWorkers = 2;
	} else if (freeRamGB >= 1) {
		maxWorkers = 1;
	} else {
		maxWorkers = 0;
		emergency = true;
	}

	return { maxWorkers, freeRamMB, emergency };
}

/**
 * Check if dispatch is allowed for the given pane.
 * Worker slots: P1=slot1, P2=slot2, P3=slot3.
 * Policy skips higher-numbered panes when RAM is constrained.
 *
 * @param {number} paneIdx - 1-based pane index
 * @param {Function} log - logger function
 * @returns {boolean} true if dispatch is allowed
 */
function isDispatchAllowed(paneIdx, log) {
	const { maxWorkers, freeRamMB, emergency } = getRamPolicy();

	if (emergency) {
		log(`RAM-POLICY: EMERGENCY (free=${freeRamMB}MB < 1GB) — blocking ALL dispatches`);
		return false;
	}

	// Worker slot mapping: P1→slot1, P2→slot2, P3→slot3
	// paneIdx 1 = slot 1, paneIdx 2 = slot 2, paneIdx 3 = slot 3
	const slot = paneIdx; // 1-indexed, matches directly
	if (slot > maxWorkers) {
		log(`RAM-POLICY: free=${Math.round(freeRamMB)}MB → max ${maxWorkers} workers — P${paneIdx} (slot${slot}) BLOCKED`);
		return false;
	}

	return true;
}

module.exports = { getFreeRamMB, getRamPolicy, isDispatchAllowed };
