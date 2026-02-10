/**
 * Brain Process Manager v2026.3.0 — Tri-mode, dual-engine CC CLI brain
 *
 * Engines: 'antigravity' (port 8080, default) or 'qwen' (port 8081, Qwen Bridge)
 *   Set TOM_HUM_ENGINE=qwen to use Qwen models via DashScope.
 *
 * Modes:
 *   'interactive' (default) — expect PTY → Claude Code interactive UI, ClaudeKit agents work
 *   'direct'               — claude -p per mission, headless
 *   'tmux'                 — persistent tmux session, fallback
 *
 * Recovery: model failover on HTTP 400, context overflow prompt truncation
 *   See lib/mission-recovery.js for patterns and constants.
 *
 * Exports (unchanged API): spawnBrain, killBrain, isBrainAlive, runMission, log
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const recovery = require('./mission-recovery');

let missionCount = 0;
let currentProc = null;

// --- Shared helpers ---

function getApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const keyFile = path.join(process.env.HOME || '', '.mekong', 'api-key');
  try { return fs.readFileSync(keyFile, 'utf-8').trim(); } catch (e) { return ''; }
}

function log(msg) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const formatted = `[${timestamp}] [tom-hum] ${msg}\n`;
  process.stderr.write(formatted);
  try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) {}
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function tmux(cmd) {
  return execSync(`tmux ${cmd}`, { encoding: 'utf-8', timeout: 10000 }).trim();
}

// --- Engine helpers ---

const isQwen = config.ENGINE === 'qwen';

function getProxyPort() {
  return isQwen ? config.QWEN_PROXY_PORT : config.PROXY_PORT;
}

function getModelName() {
  return isQwen ? config.QWEN_MODEL_NAME : config.MODEL_NAME;
}

function getEngineLabel() {
  return isQwen ? `qwen (port ${config.QWEN_PROXY_PORT})` : `antigravity (port ${config.PROXY_PORT})`;
}

// =============================================================================
// DIRECT MODE — claude -p per mission (default)
// =============================================================================

function spawnBrainDirect() {
  log(`BRAIN v2026.2.9: Direct mode (claude -p) | Engine: ${getEngineLabel()}`);
  log('All ClaudeKit agents/tools supported. Watch via: node lib/live-mission-viewer.js');
}

function killBrainDirect() {
  if (currentProc) {
    try { currentProc.kill('SIGTERM'); } catch (e) {}
    currentProc = null;
  }
}

function isBrainAliveDirect() { return true; }

function spawnDirectProc(prompt, projectDir, timeoutMs, opts = {}) {
  return new Promise((resolve) => {
    const num = opts.missionNum || missionCount;
    const startTime = Date.now();
    const apiKey = getApiKey();
    const proxyPort = getProxyPort();
    const modelName = opts.modelOverride || getModelName();
    const proc = spawn('claude', [
      '-p', prompt,
      '--model', modelName,
      '--dangerously-skip-permissions',
    ], {
      cwd: projectDir,
      env: {
        ...process.env,
        ANTHROPIC_BASE_URL: `http://127.0.0.1:${proxyPort}`,
        ANTHROPIC_API_KEY: apiKey,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    currentProc = proc;
    let output = '';
    let stderrBuf = '';

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      try { fs.appendFileSync(config.LOG_FILE, text); } catch (e) {}
    });

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderrBuf += text;
      try { fs.appendFileSync(config.LOG_FILE, `[stderr] ${text}`); } catch (e) {}
    });

    const timer = setTimeout(() => {
      log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s`);
      try { proc.kill('SIGTERM'); } catch (e) {}
    }, timeoutMs);

    const heartbeat = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`Mission #${num} working -- ${elapsed}s`);
    }, 60000);

    proc.on('close', (code) => {
      clearTimeout(timer);
      clearInterval(heartbeat);
      currentProc = null;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const success = code === 0;
      resolve({ success, code, output, stderr: stderrBuf, elapsed, num });
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      clearInterval(heartbeat);
      currentProc = null;
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`ERROR: Mission #${num} spawn failed: ${err.message}`);
      resolve({ success: false, code: -1, output: '', stderr: err.message, elapsed, num });
    });
  });
}

async function runMissionDirect(prompt, projectDir, timeoutMs) {
  missionCount++;
  const num = missionCount;
  log(`MISSION #${num}: ${prompt.slice(0, 150)}...`);
  log(`PROJECT: ${projectDir} | MODE: direct | ENGINE: ${getEngineLabel()}`);

  const result = await spawnDirectProc(prompt, projectDir, timeoutMs, { missionNum: num });

  if (result.success) {
    log(`COMPLETE: Mission #${num} (${result.elapsed}s, exit=0)`);
    return { success: true, result: 'done', elapsed: result.elapsed };
  }

  // Check for recoverable errors before giving up
  const combined = `${result.output}\n${result.stderr}`;
  const diagnosis = recovery.diagnoseFailure(combined);

  if (diagnosis.action === 'model_failover') {
    log(`MODEL FAILOVER: Retrying with fallback model ${diagnosis.model}...`);
    const retry = await spawnDirectProc(prompt, projectDir, timeoutMs, {
      missionNum: num, modelOverride: diagnosis.model,
    });
    log(`${retry.success ? 'COMPLETE' : 'FAILED'}: Mission #${num} retry (${retry.elapsed}s, exit=${retry.code})`);
    return { success: retry.success, result: retry.success ? 'done' : `exit_${retry.code}`, elapsed: result.elapsed + retry.elapsed };
  }

  if (diagnosis.action === 'context_truncate') {
    log(`CONTEXT OVERFLOW: Retrying with truncated prompt...`);
    const truncated = recovery.truncatePrompt(prompt);
    const retry = await spawnDirectProc(truncated, projectDir, timeoutMs, { missionNum: num });
    log(`${retry.success ? 'COMPLETE' : 'FAILED'}: Mission #${num} retry (${retry.elapsed}s, exit=${retry.code})`);
    return { success: retry.success, result: retry.success ? 'done' : `exit_${retry.code}`, elapsed: result.elapsed + retry.elapsed };
  }

  log(`FAILED: Mission #${num} (${result.elapsed}s, exit=${result.code})`);
  return { success: false, result: `exit_${result.code}`, elapsed: result.elapsed };
}

// =============================================================================
// INTERACTIVE MODE — expect PTY → Claude Code official interactive UI (default)
// Fixes applied from CC CLI audit: shutdown flag, respawn rate limit,
// crash-aware promise, model passthrough
// =============================================================================

let expectProc = null;
let shuttingDown = false;       // Issue #1: prevent respawn after kill
let lastSpawnTime = 0;          // Issue #2: rapid failure detection
let rapidFailCount = 0;         // Issue #2: consecutive rapid crash counter
let activeMissionReject = null; // Issue #4: crash-aware promise resolution
let activeMissionStart = 0;     // N1 fix: track mission start for elapsed calc in crash handler

function spawnBrainInteractive() {
  const proxyPort = getProxyPort();
  const apiKey = getApiKey();
  const modelName = getModelName();
  lastSpawnTime = Date.now();
  log(`BRAIN v2026.4.0: Interactive mode (VISIBLE tmux) | Engine: ${getEngineLabel()}`);
  log('Watch live: tmux attach -t tom-hum-brain');

  // Clean up stale files
  try { fs.unlinkSync(config.MISSION_FILE); } catch (e) {}
  try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}

  // Kill any existing tmux session
  try { execSync('tmux kill-session -t tom-hum-brain 2>/dev/null'); } catch (e) {}

  // Build the expect command
  const expectCmd = [
    'expect',
    config.EXPECT_SCRIPT,
    config.MEKONG_DIR,
    config.LOG_FILE,
    String(proxyPort),
    apiKey,
    modelName,
  ].join(' ');

  // Spawn expect inside a VISIBLE tmux session
  // User can `tmux attach -t tom-hum-brain` to watch CC CLI live
  try {
    execSync(`tmux new-session -d -s tom-hum-brain -x ${config.TMUX_WIDTH} -y ${config.TMUX_HEIGHT} '${expectCmd}'`, {
      cwd: config.MEKONG_DIR,
      timeout: 10000,
    });
  } catch (err) {
    log(`FATAL: Failed to create tmux session: ${err.message}`);
    return;
  }

  // Monitor the tmux session for death — poll every 5s
  const monitorInterval = setInterval(() => {
    let alive = false;
    try {
      execSync('tmux has-session -t tom-hum-brain 2>/dev/null');
      alive = true;
    } catch (e) {}

    if (!alive) {
      clearInterval(monitorInterval);
      const uptime = Date.now() - lastSpawnTime;

      // Issue #4: resolve any in-flight mission promise
      if (activeMissionReject) {
        activeMissionReject({ success: false, result: 'brain_crashed', elapsed: Math.round((Date.now() - activeMissionStart) / 1000) });
        activeMissionReject = null;
        activeMissionStart = 0;
      }

      // Issue #1: don't respawn during shutdown
      if (shuttingDown) {
        log('Tmux brain session ended. Shutdown — no respawn.');
        return;
      }

      // Issue #2: rate-limit rapid failures
      if (uptime < 10000) {
        rapidFailCount++;
        if (rapidFailCount >= 5) {
          log('BRAIN RESPAWN HALTED: 5 rapid failures in a row.');
          return;
        }
      } else {
        rapidFailCount = 0;
      }

      const delay = Math.min(5000 * Math.pow(2, rapidFailCount), 60000);
      log(`Tmux brain died (uptime=${Math.round(uptime / 1000)}s). Respawning in ${delay / 1000}s...`);
      setTimeout(() => {
        if (!shuttingDown) spawnBrainInteractive();
      }, delay);
    }
  }, 5000);

  // Store interval ref for cleanup
  expectProc = { kill: () => {
    clearInterval(monitorInterval);
    try { execSync('tmux kill-session -t tom-hum-brain 2>/dev/null'); } catch (e) {}
  }};

  log('Tmux session "tom-hum-brain" created');
}

function killBrainInteractive() {
  shuttingDown = true; // Issue #1: signal intentional shutdown
  if (expectProc) {
    try { expectProc.kill('SIGTERM'); } catch (e) {}
    expectProc = null;
  }
}

function isBrainAliveInteractive() {
  if (!expectProc) return false;
  try {
    execSync('tmux has-session -t tom-hum-brain 2>/dev/null');
    return true;
  } catch (e) { return false; }
}

async function runMissionInteractive(prompt, projectDir, timeoutMs) {
  missionCount++;
  const num = missionCount;
  const startTime = Date.now();

  // Respawn if brain died
  if (!isBrainAliveInteractive()) {
    log(`Brain dead before mission #${num} — respawning`);
    shuttingDown = false; // Reset shutdown flag for new spawn
    spawnBrainInteractive();
    await sleep(15000); // Wait for CC CLI to boot
  }

  log(`MISSION #${num}: ${prompt.slice(0, 150)}...`);
  log(`PROJECT: ${projectDir} | MODE: interactive | ENGINE: ${getEngineLabel()}`);

  // Clean done file before dispatching
  try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}

  // Prepend project context if not in default dir
  let fullPrompt = prompt;
  if (projectDir !== config.MEKONG_DIR) {
    fullPrompt = `First cd to ${projectDir} then: ${prompt}`;
  }

  // Write mission file — expect script will pick it up
  fs.writeFileSync(config.MISSION_FILE, fullPrompt);
  log(`Mission file written → ${config.MISSION_FILE}`);

  // Wait for done signal OR brain crash
  return new Promise((resolve) => {
    activeMissionReject = resolve;
    activeMissionStart = startTime;

    const heartbeat = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`Mission #${num} working — ${elapsed}s`);
    }, 60000);

    const cleanup = () => {
      clearInterval(heartbeat);
      clearTimeout(timer);
      clearInterval(healthPoll);
      fs.unwatchFile(config.DONE_FILE); // Stop fs.watchFile listener
      activeMissionReject = null;
      activeMissionStart = 0;
    };

    // Shared handler: check done file, resolve promise if found
    let resolved = false;
    const checkDoneFile = () => {
      if (resolved) return;
      try {
        if (fs.existsSync(config.DONE_FILE)) {
          const signal = fs.readFileSync(config.DONE_FILE, 'utf-8').trim();
          resolved = true;
          cleanup();
          try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const success = signal !== 'timeout';
          log(`${success ? 'COMPLETE' : 'TIMEOUT'}: Mission #${num} (${elapsed}s, signal=${signal})`);
          resolve({ success, result: success ? 'done' : 'timeout', elapsed });
        }
      } catch (e) {}
    };

    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s`);
      resolve({ success: false, result: 'timeout', elapsed: Math.round((Date.now() - startTime) / 1000) });
    }, timeoutMs);

    // Primary: fs.watchFile detects done file creation within ~500ms
    fs.watchFile(config.DONE_FILE, { interval: 500 }, (curr) => {
      if (curr.size > 0) checkDoneFile();
    });

    // Fallback: 3s poll for brain health check + backup done detection
    const healthPoll = setInterval(() => {
      if (resolved) return;
      if (!isBrainAliveInteractive()) {
        resolved = true;
        cleanup();
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        log(`BRAIN CRASHED: Mission #${num} aborted (${elapsed}s)`);
        resolve({ success: false, result: 'brain_crashed', elapsed });
        return;
      }
      checkDoneFile(); // Backup in case fs.watchFile missed the event
    }, 3000);
  });
}

// =============================================================================
// TMUX MODE — persistent visible session (fallback)
// =============================================================================

function capturePane() {
  try { return tmux(`capture-pane -t ${config.TMUX_SESSION} -p`); } catch (e) { return ''; }
}

function isPromptVisible(paneText) {
  const lines = paneText.split('\n').filter((l) => l.trim());
  if (!lines.length) return false;
  const last = lines[lines.length - 1];
  return last.includes('\u276f') || />\s*$/.test(last);
}

function spawnBrainTmux() {
  log(`BRAIN v2026.2.9: Tmux mode (persistent visible session) | Engine: ${getEngineLabel()}`);
  try { tmux(`kill-session -t ${config.TMUX_SESSION}`); } catch (e) {}
  try { fs.unlinkSync(config.MISSION_FILE); } catch (e) {}
  try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}
  tmux(`new-session -d -s ${config.TMUX_SESSION} -x ${config.TMUX_WIDTH} -y ${config.TMUX_HEIGHT}`);
  const apiKey = getApiKey();
  const proxyPort = getProxyPort();
  const modelName = getModelName();
  const cliCmd = [
    `cd ${config.MEKONG_DIR}`, '&&',
    `ANTHROPIC_BASE_URL=http://127.0.0.1:${proxyPort}`,
    `ANTHROPIC_API_KEY=${apiKey}`,
    'claude', `--model ${modelName}`, '--dangerously-skip-permissions',
  ].join(' ');
  tmux(`send-keys -t ${config.TMUX_SESSION} -l ${JSON.stringify(cliCmd)}`);
  tmux(`send-keys -t ${config.TMUX_SESSION} Enter`);
  log(`Tmux session "${config.TMUX_SESSION}" created — tmux attach to watch`);
}

function killBrainTmux() {
  try { tmux(`kill-session -t ${config.TMUX_SESSION}`); } catch (e) {}
}

function isBrainAliveTmux() {
  try { execSync(`tmux has-session -t ${config.TMUX_SESSION}`, { timeout: 5000 }); return true; }
  catch (e) { return false; }
}

async function waitForPrompt(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (isPromptVisible(capturePane())) {
      await sleep(config.PROMPT_DEBOUNCE_MS);
      if (isPromptVisible(capturePane())) return true;
    }
    await sleep(config.POLL_INTERVAL_MS);
  }
  return false;
}

async function runMissionTmux(prompt, projectDir, timeoutMs) {
  missionCount++;
  const num = missionCount;
  const startTime = Date.now();

  if (!isBrainAliveTmux()) {
    log(`Brain dead before mission #${num} — respawning`);
    spawnBrainTmux();
    if (!(await waitForPrompt())) {
      return { success: false, result: 'brain_spawn_timeout', elapsed: 0 };
    }
  }

  log(`MISSION #${num}: ${prompt.slice(0, 150)}...`);
  log(`PROJECT: ${projectDir} | MODE: tmux | ENGINE: ${getEngineLabel()}`);
  tmux(`send-keys -t ${config.TMUX_SESSION} -l ${JSON.stringify(`cd ${projectDir}`)}`);
  tmux(`send-keys -t ${config.TMUX_SESSION} Enter`);
  await sleep(1000);
  tmux(`send-keys -t ${config.TMUX_SESSION} -l ${JSON.stringify(prompt)}`);
  tmux(`send-keys -t ${config.TMUX_SESSION} Enter`);
  await sleep(5000);

  const heartbeat = setInterval(() => {
    log(`Mission #${num} working -- ${Math.round((Date.now() - startTime) / 1000)}s`);
  }, 60000);

  const completed = await waitForPrompt(timeoutMs);
  clearInterval(heartbeat);
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  if (completed) {
    log(`COMPLETE: Mission #${num} (${elapsed}s)`);
    return { success: true, result: 'done', elapsed };
  }
  log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s`);
  return { success: false, result: 'timeout', elapsed };
}

// =============================================================================
// EXTERNAL MODE — brain managed in a separate visible terminal
// task-watcher writes prompt to MISSION_FILE, polls DONE_FILE for completion.
// The expect script (tom-hum-dispatch.exp) handles actual CC CLI interaction.
// =============================================================================

function isBrainAliveExternal() {
  try { execSync('pgrep -f "expect.*tom-hum-dispatch"', { timeout: 3000 }); return true; }
  catch (e) { return false; }
}

async function runMissionExternal(prompt, projectDir, timeoutMs) {
  missionCount++;
  const num = missionCount;
  const startTime = Date.now();

  if (!isBrainAliveExternal()) {
    log(`Brain not running (pgrep tom-hum-dispatch failed) — cannot dispatch mission #${num}`);
    return { success: false, result: 'brain_not_running', elapsed: 0 };
  }

  log(`MISSION #${num}: ${prompt.slice(0, 150)}...`);
  log(`PROJECT: ${projectDir} | MODE: external`);

  // Clean done file before dispatching
  try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}

  // Write mission file — expect script picks it up
  let fullPrompt = prompt;
  if (projectDir !== config.MEKONG_DIR) {
    fullPrompt = `First cd to ${projectDir} then: ${prompt}`;
  }
  fs.writeFileSync(config.MISSION_FILE, fullPrompt);

  // Wait for expect to consume (delete) the mission file — confirms handoff
  const consumeDeadline = Date.now() + 30000; // 30s max wait
  while (fs.existsSync(config.MISSION_FILE)) {
    if (Date.now() > consumeDeadline) {
      log(`WARN: Mission file not consumed within 30s — expect may be busy`);
      break;
    }
    await sleep(500);
  }
  log(`Mission file consumed by expect brain — polling for done signal`);

  // Poll for done signal with timeout
  return new Promise((resolve) => {
    let resolved = false;

    const heartbeat = setInterval(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`Mission #${num} working — ${elapsed}s`);
    }, 60000);

    const cleanup = () => {
      clearInterval(heartbeat);
      clearTimeout(timer);
      clearInterval(poll);
    };

    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      cleanup();
      log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s`);
      resolve({ success: false, result: 'timeout', elapsed: Math.round((Date.now() - startTime) / 1000) });
    }, timeoutMs);

    const poll = setInterval(() => {
      if (resolved) return;

      // Check if brain died mid-mission
      if (!isBrainAliveExternal()) {
        resolved = true;
        cleanup();
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        log(`BRAIN DIED: Mission #${num} aborted (${elapsed}s)`);
        resolve({ success: false, result: 'brain_died', elapsed });
        return;
      }

      // Check for done file
      try {
        if (fs.existsSync(config.DONE_FILE)) {
          const signal = fs.readFileSync(config.DONE_FILE, 'utf-8').trim();
          resolved = true;
          cleanup();
          try { fs.unlinkSync(config.DONE_FILE); } catch (e) {}
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          const success = signal !== 'timeout';
          log(`${success ? 'COMPLETE' : 'TIMEOUT'}: Mission #${num} (${elapsed}s, signal=${signal})`);
          resolve({ success, result: success ? 'done' : 'timeout', elapsed });
        }
      } catch (e) {}
    }, config.POLL_INTERVAL_MS);
  });
}

// =============================================================================
// Mode dispatch — export unified API
// =============================================================================

const modeMap = {
  interactive: {
    spawnBrain: spawnBrainInteractive,
    killBrain: killBrainInteractive,
    isBrainAlive: isBrainAliveInteractive,
    runMission: runMissionInteractive,
  },
  direct: {
    spawnBrain: spawnBrainDirect,
    killBrain: killBrainDirect,
    isBrainAlive: isBrainAliveDirect,
    runMission: runMissionDirect,
  },
  tmux: {
    spawnBrain: spawnBrainTmux,
    killBrain: killBrainTmux,
    isBrainAlive: isBrainAliveTmux,
    runMission: runMissionTmux,
  },
  external: {
    // Brain runs in a VISIBLE terminal — task-watcher does NOT spawn/kill it
    spawnBrain: () => { log('BRAIN MODE: external — CC CLI runs in visible terminal. No spawn needed.'); },
    killBrain: () => { log('BRAIN MODE: external — CC CLI managed externally. No kill.'); },
    isBrainAlive: isBrainAliveExternal,
    runMission: runMissionExternal,
  },
};

const active = modeMap[config.BRAIN_MODE] || modeMap.external;

module.exports = {
  spawnBrain:   active.spawnBrain,
  killBrain:    active.killBrain,
  isBrainAlive: active.isBrainAlive,
  runMission:   active.runMission,
  log,
};
