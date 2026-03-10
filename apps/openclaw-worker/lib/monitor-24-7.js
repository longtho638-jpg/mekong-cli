#!/usr/bin/env node
/**
 * 🦞 24/7 CTO MONITOR — Giám sát Tôm Hùm realtime
 *
 * Chạy song song với task-watcher. Thu thập metrics mỗi 30s.
 * Phát hiện anomalies và tự can thiệp khi cần.
 *
 * Usage: node lib/monitor-24-7.js
 * Hoặc import: require('./lib/monitor-24-7').startMonitor()
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TMUX_SESSION = 'tom_hum_brain';
const METRICS_FILE = path.join(__dirname, '../data/metrics.jsonl');
const METRICS_DIR = path.dirname(METRICS_FILE);
const LOG_FILE = path.join(os.homedir(), 'tom_hum_monitor.log');
const POLL_INTERVAL_MS = 30_000; // 30 seconds
const MAX_METRICS_LINES = 2880; // 24h × 120 samples/h = keep 24h

// ═══ State tracking ═══
let lastState = 'unknown';
let lastStateChangeAt = Date.now();
let missionCount = 0;
let successCount = 0;
let failCount = 0;
let stuckAlertSent = false;
let monitorInterval = null;

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [monitor] ${msg}`;
	console.log(line);
	try {
		fs.appendFileSync(LOG_FILE, line + '\n');
	} catch (e) {}
}

// ═══ Capture CC CLI state ═══
function captureState() {
	try {
		const raw = execSync(`tmux capture-pane -t ${TMUX_SESSION}:0.0 -p -S -20`, { encoding: 'utf-8', timeout: 3000 });
		return raw;
	} catch (e) {
		return '';
	}
}

function detectState(output) {
	if (!output || output.trim().length === 0) return 'dead';

	const lines = output.split('\n').filter((l) => l.trim());
	const tail = lines.slice(-10).join('\n');

	// Check for shell prompt (CC CLI exited)
	if (/\$\s*$/.test(tail) || /macbookprom1@/.test(tail)) return 'dead';

	// Check busy indicators
	const busyPatterns = [
		/Nesting/i,
		/Puttering/i,
		/Photosynthesizing/i,
		/Crunching/i,
		/Saut[eé]ing/i,
		/Marinating/i,
		/Churning/i,
		/Cooking/i,
		/Simmering/i,
		/Steaming/i,
		/Grilling/i,
		/Roasting/i,
		/Osmosing/i,
		/Computing/i,
		/Levitating/i,
		/Indexing/i,
		/\d+\s+local\s+agents?/i,
		/[·✻✢]\s+\w+ing/,
		/\d+[ms]\s+\d+[ms]\s*·\s*[↑↓]/,
		/[↑↓]\s*[\d.]+k?\s*tokens/i,
		/Calling tool/i,
		/Running command/i,
		/Running/i,
		/thinking/i,
		/Pasted text/i,
		/filesystem\s*[-–—]/i,
		/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,
	];
	if (busyPatterns.some((p) => p.test(tail))) return 'busy';

	// Check completion
	const completionPatterns = [/(?:Cooked|Churned|Sautéed|Braised).*for\s+\d+/i, /Task completed/i, /Finished in \d+/i];
	if (completionPatterns.some((p) => p.test(tail))) return 'complete';

	// Check idle prompt
	if (/❯/.test(tail) || /Interrupted/i.test(tail)) return 'idle';

	// Check compacting
	if (/Compacting/i.test(tail) || /auto-compact/i.test(tail)) return 'compacting';

	return 'unknown';
}

function extractMetrics(output) {
	const metrics = {
		subagentCount: 0,
		tokensDown: 0,
		contextPct: 0,
	};

	if (!output) return metrics;

	// Subagent count: "3 local agents"
	const agentMatch = output.match(/(\d+)\s+local\s+agents?/i);
	if (agentMatch) metrics.subagentCount = parseInt(agentMatch[1]);

	// Token count: "↓ 2.3k tokens"
	const tokenMatch = output.match(/↓\s*([\d.]+)k?\s*tokens/i);
	if (tokenMatch) {
		const val = parseFloat(tokenMatch[1]);
		metrics.tokensDown = tokenMatch[0].includes('k') ? val * 1000 : val;
	}

	// Context: "Context left until auto-compact: 12%"
	const ctxMatch = output.match(/auto-compact:\s*(\d+)%/);
	if (ctxMatch) metrics.contextPct = parseInt(ctxMatch[1]);

	return metrics;
}

// ═══ Self-healing actions ═══
function handleAnomaly(state, durationMs) {
	const durationMin = Math.round(durationMs / 60000);

	// CC CLI died → CTO should auto-respawn, just log
	if (state === 'dead' && durationMs > 60_000) {
		log(`🚨 CC CLI DEAD for ${durationMin}min — watchdog should restart`);
		return;
	}

	// Stuck in unknown state > 5 min → send Enter to unblock
	if (state === 'unknown' && durationMs > 5 * 60_000 && !stuckAlertSent) {
		log(`⚠️ CC CLI STUCK in unknown state ${durationMin}min — sending Enter`);
		try {
			execSync(`tmux send-keys -t ${TMUX_SESSION}:0.0 Enter`, { timeout: 2000 });
		} catch (e) {}
		stuckAlertSent = true;
		return;
	}

	// Compacting > 3 min → send Enter
	if (state === 'compacting' && durationMs > 3 * 60_000) {
		log(`⚠️ CC CLI COMPACTING for ${durationMin}min — sending Enter to unblock`);
		try {
			execSync(`tmux send-keys -t ${TMUX_SESSION}:0.0 Enter`, { timeout: 2000 });
		} catch (e) {}
		return;
	}
}

// ═══ Metrics persistence ═══
function writeMetric(metric) {
	try {
		if (!fs.existsSync(METRICS_DIR)) fs.mkdirSync(METRICS_DIR, { recursive: true });
		fs.appendFileSync(METRICS_FILE, JSON.stringify(metric) + '\n');

		// Rotate: keep only last 24h
		const lines = fs.readFileSync(METRICS_FILE, 'utf-8').split('\n').filter(Boolean);
		if (lines.length > MAX_METRICS_LINES) {
			const trimmed = lines.slice(-MAX_METRICS_LINES).join('\n') + '\n';
			fs.writeFileSync(METRICS_FILE, trimmed);
		}
	} catch (e) {}
}

// ═══ Main poll loop ═══
function poll() {
	const output = captureState();
	const state = detectState(output);
	const now = Date.now();
	const cliMetrics = extractMetrics(output);

	// State transition tracking
	if (state !== lastState) {
		const prevDuration = Math.round((now - lastStateChangeAt) / 1000);
		log(`STATE: ${lastState} → ${state} (was ${lastState} for ${prevDuration}s)`);

		if (lastState === 'busy' && state === 'idle') successCount++;
		if (lastState === 'busy' && (state === 'dead' || state === 'unknown')) failCount++;
		if (state === 'busy') missionCount++;

		lastState = state;
		lastStateChangeAt = now;
		stuckAlertSent = false;
	}

	// Anomaly handling
	const stateDuration = now - lastStateChangeAt;
	handleAnomaly(state, stateDuration);

	// Build metric record
	const loadAvg = os.loadavg();
	const freeRamMB = Math.round(os.freemem() / 1024 / 1024);
	const metric = {
		ts: new Date().toISOString(),
		state,
		stateDurationS: Math.round(stateDuration / 1000),
		missions: missionCount,
		success: successCount,
		fail: failCount,
		successRate: missionCount > 0 ? Math.round((successCount / missionCount) * 100) : 0,
		subagents: cliMetrics.subagentCount,
		tokensDown: cliMetrics.tokensDown,
		contextPct: cliMetrics.contextPct,
		cpuLoad: Math.round(loadAvg[0] * 10) / 10,
		freeRamMB,
	};

	writeMetric(metric);

	// Periodic summary every 5 minutes (10 polls)
	if (missionCount > 0 && Math.round(stateDuration / POLL_INTERVAL_MS) % 10 === 0) {
		log(
			`📊 SUMMARY: ${missionCount} missions, ${successCount} ✅, ${failCount} ❌, rate=${metric.successRate}%, CPU=${metric.cpuLoad}, RAM=${freeRamMB}MB`,
		);
	}
}

// ═══ Dashboard (instant health check) ═══
function dashboard() {
	const output = captureState();
	const state = detectState(output);
	const cliMetrics = extractMetrics(output);
	const loadAvg = os.loadavg();
	const freeRamMB = Math.round(os.freemem() / 1024 / 1024);

	// Read recent metrics for trends
	let recentMetrics = [];
	try {
		const lines = fs.readFileSync(METRICS_FILE, 'utf-8').split('\n').filter(Boolean);
		recentMetrics = lines.slice(-20).map((l) => JSON.parse(l));
	} catch (e) {}

	const avgSuccess =
		recentMetrics.length > 0 ? Math.round(recentMetrics.reduce((sum, m) => sum + m.successRate, 0) / recentMetrics.length) : 'N/A';

	return {
		timestamp: new Date().toISOString(),
		ccCliState: state,
		subagents: cliMetrics.subagentCount,
		tokensDown: cliMetrics.tokensDown,
		contextPct: cliMetrics.contextPct,
		missions: { total: missionCount, success: successCount, fail: failCount },
		system: { cpuLoad: loadAvg[0].toFixed(1), freeRamMB },
		trends: { avgSuccessRate: avgSuccess, sampleCount: recentMetrics.length },
	};
}

// ═══ Boot ═══
function startMonitor() {
	log('🦞 ═══ 24/7 MONITOR STARTED ═══');
	log(`Polling every ${POLL_INTERVAL_MS / 1000}s → ${METRICS_FILE}`);
	poll(); // Immediate first poll
	monitorInterval = setInterval(poll, POLL_INTERVAL_MS);
	return monitorInterval;
}

function stopMonitor() {
	if (monitorInterval) {
		clearInterval(monitorInterval);
		monitorInterval = null;
	}
	log('🦞 ═══ 24/7 MONITOR STOPPED ═══');
}

module.exports = { startMonitor, stopMonitor, dashboard, poll };

// Run standalone
if (require.main === module) {
	startMonitor();
	process.on('SIGINT', () => {
		stopMonitor();
		process.exit(0);
	});
	process.on('SIGTERM', () => {
		stopMonitor();
		process.exit(0);
	});
}
