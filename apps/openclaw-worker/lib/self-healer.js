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
const { execSync } = require('child_process');
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
let consecutiveRecoveryFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;
const MAX_RECOVERY_FAILURES = 3;

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

/**
 * Check proxy health for a specific port.
 * @param {number} port - Port to check (9191 for CC CLI, 20128 for engine)
 */
async function checkProxyHealth(port = 9191) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}/health`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(3000, () => { req.destroy(); resolve(false); });
    });
}

/**
 * Attempt proxy recovery — try recovery script, then validate.
 * 🧬 FIX: Actually attempt recovery instead of just checking health.
 */
async function restartProxy() {
    // Try recovery script first
    const recoveryScript = path.join(config.MEKONG_DIR, 'scripts', 'proxy-recovery.sh');
    if (fs.existsSync(recoveryScript)) {
        try {
            execSync(`bash "${recoveryScript}" 2>/dev/null`, { timeout: 10000, stdio: 'pipe' });
            log('[SELF-HEALER] Proxy recovery script executed');
        } catch (e) {
            log(`[SELF-HEALER] Recovery script failed: ${e.message}`);
        }
    }

    // Verify both proxy ports
    const port9191 = await checkProxyHealth(9191);
    const port20128 = await checkProxyHealth(20128);

    if (!port9191) log('[SELF-HEALER] ⚠️ Proxy 9191 (CC CLI) UNHEALTHY');
    if (!port20128) log('[SELF-HEALER] ⚠️ Proxy 20128 (Engine) UNHEALTHY');

    const anyHealthy = port9191 || port20128;
    if (anyHealthy) {
        consecutiveRecoveryFailures = 0;
        log(`[SELF-HEALER] Proxy status: 9191=${port9191 ? '✅' : '❌'} 20128=${port20128 ? '✅' : '❌'}`);
    } else {
        consecutiveRecoveryFailures++;
        log(`[SELF-HEALER] ALL proxies DOWN — recovery fail ${consecutiveRecoveryFailures}/${MAX_RECOVERY_FAILURES}`);
        if (consecutiveRecoveryFailures >= MAX_RECOVERY_FAILURES) {
            sendTelegram('🚨 ALL PROXIES DOWN after 3 recovery attempts — manual intervention required');
        }
    }

    return anyHealthy;
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

async function attemptRecovery() {
    log('🩺 Attempting auto-recovery...');

    // Clear stale locks
    clearStaleLocks();

    // Check and restart proxy if needed
    if (!isProxyAlive()) {
        log('🩺 Proxy is down — checking health');
        await restartProxy();
    }

    // Reset consecutive failure counter on successful recovery
    consecutiveFailures = 0;
    log('🩺 Recovery complete');
}

// ═══════════════════════════════════════════════════════════════
// Pre-flight Check (called before each mission)
// ═══════════════════════════════════════════════════════════════

async function preFlightCheck() {
    const issues = [];

    // Check tmux
    if (!isTmuxAlive()) {
        issues.push('Tmux session not found');
    }

    // Check proxy (both ports)
    if (!isProxyAlive()) {
        issues.push('Proxy 20128 is down');
        await restartProxy();
    }
    const proxy9191 = await checkProxyHealth(9191);
    if (!proxy9191) {
        issues.push('Proxy 9191 (CC CLI) is down');
    }

    // Check for stale locks
    if (isProcessStuck()) {
        issues.push('Mission lock is stale (>30min)');
        clearStaleLocks();
    }

    // Check task queue buildup
    try {
        const tasksDir = path.join(config.MEKONG_DIR, 'tasks');
        // 🧬 FIX: Match actual TASK_PATTERN (mission_*.txt), not .md files
        const files = fs.readdirSync(tasksDir).filter(f => config.TASK_PATTERN.test(f));
        if (files.length > 50) {
            issues.push(`Task queue has ${files.length} mission files — possible buildup`);
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

async function healthCheck() {
    // Check 1: Stuck process
    if (isProcessStuck()) {
        log('🩺 Detected stuck process — clearing locks');
        clearStaleLocks();
    }

    // Check 2: Proxy health (both ports)
    if (!isProxyAlive()) {
        log('🩺 Proxy 20128 DOWN — attempting recovery');
        await restartProxy();
    }
    const proxy9191ok = await checkProxyHealth(9191);
    if (!proxy9191ok) {
        log('🩺 Proxy 9191 DOWN — attempting recovery');
        await restartProxy();
    }

    // Check 3: Auto-respawn crashed CC CLI workers
    try {
        const bsm = require('./brain-spawn-manager');
        for (let idx = 0; idx < 2; idx++) {
            if (bsm.isWorkerBusy(idx)) continue; // Worker is busy, skip
            const paneTarget = `tom_hum:brain.${idx}`;
            if (bsm.isShellPrompt && isTmuxAlive()) {
                const output = execSync(`tmux capture-pane -t ${paneTarget} -p 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 }).trim();
                if (bsm.isShellPrompt(output) && bsm.canRespawn()) {
                    log(`🩺 Worker P${idx} at shell prompt (crashed CLI) — auto-respawn triggered`);
                    const cmd = bsm.generateClaudeCommand(idx === 0 ? 'PRO' : 'API');
                    execSync(`tmux send-keys -t ${paneTarget} "${cmd}" Enter 2>/dev/null`, { timeout: 5000 });
                }
            }
        }
    } catch (e) { /* non-critical: brain-spawn-manager may not be available */ }
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
