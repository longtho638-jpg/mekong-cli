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
const COMPACT_EVERY_N = 5;
const MAX_RESPAWNS_PER_HOUR = 5;
const RESPAWN_COOLDOWN_MS = 5 * 60 * 1000;
const PROMPT_FILE = '/tmp/tom_hum_prompt.txt';

// Patterns CC CLI shows when waiting for user approval/confirm
const APPROVE_PATTERNS = [
  /\(y\/n\)/i, /\[y\/n\]/i, /\[Y\/n\]/i,
  /Do you want to proceed/i, /Do you want to continue/i,
  /Allow .+? to /i, /Approve\?/i, /Confirm\?/i,
  /Press Enter/i, /waiting for input/i,
  /Would you like to/i, /Should I /i,
  /\? \(Use arrow/i,  // AskUserQuestion TUI pattern
];

// Patterns CC CLI shows when context window is exhausted
const CONTEXT_LIMIT_PATTERNS = [
  /Context limit reached/i,
  /\/compact or \/clear/i,
  /context is full/i,
  /out of context/i,
];

// Patterns CC CLI shows when ACTIVELY PROCESSING (TUI always shows ❯ even when busy)
const BUSY_PATTERNS = [
  /Photosynthesizing/i,
  /Crunching/i,
  /Saut[eé]ing/i,
  /Marinating/i,
  /Fermenting/i,
  /Braising/i,
  /Reducing/i,
  /Blanching/i,
  /Thinking/i,
  /Press up to edit queued messages/i,
  /queued messages/i,
];

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

/** Strip ANSI escape sequences from text (CSI, OSC, simple escapes) */
function stripAnsi(text) {
  return text.replace(/\x1B(?:\[[0-9;?]*[A-Za-z]|\][^\x07]*\x07|[A-Za-z])/g, '');
}

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

/** Detect if CC CLI is ACTIVELY PROCESSING — TUI shows activity indicators.
 *  CRITICAL: CC CLI TUI always renders ❯ in input area even when busy.
 *  We MUST check for busy state before checking for prompt. */
function isBusy(output) {
  const clean = stripAnsi(output);
  const lines = clean.split('\n').slice(-20);
  const tail = lines.join('\n');
  return BUSY_PATTERNS.some(p => p.test(tail));
}

/** Detect CC CLI prompt (❯ or >) in captured output.
 *  CC CLI v2.1.38+ has a status bar (2-3 lines) below the prompt,
 *  so we scan last 10 lines, not just the last one.
 *  IMPORTANT: Returns false if CC CLI is busy processing! */
function hasPrompt(output) {
  // If CC CLI is actively processing, ❯ is TUI decoration, NOT a real prompt
  if (isBusy(output)) return false;
  
  const clean = stripAnsi(output);
  const lines = clean.split('\n').slice(-10);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // ❯ prompt — unique CC CLI char, not in status bar lines
    if (trimmed.includes('❯')) return true;
    // > prompt — standalone line (after /clear or context reset)
    if (/^>\s*$/.test(trimmed)) return true;
  }
  return false;
}

/** Detect "Cooked for Xm Ys" or "Churned for Xm Ys" — mission done indicator.
 *  CC CLI prints this when /cook completes, before prompt may render. */
function hasCompletionPattern(output) {
  const clean = stripAnsi(output);
  return /(?:Cooked|Churned) for \d+m \d+s/i.test(clean);
}

/** Check if CC CLI is asking an approve/confirm/proceed question */
function hasApproveQuestion(output) {
  const clean = stripAnsi(output);
  const lines = clean.split('\n').slice(-10);
  const tail = lines.join('\n');
  return APPROVE_PATTERNS.some(pattern => pattern.test(tail));
}

/** Check if CC CLI hit context limit and needs /clear */
function hasContextLimit(output) {
  const clean = stripAnsi(output);
  const lines = clean.split('\n').slice(-15);
  const tail = lines.join('\n');
  return CONTEXT_LIMIT_PATTERNS.some(pattern => pattern.test(tail));
}

/** Auto-clear if CC CLI hit context limit — send /clear + Enter */
async function autoClearIfNeeded() {
  const output = capturePane();
  if (hasContextLimit(output)) {
    log('CONTEXT LIMIT: CC CLI hết context — tự gửi /clear');
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION} '/clear' Enter`);
    await sleep(5000); // wait for clear to process
    return true;
  }
  return false;
}

/** Auto-approve if CC CLI is asking a question — send 'y' + Enter */
async function autoApproveIfNeeded() {
  const output = capturePane();
  if (hasPrompt(output) || hasCompletionPattern(output)) return false; // already done, no need
  // Check context limit FIRST (higher priority)
  if (hasContextLimit(output)) {
    await autoClearIfNeeded();
    return true;
  }
  if (hasApproveQuestion(output)) {
    log('AUTO-APPROVE: CC CLI asking question — sending y + Enter');
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION} y Enter`);
    await sleep(3000);
    return true;
  }
  return false;
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
// NOTE: Qua Antigravity Proxy, 🔋 XX% của CC CLI là SỐ ẢO (track Anthropic limits
// nhưng route qua Gemini model khác). KHÔNG dùng % để quyết định /clear.
// Thay vào đó: /clear theo số mission cố định.

const CLEAR_EVERY_N = 3;   // /clear mỗi 3 missions

function parseContextUsage(output) {
  const match = output.match(/🔋\s*(\d+)%/);
  return match ? parseInt(match[1]) : -1;
}

async function manageContext() {
  // /clear based on mission count (not fake percentage)
  if (missionCount > 0 && missionCount % CLEAR_EVERY_N === 0) {
    log(`CONTEXT: /clear mỗi ${CLEAR_EVERY_N} missions (mission #${missionCount})`);
    pasteText('/clear');
    await sleep(1000);
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
    await sleep(1000);
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
  await sleep(1000); // Let Ink TUI render pasted text before Enter
  sendEnter();
  log(`DISPATCHED: Mission #${num} sent to tmux`);

  // Wait for CC CLI to start processing (must be long enough for TUI to show activity indicator)
  await sleep(20000);

  // Auto-approve any early questions (skill review gates, confirm prompts)
  await autoApproveIfNeeded();

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
    if (hasPrompt(output) || hasCompletionPattern(output)) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const usage = parseContextUsage(output);
      const how = hasCompletionPattern(output) ? 'cooked-pattern' : 'prompt';
      log(`COMPLETE: Mission #${num} (${elapsed}s) [${how}]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
      return { success: true, result: 'done', elapsed };
    }

    // Auto-approve if CC CLI is asking for confirmation mid-mission
    await autoApproveIfNeeded();

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
