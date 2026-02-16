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
const COMPACT_EVERY_N = 50; // Relaxed: Compact every 50 missions (was 10)
const CLEAR_EVERY_N = 25;    // Relaxed: Clear every 25 missions (was 5)
const MAX_RESPAWNS_PER_HOUR = 5;
const RESPAWN_COOLDOWN_MS = 5 * 60 * 1000;
const PROMPT_FILE = '/tmp/tom_hum_prompt.txt';
// 🔒 LOCKED — DO NOT REDUCE (2026-02-15) — prevents false mission completion
const MIN_MISSION_SECONDS = 60;   // Must wait 60s before idle-no-busy can trigger
const IDLE_CONFIRM_POLLS = 5;     // 5 consecutive idle polls required

// --- DETECTION PATTERNS ---

// CC CLI activity indicators (present continuous = actively processing)
const BUSY_PATTERNS = [
  /Photosynthesizing/i, /Crunching/i, /Saut[eé]ing/i,
  /Crunching/i, /Saut[eé]ing/i,
  /Marinating/i, /Fermenting/i, /Braising/i,
  /Reducing/i, /Blanching/i, /Thinking/i,
  /Churning/i, /Cooking/i, /Toasting/i,
  /Simmering/i, /Steaming/i, /Grilling/i, /Roasting/i,
  /Vibing/i,                           // ClaudeKit status
  /✻\s+\w+ing/,                        // General: ✻ + any gerund verb
  // FIXED: Detect BOTH Up (Upload) and Down (Download) arrows
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
  /Enter your API key/, // Legacy prompt
  /Do you want to use this API key\?/,
  /\(y\/n\)/i, /\[y\/n\]/i, /\[Y\/n\]/i,
  /Approve\?/i, /Confirm\?/i,
  /Use arrow keys to select/i,
  /Select an option/i,
  /2\.\s+No\s+\(recommended\)/i, // Bypass permissions menu
  /1\.\s+Yes,\s+I accept/i, // Bypass permissions option 1
  /By proceeding, you accept all responsibility/i, // Bypass disclaimer
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
  try { process.stderr.write(formatted); } catch (e) { /* EPIPE safe */ }
  try { fs.appendFileSync(config.LOG_FILE, formatted); } catch (e) { }
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
  const target = `${TMUX_SESSION}:0.${currentWorkerIdx}`;
  return tmuxExec(`tmux capture-pane -t ${target} -p -S -50`);
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
  // 🔒 ONLY check LAST 3 LINES to avoid matching CC CLI response text in scrollback
  const tail = getCleanTail(output, 3).join('\n');
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

function pasteText(text) {
  fs.writeFileSync(PROMPT_FILE, text);
  tmuxExec(`tmux load-buffer ${PROMPT_FILE}`);
  const target = `${TMUX_SESSION}:0.${currentWorkerIdx}`;
  tmuxExec(`tmux paste-buffer -t ${target}`);
  try { fs.unlinkSync(PROMPT_FILE); } catch (e) { }
}

function sendEnter() {
  const target = `${TMUX_SESSION}:0.${currentWorkerIdx}`;
  tmuxExec(`tmux send-keys -t ${target} Enter`);
}

function sendCtrlC() {
  const target = `${TMUX_SESSION}:0.${currentWorkerIdx}`;
  tmuxExec(`tmux send-keys -t ${target} C-c`);
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
    tmuxExec(`tmux select-layout -t ${TMUX_SESSION}:0 tiled`);
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
 * 虛實 (Xu Shi) — 1 chạy 2 nghỉ Strategy
 * Round-robin P1→P2→P3: daemon bay vào pane để chạy
 * task-queue isProcessing mutex = chỉ 1 active tại 1 thời điểm
 * Pane nghỉ = idle ở prompt, visible nhưng không tốn proxy
 */
function rotateWorker() {
  const teamSize = config.AGENT_TEAM_SIZE_DEFAULT || 4;
  currentWorkerIdx++;

  // Wrap: P1 → P2 → P3 → P1...
  const minIdx = config.FULL_CLI_MODE ? 0 : 1;
  if (currentWorkerIdx >= teamSize) currentWorkerIdx = minIdx;

  log(`DISPATCH: → Worker P${currentWorkerIdx} (${teamSize} total)`);
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}:0.${currentWorkerIdx}`);
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
  await sleep(5000); // Wait for cleanup

  // REUSE spawnBrain() logic to ensure P0=Monitor, P1..=Workers layout
  spawnBrain();
  await sleep(8000); // Wait for CC CLI to fully boot before accepting missions

  log(`RESPAWN: Session rebuilt via spawnBrain()`);
  return waitForPrompt(120000);
}

// --- Mission Lock (prevents double-dispatch) ---
const MISSION_LOCK = require('path').join(__dirname, '..', '.mission-active.lock');

function isMissionActive() {
  try { return fs.existsSync(MISSION_LOCK); } catch { return false; }
}

function setMissionLock(missionNum) {
  try { fs.writeFileSync(MISSION_LOCK, `mission_${missionNum}_${Date.now()}`); } catch { }
}

function clearMissionLock() {
  try { fs.unlinkSync(MISSION_LOCK); } catch { }
}

// --- Core: run mission via tmux (state machine) ---

async function runMission(prompt, projectDir, timeoutMs, modelOverride) {
  // 🔒 Ch.12 火攻: Check lock FIRST — refuse if another mission active
  if (isMissionActive()) {
    log(`MISSION BLOCKED: Another mission still active — refusing dispatch`);
    return { success: false, result: 'mission_locked', elapsed: 0 };
  }

  missionCount++;
  const num = missionCount;
  const startTime = Date.now();
  const missionStartDate = new Date();

  // Set lock AFTER check passes
  setMissionLock(num);

  // 作戰 Token Tracker
  const { countTokensBetween, recordMission, getDailyUsage } = require('./token-tracker');

  log(`MISSION #${num}: ${prompt.slice(0, 150)}...`);
  log(`PROJECT: ${projectDir} | MODE: tmux-interactive${modelOverride ? ` | MODEL: ${modelOverride} 🔥` : ''}`);

  // Thermal gate
  const { waitForSafeTemperature } = require('./m1-cooling-daemon');
  await waitForSafeTemperature();

  // Context management
  await manageContext();
  await compactIfNeeded();

  // Rotate to next worker pane (Round Robin P1..N)
  rotateWorker();

  // 虛實 Model Switch: Opus for complex
  if (modelOverride) {
    log(`🔥 SWITCHING MODEL → ${modelOverride} (Binh Phap: chỉ dùng khi thật sự cần)`);
    pasteText(`/model ${modelOverride}`);
    await sleep(2000);
    tmuxExec(`tmux send-keys -t ${TMUX_SESSION} Enter`);
    await sleep(3000); // Wait for model switch
  }

  // Build full prompt
  let fullPrompt = prompt;
  if (projectDir && projectDir !== config.MEKONG_DIR) {
    fullPrompt = `First cd to ${projectDir} then: ${prompt}`;
  }

  // CC CLI activity indicators (present continuous = actively processing)
  const BUSY_PATTERNS = [
    /Photosynthesizing/i, /Crunching/i, /Saut[eé]ing/i,
    /Marinating/i, /Fermenting/i, /Braising/i,
    /Reducing/i, /Blanching/i, /Thinking/i,
    /Churning/i, /Cooking/i, /Toasting/i,
    /Simmering/i, /Steaming/i, /Grilling/i, /Roasting/i,
    /Vibing/i,                           // ClaudeKit status
    /✻\s+\w+ing/,                        // General: ✻ + any gerund verb
    /\d+[ms]\s+\d+[ms]\s*·\s*↓/,         // Timer + download: "4m 27s · ↓"
    /↓\s*[\d.]+k?\s*tokens/i,            // Download counter: "↓ 4.5k tokens"
    /queued messages/i,
    /Press up to edit queued/i,
  ];


  // sendEnter / sendCtrlC use the outer (correctly-targeted) definitions

  // SAFETY CHECK: Ensure Claude is actually running before dispatching
  // If we paste into a raw ZSH shell, we get "Command not found" errors.
  const checkOutput = capturePane();
  if (!isBrainAlive() || isShellPrompt(checkOutput)) {
    log(`CRITICAL: Brain died or dropped to shell! check=${!isBrainAlive()} shell=${isShellPrompt(checkOutput)}`);
    const respawnSuccess = await respawnBrain(true);
    if (!respawnSuccess) {
      clearMissionLock();
      return { success: false, result: 'brain_died_fatal', elapsed: 0 };
    }
    await sleep(5000);
  }

  // 🛡️ ANTI-STACKING GUARD: Wait for CC CLI to be TRULY idle before dispatching
  // Prevents "queued messages" bug where commands pile up
  // 🔒 Ch.2 作戰: 120s timeout (12×10s) — complex missions need time to finish
  for (let waitAttempt = 0; waitAttempt < 12; waitAttempt++) {
    const preDispatch = capturePane();
    const preState = detectState(preDispatch);
    if (preState === 'busy') {
      log(`ANTI-STACK: CC CLI still busy (attempt ${waitAttempt + 1}/12) — waiting 10s...`);
      await sleep(10000);
      continue;
    }
    if (preState === 'idle' || preState === 'complete' || preState === 'unknown') {
      break; // Safe to dispatch
    }
    if (preState === 'question') {
      log(`ANTI-STACK: CC CLI has pending question — auto-approving first`);
      tmuxExec(`tmux send-keys -t ${TMUX_SESSION}:0.${currentWorkerIdx} y Enter`);
      await sleep(3000);
      continue;
    }
    break;
  }

  // Final check: if STILL busy after 120s, abort this mission
  const finalCheck = capturePane();
  if (isBusy(finalCheck)) {
    log(`ANTI-STACK: CC CLI still busy after 120s wait — ABORTING mission #${num}`);
    clearMissionLock();
    return { success: false, result: 'busy_blocked', elapsed: 0 };
  }

  // Dispatch via paste-buffer (reliable for long text + special chars)
  pasteText(fullPrompt);
  await sleep(3000);
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
  let kickStartCount = 0;

  // Give CC CLI time to parse prompt and begin processing
  await sleep(5000); // Reduced initial sleep to check for early failures

  while (Date.now() < deadline) {
    if (!isSessionAlive()) {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      log(`BRAIN DIED: Mission #${num} (${elapsed}s)`);
      await respawnBrain(true);
      clearMissionLock();
      return { success: false, result: 'brain_died', elapsed };
    }

    const output = capturePane();
    const state = detectState(output);
    const elapsedSec = Math.round((Date.now() - startTime) / 1000);

    // KICK-START: If idle and never busy in first 30s, press Enter again
    if (state === 'idle' && !wasBusy && elapsedSec < 30 && kickStartCount < 2) {
      log(`KICK-START: Idle detected early (${elapsedSec}s) — sending Enter again...`);
      sendEnter();
      kickStartCount++;
      await sleep(2000);
      continue;
    }

    // STUCK INTERVENTION (Parallel Cooling): Kill stuck task if Hot & Long
    if (checkStuckIntervention(elapsedSec, num)) {
      clearMissionLock();
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
        log(`TOKENS: Mission #${num} used ${tk1.tokens.toLocaleString()} tokens (${tk1.requests} reqs, ${tk1.model})`);
        recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk1.tokens, elapsedSec, tk1.model);
        const daily1 = getDailyUsage(); if (daily1.overBudget) log(`⚠️ 作戰: DAILY BUDGET EXCEEDED — ${daily1.tokens.toLocaleString()} tokens today!`);
        clearMissionLock();
        return { success: true, result: 'done', elapsed: elapsedSec };
      }

      case 'busy':
        if (!wasBusy) log(`BUSY: Mission #${num} — CC CLI started processing`);
        wasBusy = true;
        idleConfirmCount = 0;
        break;

      case 'question':
        log(`QUESTION: Mission #${num} — auto-approving`);
        const targetPane = `${TMUX_SESSION}:0.${currentWorkerIdx}`;

        // SPECIAL CASE: API Key Confirmation (Needs "1" + Enter for "Yes")
        // Matches the "2. No (recommended)" text which is selected by default
        if (/2\.\s+No\s+\(recommended\)/i.test(output)) {
          log(`QUESTION: API Key detected in P${currentWorkerIdx} — selecting '1. Yes'`);
          // Spam 1 and Enter for a few seconds to ensure TUI registers it
          for (let i = 0; i < 3; i++) {
            tmuxExec(`tmux send-keys -t ${targetPane} 1`);
            await sleep(500);
            tmuxExec(`tmux send-keys -t ${targetPane} Enter`);
            await sleep(500);
          }
        }
        // SPECIAL CASE: Kick-Start waiting for Enter (bypass permissions)
        else if (/By proceeding, you accept all responsibility/i.test(output) || /Yes, I accept/i.test(output)) {
          log(`QUESTION: Bypass Permissions prompt — ACCEPTING with '2' + Enter`);
          tmuxExec(`tmux send-keys -t ${targetPane} 2`);
          await sleep(500);
          tmuxExec(`tmux send-keys -t ${targetPane} Enter`);
        }
        // SPECIAL CASE: Legacy API Key Prompt
        else if (/Enter your API key/i.test(output)) {
          log(`QUESTION: Legacy API Key prompt detected — sending Enter`);
          tmuxExec(`tmux send-keys -t ${targetPane} Enter`);
        } else {
          // Default "Yes" for simple prompts
          log(`QUESTION: Generic question detected — sending 'y' Enter`);
          tmuxExec(`tmux send-keys -t ${targetPane} y Enter`);
        }
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
            const tk2 = countTokensBetween(missionStartDate, new Date());
            log(`TOKENS: Mission #${num} used ${tk2.tokens.toLocaleString()} tokens (${tk2.requests} reqs, ${tk2.model})`);
            recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk2.tokens, elapsedSec, tk2.model);
            const daily2 = getDailyUsage(); if (daily2.overBudget) log(`⚠️ 作戰: DAILY BUDGET EXCEEDED — ${daily2.tokens.toLocaleString()} tokens today!`);
            clearMissionLock();
            return { success: true, result: 'done', elapsed: elapsedSec };
          }
        } else if (elapsedSec > MIN_MISSION_SECONDS) {
          // Never saw BUSY — might be very fast or isBusy missed it
          idleConfirmCount++;
          if (idleConfirmCount >= IDLE_CONFIRM_POLLS) {
            log(`COMPLETE: Mission #${num} (${elapsedSec}s) [idle-no-busy x${IDLE_CONFIRM_POLLS}]`);
            const tk3 = countTokensBetween(missionStartDate, new Date());
            log(`TOKENS: Mission #${num} used ${tk3.tokens.toLocaleString()} tokens (${tk3.requests} reqs, ${tk3.model})`);
            recordMission(prompt.slice(0, 60), path.basename(projectDir || ''), tk3.tokens, elapsedSec, tk3.model);
            const daily3 = getDailyUsage(); if (daily3.overBudget) log(`⚠️ 作戰: DAILY BUDGET EXCEEDED — ${daily3.tokens.toLocaleString()} tokens today!`);
            clearMissionLock();
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

    // PROJECT FLASH: Ultra Speed Polling (1s)
    await sleep(1000);
  }

  // Timeout — send Ctrl+C and report
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  log(`TIMEOUT: Mission #${num} exceeded ${Math.round(timeoutMs / 1000)}s — sending Ctrl+C`);
  sendCtrlC();
  clearMissionLock();
  return { success: false, result: 'timeout', elapsed };
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
    appendFileSync(config.THERMAL_LOG, `[${new Date().toISOString()}] 🔥 HIGH LOAD (${metrics.load}). Intervening... Sleeping ${coolingTime / 1000}s\n`);

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
