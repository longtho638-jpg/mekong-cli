#!/usr/bin/env node
/**
 * TOM HUM (OpenClaw) Task Watcher — v25.1 DAEMON MODE
 *
 * Thin orchestrator: imports modules, wires lifecycle, handles shutdown.
 * Runs FOREVER as a daemon — never exits after queue empties.
 *
 * Modules:
 *   config.js               — All constants, paths, env vars
 *   lib/brain-process-manager.js — Spawn/monitor/kill expect brain
 *   lib/mission-dispatcher.js    — Atomic file IPC, prompt building
 *   lib/task-queue.js            — File watching, queuing, archiving
 *   lib/auto-cto-pilot.js       — Binh Phap auto-task generation
 *   lib/m1-cooling-daemon.js     — M1 thermal management
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

const { spawnBrain, killBrain, log } = require('./lib/brain-process-manager');
const { startWatching, stopWatching } = require('./lib/task-queue');
const { startAutoCTO, stopAutoCTO } = require('./lib/auto-cto-pilot');
const { startCooling, stopCooling } = require('./lib/m1-cooling-daemon');

// --- Ensure required directories exist ---
try {
  if (!fs.existsSync(config.WATCH_DIR)) fs.mkdirSync(config.WATCH_DIR, { recursive: true });
  if (!fs.existsSync(config.PROCESSED_DIR)) fs.mkdirSync(config.PROCESSED_DIR, { recursive: true });
} catch (e) {
  log(`WARN: Could not create task dirs: ${e.message}`);
}

// --- Boot (wrapped in try/catch so daemon survives partial failures) ---
log('--- MISSION CONTROL v25.1 ONLINE (Daemon Mode) ---');

try { spawnBrain(); } catch (e) { log(`BOOT ERROR (spawnBrain): ${e.message}`); }
try { startWatching(); } catch (e) { log(`BOOT ERROR (startWatching): ${e.message}`); }
try { startAutoCTO(); } catch (e) { log(`BOOT ERROR (startAutoCTO): ${e.message}`); }
try { startCooling(); } catch (e) { log(`BOOT ERROR (startCooling): ${e.message}`); }

log('Persistent Brain + File Watcher + Auto-CTO + M1 Cooling ACTIVE');

// --- Keepalive: prevent Node from exiting when event loop is idle ---
const keepalive = setInterval(() => {}, 60000);

// --- Graceful Shutdown ---
let shuttingDown = false;

function shutdown(sig) {
  if (shuttingDown) return;
  shuttingDown = true;
  log(`Received ${sig} — shutting down gracefully`);
  clearInterval(keepalive);
  stopWatching();
  stopAutoCTO();
  stopCooling();
  killBrain();
  log('All modules stopped. Goodbye.');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
