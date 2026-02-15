#!/usr/bin/env node
/**
 * TOM HUM (OpenClaw) Task Watcher — v2026.2.13 TMUX INTERACTIVE
 *
 * Thin orchestrator: imports modules, wires lifecycle, handles shutdown.
 * Runs FOREVER as a daemon — never exits after queue empties.
 * Self-healing: any exception → log + sleep 30s + continue.
 *
 * v2026.2.13 changes (upstream sync):
 *   - Write-ahead delivery queue: missions survive restarts (#15636)
 *   - Stale state cleanup: clear command-queue on restart (#15195)
 *   - SIGUSR1 in-process restart: clear zombie state (#15195)
 *   - Heartbeat race fix: scheduler no longer dies silently (#15108)
 *   - Session archival: /new /reset clean stale transcripts (#14869)
 *
 * Modules:
 *   config.js                    — All constants, paths, env vars
 *   lib/brain-tmux.js            — Tmux brain (CC CLI interactive session)
 *   lib/mission-dispatcher.js    — Prompt building, project routing
 *   lib/task-queue.js            — File watching, queuing, archiving
 *   lib/auto-cto-pilot.js        — Binh Phap auto-task generation
 *   lib/m1-cooling-daemon.js     — M1 thermal management + thermal gate
 *   lib/proxy-rules-validator.js  — 防 Boot-time PROXY_RULES enforcement
 */

const fs = require('fs');
const path = require('path');
const config = require('./config');

// --- PID Lock: Prevent duplicate instances ---
const PID_FILE = path.join(__dirname, '.task-watcher.pid');
try {
  if (fs.existsSync(PID_FILE)) {
    const oldPid = parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim());
    try {
      process.kill(oldPid, 0); // Check if process exists
      // Process exists — kill it
      console.log(`[tom-hum] KILLING duplicate task-watcher PID ${oldPid}`);
      process.kill(oldPid, 'SIGKILL');
    } catch (e) { /* Process doesn't exist — stale PID file */ }
  }
  fs.writeFileSync(PID_FILE, String(process.pid));
  process.on('exit', () => { try { fs.unlinkSync(PID_FILE); } catch (e) { } });
} catch (e) { console.error('PID lock error:', e.message); }

// --- 🔒 Auto-start AG proxy on port 9191 + WAIT for ready ---
const { execSync, spawn } = require('child_process');
let agReady = false;
try {
  execSync('curl -sf http://localhost:9191/health', { timeout: 3000, stdio: 'pipe' });
  console.log('[tom-hum] AG proxy 9191: ✅ already running');
  agReady = true;
} catch (e) {
  console.log('[tom-hum] AG proxy 9191: ❌ DEAD — auto-starting...');
  try {
    const agProc = spawn('antigravity-claude-proxy', [], {
      env: { ...process.env, PORT: '9191' },
      detached: true,
      stdio: 'ignore',
    });
    agProc.unref();
    console.log(`[tom-hum] AG proxy 9191: 🚀 spawned PID ${agProc.pid}`);
    // 🔒 WAIT for health — prevents tmux [exited] race condition
    for (let i = 1; i <= 15; i++) {
      try {
        execSync('sleep 1');
        execSync('curl -sf http://localhost:9191/health', { timeout: 2000, stdio: 'pipe' });
        console.log(`[tom-hum] AG proxy 9191: ✅ READY (${i}s)`);
        agReady = true;
        break;
      } catch (_) { /* still booting */ }
    }
    if (!agReady) console.error('[tom-hum] AG proxy 9191: ⚠️ NOT READY after 15s — proceeding anyway');
  } catch (spawnErr) {
    console.error(`[tom-hum] AG proxy 9191: FAILED to start: ${spawnErr.message}`);
  }
}

// --- Unhandled error protection FIRST: log but do NOT crash the daemon ---
process.on('uncaughtException', (err) => {
  const msg = `[${new Date().toISOString().slice(11, 19)}] [tom-hum] UNCAUGHT EXCEPTION (daemon stays alive): ${err.stack || err.message}\n`;
  try { fs.appendFileSync(config.LOG_FILE, msg); } catch (e) { }
});
process.on('unhandledRejection', (reason) => {
  const msg = `[${new Date().toISOString().slice(11, 19)}] [tom-hum] UNHANDLED REJECTION (daemon stays alive): ${reason}\n`;
  try { fs.appendFileSync(config.LOG_FILE, msg); } catch (e) { }
});

// --- Import modules ---
const { spawnBrain, killBrain, log } = require('./lib/brain-tmux');
const { startWatching, stopWatching } = require('./lib/task-queue');
const { startAutoCTO, stopAutoCTO } = require('./lib/auto-cto-pilot');
const { startCooling, stopCooling } = require('./lib/m1-cooling-daemon');
const { startMonitor: startHealer, stopMonitor: stopHealer } = require('./lib/self-healer');

// --- v2026.2.13: Write-ahead queue for crash recovery (#15636) ---
const WAL_FILE = path.join(config.WATCH_DIR, '.wal.json');

function clearStaleState() {
  // v2026.2.13: Clear stale command-queue and heartbeat state after restart (#15195)
  try {
    if (fs.existsSync(WAL_FILE)) {
      const wal = JSON.parse(fs.readFileSync(WAL_FILE, 'utf8'));
      if (wal.inFlight && wal.inFlight.length > 0) {
        log(`WAL RECOVERY: Found ${wal.inFlight.length} in-flight mission(s) — re-queuing`);
        for (const mission of wal.inFlight) {
          const dest = path.join(config.WATCH_DIR, mission.filename);
          if (!fs.existsSync(dest)) {
            fs.writeFileSync(dest, mission.prompt);
            log(`WAL RECOVERY: Re-queued ${mission.filename}`);
          }
        }
      }
      fs.unlinkSync(WAL_FILE);
      log('WAL: Cleared stale write-ahead log');
    }
  } catch (e) {
    log(`WAL: Could not recover — ${e.message}`);
  }

  // v2026.2.13: Archive stale session transcripts (#14869)
  try {
    const gateResults = path.join(__dirname, '.gate-results.json');
    if (fs.existsSync(gateResults)) {
      const stats = fs.statSync(gateResults);
      const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
      if (ageHours > 24) {
        fs.unlinkSync(gateResults);
        log('CLEANUP: Archived stale gate results (>24h)');
      }
    }
  } catch (e) { /* non-critical */ }
}

// --- Self-healing boot: retry each module independently ---
function safeBoot(name, fn) {
  try {
    fn();
    log(`BOOT OK: ${name}`);
  } catch (e) {
    log(`BOOT ERROR (${name}): ${e.message} — will retry in 30s`);
    setTimeout(() => {
      try { fn(); log(`BOOT RETRY OK: ${name}`); }
      catch (e2) { log(`BOOT RETRY FAILED (${name}): ${e2.message}`); }
    }, 30000);
  }
}

// --- Ensure required directories exist ---
try {
  if (!fs.existsSync(config.WATCH_DIR)) fs.mkdirSync(config.WATCH_DIR, { recursive: true });
  if (!fs.existsSync(config.PROCESSED_DIR)) fs.mkdirSync(config.PROCESSED_DIR, { recursive: true });
  if (!fs.existsSync(config.REJECTED_DIR)) fs.mkdirSync(config.REJECTED_DIR, { recursive: true });
} catch (e) {
  log(`WARN: Could not create task dirs: ${e.message}`);
}

// --- v2026.2.13: Clear stale state before boot ---
clearStaleState();

// --- Boot ---
log('--- MISSION CONTROL v2026.2.13 ONLINE (Tmux Interactive) ---');

safeBoot('spawnBrain', spawnBrain);
safeBoot('startWatching', startWatching);
// 防 PROXY_RULES: Validate config alignment BEFORE dispatching any mission
const { validateProxyRules } = require('./lib/proxy-rules-validator');
safeBoot('validateProxyRules', validateProxyRules);
// 🏯 DOANH TRẠI: Validate all soldiers assigned to divisions
const { validateDivisions } = require('./lib/doanh-trai-registry');
safeBoot('validateDivisions', validateDivisions);
// 始計 BINH PHÁP: Auto-CTO RE-ENABLED — "多算勝" (tính nhiều thì thắng)
// Hậu cần tạo pre-analyzed tasks → CC CLI chỉ execute, không scan
safeBoot('startAutoCTO', startAutoCTO);
safeBoot('startCooling', startCooling);
safeBoot('startHealer', startHealer);

log('始計 + 防 + 🏯: Brain + Task Queue + Auto-CTO + M1 Cooling + Self-Healer + Registry ACTIVE');

// --- Keepalive: prevent Node from exiting when event loop is idle ---
const keepalive = setInterval(() => { }, 60000);

// --- Graceful Shutdown ---
let shuttingDown = false;

function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`Received ${sig} — shutting down gracefully`);
  clearInterval(keepalive);
  try { stopWatching(); } catch (e) { log(`Shutdown error (stopWatching): ${e.message}`); }
  try { stopAutoCTO(); } catch (e) { log(`Shutdown error (stopAutoCTO): ${e.message}`); }
  try { stopCooling(); } catch (e) { log(`Shutdown error (stopCooling): ${e.message}`); }
  try { stopHealer(); } catch (e) { log(`Shutdown error (stopHealer): ${e.message}`); }
  // 🔒 DO NOT killBrain() — tmux must survive task-watcher restarts
  // CC CLI context is precious — killing it loses mission progress
  log('All modules stopped (brain preserved). Goodbye.');
  process.exit(0);
}

// --- v2026.2.13: SIGUSR1 in-process restart — clear zombie state (#15195) ---
process.on('SIGUSR1', () => {
  log('Received SIGUSR1 — in-process restart (clearing stale state)');
  try { stopWatching(); } catch (e) { }
  try { stopCooling(); } catch (e) { }
  try { stopHealer(); } catch (e) { }
  clearStaleState();
  safeBoot('spawnBrain', spawnBrain);
  safeBoot('startWatching', startWatching);
  safeBoot('startCooling', startCooling);
  safeBoot('startHealer', startHealer);
  log('SIGUSR1 restart complete — all modules re-initialized');
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

