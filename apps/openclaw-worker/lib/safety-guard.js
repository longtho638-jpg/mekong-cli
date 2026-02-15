/**
 * 🛡️ Safety Guard — Pre-flight content safety check
 * 
 * Validates task content BEFORE dispatching to CC CLI.
 * Uses the configured AI model to assess if a task is safe to process.
 * 
 * Checks for:
 * - Harmful/malicious code injection
 * - Dangerous system commands
 * - Tasks that could compromise security
 * 
 * Usage:
 *   const { checkSafety } = require('./safety-guard');
 *   const isSafe = await checkSafety(taskContent);
 */

const fs = require('fs');
const config = require('../config');

function log(msg) {
    try {
        const { log: brainLog } = require('./brain-tmux');
        brainLog(msg);
    } catch (e) {
        const ts = new Date().toISOString().slice(11, 19);
        const line = `[${ts}] [safety] ${msg}\n`;
        try { fs.appendFileSync(config.LOG_FILE, line); } catch (_) { }
    }
}

// Quick heuristic checks before calling AI
const DANGER_PATTERNS = [
    /rm\s+-rf\s+\//i,
    /sudo\s+rm/i,
    /format\s+c:/i,
    /DROP\s+TABLE/i,
    /DELETE\s+FROM.*WHERE\s+1=1/i,
    /eval\s*\(\s*atob/i,
    /child_process.*exec.*(?:curl|wget)/i,
];

async function checkSafety(content) {
    if (!content || typeof content !== 'string') return true;

    // Quick heuristic check first
    for (const pattern of DANGER_PATTERNS) {
        if (pattern.test(content)) {
            log(`⚠️ SAFETY: Blocked by heuristic pattern: ${pattern}`);
            return false;
        }
    }

    // For short, simple tasks — skip AI check
    if (content.length < 200) return true;

    try {
        const PROXY_URL = `${config.CLOUD_BRAIN_URL}/v1/chat/completions`;
        // 🛡️ PROXY_RULES: Use config model (prevents drift from PROXY_RULES.md)
        const model = config.FALLBACK_MODEL_NAME;

        const payload = {
            model: model,
            messages: [
                {
                    role: 'system',
                    content: 'You are a safety checker. Respond with ONLY "SAFE" or "UNSAFE" followed by a brief reason. Check if the following task could be harmful, contain malicious code, or compromise system security.'
                },
                {
                    role: 'user',
                    content: `Check this task for safety:\n${content.slice(0, 1000)}`
                }
            ],
            max_tokens: 50,
            temperature: 0,
        };

        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            log(`Safety API returned ${response.status} — defaulting to SAFE`);
            return true;
        }

        const data = await response.json();
        const answer = data?.choices?.[0]?.message?.content?.trim() || '';

        if (answer.startsWith('UNSAFE')) {
            log(`⚠️ SAFETY AI: ${answer}`);
            return false;
        }

        return true;
    } catch (err) {
        log(`Safety check error (defaulting SAFE): ${err.message}`);
        return true;
    }
}

module.exports = { checkSafety };
