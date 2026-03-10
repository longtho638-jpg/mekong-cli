/**
 * Mission Complexity Classifier — Routes missions to appropriate execution format
 *
 * ALL levels use /cook ClaudeKit command to ensure proper workflow activation.
 *
 * SIMPLE  → /cook "task"                        (single agent, 15 phút)
 * MEDIUM  → /cook "task" --auto                  (sub-agents, 30 phút)
 * COMPLEX → /cook with Agent Team instructions   (4+ parallel Task subagents, 45 phút)
 */

const config = require('../config');
const fs = require('fs');
const path = require('path');

const VI_PREFIX = 'Trả lời bằng TIẾNG VIỆT. ';
const FILE_LIMIT = 'Chỉ sửa TỐI ĐA 5 file mỗi mission. Nếu cần sửa nhiều hơn, báo cáo danh sách còn lại.';
const NO_GIT = 'CRITICAL: DO NOT run git commit, git push, or /check-and-commit. The CI/CD gate handles git operations.';

const HISTORY_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data/mission-history.json');

/**
 * Adjust timeout based on project history (Self-Learning Feedback Loop)
 * @param {string} project
 * @param {number} baseTimeout
 * @returns {number} Adjusted timeout in ms
 */
function adjustTimeout(project, baseTimeout) {
	try {
		let adjusted = baseTimeout || config.TIMEOUT_SIMPLE;

		if (fs.existsSync(HISTORY_FILE)) {
			const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
			const projectMissions = history.filter((m) => m.project === project).slice(-10);

			if (projectMissions.length > 0) {
				// Logic: Nếu thường xuyên timeout (thất bại và chạy > 90% timeout) -> +20%
				const timeouts = projectMissions.filter((m) => !m.success && m.durationMs > adjusted * 0.9).length;
				if (timeouts >= 3) {
					adjusted = Math.floor(adjusted * 1.2);
				}

				// Logic: Nếu luôn chạy nhanh (thành công và < 30% timeout) -> -20%
				const fastRuns = projectMissions.filter((m) => m.success && m.durationMs < adjusted * 0.3).length;
				if (fastRuns >= 5) {
					adjusted = Math.floor(adjusted * 0.8);
				}
			}
		}

		// Range: 5 min to 60 min
		const MIN_TIMEOUT = 5 * 60 * 1000;
		const MAX_TIMEOUT = 60 * 60 * 1000;

		return Math.min(Math.max(adjusted, MIN_TIMEOUT), MAX_TIMEOUT);
	} catch (e) {
		return baseTimeout || config.TIMEOUT_SIMPLE;
	}
}

/**
 * Classify mission complexity based on task metadata and keyword analysis.
 * @param {object} task - Task object from BINH_PHAP_TASKS ({id, cmd, complexity?})
 * @param {string} project - Project name for scope context
 * @returns {'simple'|'medium'|'complex'}
 */
function classifyComplexity(task, project) {
	if (task.complexity) return task.complexity;
	const text = `${task.cmd} ${task.id}`.toLowerCase();
	if (config.COMPLEXITY.COMPLEX_KEYWORDS.some((kw) => text.includes(kw))) return 'complex';
	if (config.COMPLEXITY.MEDIUM_KEYWORDS.some((kw) => text.includes(kw))) return 'medium';
	return 'simple';
}

/**
 * Get timeout for a given complexity level.
 * @param {'simple'|'medium'|'complex'} complexity
 * @returns {number} Timeout in milliseconds
 */
function getTimeoutForComplexity(complexity) {
	if (complexity === 'complex') return config.TIMEOUT_COMPLEX;
	if (complexity === 'medium') return config.TIMEOUT_MEDIUM;
	return config.TIMEOUT_SIMPLE;
}

/**
 * Classify raw mission text and return appropriate timeout.
 * Used by task-queue for dynamic timeout on any mission content.
 * @param {string} text - Raw mission file content
 * @returns {{ complexity: string, timeout: number }}
 */
function classifyContentTimeout(text) {
	const lower = text.toLowerCase();
	let complexity = 'simple';
	if (config.COMPLEXITY.COMPLEX_KEYWORDS.some((kw) => lower.includes(kw))) {
		complexity = 'complex';
	} else if (config.COMPLEXITY.MEDIUM_KEYWORDS.some((kw) => lower.includes(kw))) {
		complexity = 'medium';
	}

	const baseTimeout = getTimeoutForComplexity(complexity);
	return { complexity, timeout: baseTimeout };
}

/**
 * Build Agent Team instruction block for complex missions.
 * Tells CC CLI to spawn parallel Task subagents via the native Task tool.
 * @param {string} taskId - Task identifier for role lookup
 * @returns {string} Agent Team instruction text
 */
/**
 * Build Agent Team instruction block for complex missions.
 * 10x OPTIMIZED: Specific subtask decomposition per role.
 * Each subagent gets EXPLICIT scope → no overlap, no duplicate work.
 *
 * BINH_PHAP 奇正相生: 1 CC CLI = CHÍNH (main) + KỲ (subagents)
 * When /cook finishes → ALL subagents complete synchronously → "xong là xong hẳn"
 *
 * @param {string} taskId - Task identifier for role lookup
 * @param {string} taskDescription - Raw task description for context
 * @returns {string} Agent Team instruction text
 */
function buildAgentTeamBlock(taskId, taskDescription = '') {
	const roles = config.AGENT_TEAM_ROLES[taskId] || config.AGENT_TEAM_ROLES.default;

	// 10x: Generate SPECIFIC subtask per role instead of generic "spawn N agents"
	const roleInstructions = {
		'code-reviewer': 'SCOPE: Review code quality, naming, DRY violations, complexity. Use /review:codebase.',
		tester: 'SCOPE: Write/fix unit tests. Verify coverage. Use /test and /test:ui.',
		debugger: 'SCOPE: Find runtime errors and edge cases. Use /debug command.',
		'fullstack-developer': 'SCOPE: Implement the core feature. Use /cook.',
		researcher: 'SCOPE: Research best practices and examples. Use /ask and /search.',
		architect: 'SCOPE: Design system architecture and API contracts. Use /plan:hard.',
		planner: 'SCOPE: Break task into subtasks. Use /plan:hard or /plan:two.',
		'security-auditor': 'SCOPE: Check for vulnerabilities. Use /review:codebase.',
	};

	const subtasks = roles.map((role, i) => {
		const instruction = roleInstructions[role] || `SCOPE: Handle ${role} responsibilities.`;
		return `Subagent ${i + 1} (${role}): ${instruction}`;
	});

	return [
		'PARALLEL TEAM EXECUTION (風林火山 🔥LỬA):',
		`Launch ${roles.length} parallel subagents simultaneously.`,
		...subtasks,
		'RULES: (1) Each subagent works independently — NO waiting for others.',
		'(2) Each subagent commits its own changes.',
		'(3) Main thread waits for ALL to finish, then consolidates.',
		'(4) If conflict detected, main thread resolves.',
		'IMPORTANT: DO NOT use XML tags. Use Task tool or natural language.',
	].join(' ');
}

/**
 * 10x PARALLEL: Build a decomposed prompt that splits a complex task
 * into multiple sequential /cook calls within 1 CC CLI session.
 *
 * Pattern: /cook "subtask1" → /cook "subtask2" → /cook "subtask3"
 * CC CLI handles each synchronously — when last /cook finishes, ALL done.
 *
 * @param {string} task - Raw task description
 * @param {string} taskId - Task ID for role lookup
 * @returns {string} Multi-step /cook prompt
 */
function buildDecomposedPrompt(task, taskId) {
	// Auto-detect decomposition patterns
	const lower = task.toLowerCase();

	// Pattern 1: Task has numbered steps → extract and parallelize
	const steps = task.match(/\d+\.\s+[^\d]+/g);
	if (steps && steps.length >= 2) {
		const cookSteps = steps.map((step, i) => {
			const clean = step.replace(/^\d+\.\s+/, '').trim();
			return `Step ${i + 1}: ${clean}`;
		});
		return [
			`MULTI-PHASE EXECUTION (${cookSteps.length} steps):`,
			...cookSteps,
			'Execute ALL steps. Verify each step before moving to next.',
			'When ALL steps complete → report summary.',
		].join(' ');
	}

	// Pattern 2: Task mentions multiple files/components → split by component
	const componentPatterns = task.match(/(?:apps?|lib|components?|pages?|api)\/[\w-]+/g);
	if (componentPatterns && componentPatterns.length >= 2) {
		const unique = [...new Set(componentPatterns)];
		return [
			`COMPONENT-PARALLEL EXECUTION (${unique.length} components):`,
			...unique.map((comp, i) => `Component ${i + 1}: Apply changes to ${comp}`),
			'Work on each component independently. Verify all compile.',
		].join(' ');
	}

	// Pattern 3: Default → use Agent Team block
	return buildAgentTeamBlock(taskId, task);
}

/**
 * Detect MISSION INTENT to map to specialized ClaudeKit commands.
 * Rule 13: Command Obsession — Always use the most powerful tool.
 * @param {string} text - Raw mission text
 * @returns {'BUILD'|'FIX'|'REVIEW'|'RESEARCH'|'PLAN'}
 */
function detectIntent(text) {
	const lower = text.toLowerCase();

	if (lower.includes('research') || lower.includes('tìm hiểu') || lower.includes('khảo sát')) return 'RESEARCH';

	// MULTI_FIX: 2+ bug/error keywords → parallel fix mode (check BEFORE single FIX)
	const bugWords = ['bug', 'lỗi', 'error', 'loi'];
	const bugCount = bugWords.filter((w) => lower.includes(w)).length;
	if (bugCount >= 2) return 'MULTI_FIX';

	// DEBUG: investigation/root-cause intent (check BEFORE single FIX)
	if (
		lower.includes('tại sao') ||
		lower.includes('tai-sao') ||
		lower.includes('why') ||
		lower.includes('root-cause') ||
		lower.includes('investigate')
	)
		return 'DEBUG';

	// STRATEGIC: large-scale architectural work (check BEFORE BUILD)
	if (lower.includes('architecture') || lower.includes('redesign') || lower.includes('migration') || lower.includes('refactor-toan-bo'))
		return 'STRATEGIC';

	if (lower.includes('bug') || lower.includes('fix') || lower.includes('lỗi') || lower.includes('sửa')) return 'FIX';
	if (lower.includes('review') || lower.includes('audit') || lower.includes('kiểm tra')) return 'REVIEW';
	if (lower.includes('plan') || lower.includes('kế hoạch') || lower.includes('thiết kế')) return 'PLAN';

	return 'BUILD'; // Default intent
}

/**
 * Generate the mission prompt with Phong Lâm Hỏa Sơn (風林火山) token optimization.
 *
 * 🌪️ GIÓ (SIMPLE):  --fast --no-test  → 30% tokens, speed run
 * 🌲 RỪNG (MEDIUM): --auto            → 60% tokens, standard quality
 * 🔥 LỬA (COMPLEX): --parallel teams  → 100% tokens, maximum power
 * ⛰️ NÚI (IDLE):    queue scan        → 0 tokens
 *
 * @param {object} task - Task object ({id, cmd, complexity?})
 * @param {string} project - Target project name
 * @param {'simple'|'medium'|'complex'} complexity - Classified complexity
 * @returns {{ prompt: string, timeout: number, mode: string }} Formatted mission prompt + timeout + binh phap mode
 */
function generateMissionPrompt(task, project, complexity) {
	const mission = `${VI_PREFIX}${task.cmd} in ${project}. ${FILE_LIMIT} ${NO_GIT}`;

	// Get base timeout based on complexity
	const baseTimeout = getTimeoutForComplexity(complexity);

	// Apply adaptive learning adjustment
	const timeout = adjustTimeout(project, baseTimeout);

	// 🔥 LỬA mode — Complex: 10x parallel decomposition, max token burn
	if (complexity === 'complex') {
		const decomposed = buildDecomposedPrompt(task.cmd, task.id);
		return { prompt: `/cook "${mission} ${decomposed}" --parallel --auto`, timeout, mode: '🔥LỬA' };
	}

	// 🌲 RỪNG mode — Medium: standard /cook with auto, balanced
	if (complexity === 'medium') {
		return { prompt: `/cook "${mission}" --parallel --auto`, timeout, mode: '🌲RỪNG' };
	}

	// 🌪️ GIÓ mode — Simple: fast + no-test, minimum token burn, maximum speed
	return { prompt: `/cook "${mission}" --fast --no-test --auto`, timeout, mode: '🌪️GIÓ' };
}

/**
 * Check if a mission prompt is a team/complex mission (for timeout decisions).
 * @param {string} prompt - The full mission prompt text
 * @returns {boolean}
 */
function isTeamMission(prompt) {
	const lower = prompt.toLowerCase();
	return (
		lower.includes('agent team') ||
		lower.includes('parallel task subagents') ||
		lower.includes('scope: thorough') ||
		lower.includes('teammates') ||
		lower.includes('parallel') ||
		lower.includes('--parallel')
	);
}

/**
 * Thất Kế Assessment — 7-question pre-mission evaluation (始計 Ch.1)
 * 多算勝，少算不勝 — Calculate more to win
 *
 * Only runs for 'complex' and 'strategic' missions.
 * Simple/medium missions skip (兵貴勝 — speed matters).
 *
 * @param {string} taskContent - Raw task content
 * @param {string} project - Project name
 * @returns {{ score: number, recommendation: string, factors: object } | null}
 */
function assessThietKe(taskContent, project) {
	let score = 0;
	const factors = {};

	// 1. 道 ĐẠO — Project culture / code quality
	try {
		const pkgPath = path.join(config.MEKONG_DIR, 'apps', project, 'package.json');
		if (fs.existsSync(pkgPath)) {
			const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
			const hasLint = !!(pkg.scripts && pkg.scripts.lint);
			const hasTest = !!(pkg.scripts && pkg.scripts.test);
			factors.dao = { hasLint, hasTest, healthy: hasLint || hasTest };
			if (factors.dao.healthy) score++;
		} else {
			factors.dao = { healthy: false, reason: 'no package.json' };
		}
	} catch (e) {
		factors.dao = { healthy: false, reason: e.message };
	}

	// 2. 天 THIÊN — Timing (system thermal + resource load)
	try {
		const { getLoadAverage } = require('./m1-cooling-daemon');
		const load = getLoadAverage();
		factors.thien = { load, safe: load < 15 };
		if (factors.thien.safe) score++;
	} catch (e) {
		factors.thien = { safe: true, reason: 'cooling unavailable' };
		score++; // Assume safe if we can't check
	}

	// 3. 地 ĐỊA — Environment readiness
	try {
		const projectDir = path.join(config.MEKONG_DIR, 'apps', project);
		const hasGit = fs.existsSync(path.join(projectDir, '.git'));
		const hasNodeModules = fs.existsSync(path.join(projectDir, 'node_modules'));
		factors.dia = { hasGit, hasNodeModules, ready: hasGit && hasNodeModules };
		if (factors.dia.ready) score++;
	} catch (e) {
		factors.dia = { ready: false, reason: e.message };
	}

	// 4. 將 TƯỚNG — Model capability match
	const taskLen = (taskContent || '').length;
	const isHeavy = taskLen > 2000 || /complex|architecture|refactor|migrate/i.test(taskContent);
	factors.tuong = { model: config.MODEL_NAME, isHeavy, capable: true };
	score++; // AG Proxy always capable

	// 5. 法 PHÁP — Lint/test strictness
	try {
		const pkgPath = path.join(config.MEKONG_DIR, 'apps', project, 'package.json');
		if (fs.existsSync(pkgPath)) {
			const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
			const hasTypecheck = !!(pkg.scripts && (pkg.scripts.typecheck || pkg.scripts['type-check']));
			const hasBuild = !!(pkg.scripts && pkg.scripts.build);
			factors.phap = { hasTypecheck, hasBuild, strict: hasBuild };
			if (factors.phap.strict) score++;
		} else {
			factors.phap = { strict: false };
		}
	} catch (e) {
		factors.phap = { strict: false };
	}

	// 6. 兵 BINH — Available resources (RAM, API quota)
	try {
		const qt = require('./quota-tracker');
		const summary = qt.getSummary();
		const hourlyMissions = summary.lastHour.missions;
		const withinBudget = hourlyMissions < config.AG_HOURLY_BUDGET;
		factors.binh = { hourlyMissions, budget: config.AG_HOURLY_BUDGET, withinBudget };
		if (withinBudget) score++;
	} catch (e) {
		factors.binh = { withinBudget: true, reason: 'quota unavailable' };
		score++;
	}

	// 7. 賞 THƯỞNG — Recent mission success rate
	try {
		if (fs.existsSync(HISTORY_FILE)) {
			const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
			const recent = history.filter((m) => m.project === project).slice(-10);
			const successRate = recent.length > 0 ? recent.filter((m) => m.success).length / recent.length : 0.5; // No data → neutral
			factors.thuong = { recentMissions: recent.length, successRate };
			if (successRate >= 0.5) score++;
		} else {
			factors.thuong = { successRate: 0.5, reason: 'no history' };
			score++; // No data → neutral pass
		}
	} catch (e) {
		factors.thuong = { successRate: 0.5, reason: 'history error' };
		score++;
	}

	// Recommendation
	let recommendation;
	if (score <= 3) recommendation = 'abort';
	else if (score <= 5) recommendation = 'downgrade';
	else recommendation = 'proceed';

	return { score, recommendation, factors };
}

module.exports = {
	classifyComplexity,
	generateMissionPrompt,
	isTeamMission,
	buildAgentTeamBlock,
	buildDecomposedPrompt,
	classifyContentTimeout,
	getTimeoutForComplexity,
	adjustTimeout,
	detectIntent,
	assessThietKe,
};
