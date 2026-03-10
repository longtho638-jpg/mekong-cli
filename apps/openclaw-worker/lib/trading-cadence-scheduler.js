/**
 * Trading Cadence Scheduler — Autonomous Trading Company Schedule Runner
 *
 * Determines which trading missions should run based on time-since-last-run.
 * Integrates with trading-company-decision-engine.js for mission generation.
 *
 * Cadences: hourly | every-4h | daily | weekly | weekly-deep | monthly | quarterly
 *
 * @module trading-cadence-scheduler
 * @version 1.0.0
 * @created 2026-03-03
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

// Safe logger
let log = console.log;
try {
	const bpm = require('./brain-process-manager');
	if (bpm.log) log = bpm.log;
} catch (e) {
	/* fallback */
}

// ─── CONSTANTS ──────────────────────────────────────────────────

const STATE_FILE = path.join(__dirname, '..', '.trading-cadence-state.json');
// Cadence intervals in milliseconds
const CADENCE_INTERVALS = {
	'hourly-health': 60 * 60 * 1000, // 1h
	'every-4h-trading': 4 * 60 * 60 * 1000, // 4h
	'daily-ops': 24 * 60 * 60 * 1000, // 24h
	'weekly-review': 7 * 24 * 60 * 60 * 1000, // 7d
	'weekly-deep': 7 * 24 * 60 * 60 * 1000, // 7d
	'monthly-full': 30 * 24 * 60 * 60 * 1000, // 30d
	'quarterly-strategic': 90 * 24 * 60 * 60 * 1000, // 90d
};

// Max missions per tick to prevent flooding
const MAX_MISSIONS_PER_TICK = 3;

// Cooldown between cadence scheduler runs (5 min)
const SCHEDULER_COOLDOWN_MS = 5 * 60 * 1000;

// ─── STATE MANAGEMENT ───────────────────────────────────────────

function loadCadenceState() {
	try {
		if (fs.existsSync(STATE_FILE)) {
			return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
		}
	} catch (e) {
		log(`[TRADING-CADENCE] State load error: ${e.message}`);
	}
	return { lastRun: {}, lastSchedulerTick: 0 };
}

function saveCadenceState(state) {
	try {
		const tmp = `${STATE_FILE}.tmp`;
		fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
		fs.renameSync(tmp, STATE_FILE);
	} catch (e) {
		log(`[TRADING-CADENCE] State save error: ${e.message}`);
	}
}

// ─── SCHEDULE LOADING ───────────────────────────────────────────

let _scheduleCache = null;
let _scheduleCacheTime = 0;

function loadSchedule() {
	// Cache for 5 min
	if (_scheduleCache && Date.now() - _scheduleCacheTime < 300000) return _scheduleCache;

	let engine;
	try {
		engine = require('./trading-company-decision-engine');
	} catch (e) {
		log(`[TRADING-CADENCE] Decision engine not found: ${e.message}`);
		return null;
	}

	const schedule = engine.loadSchedule();
	if (schedule) {
		_scheduleCache = schedule;
		_scheduleCacheTime = Date.now();
	}
	return schedule;
}

// ─── CADENCE CHECK ──────────────────────────────────────────────

/**
 * Check which cadences are due and return missions to dispatch.
 * @returns {{ missions: Array<{role:string, action:string, timeout:string, tier:string, cadenceId:string}>, cadenceIds: string[] }}
 */
function getDueTradingMissions() {
	const state = loadCadenceState();
	const now = Date.now();

	// Scheduler cooldown — don't check too frequently
	if (now - (state.lastSchedulerTick || 0) < SCHEDULER_COOLDOWN_MS) {
		return { missions: [], cadenceIds: [] };
	}

	const schedule = loadSchedule();
	if (!schedule || !schedule.schedules) {
		return { missions: [], cadenceIds: [] };
	}

	state.lastSchedulerTick = now;

	const dueMissions = [];
	const dueCadenceIds = [];

	for (const entry of schedule.schedules) {
		if (entry.enabled === false) continue;

		const interval = CADENCE_INTERVALS[entry.id];
		if (!interval) continue;

		const lastRun = state.lastRun[entry.id] || 0;
		const elapsed = now - lastRun;

		if (elapsed >= interval) {
			log(
				`[TRADING-CADENCE] ${entry.id} is DUE (last: ${lastRun ? new Date(lastRun).toLocaleString() : 'never'}, interval: ${Math.round(interval / 3600000)}h)`,
			);

			for (const mission of entry.missions) {
				dueMissions.push({
					...mission,
					cadenceId: entry.id,
				});
			}
			dueCadenceIds.push(entry.id);

			// Mark as run
			state.lastRun[entry.id] = now;
		}
	}

	saveCadenceState(state);

	// Limit missions per tick
	const limited = dueMissions.slice(0, MAX_MISSIONS_PER_TICK);
	if (dueMissions.length > MAX_MISSIONS_PER_TICK) {
		log(`[TRADING-CADENCE] Throttled: ${dueMissions.length} → ${MAX_MISSIONS_PER_TICK} missions this tick`);
	}

	return { missions: limited, cadenceIds: dueCadenceIds };
}

/**
 * Build a mission file from a trading cadence mission.
 * @param {object} mission - { role, action, timeout, tier, cadenceId }
 * @returns {{ filename: string, content: string }}
 */
function buildTradingMissionFile(mission) {
	const { role, action, timeout, tier, cadenceId } = mission;
	const ts = Date.now();

	// Map timeout to config timeout tier
	const timeoutMap = {
		SIMPLE: 'SIMPLE',
		MEDIUM: 'MEDIUM',
		COMPLEX: 'COMPLEX',
		STRATEGIC: 'STRATEGIC',
	};
	const timeoutTier = timeoutMap[timeout] || 'MEDIUM';

	// Priority based on tier
	const priorityMap = {
		AUTO: 'MEDIUM',
		AUTO_FIX: 'HIGH',
		REPORT: 'MEDIUM',
		ESCALATE: 'HIGH',
	};
	const priority = priorityMap[tier] || 'MEDIUM';

	const filename = `${priority}_mission_algo_trader_trading_${role}_${action}_${ts}.txt`;

	// Build the /trading:* command
	let command;
	if (role === 'all') {
		command = `/trading:all ${action}`;
	} else {
		command = `/trading:${role} ${action}`;
	}

	const content =
		`algo-trader: ${command}\n\n` +
		`Trả lời bằng TIẾNG VIỆT. ` +
		`Chạy trading command: ${command}. ` +
		`Cadence: ${cadenceId} | Timeout: ${timeoutTier} | Tier: ${tier}. ` +
		`Lưu report vào plans/reports/. ` +
		`CRITICAL: DO NOT run git commit, git push, or /check-and-commit.`;

	return { filename, content };
}

/**
 * Check if algo-trader project is current and dispatch due trading missions.
 * Called from auto-cto-pilot.js handleScan() when project is GREEN.
 *
 * @returns {number} Number of missions dispatched
 */
function dispatchDueTradingMissions() {
	const { missions, cadenceIds } = getDueTradingMissions();

	if (missions.length === 0) return 0;

	let dispatched = 0;
	for (const mission of missions) {
		const { filename, content } = buildTradingMissionFile(mission);
		const filePath = path.join(config.WATCH_DIR, filename);

		try {
			fs.writeFileSync(filePath, content);
			log(`[TRADING-CADENCE] Dispatched: /trading:${mission.role} ${mission.action} → ${filename}`);
			dispatched++;
		} catch (e) {
			log(`[TRADING-CADENCE] Write failed: ${e.message}`);
		}
	}

	if (dispatched > 0) {
		log(`[TRADING-CADENCE] ${dispatched} trading mission(s) dispatched for cadences: ${cadenceIds.join(', ')}`);
	}

	return dispatched;
}

/**
 * Check if a task file is a trading mission.
 * @param {string} taskContent - Raw task content
 * @returns {boolean}
 */
function isTradingMission(taskContent) {
	return /\/trading:[a-z-]+/i.test(taskContent || '');
}

// ─── EXPORTS ────────────────────────────────────────────────────

module.exports = {
	getDueTradingMissions,
	buildTradingMissionFile,
	dispatchDueTradingMissions,
	isTradingMission,
	loadCadenceState,
};
