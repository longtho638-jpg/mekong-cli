#!/usr/bin/env node
/**
 * TOM HUM (OpenClaw) Task Watcher — v28.0 TMUX INTERACTIVE
 *
 * Thin orchestrator: imports modules, wires lifecycle, handles shutdown.
 * Runs FOREVER as a daemon — never exits after queue empties.
 * Self-healing: any exception → log + sleep 30s + continue.
 *
 * v28 changes:
 *   - Uses brain-tmux (CC CLI interactive via tmux session)
 *   - Full agents/skills/CLAUDE.md context (unlike headless claude -p)
 *   - Context management: /clear at 85%, /compact every 5 missions
 *   - Crash recovery: auto-respawn with --continue
 *
 * Modules:
 *   config.js                    — All constants, paths, env vars
 *   lib/brain-tmux.js            — Tmux brain (CC CLI interactive session)
 *   lib/mission-dispatcher.js    — Prompt building, project routing
 *   lib/task-queue.js            — File watching, queuing, archiving
 *   lib/auto-cto-pilot.js        — Binh Phap auto-task generation
 *   lib/m1-cooling-daemon.js     — M1 thermal management + thermal gate
 */

const fs = require('fs');
const config = require('./config');

// --- Unhandled error protection FIRST: log but do NOT crash the daemon ---
process.on('uncaughtException', (err) => {
  const msg = `[${new Date().toISOString().slice(11,19)}] [tom-hum] UNCAUGHT EXCEPTION (daemon stays alive): ${err.stack || err.message}\n`;
  process.stderr.write(msg);
  try { fs.appendFileSync(config.LOG_FILE, msg); } catch (e) {}
});
process.on('unhandledRejection', (reason) => {
  const msg = `[${new Date().toISOString().slice(11,19)}] [tom-hum] UNHANDLED REJECTION (daemon stays alive): ${reason}\n`;
  process.stderr.write(msg);
  try { fs.appendFileSync(config.LOG_FILE, msg); } catch (e) {}
});

// --- Import modules (headless brain instead of external brain) ---
const { spawnBrain, killBrain, log } = require('./lib/brain-tmux');
const { startWatching, stopWatching } = require('./lib/task-queue');
const { startAutoCTO, stopAutoCTO } = require('./lib/auto-cto-pilot');
const { startCooling, stopCooling } = require('./lib/m1-cooling-daemon');

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
} catch (e) {
  log(`WARN: Could not create task dirs: ${e.message}`);
}

// --- Boot ---
log('--- MISSION CONTROL v28.0 ONLINE (Tmux Interactive) ---');

safeBoot('spawnBrain', spawnBrain);
safeBoot('startWatching', startWatching);
safeBoot('startAutoCTO', startAutoCTO);
safeBoot('startCooling', startCooling);

log('Tmux Brain + File Watcher + Auto-CTO + M1 Cooling ACTIVE');

// --- Keepalive: prevent Node from exiting when event loop is idle ---
const keepalive = setInterval(() => {}, 60000);

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
  try { killBrain(); } catch (e) { log(`Shutdown error (killBrain): ${e.message}`); }
  log('All modules stopped. Goodbye.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
