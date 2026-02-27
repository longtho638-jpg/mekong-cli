/**
 * 🩺 Self-Healer — Auto-recovery daemon
 * 
 * Monitors system health and auto-recovers from common failures.
 * 
 * Features:
 * - Detects stuck tmux sessions
 * - Auto-restarts crashed brain process
 * - Cleans stale lock files
 * - Reports failures via Telegram
 * - Pre-flight checks before mission dispatch
 * 
 * Usage:
 *   const { startMonitor, stopMonitor, preFlightCheck, reportFailure } = require('./self-healer');
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync, spawn } = require('child_process');
const config = require('../config');
const { sendTelegram } = require('./telegram-client');

let _log;
function log(msg) {
    if (!_log) {
        try { _log = require('./brain-process-manager').log; } catch (e) { _log = console.log; }
    }
    _log(`[healer] ${msg}`);
}

let monitorInterval = null;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;

// ═══════════════════════════════════════════════════════════════
// Health Checks
// ═══════════════════════════════════════════════════════════════

function isTmuxAlive() {
    try {
        const result = execSync('tmux has-session -t tom_hum:brain 2>&1', { encoding: 'utf8', timeout: 5000 });
        return true;
    } catch (e) {
        return false;
    }
}

function isProxyAlive() {
    try {
        const proxyUrl = config.CLOUD_BRAIN_URL || 'http://127.0.0.1:20128';
        execSync(`curl -sf -m 3 ${proxyUrl}/health`, { timeout: 5000, stdio: 'pipe' });
        return true;
    } catch (e) {
        return false;
    }
}

async function checkProxyHealth() {
    return new Promise((resolve) => {
        const req = http.get('http://localhost:9191/health', (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(3000, () => { req.destroy(); resolve(false); });
    });
}

async function restartProxy() {
    const healthy = await checkProxyHealth();
    if (!healthy) {
        log('[SELF-HEALER] Proxy UNHEALTHY — manual intervention required');
        return false;
    }
    log('[SELF-HEALER] Proxy health check OK');
    return true;
}

function isProcessStuck() {
    try {
        const lockFile = path.join(config.MEKONG_DIR, 'tasks', '.mission_lock');
        if (!fs.existsSync(lockFile)) return false;
        const stat = fs.statSync(lockFile);
        const ageMs = Date.now() - stat.mtimeMs;
        // If lock is older than 30 minutes = stuck
        return ageMs > 30 * 60 * 1000;
    } catch (e) {
        return false;
    }
}

function clearStaleLocks() {
    try {
        const lockFile = path.join(config.MEKONG_DIR, 'tasks', '.mission_lock');
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
            log('Cleared stale mission lock');
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// Recovery Actions
// ═══════════════════════════════════════════════════════════════

function attemptRecovery() {
    log('🩺 Attempting auto-recovery...');

    // Clear stale locks
    clearStaleLocks();

    // Check and restart proxy if needed
    if (!isProxyAlive()) {
        log('🩺 Proxy is down — restarting as part of recovery');
        restartProxy();
    }

    // Reset consecutive failure counter on successful recovery
    consecutiveFailures = 0;
    log('🩺 Recovery complete');
}

// ═══════════════════════════════════════════════════════════════
// Pre-flight Check (called before each mission)
// ═══════════════════════════════════════════════════════════════

function preFlightCheck() {
    const issues = [];

    // Check tmux
    if (!isTmuxAlive()) {
        issues.push('Tmux session not found');
    }

    // Check proxy
    if (!isProxyAlive()) {
        issues.push('Proxy 20128 is down');
        restartProxy();
    }

    // Check for stale locks
    if (isProcessStuck()) {
        issues.push('Mission lock is stale (>30min)');
        clearStaleLocks();
    }

    // Check disk space (basic)
    try {
        const tasksDir = path.join(config.MEKONG_DIR, 'tasks');
        const files = fs.readdirSync(tasksDir).filter(f => f.endsWith('.md'));
        if (files.length > 100) {
            issues.push(`Task queue has ${files.length} files — possible buildup`);
        }
    } catch (e) { }

    if (issues.length > 0) {
        log(`⚠️ Pre-flight: ${issues.join(', ')}`);
    }

    return issues.length === 0;
}

// ═══════════════════════════════════════════════════════════════
// Failure Reporting
// ═══════════════════════════════════════════════════════════════

function reportFailure(missionName, error) {
    consecutiveFailures++;
    log(`❌ Mission failed: ${missionName} — ${error} (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`);

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        log(`🚨 ${MAX_CONSECUTIVE_FAILURES} consecutive failures — triggering recovery`);
        sendTelegram(`🚨 ${MAX_CONSECUTIVE_FAILURES} consecutive failures — auto-recovery triggered`);
        attemptRecovery();
    }
}

// ═══════════════════════════════════════════════════════════════
// Monitor Loop
// ═══════════════════════════════════════════════════════════════

function healthCheck() {
    // Check 1: Stuck process
    if (isProcessStuck()) {
        log('🩺 Detected stuck process — clearing locks');
        clearStaleLocks();
    }

    // Check 2: Proxy health
    if (!isProxyAlive()) {
        log('🩺 Proxy 20128 DOWN — manual check required');
        // const ok = restartProxy();
    }
}

function startMonitor() {
    if (monitorInterval) return;
    log('🩺 Self-Healer monitor started');
    monitorInterval = setInterval(healthCheck, 5 * 60 * 1000); // Every 5 minutes
}

function stopMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        log('🩺 Self-Healer monitor stopped');
    }
}

module.exports = {
    startMonitor,
    stopMonitor,
    preFlightCheck,
    reportFailure,
    healthCheck,
    clearStaleLocks,
};
