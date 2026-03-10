/**
 * cto-dashboard-logger.js
 * Prints ASCII dashboard table of pane states + RAM/load summary each cycle.
 */

'use strict';

const { execSync } = require('child_process');
const { readAllProgress } = require('./cto-progress-tracker');
const { getRamPolicy } = require('./cto-ram-policy');
const { PANE_ROLES } = require('./cto-task-dispatch');

/**
 * Print dashboard table to log.
 * @param {number[]} workerPaneIdxs - e.g. [1, 2, 3]
 * @param {Function} log
 */
function printDashboard(workerPaneIdxs, log) {
	const progList = readAllProgress(workerPaneIdxs);
	const { freeRamMB, maxWorkers } = getRamPolicy();

	let loadAvg = '?';
	try {
		loadAvg = execSync('sysctl -n vm.loadavg 2>/dev/null', { encoding: 'utf-8' }).trim().replace(/[{}]/g, '').trim().split(' ')[0];
	} catch {}

	const W = { pane: 4, role: 12, project: 10, task: 18, elapsed: 7, status: 10 };
	const hr = (c1, c2, c3) =>
		`${c1}${'─'.repeat(W.pane + 2)}${c2}${'─'.repeat(W.role + 2)}${c2}${'─'.repeat(W.project + 2)}${c2}${'─'.repeat(W.task + 2)}${c2}${'─'.repeat(W.elapsed + 2)}${c2}${'─'.repeat(W.status + 2)}${c3}`;
	const cell = (s, w) =>
		String(s == null ? '—' : s)
			.slice(0, w)
			.padEnd(w);
	const row = (p, rl, proj, task, el, st) =>
		`│ ${cell(p, W.pane)} │ ${cell(rl, W.role)} │ ${cell(proj, W.project)} │ ${cell(task, W.task)} │ ${cell(el, W.elapsed)} │ ${cell(st, W.status)} │`;

	const lines = [hr('┌', '┬', '┐'), row('Pane', 'Role', 'Project', 'Task', 'Elapsed', 'Status'), hr('├', '┼', '┤')];

	for (const p of progList) {
		let elapsed = '—';
		if (p.started_at && p.status === 'RUNNING') {
			const ms = Date.now() - new Date(p.started_at).getTime();
			elapsed = `${Math.round(ms / 60000)}m`;
		}
		const statusLabel = p.status === 'RUNNING' ? 'WORKING' : p.status || 'UNKNOWN';
		const roleName = (PANE_ROLES[p.pane] || {}).role || 'generic';
		lines.push(row(`P${p.pane}`, roleName, p.project, p.task_summary, elapsed, statusLabel));
	}

	lines.push(hr('└', '┴', '┘'));
	const ramGB = (freeRamMB / 1024).toFixed(1);
	lines.push(`RAM: ${ramGB}GB free | Workers: ${maxWorkers}/3 | Load: ${loadAvg}`);

	log('\n' + lines.join('\n'));
}

module.exports = { printDashboard };
