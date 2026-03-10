'use strict';

/**
 * 🏭 Production Board — Toyota Production System (TPS)
 *
 * Persistent Work Order management with 5W1H tracking.
 * Storage: data/production-board.json
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const BOARD_FILE = path.join(DATA_DIR, 'production-board.json');

const STATUSES = ['queued', 'assigned', 'in_progress', 'review', 'done', 'verified'];

function ensureDataDir() {
	if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadBoard() {
	ensureDataDir();
	try {
		return JSON.parse(fs.readFileSync(BOARD_FILE, 'utf-8'));
	} catch {
		return { workOrders: [], meta: { created: new Date().toISOString(), version: 1 } };
	}
}

function saveBoard(board) {
	ensureDataDir();
	fs.writeFileSync(BOARD_FILE, JSON.stringify(board, null, 2));
}

function generateId(project) {
	const d = new Date();
	const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
	const seq = String(Math.floor(Math.random() * 999)).padStart(3, '0');
	return `WO-${ds}-${seq}`;
}

/**
 * Create a new Work Order with 5W1H.
 */
function createWorkOrder(project, { what, why, where, how, priority = 'HIGH', taktTime = 60, dependencies = [] }) {
	const board = loadBoard();
	const wo = {
		id: generateId(project),
		project,
		who: null,
		what: what || '',
		when: {
			created: new Date().toISOString(),
			assigned: null,
			estimatedDone: null,
			actualDone: null,
		},
		where: where || '',
		why: why || '',
		how: how || '',
		status: 'queued',
		progress: 0,
		priority,
		dependencies,
		blockers: [],
		taktTime, // minutes
	};
	board.workOrders.push(wo);
	saveBoard(board);
	return wo;
}

/**
 * Bulk create Work Orders from decomposition.
 */
function bulkCreate(project, woArray) {
	const board = loadBoard();
	const created = [];
	for (const data of woArray) {
		const wo = {
			id: generateId(project),
			project,
			who: null,
			what: data.what || '',
			when: { created: new Date().toISOString(), assigned: null, estimatedDone: null, actualDone: null },
			where: data.where || '',
			why: data.why || '',
			how: data.how || '',
			status: 'queued',
			progress: 0,
			priority: data.priority || 'HIGH',
			dependencies: data.dependencies || [],
			blockers: [],
			taktTime: data.taktTime || 60,
		};
		board.workOrders.push(wo);
		created.push(wo);
	}
	saveBoard(board);
	return created;
}

/**
 * Assign a Work Order to a pane (worker).
 */
function assignToPane(woId, paneIdx) {
	const board = loadBoard();
	const wo = board.workOrders.find((w) => w.id === woId);
	if (!wo) return null;
	wo.who = `P${paneIdx}`;
	wo.status = 'assigned';
	wo.when.assigned = new Date().toISOString();
	// Estimate completion: assigned + taktTime
	const est = new Date(Date.now() + wo.taktTime * 60000);
	wo.when.estimatedDone = est.toISOString();
	saveBoard(board);
	return wo;
}

/**
 * Update progress and optionally status.
 */
function updateProgress(woId, progress, status = null) {
	const board = loadBoard();
	const wo = board.workOrders.find((w) => w.id === woId);
	if (!wo) return null;
	wo.progress = Math.min(100, Math.max(0, progress));
	if (status && STATUSES.includes(status)) wo.status = status;
	if (wo.progress >= 100 && wo.status !== 'done' && wo.status !== 'verified') {
		wo.status = 'done';
		wo.when.actualDone = new Date().toISOString();
	}
	saveBoard(board);
	return wo;
}

/**
 * Mark a WO as complete.
 */
function markDone(woId) {
	return updateProgress(woId, 100, 'done');
}

/**
 * Get the full production board.
 */
function getBoard() {
	return loadBoard();
}

/**
 * Get all WOs for a project.
 */
function getByProject(project) {
	const board = loadBoard();
	return board.workOrders.filter((w) => w.project === project);
}

/**
 * Get active WO for a pane.
 */
function getActiveByPane(paneIdx) {
	const board = loadBoard();
	const who = `P${paneIdx}`;
	return board.workOrders.find((w) => w.who === who && !['done', 'verified'].includes(w.status)) || null;
}

/**
 * Get next queued WO for a project (respects dependencies).
 */
function getNextQueued(project = null) {
	const board = loadBoard();
	const candidates = board.workOrders.filter((w) => {
		if (w.status !== 'queued') return false;
		if (project && w.project !== project) return false;
		// Check all dependencies are done
		if (w.dependencies.length > 0) {
			const allDone = w.dependencies.every((depId) => {
				const dep = board.workOrders.find((d) => d.id === depId);
				return dep && ['done', 'verified'].includes(dep.status);
			});
			if (!allDone) return false;
		}
		return true;
	});
	// Sort by priority
	const prio = { CRITICAL: 0, HIGH: 1, MED: 2, LOW: 3 };
	candidates.sort((a, b) => (prio[a.priority] || 9) - (prio[b.priority] || 9));
	return candidates[0] || null;
}

/**
 * Get overdue WOs (past estimatedDone but not done).
 */
function getOverdue() {
	const board = loadBoard();
	const now = new Date();
	return board.workOrders.filter((w) => {
		if (['done', 'verified', 'queued'].includes(w.status)) return false;
		if (w.when.estimatedDone && new Date(w.when.estimatedDone) < now) return true;
		return false;
	});
}

/**
 * Summary stats for dashboard.
 */
function getStats() {
	const board = loadBoard();
	const wos = board.workOrders;
	const stats = { total: wos.length, queued: 0, assigned: 0, in_progress: 0, review: 0, done: 0, verified: 0, overdue: 0 };
	const now = new Date();
	for (const w of wos) {
		stats[w.status] = (stats[w.status] || 0) + 1;
		if (!['done', 'verified', 'queued'].includes(w.status) && w.when.estimatedDone && new Date(w.when.estimatedDone) < now) {
			stats.overdue++;
		}
	}
	return stats;
}

/**
 * Gantt data for a project.
 */
function getGanttData(project) {
	const wos = getByProject(project);
	return wos.map((w) => ({
		id: w.id,
		what: w.what.slice(0, 50),
		who: w.who,
		status: w.status,
		progress: w.progress,
		start: w.when.assigned || w.when.created,
		end: w.when.actualDone || w.when.estimatedDone || null,
		taktTime: w.taktTime,
		deps: w.dependencies,
	}));
}

module.exports = {
	createWorkOrder,
	bulkCreate,
	assignToPane,
	updateProgress,
	markDone,
	getBoard,
	getByProject,
	getActiveByPane,
	getNextQueued,
	getOverdue,
	getStats,
	getGanttData,
	STATUSES,
};
