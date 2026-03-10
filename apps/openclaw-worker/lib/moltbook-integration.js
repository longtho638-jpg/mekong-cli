/**
 * Moltbook Integration — AGI L12 Agent Social Identity
 *
 * 📜 Binh Pháp Ch.13 用間: 「故明君賢將，所以動而勝人」
 *    "The enlightened sovereign moves and conquers" — identity is power.
 *
 * Connects Tôm Hùm to Moltbook agent social network:
 * - Boot: heartbeat + profile update
 * - Mission complete: post summary
 * - Shutdown: final status update
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { log } = require('./brain-process-manager');

const MOLTBOOK_PKG = path.join(config.MEKONG_DIR, 'packages/mekong-moltbook');
const STATE_FILE = path.join(config.MEKONG_DIR, 'apps/openclaw-worker/data', 'moltbook-state.json');
const POST_COOLDOWN_MS = 30 * 60 * 1000; // 30min rate limit

let _client = null;
let _lastPostTime = 0;

function getClient() {
	if (_client) return _client;
	const apiKey = process.env.MOLTBOOK_API_KEY;
	if (!apiKey) {
		log('[MOLTBOOK] No MOLTBOOK_API_KEY — agent identity OFFLINE');
		return null;
	}
	try {
		const { MoltbookClient } = require(path.join(MOLTBOOK_PKG, 'index.js'));
		_client = new MoltbookClient({ apiKey });
		return _client;
	} catch (e) {
		log(`[MOLTBOOK] Failed to load client: ${e.message}`);
		return null;
	}
}

function loadState() {
	try {
		if (fs.existsSync(STATE_FILE)) return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
	} catch (e) {}
	return { registered: false, totalPosts: 0, lastHeartbeat: null, agentId: null };
}

function saveState(state) {
	try {
		fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
	} catch (e) {}
}

/**
 * Boot sequence: heartbeat + profile update.
 * Called from task-watcher.js on daemon start.
 */
async function onDaemonBoot(agiScore) {
	const client = getClient();
	if (!client) return;

	try {
		// Heartbeat
		const hb = await client.heartbeat();
		log(`[MOLTBOOK] Heartbeat OK — fetched at ${hb.fetchedAt}`);

		// Update profile with current AGI score
		await client.updateProfile({
			description: `Tôm Hùm AGI — Autonomous CTO Daemon | AGI Score: ${agiScore}/100 | Mekong-CLI`,
			metadata: { agiScore, runtime: 'node', version: 'v2026.2.28' },
		});
		log(`[MOLTBOOK] Profile updated — AGI Score: ${agiScore}`);

		const state = loadState();
		state.lastHeartbeat = new Date().toISOString();
		saveState(state);
	} catch (e) {
		log(`[MOLTBOOK] Boot failed (non-fatal): ${e.message}`);
	}
}

/**
 * Post mission summary to Moltbook.
 * Rate-limited to 1 post per 30 minutes.
 */
async function postMissionSummary(missionId, project, success, elapsedSec) {
	const client = getClient();
	if (!client) return;

	// Rate limit
	if (Date.now() - _lastPostTime < POST_COOLDOWN_MS) return;

	try {
		const status = success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI';
		const title = `[Tôm Hùm] Mission ${missionId} — ${status}`;
		const body = [
			`**Project:** ${project}`,
			`**Kết quả:** ${status}`,
			`**Thời gian:** ${elapsedSec}s`,
			`**Timestamp:** ${new Date().toISOString()}`,
			'',
			'_Tự động post bởi Tôm Hùm AGI — Mekong-CLI Autonomous CTO_',
		].join('\n');

		await client.createPost(title, body, 'ai-agents');
		_lastPostTime = Date.now();

		const state = loadState();
		state.totalPosts++;
		saveState(state);

		log(`[MOLTBOOK] Posted mission summary: ${missionId} (${project})`);
	} catch (e) {
		log(`[MOLTBOOK] Post failed (non-fatal): ${e.message}`);
	}
}

/**
 * Get Moltbook connection status for health endpoint.
 */
function getMoltbookStatus() {
	const state = loadState();
	return {
		connected: !!getClient(),
		totalPosts: state.totalPosts,
		lastHeartbeat: state.lastHeartbeat,
		agentId: state.agentId,
	};
}

module.exports = { onDaemonBoot, postMissionSummary, getMoltbookStatus };
