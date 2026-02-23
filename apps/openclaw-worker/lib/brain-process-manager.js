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

const TMUX_SESSION = 'tom_hum_brain';
const COMPACT_EVERY_N = Infinity; // 🦞 DISABLED — AG Proxy manages context
const COMPACT_TOKEN_THRESHOLD = Infinity; // 🦞 DISABLED — AG Proxy manages context
// 🧬 FIX #3: REMOVE /clear — CC CLI's /compact handles cleanup better
// CLEAR_EVERY_N removed — /clear is redundant with /compact
const MAX_RESPAWNS_PER_HOUR = 5;
const RESPAWN_COOLDOWN_MS = 5 * 60 * 1000;
const PROMPT_FILE = '/tmp/tom_hum_prompt.txt';
// 🦞 FIX 2026-02-23: 10s too fast → false positives (5 CRITICAL tasks lost in 1 min)
const MIN_MISSION_SECONDS = 30;   // 30s minimum before considering mission done
const IDLE_CONFIRM_POLLS = 8;     // 8 consecutive idle polls required (was 5)

// --- DETECTION PATTERNS ---

// CC CLI activity indicators (present continuous = actively processing)
const BUSY_PATTERNS = [
  /Photosynthesizing/i, /Crunching/i, /Saut[eé]ing/i,
  /Marinating/i, /Fermenting/i, /Braising/i,
  /Reducing/i, /Blanching/i,
  /[·✢✻]\s*(?:Thinking|Compacting)/i,  // 🦞 FIX: Match '✢ Thinking' or '✢ Compacting' or '·'
  /Churning/i, /Cooking/i, /Toasting/i,
  /Simmering/i, /Steaming/i, /Grilling/i, /Roasting/i,
  /Levitating/i,                       // CC CLI status (Finalizing/Summarizing)
  /Osmosing/i,                         // CC CLI status (Context ingestion)
  /Computing/i, /^\s*⏺\s*Read/m, /^\s*⏺\s*Execut/m, /Indexing/i, // 🦞 FIX: Reading/Executing need ⏺ prefix
  /[·✻✢]\s+\w+ing/,                     // General: ✻ or ✢ or · + any gerund verb
  /\d+[ms]\s+\d+[ms]\s*·\s*[↑↓]/,      // Timer + arrow: "4m 27s · ↑"
  /[↑↓]\s*[\d.]+k?\s*tokens/i,         // Counter: "↑ 0 tokens" or "↓ 4.5k tokens"
  /\d+\s+local\s+agents?/i,             // 🦞 FIX 2026-02-23: CC CLI subagents running ("3 local agents")
  // REMOVED: /queued messages/i — false-positive matches CC CLI UI text "Press up to edit queued messages" (idle, not busy)
  /Cost:\s*\$[\d.]+/,                  // Cost display usually means busy calculating
  /Calling tool/i, /Running command/i, /Searching/i, /Reading/i, /Writing/i, // Explicit explicit status
  /Running tests/i, /Running/i, /thinking/i, // CC CLI generic status messages
  /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,          // Braille spinners
  /Nesting/i,                          // 🦞 FIX 2026-02-23: CC CLI nested operations (✽ Nesting…)
  /Puttering/i,                        // 🦞 FIX 2026-02-23: CC CLI processing state
  /Pasted text/i,                      // 🦞 FIX 2026-02-23: CC CLI received pasted command, processing it
  /filesystem\s*[-–—]\s*/i,            // 🦞 FIX 2026-02-23: MCP tool calls (filesystem - list_directory)
  /\+\d+\s+lines\s*\(ctrl/i,           // 🦞 FIX 2026-02-23: CC CLI collapsible output (+477 lines (ctrl+o to expand))
];

// CC CLI completion indicators (past tense = finished cooking)
const COMPLETION_PATTERNS = [
  /(?:Cooked|Churned|Saut[eé]ed|Braised|Blanched|Reduced|Fermented|Marinated|Toasted|Simmered|Steamed|Grilled|Roasted)\s+for\s+\d+/i,
  /✻\s+\w+(?:ed|t)\s+for\s+\d+/i,     // General: ✻ + past tense + "for N"
  /Task completed in/i, /Finished in \d+/i, /Completed\s+\d+\s+steps/i, /Subagent finished/i, // Explicit explicit status
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
  /Glob patterns are not allowed/i,    // Prompt: "Glob patterns are not allowed in write operations"
  // 🧬 FIX: Treat proxy compacting as an approval point to unblock CC CLI
  // /Compacting conversation/i, // 🦞 DISABLED
  // /Context left until auto-compact/ // 🦞 DISABLED
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
// Track recent mission hashes with TTL — Map<hash, timestamp>
// 🧬 BRAIN SURGERY v30: Changed Set → Map with TTL to prevent false duplicate rejection
// across session restarts. Hashes expire after 10 minutes (not 20-mission window).
const recentMissionHashes = new Map(); // hash → dispatched_timestamp
const DEDUP_WINDOW_SIZE = 20; // Max entries
const DEDUP_TTL_MS = 10 * 60 * 1000; // 10 minutes — same task OK to retry after 10min

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

// 🧬 BRAIN SURGERY v30: TTL-based dedup check
function isDuplicateMission(promptHash) {
  const now = Date.now();
  // Purge expired entries
  for (const [hash, ts] of recentMissionHashes.entries()) {
    if (now - ts > DEDUP_TTL_MS) recentMissionHashes.delete(hash);
  }
  return recentMissionHashes.has(promptHash);
}

function trackMissionHash(promptHash) {
  recentMissionHashes.set(promptHash, Date.now());
  // Maintain max size (evict oldest)
  if (recentMissionHashes.size > DEDUP_WINDOW_SIZE) {
    const firstKey = recentMissionHashes.keys().next().value;
    recentMissionHashes.delete(firstKey);
  }
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

// 🦞 FIX 2026-02-23: Centralized tmux throttle guard
// ALL modules go through capturePane() → tmuxExec() → this guard
// Prevents tmux socket contention that causes freezing
let _lastTmuxCallTime = 0;
let _lastTmuxResult = '';
const TMUX_MIN_GAP_MS = 5000; // 5s minimum between tmux calls

function capturePane(workerIdx) {
  const now = Date.now();
  const elapsed = now - _lastTmuxCallTime;

  // Throttle: return cached result if called too soon
  if (elapsed < TMUX_MIN_GAP_MS && _lastTmuxResult) {
    return _lastTmuxResult;
  }

  const idx = workerIdx !== undefined ? workerIdx : currentWorkerIdx;
  _lastTmuxCallTime = now;

  try {
    // Rely exclusively on tmux capture-pane. 
    // The previous attempt to read pipe-pane logs failed because raw TTY streams 
    // rely on cursor movement sequences (CSI) rather than spaces, breaking regexes. 
    // The TMUX_MIN_GAP_MS throttle above safely prevents CPU contention.
    const rawTmux = tmuxExec(`tmux capture-pane -t ${TMUX_SESSION}:0.${idx} -p -S -50`);
    _lastTmuxResult = stripAnsi(rawTmux);
  } catch (e) {
    _lastTmuxResult = '';
  }
  return _lastTmuxResult;
}

/** Get clean last N lines from captured tmux output */
function getCleanTail(output, n) {
  return stripAnsi(output).split('\n').slice(-n);
}

// --- State detection functions ---

/** CC CLI is ACTIVELY PROCESSING (Photosynthesizing, Crunching, etc.) */
function isBusy(output) {
  // 🦞 FIX 2026-02-23: Two-pass detection:
  // Pass 1: Check FULL tail for subagent indicators ("N local agents" appears BELOW ❯)
  // Pass 2: Check only lines AFTER ❯ for stale status text (ignore completed activity above prompt)
  const lines = getCleanTail(output, 8);
  const fullTail = lines.join('\n');

  // 🚨 CRITICAL FIX: If CC CLI is interrupted (Ctrl+C), it is IDLE, not busy!
  // It prints "L Interrupted... What should Claude do instead?" below the prompt.
  if (/Interrupted\.\s*What should Claude do instead\?/i.test(fullTail) || /Interrupted/i.test(fullTail)) {
    return false;
  }

  // Pass 1: Subagent detection (ALWAYS check full tail — appears on status bar below ❯)
  const subagentPattern = /\d+\s+local\s+agents?/i;
  if (subagentPattern.test(fullTail)) {
    log(`isBusy MATCH: SUBAGENTS ACTIVE → ${fullTail.match(subagentPattern)?.[0]}`);
    return true;
  }

  // Pass 2: Status text — check ❯ line AND lines after it (queued messages appears ON ❯ line)
  const promptIdx = lines.findLastIndex(l => l.includes('❯'));
  const checkLines = promptIdx >= 0 ? lines.slice(promptIdx) : lines; // 🦞 FIX: include ❯ line (was promptIdx+1)
  const tail = checkLines.join('\n');
  // Only idle if ❯ line has NOTHING else (just "❯" or "❯ Try...")
  const promptLine = promptIdx >= 0 ? lines[promptIdx] : '';
  if (promptLine.match(/^[❯>]\s*(Try\s|$)/) && checkLines.length <= 1) return false;
  const matched = BUSY_PATTERNS.find(p => p.test(tail));
  if (matched) log(`isBusy MATCH: ${matched} → ${tail.match(matched)?.[0]?.slice(0, 50)}`);
  return !!matched;
}

/** Mission completion pattern found (Cooked for Xm Ys, Sautéed for Xm Ys) */
function hasCompletionPattern(output) {
  const tail = getCleanTail(output, 10).join('\n');
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
    // CRITICAL: Handle the "Interrupted" state as an active, ready prompt
    if (t.includes('Interrupted')) return true;
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

/** Unified state detection from tmux output.
 *  Returns: 'busy' | 'complete' | 'context_limit' | 'question' | 'idle' | 'unknown'
 *  CRITICAL: BUSY checked BEFORE completion — prevents stale "Cooked for"
 *  in scrollback from overriding active processing indicators. */
function detectState(output) {
  if (hasContextLimit(output)) return 'context_limit';
  // BUG FIX: Prompts (Questions) can appear while "Busy" text is still visible (e.g. Osmosing...)
  // We must handle questions FIRST to unblock.
  if (hasApproveQuestion(output)) return 'question';

  if (isBusy(output)) return 'busy';
  if (hasCompletionPattern(output)) return 'complete';
  if (hasPrompt(output)) return 'idle';
  return 'unknown';
}

// --- Text dispatch ---

function pasteText(text, workerIdx) {
  const idx = workerIdx !== undefined ? workerIdx : currentWorkerIdx;
  const target = `${TMUX_SESSION}:0.${idx}`;

  // 🧬 FIX Bug: 'tmux send-keys -l' silently fails on macOS for long strings.
  // Original 'tmux paste-buffer' emits \e[200~ bracketed paste sequences, 
  // which CC CLI 2.1.50 captures as multi-line mode, swallows the Enter key, 
  // and sits idle waiting for Ctrl+D.
  // 
  // SOLUTION: 'tmux paste-buffer -p' DISABLES bracketed paste.
  // It feeds the buffer characters literally and instantly like a human, 
  // letting CC CLI process it and accept the trailing Enter.
  const promptFile = `/tmp/tom_hum_prompt_P${idx}.txt`;
  fs.writeFileSync(promptFile, text);
  tmuxExec(`tmux load-buffer ${promptFile}`);
  tmuxExec(`tmux paste-buffer -p -t ${target}`);
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
    await sleep(1000);
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
  const envVars = `unset ANTHROPIC_AUTH_TOKEN && export ANTHROPIC_API_KEY="ollama" && export ANTHROPIC_BASE_URL="${baseUrl}" && export ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-sonnet-4-6" && export CLAUDE_CODE_SUBAGENT_MODEL="claude-sonnet-4-6"`;
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
      const envVars = `export ANTHROPIC_API_KEY="ollama" && export ANTHROPIC_BASE_URL="${proxyUrl}" && export CLAUDE_BASE_URL="${proxyUrl}" && export CLAUDE_CONFIG_DIR="${claudeConfigDir}" && export ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-sonnet-4-6" && export CLAUDE_CODE_SUBAGENT_MODEL="claude-sonnet-4-6"`;

      // Repair Loop: Add missing panes
      for (let i = paneCount; i < teamSize; i++) {
        log(`BRAIN: Spawning missing Worker P${i}...`);

        // Reverted: Script streaming causes CSI ANSI cursor pollution that breaks detectState
        const geminiCmd = `${envVars} && claude --model ${config.MODEL_NAME} --mcp-config "${claudeConfigDir}/mcp.json" --dangerously-skip-permissions`;

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
    "customInstructions": "🔥 BẠN LÀ CC CLI (CLAUDEKIT ENGINE) — CỖ MÁY ĐẺ CODE TỰ ĐỘNG. LUẬT SẮT: LUÔN LUÔN chạy ĐA LUỒNG, CẤM đơn luồng. Khi nhận MISSION từ CTO: (1) PHẢI dùng Task tool để spawn 3-5 subagents SONG SONG, mỗi subagent xử lý 1 phần riêng biệt. (2) KHÔNG BAO GIỜ chạy từng bước tuần tự — LUÔN phân tích task rồi chia thành subtasks chạy parallel. (3) Khi CTO truyền /cook, /plan:parallel, /debug → kích hoạt ClaudeKit Agents, Skills qua MCP. Tuân thủ CLAUDE.md gốc. Ví dụ: Fix 3 lint errors → spawn 3 Task subagents, mỗi cái fix 1 error song song, KHÔNG fix tuần tự.",
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
  const envVars = `unset ANTHROPIC_AUTH_TOKEN && export ANTHROPIC_API_KEY="ollama" && export ANTHROPIC_BASE_URL="${proxyUrl}" && export CLAUDE_BASE_URL="${proxyUrl}" && export CLAUDE_CONFIG_DIR="${claudeConfigDir}" && export ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-sonnet-4-6" && export CLAUDE_CODE_SUBAGENT_MODEL="claude-sonnet-4-6" && export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`;

  // Create session (Pane 0) - MONITOR (Standard) OR WORKER (God Mode)
  let p0Cmd = `tail -f ${config.LOG_FILE}`;
  let p0Title = "P0: SUPERVISOR (Auto-CTO)";

  if (config.FULL_CLI_MODE) {
    p0Cmd = `${envVars} && claude --model ${config.MODEL_NAME} --mcp-config "${claudeConfigDir}/mcp.json" --dangerously-skip-permissions`;
    p0Title = "P0: GOD Mode WORKER (Antigravity)";
  }

  tmuxExec(`tmux new-session -d -s ${TMUX_SESSION} -n brain -x 200 -y 50`);
  tmuxExec(`tmux set-option -t ${TMUX_SESSION} remain-on-exit on`);  // 🔒 Pane stays open on crash
  tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.0 '${p0Cmd}' Enter`);
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}:0.0 -T "${p0Title}"`);

  if (config.FULL_CLI_MODE) {
    // Reverted: pipe-pane breaks detectState
  }

  // Create additional panes - WORKERS (Gemini 3 Pro High)
  for (let i = 1; i < teamSize; i++) {
    // Reverted: pipe-pane causes CSI ANSI cursor pollution
    const geminiCmd = `${envVars} && claude --model ${config.MODEL_NAME} --mcp-config "${claudeConfigDir}/mcp.json" --dangerously-skip-permissions`;

    tmuxExec(`tmux split-window -t ${TMUX_SESSION}:0`);
    tmuxExec(`tmux select-layout -t ${TMUX_SESSION}:0 tiled`);
    execSync('sleep 1'); // Stagger boot to prevent API rate spikes
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${i} '${geminiCmd}' Enter`);
  }

  // 🔒 Auto-accept bypass permissions for ALL panes
  // --dangerously-skip-permissions still shows confirmation prompt on boot
  // CRITICAL: Must send Down and Enter as SEPARATE commands with delay
  // CC CLI select prompt: Down moves cursor, Enter confirms focused item
  log('BRAIN: Waiting for CC CLI bypass prompt...');
  execSync('sleep 5');
  for (let i = 0; i < teamSize; i++) {
    // Step 1: Move cursor to "2. Yes, I accept"
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${i} Down`);
    execSync('sleep 1');
    // Step 2: Confirm selection
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${i} Enter`);
    execSync('sleep 1');
  }
  execSync('sleep 3');

  // Set initial focus to P0 (if God Mode) or P1
  const startPane = config.FULL_CLI_MODE ? 0 : 1;
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}:0.${startPane}`);

  log(`BRAIN: Spawned [session=${TMUX_SESSION}] [panes=${teamSize}]`);
  log(`BRAIN: P0=${config.FULL_CLI_MODE ? 'WORKER' : 'MONITOR'}, P1-${teamSize - 1}=WORKERS`);
}

/**
 * 虛實 (Xu Shi) — PARALLEL TEAM Strategy
 * Find first IDLE worker (not locked) instead of round-robin.
 * Each worker has its own lock file: .mission-active-P{idx}.lock
 */
function findIdleWorker() {
  const teamSize = config.AGENT_TEAM_SIZE_DEFAULT || 3;
  const minIdx = config.FULL_CLI_MODE ? 0 : 1;
  for (let i = minIdx; i < teamSize; i++) {
    if (!isWorkerBusy(i)) {
      log(`DISPATCH: → Worker P${i} (idle) — ${teamSize} total`);
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
  // 🦞 PROXY FIX 2026-02-23: DISABLED — context % is fake through AG Proxy
  // Proxy handles conversation management. CC CLI compact wastes 11+ minutes.
  // To re-enable: set COMPACT_EVERY_N and COMPACT_TOKEN_THRESHOLD to finite values.
  return;
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
const STALE_LOCK_THRESHOLD_MS = 2 * 60 * 1000; // 2min — fast cleanup for leaked locks (Chairman Fix 2026-02-23)

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

/**
 * 🦞 FIX 2026-02-23: DISABLED — Log file monitoring was reverted (pipe-pane/script removed).
 * The /tmp/cc_cli_output_P*.log files are never updated, so this always falsely detects hangs.
 * Healer was killing CC CLI mid-mission every time isWorkerBusy() was called.
 */
function checkAndRecoverHungWorker(idx) {
  // NO-OP: Disabled to prevent false hang detection
  return;
}

function isWorkerBusy(idx) {
  try {
    autoCleanStaleLock(idx); // Level 6: always clean before checking

    // Only check for hangs if the worker is actually marked as busy
    const isBusy = fs.existsSync(workerLockFile(idx));
    if (isBusy) {
      checkAndRecoverHungWorker(idx);
    }
    return isBusy;
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

function clearWorkerLock(idx) {
  try { fs.unlinkSync(workerLockFile(idx)); } catch { }
}

// Legacy aliases for backward compat
const MISSION_LOCK = require('path').join(__dirname, '..', '.mission-active.lock');
function setMissionLock(num) { setWorkerLock(currentWorkerIdx, num); }
function clearMissionLock() { clearWorkerLock(currentWorkerIdx); }

// --- Core: run mission via tmux (state machine) ---

async function runMission(prompt, projectDir, timeoutMs, modelOverride) {
  // 🧬 FIX Bug #1 + BRAIN SURGERY v30: TTL-based DUPLICATE DISPATCH DETECTION
  // Missions with same content are rejected within 10min window only (not forever)
  const promptHash = hashPrompt(prompt);
  if (isDuplicateMission(promptHash)) {
    log(`DUPLICATE MISSION REJECTED: Hash ${promptHash.slice(0, 20)}... dispatched within last ${DEDUP_TTL_MS / 60000}min`);
    return { success: false, result: 'duplicate_rejected', elapsed: 0 };
  }

  // 🔒 PARALLEL: Find idle worker instead of blocking all
  const workerIdx = findIdleWorker();
  if (workerIdx === -1) {
    log(`MISSION BLOCKED: All ${config.AGENT_TEAM_SIZE_DEFAULT} workers busy — refusing dispatch`);
    return { success: false, result: 'all_workers_busy', elapsed: 0 };
  }

  // Track this mission hash ONLY if we successfully secured an idle worker
  trackMissionHash(promptHash);

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
      // 🔒 Chairman Fix: ClaudeKit REQUIRES slash command at index 0.
      // We cannot prepend "First cd to..." before the command.
      // Inject the context constraint at the end of the prompt or inside the quotes.
      fullPrompt = prompt.replace(/"$/, `\n\n[CONTEXT STRICTLY RESTRICTED TO PROJECT DIRECTORY: ${projectDir}]"`);
      // Fallback if no quotes found
      if (fullPrompt === prompt) {
        fullPrompt = `${prompt} (IN PROJECT: ${projectDir})`;
      }
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

    // 🛡️ ANTI-STACKING GUARD: Wait for CC CLI to be TRULY idle before dispatching
    // Prevents "queued messages" bug where commands pile up
    // 🔒 Ch.2 作戰: 120s timeout (12×10s) — complex missions need time to finish
    for (let waitAttempt = 0; waitAttempt < 12; waitAttempt++) {
      const preDispatch = capturePane(workerIdx);
      // 🦞 FIX: Only check LAST 8 lines — old session stale text in top of pane causes false positives
      const recentLines = getCleanTail(preDispatch, 8).join('\n');
      const preState = detectState(recentLines);
      if (preState === 'busy') {
        const matchedPat = BUSY_PATTERNS.find(p => p.test(recentLines));
        log(`ANTI-STACK: CC CLI still busy (attempt ${waitAttempt + 1}/12) — matched: ${matchedPat || 'NONE'} — waiting 10s...`);
        log(`ANTI-STACK DEBUG tail: ${getCleanTail(preDispatch, 5).join(' | ').slice(0, 200)}`);
        await sleep(1000);
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

    // Final check: if STILL busy after 120s, abort this mission
    const finalCheck = capturePane(workerIdx);
    if (isBusy(finalCheck)) {
      log(`ANTI-STACK: P${workerIdx} still busy after 120s — ABORTING mission #${num}`);
      return { success: false, result: 'busy_blocked', elapsed: 0 };
    }

    // 🔒 Chairman Fix: CLEAR INPUT LINE before dispatch
    // Bug: CC CLI may have stale text ("commit and push this") in input
    // → paste-buffer appends to it → garbled prompt → mission fails
    // 🔒 Chairman Fix: CLEAR INPUT LINE before dispatch
    // Escape then Ctrl-C to ensure we are at a fresh prompt
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${workerIdx} Escape`);
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${workerIdx} C-c`);
    await sleep(200);

    // 🦞 FIX: To prevent CC CLI from switching to multi-line input mode (which eats Enter keys),
    // we must convert all internal newlines in the prompt to spaces before pasting.
    const safePrompt = fullPrompt.replace(/\n/g, ' ');

    // Dispatch via paste-buffer (reliable for long text + special chars)
    pasteText(safePrompt, workerIdx);
    await sleep(2000);
    sendEnter(workerIdx);

    // 🔒 VERIFIED ENTER: Check CC CLI received Enter - retry once if still idle
    // Root cause of "CTO thường xuyên thiếu Enter": single Enter races on loaded M1
    await sleep(3000);
    const postEnterOutput = capturePane(workerIdx);
    const postEnterState = detectState(postEnterOutput);
    if (postEnterState === 'idle' && !isBusy(postEnterOutput)) {
      log(`ENTER RETRY: CC CLI still idle after first Enter — sending safety Enter`);
      sendEnter(workerIdx);
      await sleep(1000);
    }
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
    await sleep(1000); // 🧬 AGI BRAIN UPGRADE: Reduced from 2000→1000 for faster response

    while (Date.now() < deadline) {
      if (!isSessionAlive()) {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        log(`BRAIN DIED: Mission #${num} (${elapsed}s)`);
        await respawnBrain(true);
        return { success: false, result: 'brain_died', elapsed };
      }

      // Layer 2 fix removed - relying on `capturePane` throttle instead

      const output = capturePane(workerIdx);
      const state = detectState(output);
      const elapsedSec = Math.round((Date.now() - startTime) / 1000);

      // SMART KICK-START: Avoid x2 dispatch bug by checking if there is unsubmitted text sitting next to the prompt
      // 🦞 FIX 2026-02-23: DISABLED — this causes Enter spam and duplicate commands.
      if (false && state === 'idle' && !wasBusy && elapsedSec >= 10 && elapsedSec < 30 && kickStartCount < 2) {
        log(`WAITING: CC CLI idle (${elapsedSec}s) — waiting for processing to start...`);

        // Parse the tail to find unsubmitted text
        const tailLines = getCleanTail(output, 10);
        let hasStuckText = false;

        for (let i = tailLines.length - 1; i >= 0; i--) {
          const line = tailLines[i];
          if (line.includes('❯')) {
            const afterPrompt = line.split('❯')[1];
            if (afterPrompt && afterPrompt.trim().length > 0) {
              hasStuckText = true;
            }
            break; // Found the last prompt line
          }
        }

        if (hasStuckText) {
          log(`KICK-START: Unsubmitted text detected after '❯'. Sending Enter...`);
          sendEnter(workerIdx);
          kickStartCount++;
        } else {
          log(`WAITING: Prompt is empty. No kick-start needed yet.`);
        }

        await sleep(2000);
        continue;
      }

      // 🦞 CC CLI PROXY RULE FIX: Context left 0% & Compacting conversation pause
      const bottomOutput = getCleanTail(output, 20).join('\n');
      if (bottomOutput.includes('Compacting conversation') || bottomOutput.includes('auto-compact: 0%')) {
        log(`PROXY PAUSE: CC CLI waiting for auto-compact Enter (${elapsedSec}s) — kicking with Enter...`);
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${workerIdx} Enter`);
        await sleep(2000);
        idleConfirmCount = 0;
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
          // 作戰 Token tracking
          const tk1 = countTokensBetween(missionStartDate, new Date());
          tokensSinceCompact += tk1.tokens; // Accumulate for proactive cleanup
          log(`TOKENS: Mission #${num} used ${tk1.tokens.toLocaleString()} tokens (${tk1.requests} reqs, ${tk1.model}) [Session accum: ${Math.round(tokensSinceCompact / 1000)}k]`);
          recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk1.tokens, elapsedSec, tk1.model);
          const daily1 = getDailyUsage(); if (daily1.overBudget) log(`⚠️ 作戰: DAILY BUDGET EXCEEDED — ${daily1.tokens.toLocaleString()} tokens today!`);
          return { success: true, result: 'done', elapsed: elapsedSec };
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
          // 🦞 FIX 2026-02-23: REMOVED /clear — freezes tmux. Let CC CLI auto-compact handle it.
          log(`CONTEXT LIMIT: Mission #${num} — letting CC CLI auto-compact handle context`);
          await sleep(5000); // Wait for auto-compact to kick in
          idleConfirmCount = 0;
          continue;

        case 'idle':
          if (wasBusy) {
            // Was processing, now idle — confirm over multiple polls
            idleConfirmCount++;
            if (idleConfirmCount >= IDLE_CONFIRM_POLLS) {
              const usage = parseContextUsage(output);
              log(`COMPLETE: Mission #${num} (${elapsedSec}s) [idle-after-busy x${IDLE_CONFIRM_POLLS}]${usage >= 0 ? ` [ctx=${usage}%]` : ''}`);
              const tk2 = countTokensBetween(missionStartDate, new Date());
              tokensSinceCompact += tk2.tokens;
              log(`TOKENS: Mission #${num} used ${tk2.tokens.toLocaleString()} tokens (${tk2.requests} reqs, ${tk2.model}) [Session accum: ${Math.round(tokensSinceCompact / 1000)}k]`);
              recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk2.tokens, elapsedSec, tk2.model);
              const daily2 = getDailyUsage(); if (daily2.overBudget) log(`⚠️ 作戰: DAILY BUDGET EXCEEDED — ${daily2.tokens.toLocaleString()} tokens today!`);
              return { success: true, result: 'done', elapsed: elapsedSec };
            }
          } else if (elapsedSec > MIN_MISSION_SECONDS) {
            // 🦞 FIX 2026-02-23: Never saw BUSY! CC CLI could have dropped the prompt or stuck on an empty line.
            // DO NOT assume success if wasBusy is false! Allow the idle counter to accumulate until 3x the limit, then FAIL!
            if (idleConfirmCount === 0) log(`WARNING: Mission #${num} idle for ${elapsedSec}s without ever becoming busy!`);
            idleConfirmCount++;
            if (idleConfirmCount >= IDLE_CONFIRM_POLLS * 3) {
              log(`ERROR: Mission #${num} failed to start after ${elapsedSec}s [wasBusy=false]. Aborting prematurely!`);
              return { success: false, result: 'failed_to_start', elapsed: elapsedSec };
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

      // PROJECT FLASH: Ultra Speed Polling (500ms for parallel mode)
      await sleep(500);
    }

    // Timeout — send Ctrl+C and report
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    log(`TIMEOUT: Mission #${num} on P${workerIdx} exceeded ${Math.round(timeoutMs / 1000)}s — sending Ctrl+C`);
    sendCtrlC(workerIdx);
    return { success: false, result: 'timeout', elapsed };
  } finally {
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

module.exports = { spawnBrain, killBrain, isBrainAlive, runMission, log, isOverheating, getSystemMetrics, checkStuckIntervention, capturePane };
