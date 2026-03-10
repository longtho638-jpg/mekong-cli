/**
 * project-commander.js — AGI Level 7: Multi-Project Commander
 *
 * 火攻 Ch.12: 合于利而動 — Move when advantageous
 *
 * Capabilities:
 * 1. Resource Allocator — score + prioritize projects dynamically
 * 2. Cross-Project Knowledge — share fixes across projects
 * 3. Portfolio Dashboard — unified JSON health summary
 * 4. Priority Rebalancer — auto-adjust scan order
 *
 * @version 1.0.0
 * @since 2026-02-18
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const DATA_DIR = path.join(__dirname, '..', 'data');
const COMMANDER_STATE_FILE = path.join(DATA_DIR, 'commander-state.json');
const HEALTH_REPORT_FILE = path.join(DATA_DIR, 'health-report.json');
const HISTORY_FILE = path.join(DATA_DIR, 'mission-history.json');
const TASKS_DIR = config.TASKS_DIR || path.join(__dirname, '..', '..', '..', 'tasks');

function log(msg) {
	const ts = new Date().toLocaleTimeString('en-GB');
	const line = `[${ts}] [tom-hum] [COMMANDER] ${msg}`;
	console.log(line);
	try {
		const logFile = process.env.TOM_HUM_LOG || path.join(process.env.HOME, 'tom_hum_cto.log');
		fs.appendFileSync(logFile, line + '\n');
	} catch {}
}

// --- State Management ---

function loadState() {
	try {
		if (fs.existsSync(COMMANDER_STATE_FILE)) {
			return JSON.parse(fs.readFileSync(COMMANDER_STATE_FILE, 'utf-8'));
		}
	} catch {}
	return {
		lastRebalance: null,
		projectScores: {},
		crossProjectFixes: [],
		portfolioSnapshot: null,
		rebalanceCount: 0,
	};
}

function saveState(state) {
	try {
		if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
		fs.writeFileSync(COMMANDER_STATE_FILE, JSON.stringify(state, null, 2));
	} catch (e) {
		log(`Failed to save state: ${e.message}`);
	}
}

function loadHealthReport() {
	try {
		if (fs.existsSync(HEALTH_REPORT_FILE)) {
			return JSON.parse(fs.readFileSync(HEALTH_REPORT_FILE, 'utf-8'));
		}
	} catch {}
	return {};
}

function loadHistory() {
	try {
		if (fs.existsSync(HISTORY_FILE)) {
			return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
		}
	} catch {}
	return [];
}

// --- Resource Allocator ---

/**
 * Score each project: error_count × priority × staleness
 * Higher score = needs more attention
 * Returns sorted project list (highest priority first)
 */
function scoreProjects() {
	const health = loadHealthReport();
	const history = loadHistory();
	const projects = config.PROJECTS || [];
	const state = loadState();

	const scores = projects.map((project, idx) => {
		const projectHealth = health[project] || {};
		const errorCount = (projectHealth.buildErrors || 0) + (projectHealth.lintErrors || 0) + (projectHealth.testFailures || 0);

		// Base priority: config order (first = highest)
		const basePriority = projects.length - idx;

		// Staleness: how long since last mission for this project
		const projectMissions = history.filter((m) => m.project === project);
		const lastMission = projectMissions.length > 0 ? new Date(projectMissions[projectMissions.length - 1].timestamp || 0).getTime() : 0;
		const hoursSinceLastMission = (Date.now() - lastMission) / (1000 * 60 * 60);
		const stalenessFactor = Math.min(5, hoursSinceLastMission / 4); // Max 5x after 20h

		// Success rate penalty: low success = needs more attention
		const successes = projectMissions.filter((m) => m.success).length;
		const successRate = projectMissions.length > 0 ? successes / projectMissions.length : 0.5;
		const failurePenalty = 1 + (1 - successRate) * 2; // 1x-3x multiplier

		// Final score
		const score = Math.round((errorCount * 10 + basePriority) * stalenessFactor * failurePenalty);

		return {
			project,
			score,
			errorCount,
			basePriority,
			stalenessFactor: Math.round(stalenessFactor * 10) / 10,
			successRate: Math.round(successRate * 100),
			lastMission: lastMission > 0 ? new Date(lastMission).toISOString() : 'never',
			missionCount: projectMissions.length,
		};
	});

	// Sort by score descending (highest priority first)
	scores.sort((a, b) => b.score - a.score);

	state.projectScores = {};
	scores.forEach((s) => {
		state.projectScores[s.project] = s.score;
	});
	saveState(state);

	return scores;
}

// --- Cross-Project Knowledge Sharing ---

/**
 * When a fix works for project A, check if same pattern exists in B, C, D
 * If yes, auto-generate fix missions for those projects
 */
function shareCrossProjectKnowledge() {
	const history = loadHistory();
	const state = loadState();
	const projects = config.PROJECTS || [];

	if (history.length < 10) return [];

	// Find recent successful fixes
	const recentSuccesses = history.filter((m) => m.success && m.task).slice(-20);

	const newCrossProjectMissions = [];

	for (const mission of recentSuccesses) {
		// Extract fix pattern from task name
		const fixPattern = extractFixPattern(mission.task);
		if (!fixPattern) continue;

		// Check if already shared
		const alreadyShared = (state.crossProjectFixes || []).some((f) => f.pattern === fixPattern && f.sourceProject === mission.project);
		if (alreadyShared) continue;

		// Check other projects for same pattern
		for (const otherProject of projects) {
			if (otherProject === mission.project) continue;

			// Check if other project has similar issues
			const otherErrors = history
				.filter((m) => !m.success && m.project === otherProject && m.task)
				.filter((m) => m.task.includes(fixPattern));

			if (otherErrors.length >= 2) {
				// Generate cross-project mission
				const missionContent = `[MISSION: CROSS_PROJECT_FIX — 火攻 Knowledge Sharing]
Working Dir: ${resolveProjectDir(otherProject)}

CONTEXT: Fix pattern "${fixPattern}" was successfully applied in ${mission.project}.
Similar failures detected in ${otherProject} (${otherErrors.length} occurrences).

TASK: Apply the same fix pattern from ${mission.project} to ${otherProject}:
1. Check if ${otherProject} has the same issue
2. If yes, apply similar fix
3. Run build to verify
4. Commit with message: "🔗 CROSS-FIX from ${mission.project}: ${fixPattern}"

SCOPE LIMIT: Max 3 files changed. If pattern doesn't apply, exit immediately.
`;

				const taskFile = path.join(TASKS_DIR, `HIGH_mission_crossfix_${fixPattern}_${otherProject}_${Date.now()}.txt`);

				try {
					fs.writeFileSync(taskFile, missionContent);
					newCrossProjectMissions.push({
						pattern: fixPattern,
						sourceProject: mission.project,
						targetProject: otherProject,
						taskFile: path.basename(taskFile),
					});
					log(`🔗 Cross-project fix: ${fixPattern} from ${mission.project} → ${otherProject}`);
				} catch (e) {
					log(`Failed to create cross-project mission: ${e.message}`);
				}
			}
		}

		// Track shared fixes
		if (!state.crossProjectFixes) state.crossProjectFixes = [];
		state.crossProjectFixes.push({
			pattern: fixPattern,
			sourceProject: mission.project,
			timestamp: new Date().toISOString(),
		});
	}

	// Keep only last 50 cross-project records
	if (state.crossProjectFixes && state.crossProjectFixes.length > 50) {
		state.crossProjectFixes = state.crossProjectFixes.slice(-50);
	}

	saveState(state);
	return newCrossProjectMissions;
}

/**
 * Extract fix pattern from task name
 * e.g., "fix_build_error" → "build_error"
 */
function extractFixPattern(task) {
	if (!task) return null;
	const patterns = [/fix[_\s]+([\w_]+)/i, /resolve[_\s]+([\w_]+)/i, /repair[_\s]+([\w_]+)/i];
	for (const p of patterns) {
		const match = task.match(p);
		if (match) return match[1].toLowerCase();
	}
	return null;
}

/**
 * Resolve project directory path
 */
function resolveProjectDir(project) {
	const rootDir = config.MEKONG_DIR || path.join(__dirname, '..', '..', '..');
	// Try root-level first (monorepo style)
	const rootPath = path.join(rootDir, project);
	if (fs.existsSync(rootPath)) return rootPath;
	// Fallback to apps/ subdir
	return path.join(rootDir, 'apps', project);
}

// --- Portfolio Dashboard ---

/**
 * Generate unified health summary for all projects
 */
function getPortfolioDashboard() {
	const scores = scoreProjects();
	const state = loadState();
	const health = loadHealthReport();
	const { getEvolutionScore } = require('./evolution-engine');

	const dashboard = {
		timestamp: new Date().toISOString(),
		agiLevel: 7,
		evolutionScore: getEvolutionScore(),
		totalProjects: scores.length,
		healthyProjects: scores.filter((s) => s.errorCount === 0).length,
		needsAttention: scores.filter((s) => s.errorCount > 0).length,
		projects: scores.map((s) => ({
			...s,
			health: health[s.project] || {},
		})),
		crossProjectFixes: (state.crossProjectFixes || []).length,
		rebalanceCount: state.rebalanceCount || 0,
	};

	// Save dashboard to file
	const dashboardFile = path.join(DATA_DIR, 'portfolio-dashboard.json');
	try {
		fs.writeFileSync(dashboardFile, JSON.stringify(dashboard, null, 2));
	} catch {}

	return dashboard;
}

// --- Priority Rebalancer ---

/**
 * Auto-adjust PROJECTS scan order based on real health data
 * Called after all projects scan GREEN
 */
function rebalancePriorities() {
	const scores = scoreProjects();
	const state = loadState();

	// Only rebalance every 4 hours
	const FOUR_HOURS = 4 * 60 * 60 * 1000;
	if (state.lastRebalance && Date.now() - new Date(state.lastRebalance).getTime() < FOUR_HOURS) {
		return null;
	}

	const newOrder = scores.map((s) => s.project);
	const currentOrder = config.PROJECTS || [];

	// Check if order changed
	const changed = newOrder.some((p, i) => p !== currentOrder[i]);

	if (changed) {
		log(`🔄 Priority rebalance: ${newOrder.join(' → ')}`);
		log(`   Previous: ${currentOrder.join(' → ')}`);

		// Log scores for transparency
		scores.forEach((s) => {
			log(`   ${s.project}: score=${s.score} errors=${s.errorCount} success=${s.successRate}% stale=${s.stalenessFactor}x`);
		});
	}

	state.lastRebalance = new Date().toISOString();
	state.rebalanceCount = (state.rebalanceCount || 0) + 1;
	saveState(state);

	return { changed, newOrder, scores };
}

// --- Periodic Commander Check ---

let commanderInterval = null;

function startCommander() {
	// Run immediately
	try {
		const dashboard = getPortfolioDashboard();
		log(`📊 Portfolio: ${dashboard.totalProjects} projects, ${dashboard.healthyProjects} healthy, AGI score: ${dashboard.evolutionScore}`);
	} catch (e) {
		log(`Dashboard error: ${e.message}`);
	}

	// Run every 4 hours
	commanderInterval = setInterval(
		() => {
			try {
				shareCrossProjectKnowledge();
				rebalancePriorities();
				getPortfolioDashboard();
			} catch (e) {
				log(`Commander cycle error: ${e.message}`);
			}
		},
		4 * 60 * 60 * 1000,
	);
}

function stopCommander() {
	if (commanderInterval) {
		clearInterval(commanderInterval);
		commanderInterval = null;
	}
}

// --- Public API ---

module.exports = {
	scoreProjects,
	shareCrossProjectKnowledge,
	getPortfolioDashboard,
	rebalancePriorities,
	startCommander,
	stopCommander,
	loadState,
};
