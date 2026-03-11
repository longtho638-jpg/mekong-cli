/**
 * Quan Luat Enforcer — Runtime enforcement for the Tôm Hùm barracks
 *
 * Applies 9 Rules of Military Order at runtime:
 * - Signal Protocol standardization
 * - Territory guard (daemon overlap prevention)
 * - Token budget validation
 * - Queue discipline enforcement
 * - Log mandate (auto-tag rank + daemon name)
 *
 * @module quan-luat-enforcer
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

// ═══════════════════════════════════════════════════════════════
// Rule 1: OBEY THE COMMANDER — Chain of Command
// ═══════════════════════════════════════════════════════════════

const CHAIN_OF_COMMAND = {
	CHU_SOAI: 'antigravity', // 👑 Supreme Commander
	QUAN_SU: 'brain-process-manager', // 🧠 Chief Strategist
	TUONG: ['pane_0', 'pane_1'], // ⚔️ Generals (CC CLI Panes)
	QUAN: [
		// 🐾 Soldiers (Daemons)
		'hunter',
		'builder',
		'dispatcher',
		'reviewer',
		'artist',
		'architect',
		'diplomat',
		'merchant',
		'operator',
		'sage',
		'scribe',
	],
};

// ═══════════════════════════════════════════════════════════════
// Rule 2: TRANSPARENT REPORTING — Signal Protocol
// ═══════════════════════════════════════════════════════════════

const SIGNAL_TYPES = {
	BUG_REPORT: 'BUG_REPORT',
	REVIEW_REQUEST: 'REVIEW_REQUEST',
	HEALTH_ALERT: 'HEALTH_ALERT',
	INTEL: 'INTEL',
	CLEANUP_DONE: 'CLEANUP_DONE',
	MISSION_READY: 'MISSION_READY',
	DOCS_OUTDATED: 'DOCS_OUTDATED',
	UI_ISSUE: 'UI_ISSUE',
	ARCH_ISSUE: 'ARCH_ISSUE',
	REVENUE_ALERT: 'REVENUE_ALERT',
	MEMORY_UPDATED: 'MEMORY_UPDATED',
};

const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Create a standard pheromone signal per Rule 2 of Military Order
 */
function createSignal(from, to, type, payload, priority = 'MEDIUM') {
	if (!CHAIN_OF_COMMAND.QUAN.includes(from.replace('agent_', ''))) {
		console.error(`[QUAN_LUAT] ⚠️ Unknown agent: ${from}`);
	}
	if (!SIGNAL_TYPES[type]) {
		console.error(`[QUAN_LUAT] ⚠️ Unknown signal type: ${type}`);
	}
	if (!PRIORITY_LEVELS.includes(priority)) {
		priority = 'MEDIUM';
	}

	const signal = {
		id: `sig_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
		timestamp: Date.now(),
		from: from.startsWith('agent_') ? from : `agent_${from}`,
		to,
		type,
		priority,
		payload,
		rank: RANKS[from.replace('agent_', '')] || 'UNKNOWN',
	};

	// Write to signal log (Rule 8: Unbroken Communications)
	try {
		const logLine = `[${new Date().toISOString().slice(11, 19)}] [${signal.rank}] [${signal.from}] → [${signal.to}] ${signal.type} (${signal.priority}): ${JSON.stringify(signal.payload).slice(0, 200)}\n`;
		const signalLog = path.join(process.env.HOME || '/tmp', 'tom_hum_signals.log');
		fs.appendFileSync(signalLog, logLine);
	} catch (e) {
		// Signal log failure should not crash daemon
	}

	return signal;
}

// ═══════════════════════════════════════════════════════════════
// Rule 3: CLEAR TERRITORIAL BOUNDARIES — Territory
// ═══════════════════════════════════════════════════════════════

const TERRITORIES = {
	hunter: { domain: 'code_scanning', actions: ['scan', 'detect', 'verify'] },
	builder: { domain: 'tech_debt', actions: ['cleanup', 'refactor', 'fix'] },
	dispatcher: { domain: 'queue_management', actions: ['sort', 'prioritize', 'route'] },
	reviewer: { domain: 'code_quality', actions: ['audit', 'rate', 'report'] },
	artist: { domain: 'ui_ux', actions: ['screenshot', 'analyze_css', 'design'] },
	architect: { domain: 'system_design', actions: ['map_structure', 'detect_deps', 'plan'] },
	diplomat: { domain: 'documentation', actions: ['scan_docs', 'update_docs', 'changelog'] },
	merchant: { domain: 'revenue', actions: ['track_payment', 'report_revenue', 'alert_churn'] },
	operator: { domain: 'system_health', actions: ['health_check', 'process_mgmt', 'disk_check'] },
	sage: { domain: 'knowledge', actions: ['vectorize', 'synthesize', 'query'] },
	scribe: { domain: 'memory', actions: ['log_summary', 'memory_write', 'rotate_logs'] },
};

/**
 * Check whether a daemon is violating another daemon's territory
 * Rule 3: FORBIDDEN to encroach on another daemon's territory
 */
function checkTerritory(daemonName, action) {
	const territory = TERRITORIES[daemonName];
	if (!territory) {
		logQuanLuat(daemonName, `⚠️ Unknown daemon, no territory assigned`);
		return false;
	}
	if (!territory.actions.includes(action)) {
		logQuanLuat(daemonName, `🚫 TERRITORY VIOLATION: "${action}" not in [${territory.actions.join(', ')}]`);
		return false;
	}
	return true;
}

// ═══════════════════════════════════════════════════════════════
// Rule 4: CONSERVE SUPPLIES — Token Budget
// ═══════════════════════════════════════════════════════════════

const TOKEN_BUDGETS = {
	FREE: {
		models: ['gemini-2.5-flash', 'moonshotai/kimi-k2.5'],
		maxTokensPerCall: 2000,
		tier: 'QUAN', // Soldiers
	},
	PREMIUM: {
		models: ['claude-sonnet-4-5', 'claude-opus-4-6'],
		maxTokensPerCall: 200000,
		tier: 'TUONG', // Generals
	},
	SUPREME: {
		models: ['gemini-2.5-pro', 'claude-opus-4-6-thinking'],
		maxTokensPerCall: 500000,
		tier: 'CHU_SOAI', // Supreme Commander
	},
};

/**
 * Validate model is the correct tier (Rule 4)
 * Daemon (QUAN/soldiers) may only use FREE models
 */
function validateModelTier(daemonName, model) {
	const isQuan = CHAIN_OF_COMMAND.QUAN.includes(daemonName);
	if (isQuan) {
		if (!TOKEN_BUDGETS.FREE.models.includes(model)) {
			logQuanLuat(daemonName, `🚫 TOKEN BUDGET VIOLATION: "${model}" is PREMIUM/SUPREME — soldiers may only use FREE models`);
			return false;
		}
	}
	return true;
}

// ═══════════════════════════════════════════════════════════════
// Rule 5: CLEAN BARRACKS — Clean Camp
// ═══════════════════════════════════════════════════════════════

const QUEUE_LIMITS = {
	maxQueueSize: 3, // Per daemon type
	maxTotalPending: 15, // Across all daemons
	processedRetention: 24 * 60 * 60 * 1000, // 24h in ms
};

/**
 * Check queue discipline before creating a new mission
 */
function checkQueueDiscipline(daemonName) {
	try {
		const tasksDir = config.WATCH_DIR;
		if (!fs.existsSync(tasksDir)) return true;

		const pending = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.txt') && f.includes(daemonName));

		if (pending.length >= QUEUE_LIMITS.maxQueueSize) {
			logQuanLuat(daemonName, `🛑 QUEUE FULL: ${pending.length}/${QUEUE_LIMITS.maxQueueSize} — Waiting for queue to clear`);
			return false;
		}

		// Check total pending across all daemons
		const totalPending = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.txt')).length;

		if (totalPending >= QUEUE_LIMITS.maxTotalPending) {
			logQuanLuat(daemonName, `🛑 TOTAL QUEUE FULL: ${totalPending}/${QUEUE_LIMITS.maxTotalPending}`);
			return false;
		}

		return true;
	} catch (e) {
		return true; // Don't block on check failures
	}
}

// ═══════════════════════════════════════════════════════════════
// Rule 6 + 9: GUARD DUTY + MARCH CADENCE — Health & Cadence
// ═══════════════════════════════════════════════════════════════

const THERMAL_THRESHOLDS = {
	SAFE: 75,
	WARN: 85,
	HALT: 90,
};

// ═══════════════════════════════════════════════════════════════
// Rule 8: UNBROKEN COMMUNICATIONS — Logging
// ═══════════════════════════════════════════════════════════════

const RANKS = {
	hunter: 'TRINH_SAT',
	builder: 'CONG_BINH',
	dispatcher: 'DIEU_PHOI',
	reviewer: 'HIEN_BINH',
	artist: 'HOA_SI',
	architect: 'KIEN_TRUC_SU',
	diplomat: 'NGOAI_GIAO',
	merchant: 'QUAN_NHU',
	operator: 'LINH_CANH',
	sage: 'HIEN_TRIET',
	scribe: 'THU_KY',
};

/**
 * Standard Military Order log: [TIMESTAMP] [RANK] [DAEMON] message
 */
function logQuanLuat(daemonName, message) {
	const rank = RANKS[daemonName] || 'UNKNOWN';
	const timestamp = new Date().toISOString().slice(11, 19);
	const line = `[${timestamp}] [${rank}] [${daemonName.toUpperCase()}] ${message}`;
	console.log(line);
	return line;
}

// ═══════════════════════════════════════════════════════════════
// NGU SU Assessment — Pre-mission strategic check
// ═══════════════════════════════════════════════════════════════

/**
 * Ngu Su (Five Factors) evaluation before each mission (始計 Chapter)
 * Dao-Thien-Dia-Tuong-Phap
 */
function assessNguSu(mission) {
	const assessment = {
		dao: true, // DAO: Team alignment (Constitution compliant?)
		thien: true, // THIEN: Timing good? (thermal OK? quota available?)
		dia: true, // DIA: Environment ready? (staging? CI green?)
		tuong: true, // TUONG: Right model/agent for task?
		phap: true, // PHAP: System ready? (panes alive? queue space?)
		score: 0,
		recommend: 'PROCEED',
	};

	// Check THIÊN (timing/thermal)
	try {
		const { execSync } = require('child_process');
		const thermal = execSync('sysctl -n machdep.xcpm.cpu_thermal_level 2>/dev/null || echo 0', { encoding: 'utf8' }).trim();
		if (parseInt(thermal) > 3) {
			assessment.thien = false;
			assessment.recommend = 'DELAY';
		}
	} catch (e) {
		/* thermal check optional */
	}

	// Check PHÁP (queue discipline)
	assessment.phap = checkQueueDiscipline(mission.daemon || 'dispatcher');

	// Score
	assessment.score = [assessment.dao, assessment.thien, assessment.dia, assessment.tuong, assessment.phap].filter(Boolean).length;

	if (assessment.score < 3) {
		assessment.recommend = 'ABORT';
	} else if (assessment.score < 5) {
		assessment.recommend = 'CAUTION';
	}

	return assessment;
}

// ═══════════════════════════════════════════════════════════════
// BOOT DAEMON — Standardized daemon startup registration
// ═══════════════════════════════════════════════════════════════

/**
 * Boot daemon following Military Order standards
 * Validates identity, logs boot, returns daemon info
 * @param {string} daemonName - Daemon name (e.g. 'hunter')
 * @returns {{ rank: string, territory: object, ok: boolean }} Boot result
 */
function bootDaemon(daemonName) {
	// Validate daemon exists in Chain of Command
	if (!CHAIN_OF_COMMAND.QUAN.includes(daemonName)) {
		console.error(`[QUAN_LUAT] ❌ BOOT REJECTED: "${daemonName}" not part of the Army`);
		return { rank: 'UNKNOWN', territory: null, ok: false };
	}

	const rank = RANKS[daemonName];
	const territory = TERRITORIES[daemonName];

	logQuanLuat(
		daemonName,
		`🏯 BOOT — ${rank} entered barracks | Territory: ${territory.domain} | Actions: [${territory.actions.join(', ')}]`,
	);

	return { rank, territory, ok: true };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
	// Constants
	CHAIN_OF_COMMAND,
	SIGNAL_TYPES,
	PRIORITY_LEVELS,
	TERRITORIES,
	TOKEN_BUDGETS,
	RANKS,
	QUEUE_LIMITS,
	THERMAL_THRESHOLDS,

	// Functions
	createSignal,
	checkTerritory,
	validateModelTier,
	checkQueueDiscipline,
	logQuanLuat,
	assessNguSu,
	bootDaemon,
};
