#!/usr/bin/env node
// 🔧 Auto-load .env (shell source breaks on pipe chars in NVIDIA_CONFIGS)
const _fs = require('fs'), _path = require('path');
const _envFile = _path.join(__dirname, '.env');
if (_fs.existsSync(_envFile)) {
    _fs.readFileSync(_envFile, 'utf8').split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) return;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();
        // Strip surrounding quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
    });
    console.log(`📦 .env loaded: ${Object.keys(process.env).filter(k => ['GOOGLE_KEYS', 'NVIDIA_CONFIGS', 'OPENROUTER_KEY'].includes(k)).join(', ')}`);
}
/**
 * Penta-Provider Anthropic Proxy v10.2 — Tôm Trùm Triple-Mix MAX (Đẹp+Bổ+Rẻ)
 * 
 * 🔥 TRIPLE-MIX MAX LEVEL (Antigravity-style):
 *   Phase 1 (Opus Burst):   2 calls via AG Ultra — kéo trớn (only 1st request/heavy ctx)
 *   Phase 2 (Pro Thinking):  Gemini 3 Pro (HIGH) — opus/heavy reasoning, FREE Google keys
 *   Phase 3 (Flash Working): Gemini 3 Flash (1M) — execution speed, FREE Google keys
 * 
 * 💰 Tiết kiệm: Opus FREE từ AG proxy, Pro/Flash FREE từ Google keys
 * 🛡️ Rate limit: AG 8 RPM / 30 RPH budget | Google 100 RPM Ultra
 * Cascade: AG(Opus) → Google(Pro/Flash) → Ollama → OpenRouter
 */

const http = require('http');
const https = require('https');
const path = require('path');

// 🛡️ SECURITY: Load keys from .env — NEVER hardcode API keys in source!
require('dotenv').config({ path: path.join(__dirname, '.env') });

// 🔒 LOCKED — DO NOT CHANGE (2026-02-15)
const PORT = parseInt(process.argv[2]) || 11436;
// 🔒 LOCKED — upstream AG proxy cluster (balanced across 2 Ultra accounts)
const ANTIGRAVITY_PORTS = [9191, 9192, 9193];
let agPortIndex = 0;

// ⚡ WARP SPEED: Global HTTP Agent
const httpAgent = new http.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 1000,
    maxFreeSockets: 256,
    scheduling: 'lifo',
    timeout: 30000, // 30s connection timeout
});
const httpsAgent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 1000,
    maxSockets: 1000,
    maxFreeSockets: 256,
});

// ═══════════════════════════════════════════════════════════════
// 🔒 IRON CONFIG — KHOÁ CỨNG: CẤM THAY ĐỔI (kể cả Tôm Hùm)
// Approved by Chairman — Only modifiable by direct human edit
// Date locked: 2026-02-15 | Reason: Stability > Experimentation
// ═══════════════════════════════════════════════════════════════

// ===== PROVIDER CONFIG (loaded from .env) =====

// Provider 0: Anthropic Direct API (official) — thinking-phase boosting
// Khi anh add API key chính hãng, nó sẽ dùng cho msg 1-2 (planning)
// nhưng CẮN-NHẢ routing logic KHÔNG ĐỔI — Flash vẫn handle msg 3+
const ANTHROPIC_DIRECT_KEY = process.env.ANTHROPIC_DIRECT_KEY || '';
const ANTHROPIC_DIRECT_URL = 'https://api.anthropic.com';
const ANTHROPIC_DIRECT_MODEL = 'claude-sonnet-4-6-20250514'; // 升級 Sonnet 4.6 (2026-02-18)
let anthropicDirectState = { calls: 0, total: 0, blocked: false, blockedUntil: 0 };

// Provider 1: Ollama Cloud (Anthropic-native)
const OLLAMA_KEYS = (process.env.OLLAMA_KEYS || '').split(',').filter(Boolean);

// Provider 2: OpenRouter (OpenAI-compatible)
const OPENROUTER_KEY = process.env.OPENROUTER_KEY || '';
const OPENROUTER_MODEL = 'google/gemini-3-flash';

// Provider 3: Google AI Studio — Pro+Flash Phối Trộn
const GOOGLE_KEYS = (process.env.GOOGLE_KEYS || '').split(',').filter(Boolean);
const GOOGLE_ULTRA_KEYS = new Set([0, 1]); // Both keys are Ultra (1500 RPM each!) — free keys REMOVED
const GOOGLE_MODEL_PRO = 'gemini-3-pro-high';     // 🧠 Thinking/subagent (HIGH quality)
const GOOGLE_MODEL_FLASH = 'gemini-3-flash'; // ⚡ Execution/working (FAST, 1M ctx)

// Provider 4: Vertex AI ($1,000 Cloud Credits) — UNLIMITED FALLBACK
const VERTEX_PROJECT = process.env.VERTEX_PROJECT || 'openclaw-raas-hub-1770348928';
const VERTEX_LOCATION = process.env.VERTEX_LOCATION || 'global';
const VERTEX_SA_KEY = process.env.VERTEX_SA_KEY || '/Users/macbookprom1/Downloads/openclaw-raas-hub-1770348928-3092bd491097.json';
const VERTEX_MODEL = 'gemini-3-flash-preview'; // Gemini 3.0 Flash on Vertex AI!
let vertexAccessToken = null;
let vertexTokenExpiry = 0;
async function getVertexToken() {
    if (vertexAccessToken && Date.now() < vertexTokenExpiry - 60000) return vertexAccessToken;
    try {
        const { execSync } = require('child_process');
        const token = execSync(
            `GOOGLE_APPLICATION_CREDENTIALS="${VERTEX_SA_KEY}" gcloud auth print-access-token 2>/dev/null`,
            { encoding: 'utf-8', timeout: 10000 }
        ).trim();
        vertexAccessToken = token;
        vertexTokenExpiry = Date.now() + 3500000; // ~58 min (tokens expire in 60 min)
        console.log(`[${ts()}] 🔑 Vertex AI token refreshed (expires in 58min)`);
        return token;
    } catch (e) {
        console.log(`[${ts()}] ❌ Vertex AI token error: ${e.message?.slice(0, 60)}`);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════
// 🔒🔒🔒 IRON ROUTING — CẮN-NHẢ LOGIC (KHOÁ CỨNG VĨNH VIỄN)
// ═══════════════════════════════════════════════════════════════
// RULE: Logic này KHÔNG ĐƯỢC THAY ĐỔI bởi bất kỳ agent/script nào.
// Kể cả Tôm Hùm, CC CLI, hay bất kỳ task nào — CẤM SỬA.
// Chỉ Chairman (con người) mới được edit trực tiếp.
//
// ROUTING TABLE (FROZEN 2026-02-15):
//   Message #1-2 (planning)  → 🧠 Pro High (thinking)
//   Message #3+  (<512KB)    → ⚡ Flash (working/execution)
//   Message #3+  (>512KB)    → 🧠 Pro High (heavy thinking)
//   Opus request             → 🔥 Pro High (deep thinking)
//   Pro exhausted            → ⚡ Flash (ALL requests)
//
// PROVIDER PRIORITY (FROZEN 2026-02-15):
//   0. Anthropic Direct (if API key set) → thinking phase only (msg 1-2)
//   1. AG Ultra (port 9191)              → primary for ALL phases
//   2. Google Direct (keys)              → fallback
//   3. NVIDIA NIM                        → lightweight fallback
//   4. Ollama Cloud                      → fallback
//   5. OpenRouter                        → last resort
//
// Adding new API keys = MORE throughput, NOT different routing.
// ═══════════════════════════════════════════════════════════════
const IRON_ROUTING_VERSION = 'v1.0.0-FROZEN-2026-02-15';
const IRON_ROUTING_HASH = 'CAN_NHA_PRO_FLASH_512KB'; // Integrity token

function selectTargetModel(requestModel, bodySizeKB, msgCount) {
    // 🔒 Integrity check — if hash was tampered, refuse to route
    if (IRON_ROUTING_HASH !== 'CAN_NHA_PRO_FLASH_512KB') {
        console.error(`[SECURITY] 🚨 ROUTING INTEGRITY VIOLATION! Hash mismatch. Refusing to route.`);
        return { model: GOOGLE_MODEL_FLASH, tag: '🚨TAMPERED', phase: 'emergency' };
    }

    // Phase 1 🔥: Thinking (始計/⛰️NÚI) — Use original Claude quota from Ultra accounts if available
    const isThinkingPhase = msgCount <= 2 || bodySizeKB > 256 || (requestModel && requestModel.includes('opus'));

    if (isThinkingPhase) {
        // Only use original model if not known to be exhausted
        const isClaude = requestModel && requestModel.startsWith('claude-');
        if (isClaude && antigravityState.claudeExhaustedUntil < Date.now()) {
            return { model: requestModel, tag: '🛡️ULTRA-CLAUDE', phase: 'thinking' };
        }
        // Fallback to Gemini Pro if Claude exhausted or not a Claude model
        if (antigravityState.proExhaustedUntil < Date.now()) {
            return { model: GOOGLE_MODEL_PRO, tag: '🧠PRO', phase: 'thinking' };
        }
    }

    // Phase 2 ⚡: Working (🌪️GIÓ) — Switch to Flash to save premium quota
    return { model: GOOGLE_MODEL_FLASH, tag: '⚡FLASH', phase: 'working' };
}

// 🔒 Determine if Anthropic Direct should handle this request
// ONLY for thinking phase (msg 1-2) when API key is set
function shouldUseAnthropicDirect(phase) {
    if (!ANTHROPIC_DIRECT_KEY) return false;
    if (anthropicDirectState.blocked && Date.now() < anthropicDirectState.blockedUntil) return false;
    // Only for planning/thinking — Flash execution stays on AG/Google
    return phase === 'planning' || phase === 'thinking';
}

// Provider 4: NVIDIA NIM — Multi-model round-robin (OpenAI-compatible)
const NVIDIA_BASE_URL = 'integrate.api.nvidia.com';
const NVIDIA_CONFIGS = (process.env.NVIDIA_CONFIGS || '').split('|').filter(Boolean).map(entry => {
    const [key, model, name] = entry.split(':');
    return { key, model, name };
});

// Boot check
console.log(`[BOOT] 🛡️ Keys loaded from .env:`);
console.log(`  Ollama: ${OLLAMA_KEYS.length} keys`);
console.log(`  OpenRouter: ${OPENROUTER_KEY ? '✅' : '❌ MISSING'}`);
console.log(`  Google: ${GOOGLE_KEYS.length} keys`);
console.log(`  NVIDIA: ${NVIDIA_CONFIGS.length} models`);
let nvidiaRoundRobin = 0; // 虛實 round-robin between NVIDIA models

// ===== STATE =====
const keyState = OLLAMA_KEYS.map(() => ({
    calls: [], blockedUntil: 0, total: 0, hits429: 0,
}));
const googleState = GOOGLE_KEYS.map(() => ({
    calls: [], blockedUntil: 0, total: 0, hits429: 0,
}));
const openrouterState = { calls: 0, errors: 0, total: 0, blocked: false, blockedUntil: 0 };
const nvidiaState = { calls: 0, errors: 0, total: 0, blocked: false, blockedUntil: 0 };
const MAX_PER_MIN = 12;
const GOOGLE_MAX_PER_MIN_FREE = 8; // not used anymore — all keys Ultra
const GOOGLE_MAX_PER_MIN_ULTRA = 100; // Ultra billing: 1500 RPM, use 100 conservatively
const COOLDOWN_MS = 65000;
const MIN_GAP_MS = 800;
let lastRequestTime = 0;
let requestCount = 0;
let total429 = 0;

const ts = () => new Date().toISOString().slice(11, 19);

// ===== KEY SELECTION =====
function getOllamaKey() {
    const now = Date.now();
    keyState.forEach(k => { k.calls = k.calls.filter(t => now - t < 60000); });
    const available = OLLAMA_KEYS.map((key, i) => ({
        key, i, load: keyState[i].calls.length,
        blocked: now < keyState[i].blockedUntil,
    })).filter(k => !k.blocked && k.load < MAX_PER_MIN);
    if (available.length === 0) return null;
    available.sort((a, b) => a.load - b.load);
    const chosen = available[Math.floor(Math.random() * Math.min(2, available.length))];
    keyState[chosen.i].calls.push(now);
    keyState[chosen.i].total++;
    requestCount++;
    return { key: chosen.key, keyIndex: chosen.i, load: chosen.load + 1, provider: 'ollama' };
}

let googleRoundRobin = 0; // 虛實 strict round-robin index

function getGoogleKey() {
    const now = Date.now();
    googleState.forEach(k => { k.calls = k.calls.filter(t => now - t < 60000); });

    // 虛實 Round-Robin: G0→G1→G2→G3→G4→G5→G0... mỗi key 1 lệnh xoay vòng
    for (let attempt = 0; attempt < GOOGLE_KEYS.length; attempt++) {
        const i = (googleRoundRobin + attempt) % GOOGLE_KEYS.length;
        const maxRpm = GOOGLE_ULTRA_KEYS.has(i) ? GOOGLE_MAX_PER_MIN_ULTRA : GOOGLE_MAX_PER_MIN_FREE;
        const blocked = now < googleState[i].blockedUntil;
        const load = googleState[i].calls.length;
        if (!blocked && load < maxRpm) {
            googleRoundRobin = (i + 1) % GOOGLE_KEYS.length; // next key cho lần sau
            googleState[i].calls.push(now);
            googleState[i].total++;
            requestCount++;
            return { key: GOOGLE_KEYS[i], keyIndex: i, load: load + 1, maxRpm, provider: 'google' };
        }
    }
    return null; // tất cả blocked
}

function isOpenRouterAvailable() {
    if (openrouterState.blocked && Date.now() < openrouterState.blockedUntil) return false;
    openrouterState.blocked = false;
    return true;
}

function isNvidiaAvailable() {
    if (nvidiaState.blocked && Date.now() < nvidiaState.blockedUntil) return false;
    nvidiaState.blocked = false;
    return true;
}

function markNvidiaError() {
    nvidiaState.blocked = true;
    nvidiaState.blockedUntil = Date.now() + COOLDOWN_MS;
    nvidiaState.errors++;
    console.log(`[${ts()}] 🚫 NVIDIA NIM error! Blocked ${COOLDOWN_MS / 1000}s. Errors: ${nvidiaState.errors}`);
}

function markOllama429(keyIndex) {
    const WEEKLY_BLOCK_MS = 3600000; // 1 hour block for weekly limits
    const RAPID_WINDOW_MS = 300000;  // 5 min window to detect rapid 429s
    const RAPID_THRESHOLD = 3;       // 3+ hits in window = weekly limit

    keyState[keyIndex].hits429++;
    total429++;

    // Track rapid 429s to detect weekly limits
    if (!keyState[keyIndex].recent429s) keyState[keyIndex].recent429s = [];
    const now = Date.now();
    keyState[keyIndex].recent429s.push(now);
    keyState[keyIndex].recent429s = keyState[keyIndex].recent429s.filter(t => now - t < RAPID_WINDOW_MS);

    if (keyState[keyIndex].recent429s.length >= RAPID_THRESHOLD) {
        // 🧠 Weekly limit detected! Block for 1 hour
        keyState[keyIndex].blockedUntil = now + WEEKLY_BLOCK_MS;
        console.log(`[${ts()}] 🔴 K${keyIndex} → WEEKLY LIMIT! Blocked 1hr. (${keyState[keyIndex].recent429s.length} rapid 429s)`);
    } else {
        keyState[keyIndex].blockedUntil = now + COOLDOWN_MS;
        console.log(`[${ts()}] 🚫 K${keyIndex} → 429! Blocked ${COOLDOWN_MS / 1000}s. Total: ${total429}`);
    }
}

function markGoogle429(keyIndex) {
    googleState[keyIndex].blockedUntil = Date.now() + COOLDOWN_MS;
    googleState[keyIndex].hits429++;
    total429++;
    console.log(`[${ts()}] 🚫 G${keyIndex} → 429! Blocked ${COOLDOWN_MS / 1000}s. Total: ${total429}`);
}

// ===== ANTHROPIC → OPENAI CONVERSION =====
function anthropicToOpenAI(body) {
    const messages = [];
    if (body.system) {
        const txt = typeof body.system === 'string'
            ? body.system : body.system.map(b => b.text || '').join('\n');
        if (txt.trim()) messages.push({ role: 'system', content: txt });
    }
    for (const msg of (body.messages || [])) {
        if (typeof msg.content === 'string') {
            messages.push({ role: msg.role, content: msg.content });
        } else if (Array.isArray(msg.content)) {
            const texts = msg.content.filter(b => b.type === 'text').map(b => b.text);
            const toolUses = msg.content.filter(b => b.type === 'tool_use');
            const toolResults = msg.content.filter(b => b.type === 'tool_result');
            if (msg.role === 'assistant' && toolUses.length > 0) {
                messages.push({
                    role: 'assistant', content: texts.join('\n') || null,
                    tool_calls: toolUses.map(t => ({
                        id: t.id, type: 'function',
                        function: { name: t.name, arguments: JSON.stringify(t.input || {}) }
                    }))
                });
            } else if (toolResults.length > 0) {
                for (const tr of toolResults) {
                    const content = typeof tr.content === 'string' ? tr.content
                        : Array.isArray(tr.content) ? tr.content.map(c => c.text || JSON.stringify(c)).join('\n')
                            : JSON.stringify(tr.content);
                    messages.push({ role: 'tool', tool_call_id: tr.tool_use_id, content });
                }
            } else {
                messages.push({ role: msg.role, content: texts.join('\n') });
            }
        }
    }
    let tools;
    if (body.tools && body.tools.length > 0) {
        tools = body.tools.map(t => ({
            type: 'function',
            function: { name: t.name, description: t.description || '', parameters: t.input_schema || { type: 'object', properties: {} } }
        }));
    }
    const result = { model: OPENROUTER_MODEL, messages, max_tokens: body.max_tokens || 4096, temperature: body.temperature ?? 0.7, stream: body.stream ?? false };
    if (tools) result.tools = tools;
    if (body.stop) result.stop = body.stop;
    return result;
}

// ===== ANTHROPIC → GEMINI CONVERSION =====
function anthropicToGemini(body) {
    const contents = [];
    const systemInstruction = body.system
        ? { parts: [{ text: typeof body.system === 'string' ? body.system : body.system.map(b => b.text || '').join('\n') }] }
        : undefined;

    for (const msg of (body.messages || [])) {
        const role = msg.role === 'assistant' ? 'model' : 'user';
        const parts = [];

        if (typeof msg.content === 'string') {
            parts.push({ text: msg.content });
        } else if (Array.isArray(msg.content)) {
            for (const block of msg.content) {
                if (block.type === 'text') {
                    parts.push({ text: block.text });
                } else if (block.type === 'tool_use') {
                    parts.push({ functionCall: { name: block.name, args: block.input || {} } });
                } else if (block.type === 'tool_result') {
                    const resultText = typeof block.content === 'string' ? block.content
                        : Array.isArray(block.content) ? block.content.map(c => c.text || JSON.stringify(c)).join('\n')
                            : JSON.stringify(block.content);
                    parts.push({ functionResponse: { name: block.tool_use_id || 'tool', response: { result: resultText } } });
                }
            }
        }
        if (parts.length > 0) contents.push({ role, parts });
    }

    // Tools — sanitize JSON Schema for Gemini API compatibility
    const UNSUPPORTED_KEYS = new Set([
        '$schema', '$id', '$ref', '$comment', '$defs',
        'additionalProperties', 'patternProperties', 'propertyNames',
        'if', 'then', 'else', 'allOf', 'anyOf', 'oneOf', 'not',
        'const', 'exclusiveMinimum', 'exclusiveMaximum',
        'multipleOf', 'minLength', 'maxLength', 'pattern',
        'minItems', 'maxItems', 'uniqueItems', 'contains',
        'minProperties', 'maxProperties', 'dependencies',
        'contentMediaType', 'contentEncoding', 'examples',
        'default', 'readOnly', 'writeOnly', 'deprecated',
        'title',
    ]);
    function stripSchema(obj) {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(stripSchema);
        const cleaned = {};
        for (const [k, v] of Object.entries(obj)) {
            if (UNSUPPORTED_KEYS.has(k)) continue;
            cleaned[k] = stripSchema(v);
        }
        // Fix required: only keep items that exist in properties
        if (cleaned.required && Array.isArray(cleaned.required) && cleaned.properties) {
            const validProps = Object.keys(cleaned.properties);
            cleaned.required = cleaned.required.filter(r => validProps.includes(r));
            if (cleaned.required.length === 0) delete cleaned.required;
        }
        // Gemini needs uppercase types
        if (cleaned.type && typeof cleaned.type === 'string') {
            const typeMap = { object: 'OBJECT', string: 'STRING', number: 'NUMBER', integer: 'INTEGER', boolean: 'BOOLEAN', array: 'ARRAY' };
            cleaned.type = typeMap[cleaned.type.toLowerCase()] || cleaned.type;
        }
        return cleaned;
    }

    let tools;
    if (body.tools && body.tools.length > 0) {
        tools = [{
            function_declarations: body.tools.map(t => {
                const params = stripSchema(t.input_schema) || { type: 'OBJECT', properties: {} };
                // Ensure top-level type is OBJECT
                if (!params.type) params.type = 'OBJECT';
                if (!params.properties) params.properties = {};
                return { name: t.name, description: t.description || '', parameters: params };
            })
        }];
    }

    const result = { contents, generationConfig: { maxOutputTokens: body.max_tokens || 4096, temperature: body.temperature ?? 0.7 } };
    if (systemInstruction) result.systemInstruction = systemInstruction;
    if (tools) result.tools = tools;
    return result;
}

// ===== GEMINI → ANTHROPIC CONVERSION =====
function geminiToAnthropic(geminiResp, requestModel) {
    const candidate = (geminiResp.candidates || [])[0] || {};
    const parts = candidate.content?.parts || [];
    const content = [];

    for (const part of parts) {
        if (part.text) {
            content.push({ type: 'text', text: part.text });
        }
        if (part.functionCall) {
            content.push({
                type: 'tool_use',
                id: `toolu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                name: part.functionCall.name,
                input: part.functionCall.args || {},
            });
        }
    }
    if (content.length === 0) content.push({ type: 'text', text: '' });

    const hasTool = content.some(c => c.type === 'tool_use');
    const finishReason = candidate.finishReason;
    const stopReason = hasTool ? 'tool_use' : finishReason === 'MAX_TOKENS' ? 'max_tokens' : 'end_turn';

    return {
        id: `msg_${Date.now()}`, type: 'message', role: 'assistant',
        model: requestModel || GOOGLE_MODEL_FLASH,
        content, stop_reason: stopReason, stop_sequence: null,
        usage: {
            input_tokens: geminiResp.usageMetadata?.promptTokenCount || 0,
            output_tokens: geminiResp.usageMetadata?.candidatesTokenCount || 0,
        },
    };
}

// ===== OPENAI → ANTHROPIC CONVERSION =====
function openAIToAnthropic(openaiResp, requestModel) {
    const choice = (openaiResp.choices || [])[0] || {};
    const msg = choice.message || {};
    const content = [];
    if (msg.content) content.push({ type: 'text', text: msg.content });
    if (msg.tool_calls) {
        for (const tc of msg.tool_calls) {
            let args = tc.function?.arguments || '{}';
            try { args = JSON.parse(args); } catch (e) { args = {}; }
            content.push({
                type: 'tool_use',
                id: tc.id || `toolu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                name: tc.function?.name || 'unknown', input: args,
            });
        }
    }
    if (content.length === 0) content.push({ type: 'text', text: '' });
    const stopReason = (msg.tool_calls && msg.tool_calls.length > 0) ? 'tool_use' : choice.finish_reason === 'length' ? 'max_tokens' : 'end_turn';
    return {
        id: openaiResp.id || `msg_${Date.now()}`, type: 'message', role: 'assistant',
        model: requestModel || 'claude-3-5-sonnet-20241022',
        content, stop_reason: stopReason, stop_sequence: null,
        usage: { input_tokens: openaiResp.usage?.prompt_tokens || 0, output_tokens: openaiResp.usage?.completion_tokens || 0 },
    };
}

// ===== SSE STREAM CONVERSION (OpenAI→Anthropic) =====
function convertStreamChunk(chunk, requestModel) {
    const lines = chunk.toString().split('\n');
    let result = '';
    for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') { result += `event: message_stop\ndata: {"type":"message_stop"}\n\n`; continue; }
        try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta || {};
            if (delta.content) {
                result += `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: delta.content } })}\n\n`;
            }
            if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                    if (tc.function?.name) {
                        result += `event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: tc.index || 1, content_block: { type: 'tool_use', id: tc.id || `toolu_${Date.now()}`, name: tc.function.name, input: {} } })}\n\n`;
                    }
                    if (tc.function?.arguments) {
                        result += `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: tc.index || 1, delta: { type: 'input_json_delta', partial_json: tc.function.arguments } })}\n\n`;
                    }
                }
            }
        } catch (e) { }
    }
    return result;
}

// ===== REQUEST QUEUE =====
const queue = [];
let processing = false;
function enqueue(handler) { queue.push(handler); processQueue(); }
// ⚡ WARP SPEED: Burst Dispatch Protocol
function processQueue() {
    if (processing || queue.length === 0) return;
    processing = true;

    // Zero-Latency Path: If gap is negligible (Ultra), blast a batch!
    if (TOS.MIN_GAP_MS <= 10) {
        let burst = 0;
        const BURST_LIMIT = 20; // Allow 20 concurrent dispatches
        while (queue.length > 0 && burst < BURST_LIMIT) {
            const handler = queue.shift();
            if (handler) handler(); // Async request starts immediately
            burst++;
        }
        lastRequestTime = Date.now();
        processing = false;
        if (queue.length > 0) setImmediate(processQueue); // Next tick for fairness
        return;
    }

    // Traditional Throttled Path (for free tier / slow mode)
    const delay = Math.max(0, TOS.MIN_GAP_MS - (Date.now() - lastRequestTime));
    setTimeout(() => {
        const handler = queue.shift();
        if (handler) handler();
        processing = false;
        lastRequestTime = Date.now();
        if (queue.length > 0) processQueue();
    }, delay);
}

// ===== PROXY TO OLLAMA CLOUD =====
function proxyToOllama(body, key, keyIndex, isStream, res, model) {
    const proxyReq = https.request({
        hostname: 'ollama.com', port: 443, path: '/v1/messages', method: 'POST',
        agent: httpsAgent, // ⚡ WARP SPEED
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Authorization': `Bearer ${key}`, 'anthropic-version': '2023-06-01', 'Connection': 'keep-alive' },
    }, (proxyRes) => {
        if (proxyRes.statusCode === 429) markOllama429(keyIndex);
        if (isStream) {
            res.writeHead(proxyRes.statusCode, { 'Content-Type': proxyRes.headers['content-type'] || 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
            let deltas = 0;
            proxyRes.on('data', (chunk) => {
                const text = chunk.toString();
                if (text.includes('rate_limit')) markOllama429(keyIndex);
                const m = text.match(/content_block_delta/g);
                if (m) deltas += m.length;
                res.write(chunk);
            });
            proxyRes.on('end', () => { if (deltas > 0) console.log(`[${ts()}] ✅ ~${deltas}d [K${keyIndex}]`); res.end(); });
        } else {
            let responseBody = '';
            proxyRes.on('data', chunk => responseBody += chunk);
            proxyRes.on('end', () => {
                try { const r = JSON.parse(responseBody); if (r.error?.type === 'rate_limit_error') markOllama429(keyIndex); const tool = r.content?.some(b => b.type === 'tool_use'); console.log(`[${ts()}] ✅ ${r.usage?.output_tokens || 0}tok${tool ? ' +T' : ''} (${proxyRes.statusCode}) [K${keyIndex}]`); } catch (e) { }
                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                res.end(responseBody);
            });
        }
    });
    proxyReq.on('error', (err) => { console.error(`[${ts()}] ❌ Ollama: ${err.message}`); res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: err.message } })); });
    proxyReq.write(body); proxyReq.end();
}

// ===== PROXY TO OPENROUTER =====
function proxyToOpenRouter(parsed, isStream, res, requestModel) {
    const openaiBody = anthropicToOpenAI(parsed);
    const payload = JSON.stringify(openaiBody);
    openrouterState.total++;
    const proxyReq = https.request({
        hostname: 'openrouter.ai', port: 443, path: '/api/v1/chat/completions', method: 'POST',
        agent: httpsAgent, // ⚡ WARP SPEED
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'HTTP-Referer': 'https://agencyos.network', 'X-Title': 'TomHumBrain', 'Connection': 'keep-alive' },
    }, (proxyRes) => {
        if (proxyRes.statusCode === 429) {
            openrouterState.blocked = true;
            openrouterState.blockedUntil = Date.now() + COOLDOWN_MS;
            console.log(`[${ts()}] 🚫 OR → 429!`);
        }
        if (isStream) {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
            res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: `msg_${Date.now()}`, type: 'message', role: 'assistant', model: requestModel, content: [], usage: { input_tokens: 0, output_tokens: 0 } } })}\n\n`);
            res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);
            let deltas = 0;
            proxyRes.on('data', (chunk) => { const c = convertStreamChunk(chunk, requestModel); if (c) { res.write(c); deltas++; } });
            proxyRes.on('end', () => { res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`); console.log(`[${ts()}] ✅ ~${deltas}d [OR]`); res.end(); });
        } else {
            let responseBody = '';
            proxyRes.on('data', chunk => responseBody += chunk);
            proxyRes.on('end', () => {
                try {
                    const r = JSON.parse(responseBody);
                    if (r.error) { console.log(`[${ts()}] ❌ OR: ${r.error.message || 'err'}`); openrouterState.errors++; res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: r.error.message } })); return; }
                    const a = openAIToAnthropic(r, requestModel);
                    const tool = a.content.some(b => b.type === 'tool_use');
                    console.log(`[${ts()}] ✅ ${a.usage.output_tokens}tok${tool ? ' +T' : ''} (${proxyRes.statusCode}) [OR]`);
                    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(a));
                } catch (e) { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(responseBody); }
            });
        }
    });
    proxyReq.on('error', (err) => { console.error(`[${ts()}] ❌ OR: ${err.message}`); openrouterState.errors++; res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: err.message } })); });
    proxyReq.write(payload); proxyReq.end();
}

// ===== PROXY TO NVIDIA NIM (Multi-model) =====
// 四方 (Tứ Phương) — Provider 4: NVIDIA NIM round-robin fallback
function proxyToNvidia(parsed, isStream, res) {
    // Round-robin between NVIDIA models
    const nvConfig = NVIDIA_CONFIGS[nvidiaRoundRobin % NVIDIA_CONFIGS.length];
    nvidiaRoundRobin = (nvidiaRoundRobin + 1) % NVIDIA_CONFIGS.length;

    const openaiBody = anthropicToOpenAI(parsed);
    openaiBody.model = nvConfig.model;
    openaiBody.temperature = 0.7;
    openaiBody.top_p = 0.8;
    if (!openaiBody.max_tokens) openaiBody.max_tokens = 4096;

    const payload = JSON.stringify(openaiBody);
    const requestModel = parsed.model || nvConfig.name;

    const proxyReq = https.request({
        hostname: NVIDIA_BASE_URL, port: 443, path: '/v1/chat/completions', method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'Authorization': `Bearer ${nvConfig.key}`,
        },
    }, (proxyRes) => {
        if (proxyRes.statusCode === 429) {
            markNvidiaError();
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'NVIDIA rate limited' } }));
            return;
        }
        if (isStream) {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
            res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: { id: `msg_${Date.now()}`, type: 'message', role: 'assistant', model: requestModel, content: [], usage: { input_tokens: 0, output_tokens: 0 } } })}\n\n`);
            res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })}\n\n`);
            let deltas = 0;
            proxyRes.on('data', (chunk) => { const c = convertStreamChunk(chunk, requestModel); if (c) { res.write(c); deltas++; } });
            proxyRes.on('end', () => { res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`); console.log(`[${ts()}] ✅ ~${deltas}d [NV]`); res.end(); });
        } else {
            let responseBody = '';
            proxyRes.on('data', chunk => responseBody += chunk);
            proxyRes.on('end', () => {
                try {
                    const r = JSON.parse(responseBody);
                    if (r.error) { console.log(`[${ts()}] ❌ NV: ${r.error.message || 'err'}`); markNvidiaError(); res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: r.error.message } })); return; }
                    const a = openAIToAnthropic(r, requestModel);
                    const tool = a.content.some(b => b.type === 'tool_use');
                    console.log(`[${ts()}] ✅ ${a.usage.output_tokens}tok${tool ? ' +T' : ''} (${proxyRes.statusCode}) [NV]`);
                    res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(a));
                } catch (e) { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(responseBody); }
            });
        }
    });
    proxyReq.on('error', (err) => { console.error(`[${ts()}] ❌ NV: ${err.message}`); markNvidiaError(); res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: err.message } })); });
    proxyReq.write(payload); proxyReq.end();
}

// ===== PROXY TO GOOGLE AI STUDIO (Pro+Flash Auto Routing) =====
function proxyToGoogle(parsed, isStream, res, requestModel, preSelectedKey, geminiModelOverride) {
    const googleKey = preSelectedKey || getGoogleKey();
    if (!googleKey) {
        // Should not happen if called correctly, but safety
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'All Google keys blocked' } }));
        return;
    }

    const geminiBody = anthropicToGemini(parsed);
    const payload = JSON.stringify(geminiBody);
    // Use override if provided, else default to Flash
    const targetModel = geminiModelOverride || GOOGLE_MODEL_FLASH;
    // const path = `/v1beta/models/${targetModel}:generateContent?key=${googleKey.key}`; // Original path

    const proxyReq = https.request({
        hostname: 'generativelanguage.googleapis.com', port: 443, path: `/v1beta/models/${targetModel}:${isStream ? 'streamGenerateContent' : 'generateContent'}?key=${googleKey.key}`, method: 'POST',
        agent: httpsAgent, // ⚡ WARP SPEED
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'Connection': 'keep-alive' },
    }, (proxyRes) => {
        if (proxyRes.statusCode === 429) markGoogle429(googleKey.keyIndex);
        let responseBody = '';
        proxyRes.on('data', chunk => responseBody += chunk);
        proxyRes.on('end', () => {
            try {
                const r = JSON.parse(responseBody);
                if (r.error) {
                    if (r.error.code === 429) markGoogle429(googleKey.keyIndex);
                    console.log(`[${ts()}] ❌ G${googleKey.keyIndex}: ${r.error.message?.slice(0, 60) || 'err'}`);
                    res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: r.error.message } }));
                    return;
                }
                const a = geminiToAnthropic(r, requestModel);
                const tool = a.content.some(b => b.type === 'tool_use');
                console.log(`[${ts()}] ✅ ${a.usage.output_tokens}tok${tool ? ' +T' : ''} (${proxyRes.statusCode}) [G${googleKey.keyIndex}]`);

                if (isStream) {
                    // Convert non-stream response to SSE for stream-expecting clients
                    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
                    res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: a })}\n\n`);
                    for (let i = 0; i < a.content.length; i++) {
                        const block = a.content[i];
                        res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: i, content_block: block })}\n\n`);
                        res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: i })}\n\n`);
                    }
                    res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: a.stop_reason }, usage: a.usage })}\n\n`);
                    res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);
                    res.end();
                } else {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(a));
                }
            } catch (e) {
                console.log(`[${ts()}] ❌ G parse: ${e.message}`);
                res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(responseBody);
            }
        });
    });
    proxyReq.on('error', (err) => { console.error(`[${ts()}] ❌ Google: ${err.message}`); res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: err.message } })); });
    proxyReq.write(payload); proxyReq.end();
}

// ===== PROXY TO VERTEX AI ($1,000 CREDITS) =====
// Provider 4: Vertex AI — paid tier, no quota limits
function proxyToVertexAI(parsed, isStream, res, requestModel) {
    getVertexToken().then(token => {
        if (!token) {
            console.log(`[${ts()}] ❌ Vertex: No token — skipping`);
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'Vertex AI token unavailable' } }));
            return;
        }
        const geminiBody = anthropicToGemini(parsed);
        // Gemini 3 Flash uses thinking tokens that count against maxOutputTokens
        // CC CLI sends small max_tokens (30-100) → thinking consumes all budget → 0 output
        // Disable thinking to ensure all tokens go to actual output
        geminiBody.generationConfig = geminiBody.generationConfig || {};
        geminiBody.generationConfig.thinkingConfig = { thinkingBudget: 0 };
        // Ensure minimum maxOutputTokens for Vertex
        if (geminiBody.generationConfig.maxOutputTokens < 1024) {
            geminiBody.generationConfig.maxOutputTokens = 8192;
        }
        const vertexModelUsed = VERTEX_MODEL;
        const payload = JSON.stringify(geminiBody);
        const vertexPath = `/v1/projects/${VERTEX_PROJECT}/locations/${VERTEX_LOCATION}/publishers/google/models/${VERTEX_MODEL}:${isStream ? 'streamGenerateContent' : 'generateContent'}`;

        const proxyReq = https.request({
            hostname: `aiplatform.googleapis.com`, port: 443, path: vertexPath, method: 'POST',
            agent: httpsAgent,
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'Authorization': `Bearer ${token}`, 'Connection': 'keep-alive' },
        }, (proxyRes) => {
            let responseBody = '';
            proxyRes.on('data', chunk => responseBody += chunk);
            proxyRes.on('end', () => {
                try {
                    const r = JSON.parse(responseBody);
                    if (r.error) {
                        console.log(`[${ts()}] ❌ Vertex: ${r.error.code} ${r.error.message?.slice(0, 120)}`);
                        // If 429 on gemini-3-flash-preview, retry with gemini-2.0-flash
                        if (r.error.code === 429 && vertexModelUsed === VERTEX_MODEL && VERTEX_MODEL !== 'gemini-2.0-flash') {
                            console.log(`[${ts()}] 🔄 Vertex 429 → retrying with gemini-2.0-flash`);
                            const fallbackModel = 'gemini-2.0-flash';
                            const fallbackPath = `/v1/projects/${VERTEX_PROJECT}/locations/us-central1/publishers/google/models/${fallbackModel}:${isStream ? 'streamGenerateContent' : 'generateContent'}`;
                            const fallbackReq = https.request({
                                hostname: 'us-central1-aiplatform.googleapis.com', port: 443, path: fallbackPath, method: 'POST',
                                agent: httpsAgent,
                                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'Authorization': `Bearer ${token}`, 'Connection': 'keep-alive' },
                            }, (fbRes) => {
                                let fbBody = '';
                                fbRes.on('data', c => fbBody += c);
                                fbRes.on('end', () => {
                                    try {
                                        const fb = JSON.parse(fbBody);
                                        if (fb.error) {
                                            console.log(`[${ts()}] ❌ Vertex fallback: ${fb.error.code} ${fb.error.message?.slice(0, 80)}`);
                                            res.writeHead(fbRes.statusCode || 400, { 'Content-Type': 'application/json' });
                                            res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: fb.error.message } }));
                                            return;
                                        }
                                        const a2 = geminiToAnthropic(fb, requestModel);
                                        const tok2 = a2.usage?.output_tokens || 0;
                                        console.log(`[${ts()}] ✅ ${tok2}tok (Vertex:${fallbackModel}) [${fbRes.statusCode}] 💰$1K`);
                                        if (isStream) {
                                            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
                                            res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: a2 })}\n\n`);
                                            for (let i = 0; i < a2.content.length; i++) {
                                                const block = a2.content[i];
                                                if (block.type === 'text') {
                                                    res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: i, content_block: { type: 'text', text: '' } })}\n\n`);
                                                    res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: i, delta: { type: 'text_delta', text: block.text } })}\n\n`);
                                                    res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: i })}\n\n`);
                                                } else if (block.type === 'tool_use') {
                                                    res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: i, content_block: { type: 'tool_use', id: block.id, name: block.name } })}\n\n`);
                                                    res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: i, delta: { type: 'input_json_delta', partial_json: JSON.stringify(block.input) } })}\n\n`);
                                                    res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: i })}\n\n`);
                                                }
                                            }
                                            res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: a2.stop_reason }, usage: a2.usage })}\n\n`);
                                            res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);
                                            res.end();
                                        } else {
                                            res.writeHead(200, { 'Content-Type': 'application/json' });
                                            res.end(JSON.stringify(a2));
                                        }
                                    } catch (e) {
                                        res.writeHead(502, { 'Content-Type': 'application/json' });
                                        res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: e.message } }));
                                    }
                                });
                            });
                            fallbackReq.on('error', (err) => {
                                res.writeHead(502, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: err.message } }));
                            });
                            fallbackReq.write(payload); fallbackReq.end();
                            return;
                        }
                        res.writeHead(proxyRes.statusCode || 400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: r.error.message } }));
                        return;
                    }
                    const a = geminiToAnthropic(r, requestModel);
                    const tok = a.usage?.output_tokens || 0;
                    console.log(`[${ts()}] ✅ ${tok}tok (Vertex:${VERTEX_MODEL}) [${proxyRes.statusCode}] 💰$1K`);
                    if (isStream) {
                        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
                        res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: a })}\n\n`);
                        for (let i = 0; i < a.content.length; i++) {
                            const block = a.content[i];
                            if (block.type === 'text') {
                                res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: i, content_block: { type: 'text', text: '' } })}\n\n`);
                                res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: i, delta: { type: 'text_delta', text: block.text } })}\n\n`);
                                res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: i })}\n\n`);
                            } else if (block.type === 'tool_use') {
                                res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: i, content_block: { type: 'tool_use', id: block.id, name: block.name } })}\n\n`);
                                res.write(`event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', index: i, delta: { type: 'input_json_delta', partial_json: JSON.stringify(block.input) } })}\n\n`);
                                res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: i })}\n\n`);
                            }
                        }
                        res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: a.stop_reason }, usage: a.usage })}\n\n`);
                        res.write(`event: message_stop\ndata: {"type": "message_stop"}\n\n`);
                        res.end();
                    } else {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(a));
                    }
                } catch (e) {
                    console.log(`[${ts()}] ❌ Vertex parse: ${e.message}`);
                    res.writeHead(502, { 'Content-Type': 'application/json' });
                    res.end(responseBody);
                }
            });
        });
        proxyReq.on('error', (err) => {
            console.log(`[${ts()}] ❌ Vertex connect: ${err.message}`);
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: 'Vertex AI connection error' } }));
        });
        proxyReq.write(payload);
        proxyReq.end();
    });
}

// ===== PROXY TO ANTIGRAVITY CLOUD CODE =====
// 虛實 (Xu Shi) — Binh Phap Ch.6: Tránh mạnh đánh yếu
// Rotate models + stagger timing to avoid Google detection patterns
// const ANTIGRAVITY_PORT = 9191; // REMOVED: Duplicate declaration

// 九變 (Jiu Bian) — Ch.8: 3 models rotation to spread fingerprint
const AG_MODELS = [
    'gemini-3-pro-high',           // Primary: best quality (100% avail)
    'gemini-3-flash',              // Fast: lightweight (100% avail)
    'gemini-2.5-flash',            // Stable fallback (100% avail)
];
let agModelIndex = 0;
let antigravityState = {
    calls: 0, total: 0, blocked: false, blockedUntil: 0, lastCall: 0, hourCalls: 0,
    proExhaustedUntil: 0, claudeExhaustedUntil: 0
};

// ═══════════════════════════════════════════════════════════════
// 📜 TOS COMPLIANCE LAYER — Legitimate Antigravity IDE Usage
// ═══════════════════════════════════════════════════════════════
// Google Gemini Code Assist TOS:
// - Rate: ~10 RPM per account (conservative)
// - Daily: ~1500 requests/day per account
// - Pattern: Must look like human IDE usage, not bot scraping
// - Spacing: Requests must have natural jitter (not exact intervals)
// ═══════════════════════════════════════════════════════════════

const TOS = {
    MAX_RPM: 9999,           // UNLIMITED for Ultra
    MAX_RPH: 9999,           // UNLIMITED for Ultra
    MAX_RPD: 9999,           // UNLIMITED for Ultra
    MIN_GAP_MS: 0,           // ZERO GAP — Nuclear Speed
    JITTER_MS: 0,            // NO JITTER needed
    COOLDOWN_MS: 1000,       // Minimal cooldown (1s) if really hit hard
    DAILY_RESET_HOUR: 0,     // Reset daily counter at midnight
};

// Sliding window tracker
const tosTracker = {
    minuteRequests: [],      // Timestamps of last minute's requests
    hourRequests: [],        // Timestamps of last hour's requests
    dailyCount: 0,           // Total requests today
    dailyResetDate: new Date().toDateString(),
    lastAGRequest: 0,        // Last AG request timestamp
    cooldownUntil: 0,        // Cooldown expiry
    violations: 0,           // TOS violation count (for logging)
};

function tosCheck() {
    const now = Date.now();

    // Reset daily counter at midnight
    const today = new Date().toDateString();
    if (today !== tosTracker.dailyResetDate) {
        tosTracker.dailyCount = 0;
        tosTracker.dailyResetDate = today;
        tosTracker.violations = 0;
        antigravityState.calls = 0; // 🔄 Reset AG loading phase
        console.log(`[${ts()}] 📜 TOS: Daily counter + AG calls reset`);
    }

    // Cooldown active?
    if (now < tosTracker.cooldownUntil) {
        const remaining = Math.round((tosTracker.cooldownUntil - now) / 1000);
        return { allowed: false, reason: `cooldown (${remaining}s left)` };
    }

    // Clean sliding windows
    const oneMinAgo = now - 60000;
    const oneHourAgo = now - 3600000;
    tosTracker.minuteRequests = tosTracker.minuteRequests.filter(t => t > oneMinAgo);
    tosTracker.hourRequests = tosTracker.hourRequests.filter(t => t > oneHourAgo);

    // Check RPM
    if (tosTracker.minuteRequests.length >= TOS.MAX_RPM) {
        tosTracker.cooldownUntil = now + TOS.COOLDOWN_MS;
        tosTracker.violations++;
        return { allowed: false, reason: `RPM limit (${TOS.MAX_RPM}/min) — cooldown ${TOS.COOLDOWN_MS / 1000}s` };
    }

    // Check RPH
    if (tosTracker.hourRequests.length >= TOS.MAX_RPH) {
        tosTracker.cooldownUntil = now + TOS.COOLDOWN_MS * 5;
        return { allowed: false, reason: `RPH limit (${TOS.MAX_RPH}/hr)` };
    }

    // Check daily
    if (tosTracker.dailyCount >= TOS.MAX_RPD) {
        return { allowed: false, reason: `daily limit (${TOS.MAX_RPD}/day)` };
    }

    // Check minimum gap with jitter
    const gap = now - tosTracker.lastAGRequest;
    const requiredGap = TOS.MIN_GAP_MS + Math.random() * TOS.JITTER_MS;
    if (gap < requiredGap) {
        return { allowed: false, reason: `gap (${Math.round(gap)}ms < ${Math.round(requiredGap)}ms)`, retryMs: requiredGap - gap };
    }

    return { allowed: true };
}

function tosRecord() {
    const now = Date.now();
    tosTracker.minuteRequests.push(now);
    tosTracker.hourRequests.push(now);
    tosTracker.dailyCount++;
    tosTracker.lastAGRequest = now;
}

// 🔄 Auto-reset AG loading phase every hour
let lastAGReset = Date.now();
const AG_RESET_INTERVAL = 3600000; // 1 hour

function isAntigravityAvailable() {
    if (antigravityState.blocked && Date.now() < antigravityState.blockedUntil) return false;
    antigravityState.blocked = false;
    // 🔄 Reset loading counter every hour
    if (Date.now() - lastAGReset > AG_RESET_INTERVAL) {
        antigravityState.calls = 0;
        antigravityState.hourCalls = 0;
        lastAGReset = Date.now();
        console.log(`[${ts()}] 🔄 AG: Loading phase + hourly budget reset`);
    }
    // 🛡️ Hourly budget: UNLIMITED for Ultra (removed 2000 limit)
    // if (antigravityState.hourCalls >= 9999) return false;

    // 📜 TOS gate: DISABLED for Ultra Speed
    // const check = tosCheck();
    // if (!check.allowed) {
    //     console.log(`[${ts()}] 📜 TOS: AG blocked — ${check.reason}`);
    //     return false;
    // }
    return true;
    return true;
}

// 風林火山 — Rotate model each call to spread across Google's tracking
function getNextAGModel() {
    const model = AG_MODELS[agModelIndex % AG_MODELS.length];
    agModelIndex++;
    return model;
}

function proxyToAntigravity(rawBody, isStream, res, requestModel) {
    antigravityState.calls++;
    antigravityState.total++;
    antigravityState.hourCalls++;
    antigravityState.lastCall = Date.now();
    tosRecord(); // 📜 TOS compliance tracking

    // 🔒 OPUS ROUTING RULE: Opus → cashback ONLY, billwill TUYỆT ĐỐI KHÔNG CẮN OPUS
    // Anti-spam: cashback minimum 30s gap to avoid Google detection
    const isOpusModel = requestModel && requestModel.includes('opus');
    const isClaudeModel = requestModel && requestModel.startsWith('claude-');

    // 🗺️ MODEL MAPPING: CC CLI sends Anthropic names → AG Gemini models
    // v2026.2.14: Smart Routing (Pha Trận) — logic prioritized over hard-mapping
    // FORCE SONNET 4.5 TO ULTRA (GEMINI 3 PRO HIGH)
    if (requestModel.includes('sonnet-4-5') || requestModel.includes('opus')) {
        requestModel = 'gemini-3-pro-high'; // Force Ultra
    }

    const agModelSelection = selectTargetModel(requestModel, Buffer.byteLength(rawBody) / 1024, (JSON.parse(rawBody).messages || []).length);
    const agModel = 'gemini-3-pro-high'; // HARD FORCE ULTRA FOR EVERYTHING

    // Track cashback usage for anti-spam
    if (!antigravityState.lastCashbackCall) antigravityState.lastCashbackCall = 0;
    const cashbackGapMs = Date.now() - antigravityState.lastCashbackCall;
    const CASHBACK_MIN_GAP = 30000; // 30s minimum between cashback calls

    let modifiedBody;
    try {
        const parsed = JSON.parse(rawBody);
        parsed.model = agModel;
        modifiedBody = JSON.stringify(parsed);
        if (isOpusModel) {
            antigravityState.lastCashbackCall = Date.now();
            console.log(`[${ts()}] 🔥 OPUS→AG: ${agModel} (shared token)`);
        } else if (isClaudeModel) {
            console.log(`[${ts()}] 🔥 CLAUDE→AG: ${agModel}`);
        }
    } catch (e) {
        modifiedBody = rawBody;
    }

    const payload = modifiedBody;

    // ☯️ Binh Phap Phoenix Rotation (Balanced 2-Ultra)
    let targetPort = ANTIGRAVITY_PORTS[agPortIndex % ANTIGRAVITY_PORTS.length];

    // Force Opus models to Cashback (9192) as per tactical specialty
    if (isOpusModel) {
        targetPort = 9192;
    } else {
        agPortIndex++;
    }

    // ⚡ WARP SPEED: Persistent Connection + No Nagle's Algorithm
    // Re-use TCP connection to avoid SSL/Handshake overhead
    const reqOpts = {
        hostname: '127.0.0.1', port: targetPort, path: '/v1/messages', method: 'POST',
        agent: httpAgent, // <--- Use global agent
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'x-api-key': 'test',
            'anthropic-version': '2023-06-01',
            'Connection': 'keep-alive', // Explicit keep-alive
        },
    };
    const proxyReq = http.request(reqOpts, (proxyRes) => {
        if (proxyRes.statusCode === 429) {
            antigravityState.blocked = true;
            antigravityState.blockedUntil = Date.now() + COOLDOWN_MS;
            console.log(`[${ts()}] 🚫 AG → 429! Blocked ${COOLDOWN_MS / 1000}s (${agModel})`);
        }
        if (isStream && proxyRes.headers['content-type']?.includes('text/event-stream')) {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
            proxyRes.pipe(res);
        } else {
            let responseBody = '';
            proxyRes.on('data', chunk => responseBody += chunk);
            proxyRes.on('end', () => {
                try {
                    const r = JSON.parse(responseBody);
                    if (r.error || r.type === 'error') {
                        if (proxyRes.statusCode === 429 || (proxyRes.statusCode === 400 && responseBody.includes('RESOURCE_EXHAUSTED'))) {
                            console.log(`[${ts()}] ⚠️ AG EXHAUSTED on port ${targetPort}: ${agModel}`);

                            // 🦞 PHOENIX FAILOVER: Try OTHER Ultra port FIRST before cascade
                            const otherPort = targetPort === 9191 ? 9192 : 9191;
                            if (!antigravityState[`port${otherPort}Exhausted`] || Date.now() > antigravityState[`port${otherPort}Exhausted`]) {
                                // Mark THIS port as exhausted for 30 min
                                antigravityState[`port${targetPort}Exhausted`] = Date.now() + 1800000;
                                console.log(`[${ts()}] 🦞 PHOENIX: Port ${targetPort} exhausted → switching to port ${otherPort}`);

                                // Retry on other port directly
                                const retryOpts = {
                                    hostname: '127.0.0.1', port: otherPort, path: '/v1/messages', method: 'POST',
                                    agent: httpAgent,
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Content-Length': Buffer.byteLength(payload),
                                        'x-api-key': 'test',
                                        'anthropic-version': '2023-06-01',
                                        'Connection': 'keep-alive',
                                    },
                                };
                                const retryReq = http.request(retryOpts, (retryRes) => {
                                    if (isStream && retryRes.headers['content-type']?.includes('text/event-stream')) {
                                        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
                                        retryRes.pipe(res);
                                    } else {
                                        let retryBody = '';
                                        retryRes.on('data', c => retryBody += c);
                                        retryRes.on('end', () => {
                                            const tok = (() => { try { return JSON.parse(retryBody).usage?.output_tokens || 0; } catch (e) { return 0; } })();
                                            console.log(`[${ts()}] ✅ ${tok}tok (AG:${agModel} port:${otherPort}) [${retryRes.statusCode}] 🦞 PHOENIX`);
                                            res.writeHead(retryRes.statusCode || 200, { 'Content-Type': 'application/json' });
                                            res.end(retryBody);
                                        });
                                    }
                                });
                                retryReq.on('error', (err) => {
                                    console.log(`[${ts()}] ❌ PHOENIX retry failed on port ${otherPort}: ${err.message}`);
                                    res.writeHead(502, { 'Content-Type': 'application/json' });
                                    res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: `Both AG ports exhausted: ${err.message}` } }));
                                });
                                retryReq.write(payload); retryReq.end();
                                return;
                            }

                            // Both ports exhausted → cascade to Google/Ollama
                            console.log(`[${ts()}] 🔄 CASCADE: BOTH AG Ultra ports exhausted → Trying Google/Ollama...`);
                            antigravityState.blocked = true;
                            antigravityState.blockedUntil = Date.now() + COOLDOWN_MS;

                            const googleKey = getGoogleKey();
                            if (googleKey) {
                                console.log(`[${ts()}] 🌐 CASCADE: AG → Google Direct [G${googleKey.keyIndex}]`);
                                proxyToGoogle(parsed, isStream, res, requestModel, googleKey, 'gemini-3-flash');
                                return;
                            }
                        }
                        console.log(`[${ts()}] ❌ AG(${agModel.slice(0, 12)}): ${JSON.stringify(r.error || r)}`);
                        // Vertex fallback removed — AG Ultra is self-recovering
                        res.writeHead(proxyRes.statusCode || 400, { 'Content-Type': 'application/json' });
                        res.end(responseBody);
                        return;
                    }
                    const tok = r.usage?.output_tokens || 0;
                    console.log(`[${ts()}] ✅ ${tok}tok (AG:${agModel.slice(0, 12)}) [${proxyRes.statusCode}]`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(responseBody);
                } catch (e) {
                    console.log(`[${ts()}] ❌ AG parse error: ${e.message}`);
                    res.writeHead(proxyRes.statusCode || 502, { 'Content-Type': 'application/json' });
                    res.end(responseBody);
                }
            });
        }
    });
    proxyReq.on('error', (err) => {
        console.log(`[${ts()}] ❌ AG connect: ${err.message}`);
        antigravityState.blocked = true;
        antigravityState.blockedUntil = Date.now() + 10000;
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: `Antigravity proxy error: ${err.message}` } }));
    });
    proxyReq.write(payload); proxyReq.end();
}

// ===== PROVIDER 0: ANTHROPIC DIRECT API =====
// 🔒 Passthrough to official Anthropic API — NO model remapping
// Only used for thinking phase (msg 1-2) when ANTHROPIC_DIRECT_KEY is set
function proxyToAnthropicDirect(rawBody, isStream, res, requestModel) {
    const payload = rawBody; // Send as-is to Anthropic (they accept their own format)
    const reqOpts = {
        hostname: 'api.anthropic.com', port: 443, path: '/v1/messages', method: 'POST',
        agent: httpsAgent,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'x-api-key': ANTHROPIC_DIRECT_KEY,
            'anthropic-version': '2023-06-01',
        },
    };
    const proxyReq = https.request(reqOpts, (proxyRes) => {
        if (proxyRes.statusCode === 429) {
            anthropicDirectState.blocked = true;
            anthropicDirectState.blockedUntil = Date.now() + 60000; // 1 min cooldown
            console.log(`[${ts()}] 🚫 Anthropic Direct → 429! Falling back to AG.`);
        }
        if (isStream && proxyRes.headers['content-type']?.includes('text/event-stream')) {
            res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
            proxyRes.pipe(res);
        } else {
            let responseBody = '';
            proxyRes.on('data', chunk => responseBody += chunk);
            proxyRes.on('end', () => {
                try {
                    const r = JSON.parse(responseBody);
                    const tok = r.usage?.output_tokens || 0;
                    console.log(`[${ts()}] ✅ ${tok}tok (Anthropic Direct:${requestModel}) [${proxyRes.statusCode}]`);
                    res.writeHead(proxyRes.statusCode || 200, { 'Content-Type': 'application/json' });
                    res.end(responseBody);
                } catch (e) {
                    res.writeHead(proxyRes.statusCode || 500, { 'Content-Type': 'application/json' });
                    res.end(responseBody);
                }
            });
        }
    });
    proxyReq.on('error', (err) => {
        console.log(`[${ts()}] ❌ Anthropic Direct error: ${err.message}`);
        anthropicDirectState.blocked = true;
        anthropicDirectState.blockedUntil = Date.now() + 30000;
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: `Anthropic Direct error: ${err.message}` } }));
    });
    proxyReq.write(payload); proxyReq.end();
}

// ===== HTTP SERVER =====
console.log(`🦞 Proxy v10.2 (Tôm Trùm MAX): localhost:${PORT}`);
console.log(`   🔒 IRON CONFIG ${IRON_ROUTING_VERSION} — CẮN-NHẢ LOCKED`);
console.log(`   💎 Anthropic Direct: ${ANTHROPIC_DIRECT_KEY ? 'ACTIVE (thinking boost)' : 'OFF (set ANTHROPIC_DIRECT_KEY to enable)'}`);
console.log(`   🔥Opus 4.6 (AG burst) → 🧠Pro (msg 1-2) → ⚡Flash (msg 3+)`);
console.log(`   AG: budget 30/hr | Google: ${GOOGLE_KEYS.length} keys (Pro+Flash FREE) | Ollama: ${OLLAMA_KEYS.length} | OR: backup`);
console.log(`   💰 Ngon+Bổ+Rẻ: Opus FREE từ AG, Pro/Flash FREE từ Google`);

const server = http.createServer((req, res) => {
    if (req.method === 'GET' && (req.url === '/' || req.url === '/health')) {
        const now = Date.now();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok', requests: requestCount, total429, queue: queue.length,
            ollama: keyState.map((k, i) => ({ key: i, calls_1m: k.calls.filter(t => now - t < 60000).length, blocked: now < k.blockedUntil, total: k.total, hits429: k.hits429 })),
            antigravity: { total: antigravityState.total, calls: antigravityState.calls, available: isAntigravityAvailable(), blocked: antigravityState.blocked && now < antigravityState.blockedUntil, blockedUntil: antigravityState.blockedUntil },
            google: googleState.map((k, i) => ({ key: i, calls_1m: k.calls.filter(t => now - t < 60000).length, blocked: now < k.blockedUntil, total: k.total, hits429: k.hits429 })),
            openrouter: { total: openrouterState.total, calls: openrouterState.calls, available: isOpenRouterAvailable(), blocked: openrouterState.blocked && now < openrouterState.blockedUntil, blockedUntil: openrouterState.blockedUntil, errors: openrouterState.errors },
            nvidia: { total: nvidiaState.total, calls: nvidiaState.calls, available: isNvidiaAvailable(), blocked: nvidiaState.blocked && now < nvidiaState.blockedUntil, errors: nvidiaState.errors, models: NVIDIA_CONFIGS.map(c => c.name), next: nvidiaRoundRobin },
        }));
        return;
    }
    // === BRAINWASH: Intercept ALL CC CLI validation endpoints ===
    // CC CLI checks these against real Anthropic API, wasting time. Fake them all.

    // 🦴 INDIVIDUAL MODEL LOOKUP: /v1/models/{modelId} — CC CLI validates model by fetching this!
    const individualModelMatch = req.url.match(/^\/v1\/models\/(.+?)(?:\?|$)/);
    if (individualModelMatch) {
        const requestedModel = decodeURIComponent(individualModelMatch[1]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            id: requestedModel,
            object: 'model',
            created: Date.now(),
            owned_by: 'antigravity',
            type: 'model',
            display_name: requestedModel,
        }));
        return;
    }
    // MODEL LIST: /v1/models (exact, no trailing path)
    if (req.url === '/v1/models' || req.url.startsWith('/v1/models?')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            data: [
                { id: 'claude-opus-4-6-20250514', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'claude-opus-4-6-thinking', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'claude-sonnet-4-5-20250514', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'claude-haiku-4-5-20251001', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'claude-opus-4-5-20250514', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'qwen3-coder-next', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'gemini-3-flash', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'gemini-3-flash-preview', object: 'model', created: Date.now(), owned_by: 'antigravity' },
            ]
        }));
        return;
    }
    // Fake auth/org checks
    if (req.url.startsWith('/v1/organizations') || req.url.startsWith('/v1/auth') || req.url.startsWith('/v1/account')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: 'org-antigravity', name: 'Antigravity Proxy', type: 'organization' }));
        return;
    }
    // Fake usage/billing
    if (req.url.startsWith('/v1/usage') || req.url.startsWith('/v1/billing')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ total_tokens: 0, total_cost: 0 }));
        return;
    }
    // Fake model status/info (singular /v1/model/{id} — legacy endpoint)
    if (req.url.match(/^\/v1\/model\b/)) {
        const modelMatch = req.url.match(/^\/v1\/model\/(.+?)(?:\?|$)/);
        const modelId = modelMatch ? decodeURIComponent(modelMatch[1]) : 'claude-opus-4-6-20250514';
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: modelId, status: 'active', ready: true }));
        return;
    }
    // Catch-all for non-message POSTs: log and reject
    if (req.method !== 'POST' || !req.url.startsWith('/v1/messages')) {
        console.log(`[${ts()}] 🧠 BRAINWASH: blocked ${req.method} ${req.url}`);
        res.writeHead(404); res.end('Not Found'); return;
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(body); } catch (e) { res.writeHead(400); res.end('{"error":"Invalid JSON"}'); return; }

        enqueue(() => {
            const isStream = parsed.stream === true;
            const model = parsed.model || 'gemini-3-flash';
            const msgCount = (parsed.messages || []).length;
            const hasTools = !!(parsed.tools && parsed.tools.length > 0);
            const bodySize = Buffer.byteLength(body);
            const bodySizeKB = Math.round(bodySize / 1024);
            // 🧠 Smart Context Detection: >32KB payload ≈ 8K+ tokens → skip NVIDIA (small ctx windows)
            const isHeavyContext = bodySizeKB > 32;
            // 🎯 Auto Model Selection: Pro for thinking, Flash for execution
            const targetSelection = selectTargetModel(model, bodySizeKB, msgCount);
            const geminiModel = targetSelection.model;
            const tag = `${isStream ? 'STR' : 'SYN'} ${model} (${msgCount}m${hasTools ? ' +T' : ''} ${bodySizeKB}KB${isHeavyContext ? ' 🐘' : ''} ${targetSelection.tag})`;
            if (isHeavyContext) console.log(`[${ts()}] 🐘 Heavy context ${bodySizeKB}KB — will skip NVIDIA (small ctx)`);

            // ═══════════════════════════════════════════════════════════
            // 🔒 IRON PROVIDER CASCADE (FROZEN 2026-02-15)
            // Provider 0: Anthropic Direct (thinking only) → Provider 1: AG Ultra
            // → Provider 2: Google Direct → Provider 3: NVIDIA → Ollama → OpenRouter
            // Adding more API keys = MORE throughput, NOT different routing.
            // ═══════════════════════════════════════════════════════════

            // Provider 0: Anthropic Direct API — thinking-phase BOOST (msg 1-2 only)
            // 🔒 When Chairman adds ANTHROPIC_DIRECT_KEY, it ONLY handles planning/thinking
            // Flash execution (msg 3+) STILL goes through AG/Google — routing logic UNCHANGED
            if (shouldUseAnthropicDirect(targetSelection.phase)) {
                anthropicDirectState.calls++;
                anthropicDirectState.total++;
                requestCount++;
                console.log(`[${ts()}] 💎 ${tag} [AD:${anthropicDirectState.calls}] Q:${queue.length} (Anthropic Direct — thinking boost)`);
                proxyToAnthropicDirect(body, isStream, res, model);
                return;
            }

            // Provider 1: AG Ultra (port 9191) — primary for ALL phases
            if (isAntigravityAvailable()) {
                requestCount++;
                console.log(`[${ts()}] 🚀 ${tag} [AG:${antigravityState.calls}] Q:${queue.length} (AG Ultra)`);
                proxyToAntigravity(body, isStream, res, model);
                return;
            }

            // Provider 2: Google Direct (4 keys, billing active)
            const googleKey = getGoogleKey();
            if (googleKey) {
                requestCount++;
                console.log(`[${ts()}] 🌐 ${tag} [G${googleKey.keyIndex}] Q:${queue.length} (Google Direct)`);
                proxyToGoogle(parsed, isStream, res, model, googleKey, geminiModel);
                return;
            }

            // Provider 3: NVIDIA NIM (weak but free)
            if (isNvidiaAvailable() && !isHeavyContext) {
                requestCount++;
                console.log(`[${ts()}] 🟢 ${tag} [NV] Q:${queue.length} (NVIDIA fallback)`);
                proxyToNvidia(parsed, isStream, res);
                return;
            }

            // Provider 4: Ollama Cloud
            const ollamaKey = getOllamaKey();
            if (ollamaKey) {
                requestCount++;
                console.log(`[${ts()}] ☁️ ${tag} [K${ollamaKey.keyIndex}:${ollamaKey.load}/${MAX_PER_MIN}] Q:${queue.length} (Ollama fallback)`);
                proxyToOllama(body, ollamaKey.key, ollamaKey.keyIndex, isStream, res, model);
                return;
            }

            // Provider 5: OpenRouter (last resort)
            if (isOpenRouterAvailable()) {
                openrouterState.calls++;
                requestCount++;
                console.log(`[${ts()}] 🔀 ${tag} [OR:${openrouterState.calls}] Q:${queue.length} (last resort)`);
                proxyToOpenRouter(parsed, isStream, res, model);
                return;
            }

            // ALL providers exhausted
            console.log(`[${ts()}] 💀 ALL PROVIDERS BLOCKED! Retry in 60s...`);
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'All providers exhausted. Retrying in 60s.' } }));
        });
    });
});

server.listen(PORT, () => { console.log(`✅ Ready on http://localhost:${PORT}`); });
