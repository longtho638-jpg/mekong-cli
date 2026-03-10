/**
 * cto-progress-tracker.js
 * Writes structured JSON progress to /tmp/tom_hum_mission_P{N}.json
 * on inject (RUNNING) and on completion detection (COMPLETED).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const PROGRESS_DIR = '/tmp';

function progressFile(paneIdx) {
	return path.join(PROGRESS_DIR, `tom_hum_mission_P${paneIdx}.json`);
}

/**
 * Write RUNNING status when task is injected.
 * @param {number} paneIdx
 * @param {string} project
 * @param {string} taskCmd
 */
function trackRunning(paneIdx, project, taskCmd) {
	const payload = {
		pane: paneIdx,
		project,
		task_summary: taskCmd.slice(0, 120),
		started_at: new Date().toISOString(),
		status: 'RUNNING',
	};
	try {
		fs.writeFileSync(progressFile(paneIdx), JSON.stringify(payload, null, 2));
	} catch {
		/* /tmp write failure is non-fatal */
	}
}

/**
 * Write COMPLETED status when completion pattern detected.
 * @param {number} paneIdx
 * @param {string} project
 * @param {string} taskCmd
 */
function trackCompleted(paneIdx, project, taskCmd) {
	const existing = readProgress(paneIdx);
	const payload = {
		pane: paneIdx,
		project: existing?.project || project,
		task_summary: existing?.task_summary || taskCmd.slice(0, 120),
		started_at: existing?.started_at || new Date().toISOString(),
		completed_at: new Date().toISOString(),
		status: 'COMPLETED',
	};
	try {
		fs.writeFileSync(progressFile(paneIdx), JSON.stringify(payload, null, 2));
	} catch {}
}

/**
 * Write IDLE status (no active task).
 * @param {number} paneIdx
 * @param {string} project
 */
function trackIdle(paneIdx, project) {
	const payload = {
		pane: paneIdx,
		project,
		task_summary: null,
		started_at: null,
		status: 'IDLE',
	};
	try {
		fs.writeFileSync(progressFile(paneIdx), JSON.stringify(payload, null, 2));
	} catch {}
}

/**
 * Read current progress JSON for a pane (returns null on error).
 * @param {number} paneIdx
 * @returns {object|null}
 */
function readProgress(paneIdx) {
	try {
		return JSON.parse(fs.readFileSync(progressFile(paneIdx), 'utf-8'));
	} catch {
		return null;
	}
}

/**
 * Read progress for all panes (P1–P3 by default).
 * @param {number[]} paneIdxs
 * @returns {object[]}
 */
function readAllProgress(paneIdxs) {
	return paneIdxs.map((idx) => readProgress(idx) || { pane: idx, project: '?', task_summary: null, status: 'UNKNOWN' });
}

module.exports = { trackRunning, trackCompleted, trackIdle, readProgress, readAllProgress };
