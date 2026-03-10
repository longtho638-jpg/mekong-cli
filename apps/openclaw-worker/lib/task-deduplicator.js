const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Task Deduplicator — chống tạo duplicate mission files
 *
 * Nguyên nhân duplicate:
 * - Daemons chạy loop tạo tasks giống nhau
 * - Chỉ check tasks/ mà không check tasks/processed/
 * - Khi task complete → move vào processed/ → daemon tạo lại task giống
 *
 * Giải pháp:
 * - Check BOTH tasks/ VÀ tasks/processed/
 * - Dedup key format: {project}_{daemon}_{type}
 * - Tối đa 1 task/type/project (ngoại trừ auto_ tasks có thể nhiều hơn)
 */

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 giờ — task cùng type trong 24h = duplicate

/**
 * Check xem đã có task cùng type chưa (trong tasks/ VÀ tasks/processed/)
 * @param {string} project - Tên project (e.g., 'sophia-ai-factory')
 * @param {string} daemon - Tên daemon (e.g., 'hunter', 'reviewer')
 * @param {string} type - Loại task (e.g., 'console_log', 'security_risk', 'type_safety')
 * @returns {boolean} - true nếu đã có duplicate (skip tạo task), false nếu OK tạo task
 */
function hasDuplicate(project, daemon, type) {
	const dedupKey = `${project}_${daemon}_${type.toLowerCase()}`;

	try {
		// Check BOTH tasks/ và tasks/processed/
		const tasksDir = path.join(config.MEKONG_DIR, 'tasks');
		const processedDir = path.join(config.MEKONG_DIR, 'tasks', 'processed');

		// Helper: check files trong 1 directory
		const checkDir = (dir) => {
			if (!fs.existsSync(dir)) return false;
			const files = fs.readdirSync(dir);

			return files.some((f) => {
				if (!f.endsWith('.txt')) return false;
				if (!f.includes(dedupKey)) return false;

				// Check timestamp nếu có (format: _TIMESTAMP.txt)
				const match = f.match(/_(\d{13})\.txt$/);
				if (match) {
					const fileTimestamp = parseInt(match[1], 10);
					const age = Date.now() - fileTimestamp;
					if (age > DEDUP_WINDOW_MS) {
						// File quá cũ (>24h) — không coi là duplicate
						return false;
					}
				}

				return true; // Found duplicate
			});
		};

		// Check cả 2 dirs
		const foundInTasks = checkDir(tasksDir);
		const foundInProcessed = checkDir(processedDir);

		return foundInTasks || foundInProcessed;
	} catch (e) {
		// Nếu error (e.g., dir không tồn tại) → fail-safe: không block
		console.error(`[DEDUP] Error checking duplicate: ${e.message}`);
		return false;
	}
}

/**
 * Get dedup key từ filename
 * @param {string} filename - Tên file mission
 * @returns {string|null} - Dedup key hoặc null nếu không parse được
 */
function getKeyFromFilename(filename) {
	// Format: mission_{project}_{daemon}_{type}_{timestamp}.txt
	// hoặc: {PRIORITY}_mission_{project}_{daemon}_{type}_{timestamp}.txt
	const match = filename.match(/mission_([^_]+)_([^_]+)_([^_]+)_\d+\.txt$/);
	if (!match) return null;

	const [, project, daemon, type] = match;
	return `${project}_${daemon}_${type}`;
}

/**
 * Count số task hiện tại của một project
 * @param {string} project - Tên project
 * @returns {number} - Số lượng task chưa xử lý
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
