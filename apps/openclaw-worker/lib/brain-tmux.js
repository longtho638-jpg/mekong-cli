/**
 * Brain Tmux — CC CLI interactive mode via tmux session
 *
 * Architecture:
 *   spawnBrain()  → tmux new-session + launch CC CLI interactive
 *   runMission()  → paste prompt + state-machine polling (DISPATCHED→BUSY→DONE)
 *   killBrain()   → tmux kill-session
 *
 * CRITICAL FIX (v29): CC CLI TUI always renders ❯ even when busy.
 * hasPrompt() alone is UNRELIABLE for completion detection.
 * runMission() uses state machine: require BUSY→IDLE transition or completion pattern.
 *
 * State machine for mission completion:
 *   DISPATCHED → BUSY → DONE
 *   Completion requires:
 *     (a) Completion pattern (Cooked/Sautéed/Churned for Xm Ys), OR
 *     (b) Was BUSY then became IDLE for 3 consecutive polls, OR
 *     (c) Never detected BUSY but elapsed > 45s and IDLE for 3 consecutive polls
 *
 * Context management: /clear every 3 missions, /compact every 5 missions
 * Crash recovery: auto-respawn with --continue, rate-limited 5/hr
 *
 * Exports: spawnBrain, killBrain, isBrainAlive, runMission, log
 */

const { execSync } = require('child_process');
const fs = require('fs');
const config = require('../config');

const TMUX_SESSION = 'tom_hum_brain';
const COMPACT_EVERY_N = 5;
const CLEAR_EVERY_N = 3;
const MAX_RESPAWNS_PER_HOUR = 5;
const RESPAWN_COOLDOWN_MS = 5 * 60 * 1000;
const PROMPT_FILE = '/tmp/tom_hum_prompt.txt';
const MIN_MISSION_SECONDS = 45;   // Don't accept idle-without-busy before this
const IDLE_CONFIRM_POLLS = 3;     // Consecutive idle polls required for completion

// --- DETECTION PATTERNS ---

// CC CLI activity indicators (present continuous = actively processing)
const BUSY_PATTERNS = [
  /Photosynthesizing/i, /Crunching/i, /Saut[eé]ing/i,
  /Marinating/i, /Fermenting/i, /Braising/i,
  /Reducing/i, /Blanching/i, /Thinking/i,
  /Churning/i, /Cooking/i, /Toasting/i,
  /Simmering/i, /Steaming/i, /Grilling/i, /Roasting/i,
  /✻\s+\w+ing/,                        // General: ✻ + any gerund verb
  /\d+[ms]\s+\d+[ms]\s*·\s*↓/,         // Timer + download: "4m 27s · ↓"
  /↓\s*[\d.]+k?\s*tokens/i,            // Download counter: "↓ 4.5k tokens"
  /queued messages/i,
  /Press up to edit queued/i,
];

// CC CLI completion indicators (past tense = finished cooking)
const COMPLETION_PATTERNS = [
  /(?:Cooked|Churned|Saut[eé]ed|Braised|Blanched|Reduced|Fermented|Marinated|Toasted|Simmered|Steamed|Grilled|Roasted)\s+for\s+\d+/i,
  /✻\s+\w+(?:ed|t)\s+for\s+\d+/i,     // General: ✻ + past tense + "for N"
];

// CC CLI asking for approval/confirmation
const APPROVE_PATTERNS = [
  /\(y\/n\)/i, /\[y\/n\]/i, /\[Y\/n\]/i,
  /Do you want to proceed/i, /Do you want to continue/i,
  /Allow .+? to /i, /Approve\?/i, /Confirm\?/i,
  /Press Enter/i, /waiting for input/i,
  /Would you like to/i, /Should I /i,
  /\? \(Use arrow/i,
];

// CC CLI context exhaustion
const CONTEXT_LIMIT_PATTERNS = [
  /Context limit reached/i,
  /\/compact or \/clear/i,
  /context is full/i,
  /out of context/i,
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

/** Strip ANSI escape codes + control characters from captured tmux text */
function stripAnsi(text) {
  return text
    .replace(/\x1B\[[0-9;?]*[A-Za-z]/g, '')         // CSI sequences (colors, cursor)
    .replace(/\x1B\][^\x07\x1B]*(?:\x07|\x1B\\)/g, '') // OSC sequences (BEL or ST)
    .replace(/\x1B[()][A-Za-z0-9]/g, '')              // Character set selection
    .replace(/\x1B[A-Za-z]/g, '')                      // Simple ESC sequences
    .replace(/[\x00-\x08\x0E-\x1F\x7F]/g, '');        // Control chars (keep \t \n \r)
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

/** Get clean last N lines from captured tmux output */
function getCleanTail(output, n) {
  return stripAnsi(output).split('\n').slice(-n);
}

// --- State detection functions ---

/** CC CLI is ACTIVELY PROCESSING (Photosynthesizing, Crunching, etc.) */
function isBusy(output) {
  const tail = getCleanTail(output, 25).join('\n');
  return BUSY_PATTERNS.some(p => p.test(tail));
}

/** Mission completion pattern found (Cooked for Xm Ys, Sautéed for Xm Ys) */
function hasCompletionPattern(output) {
  const tail = getCleanTail(output, 25).join('\n');
  return COMPLETION_PATTERNS.some(p => p.test(tail));
}

/** CC CLI prompt visible — ONLY meaningful when NOT busy.
 *  WARNING: CC CLI TUI always renders ❯ even when processing.
 *  This function gates on !isBusy() but callers should still treat
 *  this as a weak signal and require additional confirmation. */
function hasPrompt(output) {
  if (isBusy(output)) return false;
  for (const line of getCleanTail(output, 10)) {
    const t = line.trim();
    if (!t) continue;
    if (t.includes('❯')) return true;
    if (/^>\s*$/.test(t)) return true;
  }
  return false;
}

function hasApproveQuestion(output) {
  const tail = getCleanTail(output, 10).join('\n');
  return APPROVE_PATTERNS.some(p => p.test(tail));
}

function hasContextLimit(output) {
  const tail = getCleanTail(output, 15).join('\n');
  return CONTEXT_LIMIT_PATTERNS.some(p => p.test(tail));
}

/** Unified state detection from tmux output.
 *  Returns: 'busy' | 'complete' | 'context_limit' | 'question' | 'idle' | 'unknown'
 *  CRITICAL: BUSY checked BEFORE completion — prevents stale "Cooked for"
 *  in scrollback from overriding active processing indicators. */
function detectState(output) {
  if (hasContextLimit(output)) return 'context_limit';
  if (isBusy(output)) return 'busy';
  if (hasCompletionPattern(output)) return 'complete';
  if (hasApproveQuestion(output)) return 'question';
  if (hasPrompt(output)) return 'idle';
  return 'unknown';
}

// --- Text dispatch ---

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

/** Poll until prompt appears (used by spawnBrain/respawn/context management) */
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
// NOTE: 🔋 XX% via Antigravity Proxy is FAKE (tracks Anthropic limits but routes
// through Gemini). Use mission count instead.

function parseContextUsage(output) {
  const match = output.match(/🔋\s*(\d+)%/);
  return match ? parseInt(match[1]) : -1;
}

async function manageContext() {
  if (missionCount > 0 && missionCount % CLEAR_EVERY_N === 0) {
    log(`CONTEXT: /clear (mission #${missionCount})`);
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
    log(`CONTEXT: /compact (mission #${missionCount})`);
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

// --- Core: run mission via tmux (state machine) ---

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

  // Build full prompt
  let fullPrompt = prompt;
  if (projectDir && projectDir !== config.MEKONG_DIR) {
    fullPrompt = `First cd to ${projectDir} then: ${prompt}`;
  }

  // Dispatch via paste-buffer (reliable for long text + special chars)
  pasteText(fullPrompt);
  await sleep(1000);
  sendEnter();
  log(`DISPATCHED: Mission #${num} sent to tmux`);

  // ═══════════════════════════════════════════════════════════════
  // STATE MACHINE: DISPATCHED → BUSY → DONE
  //
  // CC CLI TUI always renders ❯ even when busy — hasPrompt() alone
  // is NOT reliable. We track wasBusy and require either:
  //   (a) Completion pattern found (Cooked/Sautéed for Xm Ys)
  //   (b) Was BUSY → 3x consecutive IDLE polls
  //   (c) Never saw BUSY but elapsed > 45s → 3x consecutive IDLE
  // ═══════════════════════════════════════════════════════════════

  let wasBusy = false;
  let idleConfirmCount = 0;
  const deadline = Date.now() + timeoutMs;
  let lastLogTime = Date.now();

  // Give CC CLI time to parse prompt and begin processing
  await sleep(15000);

  while (Date.now() < deadline) {
    if (!isSessionAlive()) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`BRAIN DIED: Mission #${num} (${elapsed}s)`);
      await respawnBrain(true);
      return { success: false, result: 'brain_died', elapsed };
    }

    const output = capturePane();
    const state = detectState(output);
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);

    switch (state) {
      case 'complete': {
        // Guard against stale completion from previous mission still in scrollback
        if (!wasBusy && elapsedSec < MIN_MISSION_SECONDS) {
          break; // Likely stale — wait for BUSY or more elapsed time
        }
        const usage = parseContextUsage(output);
        log(`COMPLETE: Mission #${num} (${elapsedSec}s) [cooked-pattern]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
        return { success: true, result: 'done', elapsed: elapsedSec };
      }

      case 'busy':
        if (!wasBusy) log(`BUSY: Mission #${num} — CC CLI started processing`);
        wasBusy = true;
        idleConfirmCount = 0;
        break;

      case 'question':
        log(`QUESTION: Mission #${num} — auto-approving`);
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION} y Enter`);
        await sleep(3000);
        idleConfirmCount = 0;
        continue; // Re-check immediately

      case 'context_limit':
        log(`CONTEXT LIMIT: Mission #${num} — sending /clear`);
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION} '/clear' Enter`);
        await sleep(5000);
        idleConfirmCount = 0;
        continue;

      case 'idle':
        if (wasBusy) {
          // Was processing, now idle — confirm over multiple polls
          idleConfirmCount++;
          if (idleConfirmCount >= IDLE_CONFIRM_POLLS) {
            const usage = parseContextUsage(output);
            log(`COMPLETE: Mission #${num} (${elapsedSec}s) [idle-after-busy x${IDLE_CONFIRM_POLLS}]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
            return { success: true, result: 'done', elapsed: elapsedSec };
          }
        } else if (elapsedSec > MIN_MISSION_SECONDS) {
          // Never saw BUSY — might be very fast or isBusy missed it
          idleConfirmCount++;
          if (idleConfirmCount >= IDLE_CONFIRM_POLLS) {
            log(`COMPLETE: Mission #${num} (${elapsedSec}s) [idle-no-busy x${IDLE_CONFIRM_POLLS}]`);
            return { success: true, result: 'done', elapsed: elapsedSec };
          }
        }
        break;

      default: // 'unknown' — can't classify, reset idle counter
        idleConfirmCount = 0;
        break;
    }

    // Progress logging every 60s
    if (Date.now() - lastLogTime > 60000) {
      log(`Mission #${num} [${state}] — ${elapsedSec}s${wasBusy ? ' (was-busy)' : ''}`);
      lastLogTime = Date.now();
    }

    await sleep(10000);
  }

  // Timeout — send Ctrl+C and report
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s — sending Ctrl+C`);
  sendCtrlC();
  return { success: false, result: 'timeout', elapsed };
}

module.exports = { spawnBrain, killBrain, isBrainAlive, runMission, log };
