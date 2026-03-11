const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Task Deduplicator — prevent duplicate mission file creation
 *
 * Causes of duplicates:
 * - Daemons running loops create identical tasks
 * - Only checking tasks/ without checking tasks/processed/
 * - When task completes → moved to processed/ → daemon recreates same task
 *
 * Solution:
 * - Check BOTH tasks/ AND tasks/processed/
 * - Dedup key format: {project}_{daemon}_{type}
 * - Max 1 task/type/project (except auto_ tasks which can have more)
 */

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours — same type task within 24h = duplicate

/**
 * Check whether a task of the same type already exists (in tasks/ AND tasks/processed/)
 * @param {string} project - Project name (e.g., 'sophia-ai-factory')
 * @param {string} daemon - Daemon name (e.g., 'hunter', 'reviewer')
 * @param {string} type - Task type (e.g., 'console_log', 'security_risk', 'type_safety')
 * @returns {boolean} - true if duplicate exists (skip task creation), false if OK to create
 */
function hasDuplicate(project, daemon, type) {
	const dedupKey = `${project}_${daemon}_${type.toLowerCase()}`;

	try {
		// Check BOTH tasks/ and tasks/processed/
		const tasksDir = path.join(config.MEKONG_DIR, 'tasks');
		const processedDir = path.join(config.MEKONG_DIR, 'tasks', 'processed');

		// Helper: check files trong 1 directory
		const checkDir = (dir) => {
			if (!fs.existsSync(dir)) return false;
			const files = fs.readdirSync(dir);

			return files.some((f) => {
				if (!f.endsWith('.txt')) return false;
				if (!f.includes(dedupKey)) return false;

				// Check timestamp if present (format: _TIMESTAMP.txt)
				const match = f.match(/_(\d{13})\.txt$/);
				if (match) {
					const fileTimestamp = parseInt(match[1], 10);
					const age = Date.now() - fileTimestamp;
					if (age > DEDUP_WINDOW_MS) {
						// File too old (>24h) — not considered a duplicate
						return false;
					}
				}

				return true; // Found duplicate
			});
		};

		// Check both dirs
		const foundInTasks = checkDir(tasksDir);
		const foundInProcessed = checkDir(processedDir);

		return foundInTasks || foundInProcessed;
	} catch (e) {
		// On error (e.g., dir does not exist) → fail-safe: do not block
		console.error(`[DEDUP] Error checking duplicate: ${e.message}`);
		return false;
	}
}

/**
 * Get dedup key from filename
 * @param {string} filename - Mission file name
 * @returns {string|null} - Dedup key or null if unable to parse
 */
function getKeyFromFilename(filename) {
	// Format: mission_{project}_{daemon}_{type}_{timestamp}.txt
	// or: {PRIORITY}_mission_{project}_{daemon}_{type}_{timestamp}.txt
	const match = filename.match(/mission_([^_]+)_([^_]+)_([^_]+)_\d+\.txt$/);
	if (!match) return null;

	const [, project, daemon, type] = match;
	return `${project}_${daemon}_${type}`;
}

/**
 * Count current tasks for a project
 * @param {string} project - Project name
 * @returns {number} - Number of unprocessed tasks
 */
function countPendingTasks(project) {
	try {
		const tasksDir = path.join(config.MEKONG_DIR, 'tasks');
		if (!fs.existsSync(tasksDir)) return 0;

		const files = fs.readdirSync(tasksDir);
		return files.filter((f) => f.includes(project) && f.endsWith('.txt')).length;
	} catch (e) {
		return 0;
	}
}

module.exports = {
	hasDuplicate,
	getKeyFromFilename,
	countPendingTasks,
	DEDUP_WINDOW_MS,
};
