/**
 * 🖥️ CTO Visual Dashboard v2 — Đa Luồng Real-Time Status
 *
 * Renders live worker status in tmux status bar + optional terminal dashboard.
 * Chairman can SEE all workers running parallel at a glance.
 *
 * Architecture:
 *   - Polls all tmux panes every 3s
 *   - Updates tmux status-right with worker states
 *   - Writes status to ~/tom_hum_dashboard.log for external monitoring
 *
 * 始計 (Thủy Kế): Nhìn toàn cục → ra quyết định chính xác
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');

const TMUX_SESSION = 'tom_hum_brain';
const DASHBOARD_LOG = path.join(process.env.HOME || '', 'tom_hum_dashboard.log');
const POLL_INTERVAL_MS = 3000; // 3s refresh

// State icons
const ICONS = {
	busy: '🔴',
	idle: '🟢',
	complete: '✅',
	question: '🟡',
	context_limit: '🟠',
	dead: '💀',
	unknown: '⚪',
};

// --- Helpers ---

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [dashboard] ${msg}`;
	try {
		fs.appendFileSync(config.LOG_FILE, line + '\n');
	} catch (e) {}
}

function stripAnsi(text) {
	return text.replace(/\x1B\[[0-9;]*[mGKHJF]/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Busy patterns (mirror from brain-process-manager.js)
const BUSY_PATTERNS = [
	/Photosynthesizing/i,
	/Crunching/i,
	/Saut[eé]ing/i,
	/Marinating/i,
	/Fermenting/i,
	/Braising/i,
	/Reducing/i,
	/Blanching/i,
	/Thinking/i,
	/Churning/i,
	/Cooking/i,
	/Toasting/i,
	/Simmering/i,
	/Glazing/i,
	/Caramelizing/i,
	/Mixing/i,
	/Measuring/i,
	/Whisking/i,
	/Basting/i,
	/Resting/i,
	/Grilling/i,
	/Zesting/i,
	/Seasoning/i,
	/Flipping/i,
	/Steaming/i,
	/Kneading/i,
	/Rolling/i,
	/Proofing/i,
	/Broiling/i,
	/Folding/i,
	/Metamorphosing/i,
	/Herding/i,
	/Elucidating/i,
];

const COMPLETION_PATTERNS = [/✻\s+\w+(?:ed|t)\s+for\s+\d+/i];

const QUESTION_PATTERNS = [
	/Do you want to run/i,
	/Do you want to proceed/i,
	/\(y\/n\)/i,
	/\[y\/n\]/i,
	/bypass permissions/i,
	/Compacting conversation/i,
	/Context left until auto-compact:\s*0%/i,
];

function detectPaneState(output) {
	const clean = stripAnsi(output);
	const lastLines = clean.split('\n').slice(-15).join('\n');

	if (BUSY_PATTERNS.some((p) => p.test(lastLines))) return 'busy';
	if (COMPLETION_PATTERNS.some((p) => p.test(lastLines))) return 'complete';
	if (QUESTION_PATTERNS.some((p) => p.test(lastLines))) return 'question';
	if (/❯|>/.test(lastLines) && !/Compacting/i.test(lastLines)) return 'idle';
	return 'unknown';
}

// --- Core: Poll all workers ---

function getWorkerStates() {
	const teamSize = config.AGENT_TEAM_SIZE_DEFAULT || 4;
	const states = [];

	for (let i = 0; i < teamSize; i++) {
		try {
			const output = execSync(`tmux capture-pane -t ${TMUX_SESSION}:0.${i} -p 2>/dev/null`, { encoding: 'utf-8', timeout: 2000 });
			const state = detectPaneState(output);

			// Check if worker has active lock file
			const lockFile = path.join(__dirname, '..', `.mission-active-P${i}.lock`);
			let missionInfo = null;
			if (fs.existsSync(lockFile)) {
				try {
					missionInfo = fs.readFileSync(lockFile, 'utf-8').trim();
					const lockAge = Date.now() - fs.statSync(lockFile).mtimeMs;
					missionInfo = `${Math.round(lockAge / 1000)}s`;
				} catch (e) {}
			}

			states.push({
				idx: i,
				state,
				icon: ICONS[state] || ICONS.unknown,
				locked: !!missionInfo,
				elapsed: missionInfo,
			});
		} catch (e) {
			states.push({
				idx: i,
				state: 'dead',
				icon: ICONS.dead,
				locked: false,
				elapsed: null,
			});
		}
	}

	return states;
}

// --- Render: tmux status bar ---

function renderStatusBar(states) {
	// Format: P1:🔴(35s) P2:🟢 P3:🔴(12s)
	const parts = states.map((s) => {
		const label = `P${s.idx}`;
		if (s.locked && s.elapsed) {
			return `${label}:${s.icon}(${s.elapsed})`;
		}
		return `${label}:${s.icon}`;
	});

	return parts.join(' ');
}

function updateTmuxStatusBar(statusText) {
	try {
		// Count active/total
		const states = getWorkerStates();
		const active = states.filter((s) => s.state === 'busy' || s.locked).length;
		const total = states.length;

		const fullStatus = `🦞 CTO v2 [${active}/${total}] ${statusText}`;

		execSync(`tmux set-option -t ${TMUX_SESSION} status-right "${fullStatus}" 2>/dev/null`, {
			timeout: 2000,
		});
	} catch (e) {
		// tmux not available
	}
}

// --- Render: Dashboard log ---

function writeDashboardLog(states) {
	const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
	const active = states.filter((s) => s.state === 'busy' || s.locked).length;
	const total = states.length;
	const statusLine = renderStatusBar(states);

	// Metrics from token-tracker
	let metrics = '';
	try {
		const { getDailyUsage } = require('./token-tracker');
		const daily = getDailyUsage();
		metrics = ` | Tokens: ${Math.round(daily.tokens / 1000)}k | Missions: ${daily.missions}`;
	} catch (e) {}

	// 🧬 Level 8: Perception quality stats
	let qualityMetrics = '';
	try {
		const { getPerceptionStats } = require('./perception-engine');
		const stats = getPerceptionStats();
		if (stats.totalMissions > 0) {
			qualityMetrics = ` | Quality: ${stats.avgScore} ${stats.trend}`;
		}

		const line = `[${ts}] [${active}/${total} active] ${statusLine}${metrics}${qualityMetrics}\n`;

		try {
			// Keep log small — truncate at 500 lines
			if (fs.existsSync(DASHBOARD_LOG)) {
				const existing = fs.readFileSync(DASHBOARD_LOG, 'utf-8');
				const lines = existing.split('\n');
				if (lines.length > 500) {
					fs.writeFileSync(DASHBOARD_LOG, lines.slice(-250).join('\n'));
				}
			}
			fs.appendFileSync(DASHBOARD_LOG, line);
		} catch (e) {}
	} catch (e) {}
}

// --- Main loop ---

let dashboardTimer = null;

function dashboardCycle() {
	try {
		const states = getWorkerStates();
		const statusText = renderStatusBar(states);

		// Update tmux status bar
		updateTmuxStatusBar(statusText);

		// Write to dashboard log
		writeDashboardLog(states);
	} catch (e) {
		log(`Dashboard error: ${e.message}`);
	}
}

function startDashboard() {
	if (dashboardTimer) return;
	log('🖥️ CTO Visual Dashboard v2 started (3s refresh)');

	// Configure tmux for dashboard
	try {
		execSync(`tmux set-option -t ${TMUX_SESSION} status on 2>/dev/null`);
		execSync(`tmux set-option -t ${TMUX_SESSION} status-interval 3 2>/dev/null`);
		execSync(`tmux set-option -t ${TMUX_SESSION} status-right-length 80 2>/dev/null`);
		execSync(`tmux set-option -t ${TMUX_SESSION} status-style "bg=#1a1a2e,fg=#e94560" 2>/dev/null`);
		execSync(`tmux set-option -t ${TMUX_SESSION} status-left " 🦞 TÔM HÙM " 2>/dev/null`);
		execSync(`tmux set-option -t ${TMUX_SESSION} status-left-style "bg=#e94560,fg=#1a1a2e,bold" 2>/dev/null`);

		// Set pane border to show titles
		execSync(`tmux set-option -t ${TMUX_SESSION} pane-border-status top 2>/dev/null`);
		execSync(`tmux set-option -t ${TMUX_SESSION} pane-border-format " #{pane_index}: #{pane_title} " 2>/dev/null`);
		execSync(`tmux set-option -t ${TMUX_SESSION} pane-active-border-style "fg=#e94560" 2>/dev/null`);
		execSync(`tmux set-option -t ${TMUX_SESSION} pane-border-style "fg=#333333" 2>/dev/null`);
	} catch (e) {
		log(`Dashboard tmux config error: ${e.message}`);
	}

	// Start polling
	function scheduleNext() {
		dashboardTimer = setTimeout(() => {
			dashboardCycle();
			scheduleNext();
		}, POLL_INTERVAL_MS);
	}

	// First cycle after 5s
	dashboardTimer = setTimeout(() => {
		dashboardCycle();
		scheduleNext();
	}, 5000);
}

function stopDashboard() {
	if (dashboardTimer) {
		clearTimeout(dashboardTimer);
		dashboardTimer = null;
		log('🖥️ CTO Visual Dashboard stopped');
	}
}

module.exports = { startDashboard, stopDashboard, getWorkerStates, renderStatusBar };
