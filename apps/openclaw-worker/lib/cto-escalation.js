/**
 * cto-escalation.js
 * 4-level escalation ladder for stuck panes.
 *
 * Level 1 — 10min: send newline (Kickstart Protocol)
 * Level 2 — 12min: respawn with --continue
 * Level 3 — 15min: respawn with FALLBACK_MODEL_NAME
 * Level 4 — 20min: skip mission → DLQ → move to next
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DLQ_PATH = path.join(process.env.HOME || '', '.openclaw', 'dlq.jsonl');

// Per-pane escalation state: paneIdx → { startedAt, level }
const escalationState = {};

/**
 * Reset escalation state when a pane becomes idle or gets new task.
 * @param {number} paneIdx
 */
function resetEscalation(paneIdx) {
	delete escalationState[paneIdx];
}

/**
 * Start tracking escalation for a pane (call when task is injected).
 * @param {number} paneIdx
 */
function startEscalationTimer(paneIdx) {
	escalationState[paneIdx] = { startedAt: Date.now(), level: 0 };
}

/**
 * Check if escalation should fire and execute it.
 * Call this every cycle when pane state is WORKING.
 *
 * @param {number} paneIdx
 * @param {object} pane - pane config with { dir, project }
 * @param {Function} respawnPane - (paneIdx, dir, flags?) → bool
 * @param {Function} tmuxSendKeys - (paneIdx, keys) → void
 * @param {Function} log - logger
 * @param {string} fallbackModel - from config.FALLBACK_MODEL_NAME
 * @param {string} session - tmux session string
 * @returns {'escalated'|'dlq'|'idle'|null} action taken, or null if no action needed
 */
function checkEscalation(paneIdx, pane, respawnPane, tmuxSendKeys, log, fallbackModel, session) {
	const state = escalationState[paneIdx];
	if (!state) return null; // no active timer

	const elapsedMs = Date.now() - state.startedAt;
	const elapsedMin = elapsedMs / 60000;

	// Level 4: 20min → DLQ
	if (elapsedMin >= 20 && state.level < 4) {
		state.level = 4;
		log(`P${paneIdx}: ESCALATION L4 (20min) — skipping mission, writing to DLQ`);
		_writeDlq(paneIdx, pane.project, elapsedMin);
		respawnPane(paneIdx, pane.dir, '--continue');
		resetEscalation(paneIdx);
		return 'dlq';
	}

	// Level 3: 15min → respawn with fallback model
	if (elapsedMin >= 15 && state.level < 3) {
		state.level = 3;
		log(`P${paneIdx}: ESCALATION L3 (15min) — respawning with fallback model ${fallbackModel}`);
		_respawnWithModel(paneIdx, pane.dir, fallbackModel, session, log);
		return 'escalated';
	}

	// Level 2: 12min → respawn with --continue
	if (elapsedMin >= 12 && state.level < 2) {
		state.level = 2;
		log(`P${paneIdx}: ESCALATION L2 (12min) — respawning with --continue`);
		respawnPane(paneIdx, pane.dir, '--continue');
		return 'escalated';
	}

	// Level 1: 10min → send newline (Kickstart Protocol)
	if (elapsedMin >= 10 && state.level < 1) {
		state.level = 1;
		log(`P${paneIdx}: ESCALATION L1 (10min) — sending Kickstart newline`);
		tmuxSendKeys(paneIdx, 'Enter');
		return 'escalated';
	}

	return null; // no escalation needed yet
}

/**
 * Write failed mission to DLQ file.
 */
function _writeDlq(paneIdx, project, elapsedMin) {
	try {
		const dlqDir = path.dirname(DLQ_PATH);
		if (!fs.existsSync(dlqDir)) fs.mkdirSync(dlqDir, { recursive: true });
		const entry =
			JSON.stringify({
				ts: new Date().toISOString(),
				pane: paneIdx,
				project,
				elapsed_min: Math.round(elapsedMin),
				reason: 'timeout_20min',
			}) + '\n';
		fs.appendFileSync(DLQ_PATH, entry);
	} catch {
		/* DLQ write failure non-fatal */
	}
}

/**
 * Respawn pane with a specific model override via env var.
 */
function _respawnWithModel(paneIdx, dir, modelName, session, log) {
	try {
		const cmd = `MODEL_NAME=${modelName} /Users/macbookprom1/.local/bin/claude --dangerously-skip-permissions --continue`;
		execSync(`tmux respawn-pane -k -t ${session}.${paneIdx} -c '${dir}' '${cmd}'`);
	} catch (e) {
		log(`P${paneIdx}: Escalation L3 respawn failed: ${e.message}`);
	}
}

module.exports = { resetEscalation, startEscalationTimer, checkEscalation };
