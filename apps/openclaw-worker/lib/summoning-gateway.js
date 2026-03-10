/**
 * 🐉 Summoning Gateway — Triệu Hồi Thuật
 *
 * CTO = Triệu Hồi Sư. Modules Tôm Hùm = NÃO. CC CLI = XÁC.
 * Gateway nạp expertise từ module vào CC CLI pane dưới dạng system prompt.
 *
 * Flow: detectState() → pickSquad() → summon(command) → inject CC CLI → dismiss()
 *
 * Only Grade-A modules (real logic + proper exports) are registered.
 * See docs/module-audit.md for full audit results.
 * See docs/summoning-pattern.md for architecture design.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const { log } = require('./brain-logger');

// ─── SQUAD DEFINITIONS ─────────────────────────────────────────────────────
// 13 squads, each with member modules and trigger conditions

const SQUADS = {
	STRATEGIC: {
		name: '🧠 Strategic Command',
		description: 'Hoạch định, phân tích, ra quyết định chiến lược',
		members: {
			'/strategist': 'strategic-brain',
			'/wise-counsel': 'binh-phap-strategist',
			'/optimize-strategy': 'strategy-optimizer',
			'/swarm': 'swarm-intelligence',
			'/commander': 'project-commander',
			'/classify-mission': 'mission-complexity-classifier',
			'/decompose': 'work-order-decomposer',
			'/doanh-trai': 'doanh-trai-registry',
		},
	},
	RECON: {
		name: '🔍 Reconnaissance',
		description: 'Scan, phát hiện vấn đề, thu thập intelligence',
		members: {
			'/cto-scan': 'auto-cto-pilot',
			'/pre-scan': 'cto-pre-dispatch-scan',
			'/codebase-scan': 'cto-codebase-scanner',
			'/project-scan': 'project-scanner',
			'/profile-project': 'project-profiler',
			'/project-score': 'project-score-calculator',
			'/hunt': 'hunter-scanner',
			'/perceive': 'perception-engine',
			'/agi-score': 'agi-score-calculator',
		},
	},
	MISSION: {
		name: '🚀 Mission Ops',
		description: 'Dispatch, chạy, theo dõi mission',
		members: {
			'/dispatch': 'mission-dispatcher',
			'/task-dispatch': 'cto-task-dispatch',
			'/run-mission': 'brain-mission-runner',
			'/headless': 'brain-headless-per-mission',
			'/chain-task': 'auto-task-chain',
			'/recover-mission': 'mission-recovery',
			'/tactical': 'tactical-responder',
		},
	},
	EVOLUTION: {
		name: '🧬 Evolution & Learning',
		description: 'Tự học, tự cải tiến, tích lũy tri thức',
		members: {
			'/evolve': 'evolution-engine',
			'/learn': 'learning-engine',
			'/self-analyze': 'self-analyzer',
			'/synthesize': 'knowledge-synthesizer',
			'/syllabus': 'dynamic-syllabus',
			'/reflect': 'post-mortem-reflector',
			'/forge-skill': 'skill-factory',
			'/journal-mission': 'mission-journal',
			'/rl-feedback': 'openclaw-rl-client',
		},
	},
	REVENUE: {
		name: '💰 Revenue & Business',
		description: 'Quản lý tài chính, license, revenue health',
		members: {
			'/revenue-scan': 'revenue-health-scanner',
			'/license-check': 'raas-license-validator',
			'/handover': 'handover-generator',
			'/clawwork': 'clawwork-integration',
			'/moltbook': 'moltbook-integration',
		},
	},
	TRADING: {
		name: '📊 Trading Company',
		description: 'Quản lý trading operations, scheduling, decisions',
		members: {
			'/trading-schedule': 'trading-cadence-scheduler',
			'/trading-decide': 'trading-company-decision-engine',
			'/trading-report': 'trading-post-mission-report-handler',
		},
	},
	BRAIN: {
		name: '🔧 Brain Infrastructure',
		description: 'Quản lý process, spawn, state, health của CC CLI brain',
		members: {
			'/brain-spawn': 'brain-spawn-manager',
			'/brain-state': 'brain-state-machine',
			'/brain-watch': 'brain-supervisor',
			'/brain-boot': 'brain-boot-sequence',
			'/brain-pulse': 'brain-heartbeat',
			'/brain-health': 'brain-health-server',
			'/brain-sysmon': 'brain-system-monitor',
			'/stagnation-watch': 'brain-output-hash-stagnation-watchdog',
			'/dispatch-helpers': 'brain-dispatch-helpers',
			'/brain-terminal': 'brain-terminal-app',
			'/brain-tmux': 'brain-tmux-controller',
			'/brain-vscode': 'brain-vscode-terminal',
		},
	},
	DEFENSE: {
		name: '🛡️ Defense & Safety',
		description: 'Bảo mật, safety guard, quân luật, circuit breaker',
		members: {
			'/quan-luat': 'quan-luat-enforcer',
			'/safety': 'safety-guard',
			'/circuit': 'circuit-breaker',
			'/gate': 'post-mission-gate',
			'/heal': 'self-healer',
		},
	},
	COMMS: {
		name: '📡 Communication & Signals',
		description: 'Event bus, notifications, question handling',
		members: {
			'/signal': 'signal-bus',
			'/telegram': 'telegram-client',
			'/answer-question': 'question-handler',
			'/escalate': 'cto-escalation',
			'/dash-log': 'cto-dashboard-logger',
			'/dashboard': 'cto-visual-dashboard',
			'/track-progress': 'cto-progress-tracker',
		},
	},
	RESOURCE: {
		name: '⚙️ Resource Management',
		description: 'RAM, token, quota, cooling, rate limit, throughput',
		members: {
			'/resources': 'resource-governor',
			'/cool': 'm1-cooling-daemon',
			'/tokens': 'token-tracker',
			'/quota': 'quota-tracker',
			'/rate-gate': 'api-rate-gate',
			'/ram-policy': 'cto-ram-policy',
			'/maximize': 'throughput-maximizer',
			'/mutex': 'team-mutex',
		},
	},
	FACTORY: {
		name: '🏭 Factory & Pipeline',
		description: 'Bootstrap, build, pipeline, production board',
		members: {
			'/pipeline': 'factory-pipeline',
			'/bootstrap-project': 'project-bootstrapper',
			'/production': 'production-board',
			'/update-claudekit': 'claudekit-updater',
			'/system-status': 'system-status-registry',
		},
	},
	EXTERNAL_AI: {
		name: '🤖 External AI & Research',
		description: 'LLM clients, external AI agents, web research, memory',
		members: {
			'/interpret': 'llm-interpreter',
			'/perceive-llm': 'llm-perception',
			'/gemini': 'gemini-agentic',
			'/google-ultra': 'google-ultra',
			'/jules': 'jules-agent',
			'/nvidia': 'nvidia-client',
			'/web-research': 'web-researcher',
			'/vector': 'vector-service',
			'/mem-store': 'lightmem-memory',
			'/mem-recall': 'lightmem-retrieval',
			'/mem-forget': 'lightmem-forgetting',
		},
	},
	CTO_INFRA: {
		name: '🖥️ CTO Infrastructure',
		description: 'Pane management, coordinator, tmux, queue, dedup',
		members: {
			'/pane-handle': 'cto-pane-handler',
			'/pane-detect': 'cto-pane-state-detector',
			'/coordinate': 'cto-worker-coordinator',
			'/tmux-help': 'cto-tmux-helpers',
			'/monitor': 'monitor-24-7',
			'/queue': 'task-queue',
			'/dedup': 'task-deduplicator',
			'/dedup-registry': 'task-dedup-registry',
		},
	},
};

// ─── FLAT COMMAND→MODULE INDEX (built from SQUADS) ──────────────────────────

const COMMAND_INDEX = {};
const COMMAND_SQUAD = {};

for (const [squadId, squad] of Object.entries(SQUADS)) {
	for (const [cmd, moduleName] of Object.entries(squad.members)) {
		COMMAND_INDEX[cmd] = moduleName;
		COMMAND_SQUAD[cmd] = squadId;
	}
}

// ─── STATE → SQUAD DISPATCH TABLE ──────────────────────────────────────────

const STATE_DISPATCH = [
	// Priority 1: CRITICAL
	{ condition: (s) => s.buildFailed, squad: 'DEFENSE', cmd: '/heal' },
	{ condition: (s) => s.ramCritical, squad: 'RESOURCE', cmd: '/cool' },
	{ condition: (s) => s.paneDead, squad: 'BRAIN', cmd: '/brain-spawn' },
	{ condition: (s) => s.paneStuck, squad: 'BRAIN', cmd: '/stagnation-watch' },
	// Priority 2: BUSINESS
	{ condition: (s) => s.revenueDrop, squad: 'REVENUE', cmd: '/revenue-scan' },
	{ condition: (s) => s.tradingWindow, squad: 'TRADING', cmd: '/trading-schedule' },
	{ condition: (s) => s.newClient, squad: 'FACTORY', cmd: '/bootstrap-project' },
	// Priority 3: QUALITY
	{ condition: (s) => s.testFail, squad: 'DEFENSE', cmd: '/gate' },
	{ condition: (s) => s.ciRed, squad: 'DEFENSE', cmd: '/gate' },
	{ condition: (s) => s.codebaseDirty, squad: 'RECON', cmd: '/hunt' },
	{ condition: (s) => s.missionFailed, squad: 'EVOLUTION', cmd: '/reflect' },
	// Priority 4: PROACTIVE
	{ condition: (s) => s.allGreen, squad: 'STRATEGIC', cmd: '/strategist' },
	{ condition: (s) => s.knowledgeGap, squad: 'EVOLUTION', cmd: '/synthesize' },
	{ condition: (s) => s.needsReport, squad: 'COMMS', cmd: '/dashboard' },
];

// ─── CORE API ───────────────────────────────────────────────────────────────

/**
 * Extract expertise from a module's JSDoc header + exported function names.
 * @param {string} moduleName - e.g. 'strategic-brain'
 * @returns {{ header: string, exports: string[] }}
 */
function extractExpertise(moduleName) {
	const filePath = path.join(__dirname, `${moduleName}.js`);
	if (!fs.existsSync(filePath)) {
		return { header: `Module not found: ${moduleName}`, exports: [] };
	}

	const source = fs.readFileSync(filePath, 'utf8');

	// Extract JSDoc header (first /** ... */ block)
	const headerMatch = source.match(/\/\*\*[\s\S]*?\*\//);
	const header = headerMatch ? headerMatch[0] : `// ${moduleName}`;

	// Extract exported function/property names
	const exportsMatch = source.match(/module\.exports\s*=\s*\{([^}]+)\}/);
	const exports = exportsMatch
		? exportsMatch[1]
				.split(',')
				.map((s) => s.trim().split(':')[0].trim())
				.filter(Boolean)
		: [];

	return { header, exports };
}

/**
 * Build injection prompt for CC CLI pane.
 * @param {string} command - e.g. '/strategist'
 * @param {string} missionBrief - task description
 * @returns {string} formatted prompt to inject
 */
function buildInjectionPrompt(command, missionBrief) {
	const moduleName = COMMAND_INDEX[command];
	if (!moduleName) {
		return `ERROR: Unknown command ${command}. Available: ${Object.keys(COMMAND_INDEX).join(', ')}`;
	}

	const squadId = COMMAND_SQUAD[command];
	const squad = SQUADS[squadId];
	const { header, exports } = extractExpertise(moduleName);

	return [
		`SUMMONED EXPERT: ${moduleName}`,
		`SQUAD: ${squad.name} — ${squad.description}`,
		`COMMAND: ${command}`,
		`AVAILABLE FUNCTIONS: ${exports.join(', ') || 'N/A'}`,
		'─'.repeat(60),
		header,
		'─'.repeat(60),
		`MISSION BRIEF: ${missionBrief}`,
	].join('\n');
}

/**
 * Auto-detect project state and recommend which command to summon.
 * @param {object} state - project state object
 * @returns {{ squad: string, command: string, moduleName: string } | null}
 */
function detectAndRecommend(state) {
	for (const rule of STATE_DISPATCH) {
		if (rule.condition(state)) {
			return {
				squad: rule.squad,
				command: rule.cmd,
				moduleName: COMMAND_INDEX[rule.cmd],
			};
		}
	}
	return null;
}

/**
 * List all available commands grouped by squad.
 * @returns {object} { squadId: { name, commands: string[] } }
 */
function listCommands() {
	const result = {};
	for (const [squadId, squad] of Object.entries(SQUADS)) {
		result[squadId] = {
			name: squad.name,
			commands: Object.keys(squad.members),
		};
	}
	return result;
}

/**
 * Resolve a command to its module file path.
 * @param {string} command
 * @returns {string|null} absolute path or null
 */
function resolveModule(command) {
	const moduleName = COMMAND_INDEX[command];
	if (!moduleName) return null;
	const filePath = path.join(__dirname, `${moduleName}.js`);
	return fs.existsSync(filePath) ? filePath : null;
}

/**
 * Get squad info for a command.
 * @param {string} command
 * @returns {{ squadId: string, squad: object }|null}
 */
function getSquad(command) {
	const squadId = COMMAND_SQUAD[command];
	if (!squadId) return null;
	return { squadId, squad: SQUADS[squadId] };
}

// ─── EXPORTS ────────────────────────────────────────────────────────────────

module.exports = {
	SQUADS,
	COMMAND_INDEX,
	COMMAND_SQUAD,
	STATE_DISPATCH,
	extractExpertise,
	buildInjectionPrompt,
	detectAndRecommend,
	listCommands,
	resolveModule,
	getSquad,
};
