/**
 * Quân Luật Enforcer — Runtime enforcement cho Doanh Trại Tôm Hùm
 *
 * Áp dụng 9 ĐIỀU Quân Lệnh vào runtime:
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
// ĐIỀU 1: PHỤC TÙNG CHỈ HUY — Chain of Command
// ═══════════════════════════════════════════════════════════════

const CHAIN_OF_COMMAND = {
	CHU_SOAI: 'antigravity', // 👑 Chủ Soái
	QUAN_SU: 'brain-process-manager', // 🧠 Quân Sư
	TUONG: ['pane_0', 'pane_1'], // ⚔️ Tướng (CC CLI Panes)
	QUAN: [
		// 🐾 Quân (Daemons)
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
// ĐIỀU 2: BẨM BÁO MINH BẠCH — Signal Protocol
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
 * Tạo pheromone signal chuẩn theo Quân Luật Điều 2
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

	// Ghi vào signal log (Điều 8: Liên Lạc Không Đứt)
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
// ĐIỀU 3: LÃNH THỔ PHÂN MINH — Territory
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
 * Kiểm tra daemon có xâm phạm lãnh thổ daemon khác không
 * Điều 3: CẤM XÂM PHẠM lãnh thổ daemon khác
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
// ĐIỀU 4: LƯƠNG THỰC TIẾT KIỆM — Token Budget
// ═══════════════════════════════════════════════════════════════

const TOKEN_BUDGETS = {
	FREE: {
		models: ['gemini-2.5-flash', 'moonshotai/kimi-k2.5'],
		maxTokensPerCall: 2000,
		tier: 'QUAN', // Quân sĩ
	},
	PREMIUM: {
		models: ['claude-sonnet-4-5', 'claude-opus-4-6'],
		maxTokensPerCall: 200000,
		tier: 'TUONG', // Tướng lĩnh
	},
	SUPREME: {
		models: ['gemini-2.5-pro', 'claude-opus-4-6-thinking'],
		maxTokensPerCall: 500000,
		tier: 'CHU_SOAI', // Chủ Soái
	},
};

/**
 * Validate model đúng cấp bậc (Điều 4)
 * Daemon (QUÂN) chỉ được dùng FREE models
 */
function validateModelTier(daemonName, model) {
	const isQuan = CHAIN_OF_COMMAND.QUAN.includes(daemonName);
	if (isQuan) {
		if (!TOKEN_BUDGETS.FREE.models.includes(model)) {
			logQuanLuat(daemonName, `🚫 TOKEN BUDGET VIOLATION: "${model}" is PREMIUM/SUPREME — Quân sĩ chỉ được dùng FREE models`);
			return false;
		}
	}
	return true;
}

// ═══════════════════════════════════════════════════════════════
// ĐIỀU 5: DOANH TRẠI SẠCH SẼ — Clean Camp
// ═══════════════════════════════════════════════════════════════

const QUEUE_LIMITS = {
	maxQueueSize: 3, // Per daemon type
	maxTotalPending: 15, // Across all daemons
	processedRetention: 24 * 60 * 60 * 1000, // 24h in ms
};

/**
 * Check queue discipline trước khi tạo mission mới
 */
function checkQueueDiscipline(daemonName) {
	try {
		const tasksDir = config.WATCH_DIR;
		if (!fs.existsSync(tasksDir)) return true;

		const pending = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.txt') && f.includes(daemonName));

		if (pending.length >= QUEUE_LIMITS.maxQueueSize) {
			logQuanLuat(daemonName, `🛑 QUEUE FULL: ${pending.length}/${QUEUE_LIMITS.maxQueueSize} — Chờ queue giải phóng`);
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
// ĐIỀU 6 + 9: CANH GÁC + HÀNH QUÂN — Health & Cadence
// ═══════════════════════════════════════════════════════════════

const THERMAL_THRESHOLDS = {
	SAFE: 75,
	WARN: 85,
	HALT: 90,
};

// ═══════════════════════════════════════════════════════════════
// ĐIỀU 8: LIÊN LẠC KHÔNG ĐỨT — Logging
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
 * Log chuẩn Quân Luật: [TIMESTAMP] [RANK] [DAEMON] message
 */
function logQuanLuat(daemonName, message) {
	const rank = RANKS[daemonName] || 'UNKNOWN';
	const timestamp = new Date().toISOString().slice(11, 19);
	const line = `[${timestamp}] [${rank}] [${daemonName.toUpperCase()}] ${message}`;
	console.log(line);
	return line;
}

// ═══════════════════════════════════════════════════════════════
// NGŨ SỰ Assessment — Pre-mission strategic check
// ═══════════════════════════════════════════════════════════════

/**
 * Ngũ Sự evaluation trước mỗi mission (始計 Chapter)
 * Đạo-Thiên-Địa-Tướng-Pháp
 */
function assessNguSu(mission) {
	const assessment = {
		dao: true, // ĐẠO: Team alignment (Constitution compliant?)
		thien: true, // THIÊN: Timing good? (thermal OK? quota available?)
		dia: true, // ĐỊA: Environment ready? (staging? CI green?)
		tuong: true, // TƯỚNG: Right model/agent for task?
		phap: true, // PHÁP: System ready? (panes alive? queue space?)
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
 * Khởi động daemon theo chuẩn Quân Luật
 * Validates identity, logs boot, returns daemon info
 * @param {string} daemonName - Tên daemon (e.g. 'hunter')
 * @returns {{ rank: string, territory: object, ok: boolean }} Boot result
 */
function bootDaemon(daemonName) {
	// Validate daemon exists in Chain of Command
	if (!CHAIN_OF_COMMAND.QUAN.includes(daemonName)) {
		console.error(`[QUAN_LUAT] ❌ BOOT REJECTED: "${daemonName}" không thuộc Quân Đội`);
		return { rank: 'UNKNOWN', territory: null, ok: false };
	}

	const rank = RANKS[daemonName];
	const territory = TERRITORIES[daemonName];

	logQuanLuat(
		daemonName,
		`🏯 BOOT — ${rank} nhập doanh trại | Territory: ${territory.domain} | Actions: [${territory.actions.join(', ')}]`,
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
