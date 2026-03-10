/**
 * 🌊 Throughput Maximizer — 兵貴勝不貴久 (Ch.2 作戰)
 *
 * "Hứng trọn nước từ server Google, không nút thắt cổ chai"
 *
 * 4 TẦNG TỐI ƯU:
 *
 * Layer 1: NODE.JS ENGINE — UV_THREADPOOL_SIZE, maxSockets, keepAlive
 * Layer 2: TMUX BUFFER — Scrollback + escape-time for max throughput
 * Layer 3: POLLING OPTIMIZATION — Adaptive polling interval
 * Layer 4: NETWORK — HTTP Agent with connection pooling
 */

const { execSync } = require('child_process');
const http = require('http');
const https = require('https');

// 🔥 Lazy log — avoid circular dependency with brain-process-manager
function log(msg) {
	try {
		const bpm = require('./brain-process-manager');
		if (bpm.log) return bpm.log(msg);
	} catch (e) {}
	const ts = new Date().toTimeString().slice(0, 8);
	console.log(`[${ts}] [tom-hum] ${msg}`);
}

// ═══════════════════════════════════════════════════════
// LAYER 1: NODE.JS ENGINE — BUNG HẾT RA MAXIMUM
// ═══════════════════════════════════════════════════════

function maximizeNodeEngine() {
	// UV_THREADPOOL_SIZE: Default = 4 → Max = 128
	// Affects: DNS lookups, file system ops, crypto, compression
	// More threads = more parallel I/O = faster throughput
	if (!process.env.UV_THREADPOOL_SIZE) {
		// Note: Must be set BEFORE any I/O — this is a startup-only config
		// Since we're called at boot, child processes inherit this
		process.env.UV_THREADPOOL_SIZE = '16'; // 16 threads for M1 (8 cores × 2)
		log('🌊 [THROUGHPUT] UV_THREADPOOL_SIZE = 16 (was default 4)');
	}

	// Max listeners — prevent EventEmitter warnings during parallel ops
	process.setMaxListeners(50);

	// HTTP/HTTPS Agent — Connection pooling requests
	// Default: maxSockets = Infinity but keepAlive = false → new TCP per request!
	// Fix: keepAlive = true + maxSockets = 25 → reuse connections
	const agentConfig = {
		keepAlive: true,
		keepAliveMsecs: 30000, // Keep connections alive 30s
		maxSockets: 25, // Max 25 parallel connections per host
		maxFreeSockets: 10, // Keep 10 idle connections ready
		timeout: 120000, // 2min timeout (long for AI responses)
		scheduling: 'fifo', // First-in-first-out for fairness
	};

	http.globalAgent = new http.Agent(agentConfig);
	https.globalAgent = new https.Agent(agentConfig);
	log('🌊 [THROUGHPUT] HTTP Agent: keepAlive=true, maxSockets=25, maxFree=10');

	return { threadPool: 16, maxSockets: 25 };
}

// ═══════════════════════════════════════════════════════
// LAYER 2: TMUX BUFFER — HỨNG TRỌN OUTPUT
// ═══════════════════════════════════════════════════════

function maximizeTmuxBuffer(sessionName = 'tom_hum_brain') {
	try {
		// Default scrollback: 2000 lines → TĂNG lên 50000
		// AI responses can be 500+ lines — need FULL capture for perception scoring
		execSync(`tmux set-option -t ${sessionName} -g history-limit 50000`, { stdio: 'pipe' });
		log('🌊 [THROUGHPUT] tmux history-limit = 50000 (was 2000)');
	} catch (e) {
		// Session might not exist yet — will be set after spawn
	}

	try {
		// escape-time: Default 500ms → 0ms
		// tmux waits 500ms after Escape to check for key sequences
		// 0ms = instant dispatch → faster paste-buffer operations
		execSync(`tmux set-option -g escape-time 0`, { stdio: 'pipe' });
		log('🌊 [THROUGHPUT] tmux escape-time = 0 (was 500ms)');
	} catch (e) {}

	try {
		// buffer-limit: Max tmux paste buffer entries
		execSync(`tmux set-option -g buffer-limit 50`, { stdio: 'pipe' });
	} catch (e) {}

	return { historyLimit: 50000, escapeTime: 0 };
}

// ═══════════════════════════════════════════════════════
// LAYER 3: ADAPTIVE POLLING — FAST WHEN BUSY, SLOW WHEN IDLE
// ═══════════════════════════════════════════════════════

/**
 * Returns optimal polling interval based on mission state.
 * BUSY state: poll faster (250ms) to catch completion ASAP
 * IDLE state: poll slower (750ms) to reduce CPU
 * DISPATCHED (waiting): medium (500ms)
 */
function getAdaptivePollingMs(state, wasBusy) {
	if (state === 'busy' || wasBusy) return 250; // HOT: catch completion fast
	if (state === 'complete') return 100; // DONE: process immediately
	if (state === 'idle' && !wasBusy) return 750; // COLD: save CPU
	return 500; // Default
}

// ═══════════════════════════════════════════════════════
// LAYER 4: CAPTURE OPTIMIZATION — NON-BLOCKING PANE READ
// ═══════════════════════════════════════════════════════

/**
 * Optimized pane capture — capture ONLY recent lines for state detection.
 * Full capture (50k lines) only when needed for perception scoring.
 *
 * @param {string} sessionName - tmux session
 * @param {number} workerIdx - pane index
 * @param {number} lines - lines to capture (default 100 for state, 2000 for perception)
 * @returns {string} captured output
 */
function fastCapture(sessionName, workerIdx, lines = 100) {
	try {
		// Capture only last N lines instead of entire scrollback
		// 100 lines is enough for state detection (prompt, busy indicators)
		// This HALVES the execSync payload and speeds up parsing
		const cmd = `tmux capture-pane -t ${sessionName}:0.${workerIdx} -p -S -${lines}`;
		return execSync(cmd, { encoding: 'utf-8', timeout: 2000 });
	} catch (e) {
		return '';
	}
}

/**
 * Full capture for perception scoring (post-mission analysis)
 */
function fullCapture(sessionName, workerIdx) {
	return fastCapture(sessionName, workerIdx, 3000);
}

// ═══════════════════════════════════════════════════════
// BOOT SEQUENCE — BUNG HẾT KHI KHỞI ĐỘNG
// ═══════════════════════════════════════════════════════

function initMaxThroughput(sessionName) {
	log('🌊 ═══ THROUGHPUT MAXIMIZER — 兵貴勝不貴久 ═══');

	const nodeStats = maximizeNodeEngine();
	const tmuxStats = maximizeTmuxBuffer(sessionName);

	log(
		`🌊 [THROUGHPUT] ✅ READY — Threads: ${nodeStats.threadPool}, ` +
			`Sockets: ${nodeStats.maxSockets}, Buffer: ${tmuxStats.historyLimit}, ` +
			`EscapeTime: ${tmuxStats.escapeTime}ms`,
	);

	return { ...nodeStats, ...tmuxStats };
}

module.exports = {
	initMaxThroughput,
	maximizeNodeEngine,
	maximizeTmuxBuffer,
	getAdaptivePollingMs,
	fastCapture,
	fullCapture,
};
