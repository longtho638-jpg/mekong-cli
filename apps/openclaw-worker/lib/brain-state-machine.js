/**
 * brain-state-machine.js
 *
 * BUSY/IDLE/COMPLETE pattern arrays and state detection functions.
 * Exports: BUSY_PATTERNS, COMPLETION_PATTERNS, APPROVE_PATTERNS,
 *          PRO_LIMIT_PATTERNS, CONTEXT_LIMIT_PATTERNS,
 *          isBusy, hasCompletionPattern, hasPrompt, hasApproveQuestion,
 *          hasContextLimit, isShellPrompt, detectState
 */

const { log } = require('./brain-logger');
const { getCleanTail } = require('./brain-tmux-controller');

// --- DETECTION PATTERNS ---

// CC CLI activity indicators (present continuous = actively processing)
const BUSY_PATTERNS = [
  /Photosynthesizing/i, /Crunching/i, /Saut[eé]ing/i,
  /Marinating/i, /Fermenting/i, /Braising/i,
  /Reducing/i, /Blanching/i,
  /[*·✢✻✽✳✶]\s*(?:Thinking|Compacting|Galloping|Reading|Writing|Executing|Running|Bắt đầu|Gusting|Whirring|Boondoggling|Pondering|Synthesizing|Refining|Actioning|Investigating|Analyzing|Exploring)/i,
  /Churning/i, /Cooking/i, /Toasting/i, /Galloping/i,
  /Simmering/i, /Steaming/i, /Grilling/i, /Roasting/i,
  /Levitating/i,
  /Osmosing/i,
  /Computing/i, /^\s*⏺\s*Read/m, /^\s*⏺\s*Execut/m, /Indexing/i,
  /[*·✻✢✽✳✶]\s+\w+ing/,
  /\d+[ms]\s+\d+[ms]\s*·\s*[↑↓]/,
  /[↑↓]\s*[\d.]+k?\s*tokens/i,
  /\d+\s+local\s+agents?/i,
  /Cost:\s*\$[\d.]+/,
  /Calling tool/i, /Running command/i, /Searching/i, /Reading/i, /Writing/i,
  /Running tests/i, /Running\s+\d+\s+Task agents?/i,
  /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,
  /Nesting/i,
  /Puttering/i,
  /Pasted text/i,
  /filesystem\s*[-–—]\s*/i,
  /\+\d+\s+lines\s*\(ctrl/i,
  /Gusting/i, /Whirring/i, /Boondoggling/i, /Pondering/i,
  /Synthesizing/i, /Refining/i, /Actioning/i, /Investigating/i,
  /Analyzing/i, /Exploring/i,
];

// CC CLI completion indicators (past tense = finished cooking)
const COMPLETION_PATTERNS = [
  /(?:Cooked|Churned|Saut[eé]ed|Braised|Blanched|Reduced|Fermented|Marinated|Toasted|Simmered|Steamed|Grilled|Roasted)\s+for\s+\d+/i,
  /[·✻✢✽✳✶]\s+\w+(?:ed|t)\s+for\s+\d+/i,
  /Task completed in/i, /Finished in \d+/i, /Completed\s+\d+\s+steps/i, /Subagent finished/i,
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
  /Do you want to allow/i,
  /Use arrow keys to select/i,
  /Select an option/i,
  /2\.\s+No\s+\(recommended\)/i,
  /1\.\s+Yes,\s+I accept/i,
  /By proceeding, you accept all responsibility/i,
  /muốn.*làm gì/i,
  /USER DECISION/i,
  /Khuyến nghị.*chọn/i,
  /Options?:/i,
  /What would you like/i,
  /Which option/i,
  /tiếp theo/i,
  /Continue with/i,
  /Proceed with/i,
  /Glob patterns are not allowed/i,
  /Waiting for approval/i,
  /Press\s+Enter\s+to\s+continue/i,
];

// Claude Pro Rate Limit indicators
const PRO_LIMIT_PATTERNS = [
  /You(?:'ve| have) hit your limit/i,
  /resets 6am/i,
  /Switch to extra usage/i,
  /Upgrade your plan/i,
];

// CC CLI context exhaustion
const CONTEXT_LIMIT_PATTERNS = [
  /Context limit reached/i,
  /\/compact or \/clear/i,
  /context is full/i,
  /out of context/i,
];

// --- State detection functions ---

/** CC CLI is ACTIVELY PROCESSING (Photosynthesizing, Crunching, etc.) */
function isBusy(output) {
  // 🦞 FIX 2026-02-25: ALL checks now scan only lines AFTER the last ❯ prompt.
  const lines = getCleanTail(output, 8);
  const promptIdx = lines.findLastIndex(l => l.includes('❯'));
  const checkLines = (promptIdx >= 0 ? lines.slice(promptIdx) : lines).filter(l => {
    const clean = l.trim();
    if (!clean) return false;
    if (/^[─━-]+$/.test(clean)) return false;
    if (/bypass permissions/i.test(clean)) return false;
    return true;
  });
  const tail = checkLines.join('\n');

  const subagentPattern = /\d+\s+local\s+agents?/i;
  const hasSubagent = subagentPattern.test(tail);

  const promptLine = promptIdx >= 0 ? lines[promptIdx] : '';
  if (promptLine.match(/^[❯>]\s*(Try\s|$)/) && checkLines.length <= 1) return false;
  const matched = BUSY_PATTERNS.find(p => p.test(tail));

  const isActuallyBusy = hasSubagent || !!matched;

  // If CC CLI is interrupted, it is IDLE not busy
  const interruptedIdx = lines.findLastIndex(l =>
    /Interrupted\.\s*What should Claude do instead\?/i.test(l) || /Interrupted/i.test(l)
  );
  const busyIdx = lines.findLastIndex(l => (matched && matched.test(l)) || subagentPattern.test(l));

  if (interruptedIdx > busyIdx && interruptedIdx !== -1) {
    return false;
  }

  if (hasSubagent) log(`isBusy MATCH: SUBAGENTS ACTIVE → ${tail.match(subagentPattern)?.[0]}`);
  else if (matched) log(`isBusy MATCH: ${matched} → ${tail.match(matched)?.[0]?.slice(0, 50)}`);

  return isActuallyBusy;
}

/** Mission completion pattern found (Cooked for Xm Ys, Sautéed for Xm Ys) */
function hasCompletionPattern(output) {
  const tail = getCleanTail(output, 10).join('\n');
  return COMPLETION_PATTERNS.some(p => p.test(tail));
}

/**
 * CC CLI prompt visible — ONLY meaningful when NOT busy.
 * WARNING: CC CLI TUI always renders ❯ even when processing.
 */
function hasPrompt(output) {
  if (isBusy(output)) return false;
  for (const line of getCleanTail(output, 10)) {
    const t = line.trim();
    if (!t) continue;
    if (t.includes('❯')) return true;
    if (/^>\s*$/.test(t)) return true;
    if (t.includes('Interrupted')) return true;
  }
  return false;
}

function hasApproveQuestion(output) {
  // Extend to 15 lines — questions can appear mid-scrollback
  const tail = getCleanTail(output, 15).join('\n');
  return APPROVE_PATTERNS.some(p => p.test(tail));
}

function hasContextLimit(output) {
  // 🦞 FIX: Proxy handles infinite context, so we never trigger context_limit state.
  return false;
}

/** Check if the pane is sitting at a raw shell prompt (zsh/bash) instead of Claude */
function isShellPrompt(output) {
  const tail = getCleanTail(output, 5).join('\n');
  if (tail.includes('❯')) return false;
  if (tail.includes('Choose a capability:')) return false;
  if (/^>\s*$/.test(tail.trim())) return false;

  if (/%[\s]*$/.test(tail)) return true; // zsh
  if (/\$ \s*$/.test(tail)) return true; // bash
  if (/# \s*$/.test(tail)) return true;  // root
  return false;
}

/**
 * Unified state detection from tmux output.
 * Returns: 'busy' | 'complete' | 'context_limit' | 'question' | 'idle' | 'unknown'
 * CRITICAL: BUSY checked BEFORE completion — prevents stale "Cooked for"
 * in scrollback from overriding active processing indicators.
 */
function detectState(output) {
  if (hasContextLimit(output)) return 'context_limit';
  // Questions can appear while "Busy" text is still visible — handle first to unblock
  if (hasApproveQuestion(output)) return 'question';
  if (isBusy(output)) return 'busy';
  if (hasCompletionPattern(output)) return 'complete';
  if (hasPrompt(output)) return 'idle';
  return 'unknown';
}

module.exports = {
  BUSY_PATTERNS,
  COMPLETION_PATTERNS,
  APPROVE_PATTERNS,
  PRO_LIMIT_PATTERNS,
  CONTEXT_LIMIT_PATTERNS,
  isBusy,
  hasCompletionPattern,
  hasPrompt,
  hasApproveQuestion,
  hasContextLimit,
  isShellPrompt,
  detectState,
};
