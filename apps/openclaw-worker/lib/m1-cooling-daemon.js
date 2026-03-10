/**
 * M1 Cooling Daemon — Thermal protection + dispatch pause gate
 *
 * Monitors load average and free RAM every COOLING_INTERVAL_MS (90s).
 * When overheating: sets pause flag, kills resource hogs, purges caches.
 * Task queue and auto-CTO check isOverheating() before dispatching.
 *
 * Pre-dispatch gate (waitForSafeTemperature):
 *   Blocks until load < 7 AND free RAM > 300MB.
 *   Logs thermal status every 30s to ~/tom_hum_thermal.log.
 *
 * Thresholds:
 *   OVERHEAT: load > 7 OR free RAM < 50MB → pause dispatch
 *   SAFE:     load < 5 AND free RAM > 100MB → resume dispatch
 *   NOTE: macOS aggressively caches files in RAM, so Pages free is typically
 *         50-200MB even when healthy. Only trigger on truly critical levels.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const config = require('../config');
// Import log lazily to avoid circular dependency
let _log;
function log(msg) {
	if (!_log) _log = require('./brain-process-manager').log;
	_log(msg);
}

const THERMAL_LOG = config.THERMAL_LOG || '/Users/macbookprom1/tom_hum_thermal.log';
const OVERHEAT_LOAD = 120; // 🦞 M1 8-core chịu được 100+; 4 CC CLI agents = load 60-90 NORMAL
const OVERHEAT_RAM_MB = 30; // Lower threshold — macOS aggressively caches, 30MB is the true floor
const SAFE_LOAD = 80; // Resume at 80 — 4 agents running + buffer
const SAFE_RAM_MB = 100; // Safe resume level
const CRITICAL_LOAD = 150; // Nuclear intervention — only at extreme load (>150% 8-core)
const PROPORTIONAL_DELAY_MS = 2000; // 2s per load point (v4: faster feedback)
const COHERENCE_PENALTY_FACTOR = 1000; // 1s per subagent (v4: balanced)
// 🧬 FIX #4: THERMAL THRESHOLD — Raise from 5 to 8 (M1 8-core can handle load 8)
const MAINTENANCE_LOAD_THRESHOLD = 8; // Constant maintenance only when load > 8

let coolingCycle = 0;
let intervalRef = null;
let thermalLogRef = null;
let overheating = false;
let lastLoad = 0;
let lastLoadTime = Date.now();
const VELOCITY_THRESHOLD = 5.0; // 🔒 Chairman Fix v3: 5.0 tuned for Sub-5s response (Bug #13)

// --- System metrics ---

function getLoadAverage() {
	try {
		const raw = execSync('sysctl -n vm.loadavg 2>/dev/null', { encoding: 'utf-8', timeout: 5000 }).trim();
		const match = raw.match(/([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
		return match ? parseFloat(match[1]) : 0;
	} catch (e) {
		return 0;
	}
}

function getFreeRAM() {
	try {
		const raw = execSync('vm_stat 2>/dev/null | head -5', { encoding: 'utf-8', timeout: 5000 });
		const match = raw.match(/Pages free:\s+(\d+)/);
		return match ? Math.round((parseInt(match[1]) * 16384) / 1024 / 1024) : -1;
	} catch (e) {
		return -1;
	}
}

function hasThermalWarning() {
	try {
		const raw = execSync('pmset -g therm 2>/dev/null', { encoding: 'utf-8', timeout: 5000 });
		return raw.includes('CPU_Scheduler_Limit') || raw.includes('Speed_Limit');
	} catch (e) {
		return false;
	}
}

function getSubagentCount() {
	try {
		const raw = execSync('pgrep -c -f "claudekit|node" 2>/dev/null', { encoding: 'utf-8' }).trim();
		return parseInt(raw) || 0;
	} catch (e) {
		return 0;
	}
}

function getPowerSource() {
	try {
		const raw = execSync('pmset -g batt 2>/dev/null', { encoding: 'utf-8', timeout: 5000 });
		const isAC = raw.includes('AC Power') || raw.includes('AC attached');
		const match = raw.match(/(\d+)%/);
		const pct = match ? parseInt(match[1]) : -1;
		return { source: isAC ? 'AC' : 'BATTERY', pct };
	} catch (e) {
		return { source: 'UNKNOWN', pct: -1 };
	}
}

function getSwapUsage() {
	try {
		const raw = execSync('sysctl -n vm.swapusage 2>/dev/null', { encoding: 'utf-8', timeout: 5000 });
		const match = raw.match(/used\s+=\s+([\d.]+)M/);
		return match ? parseFloat(match[1]) : 0;
	} catch (e) {
		return 0;
	}
}

// --- Thermal logging (every 30s) ---

function logThermalStatus() {
	const load1 = getLoadAverage();
	const freeMB = getFreeRAM();
	const thermal = hasThermalWarning();
	const subagents = getSubagentCount();
	const power = getPowerSource();
	const swap = getSwapUsage();
	const emoji = overheating ? '🔴' : load1 > OVERHEAT_LOAD ? '🟡' : '🟢';
	const line = `[${new Date().toISOString()}] ${emoji} load=${load1} subagents=${subagents} ram=${freeMB}MB swap=${swap}M pwr=${power.source}(${power.pct}%) thermal=${thermal} paused=${overheating}\n`;
	try {
		fs.appendFileSync(THERMAL_LOG, line);
	} catch (e) {}
}

// --- Resource cleanup ---

const RESOURCE_HOGS = ['pyrefly', 'pyright', 'eslint_d', 'prettierd', 'rust-analyzer', 'solc', 'tailwind', 'ts-server', 'tsserver'];

function killResourceHogs() {
	// 🔒 Safety Fix: Only kill processes that are actually consuming high CPU
	// AND match the target list. Uses SIGTERM instead of SIGKILL.
	try {
		const output = execSync('ps -A -o pid,pcpu,command', { encoding: 'utf-8', timeout: 5000 });
		const lines = output.trim().split('\n').slice(1);
		const SELF_PID = process.pid;

		let killedCount = 0;

		for (const line of lines) {
			const parts = line.trim().split(/\s+/);
			if (parts.length < 3) continue;

			const pid = parseInt(parts[0], 10);
			const cpu = parseFloat(parts[1]);
			const cmd = parts.slice(2).join(' ');

			// 1. Safety: Never kill self or parent
			if (pid === SELF_PID || pid === process.ppid) continue;

			// 2. Safety: Only target specific tools
			const isTarget = RESOURCE_HOGS.some((hog) => cmd.includes(hog));
			if (!isTarget) continue;

			// 3. Safety: Don't kill unless actually hogging (>20% CPU)
			if (cpu < 20.0) continue;

			try {
				log(`Resource Monitor: High CPU (${cpu}%) detected on ${cmd.substring(0, 30)}... (PID ${pid})`);
				// Try gentle kill first
				process.kill(pid, 'SIGTERM');
				killedCount++;
			} catch (e) {
				log(`Failed to signal PID ${pid}: ${e.message}`);
			}
		}

		if (killedCount > 0) {
			log(`Resource Monitor: Sent SIGTERM to ${killedCount} processes to reduce load.`);
		}
	} catch (e) {
		// Ignore ps errors
	}
}

function purgeSystemCaches() {
	const cachePaths = ['~/Library/Caches/com.apple.dt.*', '~/Library/Caches/node*', '~/Library/Caches/typescript'];
	try {
		// Non-blocking background purge
		execSync(`rm -rf ${cachePaths.join(' ')} 2>/dev/null &`, { timeout: 2000 });
	} catch (e) {}
	try {
		// REMOVED sudo: avoid password block. Plain 'purge' works on macOS locally.
		execSync('purge 2>/dev/null &', { timeout: 2000 });
		log('Background RAM purge initiated');
	} catch (e) {}
}

// --- Overheat detection ---

function checkOverheatStatus() {
	const load1 = getLoadAverage();
	const freeMB = getFreeRAM();
	const thermal = hasThermalWarning();

	const now = Date.now();
	const timeDiff = (now - lastLoadTime) / 1000;
	const loadDiff = load1 - lastLoad;
	const velocity = timeDiff > 0 ? (loadDiff / timeDiff) * 30 : 0; // Load change per 30s

	lastLoad = load1;
	lastLoadTime = now;

	const subagents = getSubagentCount();
	const power = getPowerSource();
	// 🔒 Chairman Fix v2: velocity only triggers overheat IF load is also above SAFE threshold
	const velocityOverheat = velocity > VELOCITY_THRESHOLD && load1 > SAFE_LOAD;
	// 🦞 Battery Safety: If on battery and load > 25, trigger overheating to protect cell health
	const batteryRisk = power.source === 'BATTERY' && load1 > 25;

	// 🦞 FIX 2026-02-26: Prevent false overheating stall when load is 0 but RAM is temporarily low
	const ramCritical = freeMB >= 0 && freeMB < OVERHEAT_RAM_MB;
	// If we have literally 0 load and 0 subagents, memory compression is likely fine down to 50MB, don't stall.
	const isTrulyOverheated =
		load1 > OVERHEAT_LOAD ||
		(ramCritical && (subagents > 0 || load1 > 1.5 || freeMB < 50)) ||
		thermal ||
		velocityOverheat ||
		subagents > config.AGENT_TEAM_SIZE_DEFAULT * 4 ||
		batteryRisk;

	// Let it cool down much more easily if load is 0 and subagents is 0 (even if RAM is still slightly under OVERHEAT limit)
	const isSafe =
		load1 < SAFE_LOAD &&
		velocity < 0.2 &&
		subagents <= config.AGENT_TEAM_SIZE_DEFAULT &&
		(freeMB < 0 || freeMB >= 80 || (load1 === 0 && subagents === 0));

	// Hysteresis: only change state at clear thresholds
	if (isTrulyOverheated && !overheating) {
		overheating = true;
		const reason = batteryRisk
			? 'BATTERY PROTECTION'
			: load1 > OVERHEAT_LOAD
				? 'LOAD'
				: velocityOverheat
					? 'VELOCITY'
					: thermal
						? 'THERMAL HW'
						: 'RAM/SUBAGENTS';
		log(
			`OVERHEAT DETECTED (${reason}) — Load: ${load1} | Velocity: ${velocity.toFixed(2)} | Subagents: ${subagents} | RAM: ${freeMB}MB | Pwr: ${power.source} — PAUSING DISPATCH`,
		);
		killResourceHogs();
		purgeSystemCaches();
	} else if (isSafe && overheating) {
		overheating = false;
		log(`COOLED DOWN — Load: ${load1} | Velocity: ${velocity.toFixed(2)} | Subagents: ${subagents} — RESUMING DISPATCH`);
	}

	return { load1, freeMB, thermal, overheating, velocity, subagents };
}

// --- Public API ---

/** Returns true if system is overheating and dispatch should be paused */
function isOverheating() {
	return overheating;
}

/**
 * Pre-dispatch gate: blocks until load < 7 AND free RAM > 300MB.
 * Called before spawning each claude -p mission.
 * @returns {Promise<void>}
 */
async function waitForSafeTemperature() {
	const load1 = getLoadAverage();
	const freeMB = getFreeRAM();
	const subagents = getSubagentCount();

	// 1. Proportional Waiting + Multi-threaded Coherence Penalty (v3)
	if (load1 > SAFE_LOAD && !overheating) {
		// Base load delay + exponential penalty for many subagents
		const baseDelay = (load1 - SAFE_LOAD) * PROPORTIONAL_DELAY_MS;
		const penalty = subagents > 2 ? Math.pow(2, subagents) * COHERENCE_PENALTY_FACTOR : 0;
		const totalWait = Math.round(baseDelay + penalty);

		log(`THERMAL v3: Load ${load1} | Subagents ${subagents} -> Delaying dispatch ${totalWait / 1000}s...`);
		await new Promise((r) => setTimeout(r, totalWait));
	}

	// 2. Binary Blocking & Nuclear Purge
	if (overheating || load1 > OVERHEAT_LOAD || (freeMB >= 0 && freeMB < OVERHEAT_RAM_MB)) {
		log(`THERMAL STALL: Load ${load1} too high — performing NUCLEAR ANNIHILATION...`);
		killResourceHogs();
		try {
			execSync('purge 2>/dev/null &', { timeout: 2000 });
		} catch (e) {}

		// Non-recursive wait loop
		while (overheating) {
			log(`STILL STALLED: Waiting 15s (Load ${getLoadAverage()}, Subagents ${getSubagentCount()})...`);
			await new Promise((r) => setTimeout(r, 15000));
			checkOverheatStatus(); // Update state correctly
			killResourceHogs();
		}
	}

	// 3. Constant Maintenance — 🧬 FIX #4: Raised threshold from 5 to 8
	if (load1 > MAINTENANCE_LOAD_THRESHOLD || subagents > config.AGENT_TEAM_SIZE_DEFAULT) killResourceHogs();
}

/**
 * Preemptive Cooling before heavy missions (Hàn Băng Quyết v2)
 * @param {string} complexity
 */
async function preemptiveCool(complexity) {
	if (complexity !== 'complex') return;

	log(`PREEMPTIVE COOLING: Mission is 🔥LỬA — preparing thermal runway...`);
	killResourceHogs();
	purgeSystemCaches();

	// 🔒 Chairman Fix: M1 load 7-10 is NORMAL with active CC CLI. Old value 5 caused permanent PREEMPTIVE WAIT.
	const DEEP_SAFE_LOAD = 40;
	while (getLoadAverage() > DEEP_SAFE_LOAD) {
		const current = getLoadAverage();
		log(`PREEMPTIVE WAIT: Waiting for deep safe load < ${DEEP_SAFE_LOAD} (Current: ${current})`);
		await new Promise((r) => setTimeout(r, 10000));
		killResourceHogs();
	}
}

/**
 * Legacy gate for backward compatibility with task-queue.js
 * @returns {Promise<void>}
 */
async function pauseIfOverheating() {
	if (!overheating) return;
	log('THERMAL PAUSE — waiting for system to cool down...');
	while (overheating) {
		await new Promise((r) => setTimeout(r, 60000));
		checkOverheatStatus();
		if (overheating) {
			const load1 = getLoadAverage();
			const freeMB = getFreeRAM();
			log(`Still hot — Load: ${load1} | RAM: ${freeMB}MB — waiting 60s more`);
			killResourceHogs();
		}
	}
	log('THERMAL PAUSE LIFTED — dispatch resuming');
}

function startCooling() {
	// Main cooling cycle (every 90s)
	intervalRef = setInterval(() => {
		coolingCycle++;
		const { load1, freeMB } = checkOverheatStatus();
		const emoji = load1 > OVERHEAT_LOAD ? '🔴' : load1 > SAFE_LOAD ? '🟡' : '🟢';
		log(`COOLING #${coolingCycle} ${emoji} Load: ${load1} | RAM: ${freeMB}MB${overheating ? ' | PAUSED' : ''}`);
	}, config.COOLING_INTERVAL_MS);

	// Thermal log (every 30s)
	thermalLogRef = setInterval(logThermalStatus, 30000);
	logThermalStatus(); // Log immediately on start
}

function stopCooling() {
	if (intervalRef) {
		clearInterval(intervalRef);
		intervalRef = null;
	}
	if (thermalLogRef) {
		clearInterval(thermalLogRef);
		thermalLogRef = null;
	}
}

// 🧊 DEEP COOLING: Load-gate for scanner operations (npm build/test/lint)
const SCAN_SAFE_LOAD = 50; // Only allow scanning when load < 50 (balanced for M1)
function isSafeToScan() {
	const load = getLoadAverage();
	if (load > SCAN_SAFE_LOAD) {
		log(`🧊 SCAN BLOCKED: load ${load.toFixed(1)} > ${SCAN_SAFE_LOAD} — too hot for npm build/test`);
		return false;
	}
	return true;
}

module.exports = {
	startCooling,
	stopCooling,
	isOverheating,
	pauseIfOverheating,
	waitForSafeTemperature,
	preemptiveCool,
	getLoadAverage,
	isSafeToScan,
};
