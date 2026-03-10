/**
 * Resource Governor — RAM/CPU monitoring with tiered daemon killing
 *
 * Problem: M1 16GB overloaded when 11 daemons + 9 Agent Teams run
 * Solution: Monitor system load and kill low-priority daemons when needed
 *
 * Kill Tiers (order when overloaded):
 *   Tier 3 (kill first): artist, scribe, diplomat
 *   Tier 2: merchant, sage
 *   Tier 1 (keep alive): hunter, builder, dispatcher, reviewer, operator, architect
 */

const { execSync } = require('child_process');
const fs = require('fs');

const PID_DIR = '/tmp/tom_hum_pids';

// Kill priority: highest index = killed first
const KILL_TIERS = [
	// Tier 1 — Essential (never auto-kill)
	['hunter', 'builder', 'dispatcher', 'reviewer', 'operator', 'architect'],
	// Tier 2 — Important (kill if RAM > 90%)
	['merchant', 'sage'],
	// Tier 3 — Nice-to-have (kill if RAM > 80%)
	['artist', 'scribe', 'diplomat'],
];

/**
 * Get current system memory usage percentage (macOS)
 */
function getMemoryUsagePercent() {
	try {
		const output = execSync('vm_stat', { encoding: 'utf8', timeout: 5000 });
		const pageSize = 16384; // M1 page size
		const freeMatch = output.match(/Pages free:\s+(\d+)/);
		const activeMatch = output.match(/Pages active:\s+(\d+)/);
		const inactiveMatch = output.match(/Pages inactive:\s+(\d+)/);
		const wiredMatch = output.match(/Pages wired down:\s+(\d+)/);
		const compressedMatch = output.match(/Pages occupied by compressor:\s+(\d+)/);

		if (!freeMatch || !activeMatch) return 50; // Safe default

		const free = parseInt(freeMatch[1]) * pageSize;
		const active = parseInt(activeMatch[1]) * pageSize;
		const inactive = parseInt(inactiveMatch?.[1] || '0') * pageSize;
		const wired = parseInt(wiredMatch?.[1] || '0') * pageSize;
		const compressed = parseInt(compressedMatch?.[1] || '0') * pageSize;

		const total = free + active + inactive + wired + compressed;
		const used = active + wired + compressed;

		return Math.round((used / total) * 100);
	} catch (e) {
		return 50; // Safe default on error
	}
}

/**
 * Get current CPU load average (1 minute)
 */
function getLoadAverage() {
	try {
		const output = execSync('sysctl -n vm.loadavg', { encoding: 'utf8', timeout: 5000 });
		const match = output.match(/([\d.]+)/);
		return match ? parseFloat(match[1]) : 2.0;
	} catch (e) {
		return 2.0; // Safe default
	}
}

/**
 * Kill a daemon by name (using PID file)
 */
function killDaemon(name) {
	const pidFile = `${PID_DIR}/${name}.pid`;
	try {
		if (fs.existsSync(pidFile)) {
			const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim());
			if (!isNaN(pid)) {
				process.kill(pid, 'SIGTERM');
				fs.unlinkSync(pidFile);
				return true;
			}
		}
	} catch (e) {
		/* process may already be dead */
	}
	return false;
}

/**
 * Evaluate system health and take action if needed
 * Returns: { ramPercent, load, action, killed[] }
 */
function evaluate() {
	const ramPercent = getMemoryUsagePercent();
	const load = getLoadAverage();
	const result = { ramPercent, load, action: 'none', killed: [] };

	if (ramPercent > 90) {
		// CRITICAL: Kill Tier 3 + Tier 2
		result.action = 'critical_kill';
		for (const tier of [KILL_TIERS[2], KILL_TIERS[1]]) {
			for (const daemon of tier) {
				if (killDaemon(daemon)) {
					result.killed.push(daemon);
				}
			}
		}
	} else if (ramPercent > 80) {
		// WARNING: Kill Tier 3 only
		result.action = 'warning_kill';
		for (const daemon of KILL_TIERS[2]) {
			if (killDaemon(daemon)) {
				result.killed.push(daemon);
			}
		}
	}

	return result;
}

/**
 * Check if it's safe to spawn more processes
 */
function canSpawn() {
	const ramPercent = getMemoryUsagePercent();
	return ramPercent < 75;
}

module.exports = { evaluate, canSpawn, getMemoryUsagePercent, getLoadAverage, KILL_TIERS };
