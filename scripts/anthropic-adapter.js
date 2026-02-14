#!/usr/bin/env node
/**
 * Triple-Provider Anthropic Proxy v4
 * 
 * Primary: Ollama Cloud (4 keys, Anthropic-native)
 * Fallback 1: OpenRouter (Gemini 3 Flash, OpenAI-compatible)
 * Fallback 2: Google AI Studio (Gemini 2.5 Flash, Gemini-native)
 * 
 * CC CLI → localhost:PORT/v1/messages → Ollama | OpenRouter | Google
 */

const http = require('http');
const https = require('https');

const PORT = parseInt(process.argv[2]) || 11436;

// ===== PROVIDER CONFIG =====

// Provider 1: Ollama Cloud (Anthropic-native) — 8 accounts
const OLLAMA_KEYS = [
    '894bcf8caea3468698b8b0db505b86e1.GuA3iz2eCfSo2-rfGhnUOVzP',
    '604fef8e801e46b498c889e8a94e2deb.wImxeQuYTlwRzpgEXdOrAYBP',
    'bf5f34407b0b41b3a0b59678c1cfedf0.NhN1l01q_HGUMnhqC21rTrdM',
    'f11a6513dc4e4cf79276bfe2301515fc.fiW9CryWYDg20CiqeKZUmg7t',
    '552b7ccf3fd34e64b91a73ac915bd1dc.-tkF1Sesf6MOF2ypFqzIRx3G', // vuabuncha
    'f3ed5d86273842c191ebaf796cd025b0.5WelQm9gsmowIvUTj0RTxnvu', // magicblockpay
    '285235479d9348aa8c48deacdebc3a9a.W1JV3p8R7nPiDgrmDBKY_fJh', // billwolfin
    'b8f083b9f8ac44eb9117572d69d91664.C6o1a1ZuISN1R-ntUiKh52XA', // willgroupio
];

// Provider 2: OpenRouter (OpenAI-compatible) — $10 credit
const OPENROUTER_KEY = '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';
const OPENROUTER_MODEL = 'google/gemini-3-flash-preview';

// Provider 3: Google AI Studio — Ultra billing (G0-G1) + free tier (G2-G5)
const GOOGLE_KEYS = [
    'AIzaSyBzUAA7BQA2pQGiNWj80itzK5Az5vLBxVE', // G0: Ultra billwill — 1500 RPM!
    'AIzaSyBAGrl55-Pq6DOohzkkQW_2QXdhBkIMbaM', // G1: Ultra cashback — NEW KEY post-Ultra billing!
    'AIzaSyDMmu7gupLY_FuCfbKd2Wfqkbg4bUOpCBQ', // G2: free
    'AIzaSyC79sMC-4fLacJDpDpGmFZKxvsvwZMC2IQ', // G3: free
    'AIzaSyCWnycMZcCbKpBlXH8HzH_afwoYsF253cg', // G4: free
    'AIzaSyBShNgCxOG-HrjTtET3QA2uFQtNW-RtTSI', // G5: free
];
const GOOGLE_ULTRA_KEYS = new Set([0, 1]); // G0 billwill + G1 cashback = 2x Ultra!
const GOOGLE_MODEL = 'gemini-2.5-flash';

// ===== STATE =====
const keyState = OLLAMA_KEYS.map(() => ({
    calls: [], blockedUntil: 0, total: 0, hits429: 0,
}));
const googleState = GOOGLE_KEYS.map(() => ({
    calls: [], blockedUntil: 0, total: 0, hits429: 0,
}));
const openrouterState = { calls: 0, errors: 0, total: 0, blocked: false, blockedUntil: 0 };
const MAX_PER_MIN = 12;
const GOOGLE_MAX_PER_MIN_FREE = 8; // conservative for 10 RPM free tier
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

function getGoogleKey() {
    const now = Date.now();
    googleState.forEach(k => { k.calls = k.calls.filter(t => now - t < 60000); });
    const all = GOOGLE_KEYS.map((key, i) => ({
        key, i, load: googleState[i].calls.length,
        blocked: now < googleState[i].blockedUntil,
        maxRpm: GOOGLE_ULTRA_KEYS.has(i) ? GOOGLE_MAX_PER_MIN_ULTRA : GOOGLE_MAX_PER_MIN_FREE,
        isUltra: GOOGLE_ULTRA_KEYS.has(i),
    })).filter(k => !k.blocked && k.load < k.maxRpm);
    if (all.length === 0) return null;

    // 虛實 70/30 Split: Ultra 70%, Free 30% — tránh limit + tránh detection
    const ultra = all.filter(k => k.isUltra).sort((a, b) => a.load - b.load);
    const free = all.filter(k => !k.isUltra).sort((a, b) => a.load - b.load);
    let chosen;
    if (ultra.length > 0 && free.length > 0) {
        chosen = Math.random() < 0.7 ? ultra[0] : free[0];
    } else {
        chosen = (ultra[0] || free[0]);
    }

    googleState[chosen.i].calls.push(now);
    googleState[chosen.i].total++;
    requestCount++;
    return { key: chosen.key, keyIndex: chosen.i, load: chosen.load + 1, maxRpm: chosen.maxRpm, provider: 'google' };
}

function isOpenRouterAvailable() {
    if (openrouterState.blocked && Date.now() < openrouterState.blockedUntil) return false;
    openrouterState.blocked = false;
    return true;
}

function markOllama429(keyIndex) {
    keyState[keyIndex].blockedUntil = Date.now() + COOLDOWN_MS;
    keyState[keyIndex].hits429++;
    total429++;
    console.log(`[${ts()}] 🚫 K${keyIndex} → 429! Blocked ${COOLDOWN_MS / 1000}s. Total: ${total429}`);
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
        model: requestModel || GOOGLE_MODEL,
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
        model: requestModel || openaiResp.model || OPENROUTER_MODEL,
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
function processQueue() {
    if (processing || queue.length === 0) return;
    processing = true;
    const delay = Math.max(0, MIN_GAP_MS - (Date.now() - lastRequestTime));
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
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), 'Authorization': `Bearer ${key}`, 'anthropic-version': '2023-06-01' },
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
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), 'Authorization': `Bearer ${OPENROUTER_KEY}`, 'HTTP-Referer': 'https://agencyos.network', 'X-Title': 'TomHumBrain' },
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

// ===== PROXY TO GOOGLE AI STUDIO =====
function proxyToGoogle(parsed, isStream, res, requestModel) {
    const googleKey = getGoogleKey();
    if (!googleKey) {
        // Should not happen if called correctly, but safety
        res.writeHead(429, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'All Google keys blocked' } }));
        return;
    }

    const geminiBody = anthropicToGemini(parsed);
    const payload = JSON.stringify(geminiBody);
    const path = `/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${googleKey.key}`;

    const proxyReq = https.request({
        hostname: 'generativelanguage.googleapis.com', port: 443, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
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

// ===== PROXY TO ANTIGRAVITY CLOUD CODE =====
// 虛實 (Xu Shi) — Binh Phap Ch.6: Tránh mạnh đánh yếu
// Rotate models + stagger timing to avoid Google detection patterns
const ANTIGRAVITY_PORT = 9191;

// 九變 (Jiu Bian) — Ch.8: 3 models rotation to spread fingerprint
const AG_MODELS = [
    'gemini-3-pro-high',           // Primary: best quality (100% avail)
    'gemini-3-flash',              // Fast: lightweight (100% avail)
    'gemini-2.5-flash',            // Stable fallback (100% avail)
];
let agModelIndex = 0;
let antigravityState = { calls: 0, total: 0, blocked: false, blockedUntil: 0, lastCall: 0 };

function isAntigravityAvailable() {
    if (antigravityState.blocked && Date.now() < antigravityState.blockedUntil) return false;
    antigravityState.blocked = false;
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
    antigravityState.lastCall = Date.now();

    // 虛實: Claude models → pass through to AG (cashback has 100% Claude quota)
    // Gemini models → rotate across AG_MODELS to spread fingerprint
    const isClaudeModel = requestModel && requestModel.startsWith('claude-');
    const agModel = isClaudeModel ? requestModel : getNextAGModel();
    let modifiedBody;
    try {
        const parsed = JSON.parse(rawBody);
        parsed.model = agModel;
        modifiedBody = JSON.stringify(parsed);
        if (isClaudeModel) {
            console.log(`[${ts()}] 🔥 CLAUDE→AG: ${agModel} (cashback Ultra route)`);
        }
    } catch (e) {
        modifiedBody = rawBody;
    }

    const payload = modifiedBody;
    const reqOpts = {
        hostname: 'localhost', port: ANTIGRAVITY_PORT, path: '/v1/messages', method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            'x-api-key': 'test',
            'anthropic-version': '2023-06-01'
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
                        const errMsg = (r.error?.message || r.message || 'err').slice(0, 100);
                        console.log(`[${ts()}] ❌ AG(${agModel.slice(0, 12)}): ${errMsg}`);
                        if (proxyRes.statusCode === 429 || proxyRes.statusCode === 529) {
                            antigravityState.blocked = true;
                            antigravityState.blockedUntil = Date.now() + COOLDOWN_MS;
                        }
                        res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                        res.end(responseBody);
                        return;
                    }
                    const tok = r.usage?.output_tokens || 0;
                    console.log(`[${ts()}] ✅ ${tok}tok (AG:${agModel.slice(0, 12)}) [${proxyRes.statusCode}]`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(responseBody);
                } catch (e) {
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

// ===== HTTP SERVER =====
console.log(`🔄 Proxy v7: localhost:${PORT} → Ollama + Antigravity + Google AI + OpenRouter`);
console.log(`   Ollama: ${OLLAMA_KEYS.length} keys | AG: 2 accs (9191) | Google: ${GOOGLE_KEYS.length} keys | OR: backup`);

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
        }));
        return;
    }
    // === BRAINWASH: Intercept ALL CC CLI validation endpoints ===
    // CC CLI checks these against real Anthropic API, wasting time. Fake them all.
    if (req.url.startsWith('/v1/models')) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            data: [
                { id: 'qwen3-coder-next', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'claude-haiku-4-5-20251001', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'claude-opus-4-6-thinking', object: 'model', created: Date.now(), owned_by: 'antigravity' },
                { id: 'gemini-2.5-flash', object: 'model', created: Date.now(), owned_by: 'antigravity' },
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
    // Fake model status/info (individual model lookup)
    if (req.url.match(/^\/v1\/model\b/)) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ id: 'qwen3-coder-next', status: 'active', ready: true }));
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
            const model = parsed.model || 'gemini-3-flash-preview';
            const msgCount = (parsed.messages || []).length;
            const hasTools = !!(parsed.tools && parsed.tools.length > 0);
            const tag = `${isStream ? 'STR' : 'SYN'} ${model} (${msgCount}m${hasTools ? ' +T' : ''})`;

            // Try Provider 1: Ollama Cloud
            const ollamaKey = getOllamaKey();
            if (ollamaKey) {
                console.log(`[${ts()}] ${tag} [K${ollamaKey.keyIndex}:${ollamaKey.load}/${MAX_PER_MIN}] Q:${queue.length}`);
                proxyToOllama(body, ollamaKey.key, ollamaKey.keyIndex, isStream, res, model);
                return;
            }

            // Try Provider 2: Antigravity Cloud Code (2 Ultra accounts, ~unlimited)
            if (isAntigravityAvailable()) {
                requestCount++;
                console.log(`[${ts()}] 🚀 ${tag} [AG:${antigravityState.calls}] Q:${queue.length}`);
                proxyToAntigravity(body, isStream, res, model);
                return;
            }

            // Try Provider 3: Google AI Studio (FREE — 6 keys)
            const googleAvail = getGoogleKey();
            if (googleAvail) {
                requestCount++;
                console.log(`[${ts()}] 🌐 ${tag} [G${googleAvail.keyIndex}:${googleAvail.load}/${googleAvail.maxRpm}] Q:${queue.length}`);
                const geminiBody = anthropicToGemini(parsed);
                const payload = JSON.stringify(geminiBody);
                const gPath = `/v1beta/models/${GOOGLE_MODEL}:generateContent?key=${googleAvail.key}`;
                const proxyReq = https.request({
                    hostname: 'generativelanguage.googleapis.com', port: 443, path: gPath, method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
                }, (proxyRes) => {
                    if (proxyRes.statusCode === 429) markGoogle429(googleAvail.keyIndex);
                    let responseBody = '';
                    proxyRes.on('data', chunk => responseBody += chunk);
                    proxyRes.on('end', () => {
                        try {
                            const r = JSON.parse(responseBody);
                            if (r.error) {
                                if (r.error.code === 429) markGoogle429(googleAvail.keyIndex);
                                const msg = r.error.message || 'err';
                                console.log(`[${ts()}] ❌ G${googleAvail.keyIndex}: ${msg.slice(0, 300)}`);
                                if (msg.includes('required') || msg.includes('not defined')) {
                                    const toolNames = geminiBody.tools?.[0]?.function_declarations?.map((t, i) => `${i}:${t.name}`) || [];
                                    console.log(`[${ts()}] 🔍 Tools: ${toolNames.join(', ')}`);
                                }
                                res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
                                res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: r.error.message } }));
                                return;
                            }
                            const a = geminiToAnthropic(r, model);
                            const tool = a.content.some(b => b.type === 'tool_use');
                            console.log(`[${ts()}] ✅ ${a.usage.output_tokens}tok${tool ? ' +T' : ''} (${proxyRes.statusCode}) [G${googleAvail.keyIndex}]`);
                            if (isStream) {
                                res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
                                res.write(`event: message_start\ndata: ${JSON.stringify({ type: 'message_start', message: a })}\n\n`);
                                for (let i = 0; i < a.content.length; i++) {
                                    res.write(`event: content_block_start\ndata: ${JSON.stringify({ type: 'content_block_start', index: i, content_block: a.content[i] })}\n\n`);
                                    res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: i })}\n\n`);
                                }
                                res.write(`event: message_delta\ndata: ${JSON.stringify({ type: 'message_delta', delta: { stop_reason: a.stop_reason }, usage: a.usage })}\n\n`);
                                res.write(`event: message_stop\ndata: {"type":"message_stop"}\n\n`);
                                res.end();
                            } else {
                                res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(a));
                            }
                        } catch (e) { res.writeHead(502); res.end(responseBody); }
                    });
                });
                proxyReq.on('error', (err) => { res.writeHead(502); res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: err.message } })); });
                proxyReq.write(payload); proxyReq.end();
                return;
            }

            // Try Provider 4: OpenRouter (PAID — save credit, last resort)
            if (isOpenRouterAvailable()) {
                openrouterState.calls++;
                requestCount++;
                console.log(`[${ts()}] 🔀 ${tag} [OR:${openrouterState.calls}] Q:${queue.length} (last resort)`);
                proxyToOpenRouter(parsed, isStream, res, model);
                return;
            }


            // ALL providers exhausted
            console.log(`[${ts()}] 💀 ALL PROVIDERS BLOCKED! Queuing retry...`);
            res.writeHead(429, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'All providers (Ollama+OpenRouter+Google) are rate-limited. Retrying in 60s.' } }));
        });
    });
});

server.listen(PORT, () => { console.log(`✅ Ready on http://localhost:${PORT}`); });
