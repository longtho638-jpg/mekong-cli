/**
 * brain-boot-sequence.js
 *
 * Dual-pane tmux session boot: creates PRO (Planner) + API (Executor) panes,
 * writes sandbox configs, copies oauth creds, waits for CC CLI ready prompts.
 *
 * Exports: spawnBrain
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const config = require('../config');
const { getHandForIntent } = require('./hands-registry');
const { log } = require('./brain-logger');
const { tmuxExec, isSessionAlive, capturePane } = require('./brain-tmux-controller');
const { startHealthServer } = require('./brain-health-server');
// Lazy-require to break circular: boot-sequence ↔ spawn-manager
// SINGLE SOURCE OF TRUTH: generateClaudeCommand lives in brain-spawn-manager.js
function generateClaudeCommand(intent) {
  return require('./brain-spawn-manager').generateClaudeCommand(intent);
}

async function spawnBrain() {
  const TMUX_SESSION = `${config.TMUX_SESSION}:brain`;
  const LOCK_FILE = path.join(os.tmpdir(), 'tom_hum_spawn_brain.lock');

  // 🦞 FIX 2026-02-28: Prevent race condition — only one spawnBrain at a time
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockAge = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
      if (lockAge < 30000) { // Lock valid for 30s
        log(`BRAIN: spawnBrain LOCKED (age ${Math.round(lockAge / 1000)}s) — skipping to prevent race`);
        return;
      }
      fs.unlinkSync(LOCK_FILE); // Stale lock — remove
    }
    fs.writeFileSync(LOCK_FILE, `${process.pid}\n${Date.now()}`);
  } catch (e) { /* ignore lock errors */ }
  if (isSessionAlive(TMUX_SESSION)) {
    try {
      // Use session name only — window may be renamed by tmux config
      const sessionOnly = TMUX_SESSION.split(':')[0];
      const paneCount = parseInt(
        execSync(`tmux list-panes -t ${sessionOnly} | wc -l`, { encoding: 'utf-8' }).trim()
      );
      if (paneCount >= 3) {
        log(`BRAIN: tmux session exists (Panes: ${paneCount}/3) — reusing`);
        return;
      }
      log(`BRAIN: Session exists but has ${paneCount}/3 panes. REPAIRING...`);
      tmuxExec(`tmux kill-session -t ${sessionOnly}`, TMUX_SESSION);
    } catch (e) {
      log(`BRAIN: Error checking session: ${e.message} — will recreate`);
      // DO NOT kill session here — it may be alive with renamed window
      try { tmuxExec(`tmux kill-session -t ${TMUX_SESSION.split(':')[0]}`, TMUX_SESSION); } catch (_) { }
    }
  }

  log(`BRAIN: Creating TRIPLE-PANE SANDWICH tmux session...`);
  _writeSandboxConfigs();
  _persistAuthCredentials();
  startHealthServer();

  const cmdPro = generateClaudeCommand('PRO');
  const cmdApi = generateClaudeCommand('API');
  // 🔒 STRICT 1P1 ROUTING — Each pane MUST cd to its assigned project
  const dirP0 = config.MEKONG_DIR;                                    // P0: mekong-cli
  const dirP1 = path.join(config.MEKONG_DIR, 'apps', 'well');         // P1: well
  const dirP2 = path.join(config.MEKONG_DIR, 'apps', 'algo-trader');  // P2: algo-trader
  const sessionName = TMUX_SESSION.split(':')[0];

  log(`BRAIN: Creating NEW session [${sessionName}] — STRICT 1P1: P0=${dirP0}, P1=${dirP1}, P2=${dirP2}`);
  tmuxExec(`tmux new-session -d -s ${sessionName} -n brain -x 200 -y 50 -c ${dirP0}`, TMUX_SESSION);
  tmuxExec(`tmux rename-window -t ${sessionName}:0 brain`, TMUX_SESSION); // safety
  tmuxExec(`tmux set-option -t ${sessionName} remain-on-exit on`, TMUX_SESSION);
  tmuxExec(`tmux set-option -t ${sessionName} allow-rename off`, TMUX_SESSION);
  tmuxExec(`tmux split-window -h -t ${TMUX_SESSION}.0 -c ${dirP1}`, TMUX_SESSION);
  tmuxExec(`tmux split-window -v -t ${TMUX_SESSION}.1 -c ${dirP2}`, TMUX_SESSION);

  await new Promise(r => setTimeout(r, 1000));

  tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.0 'cd ${dirP0} && ${cmdPro}' Enter`, TMUX_SESSION);
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}.0 -T "P0: mekong-cli ONLY"`, TMUX_SESSION);

  tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.1 'cd ${dirP1} && ${cmdApi}' Enter`, TMUX_SESSION);
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}.1 -T "P1: well ONLY"`, TMUX_SESSION);

  tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.2 'cd ${dirP2} && ${cmdApi}' Enter`, TMUX_SESSION);
  tmuxExec(`tmux select-pane -t ${TMUX_SESSION}.2 -T "P2: algo-trader ONLY"`, TMUX_SESSION);

  log(`BRAIN: Waiting for CC CLI bypass prompts...`);
  await new Promise(r => setTimeout(r, 10000));
  await _acceptBootPrompts(TMUX_SESSION);

  log(`BRAIN: Dual-Pane Sandwich Boot Complete [session=${TMUX_SESSION}]`);
}

// --- Private helpers ---

function _buildMcpConfig() {
  return {
    mcpServers: {}
  };
}

function _writeSandboxConfigs() {
  const mcpConfig = _buildMcpConfig();
  const handPro = getHandForIntent('PLAN');
  const handApi = getHandForIntent('COOK');

  const profilePro = '/Users/macbookprom1/.claude_antigravity_pro';
  const profileApi = '/Users/macbookprom1/.claude_antigravity_api';

  for (const [dir, hand, color] of [[profilePro, handPro, '#A020F0'], [profileApi, handApi, '#00FF00']]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const cfg = {
      primaryColor: color,
      customInstructions: hand.instructions,
      dangerouslySkipPermissions: true,
      bypassPermissions: true,
      agreedToBypassPermissions: true,
    };
    fs.writeFileSync(path.join(dir, 'config.json'), JSON.stringify(cfg, null, 2));
    fs.writeFileSync(path.join(dir, 'mcp.json'), JSON.stringify(mcpConfig, null, 2));
  }
}

function _persistAuthCredentials() {
  try {
    const srcDir = '/Users/macbookprom1/.claude';
    const tokens = fs.readdirSync(srcDir).filter(f => f.startsWith('oauth_creds'));
    for (const token of tokens) {
      const src = path.join(srcDir, token);
      fs.copyFileSync(src, path.join('/Users/macbookprom1/.claude_antigravity_pro', token));
      fs.copyFileSync(src, path.join('/Users/macbookprom1/.claude_antigravity_api', token));
    }
    log(`BRAIN: Persisted Auth Pro credentials to Sandbox Profiles.`);
  } catch (e) {
    log(`BRAIN: Auth persistence warning - ${e.message}`);
  }
}

async function _acceptBootPrompts(TMUX_SESSION) {
  for (let paneIdx = 0; paneIdx < 3; paneIdx++) {
    for (let retry = 0; retry < 30; retry++) {
      const out = capturePane(paneIdx, TMUX_SESSION);
      if (out.includes('accept all responsibility') || out.includes('Permissions mode.')) {
        log(`BRAIN: P${paneIdx} prompt — sending Down+Enter (attempt ${retry + 1})...`);
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${paneIdx} Down`, TMUX_SESSION);
        await new Promise(r => setTimeout(r, 1000));
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${paneIdx} Enter`, TMUX_SESSION);
      } else if (
        out.includes('Choose the text style') ||
        out.includes('Press Enter to continue') ||
        out.includes('Yes, I trust this folder')
      ) {
        tmuxExec(`tmux send-keys -t ${TMUX_SESSION}.${paneIdx} Enter`, TMUX_SESSION);
      } else if (out.includes('❯')) {
        log(`BRAIN: P${paneIdx} Native Boot Complete!`);
        break;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

module.exports = { spawnBrain };
