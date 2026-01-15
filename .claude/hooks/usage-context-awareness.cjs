#!/usr/bin/env node
/**
 * UserPromptSubmit hook: Injects usage limits and context window awareness
 *
 * This hook fires on user prompts and injects:
 * 1. Claude Code usage limits (5-hour, 7-day windows) from Anthropic OAuth API
 * 2. Context window utilization from statusline temp file
 *
 * Features:
 * - Triggers immediately when user asks about usage/context/limits
 * - Cross-platform credential retrieval (macOS Keychain, file-based)
 * - API response caching (60s TTL)
 * - Injection throttling (1 min for prompts, 5 mins for tool use)
 * - Warning thresholds at 70%/90%
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Cache and throttle configuration
const USAGE_CACHE_FILE = path.join(os.tmpdir(), 'ck-usage-limits-cache.json');
const INJECT_STATE_FILE = path.join(os.tmpdir(), 'ck-usage-inject-state.json');
const CACHE_TTL_MS = 60000; // 60 seconds
const INJECT_INTERVAL_MS = 300000; // 5 minutes for PostToolUse
const INJECT_INTERVAL_PROMPT_MS = 60000; // 1 minute for UserPromptSubmit

// Keywords that trigger immediate injection (bypass throttle)
const USAGE_KEYWORDS = ['context', 'usage', 'limit', 'token', 'window', 'utilization', 'remaining', '5h', '7d', '5-hour', '7-day'];

// Warning thresholds
const WARN_THRESHOLD = 70;
const CRITICAL_THRESHOLD = 90;

/**
 * Get Claude OAuth credentials (cross-platform)
 * Priority: macOS Keychain > file-based credentials
 */
function getClaudeCredentials() {
  // macOS: Try Keychain first
  if (os.platform() === 'darwin') {
    try {
      const result = execSync(
        'security find-generic-password -s "Claude Code-credentials" -w',
        { timeout: 5000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      ).trim();
      const parsed = JSON.parse(result);
      if (parsed.claudeAiOauth?.accessToken) {
        return parsed.claudeAiOauth.accessToken;
      }
    } catch {
      // Fallback to file-based
    }
  }

  // File-based credentials (Linux/Windows, or macOS fallback)
  const credPath = path.join(os.homedir(), '.claude', '.credentials.json');
  try {
    const content = fs.readFileSync(credPath, 'utf-8');
    const parsed = JSON.parse(content);
    return parsed.claudeAiOauth?.accessToken || null;
  } catch {
    return null;
  }
}

/**
 * Fetch usage limits from Anthropic OAuth API (with caching)
 */
async function fetchUsageLimits() {
  // Check cache first
  try {
    if (fs.existsSync(USAGE_CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(USAGE_CACHE_FILE, 'utf-8'));
      if (Date.now() - cache.timestamp < CACHE_TTL_MS && cache.data) {
        return cache.data;
      }
    }
  } catch {}

  const token = getClaudeCredentials();
  if (!token) return null;

  try {
    const response = await fetch('https://api.anthropic.com/api/oauth/usage', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'anthropic-beta': 'oauth-2025-04-20',
        'User-Agent': 'claudekit-engineer/1.0',
      },
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Cache the result
    try {
      fs.writeFileSync(USAGE_CACHE_FILE, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch {}

    return data;
  } catch {
    return null;
  }
}

/**
 * Read context window data from statusline temp file
 */
function getContextWindow(sessionId) {
  if (!sessionId) return null;

  try {
    const contextPath = path.join(os.tmpdir(), `ck-context-${sessionId}.json`);
    if (fs.existsSync(contextPath)) {
      const data = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
      // Only use if data is fresh (< 30 seconds old)
      if (Date.now() - data.timestamp < 30000) {
        return data;
      }
    }
  } catch {}

  return null;
}

/**
 * Check if user prompt contains usage-related keywords
 */
function promptAsksAboutUsage(prompt) {
  if (!prompt) return false;
  const lower = prompt.toLowerCase();
  return USAGE_KEYWORDS.some(kw => lower.includes(kw));
}

/**
 * Check if we should inject awareness info (throttled)
 * @param {boolean} isUserPrompt - true if this is a UserPromptSubmit hook
 * @param {string} userPrompt - the user's prompt text (if UserPromptSubmit)
 */
function shouldInject(isUserPrompt = false, userPrompt = '') {
  // Always inject if user explicitly asks about usage
  if (isUserPrompt && promptAsksAboutUsage(userPrompt)) {
    return true;
  }

  // Use shorter interval for UserPromptSubmit
  const interval = isUserPrompt ? INJECT_INTERVAL_PROMPT_MS : INJECT_INTERVAL_MS;

  try {
    if (fs.existsSync(INJECT_STATE_FILE)) {
      const state = JSON.parse(fs.readFileSync(INJECT_STATE_FILE, 'utf-8'));
      if (Date.now() - state.lastInject < interval) {
        return false;
      }
    }
  } catch {}
  return true;
}

/**
 * Update injection state timestamp
 */
function markInjected() {
  try {
    fs.writeFileSync(INJECT_STATE_FILE, JSON.stringify({ lastInject: Date.now() }));
  } catch {}
}

/**
 * Format percentage with warning indicator
 * Note: API returns utilization as percentage (0-100), not decimal (0-1)
 */
function formatPercent(value, label) {
  const pct = Math.round(value);
  if (pct >= CRITICAL_THRESHOLD) return `${label}=${pct}% [CRITICAL]`;
  if (pct >= WARN_THRESHOLD) return `${label}=${pct}% [WARNING]`;
  return `${label}=${pct}%`;
}

/**
 * Main hook execution
 */
async function main() {
  try {
    // Read hook input from stdin
    let inputStr = '';
    try {
      inputStr = fs.readFileSync(0, 'utf-8');
    } catch {}

    const input = JSON.parse(inputStr || '{}');
    const sessionId = input.session_id;

    // Detect hook type: UserPromptSubmit has 'prompt', PostToolUse has 'tool_name'
    const isUserPrompt = typeof input.prompt === 'string';
    const userPrompt = input.prompt || '';

    // Always allow tool/prompt to continue
    const result = { continue: true };

    // Check if we should inject (throttled, but bypasses for usage keywords)
    if (!shouldInject(isUserPrompt, userPrompt)) {
      console.log(JSON.stringify(result));
      return;
    }

    const lines = [];

    // Fetch usage limits from Anthropic API
    const usage = await fetchUsageLimits();
    if (usage) {
      const parts = [];
      if (usage.five_hour) {
        parts.push(formatPercent(usage.five_hour.utilization || 0, '5h'));
      }
      if (usage.seven_day) {
        parts.push(formatPercent(usage.seven_day.utilization || 0, '7d'));
      }
      if (parts.length > 0) {
        lines.push(`Limits: ${parts.join(', ')}`);
      }
    }

    // Get context window from statusline temp file
    const context = getContextWindow(sessionId);
    if (context && typeof context.percent === 'number') {
      let contextLine = `Context: ${context.percent}%`;
      if (context.percent >= CRITICAL_THRESHOLD) {
        contextLine += ' [CRITICAL - compaction needed]';
      } else if (context.percent >= WARN_THRESHOLD) {
        contextLine += ' [WARNING - consider compaction]';
      }
      lines.push(contextLine);
    }

    // Inject if we have data (plain text stdout for UserPromptSubmit)
    if (lines.length > 0) {
      markInjected();
      // Plain text output is added as context for UserPromptSubmit hooks
      console.log(`<usage-awareness>\n${lines.join('\n')}\n</usage-awareness>`);
      process.exit(0);
    }

    // No data to inject - just allow continue
    console.log(JSON.stringify({ continue: true }));

  } catch (err) {
    // On error, allow operation to continue silently
    console.log(JSON.stringify({ continue: true }));
  }
}

main().catch(() => {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
});
