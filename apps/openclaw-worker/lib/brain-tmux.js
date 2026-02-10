/**
 * Brain Tmux — CC CLI interactive mode via tmux session
 *
 * Why? `claude -p` (headless) lacks agents/skills/CLAUDE.md context.
 * Interactive mode has full context. Tmux gives programmatic control.
 *
 * Architecture:
 *   spawnBrain()  → tmux new-session + launch CC CLI interactive
 *   runMission()  → tmux paste-buffer (prompt) + poll capture-pane (❯ = done)
 *   killBrain()   → tmux kill-session
 *
 * Context management:
 *   - Tracks 🔋 XX% from capture-pane output
 *   - /clear when > 85%, /compact every 5 missions
 *
 * Crash recovery:
 *   - Detects tmux session death → respawn with --continue
 *   - Rate-limited: max 5 respawns/hour, then 5min cooldown
 *
 * Exports: spawnBrain, killBrain, isBrainAlive, runMission, log
 */

const { execSync } = require('child_process');
const fs = require('fs');
const config = require('../config');

const TMUX_SESSION = 'tom_hum_brain';
const CONTEXT_WARN_PCT = 85;
const COMPACT_EVERY_N = 5;
const MAX_RESPAWNS_PER_HOUR = 5;
const RESPAWN_COOLDOWN_MS = 5 * 60 * 1000;
const PROMPT_FILE = '/tmp/tom_hum_prompt.txt';

let missionCount = 0;
let respawnTimestamps = [];

// --- Logging ---

function log(msg) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const formatted = `[${timestamp}] [tom-hum] ${msg}\n`;
  process.stderr.write(formatted);
  try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// --- Tmux helpers ---

function tmuxExec(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
  } catch (e) { return ''; }
}

function isSessionAlive() {
  try {
    execSync(`tmux has-session -t ${TMUX_SESSION} 2>/dev/null`, { timeout: 5000 });
    return true;
  } catch (e) { return false; }
}

function capturePane() {
  return tmuxExec(`tmux capture-pane -t ${TMUX_SESSION} -p -S -50`);
}

/** Get last non-empty line from captured pane */
function getLastLine(output) {
  const lines = output.split('\n').filter(l => l.trim());
  return lines[lines.length - 1] || '';
}

/** Detect CC CLI prompt (❯) at end of captured output */
function hasPrompt(output) {
  const last = getLastLine(output);
  return last.includes('❯');
}

/** Send prompt via tmux paste-buffer (handles long text, special chars) */
function pasteText(text) {
  fs.writeFileSync(PROMPT_FILE, text);
  tmuxExec(`tmux load-buffer ${PROMPT_FILE}`);
  tmuxExec(`tmux paste-buffer -t ${TMUX_SESSION}`);
  try { fs.unlinkSync(PROMPT_FILE); } catch (e) {}
}

function sendEnter() {
  tmuxExec(`tmux send-keys -t ${TMUX_SESSION} Enter`);
}

function sendCtrlC() {
  tmuxExec(`tmux send-keys -t ${TMUX_SESSION} C-c`);
}

/** Poll until ❯ prompt appears or timeout */
async function waitForPrompt(timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (hasPrompt(capturePane())) return true;
    await sleep(3000);
  }
  return false;
}

// --- Respawn rate limiting ---

function canRespawn() {
  const cutoff = Date.now() - 3600000;
  respawnTimestamps = respawnTimestamps.filter(ts => ts > cutoff);
  return respawnTimestamps.length < MAX_RESPAWNS_PER_HOUR;
}

// --- Brain build command ---

function buildClaudeCmd() {
  const port = config.ENGINE === 'qwen' ? config.QWEN_PROXY_PORT : config.PROXY_PORT;
  const model = config.ENGINE === 'qwen' ? config.QWEN_MODEL_NAME : config.MODEL_NAME;
  return `ANTHROPIC_BASE_URL=http://127.0.0.1:${port} claude --model ${model} --dangerously-skip-permissions`;
}

// --- Brain lifecycle ---

function spawnBrain() {
  if (isSessionAlive()) {
    log('BRAIN: tmux session already exists — reusing');
    return;
  }
  log('BRAIN: Creating tmux session with CC CLI interactive...');
  tmuxExec(`tmux new-session -d -s ${TMUX_SESSION} -x 200 -y 50`);
  tmuxExec(`tmux send-keys -t ${TMUX_SESSION} '${buildClaudeCmd()}' Enter`);
  log(`BRAIN: Spawned [session=${TMUX_SESSION}] — waiting for prompt...`);
}

function killBrain() {
  if (isSessionAlive()) {
    tmuxExec(`tmux kill-session -t ${TMUX_SESSION}`);
    log('BRAIN: tmux session killed');
  }
}

function isBrainAlive() {
  if (!isSessionAlive()) return false;
  try {
    execSync('pgrep -f "claude"', { timeout: 3000 });
    return true;
  } catch (e) { return false; }
}

// --- Context management ---

function parseContextUsage(output) {
  const match = output.match(/🔋\s*(\d+)%/);
  return match ? parseInt(match[1]) : -1;
}

async function manageContext() {
  const usage = parseContextUsage(capturePane());
  if (usage >= CONTEXT_WARN_PCT) {
    log(`CONTEXT: ${usage}% — sending /clear`);
    pasteText('/clear');
    sendEnter();
    await sleep(5000);
    await waitForPrompt(30000);
    return true;
  }
  return false;
}

async function compactIfNeeded() {
  if (missionCount > 0 && missionCount % COMPACT_EVERY_N === 0) {
    log(`CONTEXT: Periodic /compact (every ${COMPACT_EVERY_N} missions)`);
    pasteText('/compact');
    sendEnter();
    await sleep(10000);
    await waitForPrompt(60000);
  }
}

// --- Crash recovery ---

async function respawnBrain(useContinue = true) {
  if (!canRespawn()) {
    log(`RESPAWN: Rate limit (${MAX_RESPAWNS_PER_HOUR}/hr) — cooldown ${RESPAWN_COOLDOWN_MS / 1000}s`);
    await sleep(RESPAWN_COOLDOWN_MS);
    respawnTimestamps = [];
  }
  respawnTimestamps.push(Date.now());
  killBrain();
  await sleep(5000);

  const continueFlag = useContinue ? ' --continue' : '';
  tmuxExec(`tmux new-session -d -s ${TMUX_SESSION} -x 200 -y 50`);
  tmuxExec(`tmux send-keys -t ${TMUX_SESSION} '${buildClaudeCmd()}${continueFlag}' Enter`);
  log(`RESPAWN: New session [continue=${useContinue}]`);
  return waitForPrompt(120000);
}

// --- Core: run mission via tmux ---

async function runMission(prompt, projectDir, timeoutMs) {
  missionCount++;
  const num = missionCount;
  const startTime = Date.now();

  log(`MISSION #${num}: ${prompt.slice(0, 150)}...`);
  log(`PROJECT: ${projectDir} | MODE: tmux-interactive`);

  // Thermal gate
  const { waitForSafeTemperature } = require('./m1-cooling-daemon');
  await waitForSafeTemperature();

  // Ensure brain alive
  if (!isBrainAlive()) {
    log(`BRAIN DEAD — respawning before mission #${num}`);
    if (!(await respawnBrain(true))) {
      return { success: false, result: 'brain_respawn_failed', elapsed: 0 };
    }
  }

  // Context management
  await manageContext();
  await compactIfNeeded();

  // Build full prompt with project dir context
  let fullPrompt = prompt;
  if (projectDir && projectDir !== config.MEKONG_DIR) {
    fullPrompt = `First cd to ${projectDir} then: ${prompt}`;
  }

  // Send prompt via paste-buffer (reliable for long text)
  pasteText(fullPrompt);
  sendEnter();
  log(`DISPATCHED: Mission #${num} sent to tmux`);

  // Wait for CC CLI to start processing
  await sleep(15000);

  // Poll for completion
  const deadline = Date.now() + timeoutMs;
  let lastLogTime = Date.now();

  while (Date.now() < deadline) {
    if (!isSessionAlive()) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`BRAIN DIED: Mission #${num} (${elapsed}s)`);
      await respawnBrain(true);
      return { success: false, result: 'brain_died', elapsed };
    }

    const output = capturePane();
    if (hasPrompt(output)) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const usage = parseContextUsage(output);
      log(`COMPLETE: Mission #${num} (${elapsed}s)${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
      return { success: true, result: 'done', elapsed };
    }

    if (Date.now() - lastLogTime > 60000) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`Mission #${num} working — ${elapsed}s`);
      lastLogTime = Date.now();
    }

    await sleep(10000);
  }

  // Timeout — send Ctrl+C
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s — sending Ctrl+C`);
  sendCtrlC();
  return { success: false, result: 'timeout', elapsed };
}

module.exports = { spawnBrain, killBrain, isBrainAlive, runMission, log };
