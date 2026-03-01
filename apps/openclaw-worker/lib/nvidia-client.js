/**
 * 🎯 Daemon AI Client — AG Proxy Routing
 * 
 * 因糧於敵 — "Dùng lương thảo của giặc" (Ch.2 作戰)
 * 
 * All daemon AI calls route through AG Proxy (FREE Flash/Pro).
 * NEVER call NVIDIA/external APIs directly — violates PROXY_RULES §1.
 * 
 * Tiers:
 *   - TIER_1 (⚡ Flash):  Quick classification, safety, scanning
 *   - TIER_2 (⚡ Flash):  Code review, analysis, building  
 *   - TIER_3 (🧠 Pro):    Architecture, deep thinking, synthesis
 * 
 * Usage (daemon only):
 *   const ai = require('./lib/nvidia-client');
 *   const result = await ai.analyze(daemonName, code, prompt);
 */

const config = require('../config');

// ═══════════════════════════════════════════════════════════════
// Model Tiers — Mapped to AG Proxy models (因糧於敵)
// ═══════════════════════════════════════════════════════════════

const MODEL_TIERS = {
    TIER_1: 'qwen3-235b',     // ⚡ Fast scouts (Free NVIDIA 17 keys)
    TIER_2: 'qwen3-235b',     // 🔨 Core workers (Free NVIDIA 17 keys)
    TIER_3: 'gemini-3-pro-high',                                 // 🧠 Deep thinkers
};

// Daemon → Tier mapping (from DOANH_TRAI.md)
const DAEMON_TIERS = {
    // ⚔️ Tiền Đội
    'hunter': MODEL_TIERS.TIER_1,
    'dispatcher': MODEL_TIERS.TIER_1,
    'operator': MODEL_TIERS.TIER_1,
    // 🔨 Trung Quân
    'builder': MODEL_TIERS.TIER_2,
    'reviewer': MODEL_TIERS.TIER_2,
    'scribe': MODEL_TIERS.TIER_1,
    // 🎓 Hậu Cần
    'diplomat': MODEL_TIERS.TIER_1,
    'merchant': MODEL_TIERS.TIER_1,
    'artist': MODEL_TIERS.TIER_1,
    // 📚 Tham Mưu
    'architect': MODEL_TIERS.TIER_3,
    'sage': MODEL_TIERS.TIER_3,
};

// ═══════════════════════════════════════════════════════════════
// Rate Limiting (防 — per-daemon throttle)
// ═══════════════════════════════════════════════════════════════

const MIN_GAP_MS = config.API_RATE_GATE_MS || 0; // Nuclear Speed from PROXY_RULES
let lastCallTime = {};

function rateLimit(daemon) {
    if (MIN_GAP_MS === 0) return 0; // Nuclear Speed
    const now = Date.now();
    const last = lastCallTime[daemon] || 0;
    const gap = now - last;
    if (gap < MIN_GAP_MS) return MIN_GAP_MS - gap;
    lastCallTime[daemon] = now;
    return 0;
}

// ═══════════════════════════════════════════════════════════════
// AG Proxy Client (replaces NVIDIA direct call)
// ═══════════════════════════════════════════════════════════════

async function callProxy(model, messages, maxTokens = 1024) {
    const PROXY_URL = `${config.CLOUD_BRAIN_URL}/v1/chat/completions`;

    const payload = {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
        stream: false,
    };

    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`AG Proxy ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    return content;
}

// ═══════════════════════════════════════════════════════════════
// Public API (same interface — zero daemon changes needed)
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze code using AG Proxy (因糧於敵)
 * @param {string} daemon - Daemon name (determines model tier)
 * @param {string} code - Code to analyze
 * @param {string} prompt - Analysis prompt
 * @returns {Promise<{content: string, model: string, score?: number}>}
 */
async function analyze(daemon, code, prompt) {
    const model = DAEMON_TIERS[daemon] || MODEL_TIERS.TIER_1;

    // Rate limit
    const waitMs = rateLimit(daemon);
    if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
    }

    const messages = [
        {
            role: 'system',
            content: 'You are a code analysis expert. Provide concise, actionable feedback. Rate code quality 1-10 when asked.'
        },
        {
            role: 'user',
            content: `${prompt}\n\nCode:\n\`\`\`\n${code.slice(0, 4000)}\n\`\`\``
        }
    ];

    try {
        const content = await callProxy(model, messages, maxTokens = 1024);
        const scoreMatch = content.match(/(\d+)\s*\/\s*10/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : undefined;
        return { content, model, score };
    } catch (err) {
        // Fallback: TIER_3 → TIER_1
        if (model !== MODEL_TIERS.TIER_1) {
            try {
                const content = await callProxy(MODEL_TIERS.TIER_1, messages, 512);
                const scoreMatch = content.match(/(\d+)\s*\/\s*10/);
                const score = scoreMatch ? parseInt(scoreMatch[1]) : undefined;
                return { content, model: MODEL_TIERS.TIER_1, score };
            } catch (e) {
                throw new Error(`AG Proxy both tiers failed: ${err.message}, ${e.message}`);
            }
        }
        throw err;
    }
}

module.exports = {
    analyze,
    callProxy,
    MODEL_TIERS,
    DAEMON_TIERS,
};
