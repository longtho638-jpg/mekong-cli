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
 *   lib/brain-process-manager.js — Unified Brain Manager (Tmux/Direct/Headless)
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
const { spawnBrain, killBrain, log } = require('./lib/brain-process-manager');
const { startWatching, stopWatching } = require('./lib/task-queue');
const { startAutoCTO, stopAutoCTO } = require('./lib/auto-cto-pilot');
const { startScanner, stopScanner } = require('./lib/project-scanner');
const { startLearningEngine, stopLearningEngine } = require('./lib/learning-engine');
const { startCooling, stopCooling } = require('./lib/m1-cooling-daemon');
const { startMonitor: startHealer, stopMonitor: stopHealer } = require('./lib/self-healer');
const { startLobsterPilot, stopLobsterPilot } = require('./lib/lobster-proxy-pilot');
// 🧠 Brain Supervisor: Unified CTO + CC CLI monitoring
const { startSupervisor, stopSupervisor } = require('./lib/brain-supervisor');
// AGI Level 6: Self-Evolving Engine
const { checkEvolutionTriggers } = require('./lib/evolution-engine');
// AGI Level 7: Multi-Project Commander
const { startCommander, stopCommander } = require('./lib/project-commander');
// 🏥 Health HTTP Server (Phase 06) + DLQ init
const { startHealthServer, stopHealthServer } = require('./lib/brain-health-server');
let evolutionInterval = null;
function startEvolutionEngine() {
  checkEvolutionTriggers(); // Run immediately on boot
  evolutionInterval = setInterval(checkEvolutionTriggers, 2 * 60 * 60 * 1000); // Every 2h
  log('BOOT OK: startEvolutionEngine (Level 6)');
}
function stopEvolutionEngine() {
  if (evolutionInterval) { clearInterval(evolutionInterval); evolutionInterval = null; }
}

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
async function safeBoot(name, fn) {
  try {
    await fn();
    log(`BOOT OK: ${name}`);
  } catch (e) {
    log(`BOOT ERROR (${name}): ${e.message} — will retry in 30s`);
    setTimeout(async () => {
      try { await fn(); log(`BOOT RETRY OK: ${name}`); }
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

// --- 🔒 v2026.2.27: ASYNC MASTER BOOT SEQUENCE 🔒 ---
(async () => {
  log('--- MISSION CONTROL v2026.2.27 ONLINE (FIX: Dual-Stream Flywheel + AGI Deep Upgrade) ---');

  // 🏥 Phase 06: Health endpoint (before anything else — for observability)
  safeBoot('startHealthServer', startHealthServer);

  // Phase 04: Initialize Dead Letter Queue directory
  try { const { initDLQ } = require('./lib/task-queue'); if (initDLQ) initDLQ(); } catch (e) { }

  // FIX #2: Task queue PHẢI ưu tiên số 1 — scan TRƯỚC spawn brain
  // Archive processed missions AFTER dispatch
  const { archiveProcessedMissions } = require('./lib/task-queue');
  await safeBoot('startWatching', startWatching);
  // 🥪 DUAL-PANE SANDWICH ARCHITECTURE (User request 2026-02-27):
  // Pane 0: Claude Pro (Planner) | Pane 1: Gemini Proxy (Executor)
  await safeBoot('spawnBrain:SANDWICH', () => spawnBrain());

  // 🦞🔥 PROACTIVE SELF-HEAL ON BOOT (v2026.2.24)
  // If CC CLI has "queued messages" from a previous crash/failed dispatch,
  // clear them BEFORE any dispatch attempt to prevent the busy→no-dispatch deadlock.
  safeBoot('bootSelfHeal', () => {
    const { execSync } = require('child_process');
    try {
      let cleared = false;
      for (let pIdx = 0; pIdx < 2; pIdx++) {
        try {
          const output = execSync(`tmux capture-pane -t tom_hum:brain.${pIdx} -p 2>/dev/null`, { encoding: 'utf-8', timeout: 3000 });
          if (/queued messages/i.test(output) || /Press up to edit queued/i.test(output)) {
            log(`🩺 BOOT SELF-HEAL: Detected stale "queued messages" on Pane ${pIdx} — auto-clearing with Escape...`);
            for (let i = 0; i < 5; i++) {
              execSync(`tmux send-keys -t tom_hum:brain.${pIdx} Escape`);
              execSync('sleep 0.5');
            }
            cleared = true;
          }
        } catch (e) { }
      }
      if (cleared) {
        log('🩺 BOOT SELF-HEAL: Queued messages cleared ✅');
      } else {
        log('🩺 BOOT SELF-HEAL: CC CLI clean — no queued messages detected.');
      }
    } catch (e) {
      log(`🩺 BOOT SELF-HEAL: Skipped — ${e.message}`);
    }
  });

  // 防 PROXY_RULES: Validate config alignment BEFORE dispatching any mission
  const { validateProxyRules } = require('./lib/proxy-rules-validator');
  safeBoot('validateProxyRules', validateProxyRules);
  // 🏯 DOANH TRẠI: Validate all soldiers assigned to divisions
  const { validateDivisions } = require('./lib/doanh-trai-registry');
  safeBoot('validateDivisions', validateDivisions);
  // 始計 BINH PHÁP: Auto-CTO RE-ENABLED — "多算勝" (tính nhiều thì thắng)
  // Hậu cần tạo pre-analyzed tasks → CC CLI chỉ execute, không scan
  safeBoot('startAutoCTO', startAutoCTO);
  // AGI Level 4: Self-Planning Scanner
  safeBoot('startScanner', startScanner);
  // AGI Level 5: Self-Learning Engine (Dụng Gián)
  safeBoot('startLearningEngine', startLearningEngine);
  // AGI Level 6: Self-Evolving Engine (九地)
  safeBoot('startEvolutionEngine', startEvolutionEngine);
  // AGI Level 7: Multi-Project Commander (火攻)
  safeBoot('startCommander', startCommander);
  // AGI Level 10: Self-Analyzer + Cross-Session Memory
  safeBoot('startSelfAnalyzer', () => {
    const { recordSessionStart, getAGIScore } = require('./lib/self-analyzer');
    recordSessionStart();
    const agi = getAGIScore();
    log(`🧠 AGI SCORE: ${agi.total}/100 (Level ${agi.level}) — Vision:${agi.components.vision} Learn:${agi.components.learning} Auto:${agi.components.autonomy} Mem:${agi.components.memory} Win:${agi.components.success}`);
  });
  // AGI Level 11: ClawWork Economic Benchmark
  safeBoot('startClawWork', () => {
    const { getEconomicStats } = require('./lib/clawwork-integration');
    const stats = getEconomicStats();
    log(`💰 CLAWWORK: ${stats.completedTasks}/${stats.totalTasks} GDPVal tasks (${stats.completionRate}%) — Balance: $${stats.balance}`);
  });
  // AGI Level 12: Moltbook Agent Identity
  safeBoot('startMoltbook', async () => {
    const { onDaemonBoot } = require('./lib/moltbook-integration');
    const { getAGIScore } = require('./lib/self-analyzer');
    const agi = getAGIScore();
    await onDaemonBoot(agi.total);
  });
  // Google Ultra Integration (用間 Espionage)
  safeBoot('startGoogleUltra', () => {
    const { checkAuthStatus, getAccount } = require('./lib/google-ultra');
    const acc = getAccount();
    if (acc) {
      log(`🔑 GOOGLE ULTRA: Authenticated as ${acc} — Drive/Docs/Sheets/Gmail/Calendar ONLINE`);
      // Start periodic intelligence gathering loop
      const { startIntelLoop } = require('./lib/google-ultra');
      startIntelLoop(['well']);
      log(`🔄 GOOGLE ULTRA: Intel loop activated — scanning Drive/Gmail/Calendar every 10min for project insights`);
    } else {
      log(`⚠️ GOOGLE ULTRA: No accounts — run 'gog login <email>' to enable`);
    }
  });
  // Gemini AI Agentic Ecosystem (用間 Deep 100x)
  safeBoot('startGeminiAgentic', async () => {
    const { checkGeminiStatus } = require('./lib/gemini-agentic');
    const status = await checkGeminiStatus();
    if (status === 'ONLINE') {
      log(`🤖 GEMINI AGENTIC: ${status} — Search Grounding + Code Execution + Deep Research + Architecture Advisor ACTIVE`);
    } else {
      log(`⚠️ GEMINI AGENTIC: ${status} — check GEMINI_API_KEY in .env`);
    }
  });
  // Jules Agent — Google's AI Coding Agent (九地)
  safeBoot('startJulesAgent', async () => {
    const { checkJulesStatus, checkActiveSessions } = require('./lib/jules-agent');
    const status = await checkJulesStatus();
    if (status === 'ONLINE') {
      log(`🤖 JULES AGENT: ${status} — 16 GitHub repos connected. Auto-PR dispatch READY`);
      // Check for any active sessions
      const sessions = await checkActiveSessions();
      if (sessions.length > 0) log(`📋 JULES: ${sessions.length} active session(s)`);
    } else {
      log(`⚠️ JULES AGENT: ${status} — check API key at jules.google.com/settings`);
    }
  });
  safeBoot('startCooling', startCooling);
  safeBoot('startHealer', startHealer);
  // 🦞 Lobster Proxy Pilot (Guardian of Quota)
  safeBoot('startLobsterPilot', startLobsterPilot);
  // 🧠 Brain Supervisor (知己知彼: monitor BOTH CTO + CC CLI)
  safeBoot('startSupervisor', startSupervisor);

  // 🏭 BOOT DISPATCH: DISABLED — Vibe Factory Binh Pháp Scanner now handles idle pane task injection
  // Old BOOT_TASKS caused /cook conflicts with new /plan:hard Binh Pháp format.
  // See: vibe-factory-monitor.js for the new round-robin chapter-based task generation.
  safeBoot('bootDispatchTasks', () => {
    log('🏭 BOOT DISPATCH: DISABLED — Vibe Factory Binh Pháp Scanner handles task injection');
  });

  log('始計 + 防 + 🏯: Task Queue PRIORITY #1 → Brain + Auto-CTO + Scanner + Cooling + Healer + Supervisor + BOOT DISPATCH ACTIVE');
})();

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
  try { stopScanner(); } catch (e) { log(`Shutdown error (stopScanner): ${e.message}`); }
  try { stopLearningEngine(); } catch (e) { log(`Shutdown error (stopLearningEngine): ${e.message}`); }
  try { stopEvolutionEngine(); } catch (e) { log(`Shutdown error (stopEvolutionEngine): ${e.message}`); }
  try { stopCommander(); } catch (e) { log(`Shutdown error (stopCommander): ${e.message}`); }
  try { stopCooling(); } catch (e) { log(`Shutdown error (stopCooling): ${e.message}`); }
  try { stopHealer(); } catch (e) { log(`Shutdown error (stopHealer): ${e.message}`); }
  try { stopLobsterPilot(); } catch (e) { log(`Shutdown error (stopLobsterPilot): ${e.message}`); }
  try { stopSupervisor(); } catch (e) { log(`Shutdown error (stopSupervisor): ${e.message}`); }
  try { stopHealthServer(); } catch (e) { log(`Shutdown error (stopHealthServer): ${e.message}`); }
  // 🔒 DO NOT killBrain() — tmux must survive task-watcher restarts
  // CC CLI context is precious — killing it loses mission progress
  log('All modules stopped (brain preserved). Goodbye.');
  process.exit(0);
}

// --- v2026.2.13: SIGUSR1 in-process restart — clear zombie state (#15195) ---
process.on('SIGUSR1', () => {
  log('Received SIGUSR1 — in-process restart (clearing stale state)');
  try { stopWatching(); } catch (e) { }
  try { stopAutoCTO(); } catch (e) { }
  try { stopScanner(); } catch (e) { }
  try { stopLearningEngine(); } catch (e) { }
  try { stopEvolutionEngine(); } catch (e) { }
  try { stopCommander(); } catch (e) { }
  try { stopCooling(); } catch (e) { }
  try { stopHealer(); } catch (e) { }
  try { stopLobsterPilot(); } catch (e) { }
  try { stopSupervisor(); } catch (e) { }
  try { stopHealthServer(); } catch (e) { }

  // 🧬 Hot-reload: Invalidate require.cache for all lib/ modules
  // Without this, SIGUSR1 restart keeps OLD code in memory
  const libDir = path.join(__dirname, 'lib');
  Object.keys(require.cache).forEach(key => {
    if (key.startsWith(libDir) || key.includes('config.js')) {
      delete require.cache[key];
    }
  });
  log('SIGUSR1: require.cache cleared for lib/ — hot-reload active');

  clearStaleState();
  safeBoot('spawnBrain', spawnBrain);
  safeBoot('startWatching', startWatching);
  safeBoot('startAutoCTO', startAutoCTO);
  safeBoot('startScanner', startScanner);
  safeBoot('startLearningEngine', startLearningEngine);
  safeBoot('startEvolutionEngine', startEvolutionEngine);
  safeBoot('startCommander', startCommander);
  safeBoot('startCooling', startCooling);
  safeBoot('startHealer', startHealer);
  safeBoot('startLobsterPilot', startLobsterPilot);
  safeBoot('startSupervisor', startSupervisor);
  safeBoot('startHealthServer', startHealthServer);
  log('SIGUSR1 restart complete — all modules re-initialized (including Auto-CTO + Health Server)');
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

