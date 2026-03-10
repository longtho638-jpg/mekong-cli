/**
 * ClawWork Integration — AGI L11 Economic Benchmark
 *
 * 📜 Binh Pháp Ch.2 作戰: 「凡用兵之法，馳車千駟，革車千乘，帶甲十萬，千里饋糧」
 *    "The cost of war must be calculated" — Every mission has an economic value.
 *
 * Bridges @mekong/clawwork into openclaw-worker's auto-CTO pipeline.
 * Generates economic benchmark missions when quality tasks are exhausted.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-process-manager');

const CLAWWORK_PKG = path.join(config.MEKONG_DIR, 'packages/mekong-clawwork');
const TRACKER_FILE = path.join(CLAWWORK_PKG, 'data', 'economic-tracker.json');

let _bridge = null;

function getBridge() {
	if (_bridge) return _bridge;
	try {
		const { ClawWorkBridge } = require(path.join(CLAWWORK_PKG, 'index.js'));
		_bridge = new ClawWorkBridge({
			balanceFile: TRACKER_FILE,
			tasksDir: path.join(CLAWWORK_PKG, 'data'),
		});
		return _bridge;
	} catch (e) {
		log(`[CLAWWORK] Failed to load bridge: ${e.message}`);
		return null;
	}
}

/**
 * Load tracker state from disk.
 */
function loadTracker() {
	try {
		if (fs.existsSync(TRACKER_FILE)) {
			return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
		}
	} catch (e) {}
	return { balance: 1000, totalMissions: 0, completedIds: [] };
}

function saveTracker(state) {
	try {
		fs.writeFileSync(TRACKER_FILE, JSON.stringify(state, null, 2));
	} catch (e) {}
}

/**
 * Generate next economic benchmark mission.
 * Called by auto-cto-pilot when all projects are GREEN.
 * @returns {{ filename: string, prompt: string } | null}
 */
function generateEconomicMission() {
	const bridge = getBridge();
	if (!bridge) return null;

	try {
		const tasks = bridge.loadTasks();
		const tracker = loadTracker();
		const remaining = tasks.filter((t) => !tracker.completedIds.includes(t.id));

		if (remaining.length === 0) {
			log(`[CLAWWORK] All ${tasks.length} GDPVal tasks completed!`);
			return null;
		}

		const task = remaining[0];
		const prompt = bridge.generateMission(task);
		const filename = `mission_clawwork_${task.id}_${Date.now()}.txt`;

		tracker.totalMissions++;
		saveTracker(tracker);

		log(`[CLAWWORK] Generated economic mission: ${task.id} (${task.sector}) — $${task.maxPayment} budget`);
		return { filename, prompt };
	} catch (e) {
		log(`[CLAWWORK] Mission generation failed: ${e.message}`);
		return null;
	}
}

/**
 * Record mission completion for economic tracking.
 * Called from task-queue.js after a ClawWork mission completes.
 */
function recordEconomicCompletion(taskId, success, elapsedSec) {
	const bridge = getBridge();
	if (!bridge) return;

	try {
		const quality = success ? 0.8 : 0.2;
		const cost = elapsedSec * 0.01; // Rough cost estimate based on time
		bridge.recordCompletion(taskId, quality, cost);

		const tracker = loadTracker();
		if (success && !tracker.completedIds.includes(taskId)) {
			tracker.completedIds.push(taskId);
		}
		saveTracker(tracker);

		log(`[CLAWWORK] Recorded completion: ${taskId} — quality:${quality} cost:$${cost.toFixed(2)}`);
	} catch (e) {
		log(`[CLAWWORK] Record failed: ${e.message}`);
	}
}

/**
 * Get economic stats summary for AGI score integration.
 */
function getEconomicStats() {
	const tracker = loadTracker();
	const bridge = getBridge();
	let totalTasks = 0;
	try {
		if (bridge) totalTasks = bridge.loadTasks().length;
	} catch (e) {}

	return {
		balance: tracker.balance,
		totalMissions: tracker.totalMissions,
		completedTasks: tracker.completedIds.length,
		totalTasks,
		completionRate: totalTasks > 0 ? ((tracker.completedIds.length / totalTasks) * 100).toFixed(1) : '0.0',
	};
}

module.exports = { generateEconomicMission, recordEconomicCompletion, getEconomicStats };
