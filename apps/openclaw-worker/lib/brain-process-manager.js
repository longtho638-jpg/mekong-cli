/**
 * Brain Process Manager
 *
 * Manages the CC CLI process via tmux session for robustness and interactivity.
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
const path = require('path');
const config = require('../config');
const { perceiveMissionResult, needsReverification, getPerceptionStats } = require('./perception-engine');
const { getAdaptivePollingMs } = require('./throughput-maximizer');

const TMUX_SESSION = 'tom_hum_brain';
const COMPACT_EVERY_N = 7; // Compact every 7 missions (was 10 — keep context lean for speed)
const COMPACT_TOKEN_THRESHOLD = 30000; // 30k tokens (was 50k — compact EARLIER = faster missions)
// 🧬 FIX #3: REMOVE /clear — CC CLI's /compact handles cleanup better
// CLEAR_EVERY_N removed — /clear is redundant with /compact
const MAX_RESPAWNS_PER_HOUR = 5;
const RESPAWN_COOLDOWN_MS = 5 * 60 * 1000;
const PROMPT_FILE = '/tmp/tom_hum_prompt.txt';
const MIN_MISSION_SECONDS = 10;   // Reduced 60s -> 10s (Brain Surgery 260218)
// 🌊 PARALLEL FIX: More polls needed to confirm idle (CC CLI shows ❯ briefly before processing)
const IDLE_CONFIRM_POLLS = config.MAX_CONCURRENT_MISSIONS > 1 ? 8 : 5;

// 🧬 Level 8.5: Perception Feedback Loop — auto-retry on D/F
function createRetryMission(num, prompt, perception) {
  try {
    // Rate limit: don't retry retries (prevent infinite loop)
    if (prompt.includes('PERCEPTION_RETRY')) return;
    if (perception.score >= 40) return; // Only retry D/F

    const retryPrompt = `PERCEPTION_RETRY Mission #${num}\n` +
      `⚠️ Previous attempt scored ${perception.score}/100 (Grade ${perception.grade})\n` +
      `Issues: ${perception.reasons.filter(r => r.startsWith('-')).join(', ')}\n` +
      `Files attempted: ${perception.filesChanged.join(', ') || 'none detected'}\n\n` +
      `RETRY the original task with EXTRA CARE:\n${prompt.slice(0, 500)}\n\n` +
      `CRITICAL: Ensure build passes + files actually change this time.`;

    const filename = `HIGH_perception_retry_${num}_${Date.now()}.txt`;
    fs.writeFileSync(path.join(config.WATCH_DIR, filename), retryPrompt);
    log(`🧬 PERCEPTION RETRY: Created ${filename} (Score=${perception.score} Grade=${perception.grade})`);
  } catch (e) {
    log(`PERCEPTION RETRY ERROR: ${e.message}`);
  }
}

// --- DETECTION PATTERNS ---

// CC CLI activity indicators (present continuous = actively processing)
const BUSY_PATTERNS = [
  /Photosynthesizing/i, /Crunching/i, /Saut[eé]ing/i,
  /Marinating/i, /Fermenting/i, /Braising/i,
  /Reducing/i, /Blanching/i, /Thinking/i,
  /Churning/i, /Cooking/i, /Toasting/i,
  /Simmering/i, /Steaming/i, /Grilling/i, /Roasting/i,
  /Levitating/i,                       // CC CLI status (Finalizing/Summarizing)
  /Osmosing/i,                         // CC CLI status (Context ingestion)
  /Computing/i, /Reading/i, /Executing/i, /Indexing/i, // CC CLI v2.9.1 indicators
  /✻\s+\w+ing/,                        // General: ✻ + any gerund verb
  /\d+[ms]\s+\d+[ms]\s*·\s*[↑↓]/,      // Timer + arrow: "4m 27s · ↑"
  /[↑↓]\s*[\d.]+k?\s*tokens/i,         // Counter: "↑ 0 tokens" or "↓ 4.5k tokens"
  /queued messages/i,
  /Press up to edit queued/i,
  /Cost:\s*\$[\d.]+/,                  // Cost display usually means busy calculating
];

// CC CLI completion indicators (past tense = finished cooking)
const COMPLETION_PATTERNS = [
  /(?:Cooked|Churned|Saut[eé]ed|Braised|Blanched|Reduced|Fermented|Marinated|Toasted|Simmered|Steamed|Grilled|Roasted)\s+for\s+\d+/i,
  /✻\s+\w+(?:ed|t)\s+for\s+\d+/i,     // General: ✻ + past tense + "for N"
];

// CC CLI asking for approval/confirmation
const APPROVE_PATTERNS = [
  /Do you want to run this command\?/,
  /Do you want to proceed\?/,
  /Do you want to execute this code\?/,
  /Enter your API key/,
  /Do you want to use this API key\?/,
  /\(y\/n\)/i, /\[y\/n\]/i, /\[Y\/n\]/i,
  /Approve\?/i, /Confirm\?/i,
  /Do you want to allow/i,             // Specific TUI permission prompt
  /Use arrow keys to select/i,
  /Select an option/i,
  /2\.\s+No\s+\(recommended\)/i,
  /1\.\s+Yes,\s+I accept/i,
  /By proceeding, you accept all responsibility/i,
  // 🧬 FIX Bug #2/#7: Decision-request patterns + comprehensive coverage
  /muốn.*làm gì/i,                     // "Bạn muốn tôi làm gì tiếp theo?"
  /USER DECISION/i,                    // "USER DECISION REQUIRED"
  /Khuyến nghị.*chọn/i,                // "Khuyến nghị: Chọn Option A"
  /Options?:/i,                        // "Options: A) ... B) ..."
  /What would you like/i,              // "What would you like me to do?"
  /Which option/i,                     // "Which option do you prefer?"
  /tiếp theo/i,                        // "làm gì tiếp theo?"
  /Continue with/i,                    // "Continue with this?"
  /Proceed with/i,                     // "Proceed with implementation?"
];

// CC CLI context exhaustion
const CONTEXT_LIMIT_PATTERNS = [
  /Context limit reached/i,
  /\/compact or \/clear/i,
  /context is full/i,
  /out of context/i,
];

let missionCount = 0;
let tokensSinceCompact = 0; // Track accumulated context usage
let respawnTimestamps = [];
// 🧬 FIX Bug #1: DUPLICATE DISPATCH PREVENTION
// Track recent mission hashes (prompt content) to prevent duplicate dispatch
const recentMissionHashes = new Set();
const DEDUP_WINDOW_SIZE = 20; // Track last 20 missions
const recentAntiStackHits = new Map(); // Track consecutive anti-stack hits per worker

// --- Logging ---

function log(msg) {
  const timestamp = new Date().toISOString().slice(11, 19);
  const formatted = `[${timestamp}] [tom-hum] ${msg}\n`;
  try { process.stderr.write(formatted); } catch (e) { /* EPIPE safe */ }
  try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) { }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// 🧬 FIX Bug #1: Simple hash function for mission deduplication
function hashPrompt(prompt) {
  // Use first 100 chars + length as fingerprint (fast, good enough)
  const sample = prompt.slice(0, 100).toLowerCase().replace(/\s+/g, '');
  return `${sample}_${prompt.length}`;
}

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

function capturePane(workerIdx) {
  const idx = workerIdx !== undefined ? workerIdx : currentWorkerIdx;
  const target = `${TMUX_SESSION}:0.${idx}`;
  return tmuxExec(`tmux capture-pane -t ${target} -p -S -30`); // 🔥 Speed: 50→30 lines = less tmux I/O
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
  // 🧬 FIX Bug #6: EXTEND to 15 lines — questions can appear mid-scrollback
  const tail = getCleanTail(output, 15).join('\n');
  return APPROVE_PATTERNS.some(p => p.test(tail));
}

function hasContextLimit(output) {
  const tail = getCleanTail(output, 15).join('\n');
  return CONTEXT_LIMIT_PATTERNS.some(p => p.test(tail));
}

/** Check if the pane is sitting at a raw shell prompt (zsh/bash) instead of Claude */
function isShellPrompt(output) {
  const tail = getCleanTail(output, 5).join('\n');
  // Matches typical shell prompts: "user@host dir %", "bash-3.2$", etc.
  // CRITICAL: Claude's prompt is "❯" or ">". Shell is "%" or "$".
  if (tail.includes('❯')) return false; // Claude is active
  if (tail.includes('Choose a capability:')) return false; // Claude menu
  if (/^>\s*$/.test(tail.trim())) return false; // Simple interactive prompt

  if (/%[\s]*$/.test(tail)) return true; // zsh
  if (/\$ \s*$/.test(tail)) return true; // bash
  if (/# \s*$/.test(tail)) return true; // root
  return false;
}

/** 🔥 SPEED: Single-pass state detection — parse output ONCE, check all patterns.
 *  Before: 6 separate getCleanTail() calls per poll = 6× string parsing
 *  After: 1 parse, reuse for all checks
 *  Returns: 'busy' | 'complete' | 'context_limit' | 'question' | 'idle' | 'unknown' */
function detectState(output) {
  // Parse ONCE — reuse for all pattern checks
  const tail15 = getCleanTail(output, 15).join('\n');
  const tail25 = getCleanTail(output, 25).join('\n');
  const tail10lines = getCleanTail(output, 10);

  // Context limit (highest priority)
  if (CONTEXT_LIMIT_PATTERNS.some(p => p.test(tail15))) return 'context_limit';
  // Questions (must handle before busy — unblock!)
  if (APPROVE_PATTERNS.some(p => p.test(tail15))) return 'question';
  // Busy (active processing)
  if (BUSY_PATTERNS.some(p => p.test(tail25))) return 'busy';
  // Completion pattern
  if (COMPLETION_PATTERNS.some(p => p.test(tail25))) return 'complete';
  // Idle (prompt visible, not busy)
  for (const line of tail10lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.includes('❯') || /^>\s*$/.test(t)) return 'idle';
  }
  return 'unknown';
}

// --- Text dispatch ---

function pasteText(text, workerIdx) {
  const idx = workerIdx !== undefined ? workerIdx : currentWorkerIdx;
  // Per-worker prompt file to prevent race condition
  const promptFile = `/tmp/tom_hum_prompt_P${idx}.txt`;
  fs.writeFileSync(promptFile, text);
  tmuxExec(`tmux load-buffer ${promptFile}`);
  const target = `${TMUX_SESSION}:0.${idx}`;
  tmuxExec(`tmux paste-buffer -t ${target}`);
  try { fs.unlinkSync(promptFile); } catch (e) { }
}

function sendEnter(workerIdx) {
  const idx = workerIdx !== undefined ? workerIdx : currentWorkerIdx;
  const target = `${TMUX_SESSION}:0.${idx}`;
  tmuxExec(`tmux send-keys -t ${target} Enter`);
}

function sendCtrlC(workerIdx) {
  const idx = workerIdx !== undefined ? workerIdx : currentWorkerIdx;
  const target = `${TMUX_SESSION}:0.${idx}`;
  tmuxExec(`tmux send-keys -t ${target} C-c`);
}

/** Poll until prompt appears (used by spawnBrain/respawn/context management) */
async function waitForPrompt(timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (hasPrompt(capturePane())) return true;
    await sleep(500); // 🔥 Speed: 1000→500ms — check 2× faster
  }
  return false;
}

// --- Respawn rate limiting ---

function canRespawn() {
  // USER DEMAND: "vòng lặp vô tận cấm off" (Infinite Loop, Never Off)
  // We disable the rate limiter entirely.
  // const cutoff = Date.now() - 3600000;
  // respawnTimestamps = respawnTimestamps.filter(ts => ts > cutoff);
  // return respawnTimestamps.length < MAX_RESPAWNS_PER_HOUR;
  return true;
}

function buildClaudeCmd() {
  const port = config.ENGINE === 'qwen' ? config.QWEN_PROXY_PORT : config.PROXY_PORT;
  const model = config.ENGINE === 'qwen' ? config.QWEN_MODEL_NAME : config.MODEL_NAME;
  const claudeConfigDir = `/Users/macbookprom1/.claude_antigravity_${config.PROXY_PORT}`;
  // FORCE correct proxy port — ignore shell env (might be stale 8045)
  const baseUrl = `http://127.0.0.1:${port}`;
  // FIX: Unset AUTH_TOKEN to prevent auth conflict, only set API_KEY
  const envVars = `unset ANTHROPIC_AUTH_TOKEN && export ANTHROPIC_API_KEY="ollama" && export ANTHROPIC_BASE_URL="${baseUrl}"`;
  return `${envVars} && claude --model ${model} --mcp-config "${claudeConfigDir}/mcp.json" --dangerously-skip-permissions`;
}

// --- Brain lifecycle ---

// Brain State
let currentWorkerIdx = 1; // Start at P1 (P0 is Monitor), unless Full CLI

function spawnBrain() {
  const teamSize = config.AGENT_TEAM_SIZE_DEFAULT || 4; // Default 4 (P0-P3)

  if (isSessionAlive()) {
    try {
      const paneCount = parseInt(execSync(`tmux list-panes -t ${TMUX_SESSION} | wc -l`, { encoding: 'utf-8' }).trim());
      if (paneCount >= teamSize) {
        log(`BRAIN: tmux session exists (Panes: ${paneCount}/${teamSize}) — reusing`);
        return;
      }
      log(`BRAIN: Session exists but has ${paneCount}/${teamSize} panes. REPAIRING...`);

      // FIXED: Use Cloud Brain URL (Serveo/Ollama)
      const proxyUrl = config.CLOUD_BRAIN_URL;

      // FIX: Standardize all env vars to 'ollama' bridge protocol
      const claudeConfigDir = `/Users/macbookprom1/.claude_antigravity_${config.PROXY_PORT}`;
      // FIX: Standardize all env vars to 'ollama' bridge protocol
      // REMOVED ANTHROPIC_AUTH_TOKEN to avoid conflict (502/Auth Warning)
      const envVars = `export ANTHROPIC_API_KEY="ollama" && export ANTHROPIC_BASE_URL="${proxyUrl}" && export CLAUDE_BASE_URL="${proxyUrl}" && export CLAUDE_CONFIG_DIR="${claudeConfigDir}"`;
      const geminiCmd = `${envVars} && claude --model ${config.MODEL_NAME} --mcp-config "${claudeConfigDir}/mcp.json" --dangerously-skip-permissions`;

      // Repair Loop: Add missing panes
      for (let i = paneCount; i < teamSize; i++) {
        log(`BRAIN: Spawning missing Worker P${i}...`);
        tmuxExec(`tmux split-window -t ${TMUX_SESSION}:0`);
        tmuxExec(`tmux select-layout -t ${TMUX_SESSION}:0 tiled`);
        execSync('sleep 1');
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${i} '${geminiCmd}' Enter`);
        // AUTO-ACCEPT Bypass Permissions for repaired panes
        execSync('sleep 5');
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${i} Down Enter`);
        execSync('sleep 2');
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${i} Down Enter`); // Double Down just in case
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${i} Enter`);
      }
      return; // Repair done
    } catch (e) {
      log(`BRAIN: Error checking/repairing session: ${e.message}`);
    }
  }

  log(`BRAIN: Creating tmux session with CC CLI interactive (Team Size: ${teamSize})...`);
  if (config.FULL_CLI_MODE) log('BRAIN: ⚡️ ANTIGRAVITY GOD MODE ACTIVE: P0 IS A WORKER ⚡️');

  // FORCE correct proxy URL — ignore shell env to prevent ECONNREFUSED
  const proxyUrl = config.CLOUD_BRAIN_URL || `http://127.0.0.1:${config.PROXY_PORT}`;
  log(`BRAIN: Connecting to Brain URL: ${proxyUrl}`);

  // Create explicit config with CLAUDEKIT INJECTION 💉
  const claudeConfigDir = `/Users/macbookprom1/.claude_antigravity_${config.PROXY_PORT}`;
  const fs = require('fs');
  if (!fs.existsSync(claudeConfigDir)) fs.mkdirSync(claudeConfigDir, { recursive: true });

  // MCP INJECTION: ClaudeKit + Filesystem
  const mcpConfig = {
    "mcpServers": {
      "claudekit": {
        "command": "/opt/homebrew/bin/ck",
        "args": ["mcp"]
      },
      "filesystem": {
        "command": "npx",
        "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/macbookprom1/mekong-cli"]
      }
    }
  };

  const configContent = {
    "completedProjectSetup": true,
    "lastUpdateCheck": Date.now(),
    "primaryColor": "#D97757", // Tôm Hùm Orange
    "theme": "dark",
    "verbose": true,
    "dangerouslySkipPermissions": true,
    "agreedToBypassPermissions": true,
    "bypassPermissions": true,
    // "mcp": mcpConfig.mcpServers // Native CLI might ignore this in main config
  };

  // Inject API Key if present to avoid prompts
  // Inject API Key to avoid prompts (Standard Ollama protocol)
  configContent.anthropicApiKey = "ollama";
  configContent.anthropicAuthToken = "ollama"; // Bypass Login via Ollama protocol
  configContent.agreedToBypassPermissions = true;
  configContent.bypassPermissions = true;

  fs.writeFileSync(`${claudeConfigDir}/config.json`, JSON.stringify(configContent, null, 2));

  // Write dedicated MCP config file for --mcp-config flag
  fs.writeFileSync(`${claudeConfigDir}/mcp.json`, JSON.stringify(mcpConfig, null, 2));

  // FORCE API URL via wrapper env function
  // We use config.MODEL_NAME to bypass CLI validation (Opus masquerade)
  const apiKeyExport = process.env.ANTHROPIC_API_KEY ? `export ANTHROPIC_API_KEY="${process.env.ANTHROPIC_API_KEY}" && ` : '';
  // FIX: Unset AUTH_TOKEN to prevent auth conflict
  const envVars = `unset ANTHROPIC_AUTH_TOKEN && export ANTHROPIC_API_KEY="ollama" && export ANTHROPIC_BASE_URL="${proxyUrl}" && export CLAUDE_BASE_URL="${proxyUrl}" && export CLAUDE_CONFIG_DIR="${claudeConfigDir}"`;

  // FIX: Run 'claude' directly to avoid wrapper logic overhead
  const geminiCmd = `${envVars} && claude --model ${config.MODEL_NAME} --mcp-config "${claudeConfigDir}/mcp.json" --dangerously-skip-permissions`;

  // Create session (Pane 0) - MONITOR (Standard) OR WORKER (God Mode)
  let p0Cmd = `tail -f ${config.LOG_FILE}`;
  let p0Title = "P0: SUPERVISOR (Auto-CTO)";

  if (config.FULL_CLI_MODE) {
    p0Cmd = geminiCmd;
    p0Title = "P0: GOD MODE WORKER (Antigravity)";
  }

  tmuxExec(`tmux new-session -d -s ${TMUX_SESSION} -n brain -x 200 -y 50`);
  tmuxExec(`tmux set-option -t ${TMUX_SESSION} remain-on-exit on`);  // 🔒 Pane stays open on crash
  tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.0 '${p0Cmd}' Enter`);
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}:0.0 -T "${p0Title}"`);

  // Create additional panes - WORKERS (Gemini 3 Pro High)
  for (let i = 1; i < teamSize; i++) {
    tmuxExec(`tmux split-window -t ${TMUX_SESSION}:0`);
    tmuxExec(`tmux select-layout -t ${TMUX_SESSION}:0 even-horizontal`);
    execSync('sleep 1'); // Stagger boot to prevent API rate spikes
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${i} '${geminiCmd}' Enter`);
  }

  // 🔒 REMOVED: Auto-accept bypass permissions — CC CLI uses --dangerously-skip-permissions
  // Sending '2' during boot was going to CC CLI as user input → "LỖI: Task bị từ chối"
  // If bypass prompt appears during missions, state machine handles it (line 675)
  log('BRAIN: Waiting for CC CLI to initialize...');
  execSync('sleep 8');

  // Set initial focus to P0 (if God Mode) or P1
  const startPane = config.FULL_CLI_MODE ? 0 : 1;
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}:0.${startPane}`);

  log(`BRAIN: Spawned [session=${TMUX_SESSION}] [panes=${teamSize}]`);
  log(`BRAIN: P0=${config.FULL_CLI_MODE ? 'WORKER' : 'MONITOR'}, P1-${teamSize - 1}=WORKERS`);
}

/**
 * 奇正相生 (Ch.5 兵勢) — CHÍNH/KỲ Worker Partitioning
 *
 * P0 = CHÍNH (正) — Manual/Antigravity core tasks. Stable, priority.
 * P1+ = KỲ (奇) — Auto-CTO project scans. Expendable, auto-generated.
 *
 * source='manual' → Prefer P0, overflow to P1 if P0 busy
 * source='auto'   → ONLY P1+ workers. NEVER interrupt P0.
 *
 * 有所不爭 (Ch.8 九變) — Auto-CTO must NOT compete for P0.
 */
function findIdleWorker(source = 'manual') {
  const teamSize = config.AGENT_TEAM_SIZE_DEFAULT || 3;
  const minIdx = config.FULL_CLI_MODE ? 0 : 1;

  // 奇正 KỲ: Auto-CTO tasks → P1+ ONLY (never touch P0)
  if (source === 'auto' && teamSize > 1) {
    const kyMin = Math.max(minIdx, 1); // Start from P1
    for (let i = kyMin; i < teamSize; i++) {
      if (!isWorkerBusy(i)) {
        log(`DISPATCH [KỲ 奇]: → Worker P${i} (idle, auto-task) — ${teamSize} total`);
        tmuxExec(`tmux select-pane -t ${TMUX_SESSION}:0.${i}`);
        return i;
      }
    }
    log(`DISPATCH [KỲ 奇]: All KỲ workers busy — 有所不爭 (refuse, don't touch P0)`);
    return -1; // Don't fall through to P0!
  }

  // 正 CHÍNH: Manual tasks → Prefer P0, overflow to P1
  for (let i = minIdx; i < teamSize; i++) {
    if (!isWorkerBusy(i)) {
      log(`DISPATCH [CHÍNH 正]: → Worker P${i} (idle, manual-task) — ${teamSize} total`);
      tmuxExec(`tmux select-pane -t ${TMUX_SESSION}:0.${i}`);
      return i;
    }
  }
  return -1; // All busy
}

// Legacy: keep rotateWorker as alias for backward compat
function rotateWorker() {
  const idx = findIdleWorker();
  if (idx >= 0) currentWorkerIdx = idx;
  return currentWorkerIdx;
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
    // 🔒 Check tmux pane content for CC CLI indicators instead of pgrep
    // pgrep -f "claude" is unreliable — sometimes misses idle CC CLI process
    const output = execSync(
      `tmux capture-pane -t ${TMUX_SESSION}:0.0 -p 2>/dev/null`,
      { encoding: 'utf-8', timeout: 3000 }
    );
    // CC CLI shows these when alive (idle or busy)
    const aliveIndicators = [/❯/, /Claude Code/i, /bypass permissions/i, /claude-/i, /✻/];
    return aliveIndicators.some(p => p.test(output));
  } catch (e) { return false; }
}

// --- Context management ---
// NOTE: 🔋 XX% via Antigravity Proxy is FAKE (tracks Anthropic limits but routes
// through Gemini). Use mission count instead.

function parseContextUsage(output) {
  const match = output.match(/🔋\s*(\d+)%/);
  return match ? parseInt(match[1]) : -1;
}

// 🧬 FIX #3: REMOVE manageContext() — /clear is redundant with /compact
// Only use /compact every 50 missions for context cleanup

async function compactIfNeeded() {
  const shouldCompact = (missionCount > 0 && missionCount % COMPACT_EVERY_N === 0) ||
    (tokensSinceCompact > COMPACT_TOKEN_THRESHOLD);

  if (shouldCompact) {
    const reason = tokensSinceCompact > COMPACT_TOKEN_THRESHOLD ?
      `Token Threshold (${Math.round(tokensSinceCompact / 1000)}k > ${Math.round(COMPACT_TOKEN_THRESHOLD / 1000)}k)` :
      `Mission Count (${missionCount})`;

    log(`CONTEXT: /compact triggered by ${reason}`);
    pasteText('/compact');
    await sleep(800); // 🔥 Speed: 1000→800ms
    sendEnter();
    await sleep(1500); // 🔥 Speed: 2000→1500ms
    await waitForPrompt(30000); // 🔥 Speed: 60s→30s max wait
    tokensSinceCompact = 0; // Reset counter
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
  await sleep(2000); // Wait for cleanup

  // REUSE spawnBrain() logic to ensure P0=Monitor, P1..=Workers layout
  spawnBrain();
  await sleep(2000); // Wait for CC CLI to fully boot before accepting missions

  log(`RESPAWN: Session rebuilt via spawnBrain()`);
  return waitForPrompt(120000);
}

// --- Per-Worker Mission Lock (enables parallel dispatch) ---
const STALE_LOCK_THRESHOLD_MS = 60 * 60 * 1000; // 60min — > MISSION_TIMEOUT (45m) (Brain Surgery 260218)

function workerLockFile(idx) {
  return require('path').join(__dirname, '..', `.mission-active-P${idx}.lock`);
}

/**
 * Level 6 Fix: Auto-clean stale locks
 * If lock file age > 30min, mission is dead — clean up
 * Prevents MISSION BLOCKED false positive
 */
function autoCleanStaleLock(idx) {
  const lockPath = workerLockFile(idx);
  try {
    if (!fs.existsSync(lockPath)) return;
    const stat = fs.statSync(lockPath);
    const ageMs = Date.now() - stat.mtimeMs;
    if (ageMs > STALE_LOCK_THRESHOLD_MS) {
      const content = fs.readFileSync(lockPath, 'utf-8').trim();
      fs.unlinkSync(lockPath);
      log(`[HEALER] 🔓 Stale lock P${idx} cleaned (age: ${Math.round(ageMs / 60000)}min, was: ${content})`);
    }
  } catch (e) {
    // Lock disappeared between checks — safe to ignore
  }
}

function isWorkerBusy(idx) {
  try {
    autoCleanStaleLock(idx); // Level 6: always clean before checking
    return fs.existsSync(workerLockFile(idx));
  } catch { return false; }
}

// Legacy single-lock check: returns true if ANY worker is busy
function isMissionActive() {
  const teamSize = config.AGENT_TEAM_SIZE_DEFAULT || 3;
  for (let i = 0; i < teamSize; i++) {
    if (isWorkerBusy(i)) return true;
  }
  return false;
}

function setWorkerLock(idx, missionNum) {
  try { fs.writeFileSync(workerLockFile(idx), `mission_${missionNum}_P${idx}_${Date.now()}`); } catch { }
}

function touchWorkerLock(idx) {
  try {
    const lockPath = workerLockFile(idx);
    if (fs.existsSync(lockPath)) {
      const now = new Date();
      fs.utimesSync(lockPath, now, now);
    }
  } catch (e) { }
}

function clearWorkerLock(idx) {
  try { fs.unlinkSync(workerLockFile(idx)); } catch { }
}

// Legacy aliases for backward compat
const MISSION_LOCK = require('path').join(__dirname, '..', '.mission-active.lock');
function setMissionLock(num) { setWorkerLock(currentWorkerIdx, num); }
function clearMissionLock() { clearWorkerLock(currentWorkerIdx); }

// --- Core: run mission via tmux (state machine) ---

async function runMission(prompt, projectDir, timeoutMs, modelOverride, source = 'manual') {
  // 🧬 FIX Bug #1: DUPLICATE DISPATCH DETECTION
  const promptHash = hashPrompt(prompt);
  if (recentMissionHashes.has(promptHash)) {
    log(`DUPLICATE MISSION REJECTED: Hash ${promptHash.slice(0, 20)}... already dispatched recently`);
    return { success: false, result: 'duplicate_rejected', elapsed: 0 };
  }

  // Track this mission hash
  recentMissionHashes.add(promptHash);
  // Maintain sliding window (keep last N)
  if (recentMissionHashes.size > DEDUP_WINDOW_SIZE) {
    const firstHash = Array.from(recentMissionHashes)[0];
    recentMissionHashes.delete(firstHash);
  }

  // 🔒 奇正相生: Find idle worker with source-aware partitioning
  const workerIdx = findIdleWorker(source);
  if (workerIdx === -1) {
    log(`MISSION BLOCKED: All ${config.AGENT_TEAM_SIZE_DEFAULT} workers busy (source=${source}) — refusing dispatch`);
    return { success: false, result: 'all_workers_busy', elapsed: 0 };
  }

  missionCount++;
  const num = missionCount;
  const startTime = Date.now();
  const missionStartDate = new Date();

  // Set PER-WORKER lock immediately
  setWorkerLock(workerIdx, num);
  currentWorkerIdx = workerIdx; // Set for backward-compat functions

  // 🔒 CRITICAL FIX: Wrap entire mission in try-finally to ensure lock cleanup
  try {
    // 作戰 Token Tracker
    const { countTokensBetween, recordMission, getDailyUsage } = require('./token-tracker');

    log(`MISSION #${num} → P${workerIdx}: ${prompt.slice(0, 150)}...`);
    log(`PROJECT: ${projectDir} | MODE: tmux-parallel | WORKER: P${workerIdx}${modelOverride ? ` | MODEL: ${modelOverride} 🔥` : ''}`);

    // Thermal gate
    const { waitForSafeTemperature } = require('./m1-cooling-daemon');
    await waitForSafeTemperature();

    // 🧬 FIX #3: Only /compact, no /clear
    await compactIfNeeded();

    // 🔒 Chairman Fix: MODEL OVERRIDE DISABLED — AG Proxy routes all models automatically
    // Bug #3: /model claude-opus → proxy returns "invalid model" → garbles dispatch
    // Proxy đã tự route: mọi model → gemini-3-pro-high
    // if (modelOverride) { ... } — REMOVED

    // Build full prompt
    let fullPrompt = prompt;
    if (projectDir && projectDir !== config.MEKONG_DIR) {
      fullPrompt = `First cd to ${projectDir} then: ${prompt}`;
    }

    // CC CLI state machine loops until DONE or error
    // (The line "let lastState = 'dispatched';" was removed as it was not used and the comment was incorrect)

    // SAFETY CHECK: Ensure Claude is actually running before dispatching
    // If we paste into a raw ZSH shell, we get "Command not found" errors.
    const checkOutput = capturePane(workerIdx);
    if (!isBrainAlive() || isShellPrompt(checkOutput)) {
      log(`CRITICAL: Brain died or dropped to shell! check=${!isBrainAlive()} shell=${isShellPrompt(checkOutput)}`);
      const respawnSuccess = await respawnBrain(true);
      if (!respawnSuccess) {
        return { success: false, result: 'brain_died_fatal', elapsed: 0 };
      }
      await sleep(2000);
    }

    // 🛡️ ANTI-STACKING GUARD v3: Smart wait + Hot State Optimization
    // 🔥 Speed: 6×500ms = 3s max. If hot/stuck, reduce to 3×500ms = 1.5s.
    const isHot = getSystemMetrics().load > 2.5;
    const maxRetries = isHot ? 3 : 6;
    let hitBusy = false;

    for (let waitAttempt = 0; waitAttempt < maxRetries; waitAttempt++) {
      const preDispatch = capturePane(workerIdx);
      const preState = detectState(preDispatch);

      if (preState === 'busy') {
        hitBusy = true;
        log(`ANTI-STACK: CC CLI busy (attempt ${waitAttempt + 1}/${maxRetries}) — waiting 500ms...`);
        await sleep(500);
        continue;
      }

      if (preState === 'idle' || preState === 'complete' || preState === 'unknown') {
        break; // Safe to dispatch
      }

      if (preState === 'question') {
        log(`ANTI-STACK: CC CLI has pending question — auto-approving first`);
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${workerIdx} y Enter`);
        await sleep(1000);
        continue;
      }
      break;
    }

    // 🧬 Bottleneck Fix: Track retry count per worker
    const prevHits = recentAntiStackHits.get(workerIdx) || 0;
    if (hitBusy) {
      recentAntiStackHits.set(workerIdx, prevHits + 1);
      if (prevHits + 1 >= 3) {
        log(`ANTI-STACK: Worker P${workerIdx} stuck BUSY 3x consecutively — forcing /compact`);
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${workerIdx} '/compact' Enter`);
        await sleep(2000);
        recentAntiStackHits.set(workerIdx, 0);
      }
    } else {
      recentAntiStackHits.set(workerIdx, 0); // Reset on clean dispatch
    }

    // Final check: if STILL busy after 120s, abort this mission
    const finalCheck = capturePane(workerIdx);
    if (isBusy(finalCheck)) {
      log(`ANTI-STACK: P${workerIdx} still busy after 3s — ABORTING mission #${num}`);
      return { success: false, result: 'busy_blocked', elapsed: 0 };
    }

    // 🔒 Chairman Fix: CLEAR INPUT LINE before dispatch
    // Bug: CC CLI may have stale text ("commit and push this") in input
    // → paste-buffer appends to it → garbled prompt → mission fails
    // 陣法 (Dàn Trận): Clear battlefield before deploying troops
    const targetPane = `${TMUX_SESSION}:0.${workerIdx}`;
    tmuxExec(`tmux send-keys -t ${targetPane} Escape`);
    await sleep(200);
    tmuxExec(`tmux send-keys -t ${targetPane} C-u`);
    await sleep(300);

    // Dispatch via paste-buffer (reliable for long text + special chars)
    pasteText(fullPrompt, workerIdx);
    await sleep(800); // 🔥 Speed: was 2000ms — 800ms is enough for tmux paste
    sendEnter(workerIdx);
    log(`DISPATCHED: Mission #${num} sent to P${workerIdx}`);

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
    let kickStartCount = 0;

    // Give CC CLI time to parse prompt and begin processing
    // 🌊 PARALLEL FIX: 2s wait for parallel mode (CC CLI needs time to parse + start)
    await sleep(config.MAX_CONCURRENT_MISSIONS > 1 ? 2000 : 500);

    while (Date.now() < deadline) {
      if (!isSessionAlive()) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        log(`BRAIN DIED: Mission #${num} (${elapsed}s)`);
        await respawnBrain(true);
        return { success: false, result: 'brain_died', elapsed };
      }

      const output = capturePane(workerIdx);
      const state = detectState(output);
      const elapsedSec = Math.round((Date.now() - startTime) / 1000);

      // KICK-START: DISABLED — was root cause of x2 dispatch bug!
      // sendEnter() re-submitted the already-pasted prompt, creating duplicate tasks.
      // If CC CLI doesn't start processing within 30s, it means the prompt wasn't
      // received — but re-sending Enter makes it WORSE (submits twice).
      if (state === 'idle' && !wasBusy && elapsedSec < 30 && kickStartCount < 1) {
        log(`WAITING: CC CLI idle (${elapsedSec}s) — waiting for processing to start...`);
        kickStartCount++;
        await sleep(2000);
        continue;
      }

      // STUCK INTERVENTION (Parallel Cooling): Kill stuck task if Hot & Long
      if (checkStuckIntervention(elapsedSec, num)) {
        return { success: false, result: 'killed_stuck', elapsed: elapsedSec };
      }

      switch (state) {
        case 'complete': {
          // Guard against stale completion from previous mission still in scrollback
          if (!wasBusy && elapsedSec < MIN_MISSION_SECONDS) {
            break; // Likely stale — wait for BUSY or more elapsed time
          }
          const usage = parseContextUsage(output);
          log(`COMPLETE: Mission #${num} (${elapsedSec}s) [cooked-pattern]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
          // 🧬 Level 8: Perception — VERIFY actual result
          const perception1 = perceiveMissionResult(num, prompt, workerIdx);
          if (needsReverification(perception1)) {
            log(`⚠️ PERCEPTION: Mission #${num} Score=${perception1.score} Grade=${perception1.grade} — NEEDS RE-VERIFICATION`);
            createRetryMission(num, prompt, perception1);
          }
          // 作戰 Token tracking
          const tk1 = countTokensBetween(missionStartDate, new Date());
          tokensSinceCompact += tk1.tokens; // Accumulate for proactive cleanup
          log(`TOKENS: Mission #${num} used ${tk1.tokens.toLocaleString()} tokens (${tk1.requests} reqs, ${tk1.model}) [Session accum: ${Math.round(tokensSinceCompact / 1000)}k]`);
          recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk1.tokens, elapsedSec, tk1.model);
          const daily1 = getDailyUsage(); if (daily1.overBudget) log(`⚠️ 作戰: DAILY BUDGET EXCEEDED — ${daily1.tokens.toLocaleString()} tokens today!`);
          return { success: true, result: 'done', elapsed: elapsedSec, perception: perception1 };
        }

        case 'busy':
          if (!wasBusy) log(`BUSY: Mission #${num} — CC CLI started processing`);
          wasBusy = true;
          idleConfirmCount = 0;
          break;

        case 'question':
          log(`QUESTION: Mission #${num} — auto-approving`);
          const targetPane = `${TMUX_SESSION}:0.${workerIdx}`;

          // SPECIAL CASE: API Key Confirmation (Needs "1" + Enter for "Yes")
          // Matches the "2. No (recommended)" text which is selected by default
          if (/2\.\s+No\s+\(recommended\)/i.test(output)) {
            log(`QUESTION: API Key detected in P${workerIdx} — selecting '1. Yes'`);
            // Spam 1 and Enter for a few seconds to ensure TUI registers it
            for (let i = 0; i < 3; i++) {
              tmuxExec(`tmux send-keys -t ${targetPane} 1`);
              await sleep(500);
              tmuxExec(`tmux send-keys -t ${targetPane} Enter`);
              await sleep(500);
            }
          }
          // SPECIAL CASE: Kick-Start waiting for Enter (bypass permissions)
          // Matches both the disclaimer text and the TUI summary line
          else if (/By proceeding, you accept all responsibility/i.test(output) ||
            /Yes, I accept/i.test(output) ||
            /⏵⏵\s+bypass\s+permissions/i.test(output)) {
            log(`QUESTION: Bypass Permissions TUI detected — selecting '2. No (recommended)' via Down+Enter`);
            // The TUI menu for bypass usually has "Yes" at 1 and "No" at 2.
            // We want "No (recommended)" to proceed with the mission.
            tmuxExec(`tmux send-keys -t ${targetPane} Down`);
            await sleep(500);
            tmuxExec(`tmux send-keys -t ${targetPane} Enter`);
          }
          // SPECIAL CASE: Legacy API Key Prompt
          else if (/Enter your API key/i.test(output)) {
            log(`QUESTION: Legacy API Key prompt detected — sending Enter`);
            tmuxExec(`tmux send-keys -t ${targetPane} Enter`);
          } else {
            // 🧬 FIX Bug #2: AUTO-SELECT RECOMMENDED instead of WAIT
            // If question contains "(Recommended)" or "Option A" → auto-select it
            // Otherwise send Enter (default choice)
            if (/\(Recommended\)/i.test(output)) {
              log(`QUESTION: Auto-selecting (Recommended) option via Enter`);
              tmuxExec(`tmux send-keys -t ${targetPane} Enter`);
            } else if (/Option A/i.test(output)) {
              log(`QUESTION: Auto-selecting Option A (recommended pattern)`);
              tmuxExec(`tmux send-keys -t ${targetPane} a Enter`);
            } else {
              // Generic decision: send Enter (usually default = recommended)
              log(`QUESTION: Unrecognized question — auto-selecting default via Enter`);
              tmuxExec(`tmux send-keys -t ${targetPane} Enter`);
            }
          }
          // 🧬 FIX Bug #7: Reduce question response delay 3000ms → 1000ms
          await sleep(1000);
          idleConfirmCount = 0;
          continue; // Re-check immediately

        case 'context_limit':
          log(`CONTEXT LIMIT: Mission #${num} — sending /clear`);
          tmuxExec(`tmux send-keys -t ${TMUX_SESSION} '/clear' Enter`);
          await sleep(2000);
          idleConfirmCount = 0;
          continue;

        case 'idle':
          if (wasBusy) {
            // Was processing, now idle — confirm over multiple polls
            idleConfirmCount++;
            if (idleConfirmCount >= IDLE_CONFIRM_POLLS) {
              const usage = parseContextUsage(output);
              log(`COMPLETE: Mission #${num} (${elapsedSec}s) [idle-after-busy x${IDLE_CONFIRM_POLLS}]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
              // 🧬 Level 8: Perception
              const perception2 = perceiveMissionResult(num, prompt, workerIdx);
              if (needsReverification(perception2)) {
                log(`⚠️ PERCEPTION: Mission #${num} Score=${perception2.score} Grade=${perception2.grade} — NEEDS RE-VERIFICATION`);
                createRetryMission(num, prompt, perception2);
              }
              const tk2 = countTokensBetween(missionStartDate, new Date());
              tokensSinceCompact += tk2.tokens;
              log(`TOKENS: Mission #${num} used ${tk2.tokens.toLocaleString()} tokens (${tk2.requests} reqs, ${tk2.model}) [Session accum: ${Math.round(tokensSinceCompact / 1000)}k]`);
              recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk2.tokens, elapsedSec, tk2.model);
              const daily2 = getDailyUsage(); if (daily2.overBudget) log(`⚠️ 作戰: DAILY BUDGET EXCEEDED — ${daily2.tokens.toLocaleString()} tokens today!`);
              return { success: true, result: 'done', elapsed: elapsedSec, perception: perception2 };
            }
          } else if (elapsedSec > MIN_MISSION_SECONDS) {
            // Never saw BUSY — might be very fast or isBusy missed it
            idleConfirmCount++;
            if (idleConfirmCount >= IDLE_CONFIRM_POLLS) {
              log(`COMPLETE: Mission #${num} (${elapsedSec}s) [idle-no-busy x${IDLE_CONFIRM_POLLS}]`);
              // 🧬 Level 8: Perception
              const perception3 = perceiveMissionResult(num, prompt, workerIdx);
              if (needsReverification(perception3)) {
                log(`⚠️ PERCEPTION: Mission #${num} Score=${perception3.score} Grade=${perception3.grade} — NEEDS RE-VERIFICATION`);
                createRetryMission(num, prompt, perception3);
              }
              const tk3 = countTokensBetween(missionStartDate, new Date());
              tokensSinceCompact += tk3.tokens;
              log(`TOKENS: Mission #${num} used ${tk3.tokens.toLocaleString()} tokens (${tk3.requests} reqs, ${tk3.model}) [Session accum: ${Math.round(tokensSinceCompact / 1000)}k]`);
              recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk3.tokens, elapsedSec, tk3.model);
              const daily3 = getDailyUsage(); if (daily3.overBudget) log(`⚠️ 作戰: DAILY BUDGET EXCEEDED — ${daily3.tokens.toLocaleString()} tokens today!`);
              return { success: true, result: 'done', elapsed: elapsedSec, perception: perception3 };
            }
          }
          break;

        default: // 'unknown' — can't classify, reset idle counter
          idleConfirmCount = 0;
          break;
      }

      // Progress logging every 30s (was 60s — faster feedback)
      if (Date.now() - lastLogTime > 30000) {
        log(`Mission #${num} [${state}] — ${elapsedSec}s${wasBusy ? ' (was-busy)' : ''}`);
        lastLogTime = Date.now();
      }

      // 🌊 THROUGHPUT: Adaptive polling — fast when busy, slow when idle
      await sleep(getAdaptivePollingMs(state, wasBusy));
    }

    // Timeout — send Ctrl+C and report
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log(`TIMEOUT: Mission #${num} on P${workerIdx} exceeded ${Math.round(timeoutMs / 1000)}s — sending Ctrl+C`);
    sendCtrlC(workerIdx);
    return { success: false, result: 'timeout', elapsed };
  } finally {
    // 🌊 PARALLEL FIX: Post-mission cooldown before releasing lock
    // Without this, next task dispatches before CC CLI fully settles
    if (config.MAX_CONCURRENT_MISSIONS > 1) {
      await sleep(2000); // 2s cooldown between missions on same worker
    }
    // 🔒 GUARANTEED CLEANUP: Always clear per-worker lock on exit
    clearWorkerLock(workerIdx);
  }
}

// --- SYSTEM MONITORING (User Request: "Giám sát nhiệt độ & API") ---

function getSystemMetrics() {
  try {
    // macOS Load Average
    const loadString = execSync('sysctl -n vm.loadavg').toString().trim();
    // Format: "{ 2.15 2.05 1.98 }" -> remove braces -> split
    const parts = loadString.replace(/[{}]/g, '').trim().split(/\s+/);
    const load1min = parseFloat(parts[0]);

    // Memory Usage (Approximate RSS)
    const mem = process.memoryUsage().rss / 1024 / 1024;

    return { load: load1min, mem: Math.round(mem) };
  } catch (e) {
    return { load: 0, mem: 0 };
  }
}

function isOverheating() {
  const metrics = getSystemMetrics();
  // THRESHOLD: Load > 4.0 is "Overheating" (Intervention Zone)
  if (metrics.load > 4.0) {
    // ACTIVE INTERVENTION: Monitor & Support
    const coolingTime = 10000; // 10s Cooling Nap
    try { fs.appendFileSync(config.THERMAL_LOG, `[${new Date().toISOString()}] 🔥 HIGH LOAD (${metrics.load}). Intervening... Sleeping ${coolingTime / 1000}s\n`); } catch (e) { }

    // We intentionally block here to force the system to slow down.
    // This supports the machine as requested ("can thiệp hỗ trợ").
    execSync(`sleep ${coolingTime / 1000}`);

    return true;
  }
  return false;
}

// STUCK INTERVENTION: If task > 5min AND Load > 4.0, assume stuck model -> Ctrl+C
function checkStuckIntervention(elapsedSec, num) {
  const metrics = getSystemMetrics();
  // 300s = 5 minutes
  if (elapsedSec > 300 && metrics.load > 4.0) {
    log(`INTERVENTION: Mission #${num} stuck (${elapsedSec}s) & Hot (${metrics.load}) — Sending Ctrl+C to unblock.`);
    sendCtrlC();
    return true;
  }
  return false;
}

module.exports = { spawnBrain, killBrain, isBrainAlive, runMission, log, isOverheating, getSystemMetrics, checkStuckIntervention };
