/**
 * Perception Engine v2 — Environmental awareness + anomaly detection
 *
 * TASK 18/22: CTO Brain Upgrade
 *
 * Monitors: CPU temp, disk, memory, proxy health, tmux sessions.
 * Emits perception events for other modules to react to.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config');

let perceptionInterval = null;
const PERCEPTION_STATE_FILE = path.join(config.MEKONG_DIR || '.', '.tom_hum_state.json');
const MAX_ALERT_HISTORY = 50;
const alertHistory = [];

function log(msg) {
	const ts = new Date().toISOString().slice(11, 19);
	const line = `[${ts}] [perception] ${msg}\n`;
	try {
		fs.appendFileSync(config.LOG_FILE, line);
	} catch (_) {}
}

function safeExec(cmd, timeout = 5000) {
	try {
		return execSync(cmd, { encoding: 'utf-8', timeout, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
	} catch (e) {
		return '';
	}
}

/**
 * Perform environmental perception sweep
 * @returns {{ alerts: Array, metrics: object, healthy: boolean }}
 */
function perceive() {
	const alerts = [];
	const metrics = {};

	// 1. CPU Load Average (M1 Mac — no sudo needed, more reliable than powermetrics)
	const loadOut = safeExec('sysctl -n vm.loadavg 2>/dev/null');
	const loadMatch = loadOut.match(/([\d.]+)/);
	metrics.cpuLoad1m = loadMatch ? parseFloat(loadMatch[1]) : null;
	if (metrics.cpuLoad1m && metrics.cpuLoad1m > 8) {
		alerts.push({ type: 'cpu_hot', severity: 'high', message: `CPU load ${metrics.cpuLoad1m} — system overloaded` });
	} else if (metrics.cpuLoad1m && metrics.cpuLoad1m > 5) {
		alerts.push({ type: 'cpu_warm', severity: 'medium', message: `CPU load ${metrics.cpuLoad1m} — elevated` });
	}

	// 2. Disk space
	const diskOut = safeExec("df -h / | tail -1 | awk '{print $5}'");
	const diskPercent = parseInt(diskOut);
	metrics.diskUsagePercent = diskPercent || null;
	if (diskPercent > 90) {
		alerts.push({ type: 'disk_full', severity: 'high', message: `Disk ${diskPercent}% full — cleanup needed` });
	}

	// 3. Memory pressure
	const memOut = safeExec('memory_pressure 2>/dev/null | head -1');
	const memMatch = memOut.match(/(critical|warn|normal)/i);
	metrics.memoryPressure = memMatch ? memMatch[1].toLowerCase() : 'unknown';
	if (metrics.memoryPressure === 'critical') {
		alerts.push({ type: 'memory_critical', severity: 'high', message: 'Memory pressure CRITICAL' });
	} else if (metrics.memoryPressure === 'warn') {
		alerts.push({ type: 'memory_warn', severity: 'medium', message: 'Memory pressure WARNING' });
	}

	// 4. Proxy ports alive — both 9191 (CC CLI) and 20128 (Engine) are critical
	for (const port of [9191, 20128]) {
		const alive = safeExec(`curl -sf http://127.0.0.1:${port}/health 2>/dev/null | head -c 10`);
		metrics[`port_${port}`] = alive.length > 0;
		if (!alive) {
			alerts.push({ type: 'proxy_down', severity: 'high', message: `Proxy port ${port} is DOWN` });
		}
	}

	// 5. tmux brain session alive
	const tmuxAlive = safeExec('tmux has-session -t tom_hum:brain 2>/dev/null && echo alive');
	metrics.brainAlive = tmuxAlive === 'alive';

	// 6. Node process count
	const nodeCount = safeExec("pgrep -f 'node' | wc -l");
	metrics.nodeProcessCount = parseInt(nodeCount) || 0;
	if (metrics.nodeProcessCount > 20) {
		alerts.push({ type: 'node_flood', severity: 'medium', message: `${metrics.nodeProcessCount} Node processes running` });
	}

	// 7. Claude process count (CC CLI workers)
	const claudeCount = safeExec("pgrep -f 'claude' | wc -l");
	metrics.claudeProcessCount = parseInt(claudeCount) || 0;

	// 8. GPU temperature (M1 Mac — use thermal state instead of sudo powermetrics)
	const thermalOut = safeExec("pmset -g therm 2>/dev/null | grep -i 'cpu_speed_limit' | grep -oE '[0-9]+'");
	const cpuSpeedLimit = thermalOut ? parseInt(thermalOut) : 100;
	metrics.cpuSpeedLimit = cpuSpeedLimit;
	if (cpuSpeedLimit < 70) {
		alerts.push({ type: 'thermal_throttle', severity: 'high', message: `CPU throttled to ${cpuSpeedLimit}% — overheating` });
	}

	// 9. Trend detection — flag repeating alert types (3+ in last 10 sweeps)
	const trends = detectAlertTrends(alerts);
	if (trends.length > 0) {
		alerts.push({ type: 'trend_detected', severity: 'medium', message: `Repeating: ${trends.join(', ')}` });
	}

	const healthy = alerts.filter((a) => a.severity === 'high').length === 0;

	// Record to alert history for trend analysis
	alertHistory.push({ alerts: alerts.map((a) => a.type), ts: Date.now() });
	if (alertHistory.length > MAX_ALERT_HISTORY) alertHistory.shift();

	return { alerts, metrics, healthy, timestamp: new Date().toISOString() };
}

/**
 * Save perception state for dashboard consumption
 */
function savePerception(perception) {
	try {
		let state = {};
		if (fs.existsSync(PERCEPTION_STATE_FILE)) {
			state = JSON.parse(fs.readFileSync(PERCEPTION_STATE_FILE, 'utf-8'));
		}
		state.perception = perception;
		fs.writeFileSync(PERCEPTION_STATE_FILE, JSON.stringify(state, null, 2));
	} catch (e) {
		/* non-critical */
	}
}

/**
 * Start periodic perception (every 60s)
 */
function startPerceptionEngine() {
	if (perceptionInterval) return;
	log('Perception Engine v2 started');

	// Initial sweep
	try {
		const p = perceive();
		savePerception(p);
		if (p.alerts.length > 0) {
			log(`PERCEPTION: ${p.alerts.length} alerts — ${p.alerts.map((a) => a.message).join('; ')}`);
		}
	} catch (e) {
		log(`Perception sweep error: ${e.message}`);
	}

	perceptionInterval = setInterval(() => {
		try {
			const p = perceive();
			savePerception(p);
			for (const alert of p.alerts) {
				if (alert.severity === 'high') log(`🚨 ${alert.message}`);
			}
		} catch (e) {
			/* silent */
		}
	}, 60000);
}

function stopPerceptionEngine() {
	if (perceptionInterval) {
		clearInterval(perceptionInterval);
		perceptionInterval = null;
	}
}

/**
 * Detect repeating alert patterns across recent sweeps.
 * Returns array of alert types that appeared 3+ times in last 10 sweeps.
 */
function detectAlertTrends(currentAlerts) {
	const recentWindow = alertHistory.slice(-10);
	const allTypes = recentWindow.flatMap((h) => h.alerts);
	currentAlerts.forEach((a) => allTypes.push(a.type));

	const counts = {};
	for (const t of allTypes) {
		counts[t] = (counts[t] || 0) + 1;
	}
	return Object.entries(counts)
		.filter(([, c]) => c >= 3)
		.map(([t]) => t);
}

/**
 * Get latest perception snapshot for external modules (learning-engine, dashboard).
 */
function getLatestSnapshot() {
	try {
		if (fs.existsSync(PERCEPTION_STATE_FILE)) {
			const state = JSON.parse(fs.readFileSync(PERCEPTION_STATE_FILE, 'utf-8'));
			return state.perception || null;
		}
	} catch (_) {}
	return null;
}

module.exports = { perceive, startPerceptionEngine, stopPerceptionEngine, getLatestSnapshot, detectAlertTrends };
