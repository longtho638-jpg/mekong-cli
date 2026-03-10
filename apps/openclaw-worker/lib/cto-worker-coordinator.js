/**
 * cto-worker-coordinator.js
 * Inter-worker dependency tracking via ~/.openclaw/dependencies.json
 *
 * Format:
 * {
 *   "P1-task-id": { "depends_on": null, "blocks": ["P2-task-id"] },
 *   "P2-task-id": { "depends_on": "P1-task-id", "blocks": [] }
 * }
 *
 * Before dispatch: check if task's depends_on is completed.
 * On complete: remove from deps, unblock dependents.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const DEPS_FILE = path.join(process.env.HOME || '', '.openclaw', 'dependencies.json');

/**
 * Read current dependency map (returns {} on error).
 * @returns {object}
 */
function readDeps() {
	try {
		return JSON.parse(fs.readFileSync(DEPS_FILE, 'utf-8'));
	} catch {
		return {};
	}
}

/**
 * Write dependency map atomically.
 * @param {object} deps
 */
function writeDeps(deps) {
	try {
		const dir = path.dirname(DEPS_FILE);
		if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
		fs.writeFileSync(DEPS_FILE, JSON.stringify(deps, null, 2));
	} catch {
		/* write failure non-fatal */
	}
}

/**
 * Check if a task can be dispatched (no pending dependency).
 * Returns true if no dependency entry exists or dependency is resolved.
 *
 * @param {string} taskId - e.g. "P1-algo-047"
 * @param {Function} log
 * @returns {boolean}
 */
function canDispatch(taskId, log) {
	const deps = readDeps();
	const entry = deps[taskId];
	if (!entry || !entry.depends_on) return true;

	const blockerResolved = !deps[entry.depends_on];
	if (!blockerResolved) {
		log(`COORDINATOR: ${taskId} blocked by ${entry.depends_on} — skipping dispatch`);
		return false;
	}
	return true;
}

/**
 * Mark a task as complete: remove it from deps, unblock all tasks it was blocking.
 * @param {string} taskId
 * @param {Function} log
 */
function markComplete(taskId, log) {
	const deps = readDeps();
	if (!deps[taskId]) return;

	const { blocks = [] } = deps[taskId];
	delete deps[taskId];

	// Remove the completed task from any blocker references
	for (const blockedId of blocks) {
		if (deps[blockedId] && deps[blockedId].depends_on === taskId) {
			deps[blockedId] = { ...deps[blockedId], depends_on: null };
			log(`COORDINATOR: ${blockedId} unblocked (${taskId} completed)`);
		}
	}

	writeDeps(deps);
}

/**
 * Register a new dependency relationship.
 * @param {string} taskId
 * @param {string|null} dependsOn
 * @param {string[]} blocks
 */
function registerDependency(taskId, dependsOn, blocks = []) {
	const deps = readDeps();
	deps[taskId] = { depends_on: dependsOn || null, blocks };
	writeDeps(deps);
}

module.exports = { canDispatch, markComplete, registerDependency, readDeps };
