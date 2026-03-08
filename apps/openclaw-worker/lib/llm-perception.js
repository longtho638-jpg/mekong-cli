'use strict';

/**
 * 🧠 LLM Perception Layer — Brain Transfer Module (OpenAI Format)
 * 
 * Uses DashScope OpenAI-compatible endpoint (compatible-mode/v1)
 * for CTO brain perception. Aligns with OpenClaw $50/month package.
 * 
 * Falls back to regex if LLM call fails/times out.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// CTO uses dedicated Key C on DashScope International OpenAI-compatible endpoint
const CTO_PROVIDERS = [
    {
        id: 'dashscope', name: 'DashScope',
        url: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
        keys: [
            process.env.CTO_DASHSCOPE_KEY || 'sk-80d8537485d04f609c498f1881e67c6f', // Key C — CTO only
            process.env.DASHSCOPE_API_KEY || 'sk-sp-652cd51db1774704a992863926cd1f67',  // Key A
            'sk-sp-afce4429a10e41bb901d6012d7f525c8',  // Key B
        ],
        model: 'qwen-plus'
    },
    {
        id: 'blackbox', name: 'Blackbox',
        url: 'https://api.blackbox.ai/v1/chat/completions',
        keys: ['sk-ELEERyI0MyROHMJY27q-Sg'],
        model: 'blackboxai/moonshotai/kimi-k2-thinking'
    }
];
let _providerIdx = 0;
let _keyIdx = 0;
let _consecutiveFailures = 0;

function getActiveProvider() { return CTO_PROVIDERS[_providerIdx]; }
function getActiveKey() { return getActiveProvider().keys[_keyIdx]; }
function getActiveUrl() { return getActiveProvider().url; }
function getActiveModel() { return process.env.CTO_LLM_MODEL || getActiveProvider().model; }

function rotateKey() {
    const provider = getActiveProvider();
    _keyIdx = (_keyIdx + 1) % provider.keys.length;
    if (_keyIdx === 0) {
        // All keys exhausted for this provider → switch provider
        _consecutiveFailures++;
        if (_consecutiveFailures >= 2) {
            _providerIdx = (_providerIdx + 1) % CTO_PROVIDERS.length;
            _keyIdx = 0;
            _consecutiveFailures = 0;
            log(`🔄 CTO BRAIN PROVIDER SWITCH → ${CTO_PROVIDERS[_providerIdx].name} (${CTO_PROVIDERS[_providerIdx].model})`);
        } else {
            log(`🔄 CTO Key rotated to ${_keyIdx + 1}/${provider.keys.length} on ${provider.name}`);
        }
    } else {
        log(`🔄 CTO Key rotated to ${_keyIdx + 1}/${provider.keys.length} on ${provider.name}`);
    }
}
function resetFailures() { _consecutiveFailures = 0; }

const LLM_TIMEOUT_MS = 45000;
const CACHE_TTL_MS = 60000; // Cache LLM results for 30s
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
- suggestion MUST be a concrete task description, NOT a command name
- NEVER suggest proxy, bridge, health server, or port scanning tasks
- Focus on: code quality, tests, builds, features, security, documentation

COMMAND MAPPING (you suggest the TASK, CTO picks the COMMAND):
- Idle/Complete → /bootstrap:auto:parallel (full auto scan+fix+commit)
- Complex feature → /plan:hard (deep planning)
- Bug/Error → /debug (root cause analysis)
- Quick fix → /cook (implement fast)
- Code review → /review (audit quality)

JSON Schema:
{
  "state": "idle|busy|stuck|error|complete|fresh_boot|rate_limited",
  "context": "Brief description of what CC CLI is doing/was doing",
  "suggestion": "Concrete task: what to scan, fix, build, or improve next",
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

        // OpenAI Chat Completions format (Active Provider)
        const payload = JSON.stringify({
            model: getActiveModel(),
            max_tokens: 512,
            messages: [
                { role: 'system', content: SYSTEM_PROMPT.trim() },
                { role: 'user', content: `Pane: P${paneIdx} | Project: ${projectName}\n\n--- TERMINAL OUTPUT ---\n${trimmedOutput}\n--- END ---` }
            ]
        });

        const url = new URL(getActiveUrl());
        const isHttps = url.protocol === 'https:';
        const transport = isHttps ? require('https') : http;

        const req = transport.request({
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Authorization': `Bearer ${getActiveKey()}`
            },
            timeout: LLM_TIMEOUT_MS,
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    // OpenAI format (fallback to Anthropic format for Key A/B)
                    const rawContent = json.choices?.[0]?.message?.content || json.content?.find(c => c.type === 'text')?.text || '';

                    // Parse JSON from LLM response (may have markdown wrapping)
                    const cleaned = rawContent.replace(/```json\n?|\n?```/g, '').trim();
                    let result;
                    try {
                        result = JSON.parse(cleaned);
                    } catch (e) {
                        console.warn(`[llm-perception] JSON parse error for P${paneIdx}. RAW HTTP DATA:\n`, data.substring(0, 1000));
                        reject(new Error(`LLM parse error: ${e.message}`));
                        return;
                    }

                    // Validate required fields
                    if (!result.state) result.state = 'unknown';
                    if (!result.context) result.context = '';
                    if (!result.suggestion) result.suggestion = '';

                    // Cache result
                    perceptionCache.set(cacheKey, { result, ts: Date.now() });

                    log(`P${paneIdx} LLM [${getActiveProvider().name}]: state=${result.state} | ${result.context.slice(0, 60)}`);
                    resetFailures();
                    resolve(result);
                } catch (e) {
                    log(`P${paneIdx} LLM parse error: ${e.message}`);
                    reject(new Error(`LLM parse error: ${e.message}`));
                }
            });
        });

        // ✅ OLLAMA FALLBACK (九變 Ch.8 - Cửu Biến Adaptation)
        // Mapped from v2026.3.2 memorySearch.fallback="ollama"
        const attemptOllamaFallback = () => {
            log(`P${paneIdx} ⚠️ Proxy failed. Executing local Ollama fallback...`);
            const fallbackReq = http.request({
                hostname: 'localhost',
                port: 11434,
                path: '/v1/chat/completions',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                timeout: LLM_TIMEOUT_MS
            }, (fallbackRes) => {
                let fallbackData = '';
                fallbackRes.on('data', chunk => fallbackData += chunk);
                fallbackRes.on('end', () => {
                    try {
                        const fJson = JSON.parse(fallbackData);
                        const fContent = fJson.choices?.[0]?.message?.content || '{}';
                        const fCleaned = fContent.replace(/```json\n?|\n?```/g, '').trim();
                        const fResult = JSON.parse(fCleaned);
                        if (!fResult.state) fResult.state = 'unknown';
                        if (!fResult.context) fResult.context = '';
                        if (!fResult.suggestion) fResult.suggestion = '';
                        // Cache result
                        perceptionCache.set(cacheKey, { result: fResult, ts: Date.now() });
                        log(`P${paneIdx} 🦙 OLLAMA: state=${fResult.state} | ${fResult.context.slice(0, 60)}`);
                        resolve(fResult);
                    } catch (fe) {
                        // Ollama not running — resolve with safe default instead of rejecting
                        resolve({ state: 'unknown', context: 'Ollama parse fail', suggestion: '', error: null, progress: '0', blockers: [] });
                    }
                });
            });
            fallbackReq.on('error', () => {
                // Ollama not running — resolve with safe default (non-blocking)
                resolve({ state: 'unknown', context: 'Ollama offline', suggestion: '', error: null, progress: '0', blockers: [] });
            });

            // Format prompt for Ollama
            const ollamaPayload = JSON.stringify({
                model: 'qwen2', // Replace with local model if different
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT.trim() },
                    { role: 'user', content: `Pane: P${paneIdx} | Project: ${projectName}\n\n--- TERMINAL OUTPUT ---\n${trimmedOutput}\n--- END ---` }
                ],
                stream: false
            });
            fallbackReq.write(ollamaPayload);
            fallbackReq.end();
        };

        req.on('error', (e) => {
            log(`P${paneIdx} LLM [${getActiveProvider().name}] network error: ${e.message}`);
            rotateKey();
            attemptOllamaFallback();
        });

        req.on('timeout', () => {
            req.destroy();
            log(`P${paneIdx} LLM [${getActiveProvider().name}] timeout (${LLM_TIMEOUT_MS}ms)`);
            rotateKey();
            attemptOllamaFallback();
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
            // POWER COMMAND: /bootstrap:auto:parallel for maximum autonomous work
            if (perception.suggestion && perception.suggestion.length > 10) {
                return `/bootstrap:auto:parallel "${projectName}: ${perception.suggestion}"`;
            }
            return `/bootstrap:auto:parallel "${projectName}: Auto-scan codebase, fix tests, fix build errors, improve code quality, commit improvements."`;

        case 'complete':
            // Task just finished — launch next round immediately
            if (perception.suggestion && perception.suggestion.length > 10) {
                return `/bootstrap:auto:parallel "${projectName}: ${perception.suggestion}"`;
            }
            return `/bootstrap:auto:parallel "${projectName}: Continue improving — next highest-impact task from backlog."`;

        case 'stuck':
            return `/debug "GIẢI VÂY (${projectName}): ${perception.suggestion || 'Analyze state, identify blocker, fix.'}"`;

        case 'error':
            const errorCtx = perception.error || perception.context || 'unknown error';
            return `/debug "TRINH SÁT LỖI (${projectName}): Root cause analysis. ${errorCtx.slice(0, 100)}"`;

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

const TOKEN_BUDGET_PER_HOUR = 10; // Max LLM calls per pane per hour
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
            model: getActiveModel(),
            max_tokens: 512,
            messages: [
                { role: 'system', content: GUARD_PROMPT.trim() },
                { role: 'user', content: `regex_state: ${regexState}\nProject: ${projectName}\n\n${trimmed}` }
            ]
        });

        const url = new URL(getActiveUrl());
        const isHttps2 = url.protocol === 'https:';
        const transport2 = isHttps2 ? require('https') : http;
        const req = transport2.request({
            hostname: url.hostname,
            port: url.port || (isHttps2 ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
                'Authorization': `Bearer ${getActiveKey()}`
            },
            timeout: 30000,
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const rawContent = json.choices?.[0]?.message?.content || json.content?.find(c => c.type === 'text')?.text || '';
                    const cleaned = rawContent.replace(/```json\n?|\n?```/g, '').trim();
                    let result;
                    try {
                        result = JSON.parse(cleaned);
                    } catch (e) {
                        console.warn(`[llm-perception] GUARD JSON parse error for P${paneIdx}. RAW HTTP DATA:\n`, data.substring(0, 1000));
                        // For guardCheck, we resolve with a fallback on parse error, not reject.
                        resolve({ agree: true, correctedState: regexState, reason: 'parse fail (LLM output malformed)', shouldAct: true });
                        return;
                    }

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

        req.on('error', () => { rotateKey(); resolve({ agree: true, correctedState: regexState, reason: 'network fail', shouldAct: true }); });
        req.on('timeout', () => { req.destroy(); rotateKey(); resolve({ agree: true, correctedState: regexState, reason: 'timeout', shouldAct: true }); });
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
