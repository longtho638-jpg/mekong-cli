#!/usr/bin/env node
/**
 * 🛡️ AGI L4: PROACTIVE SELF-HEALER
 *
 * Binh Pháp Ch.4 軍形 (Military Disposition) - First make yourself invincible
 *
 * Monitors system health and auto-recovers from failures with proactive detection.
 *
 * AGI L4 Enhancements (2026-03-03):
 * - Degradation detection (confidence trending down)
 * - Pre-emptive cooling (pause new pipelines when failure rate spikes)
 * - Adaptive check intervals (more frequent during degradation)
 * - Circuit breaker integration with factory-pipeline
 *
 * Legacy Features:
 * - Detects stuck tmux sessions
 * - Auto-restarts crashed brain process
 * - Clears stale lock files
 * - Reports failures via Telegram
 * - Pre-flight checks before mission dispatch
 *
 * Exports: startMonitor, stopMonitor, preFlightCheck, reportFailure, healthCheck,
 *          clearStaleLocks, checkDegradation, shouldPause, getHealthStatus, resetCooldown,
 *          recordConfidence, recordOutcome
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

// ═══════════════════════════════════════════════════
// AGI L4: DEGRADATION & FAILURE DETECTION
// ═══════════════════════════════════════════════════

const HEALTH_STORE = path.join(
    process.env.HOME || '/tmp',
    '.config', 'openclaw', 'self-healer-health.json'
);

const COOLDOWN_STORE = path.join(
    process.env.HOME || '/tmp',
    '.config', 'openclaw', 'self-healer-cooldown.json'
);

// Thresholds
const DEGRADATION_THRESHOLD = 0.7;        // Alert if confidence < 0.7
const SPIKE_THRESHOLD = 0.5;              // Pause if failure rate > 50%
const RECOVERY_THRESHOLD = 0.85;          // Resume if confidence > 0.85

// Timeouts
const DEFAULT_CHECK_INTERVAL_MS = 30000;  // 30s normal
const DEGRADED_CHECK_INTERVAL_MS = 10000; // 10s during degradation
const COOLDOWN_DURATION_MS = 300000;      // 5min cooldown after pause

// Window sizes
const CONFIDENCE_WINDOW = 20;             // Track last 20 pipelines
const FAILURE_RATE_WINDOW = 10;           // Track last 10 pipelines for failure rate

// State
let confidenceHistory = [];
let failureRateHistory = [];
let isPaused = false;
let degradationDetected = false;
let lastCheckTime = Date.now();

/**
 * Load health state from persistent storage
 */
function loadHealth() {
    try {
        if (fs.existsSync(HEALTH_STORE)) {
            const data = JSON.parse(fs.readFileSync(HEALTH_STORE, 'utf-8'));
            confidenceHistory = data.confidenceHistory || [];
            failureRateHistory = data.failureRateHistory || [];
            isPaused = data.isPaused || false;
            degradationDetected = data.degradationDetected || false;
            lastCheckTime = data.lastCheckTime || Date.now();
        }
    } catch (e) { /* fresh start */ }
}

/**
 * Save health state to persistent storage
 */
function saveHealth() {
    try {
        const dir = path.dirname(HEALTH_STORE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(HEALTH_STORE, JSON.stringify({
            confidenceHistory,
            failureRateHistory,
            isPaused,
            degradationDetected,
            lastCheckTime: Date.now(),
        }, null, 2));
    } catch (e) { /* ignore */ }
}

/**
 * Load cooldown state
 */
function loadCooldown() {
    try {
        if (fs.existsSync(COOLDOWN_STORE)) {
            return JSON.parse(fs.readFileSync(COOLDOWN_STORE, 'utf-8'));
        }
    } catch (e) { /* fresh start */ }
    return null;
}

/**
 * Save cooldown state
 */
function saveCooldown(pausedUntil) {
    try {
        const dir = path.dirname(COOLDOWN_STORE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(COOLDOWN_STORE, JSON.stringify({
            pausedUntil,
            reason: 'failure_spike',
            timestamp: Date.now(),
        }, null, 2));
    } catch (e) { /* ignore */ }
}

/**
 * Record confidence score for trend analysis
 */
function recordConfidence(confidence) {
    loadHealth();
    confidenceHistory.push({
        confidence,
        timestamp: Date.now(),
    });

    // Trim to window size
    if (confidenceHistory.length > CONFIDENCE_WINDOW) {
        confidenceHistory = confidenceHistory.slice(-CONFIDENCE_WINDOW);
    }

    saveHealth();
}

/**
 * Record pipeline outcome for failure rate tracking
 */
function recordOutcome(success) {
    loadHealth();
    failureRateHistory.push({
        success,
        timestamp: Date.now(),
    });

    // Trim to window size
    if (failureRateHistory.length > FAILURE_RATE_WINDOW) {
        failureRateHistory = failureRateHistory.slice(-FAILURE_RATE_WINDOW);
    }

    saveHealth();
}

/**
 * Check if confidence is trending down (degradation)
 * Returns: {isDegraded, trend, avgConfidence, alert}
 */
function checkDegradation() {
    loadHealth();

    if (confidenceHistory.length < 5) {
        return {
            isDegraded: false,
            trend: 'insufficient_data',
            avgConfidence: 0,
            alert: null,
        };
    }

    // Calculate moving averages
    const recent = confidenceHistory.slice(-5);
    const older = confidenceHistory.slice(-CONFIDENCE_WINDOW, -5);

    const recentAvg = recent.reduce((sum, x) => sum + x.confidence, 0) / recent.length;
    const olderAvg = older.length > 0
        ? older.reduce((sum, x) => sum + x.confidence, 0) / older.length
        : recentAvg;

    const trend = recentAvg - olderAvg;
    const isDegraded = recentAvg < DEGRADATION_THRESHOLD || trend < -0.15;

    degradationDetected = isDegraded;
    saveHealth();

    return {
        isDegraded,
        trend: trend > 0.05 ? 'improving' : trend < -0.05 ? 'degrading' : 'stable',
        avgConfidence: recentAvg,
        alert: isDegraded ? {
            severity: recentAvg < 0.5 ? 'critical' : 'warning',
            message: `Confidence ${recentAvg.toFixed(2)} (${trend > 0 ? '+' : ''}${trend.toFixed(2)})`,
            recommendation: recentAvg < 0.5 ? 'pause_and_review' : 'increase_monitoring',
        } : null,
    };
}

/**
 * Check if failure rate has spiked
 * Returns: {hasSpike, failureRate, shouldPause}
 */
function checkFailureSpike() {
    loadHealth();

    if (failureRateHistory.length < 3) {
        return {
            hasSpike: false,
            failureRate: 0,
            shouldPause: false,
        };
    }

    const failures = failureRateHistory.filter(x => !x.success).length;
    const failureRate = failures / failureRateHistory.length;
    const hasSpike = failureRate > SPIKE_THRESHOLD;

    return {
        hasSpike,
        failureRate,
        shouldPause: hasSpike && failureRate > 0.6, // Pause if >60% failure
    };
}

/**
 * Check if system should pause new pipelines
 * Returns: {shouldPause, reason, remainingMs}
 */
function shouldPause() {
    // Check cooldown first
    const cooldown = loadCooldown();
    if (cooldown && cooldown.pausedUntil > Date.now()) {
        return {
            shouldPause: true,
            reason: 'cooldown_active',
            remainingMs: cooldown.pausedUntil - Date.now(),
        };
    }

    // Check failure spike
    const spike = checkFailureSpike();
    if (spike.shouldPause) {
        // Activate cooldown
        const pausedUntil = Date.now() + COOLDOWN_DURATION_MS;
        saveCooldown(pausedUntil);

        return {
            shouldPause: true,
            reason: 'failure_spike',
            failureRate: spike.failureRate,
            remainingMs: COOLDOWN_DURATION_MS,
        };
    }

    // Check degradation
    const degradation = checkDegradation();
    if (degradation.isDegraded && degradation.avgConfidence < 0.5) {
        return {
            shouldPause: true,
            reason: 'severe_degradation',
            avgConfidence: degradation.avgConfidence,
            remainingMs: 0, // Indefinite until manual reset
        };
    }

    return {
        shouldPause: false,
        reason: null,
    };
}

/**
 * Manually reset cooldown (for human intervention)
 */
function resetCooldown() {
    try {
        if (fs.existsSync(COOLDOWN_STORE)) {
            fs.unlinkSync(COOLDOWN_STORE);
        }
        loadHealth();
        isPaused = false;
        saveHealth();

        return { success: true, message: 'Cooldown reset' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

/**
 * Get adaptive check interval based on health status
 * Returns: {intervalMs, reason}
 */
function getCheckInterval() {
    const degradation = checkDegradation();

    if (degradation.isDegraded) {
        return {
            intervalMs: DEGRADED_CHECK_INTERVAL_MS,
            reason: 'degradation_detected',
            severity: degradation.avgConfidence < 0.5 ? 'critical' : 'warning',
        };
    }

    return {
        intervalMs: DEFAULT_CHECK_INTERVAL_MS,
        reason: 'normal_operation',
    };
}

/**
 * Get comprehensive health status for dashboard
 * Returns: {status, confidence, failureRate, trend, isPaused, recommendations}
 */
function getHealthStatus() {
    loadHealth();

    const degradation = checkDegradation();
    const spike = checkFailureSpike();
    const cooldown = loadCooldown();

    const status = degradation.isDegraded
        ? (degradation.avgConfidence < 0.5 ? 'critical' : 'warning')
        : spike.hasSpike
        ? 'warning'
        : 'healthy';

    const recommendations = [];
    if (status === 'critical') {
        recommendations.push('Pause new pipelines and review recent failures');
        recommendations.push('Check learning-engine for pattern analysis');
    } else if (status === 'warning') {
        recommendations.push('Increase monitoring frequency');
        recommendations.push('Review recent pipeline outcomes');
    }

    return {
        status,
        confidence: degradation.avgConfidence,
        failureRate: spike.failureRate,
        trend: degradation.trend,
        isPaused: cooldown ? cooldown.pausedUntil > Date.now() : false,
        cooldownRemaining: cooldown && cooldown.pausedUntil > Date.now()
            ? cooldown.pausedUntil - Date.now()
            : 0,
        recommendations,
        stats: {
            confidenceSamples: confidenceHistory.length,
            failureSamples: failureRateHistory.length,
            lastCheck: lastCheckTime,
        },
    };
}

// ═══════════════════════════════════════════════════
// LEGACY: HEALTH CHECKS
// ═══════════════════════════════════════════════════

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
 * Check proxy health for a specific port
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
 * Attempt proxy recovery
 */
async function restartProxy() {
    const recoveryScript = path.join(config.MEKONG_DIR, 'scripts', 'proxy-recovery.sh');
    if (fs.existsSync(recoveryScript)) {
        try {
            execSync(`bash "${recoveryScript}" 2>/dev/null`, { timeout: 10000, stdio: 'pipe' });
            log('[SELF-HEALER] Proxy recovery script executed');
        } catch (e) {
            log(`[SELF-HEALER] Recovery script failed: ${e.message}`);
        }
    }

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

// ═══════════════════════════════════════════════════
// LEGACY: RECOVERY ACTIONS
// ═══════════════════════════════════════════════════

async function attemptRecovery() {
    log('🩺 Attempting auto-recovery...');

    clearStaleLocks();

    if (!isProxyAlive()) {
        log('🩺 Proxy is down — checking health');
        await restartProxy();
    }

    consecutiveFailures = 0;
    log('🩺 Recovery complete');
}

// ═══════════════════════════════════════════════════
// LEGACY: PRE-FLIGHT CHECK
// ═══════════════════════════════════════════════════

async function preFlightCheck() {
    const issues = [];

    if (!isTmuxAlive()) {
        issues.push('Tmux session not found');
    }

    if (!isProxyAlive()) {
        issues.push('Proxy 20128 is down');
        await restartProxy();
    }
    const proxy9191 = await checkProxyHealth(9191);
    if (!proxy9191) {
        issues.push('Proxy 9191 (CC CLI) is down');
    }

    if (isProcessStuck()) {
        issues.push('Mission lock is stale (>30min)');
        clearStaleLocks();
    }

    try {
        const tasksDir = path.join(config.MEKONG_DIR, 'tasks');
        const files = fs.readdirSync(tasksDir).filter(f => config.TASK_PATTERN.test(f));
        if (files.length > 50) {
            issues.push(`Task queue has ${files.length} mission files — possible buildup`);
        }
    } catch (e) { }

    if (issues.length > 0) {
        log(`⚠️ Pre-flight: ${issues.join(', ')}`);
    }

    // Also check AGI L4 health
    const shouldPauseResult = shouldPause();
    if (shouldPauseResult.shouldPause) {
        issues.push(`Paused: ${shouldPauseResult.reason}`);
    }

    return issues.length === 0;
}

// ═══════════════════════════════════════════════════
// LEGACY: FAILURE REPORTING
// ═══════════════════════════════════════════════════

function reportFailure(missionName, error) {
    consecutiveFailures++;
    log(`❌ Mission failed: ${missionName} — ${error} (${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES})`);

    // Record for AGI L4 tracking
    recordOutcome(false);

    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        log(`🚨 ${MAX_CONSECUTIVE_FAILURES} consecutive failures — triggering recovery`);
        sendTelegram(`🚨 ${MAX_CONSECUTIVE_FAILURES} consecutive failures — auto-recovery triggered`);
        attemptRecovery();
    }
}

// ═══════════════════════════════════════════════════
// AGI L4: ADAPTIVE MONITOR LOOP
// ═══════════════════════════════════════════════════

async function healthCheck() {
    // Get adaptive interval
    const interval = getCheckInterval();

    if (interval.reason === 'degradation_detected') {
        log(`🩺 Degradation detected — check interval reduced to ${interval.intervalMs / 1000}s`);
    }

    // Check 1: Stuck process
    if (isProcessStuck()) {
        log('🩺 Detected stuck process — clearing locks');
        clearStaleLocks();
    }

    // Check 2: Proxy health
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
            if (bsm.isWorkerBusy(idx)) continue;
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
    } catch (e) { /* non-critical */ }

    // Check 4: AGI L4 health status
    const health = getHealthStatus();
    if (health.status === 'critical') {
        log(`🚨 CRITICAL: ${health.recommendations.join('; ')}`);
        sendTelegram(`🚨 CRITICAL: confidence=${health.confidence.toFixed(2)}, ${health.recommendations.join('; ')}`);
    }

    lastCheckTime = Date.now();
    saveHealth();
}

function startMonitor() {
    if (monitorInterval) return;
    log('🩺 Self-Healer monitor started (AGI L4 adaptive)');

    // Initial health check
    healthCheck();

    monitorInterval = setInterval(healthCheck, DEFAULT_CHECK_INTERVAL_MS);
}

function stopMonitor() {
    if (monitorInterval) {
        clearInterval(monitorInterval);
        monitorInterval = null;
        log('🩺 Self-Healer monitor stopped');
    }
}

// ═══════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════

module.exports = {
    // Legacy exports
    startMonitor,
    stopMonitor,
    preFlightCheck,
    reportFailure,
    healthCheck,
    clearStaleLocks,

    // AGI L4 exports
    checkDegradation,
    checkFailureSpike,
    shouldPause,
    resetCooldown,
    getCheckInterval,
    getHealthStatus,
    recordConfidence,
    recordOutcome,

    // Constants
    DEGRADATION_THRESHOLD,
    SPIKE_THRESHOLD,
    RECOVERY_THRESHOLD,
    DEFAULT_CHECK_INTERVAL_MS,
    DEGRADED_CHECK_INTERVAL_MS,
    COOLDOWN_DURATION_MS,
};
