/**
 * Team Mutex — Prevents Tôm Hùm Swarm and CC CLI Agent Teams from running simultaneously
 *
 * Problem: Swarm (11 daemons) + Agent Teams (4-9 sub-agents) = 20 processes fighting
 * Solution: File-based mutex. When Agent Teams active → Swarm pauses dispatching.
 *
 * Usage in brain-process-manager.js:
 *   if (teamMutex.isTeamActive()) { log('Agent Teams active — pausing'); return; }
 *
 * Usage when spawning Agent Teams:
 *   teamMutex.lockTeam('security_audit');
 *   // ... run agent team ...
 *   teamMutex.unlockTeam();
 */

const fs = require('fs');

const LOCK_FILE = '/tmp/tom_hum_team_active.lock';
const STALE_TIMEOUT_MS = 2 * 60 * 60 * 1000; // 2 hours max for any team

/**
 * Lock: Agent Team is now active
 */
function lockTeam(teamName = 'default') {
	const lockData = {
		team: teamName,
		pid: process.pid,
		startedAt: Date.now(),
		timestamp: new Date().toISOString(),
	};
	try {
		fs.writeFileSync(LOCK_FILE, JSON.stringify(lockData));
	} catch (e) {
		/* ignore */
	}
}

/**
 * Unlock: Agent Team finished
 */
function unlockTeam() {
	try {
		fs.unlinkSync(LOCK_FILE);
	} catch (e) {
		/* ignore */
	}
}

/**
 * Check if an Agent Team is currently active
 * Also cleans up stale locks (process died without unlocking)
 */
function isTeamActive() {
	try {
		if (!fs.existsSync(LOCK_FILE)) return false;

		const content = fs.readFileSync(LOCK_FILE, 'utf8');
		const lockData = JSON.parse(content);

		// Check if lock is stale (older than STALE_TIMEOUT_MS)
		if (Date.now() - lockData.startedAt > STALE_TIMEOUT_MS) {
			unlockTeam(); // Clean up stale lock
			return false;
		}

		// Check if the locking process is still alive
		try {
			process.kill(lockData.pid, 0); // Signal 0 = check if alive
			return true; // Process alive, team is active
		} catch (e) {
			// Process is dead — clean up stale lock
			unlockTeam();
			return false;
		}
	} catch (e) {
		return false; // Any error = assume no team active
	}
}

/**
 * Get info about the active team (for logging)
 */
function getActiveTeamInfo() {
	try {
		if (!fs.existsSync(LOCK_FILE)) return null;
		const content = fs.readFileSync(LOCK_FILE, 'utf8');
		return JSON.parse(content);
	} catch (e) {
		return null;
	}
}

module.exports = { lockTeam, unlockTeam, isTeamActive, getActiveTeamInfo, LOCK_FILE };
