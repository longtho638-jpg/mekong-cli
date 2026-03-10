/**
 * 🛡️ Safety Guard v2 — LLM-validated intent classification
 * 
 * TASK 6/22: CTO Brain Upgrade
 * 
 * Returns: SAFE | UNSAFE | NEEDS_CONFIRMATION
 * Uses fast classification model (<2s)
 * Loads Safety Constitution from config/safety-constitution.txt
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const CONSTITUTION_PATH = path.join(__dirname, '..', 'config', 'safety-constitution.txt');

function log(msg) {
    try {
        const { log: brainLog } = require('./brain-process-manager');
        brainLog(msg);
    } catch (e) {
        const ts = new Date().toISOString().slice(11, 19);
        const line = `[${ts}] [safety] ${msg}\n`;
        try { fs.appendFileSync(config.LOG_FILE, line); } catch (_) { }
    }
}

// ═══ Heuristic Danger Patterns (fast, no AI needed) ═══
const DANGER_PATTERNS = [
    { pattern: /rm\s+-rf\s+\//i, reason: 'Mass file deletion from root' },
    { pattern: /sudo\s+rm/i, reason: 'Privileged file deletion' },
    { pattern: /format\s+c:/i, reason: 'Disk formatting' },
    { pattern: /DROP\s+TABLE/i, reason: 'Database table deletion' },
    { pattern: /DELETE\s+FROM.*WHERE\s+1=1/i, reason: 'Mass database deletion' },
    { pattern: /eval\s*\(\s*atob/i, reason: 'Encoded code execution' },
    { pattern: /child_process.*exec.*(?:curl|wget)/i, reason: 'Remote code download + execution' },
    { pattern: /\.env.*cat|cat.*\.env/i, reason: 'Secret file reading' },
    { pattern: /curl.*-d.*(?:api\.key|token|secret)/i, reason: 'Secret exfiltration via curl' },
    { pattern: /CLAUDE\.md.*rm|rm.*CLAUDE\.md/i, reason: 'Core rules file deletion' },
    { pattern: /chmod\s+777\s+\//i, reason: 'Dangerous permission change' },
    { pattern: /mkfs\./i, reason: 'Filesystem format' },
    { pattern: /:(){ :\|:& };:/i, reason: 'Fork bomb' },
    { pattern: />\s*\/dev\/sd[a-z]/i, reason: 'Direct disk write' },
    { pattern: /dd\s+if=/i, reason: 'Low-level disk write via dd' },
    { pattern: /wget.*\|\s*(?:ba)?sh/i, reason: 'Pipe remote content to shell' },
    { pattern: /curl.*\|\s*(?:ba)?sh/i, reason: 'Pipe remote content to shell' },
];

// ═══ Confirmation-required patterns (not unsafe, but needs human review) ═══
const CONFIRM_PATTERNS = [
    { pattern: /npm\s+publish/i, reason: 'Publishing package to npm' },
    { pattern: /git\s+push.*--force/i, reason: 'Force push to git' },
    { pattern: /migration.*run|migrate.*production/i, reason: 'Database migration' },
    { pattern: /deploy.*production/i, reason: 'Production deployment' },
    { pattern: /API_KEY.*=|SECRET.*=/i, reason: 'Potentially modifying secrets' },
    { pattern: /rm\s+-rf\s+.*node_modules/i, reason: 'Large dependency deletion' },
];

let _constitutionCache = null;
let _constitutionMtime = 0;

/**
 * Load Safety Constitution from file (Cached with mtime check)
 */
function loadConstitution() {
    try {
        if (!fs.existsSync(CONSTITUTION_PATH)) return getDefaultConstitution();

        const stat = fs.statSync(CONSTITUTION_PATH);
        if (_constitutionCache && stat.mtimeMs === _constitutionMtime) {
            return _constitutionCache;
        }

        _constitutionCache = fs.readFileSync(CONSTITUTION_PATH, 'utf-8');
        _constitutionMtime = stat.mtimeMs;
        return _constitutionCache;
    } catch (e) { /* use default */ }
    return getDefaultConstitution();
}

function getDefaultConstitution() {
    return `BINH PHÁP SAFETY CONSTITUTION — 兵法安全憲章
You are the Safety Classifier for TÔM HÙM CTO system.
Your role is to classify task intent as SAFE, UNSAFE, or NEEDS_CONFIRMATION.

RULES:
1. No mass deletion of files without backup
2. No exfiltration of secrets (API keys, tokens, passwords)  
3. No modification of CLAUDE.md or core system rules
4. No execution of arbitrary binary code from untrusted sources
5. No fork bombs or resource exhaustion attacks
6. No direct disk writes or filesystem formatting
7. No force-push to production branches
8. No database drops without explicit backup
9. No publishing packages without review
10. No exposing internal network to public

Classification:
- SAFE: Normal coding, debugging, testing, documentation tasks
- UNSAFE: Violates any of the 10 rules above
- NEEDS_CONFIRMATION: Production deployments, migrations, publishing`;
}

/**
 * Check task safety — returns { status: 'SAFE'|'UNSAFE'|'NEEDS_CONFIRMATION', reason: string }
 */
async function checkSafety(content) {
    if (!content || typeof content !== 'string') return { status: 'SAFE', reason: 'empty' };

    // Phase 1: Heuristic check (instant, no AI)
    for (const { pattern, reason } of DANGER_PATTERNS) {
        if (pattern.test(content)) {
            log(`🚫 SAFETY HEURISTIC: UNSAFE — ${reason}`);
            return { status: 'UNSAFE', reason: `Heuristic: ${reason}` };
        }
    }

    // Phase 1b: Confirmation-required patterns
    for (const { pattern, reason } of CONFIRM_PATTERNS) {
        if (pattern.test(content)) {
            log(`⚠️ SAFETY: NEEDS_CONFIRMATION — ${reason}`);
            return { status: 'NEEDS_CONFIRMATION', reason };
        }
    }

    // Phase 2: Short/simple tasks — skip AI
    if (content.length < 300) return { status: 'SAFE', reason: 'short_task' };

    // Phase 3: LLM classification via direct API
    try {
        const constitution = loadConstitution();
        const API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
        const model = 'qwen-plus';

        const payload = {
            model,
            messages: [
                { role: 'system', content: constitution },
                {
                    role: 'user',
                    content: `Classify this task. Respond with ONLY one word (SAFE, UNSAFE, or NEEDS_CONFIRMATION) followed by a brief reason:\n\n${content.slice(0, 2000)}`
                }
            ],
            max_tokens: 100,
            temperature: 0,
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.DASHSCOPE_API_KEY || 'sk-sp-afce4429a10e41bb901d6012d7f525c8'}`
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            log(`Safety API ${response.status} — FAIL-SAFE: blocking`);
            return { status: 'NEEDS_CONFIRMATION', reason: 'api_error_failsafe' };
        }

        const data = await response.json();
        let content = data?.choices?.[0]?.message?.content || '';
        const answer = content.replace(/<thought>[\s\S]*?<\/thought>/g, '').trim();

        if (answer.startsWith('UNSAFE')) {
            log(`🚫 SAFETY AI: ${answer}`);
            return { status: 'UNSAFE', reason: answer };
        }
        if (answer.startsWith('NEEDS_CONFIRMATION')) {
            log(`⚠️ SAFETY AI: ${answer}`);
            return { status: 'NEEDS_CONFIRMATION', reason: answer };
        }

        return { status: 'SAFE', reason: 'ai_approved' };
    } catch (err) {
        log(`Safety check timeout/error — FAIL-SAFE: NEEDS_CONFIRMATION (${err.message})`);
        return { status: 'NEEDS_CONFIRMATION', reason: `failsafe: ${err.message}` };
    }
}

module.exports = { checkSafety, loadConstitution, DANGER_PATTERNS, CONFIRM_PATTERNS };
