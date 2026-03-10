/**
 * OpenClaw-RL Client — Continuous Reinforcement Learning Integration
 *
 * Connects CTO to a remote OpenClaw-RL server (GPU cluster) for self-improvement.
 * The RL server learns from mission outcomes (success/failure/error patterns)
 * and continuously optimizes its policy for better code generation.
 *
 * Architecture (maps to OpenClaw-RL 4-component async design):
 *   1. Rollout Collection: CC CLI conversation logs → RL server
 *   2. PRM Judging: Mission outcomes (build pass/fail) → reward signal
 *   3. Policy Training: Runs async on GPU server, never blocks CTO
 *   4. Model Serving: Updated model served at OPENCLAW_RL_HOST endpoint
 *
 * @module openclaw-rl-client
 * @version 1.0.0
 */
const config = require('../config');
const { log } = require('./brain-process-manager');
const fs = require('fs');
const path = require('path');

const RL_STATE_FILE = path.join(__dirname, '..', '.openclaw-rl-state.json');

// --- State Management ---
function loadState() {
	try {
		if (fs.existsSync(RL_STATE_FILE)) return JSON.parse(fs.readFileSync(RL_STATE_FILE, 'utf-8'));
	} catch (e) {
		/* ignore corrupt state */
	}
	return { lastDispatchTs: 0, totalFeedbacks: 0, sessions: {} };
}

function saveState(state) {
	try {
		fs.writeFileSync(RL_STATE_FILE, JSON.stringify(state, null, 2));
	} catch (e) {
		/* ignore */
	}
}

// --- Health Check ---
async function checkRLServerHealth() {
	if (!config.OPENCLAW_RL_HOST) return { online: false, reason: 'OPENCLAW_RL_HOST not configured' };
	try {
		const url = config.OPENCLAW_RL_HOST.replace(/\/v1\/?$/, '') + '/health';
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 5000);
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { Authorization: `Bearer ${config.OPENCLAW_RL_API_KEY}` },
		});
		clearTimeout(timeout);
		return { online: res.ok, status: res.status };
	} catch (e) {
		return { online: false, reason: e.message };
	}
}

// --- Reward Signal (Feedback Loop) ---
/**
 * Send reward signal to OpenClaw-RL after a mission completes.
 * Maps CTO mission outcomes to RL reward format:
 *   - Build GREEN + tests pass → positive reward (👍)
 *   - Build RED / test fail → negative reward with error context (👎)
 *   - Timeout / crash → strong negative reward
 *
 * @param {object} missionResult - Mission outcome data
 * @param {string} missionResult.project - Project name
 * @param {string} missionResult.missionId - Unique mission ID
 * @param {boolean} missionResult.success - Did mission succeed?
 * @param {string} missionResult.failureType - Type of failure (if any)
 * @param {number} missionResult.duration - Duration in ms
 * @param {object} missionResult.buildResult - Build/test results
 * @param {string} missionResult.prompt - Original prompt sent to CC CLI
 */
async function sendRewardSignal(missionResult) {
	if (!config.OPENCLAW_RL_ENABLED || !config.OPENCLAW_RL_HOST) return;

	const state = loadState();

	// Build reward message based on outcome
	let rewardContent;
	if (missionResult.success && missionResult.buildResult?.build) {
		rewardContent = '👍 Mission succeeded. Build GREEN, tests passed. Good approach.';
	} else if (missionResult.success && !missionResult.buildResult?.build) {
		rewardContent = '⚠️ Mission completed but build/tests not verified. Partial success.';
	} else if (missionResult.failureType === 'timeout') {
		rewardContent = '👎 Mission timed out. Too slow or stuck in loop. Need faster, more focused approach.';
	} else if (missionResult.failureType === 'all_workers_busy') {
		return; // Not a learning signal — just resource contention
	} else {
		const errorCtx = missionResult.buildResult?.output || missionResult.failureType || 'unknown';
		rewardContent = `👎 Mission failed: ${errorCtx}. ${missionResult.prompt ? 'You should have: ' + extractHint(missionResult) : ''}`;
	}

	try {
		const sessionId = `cto-${missionResult.project}-${Date.now()}`;
		const res = await fetch(`${config.OPENCLAW_RL_HOST}/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${config.OPENCLAW_RL_API_KEY}`,
			},
			body: JSON.stringify({
				model: config.OPENCLAW_RL_MODEL,
				messages: [
					{ role: 'user', content: missionResult.prompt || 'Mission task' },
					{ role: 'assistant', content: `Executed mission for ${missionResult.project}` },
					{ role: 'user', content: rewardContent }, // This is the "next state" feedback for RL
				],
				session_id: sessionId,
				stream: false,
			}),
		});

		state.totalFeedbacks++;
		state.lastDispatchTs = Date.now();
		state.sessions[missionResult.missionId] = {
			project: missionResult.project,
			success: missionResult.success,
			ts: Date.now(),
		};
		saveState(state);

		log(
			`[OPENCLAW-RL] 🧠 Reward signal sent: ${missionResult.success ? '👍' : '👎'} for ${missionResult.missionId} (total: ${state.totalFeedbacks})`,
		);
	} catch (e) {
		log(`[OPENCLAW-RL] ⚠️ Failed to send reward: ${e.message}`);
	}
}

/**
 * Extract a "hint" from failure context for On-Policy Distillation (OPD).
 * OpenClaw-RL uses these hints to create enhanced training signals.
 */
function extractHint(missionResult) {
	const output = missionResult.buildResult?.output || '';
	if (output.includes('SAFETY GATE')) return 'limited scope of changes, modify fewer files';
	if (output.includes('type error') || output.includes('TypeError')) return 'checked types more carefully';
	if (output.includes('test fail')) return 'run tests before committing changes';
	if (output.includes('timeout')) return 'broken the task into smaller steps';
	if (output.includes('ENOENT') || output.includes('not found')) return 'verified file paths exist before operating on them';
	return 'approached the problem differently';
}

// --- RL-Aware Routing (for Antigravity Proxy integration) ---
/**
 * Check if a mission should be routed through OpenClaw-RL model
 * instead of the default Anthropic/Gemini models.
 *
 * Only route "trial and error" type tasks through RL for learning.
 * Strategic/planning tasks stay on main models.
 */
function shouldRouteToRL(prompt, intent) {
	if (!config.OPENCLAW_RL_ENABLED) return false;

	const state = loadState();
	const elapsed = Date.now() - state.lastDispatchTs;
	if (elapsed < config.OPENCLAW_RL_COOLDOWN_MS) return false;

	// Only route execution/fix tasks — not planning or research
	if (intent === 'PLAN' || intent === 'RESEARCH' || intent === 'PRO') return false;

	// Route debug/fix tasks for maximum learning signal
	const isLearnable = /fix|debug|bug|error|broken|audit|scan/i.test(prompt);
	return isLearnable;
}

/**
 * Get OpenClaw-RL status summary for health dashboard
 */
function getRLStatus() {
	const state = loadState();
	return {
		enabled: config.OPENCLAW_RL_ENABLED,
		host: config.OPENCLAW_RL_HOST || 'NOT_CONFIGURED',
		model: config.OPENCLAW_RL_MODEL,
		feedbackMode: config.OPENCLAW_RL_FEEDBACK_MODE,
		totalFeedbacks: state.totalFeedbacks,
		lastFeedback: state.lastDispatchTs ? new Date(state.lastDispatchTs).toISOString() : 'never',
	};
}

module.exports = {
	checkRLServerHealth,
	sendRewardSignal,
	shouldRouteToRL,
	getRLStatus,
	extractHint,
};
