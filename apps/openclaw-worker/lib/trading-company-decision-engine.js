/**
 * Trading Company Decision Engine — 3-Tier Auto/Escalate/Halt
 *
 * Reads reports from CC CLI /trading:* commands, extracts KPIs,
 * and decides next action: CONTINUE | AUTO_FIX | ESCALATE | HALT.
 *
 * Integrates with auto-cto-pilot.js to generate trading missions
 * based on schedule config at apps/algo-trader/config/trading-company-autonomous-schedule.json
 *
 * @module trading-company-decision-engine
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
	/* fallback to console.log */
}

// ─── CONSTANTS ──────────────────────────────────────────────────

const ALGO_TRADER_DIR = path.join(config.MEKONG_DIR, 'apps/algo-trader');
const SCHEDULE_FILE = path.join(ALGO_TRADER_DIR, 'config/trading-company-autonomous-schedule.json');
const REPORTS_DIR = path.join(ALGO_TRADER_DIR, 'plans/reports');

const DEFAULT_THRESHOLDS = {
	halt_drawdown: 0.2,
	halt_cb_count: 3,
	escalate_capital_change: 0.1,
	auto_fix_weight_drift: 0.05,
	auto_fix_fee_ratio: 0.2,
};

// ─── REPORT PARSING ─────────────────────────────────────────────

const REPORT_PATTERNS = {
	red_flags: /🔴|CRITICAL|P0|HALT|EMERGENCY/gi,
	warnings: /🟡|WARNING|DEGRADED/gi,
	greens: /🟢|PASS|OK|HEALTHY/gi,
	errors: /❌|FAIL|ERROR/gi,
	drawdown: /(?:Max DD|drawdown|Drawdown).*?(\d+\.?\d*)%/i,
	winrate: /(?:Win rate|Win%).*?(\d+\.?\d*)%/i,
	pnl: /(?:Net P&L|P&L).*?\$([0-9,.]+)/i,
	fee_ratio: /(?:Fee.*?ratio|Fee\/Profit).*?(\d+\.?\d*)%/i,
	cb_triggers: /(?:CB|Circuit breaker).*?(\d+)\s*(?:trigger|active|open)/i,
	score: /(?:Score|Total).*?(\d+)\/(\d+)/i,
};

/**
 * Parse a report file and extract key metrics.
 * @param {string} content - Report content
 * @returns {object} Parsed metrics
 */
function parseReport(content) {
	if (!content) return { healthy: false, red_flags: 0, errors: 0 };

	const red_flags = (content.match(REPORT_PATTERNS.red_flags) || []).length;
	const warnings = (content.match(REPORT_PATTERNS.warnings) || []).length;
	const greens = (content.match(REPORT_PATTERNS.greens) || []).length;
	const errors = (content.match(REPORT_PATTERNS.errors) || []).length;

	const drawdownMatch = content.match(REPORT_PATTERNS.drawdown);
	const winrateMatch = content.match(REPORT_PATTERNS.winrate);
	const feeRatioMatch = content.match(REPORT_PATTERNS.fee_ratio);
	const cbMatch = content.match(REPORT_PATTERNS.cb_triggers);
	const scoreMatch = content.match(REPORT_PATTERNS.score);

	return {
		healthy: red_flags === 0 && errors === 0,
		red_flags,
		warnings,
		greens,
		errors,
		drawdown: drawdownMatch ? parseFloat(drawdownMatch[1]) / 100 : null,
		winrate: winrateMatch ? parseFloat(winrateMatch[1]) / 100 : null,
		fee_ratio: feeRatioMatch ? parseFloat(feeRatioMatch[1]) / 100 : null,
		cb_triggers: cbMatch ? parseInt(cbMatch[1]) : 0,
		score: scoreMatch ? { current: parseInt(scoreMatch[1]), max: parseInt(scoreMatch[2]) } : null,
		needs_action: red_flags > 0 || errors > 0,
		needs_escalation: red_flags > 3 || errors > 5,
	};
}

// ─── DECISION ENGINE ────────────────────────────────────────────

/**
 * 3-Tier decision: CONTINUE | AUTO_FIX | ESCALATE | HALT
 * @param {object} metrics - Parsed report metrics
 * @param {object} thresholds - Decision thresholds
 * @returns {{ action: string, reason: string, cmd?: string }}
 */
function decide(metrics, thresholds = DEFAULT_THRESHOLDS) {
	// TIER 3: HALT — immediate stop
	if (metrics.drawdown !== null && metrics.drawdown > thresholds.halt_drawdown) {
		return {
			action: 'HALT',
			reason: `Drawdown ${(metrics.drawdown * 100).toFixed(1)}% > ${thresholds.halt_drawdown * 100}% threshold`,
			cmd: '/trading:founder:emergency red',
		};
	}

	if (metrics.cb_triggers >= thresholds.halt_cb_count) {
		return {
			action: 'HALT',
			reason: `${metrics.cb_triggers} circuit breakers triggered (threshold: ${thresholds.halt_cb_count})`,
			cmd: '/trading:coo:incident P0',
		};
	}

	if (metrics.red_flags > 5) {
		return {
			action: 'HALT',
			reason: `${metrics.red_flags} red flags detected — system critically unhealthy`,
			cmd: '/trading:coo:incident P0',
		};
	}

	// TIER 3: ESCALATE — chairman approval needed
	if (metrics.needs_escalation) {
		return {
			action: 'ESCALATE',
			reason: `${metrics.red_flags} red flags, ${metrics.errors} errors — needs Chairman review`,
		};
	}

	// TIER 2: AUTO_FIX — fix small issues
	if (metrics.fee_ratio !== null && metrics.fee_ratio > thresholds.auto_fix_fee_ratio) {
		return {
			action: 'AUTO_FIX',
			reason: `Fee ratio ${(metrics.fee_ratio * 100).toFixed(1)}% > ${thresholds.auto_fix_fee_ratio * 100}%`,
			cmd: '/trading:fin-analyst costs',
		};
	}

	if (metrics.errors > 0 && metrics.errors <= 5) {
		return {
			action: 'AUTO_FIX',
			reason: `${metrics.errors} errors found — auto-fixing`,
			cmd: '/trading:backend quality',
		};
	}

	if (metrics.warnings > 3) {
		return {
			action: 'AUTO_FIX',
			reason: `${metrics.warnings} warnings — investigating`,
			cmd: '/trading:sre monitor',
		};
	}

	// TIER 1: CONTINUE — all clear
	return {
		action: 'CONTINUE',
		reason: metrics.healthy ? 'All systems healthy' : `${metrics.greens} green, ${metrics.warnings} warnings — acceptable`,
	};
}

// ─── SCHEDULE LOADER ────────────────────────────────────────────

/**
 * Load trading schedule config.
 * @returns {object|null} Schedule config or null if not found
 */
function loadSchedule() {
	try {
		if (fs.existsSync(SCHEDULE_FILE)) {
			return JSON.parse(fs.readFileSync(SCHEDULE_FILE, 'utf-8'));
		}
	} catch (e) {
		log(`[TRADING-ENGINE] Failed to load schedule: ${e.message}`);
	}
	return null;
}

/**
 * Get missions for a given cadence.
 * @param {string} cadence - 'hourly'|'daily'|'weekly'|'monthly'|'quarterly'
 * @returns {Array} List of mission objects
 */
function getMissionsForCadence(cadence) {
	const schedule = loadSchedule();
	if (!schedule) return [];

	const cadenceMap = {
		hourly: 'hourly-health',
		'every-4h': 'every-4h-trading',
		daily: 'daily-ops',
		weekly: 'weekly-review',
		'weekly-deep': 'weekly-deep',
		monthly: 'monthly-full',
		quarterly: 'quarterly-strategic',
	};

	const scheduleId = cadenceMap[cadence];
	const entry = schedule.schedules.find((s) => s.id === scheduleId && s.enabled !== false);
	return entry ? entry.missions : [];
}

/**
 * Build a mission file content for a trading role.
 * @param {string} role - Role name (e.g., 'coo')
 * @param {string} action - Action (e.g., 'health')
 * @param {object} options - { timeout, tier }
 * @returns {string} Mission file content
 */
function buildTradingMission(role, action, options = {}) {
	const timeout = options.timeout || 'MEDIUM';
	const tier = options.tier || 'AUTO';
	const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

	return `algo-trader: /trading:${role} ${action}\n\nTimeout: ${timeout}\nTier: ${tier}\nGenerated: ${date}\nSource: trading-company-decision-engine`;
}

/**
 * Read the latest report for a role/action combination.
 * @param {string} role - Role name
 * @param {string} action - Action name
 * @returns {string|null} Report content or null
 */
function readLatestReport(role, action) {
	try {
		if (!fs.existsSync(REPORTS_DIR)) return null;

		const files = fs
			.readdirSync(REPORTS_DIR)
			.filter((f) => f.includes(role) && f.includes(action) && f.endsWith('.md'))
			.sort()
			.reverse();

		if (files.length === 0) return null;
		return fs.readFileSync(path.join(REPORTS_DIR, files[0]), 'utf-8');
	} catch (e) {
		return null;
	}
}

// ─── EXPORTS ────────────────────────────────────────────────────

module.exports = {
	parseReport,
	decide,
	loadSchedule,
	getMissionsForCadence,
	buildTradingMission,
	readLatestReport,
	DEFAULT_THRESHOLDS,
	REPORT_PATTERNS,
};
