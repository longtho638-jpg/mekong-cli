'use strict';

/**
 * 🧠 LLM Perception Layer — Brain Transfer Module
 * 
 * Replaces regex-based state detection with LLM-powered understanding.
 * Uses Antigravity Proxy (port 9191) to call Gemini/Claude for semantic
 * analysis of CC CLI tmux output.
 * 
 * Falls back to regex if LLM call fails/times out.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PROXY_URL = 'http://127.0.0.1:9191';
const LLM_TIMEOUT_MS = 15000;
const CACHE_TTL_MS = 30000; // Cache LLM results for 30s
const perceptionCache = new Map();

function log(msg) {
    const ts = new Date().toISOString().slice(11, 19);
    const line = `[${ts}] [llm-perception] ${msg}\n`;
    try {
        const logFile = process.env.LOG_FILE || path.join(__dirname, '..', '..', '..', 'tom_hum_vibe.log');
        fs.appendFileSync(logFile, line);
    } catch { }
}

const SYSTEM_PROMPT = `You are CTO Brain — an autonomous AI operations manager analyzing CC CLI (Claude Code) tmux terminal output.

Your job: Read the terminal output and return a structured JSON analysis.

RULES:
- Return ONLY valid JSON, no markdown, no explanation
- Be concise in context and suggestion fields (max 50 words each)
- state must be one of: "idle", "busy", "stuck", "error", "complete", "fresh_boot", "rate_limited"

JSON Schema:
{
  "state": "idle|busy|stuck|error|complete|fresh_boot|rate_limited",
  "context": "Brief description of what CC CLI is doing/was doing",
  "suggestion": "What task to assign next (if idle) or how to fix (if stuck/error)",
  "error": null or "error description",
  "progress": "0-100 estimate of current task completion",
  "blockers": [] 
}

STATE DEFINITIONS:
- idle: Prompt visible (❯), no active processing, ready for new task
- fresh_boot: Just started, shows "try" examples, no task assigned yet
- busy: Actively processing (Whisking, Churning, Reading files, etc.)
- stuck: Has been working but no progress, possible infinite loop
- error: Build/test/deploy error visible in output
- complete: Task finished (Cooked for Xm Ys), ready for next
- rate_limited: Hit API rate limit, waiting`;

/**
 * Call LLM via Antigravity Proxy to analyze tmux output.
 * @param {string} paneOutput - Last 30 lines of tmux capture
 * @param {string} projectName - Project being worked on
 * @param {number} paneIdx - Pane index (0-3)
 * @returns {Promise<object>} Structured perception result
 */
function perceivePaneWithLLM(paneOutput, projectName, paneIdx) {
    return new Promise((resolve, reject) => {
        // Check cache first
        const cacheKey = `P${paneIdx}`;
        const cached = perceptionCache.get(cacheKey);
        if (cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
            return resolve(cached.result);
        }

        const trimmedOutput = paneOutput.slice(-2000); // Max 2000 chars

        const payload = JSON.stringify({
            model: 'gemini-2.5-pro',
            max_tokens: 300,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `Pane: P${paneIdx} | Project: ${projectName}\n\n--- TERMINAL OUTPUT ---\n${trimmedOutput}\n--- END ---` }
            ]
        });

        const url = new URL(`${PROXY_URL}/v1/chat/completions`);

        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
            timeout: LLM_TIMEOUT_MS,
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.message?.content || '';

                    // Parse JSON from LLM response (may have markdown wrapping)
                    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    const result = JSON.parse(cleaned);

                    // Validate required fields
                    if (!result.state) result.state = 'unknown';
                    if (!result.context) result.context = '';
                    if (!result.suggestion) result.suggestion = '';

                    // Cache result
                    perceptionCache.set(cacheKey, { result, ts: Date.now() });

                    log(`P${paneIdx} LLM: state=${result.state} | ${result.context.slice(0, 60)}`);
                    resolve(result);
                } catch (e) {
                    log(`P${paneIdx} LLM parse error: ${e.message}`);
                    reject(new Error(`LLM parse error: ${e.message}`));
                }
            });
        });

        req.on('error', (e) => {
            log(`P${paneIdx} LLM network error: ${e.message}`);
            reject(e);
        });

        req.on('timeout', () => {
            req.destroy();
            log(`P${paneIdx} LLM timeout (${LLM_TIMEOUT_MS}ms)`);
            reject(new Error('LLM timeout'));
        });

        req.write(payload);
        req.end();
    });
}

/**
 * Map LLM perception state → Vibe Factory state for compatibility.
 */
function mapToVibeState(llmState) {
    const MAP = {
        'idle': 'IDLE',
        'fresh_boot': 'IDLE',
        'busy': 'WORKING',
        'stuck': 'IDLE',       // Stuck = treat as idle, re-inject task
        'error': 'IDLE',       // Error = treat as idle, inject fix task
        'complete': 'IDLE',    // Complete = ready for next task
        'rate_limited': 'RATE_LIMITED',
    };
    return MAP[llmState] || 'ACTIVE';
}

/**
 * Build a context-aware prompt based on LLM perception.
 * @param {object} perception - LLM perception result
 * @param {string} projectName - Project name
 * @returns {string|null} ClaudeKit command or null if no action needed
 */
function buildSmartPrompt(perception, projectName) {
    if (!perception) return null;

    switch (perception.state) {
        case 'idle':
        case 'fresh_boot':
        case 'complete':
            // Use suggestion if available, else generic scan
            if (perception.suggestion && perception.suggestion.length > 10) {
                return `/cook "${projectName}: ${perception.suggestion}"`;
            }
            return null; // Let Binh Phap scanner handle it

        case 'stuck':
            return `/cook "${projectName}: UNSTUCK — ${perception.suggestion || 'Analyze current state, identify blocker, fix and continue.'}"`;

        case 'error':
            const errorCtx = perception.error || perception.context || 'unknown error';
            return `/debug "${projectName}: ${errorCtx.slice(0, 100)}"`;

        default:
            return null;
    }
}

/**
 * Clear perception cache for a specific pane or all panes.
 */
function clearCache(paneIdx = null) {
    if (paneIdx !== null) {
        perceptionCache.delete(`P${paneIdx}`);
    } else {
        perceptionCache.clear();
    }
}

// ══════════════════════════════════════════════════
// 🛡️ LLM GUARD GATE — Validate ALL states before action
// ══════════════════════════════════════════════════

const TOKEN_BUDGET_PER_HOUR = 15; // Max LLM calls per pane per hour
const tokenUsage = new Map(); // paneIdx → [{ ts }]

/**
 * Check if we should spend tokens on LLM call for this pane.
 * Prevents LLM perception itself from wasting quota.
 * @param {number} paneIdx
 * @returns {boolean}
 */
function shouldSpendTokens(paneIdx) {
    const key = `P${paneIdx}`;
    const now = Date.now();
    const hourAgo = now - 3600000;

    // Get or init usage array
    let usage = tokenUsage.get(key) || [];
    // Prune old entries
    usage = usage.filter(u => u.ts > hourAgo);
    tokenUsage.set(key, usage);

    if (usage.length >= TOKEN_BUDGET_PER_HOUR) {
        log(`P${paneIdx} 🛡️ TOKEN BUDGET EXCEEDED (${usage.length}/${TOKEN_BUDGET_PER_HOUR}/hr) — regex only`);
        return false;
    }
    return true;
}

/**
 * Record a token spend for budget tracking.
 */
function recordTokenSpend(paneIdx) {
    const key = `P${paneIdx}`;
    const usage = tokenUsage.get(key) || [];
    usage.push({ ts: Date.now() });
    tokenUsage.set(key, usage);
}

const GUARD_PROMPT = `You are a quick state validator for CC CLI terminal output.
Given: regex_state (what regex detected) and terminal output.
Decide: Is the regex state correct? Should we override it?

Return ONLY JSON:
{
  "agree": true/false,
  "correctedState": "IDLE|WORKING|DEAD|RATE_LIMITED|PENDING",
  "reason": "brief reason (max 20 words)",
  "shouldAct": true/false
}

RULES:
- If output shows active processing verbs (Whisking, Churning, Reading...) → WORKING, shouldAct=false
- If output shows "try" examples + "bypass permissions on" → IDLE (fresh boot), shouldAct=true
- If regex says DEAD but output shows "Compacting conversation" → WORKING, shouldAct=false (DON'T restart!)
- If regex says WORKING but output hasn't changed in multiple checks → stuck, shouldAct=true
- Be conservative: when in doubt, agree with regex`;

/**
 * Quick LLM guard check — validates regex state before taking action.
 * Uses lean prompt (~100 tokens) for fast turnaround.
 * @param {string} paneOutput - tmux capture
 * @param {string} regexState - What regex detected (IDLE, WORKING, DEAD, etc.)
 * @param {string} projectName
 * @param {number} paneIdx
 * @returns {Promise<{agree: boolean, correctedState: string, reason: string, shouldAct: boolean}>}
 */
function guardCheck(paneOutput, regexState, projectName, paneIdx) {
    return new Promise((resolve, reject) => {
        if (!shouldSpendTokens(paneIdx)) {
            return resolve({ agree: true, correctedState: regexState, reason: 'budget exceeded', shouldAct: true });
        }

        const trimmed = paneOutput.slice(-1000); // Guard needs less context
        const payload = JSON.stringify({
            model: 'gemini-2.5-pro',
            max_tokens: 150,
            messages: [
                { role: 'system', content: GUARD_PROMPT },
                { role: 'user', content: `regex_state: ${regexState}\nProject: ${projectName}\n\n${trimmed}` }
            ]
        });

        const url = new URL(`${PROXY_URL}/v1/chat/completions`);
        const req = http.request({
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
            timeout: 10000,
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const content = json.choices?.[0]?.message?.content || '';
                    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                    const result = JSON.parse(cleaned);

                    recordTokenSpend(paneIdx);

                    if (!result.agree) {
                        log(`P${paneIdx} 🛡️ GUARD OVERRIDE: ${regexState} → ${result.correctedState} (${result.reason})`);
                    }
                    resolve(result);
                } catch (e) {
                    resolve({ agree: true, correctedState: regexState, reason: 'parse fail', shouldAct: true });
                }
            });
        });

        req.on('error', () => resolve({ agree: true, correctedState: regexState, reason: 'network fail', shouldAct: true }));
        req.on('timeout', () => { req.destroy(); resolve({ agree: true, correctedState: regexState, reason: 'timeout', shouldAct: true }); });
        req.write(payload);
        req.end();
    });
}

/**
 * Get token budget status for monitoring.
 */
function getTokenBudgetStatus() {
    const status = {};
    for (const [key, usage] of tokenUsage.entries()) {
        const hourAgo = Date.now() - 3600000;
        const recent = usage.filter(u => u.ts > hourAgo);
        status[key] = { used: recent.length, budget: TOKEN_BUDGET_PER_HOUR, remaining: TOKEN_BUDGET_PER_HOUR - recent.length };
    }
    return status;
}

module.exports = {
    perceivePaneWithLLM,
    mapToVibeState,
    buildSmartPrompt,
    clearCache,
    guardCheck,
    shouldSpendTokens,
    recordTokenSpend,
    getTokenBudgetStatus,
    SYSTEM_PROMPT,
    GUARD_PROMPT,
};
